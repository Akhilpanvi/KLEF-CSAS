"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Building2, Tags, FileStack, CalendarRange, CheckCircle2, PauseCircle, Archive } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { apiGet } from "@/lib/apiClient";

interface DashboardStats {
  departments: number;
  activeDepartments: number;
  categories: number;
  regulations: number;
  semesters: number;
  courses: number;
  activeCourses: number;
  inactiveCourses: number;
  archivedCourses: number;
}

const MASTER_CARDS = [
  { key: "departments", label: "Departments", href: "/departments", icon: Building2, color: "text-blue-600 bg-blue-50" },
  { key: "categories", label: "Course Categories", href: "/course-categories", icon: Tags, color: "text-amber-600 bg-amber-50" },
  { key: "regulations", label: "Regulations", href: "/regulations", icon: FileStack, color: "text-rose-600 bg-rose-50" },
  { key: "semesters", label: "Semesters", href: "/semesters", icon: CalendarRange, color: "text-teal-600 bg-teal-50" },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardStats>("/api/dashboard/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of the course master and its supporting master data."
      />

      {loading && <LoadingState label="Loading dashboard..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/courses"
              className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.courses}</p>
                  <p className="text-sm text-slate-500">Total Courses</p>
                </div>
              </div>
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.activeCourses}</p>
                  <p className="text-sm text-slate-500">Active Courses</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <PauseCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.inactiveCourses}</p>
                  <p className="text-sm text-slate-500">Inactive Courses</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Archive size={20} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.archivedCourses}</p>
                  <p className="text-sm text-slate-500">Archived Courses</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Master Data</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {MASTER_CARDS.map(({ key, label, href, icon: Icon, color }) => (
                <Link
                  key={key}
                  href={href}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color} mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xl font-semibold text-slate-900">{stats[key]}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
