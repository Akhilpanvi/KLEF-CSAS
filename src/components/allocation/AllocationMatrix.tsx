"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { GroupDetail } from "@/lib/allocation/groupService";

export function AllocationMatrix({
  detail,
  readOnly,
  onEditCell,
}: {
  detail: GroupDetail;
  readOnly: boolean;
  onEditCell: (department: string, sectionNumber: number, studentCount: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const sectionNumbers = Array.from({ length: detail.requiredSections }, (_, i) => i + 1);

  if (detail.requiredSections === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No sections yet — no submitted demand for this course.</p>;
  }

  async function handleBlur(cellKey: string, department: string, sectionNumber: number, raw: string) {
    setEditing(null);
    const value = Math.max(0, Math.floor(Number(raw) || 0));
    setSavingCell(cellKey);
    try {
      await onEditCell(department, sectionNumber, value);
    } finally {
      setSavingCell(null);
    }
  }

  return (
    <div className="overflow-auto max-h-[32rem] border border-slate-200 dark:border-slate-800 rounded-lg">
      <table className="text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/60">
          <tr>
            <th className="px-2 py-2 text-left font-medium text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800/60 border-b border-r border-slate-200 dark:border-slate-800">
              Department
            </th>
            {sectionNumbers.map((s) => (
              <th key={s} className="px-2 py-2 text-center font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 min-w-[52px]">
                S{s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {detail.matrix.rows.map((row) => (
            <tr key={row.departmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                {row.departmentCode}
              </td>
              {sectionNumbers.map((s) => {
                const cellKey = `${row.departmentId}-${s}`;
                const value = row.cells[s] ?? 0;
                const saving = savingCell === cellKey;
                const overCapacity = (detail.matrix.sections.find((sec) => sec.sectionNumber === s)?.allocated ?? 0) > detail.sectionCapacity;
                return (
                  <td key={s} className={`text-center border-slate-100 dark:border-slate-800 ${overCapacity ? "bg-red-50 dark:bg-red-950/40" : ""}`}>
                    {readOnly ? (
                      <span className="block px-2 py-1.5 text-slate-700 dark:text-slate-300">{value || "—"}</span>
                    ) : saving ? (
                      <span className="flex items-center justify-center w-14 px-1 py-1.5">
                        <Loader2 size={12} className="animate-spin text-blue-500 dark:text-blue-400" />
                      </span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        defaultValue={value}
                        key={editing === cellKey ? undefined : value}
                        onFocus={() => setEditing(cellKey)}
                        onBlur={(e) => handleBlur(cellKey, row.departmentId, s, e.target.value)}
                        className="w-14 px-1 py-1.5 text-center bg-transparent focus:bg-blue-50 dark:focus:bg-blue-950/40 focus:outline-none"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
