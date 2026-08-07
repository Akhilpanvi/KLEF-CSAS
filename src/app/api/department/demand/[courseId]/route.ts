import { NextRequest } from "next/server";
import { z } from "zod";
import { Course } from "@/models/Course";
import { CourseDemand } from "@/models/CourseDemand";
// Side-effect imports: ensure populate()'d ref models are registered regardless of request order.
import "@/models/CourseCategory";
import "@/models/Regulation";
import "@/models/Semester";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";
import { requireSession, requireRole } from "@/lib/auth/session";

async function findOfferedCourse(courseId: string, departmentId: string) {
  return Course.findOne({
    _id: courseId,
    status: "Active",
    $or: [{ offeredByDepartment: departmentId }, { offeredToDepartments: departmentId }],
  })
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
    if (!course) return fail("Course not found or not visible to your department", 404);

    const demand = await CourseDemand.findOne({
      course: courseId,
      department: session.department,
      regulation: course.regulation,
      semester: course.semester,
    });

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
      totalStudents: demand?.totalStudents ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const saveSchema = z.object({
  totalStudents: z.coerce.number().int().min(0, "Must be 0 or more"),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await requireSession();
    requireRole(session, "DEPARTMENT_USER");
    await dbConnect();
    const { courseId } = await ctx.params;
    const { totalStudents } = saveSchema.parse(await req.json());

    const course = await findOfferedCourse(courseId, session.department as string);
    if (!course) return fail("Course not found or not visible to your department", 404);

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

    demand.totalStudents = totalStudents;
    await demand.save();

    return ok({ demandId: String(demand._id), status: demand.status, totalStudents: demand.totalStudents });
  } catch (err) {
    return handleApiError(err);
  }
}
