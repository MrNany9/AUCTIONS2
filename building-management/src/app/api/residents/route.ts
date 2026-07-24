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
        phone2: r.phone2,
        email: r.email,
        idNumber: r.idNumber,
        isOwner: r.isOwner,
        isCommitteeRep: r.isCommitteeRep,
        collectionStatus: r.collectionStatus,
        standingOrder: r.standingOrder,
        chargeDay: r.chargeDay,
        leaseStart: r.leaseStart,
        leaseEnd: r.leaseEnd,
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

// יצירת דייר (כולל יתרה ישנה שנרשמת כדרישת "חוב ישן")
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
        phone2: body.phone2 || null,
        email: body.email || null,
        idNumber: body.idNumber || null,
        isOwner: body.isOwner ?? true,
        isCommitteeRep: body.isCommitteeRep ?? false,
        collectionStatus: body.collectionStatus || "NONE",
        leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
        leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        standingOrder: body.standingOrder ?? false,
        chargeDay: body.chargeDay ? Number(body.chargeDay) : null,
      },
    });

    // יתרה ישנה - נרשמת כדרישת תשלום מסוג "חוב ישן"
    const openingBalance = Number(body.openingBalance) || 0;
    if (openingBalance > 0) {
      await prisma.charge.create({
        data: {
          buildingId: resident.buildingId,
          residentId: resident.id,
          type: "OLD_DEBT",
          amount: openingBalance,
          dueDate: new Date(),
          description: "חוב ישן (יתרת פתיחה)",
          status: "OVERDUE",
        },
      });
    }
    return resident;
  });
}
