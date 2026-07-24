import {
  Wallet,
  TrendingDown,
  AlertCircle,
  Wrench,
  Building2,
  Users,
  PiggyBank,
  Percent,
} from "lucide-react";
import { AlertTriangle, Megaphone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingSummary, residentBalance } from "@/lib/finance";
import { expiringContracts } from "@/lib/preventive";
import { StatCard } from "@/components/stat-card";
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
import { ChargeStatusBadge, MaintStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CHARGE_TYPE_LABELS, type ChargeType } from "@/lib/enums";

export default async function DashboardPage() {
  const user = (await getSession())!;

  if (user.role === "RESIDENT") {
    return <ResidentDashboard residentId={user.residentId} />;
  }

  const scope = user.role === "COMMITTEE" ? user.buildingId ?? undefined : undefined;
  const summary = await buildingSummary(scope);
  const contracts = await expiringContracts(60, scope);

  const [buildingCount, residentCount, delinquents, openRequests] =
    await Promise.all([
      prisma.building.count(scope ? { where: { id: scope } } : undefined),
      prisma.resident.count({
        where: scope ? { buildingId: scope, active: true } : { active: true },
      }),
      prisma.resident.findMany({
        where: scope ? { buildingId: scope } : {},
        include: {
          building: { select: { name: true } },
          charges: { select: { amount: true } },
          payments: { select: { amount: true } },
        },
      }),
      prisma.maintenanceRequest.findMany({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          ...(scope ? { buildingId: scope } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { building: { select: { name: true } } },
      }),
    ]);

  const debtors = delinquents
    .map((r) => {
      const charged = r.charges.reduce((s, c) => s + c.amount, 0);
      const paid = r.payments.reduce((s, p) => s + p.amount, 0);
      return { name: r.fullName, building: r.building.name, balance: charged - paid };
    })
    .filter((d) => d.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="לוח בקרה"
        description="מבט־על על מצב הגבייה, החוב הפתוח והתחזוקה"
      />

      {contracts.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            חוזי שירות שפוקעים בקרוב
          </p>
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {contracts.slice(0, 4).map((c) => (
              <li key={c.id}>
                {c.description} ({c.supplier.name}
                {c.building ? ` · ${c.building.name}` : ""}) — עד{" "}
                {formatDate(c.endDate)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="נגבה (סה״כ)"
          value={formatCurrency(summary.totalPaid)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="חוב פתוח"
          value={formatCurrency(summary.outstanding)}
          icon={AlertCircle}
          tone={summary.outstanding > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="יתרת קופה"
          value={formatCurrency(summary.cashBalance)}
          icon={PiggyBank}
          tone={summary.cashBalance >= 0 ? "default" : "warning"}
          hint={`הוצאות: ${formatCurrency(summary.totalExpenses)}`}
        />
        <StatCard
          label="אחוז גבייה"
          value={`${summary.collectionRate}%`}
          icon={Percent}
          tone={summary.collectionRate >= 80 ? "success" : "warning"}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="בניינים" value={buildingCount} icon={Building2} />
        <StatCard label="דיירים פעילים" value={residentCount} icon={Users} />
        <StatCard
          label="קריאות תיקון פתוחות"
          value={summary.openRequests}
          icon={Wrench}
          tone={summary.openRequests > 0 ? "warning" : "default"}
        />
        <StatCard
          label="הוצאות (סה״כ)"
          value={formatCurrency(summary.totalExpenses)}
          icon={TrendingDown}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>חייבים מובילים</CardTitle>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <EmptyState message="אין חייבים — כל הדיירים משלמים! 🎉" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>דייר</TableHead>
                    <TableHead>בניין</TableHead>
                    <TableHead>חוב</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.building}
                      </TableCell>
                      <TableCell className="font-semibold text-destructive tabular-nums">
                        {formatCurrency(d.balance)}
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
            <CardTitle>קריאות תיקון אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            {openRequests.length === 0 ? (
              <EmptyState message="אין קריאות תיקון פתוחות" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>נושא</TableHead>
                    <TableHead>בניין</TableHead>
                    <TableHead>סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.building.name}
                      </TableCell>
                      <TableCell>
                        <MaintStatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function ResidentDashboard({ residentId }: { residentId: string | null }) {
  if (!residentId) {
    return <EmptyState message="חשבון הדייר אינו מקושר לרשומת דייר." />;
  }
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: {
      unit: true,
      building: { select: { name: true } },
      charges: {
        orderBy: { dueDate: "desc" },
        include: { payments: { select: { amount: true } } },
      },
    },
  });
  if (!resident) return <EmptyState message="רשומת דייר לא נמצאה." />;

  const bal = await residentBalance(residentId);
  const openCharges = resident.charges.filter((c) => {
    const paid = c.payments.reduce((s, p) => s + p.amount, 0);
    return paid < c.amount;
  });
  const announcements = await prisma.announcement.findMany({
    where: { buildingId: resident.buildingId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 3,
  });

  return (
    <div>
      <PageHeader
        title={`שלום, ${resident.fullName}`}
        description={`${resident.building.name} · דירה ${resident.unit?.number ?? "—"}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="יתרת חוב"
          value={formatCurrency(bal.balance)}
          icon={AlertCircle}
          tone={bal.balance > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="סה״כ שולם"
          value={formatCurrency(bal.paid)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="דרישות פתוחות"
          value={openCharges.length}
          icon={PiggyBank}
        />
      </div>

      {announcements.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              הודעות מהוועד
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-md bg-muted/50 p-3">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {a.body}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(a.createdAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>דרישות התשלום שלי</CardTitle>
        </CardHeader>
        <CardContent>
          {openCharges.length === 0 ? (
            <EmptyState message="אין דרישות תשלום פתוחות 🎉" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>לתשלום עד</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openCharges.map((c) => {
                  const paid = c.payments.reduce((s, p) => s + p.amount, 0);
                  const status =
                    paid > 0 ? "PARTIAL" : c.dueDate < new Date() ? "OVERDUE" : "OPEN";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.description}
                      </TableCell>
                      <TableCell>
                        {CHARGE_TYPE_LABELS[c.type as ChargeType]}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(c.amount)}
                      </TableCell>
                      <TableCell>{formatDate(c.dueDate)}</TableCell>
                      <TableCell>
                        <ChargeStatusBadge status={status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
