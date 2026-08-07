"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { DemandStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiPut, apiPost, ApiError } from "@/lib/apiClient";
import type { DemandDetailDTO } from "@/types";

export default function DemandEntryPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const toast = useToast();

  const [detail, setDetail] = useState<DemandDetailDTO | null>(null);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiGet<DemandDetailDTO>(`/api/department/demand/${courseId}`)
      .then((data) => {
        setDetail(data);
        setCounts(Object.fromEntries(data.items.map((i) => [i.unit, String(i.studentCount)])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load demand"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const locked = detail?.status === "SUBMITTED";
  const total = detail?.units.reduce((sum, u) => sum + (Number(counts[u._id]) || 0), 0) ?? 0;

  function buildItems() {
    return (detail?.units ?? []).map((u) => ({ unit: u._id, studentCount: Number(counts[u._id]) || 0 }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiPut<{ status: string }>(`/api/department/demand/${courseId}`, { items: buildItems() });
      setDetail((prev) => (prev ? { ...prev, status: res.status as typeof prev.status } : prev));
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await apiPut(`/api/department/demand/${courseId}`, { items: buildItems() });
      await apiPost(`/api/department/demand/${courseId}/submit`, {});
      toast.success("Demand submitted");
      router.push("/department/demand");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit demand");
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  }

  if (loading) return <LoadingState label="Loading course demand..." />;
  if (error || !detail) return <ErrorState message={error ?? "Not found"} />;

  return (
    <div>
      <Link href="/department/demand" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> Back to Course Demand
      </Link>

      <PageHeader
        title={`${detail.course.courseCategory.code} | ${detail.course.courseName}`}
        description={`${detail.course.courseCode} · ${detail.course.regulation.code} · ${detail.course.semester.name}`}
        actions={<DemandStatusBadge status={detail.status} />}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        {detail.units.length === 0 ? (
          <p className="text-sm text-slate-500">No units are configured for your department yet.</p>
        ) : (
          detail.units.map((u) => (
            <div key={u._id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{u.code}</p>
                <p className="text-xs text-slate-400">{u.name}</p>
              </div>
              <Input
                type="number"
                min={0}
                step={1}
                disabled={locked}
                value={counts[u._id] ?? "0"}
                onChange={(e) => setCounts({ ...counts, [u._id]: e.target.value })}
                className="w-28 text-right"
              />
            </div>
          ))
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <p className="text-sm font-semibold text-slate-900">Department Total</p>
          <p className="text-sm font-semibold text-slate-900">{total}</p>
        </div>
      </div>

      {!locked && detail.units.length > 0 && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={handleSave} loading={saving}>
            Save Draft
          </Button>
          <Button onClick={() => setConfirmSubmit(true)}>Submit</Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit Course Demand"
        description={`This will save your current entries (total ${total} students) and lock them from further edits until a Timetable Admin reopens it.`}
        confirmLabel="Submit"
        destructive={false}
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}
