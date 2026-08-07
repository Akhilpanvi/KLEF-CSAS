import { NextRequest } from "next/server";
import { z } from "zod";
import { Course } from "@/models/Course";
import { Unit } from "@/models/Unit";
import { CourseDemand } from "@/models/CourseDemand";
import { CourseDemandItem } from "@/models/CourseDemandItem";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/CourseCategory";
import "@/models/Regulation";
import "@/models/Semester";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

async function findOfferedCourse(courseId: string, departmentId: string) {
  return Course.findOne({ _id: courseId, status: "Active", offeredToDepartments: departmentId })
    .populate("courseCategory", "code name isActive")
    .populate("regulation", "code name isActive")
    .populate("semester", "number name isActive");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();
    const { courseId } = await ctx.params;

    const course = await findOfferedCourse(courseId, session.department as string);
    if (!course) return fail("Course not found or not offered to your department", 404);

    const units = await Unit.find({ parentDepartment: session.department, isActive: true }).sort({ code: 1 }).lean();

    const demand = await CourseDemand.findOne({
      course: courseId,
      department: session.department,
      regulation: course.regulation,
      semester: course.semester,
    });
    const items = demand ? await CourseDemandItem.find({ demand: demand._id }).lean() : [];
    const countByUnit = new Map(items.map((i) => [String(i.unit), i.studentCount]));

    return ok({
      demandId: demand ? String(demand._id) : null,
      status: demand?.status ?? "PENDING",
      course: {
        _id: String(course._id),
        courseCode: course.courseCode,
        courseName: course.courseName,
        courseCategory: course.courseCategory,
        regulation: course.regulation,
        semester: course.semester,
      },
      units: units.map((u) => ({ _id: String(u._id), code: u.code, name: u.name })),
      items: units.map((u) => ({ unit: String(u._id), studentCount: countByUnit.get(String(u._id)) ?? 0 })),
      totalStudents: demand?.totalStudents ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const saveSchema = z.object({
  items: z.array(
    z.object({
      unit: z.string().regex(/^[0-9a-fA-F]{24}$/),
      studentCount: z.coerce.number().int().min(0, "Must be 0 or more"),
    }),
  ),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();
    const { courseId } = await ctx.params;
    const { items } = saveSchema.parse(await req.json());

    const course = await findOfferedCourse(courseId, session.department as string);
    if (!course) return fail("Course not found or not offered to your department", 404);

    const validUnits = await Unit.find({ parentDepartment: session.department, isActive: true }, { _id: 1 }).lean();
    const validUnitIds = new Set(validUnits.map((u) => String(u._id)));
    for (const item of items) {
      if (!validUnitIds.has(item.unit)) return fail("One or more units do not belong to your department", 422);
    }

    let demand = await CourseDemand.findOne({
      course: courseId,
      department: session.department,
      regulation: course.regulation,
      semester: course.semester,
    });
    if (demand && demand.status === "SUBMITTED") {
      return fail("Submitted demand cannot be edited. Ask a Timetable Admin to reopen it.", 409);
    }
    if (!demand) {
      demand = await CourseDemand.create({
        course: courseId,
        department: session.department,
        regulation: course.regulation,
        semester: course.semester,
        courseCategory: course.courseCategory,
        status: "DRAFT",
      });
    }

    await Promise.all(
      items.map((i) =>
        CourseDemandItem.findOneAndUpdate(
          { demand: demand!._id, unit: i.unit },
          { studentCount: i.studentCount },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        ),
      ),
    );

    // Recompute from all saved items (not just this payload) so totals stay correct
    // even if a caller sends a partial unit set.
    const allItems = await CourseDemandItem.find({ demand: demand._id }, { studentCount: 1 }).lean();
    demand.totalStudents = allItems.reduce((sum, i) => sum + i.studentCount, 0);
    await demand.save();

    return ok({ demandId: String(demand._id), status: demand.status, totalStudents: demand.totalStudents });
  } catch (err) {
    return handleApiError(err);
  }
}
