import { NextRequest } from "next/server";
import { CourseDemand } from "@/models/CourseDemand";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;

    const demand = await CourseDemand.findById(id);
    if (!demand) return fail("Demand record not found", 404);
    if (demand.status !== "SUBMITTED") return fail("Only submitted demand can be reopened", 409);

    demand.status = "REOPENED";
    demand.reopenedAt = new Date();
    demand.reopenedBy = session.sub as never;
    await demand.save();

    return ok({ demandId: String(demand._id), status: demand.status });
  } catch (err) {
    return handleApiError(err);
  }
}
