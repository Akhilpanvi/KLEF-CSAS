import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail } from "@/lib/allocation/groupService";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;

    const detail = await getGroupDetail(id);
    if (!detail) return fail("Allocation group not found", 404);

    return ok(detail);
  } catch (err) {
    return handleApiError(err);
  }
}
