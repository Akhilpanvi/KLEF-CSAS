"use client";

import { useState } from "react";
import { Plus, Pencil, Eye, Archive, Power, UploadCloud, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { CourseStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CourseFormModal } from "@/components/course/CourseFormModal";
import { CourseDetailsModal } from "@/components/course/CourseDetailsModal";
import { CsvImportWizard } from "@/components/course/CsvImportWizard";
import { useMasterList } from "@/lib/hooks/useMasterList";
import { useMasterOptions } from "@/lib/hooks/useMasterOptions";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { apiDelete, apiPatch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { CourseDTO } from "@/types";

function label(value: { code?: string; name?: string } | string | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.code ?? value.name ?? "—";
}

export default function CourseMasterPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("");
  const [regulation, setRegulation] = useState("");
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourseDTO | null>(null);
  const [viewing, setViewing] = useState<CourseDTO | null>(null);
  const [archiving, setArchiving] = useState<CourseDTO | null>(null);
  const [toggling, setToggling] = useState<CourseDTO | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const toast = useToast();
  const { departments, categories, regulations, semesters } = useMasterOptions();

  const { data, loading, error, refetch } = useMasterList<CourseDTO>("/api/courses", {
    q: debouncedSearch,
    status,
    category: category || undefined,
    regulation: regulation || undefined,
    semester: semester || undefined,
    department: department || undefined,
    page: String(page),
  });

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

  async function confirmToggle() {
    if (!toggling) return;
    const nextStatus = toggling.status === "Active" ? "Inactive" : "Active";
    try {
      await apiPatch(`/api/courses/${toggling._id}`, { status: nextStatus });
      toast.success(`Course ${nextStatus === "Active" ? "activated" : "deactivated"}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setToggling(null);
    }
  }

  async function handleDownloadSample() {
    const res = await fetch("/api/courses/csv/sample");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "course_master_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Course Master"
        description="Create and manage the university course master consumed by allocation and timetabling."
        actions={
          <>
            <Button variant="secondary" onClick={handleDownloadSample}>
              <Download size={16} /> Download Sample CSV
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <UploadCloud size={16} /> Upload CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} /> Add Course
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by code, name or coordinator..." />
          <div className="flex flex-wrap gap-2">
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-auto">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.code}</option>
              ))}
            </Select>
            <Select value={regulation} onChange={(e) => { setRegulation(e.target.value); setPage(1); }} className="w-auto">
              <option value="">All regulations</option>
              {regulations.map((r) => (
                <option key={r._id} value={r._id}>{r.code}</option>
              ))}
            </Select>
            <Select value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1); }} className="w-auto">
              <option value="">All semesters</option>
              {semesters.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </Select>
            <Select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} className="w-auto">
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.code}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-auto">
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </Select>
          </div>
        </div>

        {loading && <LoadingState label="Loading courses..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title="No courses found"
            description="Add a course manually or upload a CSV to bulk-create the course master."
          />
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
                  <th className="px-4 py-3">Credits</th>
                  <th className="px-4 py-3">Offered By</th>
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
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{course.credits}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{label(course.offeredByDepartment)}</td>
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
                          <Button variant="ghost" size="sm" onClick={() => setToggling(course)} title="Activate/Deactivate">
                            <Power size={14} />
                          </Button>
                        )}
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

        {!loading && !error && data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </div>

      <CourseFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} course={editing} />
      <CourseDetailsModal open={Boolean(viewing)} onClose={() => setViewing(null)} course={viewing} />
      <CsvImportWizard open={importOpen} onClose={() => setImportOpen(false)} onImported={refetch} />

      <ConfirmDialog
        open={Boolean(archiving)}
        title="Archive Course"
        description={`"${archiving?.courseCode} — ${archiving?.courseName}" will be archived and hidden from active course selections. This preserves the academic record instead of deleting it, and can be reviewed later.`}
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setArchiving(null)}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.status === "Active" ? "Deactivate Course" : "Activate Course"}
        description={`"${toggling?.courseCode} — ${toggling?.courseName}" will be marked ${toggling?.status === "Active" ? "Inactive" : "Active"}.`}
        confirmLabel={toggling?.status === "Active" ? "Deactivate" : "Activate"}
        destructive={toggling?.status === "Active"}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
