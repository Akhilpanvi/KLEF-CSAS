import { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { Course, type CourseDoc } from "@/models/Course";
import { courseInputSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

const POPULATE_FIELDS: [string, string][] = [
  ["regulation", "code name isActive"],
  ["semester", "number name isActive"],
  ["courseCategory", "code name isActive"],
  ["courseType", "name isActive"],
  ["offeredByDepartment", "code name isActive"],
  ["offeredToDepartments", "code name isActive"],
];

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const regulation = searchParams.get("regulation");
    const semester = searchParams.get("semester");
    const department = searchParams.get("department");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? 20) || 20));

    const filter: QueryFilter<CourseDoc> = {};
    if (status && status !== "all") filter.status = status as CourseDoc["status"];
    if (category) filter.courseCategory = category as never;
    if (regulation) filter.regulation = regulation as never;
    if (semester) filter.semester = semester as never;

    // Module 1: a department login only manages courses it created itself —
    // ownership always comes from the session, never a client-supplied filter.
    if (session.role === "DEPARTMENT_USER") {
      filter.offeredByDepartment = session.department as never;
    } else if (department) {
      filter.$or = [
        { offeredByDepartment: department as never },
        { offeredToDepartments: department as never },
      ];
    }
    if (q) {
      const regex = { $regex: q, $options: "i" };
      const textFilter = [{ courseCode: regex }, { courseName: regex }, { courseCoordinatorName: regex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textFilter }];
        delete filter.$or;
      } else {
        filter.$or = textFilter;
      }
    }

    let query = Course.find(filter).sort({ createdAt: -1 });
    for (const [path, select] of POPULATE_FIELDS) query = query.populate(path, select);

    const [items, total] = await Promise.all([
      query
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return ok({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, "SUPER_ADMIN", "DEPARTMENT_USER");
    await dbConnect();
    const body = await req.json();
    const parsed = courseInputSchema.parse(body);

    // Offered By is never client-selectable for a department login — it is
    // always the authenticated department, to prevent one department from
    // creating a course on another department's behalf.
    if (session.role === "DEPARTMENT_USER") {
      parsed.offeredByDepartment = session.department as string;
    }

    const existing = await Course.findOne({ courseCode: parsed.courseCode.toUpperCase() });
    if (existing) return fail("Course code already exists", 409);

    const created = await Course.create(parsed);
    let populatedQuery = Course.findById(created._id);
    for (const [path, select] of POPULATE_FIELDS) populatedQuery = populatedQuery.populate(path, select);
    const populated = await populatedQuery;

    return ok(populated, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
