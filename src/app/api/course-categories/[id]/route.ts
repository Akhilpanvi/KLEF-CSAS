import { CourseCategory } from "@/models";
import { courseCategoryInputSchema } from "@/lib/validation/schemas";
import { createMasterItemHandlers } from "@/lib/api/masterCrud";

export const { GET, PATCH } = createMasterItemHandlers(CourseCategory, courseCategoryInputSchema);
