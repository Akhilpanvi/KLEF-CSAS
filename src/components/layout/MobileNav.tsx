"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getNavItems } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { SessionPayload } from "@/lib/auth/token";

export function MobileNav({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const NAV_ITEMS = getNavItems(user.role);

  return (
    <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Image src="/logo-mark.png" alt="" width={28} height={28} unoptimized />
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">KLEF CSAS</span>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "whitespace-nowrap rounded-md px-3 py-1.5 font-medium",
                active ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
