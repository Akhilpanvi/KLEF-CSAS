import Papa from "papaparse";
import { COURSE_CSV_COLUMNS, DEPARTMENT_LIST_DELIMITER } from "./constants";

export interface SampleCsvContext {
  regulationCode?: string;
  semesterNumber?: number;
  categoryCode?: string;
  courseTypeName?: string;
  departmentCode?: string;
  offeredToCodes?: string[];
}

/**
 * Builds the downloadable sample CSV. Falls back to the reference example from the
 * spec when live master data isn't available yet (e.g. before the DB is seeded).
 */
export function buildSampleCourseCsv(ctx: SampleCsvContext = {}): string {
  const regulation = ctx.regulationCode ?? "R-2024";
  const semester = ctx.semesterNumber ?? 5;
  const category = ctx.categoryCode ?? "PEC-4";
  const dept = ctx.departmentCode ?? "CSE";
  const offeredTo =
    ctx.offeredToCodes && ctx.offeredToCodes.length > 0
      ? ctx.offeredToCodes.join(DEPARTMENT_LIST_DELIMITER)
      : ["CSE", "CSIT", "AIDS"].join(DEPARTMENT_LIST_DELIMITER);

  const rows: Record<(typeof COURSE_CSV_COLUMNS)[number], string>[] = [
    {
      regulation,
      semester: String(semester),
      courseCode: "23CS5101",
      courseName: "Cloud Computing",
      courseCategory: category,
      L: "3",
      T: "0",
      P: "0",
      S: "0",
      contactHours: "3",
      credits: "3",
      courseType: ctx.courseTypeName ?? "Theory",
      offeredByDepartment: dept,
      courseCoordinatorName: "Dr Example",
      courseCoordinatorEmployeeId: "EMP001",
      offeredToDepartments: offeredTo,
    },
    {
      regulation,
      semester: String(semester),
      courseCode: "23CS5102",
      courseName: "Machine Learning",
      courseCategory: category,
      L: "3",
      T: "0",
      P: "2",
      S: "0",
      contactHours: "5",
      credits: "4",
      courseType: "Theory cum Lab",
      offeredByDepartment: dept,
      courseCoordinatorName: "Dr Sample Rao",
      courseCoordinatorEmployeeId: "EMP002",
      offeredToDepartments: dept,
    },
  ];

  return Papa.unparse({
    fields: [...COURSE_CSV_COLUMNS],
    data: rows.map((row) => COURSE_CSV_COLUMNS.map((col) => row[col])),
  });
}
