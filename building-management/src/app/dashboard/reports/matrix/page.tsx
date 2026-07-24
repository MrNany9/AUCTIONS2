import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildingScope, buildingSelfScope } from "@/lib/api";
import { debtorsMatrix } from "@/lib/matrix";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  COLLECTION_STATUS_LABELS,
  type CollectionStatus,
} from "@/lib/enums";

export default async function MatrixPage({
  searchParams,
}: {
  searchParams: { building?: string; legal?: string };
}) {
  const user = (await getSession())!;
  if (user.role === "RESIDENT") redirect("/dashboard");

  const buildings = await prisma.building.findMany({
    where: buildingSelfScope(user),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const scoped = buildingScope(user).buildingId;
  const buildingId = scoped ?? searchParams.building ?? undefined;
  const legalOnly = searchParams.legal === "1";

  const m = await debtorsMatrix({ buildingId, monthsBack: 8, legalOnly });

  const exportUrl = `/api/export?type=matrix${buildingId ? `&buildingId=${buildingId}` : ""}${legalOnly ? "&legal=1" : ""}`;

  return (
    <div>
      <PageHeader
        title="דו״ח חייבים — מטריצה חודשית"
        description={`סה"כ חובה: ${formatCurrency(m.grandTotal)} · ${m.rows.length} חייבים`}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/reports">
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
                חזרה לדוחות
              </Button>
            </Link>
            <a href={exportUrl} target="_blank">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                ייצוא לאקסל
              </Button>
            </a>
          </div>
        }
      />

      {/* מסננים */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">בניין:</span>
        {!scoped && (
          <Link href={`/dashboard/reports/matrix${legalOnly ? "?legal=1" : ""}`}>
            <Badge variant={!buildingId ? "default" : "neutral"}>הכל</Badge>
          </Link>
        )}
        {buildings.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/reports/matrix?building=${b.id}${legalOnly ? "&legal=1" : ""}`}
          >
            <Badge variant={buildingId === b.id ? "default" : "neutral"}>
              {b.name}
            </Badge>
          </Link>
        ))}
        <span className="mr-4 text-muted-foreground">|</span>
        <Link
          href={`/dashboard/reports/matrix?${buildingId && !scoped ? `building=${buildingId}&` : ""}${legalOnly ? "" : "legal=1"}`}
        >
          <Badge variant={legalOnly ? "destructive" : "neutral"}>
            משפטי בלבד
          </Badge>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {m.rows.length === 0 ? (
            <div className="p-6">
              <EmptyState message="אין חייבים לפי המסננים שנבחרו 🎉" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>דירה</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>טלפון</TableHead>
                  {m.periods.map((p) => (
                    <TableHead key={p} className="whitespace-nowrap text-center">
                      {formatPeriod(p)}
                    </TableHead>
                  ))}
                  <TableHead>חוב אחר</TableHead>
                  <TableHead>סה״כ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {m.rows.map((r) => {
                  const otherSum = r.otherDebts.reduce(
                    (s, d) => s + d.remaining,
                    0
                  );
                  return (
                    <TableRow key={r.residentId}>
                      <TableCell>{r.unit}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        {r.collectionStatus !== "NONE" && (
                          <Badge variant="destructive">
                            {COLLECTION_STATUS_LABELS[
                              r.collectionStatus as CollectionStatus
                            ] ?? r.collectionStatus}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className="text-xs">
                        {r.phone ?? "—"}
                      </TableCell>
                      {m.periods.map((p) => (
                        <TableCell
                          key={p}
                          className={`text-center tabular-nums ${
                            r.months[p] ? "font-medium text-destructive" : "text-muted-foreground/40"
                          }`}
                        >
                          {r.months[p] ? Math.round(r.months[p]) : "·"}
                        </TableCell>
                      ))}
                      <TableCell>
                        {otherSum > 0 ? (
                          <div className="space-y-0.5">
                            {r.otherDebts.map((d, i) => (
                              <p key={i} className="whitespace-nowrap text-xs">
                                {d.description} —{" "}
                                <span className="tabular-nums text-destructive">
                                  {formatCurrency(d.remaining)}
                                </span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold tabular-nums text-destructive">
                        {formatCurrency(r.total)}
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
