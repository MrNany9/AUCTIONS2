import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireUser, requireRole, buildingScope } from "@/lib/api";

// לוח הודעות: מנהל/ועד מפרסמים, דייר רואה את של הבניין שלו
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const where: Record<string, unknown> = {};
    if (user.role === "COMMITTEE") Object.assign(where, buildingScope(user));
    if (user.role === "RESIDENT" && user.buildingId)
      where.buildingId = user.buildingId;

    return prisma.announcement.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { building: { select: { name: true } } },
    });
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const announcement = await prisma.announcement.create({
      data: {
        buildingId: body.buildingId,
        title: body.title,
        body: body.body,
        pinned: body.pinned ?? false,
      },
    });
    return announcement;
  });
}
