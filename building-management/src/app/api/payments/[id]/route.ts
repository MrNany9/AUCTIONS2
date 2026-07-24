import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";
import { syncChargeStatus } from "@/lib/finance";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const payment = await prisma.payment.delete({ where: { id: params.id } });
    if (payment.chargeId) await syncChargeStatus(payment.chargeId);
    return { ok: true };
  });
}
