import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

// יומן דייר - שיחות, מכתבים, הערות
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    return prisma.residentLog.findMany({
      where: { residentId: params.id },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    if (!body.content) return { error: "יש להזין תוכן" };
    return prisma.residentLog.create({
      data: {
        residentId: params.id,
        kind: body.kind || "CALL",
        content: body.content,
        createdBy: user.fullName,
      },
    });
  });
}
