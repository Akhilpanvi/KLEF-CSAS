import { distributeEvenly, clusterRanges } from "./calc";
import type { DemandRow } from "./demand";

export interface SpecRule {
  departmentId: string;
  specialization: string;
  cluster: 1 | 2;
}

export interface OverrideCell {
  departmentId: string;
  sectionNumber: number;
  studentCount: number;
}

export interface MatrixRow {
  departmentId: string;
  departmentCode: string;
  specialization: string;
  /** null = no specialization rule configured yet; spread across ALL sections rather than one cluster. */
  cluster: 1 | 2 | null;
  demandCount: number;
  allocatedCount: number;
  cells: Record<number, number>;
}

export interface SectionSummary {
  sectionNumber: number;
  cluster: 1 | 2;
  capacity: number;
  allocated: number;
  remaining: number;
  utilizationPct: number;
}

export interface LiveMatrix {
  rows: MatrixRow[];
  sections: SectionSummary[];
  ranges: ReturnType<typeof clusterRanges>;
}

/**
 * Computes the live section allocation matrix: default distribution is each
 * participating department's demand spread evenly across its assigned
 * cluster's section range, with any stored manual overrides layered on top
 * (ignored if stale — pointing at a section number outside the department's
 * current cluster range).
 */
export function computeLiveMatrix(
  demandRows: DemandRow[],
  specRules: SpecRule[],
  cluster1SectionsRaw: number | null | undefined,
  requiredSections: number,
  sectionCapacity: number,
  overrides: OverrideCell[],
): LiveMatrix {
  const ranges = clusterRanges(requiredSections, cluster1SectionsRaw);
  const ruleByDept = new Map(specRules.map((r) => [r.departmentId, r]));
  const overridesByDept = new Map<string, Map<number, number>>();
  for (const o of overrides) {
    if (!overridesByDept.has(o.departmentId)) overridesByDept.set(o.departmentId, new Map());
    overridesByDept.get(o.departmentId)!.set(o.sectionNumber, o.studentCount);
  }

  const rows: MatrixRow[] = demandRows.map((d) => {
    const rule = ruleByDept.get(d.departmentId);
    const cluster: 1 | 2 | null = rule?.cluster ?? null;
    const specialization = rule?.specialization ?? d.departmentCode;
    // Unconfigured departments spread across every section rather than being
    // funneled into cluster 1 by default — avoids a guaranteed capacity
    // overflow before the admin has had a chance to configure the mapping.
    const range = cluster === 1 ? ranges.cluster1 : cluster === 2 ? ranges.cluster2 : { start: 1, end: requiredSections, count: requiredSections };

    const defaultCells = distributeEvenly(d.studentCount, range.start || 1, range.end || 0);
    const deptOverrides = overridesByDept.get(d.departmentId);

    const cells: Record<number, number> = {};
    for (let s = 1; s <= requiredSections; s++) {
      const inRange = s >= range.start && s <= range.end && range.count > 0;
      const overrideVal = deptOverrides?.get(s);
      // Stale overrides (section outside the department's current cluster range) are ignored.
      if (overrideVal !== undefined && inRange) {
        cells[s] = overrideVal;
      } else if (inRange) {
        const v = defaultCells.get(s);
        if (v) cells[s] = v;
      }
    }

    const allocatedCount = Object.values(cells).reduce((a, b) => a + b, 0);

    return {
      departmentId: d.departmentId,
      departmentCode: d.departmentCode,
      specialization,
      cluster,
      demandCount: d.studentCount,
      allocatedCount,
      cells,
    };
  });

  const sections: SectionSummary[] = [];
  for (let s = 1; s <= requiredSections; s++) {
    const allocated = rows.reduce((sum, r) => sum + (r.cells[s] ?? 0), 0);
    sections.push({
      sectionNumber: s,
      cluster: s <= ranges.cluster1.end && ranges.cluster1.count > 0 ? 1 : 2,
      capacity: sectionCapacity,
      allocated,
      remaining: sectionCapacity - allocated,
      utilizationPct: sectionCapacity > 0 ? Math.round((allocated / sectionCapacity) * 10000) / 100 : 0,
    });
  }

  return { rows, sections, ranges };
}
