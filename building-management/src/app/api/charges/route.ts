import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole, buildingScope } from "@/lib/api";
import { computeChargeStatus } from "@/lib/finance";

// רשימת דרישות תשלום (דייר רואה רק את שלו)
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const status = req.nextUrl.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (user.role === "RESIDENT") {
      where.residentId = user.residentId ?? "__none__";
    } else if (user.role === "COMMITTEE") {
      Object.assign(where, buildingScope(user));
    }
    if (status) where.status = status;

    const charges = await prisma.charge.findMany({
      where,
      orderBy: { dueDate: "desc" },
      include: {
        resident: { select: { id: true, fullName: true, unit: { select: { number: true } } } },
        building: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    });

    return charges.map((c) => {
      const paid = c.payments.reduce((s, p) => s + p.amount, 0);
      const status = computeChargeStatus(c.amount, paid, c.dueDate);
      return {
        id: c.id,
        type: c.type,
        amount: c.amount,
        paid,
        remaining: Math.max(0, c.amount - paid),
        dueDate: c.dueDate,
        period: c.period,
        description: c.description,
        status,
        resident: c.resident,
        building: c.building,
      };
    });
  });
}

// יצירת דרישת תשלום בודדת
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const charge = await prisma.charge.create({
      data: {
        buildingId: body.buildingId,
        residentId: body.residentId,
        type: body.type || "SPECIAL",
        amount: Number(body.amount),
        dueDate: new Date(body.dueDate),
        period: body.period || null,
        description: body.description || null,
        status: "OPEN",
      },
    });
    return charge;
  });
}
