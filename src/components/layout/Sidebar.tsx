"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  Layers,
  Tags,
  FileStack,
  CalendarRange,
  GraduationCap,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Course Master", icon: BookOpen },
  { href: "/departments", label: "Departments", icon: Building2 },
  { href: "/units", label: "Units", icon: Layers },
  { href: "/course-categories", label: "Course Categories", icon: Tags },
  { href: "/regulations", label: "Regulations", icon: FileStack },
  { href: "/semesters", label: "Semesters", icon: CalendarRange },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
          <GraduationCap size={20} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">KLEF CSAS</p>
          <p className="text-xs text-slate-500">Course Section Allocation</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon size={18} className={active ? "text-blue-600" : "text-slate-400"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 text-xs text-slate-400">
        Module 1 — Course Master Management
      </div>
    </aside>
  );
}
