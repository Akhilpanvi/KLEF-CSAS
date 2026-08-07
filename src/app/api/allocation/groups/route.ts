import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { listGroups } from "@/lib/allocation/groupService";

export async function GET() {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();

    const items = await listGroups();
    return ok({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
