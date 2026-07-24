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
    for (const k of [
      "fullName", "phone", "phone2", "email", "unitId", "isOwner", "active",
      "idNumber", "isCommitteeRep", "collectionStatus", "standingOrder",
    ]) {
      if (body[k] !== undefined) data[k] = body[k] === "" ? null : body[k];
    }
    if (body.chargeDay !== undefined)
      data.chargeDay = body.chargeDay ? Number(body.chargeDay) : null;
    for (const k of ["leaseStart", "leaseEnd"]) {
      if (body[k] !== undefined) data[k] = body[k] ? new Date(body[k]) : null;
    }
    const resident = await prisma.resident.update({
      where: { id: params.id },
      data,
    });
    return resident;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    await prisma.resident.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
