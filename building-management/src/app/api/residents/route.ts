import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole, buildingScope } from "@/lib/api";

// רשימת דיירים כולל יתרת חוב (מסונן לפי הרשאה)
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const buildingId = req.nextUrl.searchParams.get("buildingId") || undefined;

    const where: Record<string, unknown> = { ...buildingScope(user) };
    if (buildingId && user.role === "ADMIN") where.buildingId = buildingId;

    const residents = await prisma.resident.findMany({
      where,
      orderBy: { fullName: "asc" },
      include: {
        unit: true,
        building: { select: { id: true, name: true } },
        charges: { select: { amount: true } },
        payments: { select: { amount: true } },
      },
    });

    return residents.map((r) => {
      const charged = r.charges.reduce((s, c) => s + c.amount, 0);
      const paid = r.payments.reduce((s, p) => s + p.amount, 0);
      return {
        id: r.id,
        fullName: r.fullName,
        phone: r.phone,
        email: r.email,
        isOwner: r.isOwner,
        active: r.active,
        unit: r.unit,
        building: r.building,
        charged,
        paid,
        balance: charged - paid,
      };
    });
  });
}

// יצירת דייר
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const resident = await prisma.resident.create({
      data: {
        buildingId: body.buildingId,
        unitId: body.unitId || null,
        fullName: body.fullName,
        phone: body.phone || null,
        email: body.email || null,
        isOwner: body.isOwner ?? true,
      },
    });
    return resident;
  });
}
