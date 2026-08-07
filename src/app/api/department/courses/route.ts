import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { listAvailableCourses } from "@/lib/demand/departmentCourses";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const regulation = searchParams.get("regulation") || undefined;
    const semester = searchParams.get("semester") || undefined;
    const status = searchParams.get("status") || undefined;

    let items = await listAvailableCourses(session.department as string, { category, regulation, semester });
    if (status) items = items.filter((i) => i.status === status);

    return ok({ items });
  } catch (err) {
    return handleApiError(err);
  }
}
