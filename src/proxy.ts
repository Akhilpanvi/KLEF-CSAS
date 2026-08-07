import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/token";
import { SESSION_COOKIE } from "@/lib/auth/session";

const MODULE1_PREFIXES = ["/courses", "/departments", "/units", "/course-categories", "/regulations", "/semesters"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/department") && session.role !== "DEPARTMENT_USER") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/admin") && !["TIMETABLE_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (MODULE1_PREFIXES.some((p) => pathname.startsWith(p)) && !["SUPER_ADMIN", "COURSE_OWNER"].includes(session.role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname === "/") {
    if (session.role === "DEPARTMENT_USER") return NextResponse.redirect(new URL("/department/dashboard", req.url));
    if (session.role === "TIMETABLE_ADMIN") return NextResponse.redirect(new URL("/admin/consolidated-demand", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
