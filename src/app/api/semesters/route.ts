import { Semester } from "@/models";
import { semesterInputSchema } from "@/lib/validation/schemas";
import { createMasterListHandlers } from "@/lib/api/masterCrud";

export const { GET, POST } = createMasterListHandlers(Semester, semesterInputSchema, {
  searchFields: ["name"],
  defaultSort: { number: 1 },
});
