"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wallet,
  Wrench,
  Truck,
  Receipt,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/enums";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard, roles: ["ADMIN", "COMMITTEE", "RESIDENT"] },
  { href: "/dashboard/buildings", label: "בניינים", icon: Building2, roles: ["ADMIN", "COMMITTEE"] },
  { href: "/dashboard/residents", label: "דיירים", icon: Users, roles: ["ADMIN", "COMMITTEE"] },
  { href: "/dashboard/charges", label: "דרישות תשלום", icon: FileText, roles: ["ADMIN", "COMMITTEE", "RESIDENT"] },
  { href: "/dashboard/payments", label: "תשלומים וגבייה", icon: Wallet, roles: ["ADMIN", "COMMITTEE", "RESIDENT"] },
  { href: "/dashboard/maintenance", label: "תיקונים ותחזוקה", icon: Wrench, roles: ["ADMIN", "COMMITTEE", "RESIDENT"] },
  { href: "/dashboard/announcements", label: "הודעות לדיירים", icon: Megaphone, roles: ["ADMIN", "COMMITTEE", "RESIDENT"] },
  { href: "/dashboard/suppliers", label: "ספקים", icon: Truck, roles: ["ADMIN", "COMMITTEE"] },
  { href: "/dashboard/expenses", label: "הוצאות", icon: Receipt, roles: ["ADMIN", "COMMITTEE"] },
  { href: "/dashboard/reports", label: "דוחות", icon: BarChart3, roles: ["ADMIN", "COMMITTEE"] },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-l bg-card md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">ניהול ועד בית</span>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
