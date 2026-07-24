import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const user = (await getSession())!;
  if (user.role === "RESIDENT") redirect("/dashboard");

  const scope = buildingScope(user);
  const [suppliers, contracts, buildings] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { requests: true, expenses: true } } },
    }),
    prisma.supplierContract.findMany({
      where: scope.buildingId
        ? { OR: [{ buildingId: scope.buildingId }, { buildingId: null }] }
        : {},
      orderBy: { endDate: "asc" },
      include: {
        supplier: { select: { id: true, name: true } },
        building: { select: { name: true } },
      },
    }),
    prisma.building.findMany({
      where: buildingSelfScope(user),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <SuppliersClient
      buildings={buildings}
      contracts={contracts.map((c) => ({
        id: c.id,
        description: c.description,
        monthlyCost: c.monthlyCost,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        supplierName: c.supplier.name,
        buildingName: c.building?.name ?? "כל הבניינים",
      }))}
      suppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        service: s.service,
        phone: s.phone,
        email: s.email,
        notes: s.notes,
        requestCount: s._count.requests,
        expenseCount: s._count.expenses,
      }))}
    />
  );
}
