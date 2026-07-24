import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole, buildingScope } from "@/lib/api";

export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const buildingId = req.nextUrl.searchParams.get("buildingId") || undefined;
    const where: Record<string, unknown> = { ...buildingScope(user) };
    if (buildingId && user.role === "ADMIN") where.buildingId = buildingId;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        supplier: { select: { name: true } },
        building: { select: { name: true } },
      },
    });
    return expenses;
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        buildingId: body.buildingId,
        supplierId: body.supplierId || null,
        category: body.category || "OTHER",
        amount: Number(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        description: body.description || null,
      },
    });
    return expense;
  });
}
