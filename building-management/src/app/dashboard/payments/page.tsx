import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope } from "@/lib/api";
import { PaymentsClient } from "./payments-client";

export default async function PaymentsPage() {
  const user = (await getSession())!;

  const where: Record<string, unknown> = {};
  if (user.role === "RESIDENT") {
    where.residentId = user.residentId ?? "__none__";
  } else if (user.role === "COMMITTEE") {
    where.resident = buildingScope(user);
  }

  const [payments, residents, openCharges] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { date: "desc" },
      take: 300,
      include: {
        resident: {
          select: { fullName: true, unit: { select: { number: true } } },
        },
        charge: { select: { description: true } },
      },
    }),
    user.role === "RESIDENT"
      ? Promise.resolve([])
      : prisma.resident.findMany({
          where: { ...buildingScope(user), active: true },
          select: { id: true, fullName: true },
          orderBy: { fullName: "asc" },
        }),
    user.role === "RESIDENT"
      ? Promise.resolve([])
      : prisma.charge.findMany({
          where: {
            ...buildingScope(user),
            status: { in: ["OPEN", "PARTIAL", "OVERDUE"] },
          },
          orderBy: { dueDate: "asc" },
          select: {
            id: true,
            residentId: true,
            description: true,
            amount: true,
            payments: { select: { amount: true } },
          },
        }),
  ]);

  return (
    <PaymentsClient
      isManager={user.role !== "RESIDENT"}
      residents={residents}
      openCharges={openCharges.map((c) => ({
        id: c.id,
        residentId: c.residentId,
        description: c.description ?? "דרישת תשלום",
        remaining: c.amount - c.payments.reduce((s, p) => s + p.amount, 0),
      }))}
      payments={payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.date.toISOString(),
        method: p.method,
        reference: p.reference,
        note: p.note,
        residentName: p.resident.fullName,
        unitNumber: p.resident.unit?.number ?? null,
        chargeDescription: p.charge?.description ?? null,
      }))}
    />
  );
}
