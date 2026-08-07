/** Pure calculation helpers for Module 3. No DB access — easy to reason about and test. */

export function requiredSections(totalStudents: number, sectionCapacity: number): number {
  if (totalStudents <= 0 || sectionCapacity <= 0) return 0;
  return Math.ceil(totalStudents / sectionCapacity);
}

/** Default balanced 50:50 split — cluster 1 gets the extra section when odd. */
export function defaultCluster1Sections(total: number): number {
  return Math.ceil(total / 2);
}

export interface ClusterRanges {
  cluster1: { start: number; end: number; count: number };
  cluster2: { start: number; end: number; count: number };
}

/** Clamps a requested cluster1 count into [0, total] and derives both ranges. */
export function clusterRanges(total: number, cluster1SectionsRaw: number | null | undefined): ClusterRanges {
  const c1 = Math.min(Math.max(cluster1SectionsRaw ?? defaultCluster1Sections(total), 0), total);
  const c2 = total - c1;
  return {
    cluster1: { start: c1 > 0 ? 1 : 0, end: c1, count: c1 },
    cluster2: { start: c1 > 0 || c2 > 0 ? c1 + 1 : 0, end: c1 + c2, count: c2 },
  };
}

export function clusterPercentages(cluster1Count: number, total: number): { cluster1Pct: number; cluster2Pct: number } {
  if (total <= 0) return { cluster1Pct: 0, cluster2Pct: 0 };
  const p1 = round2((cluster1Count / total) * 100);
  return { cluster1Pct: p1, cluster2Pct: round2(100 - p1) };
}

export function ratio(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return round2((part / whole) * 100);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Distributes `count` students evenly across sections `[start, end]` inclusive.
 * Deterministic: earlier sections absorb the remainder. Sum of the result always equals `count`.
 */
export function distributeEvenly(count: number, start: number, end: number): Map<number, number> {
  const result = new Map<number, number>();
  const span = end - start + 1;
  if (span <= 0 || count <= 0) return result;
  const base = Math.floor(count / span);
  const remainder = count % span;
  for (let i = 0; i < span; i++) {
    const section = start + i;
    const value = base + (i < remainder ? 1 : 0);
    if (value > 0) result.set(section, value);
  }
  return result;
}
