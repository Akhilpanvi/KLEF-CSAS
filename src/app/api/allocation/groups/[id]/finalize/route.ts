import { NextRequest } from "next/server";
import { AllocationGroup } from "@/models/AllocationGroup";
import { SectionAllocation } from "@/models/SectionAllocation";
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
    if (group.status === "FINALIZED") return fail("Already finalized", 409);

    const detail = await getGroupDetail(id);
    if (!detail) return fail("Allocation group not found", 404);
    if (!detail.validation.isValid) {
      return fail("Allocation is not valid — resolve the failing checks before finalizing", 409, detail.validation);
    }

    // Snapshot the full live matrix (every department x section cell, including
    // zeros implicitly by only writing non-zero cells) so it becomes the frozen record.
    const ops = [];
    for (const row of detail.matrix.rows) {
      for (let s = 1; s <= detail.requiredSections; s++) {
        ops.push({
          updateOne: {
            filter: { allocationGroup: id, department: row.departmentId, sectionNumber: s },
            update: { $set: { studentCount: row.cells[s] ?? 0 } },
            upsert: true,
          },
        });
      }
    }
    if (ops.length > 0) await SectionAllocation.bulkWrite(ops);

    group.status = "FINALIZED";
    group.finalizedAt = new Date();
    group.finalizedBy = session.sub as never;
    await group.save();

    await AuditLog.create({ allocationGroup: id, action: "FINALIZED", performedBy: session.sub });

    return ok(await getGroupDetail(id));
  } catch (err) {
    return handleApiError(err);
  }
}
