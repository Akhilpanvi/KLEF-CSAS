import { z } from "zod";

export const codeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(30, "Code must be 30 characters or fewer")
  .regex(/^[A-Za-z0-9_-]+$/, "Code may only contain letters, numbers, hyphens and underscores");

export const nameSchema = z.string().trim().min(1, "Name is required").max(150, "Name is too long");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const departmentInputSchema = z.object({
  code: codeSchema,
  name: nameSchema,
  description: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
});
export type DepartmentInput = z.infer<typeof departmentInputSchema>;

export const courseCategoryInputSchema = z.object({
  code: codeSchema,
  name: nameSchema,
  description: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
});
export type CourseCategoryInput = z.infer<typeof courseCategoryInputSchema>;

export const regulationInputSchema = z.object({
  code: codeSchema,
  name: z.string().trim().max(150).optional().default(""),
  isActive: z.boolean().optional().default(true),
});
export type RegulationInput = z.infer<typeof regulationInputSchema>;

export const semesterInputSchema = z.object({
  number: z.coerce.number().int().min(1, "Must be at least 1").max(20, "Must be 20 or fewer"),
  name: nameSchema,
  isActive: z.boolean().optional().default(true),
});
export type SemesterInput = z.infer<typeof semesterInputSchema>;

export const courseTypeInputSchema = z.object({
  name: nameSchema,
  isActive: z.boolean().optional().default(true),
});
export type CourseTypeInput = z.infer<typeof courseTypeInputSchema>;

export const COURSE_STATUS_VALUES = ["Active", "Inactive", "Archived"] as const;

export const courseInputSchema = z.object({
  regulation: objectIdSchema,
  semester: objectIdSchema,
  courseCode: codeSchema,
  courseName: nameSchema,
  courseCategory: objectIdSchema,
  L: z.coerce.number().min(0, "Must be 0 or more").max(20, "Value too large"),
  T: z.coerce.number().min(0, "Must be 0 or more").max(20, "Value too large"),
  P: z.coerce.number().min(0, "Must be 0 or more").max(20, "Value too large"),
  S: z.coerce.number().min(0, "Must be 0 or more").max(20, "Value too large"),
  contactHours: z.coerce.number().min(0, "Must be 0 or more").max(40, "Value too large"),
  credits: z.coerce.number().min(0, "Must be 0 or more").max(20, "Value too large"),
  courseType: objectIdSchema,
  offeredByDepartment: objectIdSchema,
  offeredToDepartments: z.array(objectIdSchema).min(1, "Select at least one offered-to department"),
  courseCoordinatorName: nameSchema,
  courseCoordinatorEmployeeId: z.string().trim().min(1, "Employee ID is required").max(30),
  status: z.enum(COURSE_STATUS_VALUES).optional().default("Active"),
});
export type CourseInput = z.infer<typeof courseInputSchema>;
