import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole } from "@/lib/api";

// מדריך ספקי הבניין לפי תחום (?buildingId=)
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireUser();
    const buildingId = req.nextUrl.searchParams.get("buildingId") || undefined;
    return prisma.buildingSupplier.findMany({
      where: buildingId ? { buildingId } : {},
      include: {
        supplier: { select: { id: true, name: true, phone: true, service: true } },
      },
      orderBy: { trade: "asc" },
    });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    return prisma.buildingSupplier.create({
      data: {
        buildingId: body.buildingId,
        supplierId: body.supplierId,
        trade: body.trade || "OTHER",
      },
    });
  });
}
