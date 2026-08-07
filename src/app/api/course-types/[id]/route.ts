import { CourseType } from "@/models";
import { courseTypeInputSchema } from "@/lib/validation/schemas";
import { createMasterItemHandlers } from "@/lib/api/masterCrud";

export const { GET, PATCH } = createMasterItemHandlers(CourseType, courseTypeInputSchema);
