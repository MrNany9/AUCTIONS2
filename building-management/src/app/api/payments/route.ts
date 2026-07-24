import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole, buildingScope } from "@/lib/api";
import { syncChargeStatus } from "@/lib/finance";

// רשימת תשלומים (דייר רואה רק את שלו)
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const where: Record<string, unknown> = {};
    if (user.role === "RESIDENT") {
      where.residentId = user.residentId ?? "__none__";
    } else if (user.role === "COMMITTEE") {
      where.resident = buildingScope(user);
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        resident: {
          select: { id: true, fullName: true, unit: { select: { number: true } } },
        },
        charge: { select: { id: true, description: true, period: true } },
      },
    });
    return payments;
  });
}

// רישום תשלום (מנהל/ועד). מסנכרן את סטטוס הדרישה המקושרת.
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();

    const payment = await prisma.payment.create({
      data: {
        residentId: body.residentId,
        chargeId: body.chargeId || null,
        amount: Number(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        method: body.method || "TRANSFER",
        reference: body.reference || null,
        note: body.note || null,
      },
    });

    if (payment.chargeId) {
      await syncChargeStatus(payment.chargeId);
    }
    return payment;
  });
}
