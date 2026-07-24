import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const k of ["title", "description", "category", "active"]) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.supplierId !== undefined) data.supplierId = body.supplierId || null;
    if (body.frequencyMonths !== undefined)
      data.frequencyMonths = Number(body.frequencyMonths);
    if (body.nextDueAt !== undefined) data.nextDueAt = new Date(body.nextDueAt);

    const schedule = await prisma.maintenanceSchedule.update({
      where: { id: params.id },
      data,
    });
    return schedule;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    await prisma.maintenanceSchedule.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
