import clsx from "clsx";

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-200 dark:ring-green-900/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

const COURSE_STATUS_CLASSES: Record<string, string> = {
  Active: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-900/50",
  Inactive: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/50",
  Archived: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
};

export function CourseStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        COURSE_STATUS_CLASSES[status] ?? COURSE_STATUS_CLASSES.Archived,
      )}
    >
      {status}
    </span>
  );
}

const DEMAND_STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
  DRAFT: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/50",
  SUBMITTED: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-900/50",
  REOPENED: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-900/50",
};

export function DemandStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        DEMAND_STATUS_CLASSES[status] ?? DEMAND_STATUS_CLASSES.PENDING,
      )}
    >
      {status === "PENDING" ? "Not Started" : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

const ALLOCATION_STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
  SECTIONS_CALCULATED: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/50",
  CLUSTERS_CONFIGURED: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/50",
  ALLOCATED: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-900/50",
  VALIDATED: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 ring-teal-200 dark:ring-teal-900/50",
  FINALIZED: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 ring-green-200 dark:ring-green-900/50",
};

export function AllocationStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        ALLOCATION_STATUS_CLASSES[status] ?? ALLOCATION_STATUS_CLASSES.DRAFT,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
