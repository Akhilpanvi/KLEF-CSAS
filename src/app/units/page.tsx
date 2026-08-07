"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UnitModal } from "@/components/master/UnitModal";
import { useMasterList } from "@/lib/hooks/useMasterList";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { UnitDTO, DepartmentDTO, PaginatedResult } from "@/types";

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("all");
  const [parentDepartment, setParentDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UnitDTO | null>(null);
  const [toggling, setToggling] = useState<UnitDTO | null>(null);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const toast = useToast();

  useEffect(() => {
    apiGet<PaginatedResult<DepartmentDTO>>("/api/departments?status=active&pageSize=500")
      .then((res) => setDepartments(res.items))
      .catch(() => setDepartments([]));
  }, []);

  const { data, loading, error, refetch } = useMasterList<UnitDTO>("/api/units", {
    q: debouncedSearch,
    status,
    parentDepartment: parentDepartment || undefined,
    page: String(page),
  });

  async function confirmToggle() {
    if (!toggling) return;
    try {
      await apiPatch(`/api/units/${toggling._id}`, { isActive: !toggling.isActive });
      toast.success(`Unit ${toggling.isActive ? "deactivated" : "activated"}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update unit");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Units"
        description="Manage sub-units under a parent department, e.g. CSE-1, CSE-2, HTE, HTR, HTI under CSE."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Unit
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by code or name..." />
          <div className="flex gap-2">
            <Select
              value={parentDepartment}
              onChange={(e) => {
                setParentDepartment(e.target.value);
                setPage(1);
              }}
              className="sm:w-48"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="sm:w-36"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        {loading && <LoadingState label="Loading units..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title="No units found"
            description={
              departments.length === 0
                ? "Add a parent department first, then create units under it."
                : "Add your first unit to get started."
            }
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Parent Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((unit) => {
                  const dept = typeof unit.parentDepartment === "string" ? null : unit.parentDepartment;
                  return (
                    <tr key={unit._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{unit.code}</td>
                      <td className="px-4 py-3 text-slate-700">{unit.name}</td>
                      <td className="px-4 py-3 text-slate-500">{dept ? `${dept.code} — ${dept.name}` : "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={unit.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(unit);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setToggling(unit)}>
                            <Power size={14} /> {unit.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && data && (
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </div>

      <UnitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        unit={editing}
        departments={departments}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? "Deactivate Unit" : "Activate Unit"}
        description={
          toggling?.isActive
            ? `"${toggling?.name}" will be deactivated.`
            : `"${toggling?.name}" will become active again.`
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={Boolean(toggling?.isActive)}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
