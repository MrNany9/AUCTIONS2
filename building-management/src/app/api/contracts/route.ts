import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole, buildingScope } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const scope = buildingScope(user);
    const contracts = await prisma.supplierContract.findMany({
      where: scope.buildingId
        ? { OR: [{ buildingId: scope.buildingId }, { buildingId: null }] }
        : {},
      orderBy: { endDate: "asc" },
      include: {
        supplier: { select: { id: true, name: true, service: true } },
        building: { select: { id: true, name: true } },
      },
    });
    return contracts;
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const contract = await prisma.supplierContract.create({
      data: {
        supplierId: body.supplierId,
        buildingId: body.buildingId || null,
        description: body.description,
        monthlyCost: Number(body.monthlyCost) || 0,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        notes: body.notes || null,
      },
    });
    return contract;
  });
}
