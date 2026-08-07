import {
  LayoutDashboard,
  BookOpen,
  Building2,
  Tags,
  FileStack,
  CalendarRange,
  ClipboardList,
  Send,
  Layers3,
  Grid3x3,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN"];

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ADMIN_ROLES },
  { href: "/courses", label: "Course Master", icon: BookOpen, roles: ADMIN_ROLES },
  { href: "/departments", label: "Departments", icon: Building2, roles: ADMIN_ROLES },
  { href: "/course-categories", label: "Course Categories", icon: Tags, roles: ADMIN_ROLES },
  { href: "/regulations", label: "Regulations", icon: FileStack, roles: ADMIN_ROLES },
  { href: "/semesters", label: "Semesters", icon: CalendarRange, roles: ADMIN_ROLES },
  { href: "/department/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["DEPARTMENT_USER"] },
  { href: "/department/courses", label: "Course Definition", icon: BookOpen, roles: ["DEPARTMENT_USER"] },
  { href: "/department/demand", label: "Course Selection & Demand", icon: ClipboardList, roles: ["DEPARTMENT_USER"] },
  { href: "/department/submitted", label: "Submitted", icon: Send, roles: ["DEPARTMENT_USER"] },
  {
    href: "/admin/consolidated-demand",
    label: "Consolidated Demand",
    icon: Layers3,
    roles: ["SUPER_ADMIN", "TIMETABLE_ADMIN"],
  },
  {
    href: "/admin/allocation",
    label: "Allocation Dashboard",
    icon: Grid3x3,
    roles: ["SUPER_ADMIN", "TIMETABLE_ADMIN"],
  },
];

export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
