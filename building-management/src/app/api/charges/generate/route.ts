import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

// מחולל דרישות דמי ועד חודשיות לכל דיירי הבניין לתקופה נתונה.
// body: { buildingId, period: "YYYY-MM", dueDay?: number }
// מדלג על דיירים שכבר קיימת להם דרישת דמי ועד לאותה תקופה (idempotent).
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const buildingId: string = body.buildingId;
    const period: string = body.period;
    const dueDay: number = Number(body.dueDay) || 10;

    if (!buildingId || !/^\d{4}-\d{2}$/.test(period || "")) {
      return { error: "יש לבחור בניין ותקופה תקינה (YYYY-MM)" };
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });
    if (!building) return { error: "בניין לא נמצא" };

    const [year, month] = period.split("-").map(Number);
    const dueDate = new Date(year, month - 1, dueDay);

    const residents = await prisma.resident.findMany({
      where: { buildingId, active: true },
      include: {
        charges: {
          where: { type: "MONTHLY_FEE", period },
          select: { id: true },
        },
      },
    });

    let created = 0;
    let skipped = 0;
    for (const r of residents) {
      if (r.charges.length > 0) {
        skipped++;
        continue;
      }
      await prisma.charge.create({
        data: {
          buildingId,
          residentId: r.id,
          type: "MONTHLY_FEE",
          amount: building.monthlyFeePerUnit,
          dueDate,
          period,
          description: `דמי ועד ${period}`,
          status: "OPEN",
        },
      });
      created++;
    }

    return { ok: true, created, skipped, total: residents.length };
  });
}
