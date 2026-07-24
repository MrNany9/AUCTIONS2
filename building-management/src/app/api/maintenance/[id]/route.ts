import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

// עדכון קריאת תיקון: שיוך ספק, סטטוס, עדיפות, עלות, למי לחייב.
// בסגירה (RESOLVED/CLOSED) עם עלות, לפי billTo:
//   COMMITTEE/BUILDING - נרשמת הוצאה על הבניין (פעם אחת)
//   RESIDENT - נוצרת דרישת תשלום "חיוב שירות" לדייר שדיווח
//   NONE - ללא חיוב
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();

    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      include: { expenses: true },
    });
    if (!existing) return { error: "קריאה לא נמצאה" };

    const data: Record<string, unknown> = {};
    for (const k of [
      "title", "description", "location", "category", "priority", "status",
      "billTo", "reporterPhone",
    ]) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.recurring !== undefined) data.recurring = Boolean(body.recurring);
    if (body.assignedSupplierId !== undefined)
      data.assignedSupplierId = body.assignedSupplierId || null;
    if (body.cost !== undefined)
      data.cost = body.cost === "" || body.cost == null ? null : Number(body.cost);

    const nowResolved =
      (body.status === "RESOLVED" || body.status === "CLOSED") &&
      !existing.resolvedAt;
    if (nowResolved) data.resolvedAt = new Date();

    const updated = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data,
    });

    if (nowResolved && updated.cost && existing.expenses.length === 0) {
      if (
        (updated.billTo === "COMMITTEE" || updated.billTo === "BUILDING") &&
        updated.assignedSupplierId
      ) {
        await prisma.expense.create({
          data: {
            buildingId: updated.buildingId,
            supplierId: updated.assignedSupplierId,
            requestId: updated.id,
            category: "REPAIRS",
            amount: updated.cost,
            description: `תיקון: ${updated.title}`,
          },
        });
      } else if (updated.billTo === "RESIDENT" && updated.reportedById) {
        // חיוב הדייר שדיווח בדרישת תשלום מסוג "חיוב שירות"
        const due = new Date();
        due.setDate(due.getDate() + 14);
        await prisma.charge.create({
          data: {
            buildingId: updated.buildingId,
            residentId: updated.reportedById,
            type: "SERVICE",
            amount: updated.cost,
            dueDate: due,
            description: `חיוב שירות: ${updated.title}`,
            status: "OPEN",
          },
        });
      }
    }

    return updated;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    await prisma.maintenanceRequest.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
