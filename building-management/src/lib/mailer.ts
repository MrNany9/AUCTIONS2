import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";

// שולח מייל דרך SMTP אם מוגדר (משתני סביבה SMTP_*), אחרת מדמה שליחה
// (SIMULATED) כדי שהזרימה תעבוד גם בפיתוח. כל שליחה נרשמת ביומן ההודעות.

interface SendArgs {
  to: string;
  subject: string;
  body: string; // טקסט פשוט
  type?: string;
  residentId?: string | null;
}

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

export async function sendEmail({
  to,
  subject,
  body,
  type = "DEBT_REMINDER",
  residentId = null,
}: SendArgs): Promise<{ status: string; error?: string }> {
  let status = "SIMULATED";
  let error: string | undefined;

  if (smtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: body,
      });
      status = "SENT";
    } catch (e) {
      status = "FAILED";
      error = e instanceof Error ? e.message : String(e);
    }
  }

  await prisma.notification.create({
    data: { residentId, email: to, type, subject, body, status, error },
  });

  return { status, error };
}

const currency = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

// בונה את גוף תזכורת החוב עבור דייר
export function buildDebtReminderEmail(args: {
  residentName: string;
  buildingName: string;
  charges: { description: string | null; amount: number; paid: number; dueDate: Date }[];
}) {
  const lines = args.charges.map((c) => {
    const remaining = c.amount - c.paid;
    return `• ${c.description ?? "דרישת תשלום"} — ${currency.format(remaining)} (לתשלום עד ${dateFmt.format(c.dueDate)})`;
  });
  const total = args.charges.reduce((s, c) => s + (c.amount - c.paid), 0);

  const subject = `תזכורת תשלום — ${args.buildingName}`;
  const body = [
    `שלום ${args.residentName},`,
    ``,
    `ברצוננו להזכיר כי בחשבונך קיימות דרישות תשלום פתוחות בבניין ${args.buildingName}:`,
    ``,
    ...lines,
    ``,
    `סה"כ לתשלום: ${currency.format(total)}`,
    ``,
    `נודה להסדרת התשלום בהקדם.`,
    `בברכה,`,
    `ועד הבית / חברת הניהול`,
  ].join("\n");

  return { subject, body, total };
}
