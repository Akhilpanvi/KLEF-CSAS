import type { GroupDetail } from "@/lib/allocation/groupService";

export function CalculationPanel({ detail }: { detail: GroupDetail }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">A. Input Demand</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500">
                <th className="px-2 py-1.5">Dept</th>
                <th className="px-2 py-1.5 text-right">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detail.demandRows.map((r) => (
                <tr key={r.departmentId}>
                  <td className="px-2 py-1 text-slate-600">{r.departmentCode}</td>
                  <td className="px-2 py-1 text-right font-medium text-slate-800">{r.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">B. Department Totals</h3>
        <div className="space-y-1 text-sm">
          {detail.departmentTotals.map((d) => (
            <div key={d.departmentId} className="flex justify-between">
              <span className="text-slate-600">{d.departmentCode}</span>
              <span className="font-medium text-slate-800">{d.total}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">C. Grand Total</h3>
        <p className="text-xs text-slate-500 font-mono">
          {detail.departmentTotals.map((d) => d.total).join(" + ")} = {detail.grandTotal}
        </p>
      </section>

      <section className="rounded-lg bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">D. Section Calculation</h3>
        <p className="text-xs text-slate-500 font-mono">
          {detail.grandTotal} ÷ {detail.sectionCapacity} = {detail.sectionCapacity > 0 ? (detail.grandTotal / detail.sectionCapacity).toFixed(4) : "0"}
        </p>
        <p className="text-xs text-slate-500 font-mono">CEILING = {detail.requiredSections} sections</p>
      </section>

      <section className="rounded-lg bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">E. Cluster Calculation</h3>
        <p className="text-xs text-slate-500">
          Cluster 1 = {detail.clusters.cluster1Sections} sections ({detail.clusters.cluster1Pct}%)
        </p>
        <p className="text-xs text-slate-500">
          Cluster 2 = {detail.clusters.cluster2Sections} sections ({detail.clusters.cluster2Pct}%)
        </p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">F. Ratio Calculation</h3>
        <div className="space-y-1 text-xs">
          {detail.departmentTotals.map((d) => (
            <p key={d.departmentId} className="font-mono text-slate-500">
              {d.departmentCode} = {d.total}/{detail.grandTotal} = {d.pct}%
            </p>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Section Utilization</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-slate-500">
                <th className="px-2 py-1.5">Section</th>
                <th className="px-2 py-1.5 text-right">Cap</th>
                <th className="px-2 py-1.5 text-right">Alloc</th>
                <th className="px-2 py-1.5 text-right">Rem</th>
                <th className="px-2 py-1.5 text-right">Util %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detail.matrix.sections.map((s) => (
                <tr key={s.sectionNumber} className={s.allocated > s.capacity ? "bg-red-50" : undefined}>
                  <td className="px-2 py-1 text-slate-600">S{s.sectionNumber}</td>
                  <td className="px-2 py-1 text-right text-slate-500">{s.capacity}</td>
                  <td className="px-2 py-1 text-right text-slate-700">{s.allocated}</td>
                  <td className="px-2 py-1 text-right text-slate-500">{s.remaining}</td>
                  <td className={`px-2 py-1 text-right font-medium ${s.allocated > s.capacity ? "text-red-600" : "text-slate-700"}`}>
                    {s.utilizationPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
