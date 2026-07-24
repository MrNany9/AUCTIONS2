import { prisma } from "./prisma";

export interface MatrixRow {
  residentId: string;
  name: string;
  unit: string;
  phone: string | null;
  collectionStatus: string;
  months: Record<string, number>; // period -> יתרה לא משולמת
  otherDebts: { description: string; date: Date; remaining: number }[];
  total: number;
}

export interface DebtorsMatrix {
  periods: string[]; // מהישן לחדש
  rows: MatrixRow[];
  grandTotal: number;
}

// מטריצת חייבים: שורות = דיירים, עמודות = חודשים (דמי ועד),
// + עמודת "חוב אחר" עם פירוט (חוב ישן, שיפוצים, קנסות...).
export async function debtorsMatrix(opts: {
  buildingId?: string;
  monthsBack?: number;
  legalOnly?: boolean; // רק דיירים בטיפול משפטי/גבייה
}): Promise<DebtorsMatrix> {
  const monthsBack = opts.monthsBack ?? 12;

  // תקופות: monthsBack חודשים אחורה כולל החודש הנוכחי
  const periods: string[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const residents = await prisma.resident.findMany({
    where: {
      ...(opts.buildingId ? { buildingId: opts.buildingId } : {}),
      ...(opts.legalOnly ? { collectionStatus: { not: "NONE" } } : {}),
    },
    orderBy: [{ unit: { number: "asc" } }, { fullName: "asc" }],
    include: {
      unit: { select: { number: true } },
      charges: { include: { payments: { select: { amount: true } } } },
    },
  });

  const rows: MatrixRow[] = [];
  for (const r of residents) {
    const months: Record<string, number> = {};
    const otherDebts: MatrixRow["otherDebts"] = [];
    let total = 0;

    for (const c of r.charges) {
      const paid = c.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = c.amount - paid;
      if (remaining <= 0) continue;
      total += remaining;

      if (c.type === "MONTHLY_FEE" && c.period && periods.includes(c.period)) {
        months[c.period] = (months[c.period] ?? 0) + remaining;
      } else {
        otherDebts.push({
          description: c.description ?? "חוב",
          date: c.dueDate,
          remaining,
        });
      }
    }

    if (total <= 0) continue; // רק חייבים
    rows.push({
      residentId: r.id,
      name: r.fullName,
      unit: r.unit?.number ?? "—",
      phone: r.phone,
      collectionStatus: r.collectionStatus,
      months,
      otherDebts,
      total,
    });
  }

  return {
    periods,
    rows,
    grandTotal: rows.reduce((s, r) => s + r.total, 0),
  };
}
