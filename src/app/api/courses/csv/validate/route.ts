import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail } from "@/lib/api-response";
import { COURSE_CSV_COLUMNS } from "@/lib/csv/constants";
import { parseCourseCsvText } from "@/lib/csv/parse";
import { validateCourseRows } from "@/lib/csv/validateCourseRows";
import { buildMasterLookups } from "@/lib/csv/buildLookups";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return fail("No CSV file was uploaded", 400);
    }

    const text = await file.text();
    if (!text.trim()) return fail("The uploaded CSV file is empty", 400);

    const { rows, headerErrors } = parseCourseCsvText(text, COURSE_CSV_COLUMNS);
    if (headerErrors.length > 0) {
      return fail("The CSV file could not be read", 400, { headerErrors });
    }
    if (rows.length === 0) {
      return fail("The CSV file has no data rows", 400);
    }

    await dbConnect();
    const lookups = await buildMasterLookups();
    const summary = validateCourseRows(rows, lookups);

    return ok(summary);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to validate CSV", 500);
  }
}
