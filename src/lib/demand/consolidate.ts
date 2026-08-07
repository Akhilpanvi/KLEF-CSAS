import { CourseDemand } from "@/models/CourseDemand";
import { CourseDemandItem } from "@/models/CourseDemandItem";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/Course";
import "@/models/Department";
import "@/models/Regulation";
import "@/models/Semester";
import "@/models/CourseCategory";
import "@/models/Unit";

export interface ConsolidateFilters {
  category?: string;
  regulation?: string;
  semester?: string;
  includeAll?: boolean;
}

interface DeptGroup {
  demandId: string;
  status: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  units: { unitId: string; code: string; name: string; count: number }[];
  departmentTotal: number;
}

interface CourseGroup {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseCategory: { code: string; name: string };
  regulation: { code: string };
  semester: { number: number; name: string };
  departments: DeptGroup[];
  courseTotal: number;
}

/**
 * Groups submitted demand by Course, then by Department — the shape Module 3
 * will later consume: same category+courseCode across departments combines,
 * different courseCode stays separate even within the same category.
 */
export async function buildConsolidatedView(filters: ConsolidateFilters) {
  const demandFilter: Record<string, unknown> = { status: filters.includeAll ? { $in: ["SUBMITTED", "REOPENED"] } : "SUBMITTED" };
  if (filters.category) demandFilter.courseCategory = filters.category;
  if (filters.regulation) demandFilter.regulation = filters.regulation;
  if (filters.semester) demandFilter.semester = filters.semester;

  const demands = await CourseDemand.find(demandFilter)
    .populate("course", "courseCode courseName")
    .populate("department", "code name")
    .populate("regulation", "code")
    .populate("semester", "number name")
    .populate("courseCategory", "code name")
    .lean();

  const demandIds = demands.map((d) => d._id);
  const items = await CourseDemandItem.find({ demand: { $in: demandIds } })
    .populate("unit", "code name")
    .lean();
  const itemsByDemand = new Map<string, typeof items>();
  for (const item of items) {
    const key = String(item.demand);
    if (!itemsByDemand.has(key)) itemsByDemand.set(key, []);
    itemsByDemand.get(key)!.push(item);
  }

  const courseMap = new Map<string, CourseGroup>();
  for (const d of demands) {
    const course = d.course as unknown as { _id: unknown; courseCode: string; courseName: string };
    const department = d.department as unknown as { _id: unknown; code: string; name: string };
    const regulation = d.regulation as unknown as { code: string };
    const semester = d.semester as unknown as { number: number; name: string };
    const category = d.courseCategory as unknown as { code: string; name: string };
    const courseId = String(course._id);

    if (!courseMap.has(courseId)) {
      courseMap.set(courseId, {
        courseId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        courseCategory: { code: category.code, name: category.name },
        regulation: { code: regulation.code },
        semester: { number: semester.number, name: semester.name },
        departments: [],
        courseTotal: 0,
      });
    }
    const group = courseMap.get(courseId)!;

    const demandItems = itemsByDemand.get(String(d._id)) ?? [];
    const units = demandItems.map((i) => {
      const unit = i.unit as unknown as { _id: unknown; code: string; name: string };
      return { unitId: String(unit._id), code: unit.code, name: unit.name, count: i.studentCount };
    });
    const departmentTotal = units.reduce((sum, u) => sum + u.count, 0);

    group.departments.push({
      demandId: String(d._id),
      status: d.status,
      departmentId: String(department._id),
      departmentCode: department.code,
      departmentName: department.name,
      units,
      departmentTotal,
    });
    group.courseTotal += departmentTotal;
  }

  const courses = Array.from(courseMap.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  const grandTotal = courses.reduce((sum, c) => sum + c.courseTotal, 0);

  return { courses, grandTotal };
}
