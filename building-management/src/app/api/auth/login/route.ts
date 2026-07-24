import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { handle } from "@/lib/api";
import type { Role } from "@/lib/enums";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "יש להזין אימייל וסיסמה" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      include: { resident: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "אימייל או סיסמה שגויים" },
        { status: 401 }
      );
    }

    await createSession({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      buildingId: user.buildingId,
      residentId: user.resident?.id ?? null,
    });

    return { ok: true, role: user.role };
  });
}
