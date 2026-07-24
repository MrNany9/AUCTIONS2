import { prisma } from "./prisma";

// מריץ את כל תוכניות התחזוקה המונעת שהגיע מועדן:
// יוצר קריאת תיקון לכל תוכנית שה-nextDueAt שלה עבר, ומקדם את המועד הבא
// לפי התדירות. בטוח להריץ שוב ושוב (לא ייצור כפילויות כי המועד מתקדם).
export async function runDueSchedules(buildingId?: string) {
  const now = new Date();
  const due = await prisma.maintenanceSchedule.findMany({
    where: {
      active: true,
      nextDueAt: { lte: now },
      ...(buildingId ? { buildingId } : {}),
    },
  });

  let created = 0;
  for (const s of due) {
    await prisma.maintenanceRequest.create({
      data: {
        buildingId: s.buildingId,
        scheduleId: s.id,
        title: s.title,
        description: s.description
          ? `${s.description} (תחזוקה מונעת)`
          : "נוצר אוטומטית מתוכנית תחזוקה מונעת",
        category: s.category,
        priority: "MED",
        status: "OPEN",
        assignedSupplierId: s.supplierId,
      },
    });

    // קידום המועד הבא: מוסיפים את התדירות עד שהמועד עתידי
    // (מכסה גם מקרה שבו המערכת לא רצה כמה תקופות)
    const next = new Date(s.nextDueAt);
    while (next <= now) {
      next.setMonth(next.getMonth() + s.frequencyMonths);
    }
    await prisma.maintenanceSchedule.update({
      where: { id: s.id },
      data: { nextDueAt: next },
    });
    created++;
  }
  return { created };
}

// חוזים שפוקעים בתוך X ימים - להתראות בלוח הבקרה
export async function expiringContracts(days = 60, buildingId?: string) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return prisma.supplierContract.findMany({
    where: {
      endDate: { lte: until, gte: new Date() },
      ...(buildingId ? { buildingId } : {}),
    },
    orderBy: { endDate: "asc" },
    include: {
      supplier: { select: { name: true } },
      building: { select: { name: true } },
    },
  });
}
