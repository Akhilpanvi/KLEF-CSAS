"use client";

import { useEffect, useState } from "react";
import { BookOpen, PencilLine, CheckCircle2, CircleDashed } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { apiGet } from "@/lib/apiClient";

interface Stats {
  totalAvailable: number;
  draft: number;
  submitted: number;
  pending: number;
}

export default function DepartmentDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Stats>("/api/department/dashboard/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" description="Your department's course demand at a glance." />

      {loading && <LoadingState label="Loading dashboard..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.totalAvailable}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Available Courses</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <PencilLine size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.draft}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Draft</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.submitted}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Submitted</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <CircleDashed size={20} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stats.pending}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
