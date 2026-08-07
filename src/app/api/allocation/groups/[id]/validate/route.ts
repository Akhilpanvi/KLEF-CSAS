import { NextRequest } from "next/server";
import { AllocationGroup } from "@/models/AllocationGroup";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail, bumpStatus, type AllocationStatus } from "@/lib/allocation/groupService";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;

    const detail = await getGroupDetail(id);
    if (!detail) return fail("Allocation group not found", 404);

    if (detail.status !== "FINALIZED") {
      const group = await AllocationGroup.findById(id);
      if (group) {
        const nextStatus: AllocationStatus = detail.validation.isValid
          ? bumpStatus(group.status as AllocationStatus, "VALIDATED")
          : group.status === "VALIDATED"
            ? "ALLOCATED"
            : (group.status as AllocationStatus);
        if (nextStatus !== group.status) {
          group.status = nextStatus;
          await group.save();
          detail.status = nextStatus;
        }
      }
    }

    return ok(detail.validation);
  } catch (err) {
    return handleApiError(err);
  }
}
