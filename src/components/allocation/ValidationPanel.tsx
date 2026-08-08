import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ValidationResult } from "@/lib/allocation/validate";

export function ValidationPanel({ validation }: { validation: ValidationResult }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Live Validation</h3>
        {!validation.isValid && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Expected: {validation.expectedTotal} · Allocated: {validation.allocatedTotal} · Difference: {validation.difference}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {validation.checks.map((c) => (
          <div key={c.key} className="flex items-start gap-2 text-sm">
            {c.passed ? (
              <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className={c.passed ? "text-slate-700 dark:text-slate-300" : "text-red-700 dark:text-red-400 font-medium"}>{c.label}</span>
              {c.detail && <p className="text-xs text-red-500 dark:text-red-400">{c.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
