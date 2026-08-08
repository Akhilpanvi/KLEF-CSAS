import { forwardRef } from "react";
import clsx from "clsx";

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, required, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputBase =
  "block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  function Input({ className, error, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(inputBase, error ? "border-red-300 dark:border-red-800 focus:border-red-400" : "border-slate-300 dark:border-slate-700 focus:border-blue-500", className)}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function Textarea({ className, error, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(inputBase, error ? "border-red-300 dark:border-red-800" : "border-slate-300 dark:border-slate-700 focus:border-blue-500", className)}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(function Select({ className, error, children, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(inputBase, "bg-white dark:bg-slate-900", error ? "border-red-300 dark:border-red-800" : "border-slate-300 dark:border-slate-700 focus:border-blue-500", className)}
      {...rest}
    >
      {children}
    </select>
  );
});

export function Checkbox({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={clsx(
        "h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/40",
        className,
      )}
      {...rest}
    />
  );
}
