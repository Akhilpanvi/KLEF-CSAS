import mongoose from "mongoose";
import { Department, CourseCategory, Regulation, Semester, CourseType, Course, User } from "../src/models";
import { hashPassword } from "../src/lib/auth/password";

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

  // CSE-1/2/3/4, HTE/HTR/HTI etc. are independent departments — never a
  // sub-unit of a parent "CSE" or "HT" department.
  console.log("Seeding departments...");
  const departments = await upsertMany(Department, "code", [
    { code: "CSE-1", name: "Computer Science and Engineering - 1", isActive: true },
    { code: "CSE-2", name: "Computer Science and Engineering - 2", isActive: true },
    { code: "CSE-3", name: "Computer Science and Engineering - 3", isActive: true },
    { code: "CSE-4", name: "Computer Science and Engineering - 4", isActive: true },
    { code: "ECE", name: "Electronics and Communication Engineering", isActive: true },
    { code: "CSIT", name: "Computer Science and Information Technology", isActive: true },
    { code: "AIDS", name: "Artificial Intelligence and Data Science", isActive: true },
    { code: "HTE", name: "Honors Track - Electronics", isActive: true },
    { code: "HTR", name: "Honors Track - Robotics", isActive: true },
    { code: "HTI", name: "Honors Track - IoT", isActive: true },
  ]);
  const dept = Object.fromEntries(departments.map((d) => [d.code as string, d]));

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

  console.log("Seeding users...");
  const DEMO_PASSWORD = "Password123!";
  const passwordHash = hashPassword(DEMO_PASSWORD);
  // Admin accounts use named-person emails; department accounts use a
  // predictable hod.<department-code>@kluniversity.in pattern — one login
  // per department, shared by Module 1 (course definition) and Module 2
  // (course selection + demand).
  const userSeeds = [
    { name: "Dr. Ramesh Babu", email: "ramesh.babu@kluniversity.in", role: "SUPER_ADMIN" as const },
    { name: "Dr. Lakshmi Priya", email: "lakshmi.priya@kluniversity.in", role: "TIMETABLE_ADMIN" as const },
    ...departments.map((d) => ({
      name: `HOD - ${d.name}`,
      email: `hod.${(d.code as string).toLowerCase().replace(/-/g, "")}@kluniversity.in`,
      role: "DEPARTMENT_USER" as const,
      department: d._id,
    })),
  ];
  for (const u of userSeeds) {
    await User.findOneAndUpdate({ email: u.email }, { ...u, passwordHash, isActive: true }, { upsert: true, setDefaultsOnInsert: true });
  }

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
      offeredByDepartment: dept["CSE-1"]._id,
      offeredToDepartments: [
        dept["CSE-2"]._id,
        dept["CSE-3"]._id,
        dept["CSE-4"]._id,
        dept.ECE._id,
        dept.CSIT._id,
        dept.AIDS._id,
      ],
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
      offeredByDepartment: dept["CSE-1"]._id,
      offeredToDepartments: [dept["CSE-2"]._id, dept["CSE-3"]._id, dept["CSE-4"]._id, dept.CSIT._id],
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
      offeredByDepartment: dept.CSIT._id,
      offeredToDepartments: [dept["CSE-1"]._id, dept["CSE-2"]._id, dept["CSE-3"]._id, dept["CSE-4"]._id, dept.AIDS._id],
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
      offeredByDepartment: dept["CSE-2"]._id,
      offeredToDepartments: [dept["CSE-1"]._id, dept["CSE-3"]._id, dept["CSE-4"]._id],
      courseCoordinatorName: "Dr Anil Varma",
      courseCoordinatorEmployeeId: "EMP104",
      status: "Active",
    },
    // Same category (PEC-4) as the Data Mining course below, but a different
    // course — the two MUST stay in separate Module 3 allocation groups.
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
      offeredByDepartment: dept["CSE-3"]._id,
      offeredToDepartments: [dept["CSE-1"]._id, dept["CSE-2"]._id, dept["CSE-4"]._id, dept.AIDS._id],
      courseCoordinatorName: "Dr Example",
      courseCoordinatorEmployeeId: "EMP001",
      status: "Active",
    },
    {
      regulation: regulation._id,
      semester: semester[5]._id,
      courseCode: "23AI5102",
      courseName: "Data Mining",
      courseCategory: category["PEC-4"]._id,
      L: 3,
      T: 0,
      P: 2,
      S: 0,
      contactHours: 5,
      credits: 4,
      courseType: courseType["Theory cum Lab"]._id,
      offeredByDepartment: dept.AIDS._id,
      offeredToDepartments: [dept["CSE-1"]._id, dept["CSE-2"]._id, dept.CSIT._id],
      courseCoordinatorName: "Dr Sample Rao",
      courseCoordinatorEmployeeId: "EMP002",
      status: "Active",
    },
    // Matches the spec's worked example: one course offered by CSIT to four
    // CSE departments plus AIDS and ECE, each submitting an independent count
    // that Module 3 combines because it's the same course.
    {
      regulation: regulation._id,
      semester: semester[6]._id,
      courseCode: "23IT6101",
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
      offeredToDepartments: [dept["CSE-1"]._id, dept["CSE-2"]._id, dept["CSE-3"]._id, dept["CSE-4"]._id, dept.AIDS._id, dept.ECE._id],
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
      offeredToDepartments: [dept["CSE-1"]._id],
      courseCoordinatorName: "Dr Ganesh Rao",
      courseCoordinatorEmployeeId: "EMP106",
      status: "Active",
    },
    // HTE/HTR/HTI are independent departments (not children of CSE/AIDS/ECE);
    // this course is offered by one of them but is visible to CSE-1 too.
    {
      regulation: regulation._id,
      semester: semester[6]._id,
      courseCode: "23HT6101",
      courseName: "Cyber Security Fundamentals",
      courseCategory: category["PEC-2"]._id,
      L: 2,
      T: 0,
      P: 2,
      S: 0,
      contactHours: 4,
      credits: 3,
      courseType: courseType["Theory cum Lab"]._id,
      offeredByDepartment: dept.HTE._id,
      offeredToDepartments: [dept.HTR._id, dept.HTI._id, dept["CSE-1"]._id],
      courseCoordinatorName: "Dr Meena Iyer",
      courseCoordinatorEmployeeId: "EMP107",
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
      offeredByDepartment: dept["CSE-1"]._id,
      offeredToDepartments: [dept["CSE-2"]._id, dept["CSE-3"]._id, dept["CSE-4"]._id, dept.CSIT._id, dept.AIDS._id, dept.ECE._id],
      courseCoordinatorName: "Dr Meena Iyer",
      courseCoordinatorEmployeeId: "EMP108",
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
      offeredByDepartment: dept["CSE-1"]._id,
      offeredToDepartments: [dept["CSE-2"]._id],
      courseCoordinatorName: "Dr Vinay Kumar",
      courseCoordinatorEmployeeId: "EMP109",
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
    users: userSeeds.length,
  });
  console.log(`Demo login password for all seeded users: ${DEMO_PASSWORD}`);
  console.log(userSeeds.map((u) => `${u.role}: ${u.email}`).join("\n"));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
