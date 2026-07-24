import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFmt = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFmt.format(amount ?? 0);
}

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFmt.format(d);
}

// YYYY-MM -> "יולי 2026"
export function formatPeriod(period: string | null | undefined): string {
  if (!period) return "—";
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
  }).format(new Date(y, m - 1, 1));
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
