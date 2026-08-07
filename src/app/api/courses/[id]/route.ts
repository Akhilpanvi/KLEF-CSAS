import { NextRequest } from "next/server";
import { Course } from "@/models/Course";
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

async function findPopulated(id: string) {
  let query = Course.findById(id);
  for (const [path, select] of POPULATE_FIELDS) query = query.populate(path, select);
  return query;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const item = await findPopulated(id);
    if (!item) return fail("Not found", 404);
    return ok(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "SUPER_ADMIN", "DEPARTMENT_USER");
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = courseInputSchema.partial().parse(body);

    if (session.role === "DEPARTMENT_USER") {
      const existing = await Course.findById(id, { offeredByDepartment: 1 }).lean();
      if (!existing) return fail("Not found", 404);
      if (String(existing.offeredByDepartment) !== session.department) {
        return fail("You can only edit courses your department created", 403);
      }
      // Ownership is fixed at creation — a department login can't reassign it.
      delete parsed.offeredByDepartment;
    }

    if (parsed.courseCode) {
      const existing = await Course.findOne({ courseCode: parsed.courseCode.toUpperCase(), _id: { $ne: id } });
      if (existing) return fail("Course code already exists", 409);
    }

    const updated = await Course.findByIdAndUpdate(id, parsed, { returnDocument: "after", runValidators: true });
    if (!updated) return fail("Not found", 404);

    const populated = await findPopulated(id);
    return ok(populated);
  } catch (err) {
    return handleApiError(err);
  }
}

// Soft delete: archive rather than permanently remove the academic record.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "SUPER_ADMIN", "DEPARTMENT_USER");
    await dbConnect();
    const { id } = await ctx.params;

    if (session.role === "DEPARTMENT_USER") {
      const existing = await Course.findById(id, { offeredByDepartment: 1 }).lean();
      if (!existing) return fail("Not found", 404);
      if (String(existing.offeredByDepartment) !== session.department) {
        return fail("You can only archive courses your department created", 403);
      }
    }

    const updated = await Course.findByIdAndUpdate(id, { status: "Archived" }, { returnDocument: "after" });
    if (!updated) return fail("Not found", 404);
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
