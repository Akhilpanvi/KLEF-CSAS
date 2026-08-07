import { Department, Regulation, Semester, CourseCategory, CourseType } from "@/models";
import { dbConnect } from "@/lib/db/connect";
import { buildSampleCourseCsv } from "@/lib/csv/sample";

export async function GET() {
  let ctx: Parameters<typeof buildSampleCourseCsv>[0] = {};

  try {
    await dbConnect();
    const [regulation, semester, category, courseType, dept, otherDepts] = await Promise.all([
      Regulation.findOne({ isActive: true }).sort({ code: -1 }).lean(),
      Semester.findOne({ isActive: true }).sort({ number: -1 }).lean(),
      CourseCategory.findOne({ isActive: true, code: /^PEC/ }).lean(),
      CourseType.findOne({ isActive: true }).lean(),
      Department.findOne({ isActive: true }).sort({ code: 1 }).lean(),
      Department.find({ isActive: true }).sort({ code: 1 }).limit(3).lean(),
    ]);

    ctx = {
      regulationCode: regulation?.code,
      semesterNumber: semester?.number,
      categoryCode: category?.code,
      courseTypeName: courseType?.name,
      departmentCode: dept?.code,
      offeredToCodes: otherDepts.map((d) => d.code),
    };
  } catch {
    // DB not reachable yet (e.g. not seeded) — fall back to the static reference example.
  }

  const csv = buildSampleCourseCsv(ctx);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="course_master_sample.csv"',
    },
  });
}
