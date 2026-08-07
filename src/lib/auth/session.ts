import { cookies } from "next/headers";
import { signSession, verifySession, type SessionPayload } from "./token";
import { AuthError } from "./errors";
import type { Role } from "./roles";

export const SESSION_COOKIE = "csas_session";

export async function createSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSessionUser();
  if (!session) throw new AuthError("Not authenticated", 401);
  return session;
}

export function requireRole(session: SessionPayload, ...roles: Role[]) {
  if (!roles.includes(session.role)) throw new AuthError("Forbidden", 403);
}
