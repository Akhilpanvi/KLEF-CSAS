import { NextRequest } from "next/server";
import { Unit } from "@/models/Unit";
import { unitInputSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const item = await Unit.findById(id).populate("parentDepartment", "code name isActive");
    if (!item) return fail("Not found", 404);
    return ok(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = unitInputSchema.partial().parse(body);
    const updated = await Unit.findByIdAndUpdate(id, parsed, { returnDocument: "after", runValidators: true }).populate(
      "parentDepartment",
      "code name isActive",
    );
    if (!updated) return fail("Not found", 404);
    return ok(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
