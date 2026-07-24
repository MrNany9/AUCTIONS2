import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { ResidentsClient } from "./residents-client";

export default async function ResidentsPage() {
  const user = (await getSession())!;
  const scope = buildingScope(user);

  const [residents, buildings, units] = await Promise.all([
    prisma.resident.findMany({
      where: scope,
      orderBy: { fullName: "asc" },
      include: {
        unit: true,
        building: { select: { id: true, name: true } },
        charges: { select: { amount: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.building.findMany({
      where: buildingSelfScope(user),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.findMany({
      where: scope,
      select: { id: true, number: true, buildingId: true },
      orderBy: { number: "asc" },
    }),
  ]);

  return (
    <ResidentsClient
      buildings={buildings}
      units={units}
      residents={residents.map((r) => {
        const charged = r.charges.reduce((s, c) => s + c.amount, 0);
        const paid = r.payments.reduce((s, p) => s + p.amount, 0);
        return {
          id: r.id,
          fullName: r.fullName,
          phone: r.phone,
          phone2: r.phone2,
          email: r.email,
          idNumber: r.idNumber,
          isOwner: r.isOwner,
          isCommitteeRep: r.isCommitteeRep,
          collectionStatus: r.collectionStatus,
          standingOrder: r.standingOrder,
          chargeDay: r.chargeDay,
          leaseStart: r.leaseStart?.toISOString() ?? null,
          leaseEnd: r.leaseEnd?.toISOString() ?? null,
          active: r.active,
          unitNumber: r.unit?.number ?? null,
          unitId: r.unitId,
          buildingId: r.buildingId,
          buildingName: r.building.name,
          balance: charged - paid,
        };
      })}
    />
  );
}
