"use client";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/enums";

export function Header({
  fullName,
  role,
}: {
  fullName: string;
  role: Role;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserCircle className="h-5 w-5" />
        <span className="font-medium text-foreground">{fullName}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {ROLE_LABELS[role]}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4" />
        התנתקות
      </Button>
    </header>
  );
}
