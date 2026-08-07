import mongoose from "mongoose";
import { Department, Unit, CourseCategory, Regulation, Semester, CourseType, Course } from "../src/models";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/klef_csas";

type WithId<T> = T & { _id: mongoose.Types.ObjectId };

async function upsertMany<T extends { code?: string; name?: string; number?: number }>(
  model: mongoose.Model<T>,
  key: keyof T,
  docs: Partial<T>[],
): Promise<WithId<T>[]> {
  const results: WithId<T>[] = [];
  for (const doc of docs) {
    const filter = { [key]: doc[key] } as mongoose.QueryFilter<T>;
    const saved = await model.findOneAndUpdate(filter, doc, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });
    results.push(saved as unknown as WithId<T>);
  }
  return results;
}

async function main() {
  console.log(`Connecting to ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);

  console.log("Seeding departments...");
  const departments = await upsertMany(Department, "code", [
    { code: "CSE", name: "Computer Science and Engineering", isActive: true },
    { code: "CSIT", name: "Computer Science and Information Technology", isActive: true },
    { code: "AIDS", name: "Artificial Intelligence and Data Science", isActive: true },
    { code: "ECE", name: "Electronics and Communication Engineering", isActive: true },
  ]);
  const dept = Object.fromEntries(departments.map((d) => [d.code as string, d]));

  console.log("Seeding units...");
  const unitSeeds = [
    { code: "CSE-1", name: "CSE Section 1" },
    { code: "CSE-2", name: "CSE Section 2" },
    { code: "CSE-3", name: "CSE Section 3" },
    { code: "CSE-4", name: "CSE Section 4" },
    { code: "HTE", name: "Honors Track - Electronics" },
    { code: "HTR", name: "Honors Track - Robotics" },
    { code: "HTI", name: "Honors Track - IoT" },
  ];
  for (const u of unitSeeds) {
    await Unit.findOneAndUpdate(
      { code: u.code, parentDepartment: dept.CSE._id },
      { ...u, parentDepartment: dept.CSE._id, isActive: true },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  console.log("Seeding course categories...");
  const categories = await upsertMany(CourseCategory, "code", [
    { code: "BSC", name: "Basic Science Course", isActive: true },
    { code: "ESC", name: "Engineering Science Course", isActive: true },
    { code: "PCC", name: "Professional Core Course", isActive: true },
    { code: "PEC-1", name: "Professional Elective 1", isActive: true },
    { code: "PEC-2", name: "Professional Elective 2", isActive: true },
    { code: "PEC-3", name: "Professional Elective 3", isActive: true },
    { code: "PEC-4", name: "Professional Elective 4", isActive: true },
    { code: "PEC-5", name: "Professional Elective 5", isActive: true },
    { code: "OE-1", name: "Open Elective 1", isActive: true },
    { code: "OE-2", name: "Open Elective 2", isActive: true },
    { code: "AUC", name: "Audit Course", isActive: true },
  ]);
  const category = Object.fromEntries(categories.map((c) => [c.code as string, c]));

  console.log("Seeding regulations...");
  const regulations = await upsertMany(Regulation, "code", [{ code: "R-2024", name: "Regulation 2024", isActive: true }]);
  const regulation = regulations[0];

  console.log("Seeding semesters...");
  const semesters = await upsertMany(
    Semester,
    "number",
    Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Semester ${i + 1}`, isActive: true })),
  );
  const semester = Object.fromEntries(semesters.map((s) => [s.number as number, s]));

  console.log("Seeding course types...");
  const courseTypes = await upsertMany(CourseType, "name", [
    { name: "Theory", isActive: true },
    { name: "Lab", isActive: true },
    { name: "Theory cum Lab", isActive: true },
    { name: "Project", isActive: true },
    { name: "Mandatory Non-Credit Course", isActive: true },
  ]);
  const courseType = Object.fromEntries(courseTypes.map((t) => [t.name as string, t]));

  console.log("Seeding sample courses...");
  const sampleCourses = [
    {
      regulation: regulation._id,
      semester: semester[1]._id,
      courseCode: "23CS1101",
      courseName: "Engineering Mathematics I",
      courseCategory: category.BSC._id,
      L: 3,
      T: 1,
      P: 0,
      S: 0,
      contactHours: 4,
      credits: 4,
      courseType: courseType.Theory._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id, dept.CSIT._id, dept.AIDS._id, dept.ECE._id],
      courseCoordinatorName: "Dr Lakshmi Narayana",
      courseCoordinatorEmployeeId: "EMP101",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[2]._id,
      courseCode: "23CS2101",
      courseName: "Data Structures",
      courseCategory: category.PCC._id,
      L: 3,
      T: 0,
      P: 2,
      S: 0,
      contactHours: 5,
      credits: 4,
      courseType: courseType["Theory cum Lab"]._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id, dept.CSIT._id],
      courseCoordinatorName: "Dr Ramesh Kumar",
      courseCoordinatorEmployeeId: "EMP102",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[3]._id,
      courseCode: "23CS3101",
      courseName: "Database Management Systems",
      courseCategory: category.PCC._id,
      L: 3,
      T: 0,
      P: 2,
      S: 0,
      contactHours: 5,
      credits: 4,
      courseType: courseType["Theory cum Lab"]._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id, dept.CSIT._id, dept.AIDS._id],
      courseCoordinatorName: "Dr Sunitha Reddy",
      courseCoordinatorEmployeeId: "EMP103",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[4]._id,
      courseCode: "23CS4101",
      courseName: "Operating Systems",
      courseCategory: category.PCC._id,
      L: 3,
      T: 0,
      P: 0,
      S: 0,
      contactHours: 3,
      credits: 3,
      courseType: courseType.Theory._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id],
      courseCoordinatorName: "Dr Anil Varma",
      courseCoordinatorEmployeeId: "EMP104",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[5]._id,
      courseCode: "23CS5101",
      courseName: "Cloud Computing",
      courseCategory: category["PEC-4"]._id,
      L: 3,
      T: 0,
      P: 0,
      S: 0,
      contactHours: 3,
      credits: 3,
      courseType: courseType.Theory._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id, dept.CSIT._id, dept.AIDS._id],
      courseCoordinatorName: "Dr Example",
      courseCoordinatorEmployeeId: "EMP001",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[5]._id,
      courseCode: "23CS5102",
      courseName: "Machine Learning",
      courseCategory: category["PEC-3"]._id,
      L: 3,
      T: 0,
      P: 2,
      S: 0,
      contactHours: 5,
      credits: 4,
      courseType: courseType["Theory cum Lab"]._id,
      offeredByDepartment: dept.AIDS._id,
      offeredToDepartments: [dept.AIDS._id, dept.CSE._id, dept.CSIT._id],
      courseCoordinatorName: "Dr Sample Rao",
      courseCoordinatorEmployeeId: "EMP002",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[6]._id,
      courseCode: "23CS6101",
      courseName: "Blockchain Technologies",
      courseCategory: category["PEC-5"]._id,
      L: 3,
      T: 0,
      P: 0,
      S: 0,
      contactHours: 3,
      credits: 3,
      courseType: courseType.Theory._id,
      offeredByDepartment: dept.CSIT._id,
      offeredToDepartments: [dept.CSIT._id, dept.CSE._id],
      courseCoordinatorName: "Dr Priya Sharma",
      courseCoordinatorEmployeeId: "EMP105",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[6]._id,
      courseCode: "23EC6101",
      courseName: "VLSI Design",
      courseCategory: category["PEC-1"]._id,
      L: 3,
      T: 0,
      P: 0,
      S: 0,
      contactHours: 3,
      credits: 3,
      courseType: courseType.Theory._id,
      offeredByDepartment: dept.ECE._id,
      offeredToDepartments: [dept.ECE._id],
      courseCoordinatorName: "Dr Ganesh Rao",
      courseCoordinatorEmployeeId: "EMP106",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[1]._id,
      courseCode: "23HS1101",
      courseName: "Environmental Science",
      courseCategory: category.AUC._id,
      L: 2,
      T: 0,
      P: 0,
      S: 0,
      contactHours: 2,
      credits: 0,
      courseType: courseType["Mandatory Non-Credit Course"]._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id, dept.CSIT._id, dept.AIDS._id, dept.ECE._id],
      courseCoordinatorName: "Dr Meena Iyer",
      courseCoordinatorEmployeeId: "EMP107",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[7]._id,
      courseCode: "23CS7101",
      courseName: "Major Project Phase I",
      courseCategory: category.PCC._id,
      L: 0,
      T: 0,
      P: 6,
      S: 0,
      contactHours: 6,
      credits: 3,
      courseType: courseType.Project._id,
      offeredByDepartment: dept.CSE._id,
      offeredToDepartments: [dept.CSE._id],
      courseCoordinatorName: "Dr Vinay Kumar",
      courseCoordinatorEmployeeId: "EMP108",
      status: "Active",
    },
  ];

  for (const c of sampleCourses) {
    await Course.findOneAndUpdate({ courseCode: c.courseCode }, c, { upsert: true, setDefaultsOnInsert: true });
  }

  console.log("Seed complete.");
  console.log({
    departments: departments.length,
    categories: categories.length,
    regulations: regulations.length,
    semesters: semesters.length,
    courseTypes: courseTypes.length,
    courses: sampleCourses.length,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
