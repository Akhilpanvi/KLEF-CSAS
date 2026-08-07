import type { LiveMatrix } from "./matrix";

export interface ValidationCheck {
  key: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ValidationResult {
  isValid: boolean;
  checks: ValidationCheck[];
  expectedTotal: number;
  allocatedTotal: number;
  difference: number;
}

export function validateMatrix(
  matrix: LiveMatrix,
  meta: { courseId: string; courseCategoryId: string; requiredSections: number },
): ValidationResult {
  const checks: ValidationCheck[] = [];

  const expectedTotal = matrix.rows.reduce((sum, r) => sum + r.demandCount, 0);
  const allocatedTotal = matrix.rows.reduce((sum, r) => sum + r.allocatedCount, 0);
  const difference = allocatedTotal - expectedTotal;

  checks.push({
    key: "totals_match",
    label: "Student totals match",
    passed: difference === 0,
    detail: difference === 0 ? undefined : `Expected: ${expectedTotal}, Allocated: ${allocatedTotal}, Difference: ${difference}`,
  });

  const overCapacity = matrix.sections.filter((s) => s.allocated > s.capacity);
  checks.push({
    key: "capacity_valid",
    label: "Capacity valid",
    passed: overCapacity.length === 0,
    detail: overCapacity.length ? `Section(s) over capacity: ${overCapacity.map((s) => `S${s.sectionNumber}`).join(", ")}` : undefined,
  });

  const missing = matrix.rows.filter((r) => r.allocatedCount < r.demandCount);
  checks.push({
    key: "no_missing",
    label: "No missing allocation",
    passed: missing.length === 0,
    detail: missing.length
      ? `Under-allocated: ${missing.map((r) => `${r.departmentCode} (${r.allocatedCount}/${r.demandCount})`).join(", ")}`
      : undefined,
  });

  const overAllocated = matrix.rows.filter((r) => r.allocatedCount > r.demandCount);
  checks.push({
    key: "no_duplicate",
    label: "No duplicate allocation",
    passed: overAllocated.length === 0,
    detail: overAllocated.length
      ? `Over-allocated: ${overAllocated.map((r) => `${r.departmentCode} (${r.allocatedCount}/${r.demandCount})`).join(", ")}`
      : undefined,
  });

  // Rows with an explicit specialization → cluster rule must keep every allocated
  // student within that cluster's section range (rows with no rule yet are exempt
  // — they intentionally spread across all sections until configured).
  const clusterLeaks = matrix.rows.filter((r) => {
    if (r.cluster === null) return false;
    const range = r.cluster === 1 ? matrix.ranges.cluster1 : matrix.ranges.cluster2;
    return Object.entries(r.cells).some(([sec, count]) => count > 0 && (Number(sec) < range.start || Number(sec) > range.end));
  });
  checks.push({
    key: "cluster_totals",
    label: "Cluster totals match",
    passed: clusterLeaks.length === 0,
    detail: clusterLeaks.length ? `Outside assigned cluster range: ${clusterLeaks.map((r) => r.departmentCode).join(", ")}` : undefined,
  });

  // Department totals match is intentionally not a separate check: each row
  // already *is* one department (no unit sub-breakdown), so it would only ever
  // duplicate no_missing/no_duplicate above.

  checks.push({
    key: "course_verified",
    label: "Course verified",
    passed: Boolean(meta.courseId),
  });
  checks.push({
    key: "category_verified",
    label: "Category verified",
    passed: Boolean(meta.courseCategoryId),
  });

  const hasDemand = expectedTotal > 0 && meta.requiredSections > 0;
  checks.push({
    key: "has_demand",
    label: "Submitted demand present",
    passed: hasDemand,
    detail: hasDemand ? undefined : "No submitted Module 2 demand to allocate yet",
  });

  return {
    isValid: checks.every((c) => c.passed),
    checks,
    expectedTotal,
    allocatedTotal,
    difference,
  };
}
