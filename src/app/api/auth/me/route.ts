import { ok, fail } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return fail("Not authenticated", 401);
  return ok(session);
}
