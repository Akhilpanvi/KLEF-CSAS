import { NextRequest } from "next/server";
import { z } from "zod";
import { AllocationGroup } from "@/models/AllocationGroup";
import { SpecializationClusterRule } from "@/models/SpecializationClusterRule";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail, bumpStatus, clearManualOverrides, type AllocationStatus } from "@/lib/allocation/groupService";

const schema = z.object({
  rules: z.array(
    z.object({
      unit: z.string().regex(/^[0-9a-fA-F]{24}$/),
      specialization: z.string().trim().min(1, "Required").max(80),
      cluster: z.union([z.literal(1), z.literal(2)]),
    }),
  ),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;
    const { rules } = schema.parse(await req.json());

    const group = await AllocationGroup.findById(id);
    if (!group) return fail("Allocation group not found", 404);
    if (group.status === "FINALIZED") return fail("Reopen this allocation before making changes", 409);

    const current = await getGroupDetail(id);
    if (!current) return fail("Allocation group not found", 404);
    const validUnitIds = new Set(current.demandRows.map((r) => r.unitId));
    for (const r of rules) {
      if (!validUnitIds.has(r.unit)) return fail(`Unit ${r.unit} has no demand in this allocation group`, 422);
    }

    await SpecializationClusterRule.deleteMany({ allocationGroup: id });
    if (rules.length > 0) {
      await SpecializationClusterRule.insertMany(
        rules.map((r) => ({ allocationGroup: id, unit: r.unit, specialization: r.specialization, cluster: r.cluster })),
      );
    }

    group.status = bumpStatus(group.status as AllocationStatus, "CLUSTERS_CONFIGURED");
    await group.save();
    await clearManualOverrides(id);

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
