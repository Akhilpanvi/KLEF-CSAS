import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DemandStatusBadge } from "@/components/ui/Badge";
import { EmptyState, LoadingState, ErrorState } from "@/components/ui/States";
import type { AvailableCourseDTO } from "@/types";

function label(v: { code?: string; name?: string } | string | undefined): string {
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.code ?? v.name ?? "—";
}

export function DemandTable({
  items,
  loading,
  error,
  onSubmit,
}: {
  items: AvailableCourseDTO[];
  loading: boolean;
  error: string | null;
  onSubmit: (course: AvailableCourseDTO) => void;
}) {
  if (loading) return <LoadingState label="Loading courses..." />;
  if (error) return <ErrorState message={error} />;
  if (items.length === 0) {
    return <EmptyState title="No courses found" description="No courses match the selected filters." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Course</th>
            <th className="px-4 py-3">Regulation</th>
            <th className="px-4 py-3">Semester</th>
            <th className="px-4 py-3">Total Students</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((c) => (
            <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(c.courseCategory)}</td>
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.courseCode}</td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.courseName}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(c.regulation)}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(c.semester)}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.totalStudents}</td>
              <td className="px-4 py-3">
                <DemandStatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  {c.status === "PENDING" && (
                    <Link href={`/department/demand/${c._id}`}>
                      <Button size="sm">Enter Demand</Button>
                    </Link>
                  )}
                  {(c.status === "DRAFT" || c.status === "REOPENED") && (
                    <>
                      <Link href={`/department/demand/${c._id}`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => onSubmit(c)}>
                        Submit
                      </Button>
                    </>
                  )}
                  {c.status === "SUBMITTED" && (
                    <Link href={`/department/demand/${c._id}`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
