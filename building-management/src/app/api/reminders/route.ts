import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireRole, buildingScope } from "@/lib/api";
import { sendEmail, buildDebtReminderEmail } from "@/lib/mailer";

// שליחת תזכורת חוב במייל.
// body: { residentId } לדייר בודד, או { all: true } לכל החייבים (בהיקף ההרשאה).
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireRole("ADMIN", "COMMITTEE");
    const body = await req.json();

    const where: Record<string, unknown> = { ...buildingScope(user), active: true };
    if (body.residentId) where.id = body.residentId;
    else if (!body.all) return { error: "יש לציין residentId או all" };

    const residents = await prisma.resident.findMany({
      where,
      include: {
        building: { select: { name: true } },
        charges: {
          where: { status: { in: ["OPEN", "PARTIAL", "OVERDUE"] } },
          include: { payments: { select: { amount: true } } },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    let sent = 0;
    let skippedNoEmail = 0;
    let skippedNoDebt = 0;
    const results: { resident: string; status: string }[] = [];

    for (const r of residents) {
      const openCharges = r.charges
        .map((c) => ({
          description: c.description,
          amount: c.amount,
          paid: c.payments.reduce((s, p) => s + p.amount, 0),
          dueDate: c.dueDate,
        }))
        .filter((c) => c.paid < c.amount);

      if (openCharges.length === 0) {
        skippedNoDebt++;
        continue;
      }
      if (!r.email) {
        skippedNoEmail++;
        results.push({ resident: r.fullName, status: "NO_EMAIL" });
        continue;
      }

      const { subject, body: emailBody } = buildDebtReminderEmail({
        residentName: r.fullName,
        buildingName: r.building.name,
        charges: openCharges,
      });

      const res = await sendEmail({
        to: r.email,
        subject,
        body: emailBody,
        type: "DEBT_REMINDER",
        residentId: r.id,
      });
      results.push({ resident: r.fullName, status: res.status });
      if (res.status !== "FAILED") sent++;
    }

    return { ok: true, sent, skippedNoEmail, skippedNoDebt, results };
  });
}

// יומן תזכורות אחרונות
export async function GET() {
  return handle(async () => {
    await requireRole("ADMIN", "COMMITTEE");
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });
}
