import { Semester } from "@/models";
import { semesterInputSchema } from "@/lib/validation/schemas";
import { createMasterItemHandlers } from "@/lib/api/masterCrud";

export const { GET, PATCH } = createMasterItemHandlers(Semester, semesterInputSchema);
