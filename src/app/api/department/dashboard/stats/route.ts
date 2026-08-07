import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { listAvailableCourses } from "@/lib/demand/departmentCourses";

export async function GET() {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();

    const items = await listAvailableCourses(session.department as string, {});
    const totalAvailable = items.length;
    const draft = items.filter((i) => i.status === "DRAFT" || i.status === "REOPENED").length;
    const submitted = items.filter((i) => i.status === "SUBMITTED").length;
    const pending = items.filter((i) => i.status === "PENDING").length;

    return ok({ totalAvailable, draft, submitted, pending });
  } catch (err) {
    return handleApiError(err);
  }
}
