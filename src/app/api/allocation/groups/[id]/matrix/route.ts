import { NextRequest } from "next/server";
import { z } from "zod";
import { AllocationGroup } from "@/models/AllocationGroup";
import { SectionAllocation } from "@/models/SectionAllocation";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail, bumpStatus, type AllocationStatus } from "@/lib/allocation/groupService";

const schema = z.object({
  department: z.string().regex(/^[0-9a-fA-F]{24}$/),
  sectionNumber: z.coerce.number().int().min(1),
  studentCount: z.coerce.number().int().min(0, "Must be 0 or more"),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;
    const { department, sectionNumber, studentCount } = schema.parse(await req.json());

    const group = await AllocationGroup.findById(id);
    if (!group) return fail("Allocation group not found", 404);
    if (group.status === "FINALIZED") return fail("Reopen this allocation before making changes", 409);

    const current = await getGroupDetail(id);
    if (!current) return fail("Allocation group not found", 404);
    if (!current.demandRows.some((r) => r.departmentId === department)) {
      return fail("Department has no demand in this allocation group", 422);
    }
    if (sectionNumber > current.requiredSections) {
      return fail(`Section S${sectionNumber} does not exist (only ${current.requiredSections} required)`, 422);
    }

    await SectionAllocation.findOneAndUpdate(
      { allocationGroup: id, department, sectionNumber },
      { studentCount },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    group.status = bumpStatus(group.status as AllocationStatus, "ALLOCATED");
    await group.save();

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
