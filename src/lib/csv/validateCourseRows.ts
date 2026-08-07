import { COURSE_CSV_COLUMNS, DEPARTMENT_LIST_DELIMITER } from "./constants";

export interface LookupEntry {
  id: string;
  isActive: boolean;
}

export interface MasterLookups {
  regulations: Map<string, LookupEntry>; // key: code (uppercased)
  semesters: Map<number, LookupEntry>; // key: semester number
  categories: Map<string, LookupEntry>; // key: code (uppercased)
  courseTypes: Map<string, LookupEntry>; // key: name (uppercased)
  departments: Map<string, LookupEntry>; // key: code (uppercased)
  existingCourseCodes: Set<string>; // uppercased course codes already in DB
}

export interface RowError {
  field: string;
  error: string;
  value: string;
}

export interface ResolvedCourseRow {
  regulation: string;
  semester: string;
  courseCode: string;
  courseName: string;
  courseCategory: string;
  L: number;
  T: number;
  P: number;
  S: number;
  contactHours: number;
  credits: number;
  courseType: string;
  offeredByDepartment: string;
  offeredToDepartments: string[];
  courseCoordinatorName: string;
  courseCoordinatorEmployeeId: string;
}

export interface RowResult {
  row: number; // 1-based data row number (header excluded)
  data: Record<string, string>;
  errors: RowError[];
  isValid: boolean;
  resolved?: ResolvedCourseRow;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  results: RowResult[];
}

function normalize(value: unknown): string {
  return (value ?? "").toString().trim();
}

function requireField(raw: string, field: string, errors: RowError[]): boolean {
  if (raw === "") {
    errors.push({ field, error: `${field} is required`, value: raw });
    return false;
  }
  return true;
}

function parseNonNegativeNumber(raw: string): number | null {
  if (raw === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function validateCourseRows(
  rawRows: Record<string, string>[],
  lookups: MasterLookups,
): ValidationSummary {
  // First pass: count occurrences of each course code within the file itself.
  const codeOccurrences = new Map<string, number>();
  for (const raw of rawRows) {
    const code = normalize(raw.courseCode).toUpperCase();
    if (!code) continue;
    codeOccurrences.set(code, (codeOccurrences.get(code) ?? 0) + 1);
  }

  const results: RowResult[] = rawRows.map((raw, idx) => {
    const rowNumber = idx + 1;
    const errors: RowError[] = [];

    const data: Record<string, string> = {};
    for (const col of COURSE_CSV_COLUMNS) data[col] = normalize(raw[col]);

    // Required text fields
    const requiredTextFields: (keyof typeof data)[] = [
      "regulation",
      "semester",
      "courseCode",
      "courseName",
      "courseCategory",
      "courseType",
      "offeredByDepartment",
      "courseCoordinatorName",
      "courseCoordinatorEmployeeId",
      "offeredToDepartments",
    ];
    for (const field of requiredTextFields) {
      requireField(data[field], field, errors);
    }

    // Regulation
    let regulationId: string | undefined;
    if (data.regulation) {
      const entry = lookups.regulations.get(data.regulation.toUpperCase());
      if (!entry) {
        errors.push({ field: "regulation", error: "Unknown regulation code", value: data.regulation });
      } else if (!entry.isActive) {
        errors.push({ field: "regulation", error: "Regulation is inactive", value: data.regulation });
      } else {
        regulationId = entry.id;
      }
    }

    // Semester (numeric)
    let semesterId: string | undefined;
    if (data.semester) {
      const semNum = Number(data.semester);
      if (!Number.isInteger(semNum) || semNum <= 0) {
        errors.push({ field: "semester", error: "Semester must be a positive whole number", value: data.semester });
      } else {
        const entry = lookups.semesters.get(semNum);
        if (!entry) {
          errors.push({ field: "semester", error: "Unknown semester", value: data.semester });
        } else if (!entry.isActive) {
          errors.push({ field: "semester", error: "Semester is inactive", value: data.semester });
        } else {
          semesterId = entry.id;
        }
      }
    }

    // Course category
    let categoryId: string | undefined;
    if (data.courseCategory) {
      const entry = lookups.categories.get(data.courseCategory.toUpperCase());
      if (!entry) {
        errors.push({ field: "courseCategory", error: "Unknown course category", value: data.courseCategory });
      } else if (!entry.isActive) {
        errors.push({ field: "courseCategory", error: "Course category is inactive", value: data.courseCategory });
      } else {
        categoryId = entry.id;
      }
    }

    // Course type
    let courseTypeId: string | undefined;
    if (data.courseType) {
      const entry = lookups.courseTypes.get(data.courseType.toUpperCase());
      if (!entry) {
        errors.push({ field: "courseType", error: "Unknown course type", value: data.courseType });
      } else if (!entry.isActive) {
        errors.push({ field: "courseType", error: "Course type is inactive", value: data.courseType });
      } else {
        courseTypeId = entry.id;
      }
    }

    // Offered by department
    let offeredByDepartmentId: string | undefined;
    if (data.offeredByDepartment) {
      const entry = lookups.departments.get(data.offeredByDepartment.toUpperCase());
      if (!entry) {
        errors.push({ field: "offeredByDepartment", error: "Unknown department code", value: data.offeredByDepartment });
      } else if (!entry.isActive) {
        errors.push({ field: "offeredByDepartment", error: "Department is inactive", value: data.offeredByDepartment });
      } else {
        offeredByDepartmentId = entry.id;
      }
    }

    // Offered to departments (pipe-delimited list of parent department codes)
    let offeredToDepartmentIds: string[] | undefined;
    if (data.offeredToDepartments) {
      const codes = data.offeredToDepartments
        .split(DEPARTMENT_LIST_DELIMITER)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (codes.length === 0) {
        errors.push({
          field: "offeredToDepartments",
          error: "At least one offered-to department is required",
          value: data.offeredToDepartments,
        });
      } else {
        const ids: string[] = [];
        const unknown: string[] = [];
        const inactive: string[] = [];
        for (const code of codes) {
          const entry = lookups.departments.get(code.toUpperCase());
          if (!entry) unknown.push(code);
          else if (!entry.isActive) inactive.push(code);
          else ids.push(entry.id);
        }
        if (unknown.length > 0) {
          errors.push({
            field: "offeredToDepartments",
            error: `Unknown department code(s): ${unknown.join(", ")}`,
            value: data.offeredToDepartments,
          });
        }
        if (inactive.length > 0) {
          errors.push({
            field: "offeredToDepartments",
            error: `Inactive department code(s): ${inactive.join(", ")}`,
            value: data.offeredToDepartments,
          });
        }
        if (unknown.length === 0 && inactive.length === 0) {
          offeredToDepartmentIds = Array.from(new Set(ids));
        }
      }
    }

    // Numeric L T P S
    const numericFields: { key: "L" | "T" | "P" | "S"; label: string }[] = [
      { key: "L", label: "L" },
      { key: "T", label: "T" },
      { key: "P", label: "P" },
      { key: "S", label: "S" },
    ];
    const numericValues: Record<string, number> = {};
    for (const { key, label } of numericFields) {
      const parsed = parseNonNegativeNumber(data[key]);
      if (parsed === null) {
        errors.push({ field: key, error: `${label} must be a non-negative number`, value: data[key] });
      } else {
        numericValues[key] = parsed;
      }
    }

    const contactHours = parseNonNegativeNumber(data.contactHours);
    if (contactHours === null) {
      errors.push({ field: "contactHours", error: "Contact hours must be a non-negative number", value: data.contactHours });
    }

    const credits = parseNonNegativeNumber(data.credits);
    if (credits === null) {
      errors.push({ field: "credits", error: "Credits must be a non-negative number", value: data.credits });
    }

    // Duplicate course code within the uploaded file
    const upperCode = data.courseCode.toUpperCase();
    if (upperCode && (codeOccurrences.get(upperCode) ?? 0) > 1) {
      errors.push({
        field: "courseCode",
        error: "Duplicate course code within the uploaded file",
        value: data.courseCode,
      });
    }

    // Duplicate course code already in the database
    if (upperCode && lookups.existingCourseCodes.has(upperCode)) {
      errors.push({ field: "courseCode", error: "Course code already exists", value: data.courseCode });
    }

    const isValid = errors.length === 0;

    const resolved: ResolvedCourseRow | undefined = isValid
      ? {
          regulation: regulationId as string,
          semester: semesterId as string,
          courseCode: data.courseCode.toUpperCase(),
          courseName: data.courseName,
          courseCategory: categoryId as string,
          L: numericValues.L,
          T: numericValues.T,
          P: numericValues.P,
          S: numericValues.S,
          contactHours: contactHours as number,
          credits: credits as number,
          courseType: courseTypeId as string,
          offeredByDepartment: offeredByDepartmentId as string,
          offeredToDepartments: offeredToDepartmentIds as string[],
          courseCoordinatorName: data.courseCoordinatorName,
          courseCoordinatorEmployeeId: data.courseCoordinatorEmployeeId,
        }
      : undefined;

    return { row: rowNumber, data, errors, isValid, resolved };
  });

  const validRows = results.filter((r) => r.isValid).length;

  return {
    totalRows: results.length,
    validRows,
    errorRows: results.length - validRows,
    results,
  };
}
