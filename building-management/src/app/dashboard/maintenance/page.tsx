import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { MaintenanceClient } from "./maintenance-client";

export default async function MaintenancePage() {
  const user = (await getSession())!;

  const where: Record<string, unknown> = {};
  if (user.role === "COMMITTEE") Object.assign(where, buildingScope(user));
  if (user.role === "RESIDENT" && user.buildingId)
    where.buildingId = user.buildingId;

  const [requests, buildings, suppliers] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        building: { select: { name: true } },
        assignedSupplier: { select: { id: true, name: true } },
        reportedBy: { select: { fullName: true } },
      },
    }),
    prisma.building.findMany({
      where: buildingSelfScope(user),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    user.role === "RESIDENT"
      ? Promise.resolve([])
      : prisma.supplier.findMany({
          select: { id: true, name: true, service: true },
          orderBy: { name: "asc" },
        }),
  ]);

  return (
    <MaintenanceClient
      isManager={user.role !== "RESIDENT"}
      buildings={buildings}
      suppliers={suppliers}
      requests={requests.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        status: r.status,
        cost: r.cost,
        createdAt: r.createdAt.toISOString(),
        buildingName: r.building.name,
        supplierId: r.assignedSupplier?.id ?? null,
        supplierName: r.assignedSupplier?.name ?? null,
        reporterName: r.reportedBy?.fullName ?? null,
      }))}
    />
  );
}
