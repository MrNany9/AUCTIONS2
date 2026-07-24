import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole } from "@/lib/api";

// יחידות/דירות של בניין (?buildingId=)
export async function GET(req: NextRequest) {
  return handle(async () => {
    await requireUser();
    const buildingId = req.nextUrl.searchParams.get("buildingId") || undefined;
    const units = await prisma.unit.findMany({
      where: buildingId ? { buildingId } : {},
      orderBy: { number: "asc" },
      include: { residents: { where: { active: true } } },
    });
    return units;
  });
}

// יצירת יחידה
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const unit = await prisma.unit.create({
      data: {
        buildingId: body.buildingId,
        number: String(body.number),
        floor: body.floor != null ? Number(body.floor) : null,
        size: body.size != null ? Number(body.size) : null,
      },
    });
    return unit;
  });
}
