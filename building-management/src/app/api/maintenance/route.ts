import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, buildingScope, isManager } from "@/lib/api";

// רשימת קריאות תיקון (מסונן לפי בניין המשתמש)
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const where: Record<string, unknown> = {};
    if (user.role === "COMMITTEE") Object.assign(where, buildingScope(user));
    if (user.role === "RESIDENT" && user.buildingId)
      where.buildingId = user.buildingId;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        building: { select: { name: true } },
        assignedSupplier: { select: { id: true, name: true, service: true } },
        reportedBy: { select: { fullName: true } },
      },
    });
    return requests;
  });
}

// פתיחת קריאת תיקון (כל משתמש מחובר; דייר משויך אוטומטית)
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json();

    // דייר יכול לפתוח רק בבניין שלו
    const buildingId = isManager(user)
      ? body.buildingId
      : user.buildingId;
    if (!buildingId) return { error: "לא נבחר בניין" };

    const request = await prisma.maintenanceRequest.create({
      data: {
        buildingId,
        reportedById: user.residentId || body.reportedById || null,
        title: body.title,
        description: body.description || null,
        category: body.category || "OTHER",
        priority: body.priority || "MED",
        status: "OPEN",
      },
    });
    return request;
  });
}
