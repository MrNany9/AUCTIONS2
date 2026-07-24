import { prisma } from "./prisma";
import type { ChargeStatus } from "./enums";

// מחשב את הסטטוס הנכון של דרישת תשלום לפי הסכום ששולם ותאריך היעד
export function computeChargeStatus(
  amount: number,
  paid: number,
  dueDate: Date
): ChargeStatus {
  if (paid >= amount) return "PAID";
  if (paid > 0) return "PARTIAL";
  if (dueDate < new Date()) return "OVERDUE";
  return "OPEN";
}

// סנכרון סטטוס דרישה בודדת מול התשלומים בפועל
export async function syncChargeStatus(chargeId: string) {
  const charge = await prisma.charge.findUnique({
    where: { id: chargeId },
    include: { payments: true },
  });
  if (!charge) return;
  const paid = charge.payments.reduce((s, p) => s + p.amount, 0);
  const status = computeChargeStatus(charge.amount, paid, charge.dueDate);
  if (status !== charge.status) {
    await prisma.charge.update({ where: { id: chargeId }, data: { status } });
  }
}

export interface ResidentBalance {
  charged: number; // סך שחויב
  paid: number; // סך ששולם
  balance: number; // יתרת חוב (charged - paid)
}

// יתרת חוב לדייר בודד
export async function residentBalance(
  residentId: string
): Promise<ResidentBalance> {
  const [chargeAgg, payAgg] = await Promise.all([
    prisma.charge.aggregate({
      where: { residentId },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { residentId },
      _sum: { amount: true },
    }),
  ]);
  const charged = chargeAgg._sum.amount ?? 0;
  const paid = payAgg._sum.amount ?? 0;
  return { charged, paid, balance: charged - paid };
}

export interface BuildingSummary {
  totalCharged: number;
  totalPaid: number;
  outstanding: number; // חוב פתוח
  totalExpenses: number;
  cashBalance: number; // יתרת קופה (נגבה - הוצאות)
  openRequests: number;
  collectionRate: number; // אחוז גבייה
}

// סיכום פיננסי לבניין (או לכל הבניינים אם buildingId ריק)
export async function buildingSummary(
  buildingId?: string
): Promise<BuildingSummary> {
  const whereBuilding = buildingId ? { buildingId } : {};
  const [chargeAgg, expenseAgg, openRequests] = await Promise.all([
    prisma.charge.aggregate({
      where: whereBuilding,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: whereBuilding,
      _sum: { amount: true },
    }),
    prisma.maintenanceRequest.count({
      where: { ...whereBuilding, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  // סך תשלומים - מסונן לפי בניין דרך הדייר
  const payWhere = buildingId
    ? { resident: { buildingId } }
    : {};
  const payAgg = await prisma.payment.aggregate({
    where: payWhere,
    _sum: { amount: true },
  });

  const totalCharged = chargeAgg._sum.amount ?? 0;
  const totalPaid = payAgg._sum.amount ?? 0;
  const totalExpenses = expenseAgg._sum.amount ?? 0;

  return {
    totalCharged,
    totalPaid,
    outstanding: totalCharged - totalPaid,
    totalExpenses,
    cashBalance: totalPaid - totalExpenses,
    openRequests,
    collectionRate:
      totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0,
  };
}
