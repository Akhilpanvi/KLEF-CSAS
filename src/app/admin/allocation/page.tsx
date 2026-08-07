"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { AllocationStatusBadge } from "@/components/ui/Badge";
import { apiGet } from "@/lib/apiClient";
import type { GroupListRow } from "@/lib/allocation/groupService";

export default function AllocationDashboardPage() {
  const [rows, setRows] = useState<GroupListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: GroupListRow[] }>("/api/allocation/groups")
      .then((res) => setRows(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load allocation groups"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Allocation Dashboard"
        description="Allocation groups derived from submitted Module 2 demand — one group per Course."
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading && <LoadingState label="Loading allocation groups..." />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && rows.length === 0 && (
          <EmptyState title="No allocation groups yet" description="Submitted Module 2 demand will appear here as allocation groups." />
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Regulation</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Departments</th>
                  <th className="px-4 py-3">Total Students</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Sections</th>
                  <th className="px-4 py-3">Cluster 1</th>
                  <th className="px-4 py-3">Cluster 2</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.groupId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/allocation/${r.groupId}`} className="font-semibold text-blue-700 hover:underline">
                        {r.courseCategory.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.courseCode}</td>
                    <td className="px-4 py-3 text-slate-700">{r.courseName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.regulationCode}</td>
                    <td className="px-4 py-3 text-slate-500">{r.semesterName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.participatingDepartments.join(", ")}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.totalStudents}</td>
                    <td className="px-4 py-3 text-slate-500">{r.sectionCapacity}</td>
                    <td className="px-4 py-3 text-slate-500">{r.requiredSections}</td>
                    <td className="px-4 py-3 text-slate-500">{r.cluster1Sections}</td>
                    <td className="px-4 py-3 text-slate-500">{r.cluster2Sections}</td>
                    <td className="px-4 py-3">
                      <AllocationStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
