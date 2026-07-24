import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole, buildingScope } from "@/lib/api";

// ייצוא CSV: ?type=debtors | payments | expenses
// הקובץ נפתח נכון באקסל בעברית (BOM + UTF-8)
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const type = req.nextUrl.searchParams.get("type") || "debtors";
    const scope = buildingScope(user);

    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = "export.csv";

    if (type === "debtors") {
      const residents = await prisma.resident.findMany({
        where: scope,
        include: {
          building: { select: { name: true } },
          unit: { select: { number: true } },
          charges: { select: { amount: true } },
          payments: { select: { amount: true } },
        },
      });
      headers = ["שם", "בניין", "דירה", "טלפון", "אימייל", "חוב"];
      rows = residents
        .map((r) => ({
          r,
          balance:
            r.charges.reduce((s, c) => s + c.amount, 0) -
            r.payments.reduce((s, p) => s + p.amount, 0),
        }))
        .filter((x) => x.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .map(({ r, balance }) => [
          r.fullName,
          r.building.name,
          r.unit?.number ?? "",
          r.phone ?? "",
          r.email ?? "",
          balance,
        ]);
      filename = "debtors.csv";
    } else if (type === "payments") {
      const payments = await prisma.payment.findMany({
        where: scope.buildingId ? { resident: scope } : {},
        orderBy: { date: "desc" },
        include: {
          resident: { select: { fullName: true } },
          charge: { select: { description: true } },
        },
      });
      headers = ["תאריך", "דייר", "סכום", "אמצעי", "אסמכתא", "עבור"];
      rows = payments.map((p) => [
        p.date.toISOString().slice(0, 10),
        p.resident.fullName,
        p.amount,
        p.method,
        p.reference ?? "",
        p.charge?.description ?? p.note ?? "",
      ]);
      filename = "payments.csv";
    } else if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: scope,
        orderBy: { date: "desc" },
        include: {
          building: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      });
      headers = ["תאריך", "בניין", "קטגוריה", "ספק", "סכום", "תיאור"];
      rows = expenses.map((e) => [
        e.date.toISOString().slice(0, 10),
        e.building.name,
        e.category,
        e.supplier?.name ?? "",
        e.amount,
        e.description ?? "",
      ]);
      filename = "expenses.csv";
    }

    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv =
      "\uFEFF" + // BOM לפתיחה תקינה באקסל
      [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
