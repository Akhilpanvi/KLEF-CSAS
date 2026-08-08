import type { RowResult } from "@/lib/csv/validateCourseRows";

export function ErrorRowsTable({ results }: { results: RowResult[] }) {
  const failed = results.filter((r) => !r.isValid);
  if (failed.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-red-200 dark:border-red-900/50">
      <table className="w-full text-sm">
        <thead className="bg-red-50 dark:bg-red-950/40">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">
            <th className="px-3 py-2">Row</th>
            <th className="px-3 py-2">Field</th>
            <th className="px-3 py-2">Error</th>
            <th className="px-3 py-2">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-red-100 dark:divide-red-900/40">
          {failed.flatMap((r) =>
            r.errors.map((e, idx) => (
              <tr key={`${r.row}-${idx}`} className="hover:bg-red-50/50 dark:hover:bg-red-950/20">
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">{r.row}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{e.field}</td>
                <td className="px-3 py-2 text-red-700 dark:text-red-400">{e.error}</td>
                <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[16rem] truncate">{e.value || "—"}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
