import Papa from "papaparse";
import { COURSE_CSV_COLUMNS } from "./constants";
import type { RowResult } from "./validateCourseRows";

/**
 * Builds a downloadable CSV of only the failed rows, with an appended `errors`
 * column. Retains the original columns so the file can be corrected in place
 * and re-uploaded directly.
 */
export function buildErrorReportCsv(results: RowResult[]): string {
  const failed = results.filter((r) => !r.isValid);
  const fields = ["row", ...COURSE_CSV_COLUMNS, "errors"];
  const data = failed.map((r) => [
    String(r.row),
    ...COURSE_CSV_COLUMNS.map((c) => r.data[c] ?? ""),
    r.errors.map((e) => `${e.field}: ${e.error}`).join(" | "),
  ]);
  return Papa.unparse({ fields, data });
}
