"use client";

import { useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DepartmentModal } from "@/components/master/DepartmentModal";
import { useMasterList } from "@/lib/hooks/useMasterList";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { apiPatch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { DepartmentDTO } from "@/types";

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentDTO | null>(null);
  const [toggling, setToggling] = useState<DepartmentDTO | null>(null);
  const toast = useToast();

  const { data, loading, error, refetch } = useMasterList<DepartmentDTO>("/api/departments", {
    q: debouncedSearch,
    status,
    page: String(page),
  });

  async function confirmToggle() {
    if (!toggling) return;
    try {
      await apiPatch(`/api/departments/${toggling._id}`, { isActive: !toggling.isActive });
      toast.success(`Department ${toggling.isActive ? "deactivated" : "activated"}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update department");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Manage parent departments such as CSE, CSIT, AIDS, ECE."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Department
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by code or name..." />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:w-40"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        {loading && <LoadingState label="Loading departments..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState
            title="No departments found"
            description="Add your first parent department to get started."
          />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{dept.code}</td>
                    <td className="px-4 py-3 text-slate-700">{dept.name}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{dept.description || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={dept.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(dept);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToggling(dept)}>
                          <Power size={14} /> {dept.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      <DepartmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
        department={editing}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? "Deactivate Department" : "Activate Department"}
        description={
          toggling?.isActive
            ? `"${toggling?.name}" will be hidden from new course selections. Existing courses referencing it are unaffected.`
            : `"${toggling?.name}" will become available for course selection again.`
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={Boolean(toggling?.isActive)}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
}
