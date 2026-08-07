import Papa from "papaparse";

export interface ParsedCsv {
  rows: Record<string, string>[];
  headerErrors: string[];
}

export function parseCourseCsvText(text: string, expectedColumns: readonly string[]): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headerErrors: string[] = [];
  const foundColumns = result.meta.fields ?? [];
  const missing = expectedColumns.filter((c) => !foundColumns.includes(c));
  if (missing.length > 0) {
    headerErrors.push(`Missing required column(s): ${missing.join(", ")}`);
  }

  if (result.errors && result.errors.length > 0) {
    for (const err of result.errors) {
      if (err.code === "TooFewFields" || err.code === "TooManyFields") continue;
      headerErrors.push(`${err.message}${err.row !== undefined ? ` (row ${err.row + 1})` : ""}`);
    }
  }

  return { rows: result.data, headerErrors };
}
