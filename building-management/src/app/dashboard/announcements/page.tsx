import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { AnnouncementsClient } from "./announcements-client";

export default async function AnnouncementsPage() {
  const user = (await getSession())!;
  const isManager = user.role !== "RESIDENT";

  const where: Record<string, unknown> = {};
  if (user.role === "COMMITTEE") Object.assign(where, buildingScope(user));
  if (user.role === "RESIDENT" && user.buildingId)
    where.buildingId = user.buildingId;

  const [announcements, buildings] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: { building: { select: { name: true } } },
    }),
    isManager
      ? prisma.building.findMany({
          where: buildingSelfScope(user),
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <AnnouncementsClient
      isManager={isManager}
      buildings={buildings}
      announcements={announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        createdAt: a.createdAt.toISOString(),
        buildingName: a.building.name,
      }))}
    />
  );
}
