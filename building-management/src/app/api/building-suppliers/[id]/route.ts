import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    await prisma.buildingSupplier.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
