"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getNavItems } from "@/lib/nav";
import { LogoutButton } from "./LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { SessionPayload } from "@/lib/auth/token";

export function Sidebar({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const NAV_ITEMS = getNavItems(user.role);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        <Image src="/logo-mark.png" alt="" width={36} height={36} unoptimized className="shrink-0" />

        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">KLEF CSAS</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Course Section Allocation</p>
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
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100",
              )}
            >
              <Icon size={18} className={active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {user.role.replace("_", " ")}
              {user.departmentCode ? ` — ${user.departmentCode}` : ""}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
