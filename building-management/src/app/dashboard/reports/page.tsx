import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { buildingSummary } from "@/lib/finance";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPeriod } from "@/lib/utils";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/enums";
import {
  ExportButtons,
  RemindAllButton,
  RemindOneButton,
} from "./report-actions";

export default async function ReportsPage() {
  const user = (await getSession())!;
  if (user.role === "RESIDENT") redirect("/dashboard");

  const scope = buildingScope(user);
  const buildings = await prisma.building.findMany({
    where: buildingSelfScope(user),
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // סיכום פר בניין
  const perBuilding = await Promise.all(
    buildings.map(async (b) => ({
      ...b,
      summary: await buildingSummary(b.id),
    }))
  );

  // גבייה חודשית לפי תקופה (דמי ועד)
  const monthlyCharges = await prisma.charge.findMany({
    where: { ...scope, type: "MONTHLY_FEE", period: { not: null } },
    select: {
      period: true,
      amount: true,
      payments: { select: { amount: true } },
    },
  });
  const byPeriod = new Map<string, { charged: number; paid: number }>();
  for (const c of monthlyCharges) {
    const key = c.period!;
    const cur = byPeriod.get(key) ?? { charged: 0, paid: 0 };
    cur.charged += c.amount;
    cur.paid += Math.min(
      c.amount,
      c.payments.reduce((s, p) => s + p.amount, 0)
    );
    byPeriod.set(key, cur);
  }
  const periods = [...byPeriod.entries()].sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  // חייבים
  const residents = await prisma.resident.findMany({
    where: scope,
    include: {
      building: { select: { name: true } },
      unit: { select: { number: true } },
      charges: { select: { amount: true } },
      payments: { select: { amount: true } },
    },
  });
  const debtors = residents
    .map((r) => ({
      id: r.id,
      name: r.fullName,
      phone: r.phone,
      hasEmail: !!r.email,
      building: r.building.name,
      unit: r.unit?.number ?? "—",
      balance:
        r.charges.reduce((s, c) => s + c.amount, 0) -
        r.payments.reduce((s, p) => s + p.amount, 0),
    }))
    .filter((d) => d.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  // הוצאות לפי קטגוריה
  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    where: scope,
    _sum: { amount: true },
  });
  const expByCat = expenses
    .map((e) => ({ category: e.category, sum: e._sum.amount ?? 0 }))
    .sort((a, b) => b.sum - a.sum);

  return (
    <div>
      <PageHeader
        title="דוחות"
        description="דוחות גבייה, חייבים והוצאות"
        action={<ExportButtons />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>סיכום פיננסי לפי בניין</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>בניין</TableHead>
                <TableHead>חויב</TableHead>
                <TableHead>נגבה</TableHead>
                <TableHead>חוב פתוח</TableHead>
                <TableHead>הוצאות</TableHead>
                <TableHead>יתרת קופה</TableHead>
                <TableHead>אחוז גבייה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perBuilding.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(b.summary.totalCharged)}
                  </TableCell>
                  <TableCell className="tabular-nums text-success">
                    {formatCurrency(b.summary.totalPaid)}
                  </TableCell>
                  <TableCell className="tabular-nums text-destructive">
                    {formatCurrency(b.summary.outstanding)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(b.summary.totalExpenses)}
                  </TableCell>
                  <TableCell
                    className={`font-semibold tabular-nums ${
                      b.summary.cashBalance >= 0
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(b.summary.cashBalance)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {b.summary.collectionRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>גבייה חודשית (דמי ועד)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {periods.length === 0 ? (
              <div className="p-6">
                <EmptyState message="אין נתוני גבייה חודשית." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>תקופה</TableHead>
                    <TableHead>חויב</TableHead>
                    <TableHead>נגבה</TableHead>
                    <TableHead>אחוז</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map(([period, v]) => (
                    <TableRow key={period}>
                      <TableCell className="font-medium">
                        {formatPeriod(period)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(v.charged)}
                      </TableCell>
                      <TableCell className="tabular-nums text-success">
                        {formatCurrency(v.paid)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {v.charged > 0
                          ? Math.round((v.paid / v.charged) * 100)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הוצאות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {expByCat.length === 0 ? (
              <div className="p-6">
                <EmptyState message="אין הוצאות." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>סה״כ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expByCat.map((e) => (
                    <TableRow key={e.category}>
                      <TableCell className="font-medium">
                        {EXPENSE_CATEGORY_LABELS[
                          e.category as ExpenseCategory
                        ] ?? e.category}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(e.sum)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>דוח חייבים ({debtors.length})</CardTitle>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/reports/matrix"
              className="text-sm font-medium text-primary hover:underline"
            >
              מטריצה חודשית ←
            </a>
            {debtors.length > 0 && <RemindAllButton />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {debtors.length === 0 ? (
            <div className="p-6">
              <EmptyState message="אין חייבים — מצוין! 🎉" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>דייר</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>דירה</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>חוב</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.building}
                    </TableCell>
                    <TableCell>{d.unit}</TableCell>
                    <TableCell dir="ltr">{d.phone ?? "—"}</TableCell>
                    <TableCell className="font-semibold tabular-nums text-destructive">
                      {formatCurrency(d.balance)}
                    </TableCell>
                    <TableCell>
                      <RemindOneButton residentId={d.id} hasEmail={d.hasEmail} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
