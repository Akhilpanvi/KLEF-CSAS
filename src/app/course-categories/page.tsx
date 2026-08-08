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
import { CourseCategoryModal } from "@/components/master/CourseCategoryModal";
import { useMasterList } from "@/lib/hooks/useMasterList";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { apiPatch } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";
import type { CourseCategoryDTO } from "@/types";

export default function CourseCategoriesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseCategoryDTO | null>(null);
  const [toggling, setToggling] = useState<CourseCategoryDTO | null>(null);
  const toast = useToast();

  const { data, loading, error, refetch } = useMasterList<CourseCategoryDTO>("/api/course-categories", {
    q: debouncedSearch,
    status,
    page: String(page),
  });

  async function confirmToggle() {
    if (!toggling) return;
    try {
      await apiPatch(`/api/course-categories/${toggling._id}`, { isActive: !toggling.isActive });
      toast.success(`Course category ${toggling.isActive ? "deactivated" : "activated"}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course category");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Course Categories"
        description="Manage course categories such as PCC, PEC-1..5, OE-1, OE-2, BSC, ESC, AUC."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> Add Category
          </Button>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
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

        {loading && <LoadingState label="Loading categories..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && data && data.items.length === 0 && (
          <EmptyState title="No course categories found" description="Add your first course category to get started." />
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{cat.code}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{cat.description || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={cat.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(cat);
                            setModalOpen(true);
                          }}
                        >
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToggling(cat)}>
                          <Power size={14} /> {cat.isActive ? "Deactivate" : "Activate"}
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
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        )}
      </div>

      <CourseCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={refetch} category={editing} />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.isActive ? "Deactivate Category" : "Activate Category"}
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
