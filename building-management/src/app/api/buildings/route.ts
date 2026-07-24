import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole, buildingSelfScope } from "@/lib/api";

// רשימת בניינים (מסונן לפי הרשאה)
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const where = buildingSelfScope(user);
    const buildings = await prisma.building.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { units: true, residents: true } },
      },
    });
    return buildings;
  });
}

// יצירת בניין (מנהל בלבד)
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN");
    const body = await req.json();
    const building = await prisma.building.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        numUnits: Number(body.numUnits) || 0,
        monthlyFeePerUnit: Number(body.monthlyFeePerUnit) || 0,
        notes: body.notes || null,
      },
    });
    return building;
  });
}
