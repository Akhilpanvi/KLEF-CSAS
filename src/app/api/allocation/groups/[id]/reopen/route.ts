import { NextRequest } from "next/server";
import { AllocationGroup } from "@/models/AllocationGroup";
import { AuditLog } from "@/models/AuditLog";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail } from "@/lib/allocation/groupService";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;

    const group = await AllocationGroup.findById(id);
    if (!group) return fail("Allocation group not found", 404);
    if (group.status !== "FINALIZED") return fail("Only a finalized allocation can be reopened", 409);

    group.status = "ALLOCATED";
    group.reopenedAt = new Date();
    group.reopenedBy = session.sub as never;
    await group.save();

    await AuditLog.create({ allocationGroup: id, action: "REOPENED", performedBy: session.sub });

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
