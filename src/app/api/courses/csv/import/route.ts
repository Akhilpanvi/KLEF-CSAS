import { NextRequest } from "next/server";
import { Course } from "@/models/Course";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail } from "@/lib/api-response";
import { COURSE_CSV_COLUMNS } from "@/lib/csv/constants";
import { parseCourseCsvText } from "@/lib/csv/parse";
import { validateCourseRows, type RowResult } from "@/lib/csv/validateCourseRows";
import { buildMasterLookups } from "@/lib/csv/buildLookups";

interface MongoBulkWriteError {
  writeErrors?: { index: number }[];
}

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

    await dbConnect();
    // Re-validate at import time (not just trusting the earlier preview) in case
    // master data or existing course codes changed since the preview was shown.
    const lookups = await buildMasterLookups();
    const summary = validateCourseRows(rows, lookups);

    const validResults = summary.results.filter((r) => r.isValid && r.resolved);
    const documents = validResults.map((r) => ({
      regulation: r.resolved!.regulation,
      semester: r.resolved!.semester,
      courseCode: r.resolved!.courseCode,
      courseName: r.resolved!.courseName,
      courseCategory: r.resolved!.courseCategory,
      L: r.resolved!.L,
      T: r.resolved!.T,
      P: r.resolved!.P,
      S: r.resolved!.S,
      contactHours: r.resolved!.contactHours,
      credits: r.resolved!.credits,
      courseType: r.resolved!.courseType,
      offeredByDepartment: r.resolved!.offeredByDepartment,
      offeredToDepartments: r.resolved!.offeredToDepartments,
      courseCoordinatorName: r.resolved!.courseCoordinatorName,
      courseCoordinatorEmployeeId: r.resolved!.courseCoordinatorEmployeeId,
      status: "Active" as const,
    }));

    let insertedCount = 0;
    const insertFailures: { row: number; error: string }[] = [];

    if (documents.length > 0) {
      try {
        const inserted = await Course.insertMany(documents, { ordered: false });
        insertedCount = inserted.length;
      } catch (bulkErr) {
        const err = bulkErr as MongoBulkWriteError & { insertedDocs?: unknown[] };
        insertedCount = documents.length - (err.writeErrors?.length ?? documents.length);
        for (const we of err.writeErrors ?? []) {
          const row = validResults[we.index]?.row;
          if (row !== undefined) insertFailures.push({ row, error: "Failed to insert (possible duplicate)" });
        }
      }
    }

    const failedRows: RowResult[] = summary.results.filter((r) => !r.isValid);

    return ok({
      totalRows: summary.totalRows,
      attempted: documents.length,
      imported: insertedCount,
      skipped: summary.errorRows + insertFailures.length,
      failedRows,
      insertFailures,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to import CSV", 500);
  }
}
