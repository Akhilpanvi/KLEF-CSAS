"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getNavItems } from "@/lib/nav";
import type { SessionPayload } from "@/lib/auth/token";

export function MobileNav({ user }: { user: SessionPayload }) {
  const pathname = usePathname();
  const NAV_ITEMS = getNavItems(user.role);

  return (
    <div className="md:hidden sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex items-center h-14 px-4">
        <span className="font-semibold text-slate-900 text-sm">KLEF CSAS</span>
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
                active ? "bg-blue-50 text-blue-700" : "text-slate-600",
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
