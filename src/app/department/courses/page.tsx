"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Eye, Archive } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { CourseStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CourseFormModal } from "@/components/course/CourseFormModal";
import { CourseDetailsModal } from "@/components/course/CourseDetailsModal";
import { useMasterList } from "@/lib/hooks/useMasterList";
import { apiDelete, apiGet } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { CourseDTO } from "@/types";
import type { SessionPayload } from "@/lib/auth/token";

function label(value: { code?: string; name?: string } | string | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.code ?? value.name ?? "—";
}

export default function DepartmentCourseDefinitionPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseDTO | null>(null);
  const [viewing, setViewing] = useState<CourseDTO | null>(null);
  const [archiving, setArchiving] = useState<CourseDTO | null>(null);
  const toast = useToast();

  useEffect(() => {
    apiGet<SessionPayload>("/api/auth/me").then(setSession);
  }, []);

  // The API already scopes GET /api/courses to the logged-in department for
  // a DEPARTMENT_USER session — no client-side department filter needed.
  const { data, loading, error, refetch } = useMasterList<CourseDTO>("/api/courses", { status: "all" });

  async function confirmArchive() {
    if (!archiving) return;
    try {
      await apiDelete(`/api/courses/${archiving._id}`);
      toast.success("Course archived");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive course");
    } finally {
      setArchiving(null);
    }
  }

  const fixedOfferedBy = session?.department && session.departmentCode ? { id: session.department, code: session.departmentCode } : undefined;

  return (
    <div>
      <PageHeader
        title="Course Definition"
        description="Courses your department offers. Other departments select these for their student demand in Module 2."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={!fixedOfferedBy}
          >
            <Plus size={16} /> Add Course
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {loading && <LoadingState label="Loading courses..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState title="No courses yet" description="Add the first course your department offers." />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Regulation</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Offered To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{course.courseCode}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[14rem] truncate">{course.courseName}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(course.courseCategory)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(course.regulation)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(course.semester)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{course.offeredToDepartments.length}</td>
                    <td className="px-4 py-3">
                      <CourseStatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewing(course)} title="View">
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(course);
                            setFormOpen(true);
                          }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Button>
                        {course.status !== "Archived" && (
                          <Button variant="ghost" size="sm" onClick={() => setArchiving(course)} title="Archive">
                            <Archive size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CourseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        course={editing}
        fixedOfferedBy={fixedOfferedBy}
      />
      <CourseDetailsModal open={Boolean(viewing)} onClose={() => setViewing(null)} course={viewing} />

      <ConfirmDialog
        open={Boolean(archiving)}
        title="Archive Course"
        description={`"${archiving?.courseCode} — ${archiving?.courseName}" will be archived and hidden from department course selections. This preserves the academic record instead of deleting it.`}
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}
