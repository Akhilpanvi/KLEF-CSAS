import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";
import { AuthError } from "@/lib/auth/errors";

export function ok<T>(data: T, init?: number): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function fail(error: string, status = 400, details?: unknown): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function handleApiError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof AuthError) {
    return fail(err.message, err.status);
  }
  if (err instanceof ZodError) {
    return fail("Validation failed", 422, err.flatten());
  }
  if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
    return fail("A record with this value already exists", 409, (err as { keyValue?: unknown }).keyValue);
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  return fail(message, 500);
}
