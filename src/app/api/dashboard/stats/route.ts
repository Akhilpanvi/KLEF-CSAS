import { Department, Unit, CourseCategory, Regulation, Semester, Course } from "@/models";
import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await dbConnect();
    const [
      departments,
      activeDepartments,
      units,
      categories,
      regulations,
      semesters,
      courses,
      activeCourses,
      inactiveCourses,
      archivedCourses,
    ] = await Promise.all([
      Department.countDocuments(),
      Department.countDocuments({ isActive: true }),
      Unit.countDocuments(),
      CourseCategory.countDocuments(),
      Regulation.countDocuments(),
      Semester.countDocuments(),
      Course.countDocuments(),
      Course.countDocuments({ status: "Active" }),
      Course.countDocuments({ status: "Inactive" }),
      Course.countDocuments({ status: "Archived" }),
    ]);

    return ok({
      departments,
      activeDepartments,
      units,
      categories,
      regulations,
      semesters,
      courses,
      activeCourses,
      inactiveCourses,
      archivedCourses,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
