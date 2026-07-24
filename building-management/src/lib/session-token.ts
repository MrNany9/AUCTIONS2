// Edge-safe session token helpers (usable from middleware). No Node-only deps.
import { jwtVerify } from "jose";
import type { Role } from "./enums";

export const SESSION_COOKIE = "vaad_session";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-please-change-in-production"
);

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  buildingId: string | null;
  residentId: string | null;
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as string,
      fullName: payload.fullName as string,
      email: payload.email as string,
      role: payload.role as Role,
      buildingId: (payload.buildingId as string) ?? null,
      residentId: (payload.residentId as string) ?? null,
    };
  } catch {
    return null;
  }
}
