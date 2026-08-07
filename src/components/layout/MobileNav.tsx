"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/courses", label: "Course Master" },
  { href: "/departments", label: "Departments" },
  { href: "/units", label: "Units" },
  { href: "/course-categories", label: "Categories" },
  { href: "/regulations", label: "Regulations" },
  { href: "/semesters", label: "Semesters" },
];

export function MobileNav() {
  const pathname = usePathname();

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
