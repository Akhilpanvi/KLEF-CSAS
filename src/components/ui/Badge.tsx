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
