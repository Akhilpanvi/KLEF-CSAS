import { Department } from "@/models";
import { departmentInputSchema } from "@/lib/validation/schemas";
import { createMasterListHandlers } from "@/lib/api/masterCrud";

export const { GET, POST } = createMasterListHandlers(Department, departmentInputSchema, {
  searchFields: ["code", "name"],
  defaultSort: { name: 1 },
});
