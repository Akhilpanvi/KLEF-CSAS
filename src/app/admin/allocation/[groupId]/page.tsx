"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AllocationStatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiPatch, apiPut, apiPost, ApiError } from "@/lib/apiClient";
import type { GroupDetail } from "@/lib/allocation/groupService";
import { CalculationPanel } from "@/components/allocation/CalculationPanel";
import { AllocationMatrix } from "@/components/allocation/AllocationMatrix";
import { ClusterConfigPanel } from "@/components/allocation/ClusterConfigPanel";
import { ValidationPanel } from "@/components/allocation/ValidationPanel";
import { ReportsPanel } from "@/components/allocation/ReportsPanel";

export default function AllocationGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const toast = useToast();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<GroupDetail>(`/api/allocation/groups/${groupId}`);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load allocation group");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function revalidate() {
    try {
      await apiGet(`/api/allocation/groups/${groupId}/validate`);
    } catch {
      // validation errors are surfaced via the panel, not a toast
    }
    await load();
  }

  const readOnly = detail?.status === "FINALIZED";

  async function handleSaveCapacity(capacity: number) {
    try {
      await apiPatch(`/api/allocation/groups/${groupId}/capacity`, { sectionCapacity: capacity });
      toast.success("Section capacity updated");
      await revalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update capacity");
    }
  }

  async function handleSaveClusters(cluster1Sections: number | null) {
    try {
      await apiPatch(`/api/allocation/groups/${groupId}/clusters`, { cluster1Sections });
      toast.success("Cluster split updated");
      await revalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update clusters");
    }
  }

  async function handleSaveRules(rules: { unit: string; specialization: string; cluster: 1 | 2 }[]) {
    try {
      await apiPut(`/api/allocation/groups/${groupId}/specialization-rules`, { rules });
      toast.success("Specialization mapping saved");
      await revalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save specialization mapping");
    }
  }

  async function handleEditCell(unit: string, sectionNumber: number, studentCount: number) {
    try {
      await apiPatch(`/api/allocation/groups/${groupId}/matrix`, { unit, sectionNumber, studentCount });
      await revalidate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update cell");
      await load();
    }
  }

  async function handleFinalize() {
    setBusy(true);
    try {
      await apiPost(`/api/allocation/groups/${groupId}/finalize`, {});
      toast.success("Allocation finalized");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to finalize");
    } finally {
      setBusy(false);
      setConfirmFinalize(false);
    }
  }

  async function handleReopen() {
    setBusy(true);
    try {
      await apiPost(`/api/allocation/groups/${groupId}/reopen`, {});
      toast.success("Allocation reopened");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to reopen");
    } finally {
      setBusy(false);
      setConfirmReopen(false);
    }
  }

  if (loading) return <LoadingState label="Loading allocation group..." />;
  if (error || !detail) return <ErrorState message={error ?? "Not found"} />;

  return (
    <div>
      <Link href="/admin/allocation" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> Back to Allocation Dashboard
      </Link>

      <PageHeader
        title={`${detail.course.courseCategory.code} | ${detail.course.courseName}`}
        description={`${detail.course.courseCode} · ${detail.course.regulation.code} · ${detail.course.semester.name} · Category: ${detail.course.courseCategory.name}`}
        actions={
          <>
            <AllocationStatusBadge status={detail.status} />
            {detail.status === "FINALIZED" ? (
              <Button variant="secondary" onClick={() => setConfirmReopen(true)}>
                <RotateCcw size={15} /> Reopen
              </Button>
            ) : (
              <Button onClick={() => setConfirmFinalize(true)} disabled={!detail.validation.isValid}>
                <Lock size={15} /> Finalize
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Total Students</p>
          <p className="text-2xl font-semibold text-slate-900">{detail.grandTotal}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Section Capacity / Required Sections</p>
          <p className="text-2xl font-semibold text-slate-900">
            {detail.sectionCapacity} / {detail.requiredSections}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Clusters</p>
          <p className="text-sm font-medium text-slate-900">
            C1: {detail.clusters.ranges.cluster1.count > 0 ? `S${detail.clusters.ranges.cluster1.start}-S${detail.clusters.ranges.cluster1.end}` : "—"}
            {"  ·  "}
            C2: {detail.clusters.ranges.cluster2.count > 0 ? `S${detail.clusters.ranges.cluster2.start}-S${detail.clusters.ranges.cluster2.end}` : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Section Capacity, Clusters &amp; Specialization Mapping</h2>
        <ClusterConfigPanel
          detail={detail}
          readOnly={Boolean(readOnly)}
          onSaveCapacity={handleSaveCapacity}
          onSaveClusters={handleSaveClusters}
          onSaveRules={handleSaveRules}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Live Calculation</h2>
          <CalculationPanel detail={detail} />
        </div>
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Section Allocation Matrix</h2>
          <AllocationMatrix detail={detail} readOnly={Boolean(readOnly)} onEditCell={handleEditCell} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-4">
        <ValidationPanel validation={detail.validation} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Reports</h2>
        <ReportsPanel groupId={detail.groupId} />
      </div>

      <ConfirmDialog
        open={confirmFinalize}
        title="Finalize Allocation"
        description={`This will lock "${detail.course.courseCode} — ${detail.course.courseName}" as read-only. All ${detail.requiredSections} sections and ${detail.grandTotal} students will be snapshotted. Continue?`}
        confirmLabel="Finalize"
        destructive={false}
        loading={busy}
        onConfirm={handleFinalize}
        onCancel={() => setConfirmFinalize(false)}
      />

      <ConfirmDialog
        open={confirmReopen}
        title="Reopen Allocation"
        description="This allocation will become editable again. It will need to be finalized again once changes are made."
        confirmLabel="Reopen"
        destructive
        loading={busy}
        onConfirm={handleReopen}
        onCancel={() => setConfirmReopen(false)}
      />
    </div>
  );
}
