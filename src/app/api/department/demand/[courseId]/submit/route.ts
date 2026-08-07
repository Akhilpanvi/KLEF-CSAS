import { NextRequest } from "next/server";
import { Course } from "@/models/Course";
import { CourseDemand } from "@/models/CourseDemand";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();
    const { courseId } = await ctx.params;

    const course = await Course.findOne({
      _id: courseId,
      status: "Active",
      $or: [{ offeredByDepartment: session.department }, { offeredToDepartments: session.department }],
    });
    if (!course) return fail("Course not found or not visible to your department", 404);

    const demand = await CourseDemand.findOne({
      course: courseId,
      department: session.department,
      regulation: course.regulation,
      semester: course.semester,
    });
    if (!demand) return fail("Save a draft before submitting", 404);
    if (demand.status === "SUBMITTED") return fail("Demand is already submitted", 409);
    if (demand.totalStudents <= 0) return fail("Enter a student count before submitting", 422);

    demand.status = "SUBMITTED";
    demand.submittedAt = new Date();
    demand.submittedBy = session.sub as never;
    await demand.save();

    return ok({ demandId: String(demand._id), status: demand.status });
  } catch (err) {
    return handleApiError(err);
  }
}
