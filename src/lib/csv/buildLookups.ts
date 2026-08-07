import { Department, Regulation, Semester, CourseCategory, CourseType, Course } from "@/models";
import type { LookupEntry, MasterLookups } from "./validateCourseRows";

export async function buildMasterLookups(): Promise<MasterLookups> {
  const [departments, regulations, semesters, categories, courseTypes, existingCourses] = await Promise.all([
    Department.find({}, { code: 1, isActive: 1 }).lean(),
    Regulation.find({}, { code: 1, isActive: 1 }).lean(),
    Semester.find({}, { number: 1, isActive: 1 }).lean(),
    CourseCategory.find({}, { code: 1, isActive: 1 }).lean(),
    CourseType.find({}, { name: 1, isActive: 1 }).lean(),
    Course.find({}, { courseCode: 1 }).lean(),
  ]);

  const toMap = (items: { code: string; isActive: boolean; _id: unknown }[]) => {
    const map = new Map<string, LookupEntry>();
    for (const item of items) {
      map.set(item.code.toUpperCase(), { id: String(item._id), isActive: item.isActive });
    }
    return map;
  };

  const departmentMap = toMap(departments as { code: string; isActive: boolean; _id: unknown }[]);
  const regulationMap = toMap(regulations as { code: string; isActive: boolean; _id: unknown }[]);
  const categoryMap = toMap(categories as { code: string; isActive: boolean; _id: unknown }[]);

  const courseTypeMap = new Map<string, LookupEntry>();
  for (const ct of courseTypes as { name: string; isActive: boolean; _id: unknown }[]) {
    courseTypeMap.set(ct.name.toUpperCase(), { id: String(ct._id), isActive: ct.isActive });
  }

  const semesterMap = new Map<number, LookupEntry>();
  for (const sem of semesters as { number: number; isActive: boolean; _id: unknown }[]) {
    semesterMap.set(sem.number, { id: String(sem._id), isActive: sem.isActive });
  }

  const existingCourseCodes = new Set(
    (existingCourses as { courseCode: string }[]).map((c) => c.courseCode.toUpperCase()),
  );

  return {
    departments: departmentMap,
    regulations: regulationMap,
    categories: categoryMap,
    courseTypes: courseTypeMap,
    semesters: semesterMap,
    existingCourseCodes,
  };
}
