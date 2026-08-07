import { ok } from "@/lib/api-response";
import { destroySessionCookie } from "@/lib/auth/session";

export async function POST() {
  await destroySessionCookie();
  return ok(null);
}
