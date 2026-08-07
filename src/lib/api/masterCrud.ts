import { NextRequest } from "next/server";
import type { Model, QueryFilter } from "mongoose";
import type { ZodObject, ZodRawShape } from "zod";
import { dbConnect } from "@/lib/db/connect";
import { ok, fail, handleApiError } from "@/lib/api-response";

interface MasterCrudOptions {
  /** Fields searched (case-insensitive substring match) when ?q= is supplied. */
  searchFields: string[];
  defaultSort: Record<string, 1 | -1>;
}

/**
 * Generic list+create handlers shared by the small reference-data collections
 * (Department, CourseCategory, Regulation, Semester, CourseType). Unit has its
 * own route because it needs parentDepartment population/filtering.
 */
export function createMasterListHandlers<T>(
  model: Model<T>,
  schema: ZodObject<ZodRawShape>,
  opts: MasterCrudOptions,
) {
  async function GET(req: NextRequest) {
    try {
      await dbConnect();
      const { searchParams } = new URL(req.url);
      const q = searchParams.get("q")?.trim();
      const status = searchParams.get("status");
      const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
      const pageSize = Math.min(500, Math.max(1, Number(searchParams.get("pageSize") ?? 100) || 100));

      const filter: QueryFilter<T> = {} as QueryFilter<T>;
      if (status === "active") (filter as Record<string, unknown>).isActive = true;
      else if (status === "inactive") (filter as Record<string, unknown>).isActive = false;

      if (q) {
        (filter as Record<string, unknown>).$or = opts.searchFields.map((f) => ({
          [f]: { $regex: escapeRegex(q), $options: "i" },
        }));
      }

      const [items, total] = await Promise.all([
        model
          .find(filter)
          .sort(opts.defaultSort)
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        model.countDocuments(filter),
      ]);

      return ok({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    } catch (err) {
      return handleApiError(err);
    }
  }

  async function POST(req: NextRequest) {
    try {
      await dbConnect();
      const body = await req.json();
      const parsed = schema.parse(body);
      const created = await model.create(parsed as unknown as T);
      return ok(created, 201);
    } catch (err) {
      return handleApiError(err);
    }
  }

  return { GET, POST };
}

export function createMasterItemHandlers<T>(model: Model<T>, schema: ZodObject<ZodRawShape>) {
  async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      await dbConnect();
      const { id } = await ctx.params;
      const item = await model.findById(id);
      if (!item) return fail("Not found", 404);
      return ok(item);
    } catch (err) {
      return handleApiError(err);
    }
  }

  async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      await dbConnect();
      const { id } = await ctx.params;
      const body = await req.json();
      const parsed = schema.partial().parse(body);
      const updated = await model.findByIdAndUpdate(id, parsed, { returnDocument: "after", runValidators: true });
      if (!updated) return fail("Not found", 404);
      return ok(updated);
    } catch (err) {
      return handleApiError(err);
    }
  }

  return { GET, PATCH };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
