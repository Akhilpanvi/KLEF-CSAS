export const COURSE_CSV_COLUMNS = [
  "regulation",
  "semester",
  "courseCode",
  "courseName",
  "courseCategory",
  "L",
  "T",
  "P",
  "S",
  "contactHours",
  "credits",
  "courseType",
  "offeredByDepartment",
  "courseCoordinatorName",
  "courseCoordinatorEmployeeId",
  "offeredToDepartments",
] as const;

export type CourseCsvColumn = (typeof COURSE_CSV_COLUMNS)[number];

/** Multiple offered-to department codes are packed into a single CSV cell using this delimiter. */
export const DEPARTMENT_LIST_DELIMITER = "|";
