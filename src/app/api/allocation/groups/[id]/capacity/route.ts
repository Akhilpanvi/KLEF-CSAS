import { NextRequest } from "next/server";
import { z } from "zod";
import { AllocationGroup } from "@/models/AllocationGroup";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail, bumpStatus, clearManualOverrides, type AllocationStatus } from "@/lib/allocation/groupService";

const schema = z.object({ sectionCapacity: z.coerce.number().int().min(1, "Must be at least 1") });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;
    const { sectionCapacity } = schema.parse(await req.json());

    const group = await AllocationGroup.findById(id);
    if (!group) return fail("Allocation group not found", 404);
    if (group.status === "FINALIZED") return fail("Reopen this allocation before making changes", 409);

    group.sectionCapacity = sectionCapacity;
    group.status = bumpStatus(group.status as AllocationStatus, "SECTIONS_CALCULATED");
    await group.save();
    await clearManualOverrides(id);

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
