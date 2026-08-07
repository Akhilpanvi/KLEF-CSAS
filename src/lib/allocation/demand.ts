import { CourseDemand } from "@/models/CourseDemand";
// Side-effect import: ensure populate()'d ref model is registered regardless of request order.
import "@/models/Department";

export interface DemandRow {
  departmentId: string;
  departmentCode: string;
  studentCount: number;
}

export interface DepartmentTotal {
  departmentId: string;
  departmentCode: string;
  total: number;
}

export interface CourseDemandSummary {
  rows: DemandRow[];
  departmentTotals: DepartmentTotal[];
  grandTotal: number;
}

/**
 * Only SUBMITTED Module 2 demand feeds Module 3 — drafts/reopened aren't
 * final. Each department (CSE-1, CSE-2, HTE, ... — all independent, no
 * hierarchy) submits exactly one CourseDemand row per course, so a row here
 * *is* a department: no separate unit-breakdown layer.
 */
export async function getCourseSubmittedDemand(courseId: string): Promise<CourseDemandSummary> {
  const demands = await CourseDemand.find({ course: courseId, status: "SUBMITTED" })
    .populate("department", "code name")
    .lean();

  const rows: DemandRow[] = demands.map((d) => {
    const department = d.department as unknown as { _id: unknown; code: string };
    return {
      departmentId: String(department._id),
      departmentCode: department.code,
      studentCount: d.totalStudents,
    };
  });

  const grandTotal = rows.reduce((sum, r) => sum + r.studentCount, 0);

  return {
    rows,
    departmentTotals: rows
      .map((r) => ({ departmentId: r.departmentId, departmentCode: r.departmentCode, total: r.studentCount }))
      .sort((a, b) => a.departmentCode.localeCompare(b.departmentCode)),
    grandTotal,
  };
}
