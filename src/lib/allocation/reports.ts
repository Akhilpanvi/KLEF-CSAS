import Papa from "papaparse";
import type { GroupDetail } from "./groupService";

export type ReportType = "course" | "category" | "department" | "unit" | "section" | "cluster";

export function buildReportRows(detail: GroupDetail, type: ReportType): Record<string, string | number>[] {
  switch (type) {
    case "course":
      return [
        {
          courseCategory: detail.course.courseCategory.code,
          courseCode: detail.course.courseCode,
          courseName: detail.course.courseName,
          regulation: detail.course.regulation.code,
          semester: detail.course.semester.name,
          totalStudents: detail.grandTotal,
          requiredSections: detail.requiredSections,
          status: detail.status,
        },
      ];
    case "category":
      return [
        {
          courseCategory: detail.course.courseCategory.code,
          categoryName: detail.course.courseCategory.name,
          courseCode: detail.course.courseCode,
          totalStudents: detail.grandTotal,
        },
      ];
    case "department":
      return detail.departmentTotals.map((d) => ({
        department: d.departmentCode,
        totalStudents: d.total,
        percentOfCourse: d.pct,
      }));
    case "unit":
      return detail.matrix.rows.map((r) => ({
        department: r.departmentCode,
        unit: r.unitCode,
        specialization: r.specialization,
        cluster: r.cluster ?? "Unassigned",
        demandCount: r.demandCount,
        allocatedCount: r.allocatedCount,
      }));
    case "section":
      return detail.matrix.sections.map((s) => ({
        section: `S${s.sectionNumber}`,
        cluster: s.cluster,
        capacity: s.capacity,
        allocated: s.allocated,
        remaining: s.remaining,
        utilizationPct: s.utilizationPct,
      }));
    case "cluster":
      return [
        {
          cluster: 1,
          sections: detail.clusters.cluster1Sections,
          range: detail.clusters.ranges.cluster1.count > 0 ? `S${detail.clusters.ranges.cluster1.start}-S${detail.clusters.ranges.cluster1.end}` : "—",
          percentOfSections: detail.clusters.cluster1Pct,
        },
        {
          cluster: 2,
          sections: detail.clusters.cluster2Sections,
          range: detail.clusters.ranges.cluster2.count > 0 ? `S${detail.clusters.ranges.cluster2.start}-S${detail.clusters.ranges.cluster2.end}` : "—",
          percentOfSections: detail.clusters.cluster2Pct,
        },
      ];
  }
}

export function buildReportCsv(detail: GroupDetail, type: ReportType): string {
  const rows = buildReportRows(detail, type);
  return Papa.unparse(rows);
}
