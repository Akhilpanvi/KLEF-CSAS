import { Course } from "@/models/Course";
import { CourseDemand } from "@/models/CourseDemand";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/CourseCategory";
import "@/models/Regulation";
import "@/models/Semester";
import type { DemandRowStatus } from "@/types";

export interface AvailableCourseFilters {
  category?: string;
  regulation?: string;
  semester?: string;
}

export interface MergedCourse {
  _id: string;
  courseCode: string;
  courseName: string;
  courseCategory: unknown;
  regulation: unknown;
  semester: unknown;
  demandId: string | null;
  status: DemandRowStatus;
  totalStudents: number;
}

/**
 * Courses visible to `departmentId` for Module 2 demand entry: courses the
 * department itself offers, plus courses other departments offered to it.
 * Merged with that department's own demand status.
 */
export async function listAvailableCourses(
  departmentId: string,
  filters: AvailableCourseFilters,
): Promise<MergedCourse[]> {
  const courseFilter: Record<string, unknown> = {
    status: "Active",
    $or: [{ offeredByDepartment: departmentId }, { offeredToDepartments: departmentId }],
  };
  if (filters.category) courseFilter.courseCategory = filters.category;
  if (filters.regulation) courseFilter.regulation = filters.regulation;
  if (filters.semester) courseFilter.semester = filters.semester;

  const courses = await Course.find(courseFilter)
    .populate("courseCategory", "code name isActive")
    .populate("regulation", "code name isActive")
    .populate("semester", "number name isActive")
    .sort({ courseCode: 1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const demands = await CourseDemand.find({ department: departmentId, course: { $in: courseIds } }).lean();
  const demandByCourse = new Map(demands.map((d) => [String(d.course), d]));

  return courses.map((c) => {
    const demand = demandByCourse.get(String(c._id));
    return {
      _id: String(c._id),
      courseCode: c.courseCode,
      courseName: c.courseName,
      courseCategory: c.courseCategory,
      regulation: c.regulation,
      semester: c.semester,
      demandId: demand ? String(demand._id) : null,
      status: (demand?.status ?? "PENDING") as DemandRowStatus,
      totalStudents: demand?.totalStudents ?? 0,
    };
  });
}
