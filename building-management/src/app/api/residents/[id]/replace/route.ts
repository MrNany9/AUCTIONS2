import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

// החלפת דייר: הדייר הקיים מסומן כלא-פעיל (עם תאריך עזיבה, ההיסטוריה
// הפיננסית שלו נשמרת), ודייר חדש נוצר על אותה דירה.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();

    const old = await prisma.resident.findUnique({ where: { id: params.id } });
    if (!old) return { error: "דייר לא נמצא" };
    if (!body.fullName) return { error: "יש להזין שם לדייר החדש" };

    const [, created] = await prisma.$transaction([
      prisma.resident.update({
        where: { id: old.id },
        data: { active: false, moveOutDate: new Date(), isCommitteeRep: false },
      }),
      prisma.resident.create({
        data: {
          buildingId: old.buildingId,
          unitId: old.unitId, // אותה דירה
          fullName: body.fullName,
          phone: body.phone || null,
          email: body.email || null,
          idNumber: body.idNumber || null,
          isOwner: body.isOwner ?? true,
          leaseStart: body.leaseStart ? new Date(body.leaseStart) : null,
          leaseEnd: body.leaseEnd ? new Date(body.leaseEnd) : null,
        },
      }),
    ]);

    return { ok: true, newResidentId: created.id };
  });
}
