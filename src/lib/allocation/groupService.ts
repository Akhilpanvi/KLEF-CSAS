import { AllocationGroup, ALLOCATION_STATUS, type AllocationStatus } from "@/models/AllocationGroup";
export type { AllocationStatus } from "@/models/AllocationGroup";
import { SpecializationClusterRule } from "@/models/SpecializationClusterRule";
import { SectionAllocation } from "@/models/SectionAllocation";
import { CourseDemand } from "@/models/CourseDemand";
import { Course } from "@/models/Course";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/CourseCategory";
import "@/models/Regulation";
import "@/models/Semester";
import { getCourseSubmittedDemand } from "./demand";
import { computeLiveMatrix, type SpecRule, type OverrideCell } from "./matrix";
import { validateMatrix, type ValidationResult } from "./validate";
import { requiredSections as calcRequiredSections, ratio, clusterPercentages, type ClusterRanges } from "./calc";

export async function getOrCreateGroup(courseId: string) {
  // Atomic upsert — findOne-then-create would race under concurrent requests
  // for the same course and violate the unique index on `course`.
  return AllocationGroup.findOneAndUpdate(
    { course: courseId },
    { $setOnInsert: { course: courseId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

export function bumpStatus(current: AllocationStatus, atLeast: AllocationStatus): AllocationStatus {
  const currentIdx = ALLOCATION_STATUS.indexOf(current);
  const atLeastIdx = ALLOCATION_STATUS.indexOf(atLeast);
  return currentIdx >= atLeastIdx ? current : atLeast;
}

export interface GroupDetail {
  groupId: string;
  status: AllocationStatus;
  course: {
    _id: string;
    courseCode: string;
    courseName: string;
    courseCategory: { _id: string; code: string; name: string };
    regulation: { _id: string; code: string };
    semester: { _id: string; number: number; name: string };
  };
  sectionCapacity: number;
  grandTotal: number;
  requiredSections: number;
  departmentTotals: { departmentId: string; departmentCode: string; total: number; pct: number }[];
  demandRows: { departmentId: string; departmentCode: string; unitId: string; unitCode: string; unitName: string; studentCount: number; pctOfDept: number }[];
  clusters: {
    cluster1Sections: number;
    cluster2Sections: number;
    cluster1Pct: number;
    cluster2Pct: number;
    ranges: ClusterRanges;
  };
  specializationRules: { unitId: string; specialization: string; cluster: 1 | 2 }[];
  matrix: ReturnType<typeof computeLiveMatrix>;
  validation: ValidationResult;
  finalizedAt: string | null;
  finalizedBy: string | null;
  reopenedAt: string | null;
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const group = await AllocationGroup.findById(groupId);
  if (!group) return null;

  const course = await Course.findById(group.course)
    .populate("courseCategory", "code name")
    .populate("regulation", "code")
    .populate("semester", "number name");
  if (!course) return null;

  const demand = await getCourseSubmittedDemand(String(group.course));
  const required = calcRequiredSections(demand.grandTotal, group.sectionCapacity);

  const rules = await SpecializationClusterRule.find({ allocationGroup: group._id }).lean();
  const specRules: SpecRule[] = rules.map((r) => ({
    unitId: String(r.unit),
    specialization: r.specialization,
    cluster: r.cluster as 1 | 2,
  }));

  const overrideDocs = await SectionAllocation.find({ allocationGroup: group._id }).lean();
  const overrides: OverrideCell[] = overrideDocs.map((o) => ({
    unitId: String(o.unit),
    sectionNumber: o.sectionNumber,
    studentCount: o.studentCount,
  }));

  const matrix = computeLiveMatrix(demand.rows, specRules, group.cluster1Sections, required, group.sectionCapacity, overrides);

  const category = course.courseCategory as unknown as { _id: unknown; code: string; name: string };
  const validation = validateMatrix(matrix, {
    courseId: String(course._id),
    courseCategoryId: String(category._id),
    requiredSections: required,
  });

  const ranges = matrix.ranges;
  const { cluster1Pct, cluster2Pct } = clusterPercentages(ranges.cluster1.count, required);

  const departmentTotals = demand.departmentTotals.map((d) => ({
    ...d,
    pct: ratio(d.total, demand.grandTotal),
  }));
  const deptTotalMap = new Map(demand.departmentTotals.map((d) => [d.departmentId, d.total]));
  const demandRows = demand.rows.map((r) => ({
    ...r,
    pctOfDept: ratio(r.studentCount, deptTotalMap.get(r.departmentId) ?? 0),
  }));

  const regulation = course.regulation as unknown as { _id: unknown; code: string };
  const semester = course.semester as unknown as { _id: unknown; number: number; name: string };

  return {
    groupId: String(group._id),
    status: group.status as AllocationStatus,
    course: {
      _id: String(course._id),
      courseCode: course.courseCode,
      courseName: course.courseName,
      courseCategory: { _id: String(category._id), code: category.code, name: category.name },
      regulation: { _id: String(regulation._id), code: regulation.code },
      semester: { _id: String(semester._id), number: semester.number, name: semester.name },
    },
    sectionCapacity: group.sectionCapacity,
    grandTotal: demand.grandTotal,
    requiredSections: required,
    departmentTotals,
    demandRows,
    clusters: {
      cluster1Sections: ranges.cluster1.count,
      cluster2Sections: ranges.cluster2.count,
      cluster1Pct,
      cluster2Pct,
      ranges,
    },
    specializationRules: specRules,
    matrix,
    validation,
    finalizedAt: group.finalizedAt ? group.finalizedAt.toISOString() : null,
    finalizedBy: group.finalizedBy ? String(group.finalizedBy) : null,
    reopenedAt: group.reopenedAt ? group.reopenedAt.toISOString() : null,
  };
}

export interface GroupListRow {
  groupId: string;
  courseCategory: { code: string; name: string };
  courseCode: string;
  courseName: string;
  regulationCode: string;
  semesterName: string;
  participatingDepartments: string[];
  totalStudents: number;
  sectionCapacity: number;
  requiredSections: number;
  cluster1Sections: number;
  cluster2Sections: number;
  status: AllocationStatus;
}

/** One row per Course that has at least one SUBMITTED Module 2 demand. */
export async function listGroups(): Promise<GroupListRow[]> {
  const courseIds = await CourseDemand.distinct("course", { status: "SUBMITTED" });
  const rows: GroupListRow[] = [];

  for (const courseId of courseIds) {
    const group = await getOrCreateGroup(String(courseId));
    const detail = await getGroupDetail(String(group._id));
    if (!detail) continue;
    rows.push({
      groupId: detail.groupId,
      courseCategory: detail.course.courseCategory,
      courseCode: detail.course.courseCode,
      courseName: detail.course.courseName,
      regulationCode: detail.course.regulation.code,
      semesterName: detail.course.semester.name,
      participatingDepartments: detail.departmentTotals.map((d) => d.departmentCode),
      totalStudents: detail.grandTotal,
      sectionCapacity: detail.sectionCapacity,
      requiredSections: detail.requiredSections,
      cluster1Sections: detail.clusters.cluster1Sections,
      cluster2Sections: detail.clusters.cluster2Sections,
      status: detail.status,
    });
  }

  return rows.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

/**
 * Manual matrix overrides are computed relative to the current section
 * capacity / cluster split / specialization mapping. Changing any of those
 * shifts section ranges, so partial overrides can silently strand or drop
 * students (an override cell can look "in range" under the new config while
 * the rest of that unit's old overrides are dropped, under-allocating it).
 * Clearing all overrides on structural change keeps the matrix correct;
 * fine-grained manual edits are meant to happen after configuration settles.
 */
export async function clearManualOverrides(groupId: string) {
  await SectionAllocation.deleteMany({ allocationGroup: groupId });
}
