"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useMasterOptions } from "@/lib/hooks/useMasterOptions";
import { useDepartmentCourses } from "@/lib/hooks/useDepartmentCourses";
import { apiPost, ApiError } from "@/lib/apiClient";
import { DemandTable } from "./DemandTable";
import type { AvailableCourseDTO } from "@/types";

export function DemandListPage({
  title,
  description,
  fixedStatus,
  showStatusFilter,
}: {
  title: string;
  description: string;
  fixedStatus?: string;
  showStatusFilter?: boolean;
}) {
  const [category, setCategory] = useState("");
  const [regulation, setRegulation] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState(fixedStatus ?? "");
  const [submitTarget, setSubmitTarget] = useState<AvailableCourseDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const { categories, regulations, semesters } = useMasterOptions();
  const { items, loading, error, refetch } = useDepartmentCourses({
    category: category || undefined,
    regulation: regulation || undefined,
    semester: semester || undefined,
    status: fixedStatus ?? status ?? undefined,
  });

  async function confirmSubmit() {
    if (!submitTarget) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/department/demand/${submitTarget._id}/submit`, {});
      toast.success("Demand submitted");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit demand");
    } finally {
      setSubmitting(false);
      setSubmitTarget(null);
    }
  }

  return (
    <div>
      <PageHeader title={title} description={description} />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code}
              </option>
            ))}
          </Select>
          <Select value={regulation} onChange={(e) => setRegulation(e.target.value)} className="w-auto">
            <option value="">All regulations</option>
            {regulations.map((r) => (
              <option key={r._id} value={r._id}>
                {r.code}
              </option>
            ))}
          </Select>
          <Select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-auto">
            <option value="">All semesters</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
          {showStatusFilter && (
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
              <option value="">All statuses</option>
              <option value="PENDING">Not Started</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REOPENED">Reopened</option>
            </Select>
          )}
        </div>

        <DemandTable items={items} loading={loading} error={error} onSubmit={setSubmitTarget} />
      </div>

      <ConfirmDialog
        open={Boolean(submitTarget)}
        title="Submit Course Demand"
        description={`"${submitTarget?.courseCode} — ${submitTarget?.courseName}" will be submitted (total ${submitTarget?.totalStudents} students) and locked from further edits until a Timetable Admin reopens it.`}
        confirmLabel="Submit"
        destructive={false}
        loading={submitting}
        onConfirm={confirmSubmit}
        onCancel={() => setSubmitTarget(null)}
      />
    </div>
  );
}
