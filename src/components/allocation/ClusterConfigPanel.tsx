"use client";

import { useEffect, useState } from "react";
import { Input, Select, FieldWrapper } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import type { GroupDetail } from "@/lib/allocation/groupService";

export function ClusterConfigPanel({
  detail,
  readOnly,
  onSaveCapacity,
  onSaveClusters,
  onSaveRules,
}: {
  detail: GroupDetail;
  readOnly: boolean;
  onSaveCapacity: (capacity: number) => Promise<void>;
  onSaveClusters: (cluster1Sections: number | null) => Promise<void>;
  onSaveRules: (rules: { unit: string; specialization: string; cluster: 1 | 2 }[]) => Promise<void>;
}) {
  const [capacity, setCapacity] = useState(String(detail.sectionCapacity));
  const [cluster1, setCluster1] = useState(String(detail.clusters.cluster1Sections));
  const [rules, setRules] = useState(
    detail.demandRows.map((r) => {
      const existing = detail.specializationRules.find((sr) => sr.unitId === r.unitId);
      return {
        unitId: r.unitId,
        unitCode: r.unitCode,
        specialization: existing?.specialization ?? r.unitCode,
        // null = not yet configured — spreads across all sections rather than
        // being silently pinned to a cluster just because the row was rendered.
        cluster: (existing?.cluster ?? null) as 1 | 2 | null,
      };
    }),
  );
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [savingClusters, setSavingClusters] = useState(false);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    setCapacity(String(detail.sectionCapacity));
    setCluster1(String(detail.clusters.cluster1Sections));
    setRules(
      detail.demandRows.map((r) => {
        const existing = detail.specializationRules.find((sr) => sr.unitId === r.unitId);
        return {
          unitId: r.unitId,
          unitCode: r.unitCode,
          specialization: existing?.specialization ?? r.unitCode,
          cluster: (existing?.cluster ?? null) as 1 | 2 | null,
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.groupId, detail.sectionCapacity, detail.clusters.cluster1Sections, detail.specializationRules.length]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-4">
        <FieldWrapper
          label="Section Capacity"
          htmlFor="capacity"
          hint="Required sections recalculate immediately when this changes. Any manual matrix edits are cleared, since they were computed for the old section count."
        >
          <div className="flex gap-2">
            <Input id="capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={readOnly} />
            <Button
              size="sm"
              disabled={readOnly}
              loading={savingCapacity}
              onClick={async () => {
                setSavingCapacity(true);
                try {
                  await onSaveCapacity(Math.max(1, Number(capacity) || 1));
                } finally {
                  setSavingCapacity(false);
                }
              }}
            >
              Save
            </Button>
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Cluster 1 Sections"
          htmlFor="cluster1"
          hint={`Cluster 2 gets the remaining ${detail.requiredSections} - ${detail.clusters.cluster1Sections} = ${detail.clusters.cluster2Sections} sections. Default is a balanced 50:50 split.`}
        >
          <div className="flex gap-2">
            <Input
              id="cluster1"
              type="number"
              min={0}
              max={detail.requiredSections}
              value={cluster1}
              onChange={(e) => setCluster1(e.target.value)}
              disabled={readOnly}
            />
            <Button
              size="sm"
              disabled={readOnly}
              loading={savingClusters}
              onClick={async () => {
                setSavingClusters(true);
                try {
                  await onSaveClusters(Math.min(Math.max(0, Number(cluster1) || 0), detail.requiredSections));
                } finally {
                  setSavingClusters(false);
                }
              }}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={readOnly}
              onClick={async () => {
                setSavingClusters(true);
                try {
                  await onSaveClusters(null);
                } finally {
                  setSavingClusters(false);
                }
              }}
            >
              Reset to 50:50
            </Button>
          </div>
        </FieldWrapper>

        <p className="text-xs text-slate-500">
          Cluster 1: {detail.clusters.ranges.cluster1.count > 0 ? `S${detail.clusters.ranges.cluster1.start}-S${detail.clusters.ranges.cluster1.end}` : "—"}{" "}
          ({detail.clusters.cluster1Pct}%) &nbsp;·&nbsp; Cluster 2:{" "}
          {detail.clusters.ranges.cluster2.count > 0 ? `S${detail.clusters.ranges.cluster2.start}-S${detail.clusters.ranges.cluster2.end}` : "—"} (
          {detail.clusters.cluster2Pct}%)
        </p>
      </div>

      <div>
        <FieldWrapper
          label="Specialization → Cluster mapping"
          hint="Free-text label per unit (not a department). Unassigned units spread across all sections; assigning a cluster restricts that unit to its section range."
        >
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {rules.map((r, idx) => (
              <div key={r.unitId} className="flex items-center gap-2">
                <span className="w-16 text-xs text-slate-500 shrink-0">{r.unitCode}</span>
                <Input
                  value={r.specialization}
                  disabled={readOnly}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx] = { ...next[idx], specialization: e.target.value };
                    setRules(next);
                  }}
                  className="flex-1"
                />
                <div className="w-32 shrink-0">
                  <Select
                    value={r.cluster ?? ""}
                    disabled={readOnly}
                    onChange={(e) => {
                      const next = [...rules];
                      next[idx] = { ...next[idx], cluster: e.target.value ? (Number(e.target.value) as 1 | 2) : null };
                      setRules(next);
                    }}
                  >
                    <option value="">Unassigned</option>
                    <option value={1}>Cluster 1</option>
                    <option value={2}>Cluster 2</option>
                  </Select>
                </div>
              </div>
            ))}
            {rules.length === 0 && <p className="text-xs text-slate-400">No units with demand yet.</p>}
          </div>
        </FieldWrapper>
        <Button
          size="sm"
          className="mt-2"
          disabled={readOnly}
          loading={savingRules}
          onClick={async () => {
            setSavingRules(true);
            try {
              const configured = rules.filter((r): r is typeof r & { cluster: 1 | 2 } => r.cluster !== null);
              await onSaveRules(configured.map((r) => ({ unit: r.unitId, specialization: r.specialization, cluster: r.cluster })));
            } finally {
              setSavingRules(false);
            }
          }}
        >
          Save Specialization Mapping
        </Button>
      </div>
    </div>
  );
}
