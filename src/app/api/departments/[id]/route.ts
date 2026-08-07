import { Department } from "@/models";
import { departmentInputSchema } from "@/lib/validation/schemas";
import { createMasterItemHandlers } from "@/lib/api/masterCrud";

export const { GET, PATCH } = createMasterItemHandlers(Department, departmentInputSchema);
