import { CourseCategory } from "@/models";
import { courseCategoryInputSchema } from "@/lib/validation/schemas";
import { createMasterListHandlers } from "@/lib/api/masterCrud";

export const { GET, POST } = createMasterListHandlers(CourseCategory, courseCategoryInputSchema, {
  searchFields: ["code", "name"],
  defaultSort: { code: 1 },
});
