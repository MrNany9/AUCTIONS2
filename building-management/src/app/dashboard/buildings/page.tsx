import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingSelfScope } from "@/lib/api";
import { BuildingsClient } from "./buildings-client";

export default async function BuildingsPage() {
  const user = (await getSession())!;
  const where = buildingSelfScope(user);
  const buildings = await prisma.building.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { units: true, residents: true } } },
  });

  return (
    <BuildingsClient
      canCreate={user.role === "ADMIN"}
      buildings={buildings.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        numUnits: b.numUnits,
        monthlyFeePerUnit: b.monthlyFeePerUnit,
        notes: b.notes,
        unitCount: b._count.units,
        residentCount: b._count.residents,
      }))}
    />
  );
}
