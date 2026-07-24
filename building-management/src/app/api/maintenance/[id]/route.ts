import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

// עדכון קריאת תיקון: שיוך ספק, סטטוס, עדיפות, עלות.
// כאשר הסטטוס עובר ל-RESOLVED/CLOSED נרשם resolvedAt, ואם יש עלות
// וספק - נוצרת הוצאה מקושרת (פעם אחת).
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
    for (const k of ["title", "description", "category", "priority", "status"]) {
      if (body[k] !== undefined) data[k] = body[k];
    }
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

    // רישום הוצאה אוטומטי כאשר הקריאה נסגרה עם עלות וספק, וטרם נרשמה הוצאה
    if (
      nowResolved &&
      updated.cost &&
      updated.assignedSupplierId &&
      existing.expenses.length === 0
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
