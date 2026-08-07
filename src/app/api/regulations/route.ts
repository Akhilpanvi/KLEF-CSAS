import { Regulation } from "@/models";
import { regulationInputSchema } from "@/lib/validation/schemas";
import { createMasterListHandlers } from "@/lib/api/masterCrud";

export const { GET, POST } = createMasterListHandlers(Regulation, regulationInputSchema, {
  searchFields: ["code", "name"],
  defaultSort: { code: -1 },
});
