import clsx from "clsx";

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

const COURSE_STATUS_CLASSES: Record<string, string> = {
  Active: "bg-green-50 text-green-700 ring-green-200",
  Inactive: "bg-amber-50 text-amber-700 ring-amber-200",
  Archived: "bg-slate-100 text-slate-500 ring-slate-200",
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
  PENDING: "bg-slate-100 text-slate-500 ring-slate-200",
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  SUBMITTED: "bg-green-50 text-green-700 ring-green-200",
  REOPENED: "bg-blue-50 text-blue-700 ring-blue-200",
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
  DRAFT: "bg-slate-100 text-slate-500 ring-slate-200",
  SECTIONS_CALCULATED: "bg-amber-50 text-amber-700 ring-amber-200",
  CLUSTERS_CONFIGURED: "bg-amber-50 text-amber-700 ring-amber-200",
  ALLOCATED: "bg-blue-50 text-blue-700 ring-blue-200",
  VALIDATED: "bg-teal-50 text-teal-700 ring-teal-200",
  FINALIZED: "bg-green-50 text-green-700 ring-green-200",
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
