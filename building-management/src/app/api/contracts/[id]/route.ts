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
    for (const k of ["description", "notes"]) {
      if (body[k] !== undefined) data[k] = body[k] || null;
    }
    if (body.monthlyCost !== undefined)
      data.monthlyCost = Number(body.monthlyCost);
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = new Date(body.endDate);
    if (body.buildingId !== undefined) data.buildingId = body.buildingId || null;

    const contract = await prisma.supplierContract.update({
      where: { id: params.id },
      data,
    });
    return contract;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    await prisma.supplierContract.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
