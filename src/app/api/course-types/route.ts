import { CourseType } from "@/models";
import { courseTypeInputSchema } from "@/lib/validation/schemas";
import { createMasterListHandlers } from "@/lib/api/masterCrud";

export const { GET, POST } = createMasterListHandlers(CourseType, courseTypeInputSchema, {
  searchFields: ["name"],
  defaultSort: { name: 1 },
});
