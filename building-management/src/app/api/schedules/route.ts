import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole, buildingScope } from "@/lib/api";

// תוכניות תחזוקה מונעת
export async function GET() {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: buildingScope(user),
      orderBy: { nextDueAt: "asc" },
      include: {
        building: { select: { name: true } },
        supplier: { select: { name: true } },
        _count: { select: { requests: true } },
      },
    });
    return schedules;
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        buildingId: body.buildingId,
        supplierId: body.supplierId || null,
        title: body.title,
        description: body.description || null,
        category: body.category || "OTHER",
        frequencyMonths: Number(body.frequencyMonths) || 12,
        nextDueAt: new Date(body.nextDueAt),
      },
    });
    return schedule;
  });
}
