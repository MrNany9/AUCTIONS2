import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { ExpensesClient } from "./expenses-client";

export default async function ExpensesPage() {
  const user = (await getSession())!;
  if (user.role === "RESIDENT") redirect("/dashboard");

  const scope = buildingScope(user);
  const [expenses, buildings, suppliers] = await Promise.all([
    prisma.expense.findMany({
      where: scope,
      orderBy: { date: "desc" },
      take: 300,
      include: {
        supplier: { select: { name: true } },
        building: { select: { name: true } },
      },
    }),
    prisma.building.findMany({
      where: buildingSelfScope(user),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ExpensesClient
      buildings={buildings}
      suppliers={suppliers}
      expenses={expenses.map((e) => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        date: e.date.toISOString(),
        description: e.description,
        supplierName: e.supplier?.name ?? null,
        buildingName: e.building.name,
      }))}
    />
  );
}
