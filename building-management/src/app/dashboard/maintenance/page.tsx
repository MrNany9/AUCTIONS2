import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { runDueSchedules } from "@/lib/preventive";
import { MaintenanceClient } from "./maintenance-client";

export default async function MaintenancePage() {
  const user = (await getSession())!;
  const isManager = user.role !== "RESIDENT";

  // תחזוקה מונעת: הרצת תוכניות שהגיע מועדן בעת טעינת המסך
  if (isManager) {
    await runDueSchedules(buildingScope(user).buildingId);
  }

  const where: Record<string, unknown> = {};
  if (user.role === "COMMITTEE") Object.assign(where, buildingScope(user));
  if (user.role === "RESIDENT" && user.buildingId)
    where.buildingId = user.buildingId;

  const [requests, buildings, suppliers, schedules] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        building: { select: { name: true } },
        assignedSupplier: { select: { id: true, name: true } },
        reportedBy: { select: { fullName: true } },
        schedule: { select: { id: true } },
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
    user.role === "RESIDENT"
      ? Promise.resolve([])
      : prisma.maintenanceSchedule.findMany({
          where: buildingScope(user),
          orderBy: { nextDueAt: "asc" },
          include: {
            building: { select: { name: true } },
            supplier: { select: { name: true } },
            _count: { select: { requests: true } },
          },
        }),
  ]);

  return (
    <MaintenanceClient
      isManager={isManager}
      buildings={buildings}
      suppliers={suppliers}
      schedules={schedules.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        frequencyMonths: s.frequencyMonths,
        nextDueAt: s.nextDueAt.toISOString(),
        active: s.active,
        buildingId: s.buildingId,
        buildingName: s.building.name,
        supplierId: s.supplierId,
        supplierName: s.supplier?.name ?? null,
        generatedCount: s._count.requests,
      }))}
      requests={requests.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        location: r.location,
        category: r.category,
        priority: r.priority,
        status: r.status,
        cost: r.cost,
        createdAt: r.createdAt.toISOString(),
        buildingName: r.building.name,
        supplierId: r.assignedSupplier?.id ?? null,
        supplierName: r.assignedSupplier?.name ?? null,
        reporterName: r.reportedBy?.fullName ?? null,
        fromSchedule: !!r.schedule,
      }))}
    />
  );
}
