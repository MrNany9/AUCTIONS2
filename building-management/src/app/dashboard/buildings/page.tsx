import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingSelfScope } from "@/lib/api";
import { BuildingsClient } from "./buildings-client";

export default async function BuildingsPage() {
  const user = (await getSession())!;
  const where = buildingSelfScope(user);
  const [buildings, suppliers] = await Promise.all([
    prisma.building.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { units: true, residents: true } },
        residents: {
          where: { isCommitteeRep: true, active: true },
          select: {
            fullName: true,
            phone: true,
            unit: { select: { number: true } },
          },
        },
        serviceProviders: {
          include: {
            supplier: { select: { name: true, phone: true } },
          },
          orderBy: { trade: "asc" },
        },
      },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true, service: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <BuildingsClient
      canCreate={user.role === "ADMIN"}
      allSuppliers={suppliers}
      buildings={buildings.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        numUnits: b.numUnits,
        floors: b.floors,
        monthlyFeePerUnit: b.monthlyFeePerUnit,
        active: b.active,
        activeSince: b.activeSince?.toISOString() ?? null,
        contractStart: b.contractStart?.toISOString() ?? null,
        contractEnd: b.contractEnd?.toISOString() ?? null,
        contractor: b.contractor,
        notes: b.notes,
        unitCount: b._count.units,
        residentCount: b._count.residents,
        reps: b.residents.map((r) => ({
          fullName: r.fullName,
          phone: r.phone,
          unit: r.unit?.number ?? null,
        })),
        providers: b.serviceProviders.map((sp) => ({
          id: sp.id,
          trade: sp.trade,
          supplierName: sp.supplier.name,
          supplierPhone: sp.supplier.phone,
        })),
      }))}
    />
  );
}
