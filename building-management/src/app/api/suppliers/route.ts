import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole } from "@/lib/api";

export async function GET() {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { requests: true, expenses: true } } },
    });
    return suppliers;
  });
}

export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        service: body.service,
        phone: body.phone || null,
        email: body.email || null,
        notes: body.notes || null,
      },
    });
    return supplier;
  });
}
