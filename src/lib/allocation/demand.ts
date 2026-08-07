import { CourseDemand } from "@/models/CourseDemand";
import { CourseDemandItem } from "@/models/CourseDemandItem";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/Department";
import "@/models/Unit";

export interface DemandRow {
  departmentId: string;
  departmentCode: string;
  unitId: string;
  unitCode: string;
  unitName: string;
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

/** Only SUBMITTED Module 2 demand feeds Module 3 — drafts/reopened aren't final. */
export async function getCourseSubmittedDemand(courseId: string): Promise<CourseDemandSummary> {
  const demands = await CourseDemand.find({ course: courseId, status: "SUBMITTED" })
    .populate("department", "code name")
    .lean();

  const demandIds = demands.map((d) => d._id);
  const items = await CourseDemandItem.find({ demand: { $in: demandIds } })
    .populate("unit", "code name")
    .lean();
  const itemsByDemand = new Map<string, typeof items>();
  for (const item of items) {
    const key = String(item.demand);
    if (!itemsByDemand.has(key)) itemsByDemand.set(key, []);
    itemsByDemand.get(key)!.push(item);
  }

  const rows: DemandRow[] = [];
  const deptTotalsMap = new Map<string, DepartmentTotal>();

  for (const d of demands) {
    const department = d.department as unknown as { _id: unknown; code: string };
    const deptId = String(department._id);
    const deptItems = itemsByDemand.get(String(d._id)) ?? [];

    if (!deptTotalsMap.has(deptId)) {
      deptTotalsMap.set(deptId, { departmentId: deptId, departmentCode: department.code, total: 0 });
    }
    const deptTotal = deptTotalsMap.get(deptId)!;

    for (const item of deptItems) {
      const unit = item.unit as unknown as { _id: unknown; code: string; name: string };
      rows.push({
        departmentId: deptId,
        departmentCode: department.code,
        unitId: String(unit._id),
        unitCode: unit.code,
        unitName: unit.name,
        studentCount: item.studentCount,
      });
      deptTotal.total += item.studentCount;
    }
  }

  const grandTotal = rows.reduce((sum, r) => sum + r.studentCount, 0);

  return {
    rows,
    departmentTotals: Array.from(deptTotalsMap.values()).sort((a, b) => a.departmentCode.localeCompare(b.departmentCode)),
    grandTotal,
  };
}
