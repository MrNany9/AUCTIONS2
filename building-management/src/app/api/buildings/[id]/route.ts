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
    for (const k of ["name", "address", "city", "notes", "contractor"]) {
      if (body[k] !== undefined) data[k] = body[k] || null;
    }
    if (body.numUnits !== undefined) data.numUnits = Number(body.numUnits);
    if (body.floors !== undefined)
      data.floors = body.floors ? Number(body.floors) : null;
    if (body.monthlyFeePerUnit !== undefined)
      data.monthlyFeePerUnit = Number(body.monthlyFeePerUnit);
    if (body.active !== undefined) data.active = Boolean(body.active);
    for (const k of ["activeSince", "contractStart", "contractEnd"]) {
      if (body[k] !== undefined) data[k] = body[k] ? new Date(body[k]) : null;
    }

    const building = await prisma.building.update({
      where: { id: params.id },
      data,
    });
    return building;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN");
    await prisma.building.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
