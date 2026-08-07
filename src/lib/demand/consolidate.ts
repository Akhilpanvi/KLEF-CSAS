import { CourseDemand } from "@/models/CourseDemand";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/Course";
import "@/models/Department";
import "@/models/Regulation";
import "@/models/Semester";
import "@/models/CourseCategory";

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
 * will later consume: same course code across departments combines, different
 * course codes stay separate even within the same category. Each department
 * (CSE-1, CSE-2, HTE, ... — all independent, no hierarchy) contributes exactly
 * one total per course.
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

    group.departments.push({
      demandId: String(d._id),
      status: d.status,
      departmentId: String(department._id),
      departmentCode: department.code,
      departmentName: department.name,
      departmentTotal: d.totalStudents,
    });
    group.courseTotal += d.totalStudents;
  }

  const courses = Array.from(courseMap.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  const grandTotal = courses.reduce((sum, c) => sum + c.courseTotal, 0);

  return { courses, grandTotal };
}
