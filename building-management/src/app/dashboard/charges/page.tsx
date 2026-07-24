import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { computeChargeStatus } from "@/lib/finance";
import { ChargesClient } from "./charges-client";

export default async function ChargesPage() {
  const user = (await getSession())!;

  const where: Record<string, unknown> = {};
  if (user.role === "RESIDENT") {
    where.residentId = user.residentId ?? "__none__";
  } else {
    Object.assign(where, buildingScope(user));
  }

  const [charges, buildings, residents] = await Promise.all([
    prisma.charge.findMany({
      where,
      orderBy: { dueDate: "desc" },
      take: 300,
      include: {
        resident: {
          select: { fullName: true, unit: { select: { number: true } } },
        },
        building: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.building.findMany({
      where: buildingSelfScope(user),
      select: { id: true, name: true, monthlyFeePerUnit: true },
      orderBy: { name: "asc" },
    }),
    user.role === "RESIDENT"
      ? Promise.resolve([])
      : prisma.resident.findMany({
          where: { ...buildingScope(user), active: true },
          select: { id: true, fullName: true, buildingId: true },
          orderBy: { fullName: "asc" },
        }),
  ]);

  return (
    <ChargesClient
      isManager={user.role !== "RESIDENT"}
      buildings={buildings}
      residents={residents}
      charges={charges.map((c) => {
        const paid = c.payments.reduce((s, p) => s + p.amount, 0);
        return {
          id: c.id,
          type: c.type,
          amount: c.amount,
          paid,
          dueDate: c.dueDate.toISOString(),
          period: c.period,
          description: c.description,
          status: computeChargeStatus(c.amount, paid, c.dueDate),
          residentName: c.resident.fullName,
          unitNumber: c.resident.unit?.number ?? null,
          buildingName: c.building.name,
        };
      })}
    />
  );
}
