import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { buildConsolidatedView } from "@/lib/demand/consolidate";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const result = await buildConsolidatedView({
      category: searchParams.get("category") || undefined,
      regulation: searchParams.get("regulation") || undefined,
      semester: searchParams.get("semester") || undefined,
      includeAll: searchParams.get("includeAll") === "true",
    });

    return ok(result);
  } catch (err) {
    return handleApiError(err);
  }
}
