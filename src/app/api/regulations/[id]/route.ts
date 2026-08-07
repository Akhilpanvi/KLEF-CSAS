import { Regulation } from "@/models";
import { regulationInputSchema } from "@/lib/validation/schemas";
import { createMasterItemHandlers } from "@/lib/api/masterCrud";

export const { GET, PATCH } = createMasterItemHandlers(Regulation, regulationInputSchema);
