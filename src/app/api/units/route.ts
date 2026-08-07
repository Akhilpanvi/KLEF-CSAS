import { NextRequest } from "next/server";
import type { QueryFilter } from "mongoose";
import { Unit, type UnitDoc } from "@/models/Unit";
import { unitInputSchema } from "@/lib/validation/schemas";
import { dbConnect } from "@/lib/db/connect";
import { ok, handleApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const parentDepartment = searchParams.get("parentDepartment");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(searchParams.get("pageSize") ?? 100) || 100));

    const filter: QueryFilter<UnitDoc> = {};
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    if (parentDepartment) filter.parentDepartment = parentDepartment as never;
    if (q) {
      filter.$or = [
        { code: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Unit.find(filter)
        .populate("parentDepartment", "code name isActive")
        .sort({ code: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Unit.countDocuments(filter),
    ]);

    return ok({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const parsed = unitInputSchema.parse(body);
    const created = await Unit.create(parsed);
    const populated = await created.populate("parentDepartment", "code name isActive");
    return ok(populated, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
