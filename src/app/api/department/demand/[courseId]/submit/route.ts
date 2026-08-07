import { NextRequest } from "next/server";
import { Course } from "@/models/Course";
import { Unit } from "@/models/Unit";
import { CourseDemand } from "@/models/CourseDemand";
import { CourseDemandItem } from "@/models/CourseDemandItem";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();
    const { courseId } = await ctx.params;

    const course = await Course.findOne({ _id: courseId, status: "Active", offeredToDepartments: session.department });
    if (!course) return fail("Course not found or not offered to your department", 404);

    const demand = await CourseDemand.findOne({
      course: courseId,
      department: session.department,
      regulation: course.regulation,
      semester: course.semester,
    });
    if (!demand) return fail("Save a draft before submitting", 404);
    if (demand.status === "SUBMITTED") return fail("Demand is already submitted", 409);

    const items = await CourseDemandItem.find({ demand: demand._id });
    if (items.length === 0) return fail("Enter student counts before submitting", 422);

    const validUnits = await Unit.find({ parentDepartment: session.department, isActive: true }, { _id: 1 }).lean();
    const validUnitIds = new Set(validUnits.map((u) => String(u._id)));
    for (const item of items) {
      if (!validUnitIds.has(String(item.unit))) {
        return fail("One or more units are no longer valid for your department", 422);
      }
      if (!Number.isInteger(item.studentCount) || item.studentCount < 0) {
        return fail("Invalid student count", 422);
      }
    }

    demand.status = "SUBMITTED";
    demand.submittedAt = new Date();
    demand.submittedBy = session.sub as never;
    await demand.save();

    return ok({ demandId: String(demand._id), status: demand.status });
  } catch (err) {
    return handleApiError(err);
  }
}
