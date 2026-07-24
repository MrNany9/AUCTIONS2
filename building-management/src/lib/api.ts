import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";
import type { Role } from "./enums";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// מחזיר את המשתמש המחובר או זורק 401
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new ApiError(401, "לא מחובר");
  return user;
}

// מחייב תפקיד מסוים (או אחד מרשימה)
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "אין הרשאה לפעולה זו");
  }
  return user;
}

export function isManager(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.role === "COMMITTEE";
}

// מגביל שאילתות לפי תפקיד: ADMIN רואה הכל, COMMITTEE רק את הבניין שלו
export function buildingScope(user: SessionUser): { buildingId?: string } {
  if (user.role === "COMMITTEE" && user.buildingId) {
    return { buildingId: user.buildingId };
  }
  return {};
}

// כמו buildingScope אבל עבור מודל Building עצמו (סינון לפי id)
export function buildingSelfScope(user: SessionUser): { id?: string } {
  if (user.role === "COMMITTEE" && user.buildingId) {
    return { id: user.buildingId };
  }
  return {};
}

// עוטף handler ומתרגם ApiError לתשובת JSON מתאימה
export function handle(
  fn: () => Promise<NextResponse | unknown>
): Promise<NextResponse> {
  return (async () => {
    try {
      const result = await fn();
      if (result instanceof NextResponse) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json(
        { error: "שגיאת שרת פנימית" },
        { status: 500 }
      );
    }
  })();
}
