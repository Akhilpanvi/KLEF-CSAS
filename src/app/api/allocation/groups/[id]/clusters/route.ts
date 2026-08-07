import { NextRequest } from "next/server";
import { z } from "zod";
import { AllocationGroup } from "@/models/AllocationGroup";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail, bumpStatus, clearManualOverrides, type AllocationStatus } from "@/lib/allocation/groupService";

const schema = z.object({ cluster1Sections: z.coerce.number().int().min(0).nullable() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;
    const { cluster1Sections } = schema.parse(await req.json());

    const group = await AllocationGroup.findById(id);
    if (!group) return fail("Allocation group not found", 404);
    if (group.status === "FINALIZED") return fail("Reopen this allocation before making changes", 409);

    const current = await getGroupDetail(id);
    if (!current) return fail("Allocation group not found", 404);

    const clamped = cluster1Sections === null ? null : Math.min(Math.max(cluster1Sections, 0), current.requiredSections);
    group.cluster1Sections = clamped;
    group.status = bumpStatus(group.status as AllocationStatus, "CLUSTERS_CONFIGURED");
    await group.save();
    await clearManualOverrides(id);

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
