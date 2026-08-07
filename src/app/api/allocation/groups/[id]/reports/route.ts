import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";
import { getGroupDetail } from "@/lib/allocation/groupService";
import { buildReportRows, buildReportCsv, type ReportType } from "@/lib/allocation/reports";

const VALID_TYPES: ReportType[] = ["course", "category", "department", "allocation", "section", "cluster"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "TIMETABLE_ADMIN", "SUPER_ADMIN");
    await dbConnect();
    const { id } = await ctx.params;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ReportType | null;
    const format = searchParams.get("format") ?? "json";
    if (!type || !VALID_TYPES.includes(type)) {
      return fail(`type must be one of: ${VALID_TYPES.join(", ")}`, 400);
    }

    const detail = await getGroupDetail(id);
    if (!detail) return fail("Allocation group not found", 404);

    if (format === "csv") {
      const csv = buildReportCsv(detail, type);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${detail.course.courseCode}_${type}_report.csv"`,
        },
      });
    }

    return ok({ rows: buildReportRows(detail, type) });
  } catch (err) {
    return handleApiError(err);
  }
}
