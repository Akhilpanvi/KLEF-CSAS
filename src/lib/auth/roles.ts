export const ROLES = ["SUPER_ADMIN", "COURSE_OWNER", "DEPARTMENT_USER", "TIMETABLE_ADMIN"] as const;
export type Role = (typeof ROLES)[number];
