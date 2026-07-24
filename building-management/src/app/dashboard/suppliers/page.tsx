import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const user = (await getSession())!;
  if (user.role === "RESIDENT") redirect("/dashboard");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { requests: true, expenses: true } } },
  });

  return (
    <SuppliersClient
      suppliers={suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        service: s.service,
        phone: s.phone,
        email: s.email,
        notes: s.notes,
        requestCount: s._count.requests,
        expenseCount: s._count.expenses,
      }))}
    />
  );
}
