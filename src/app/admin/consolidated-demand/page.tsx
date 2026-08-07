"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select, Checkbox } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useMasterOptions } from "@/lib/hooks/useMasterOptions";
import { apiGet, apiPost, ApiError } from "@/lib/apiClient";

interface DeptGroup {
  demandId: string;
  status: string;
  departmentCode: string;
  departmentName: string;
  units: { unitId: string; code: string; name: string; count: number }[];
  departmentTotal: number;
}

interface CourseGroup {
  courseId: string;
  courseCode: string;
  courseName: string;
  courseCategory: { code: string; name: string };
  regulation: { code: string };
  semester: { number: number; name: string };
  departments: DeptGroup[];
  courseTotal: number;
}

export default function ConsolidatedDemandPage() {
  const { categories, regulations, semesters } = useMasterOptions();
  const [category, setCategory] = useState("");
  const [regulation, setRegulation] = useState("");
  const [semester, setSemester] = useState("");
  const [includeAll, setIncludeAll] = useState(false);
  const [courses, setCourses] = useState<CourseGroup[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reopenTarget, setReopenTarget] = useState<{ demandId: string; label: string } | null>(null);
  const [reopening, setReopening] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (category) query.set("category", category);
      if (regulation) query.set("regulation", regulation);
      if (semester) query.set("semester", semester);
      if (includeAll) query.set("includeAll", "true");
      const res = await apiGet<{ courses: CourseGroup[]; grandTotal: number }>(
        `/api/admin/demand/consolidated?${query.toString()}`,
      );
      setCourses(res.courses);
      setGrandTotal(res.grandTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consolidated demand");
    } finally {
      setLoading(false);
    }
  }, [category, regulation, semester, includeAll]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmReopen() {
    if (!reopenTarget) return;
    setReopening(true);
    try {
      await apiPost(`/api/admin/demand/${reopenTarget.demandId}/reopen`, {});
      toast.success("Demand reopened");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reopen demand");
    } finally {
      setReopening(false);
      setReopenTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Consolidated Demand"
        description="Read-only view of submitted department demand, grouped by course. Feeds Module 3."
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
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
          <label className="flex items-center gap-1.5 text-sm text-slate-600 ml-1">
            <Checkbox checked={includeAll} onChange={(e) => setIncludeAll(e.target.checked)} />
            Include reopened
          </label>
        </div>

        {loading && <LoadingState label="Loading consolidated demand..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && courses.length === 0 && (
          <EmptyState title="No submitted demand yet" description="Submitted department demand will appear here." />
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="divide-y divide-slate-100">
            {courses.map((c) => (
              <div key={c.courseId} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {c.courseCategory.code} | {c.courseName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.courseCode} · {c.regulation.code} · {c.semester.name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Course Total: {c.courseTotal}</p>
                </div>

                <div className="space-y-3">
                  {c.departments.map((d) => (
                    <div key={d.demandId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-800">{d.departmentCode}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-slate-700">Total: {d.departmentTotal}</p>
                          {d.status === "SUBMITTED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReopenTarget({ demandId: d.demandId, label: `${d.departmentCode} — ${c.courseName}` })}
                            >
                              <RotateCcw size={13} /> Reopen
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-slate-600">
                        {d.units.map((u) => (
                          <div key={u.unitId} className="flex justify-between">
                            <span>{u.code}</span>
                            <span className="font-medium">{u.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end p-5">
              <p className="text-base font-semibold text-slate-900">Grand Total → {grandTotal}</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(reopenTarget)}
        title="Reopen Demand"
        description={`"${reopenTarget?.label}" will be reopened for editing. The department can update and resubmit it.`}
        confirmLabel="Reopen"
        destructive={false}
        loading={reopening}
        onConfirm={confirmReopen}
        onCancel={() => setReopenTarget(null)}
      />
    </div>
  );
}
