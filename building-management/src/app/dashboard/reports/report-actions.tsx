"use client";
import { useState } from "react";
import { Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";

interface ReminderResult {
  sent: number;
  skippedNoEmail: number;
  skippedNoDebt: number;
}

// כפתורי ייצוא CSV
export function ExportButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { type: "debtors", label: "ייצוא חייבים" },
        { type: "payments", label: "ייצוא תשלומים" },
        { type: "expenses", label: "ייצוא הוצאות" },
      ].map((x) => (
        <Button key={x.type} variant="outline" size="sm"
          onClick={() => window.open(`/api/export?type=${x.type}`, "_blank")}
        >
          <Download className="h-4 w-4" />
          {x.label}
        </Button>
      ))}
    </div>
  );
}

// שליחת תזכורת חוב לכל החייבים
export function RemindAllButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function send() {
    if (!confirm("לשלוח תזכורת חוב במייל לכל החייבים?")) return;
    setBusy(true);
    setResult("");
    try {
      const res = await api<ReminderResult>("/api/reminders", {
        method: "POST",
        json: { all: true },
      });
      setResult(
        `נשלחו ${res.sent} תזכורות` +
          (res.skippedNoEmail > 0
            ? ` · ${res.skippedNoEmail} חייבים ללא אימייל`
            : "")
      );
    } catch (err) {
      setResult(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button size="sm" onClick={send} disabled={busy}>
        <Mail className="h-4 w-4" />
        {busy ? "שולח..." : "תזכורת לכל החייבים"}
      </Button>
      {result && <span className="text-sm text-muted-foreground">{result}</span>}
    </div>
  );
}

// תזכורת לדייר בודד
export function RemindOneButton({
  residentId,
  hasEmail,
}: {
  residentId: string;
  hasEmail: boolean;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function send() {
    setState("busy");
    try {
      await api("/api/reminders", { method: "POST", json: { residentId } });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (!hasEmail)
    return <span className="text-xs text-muted-foreground">אין אימייל</span>;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={send}
      disabled={state === "busy" || state === "done"}
    >
      <Mail className="h-4 w-4" />
      {state === "idle" && "תזכורת"}
      {state === "busy" && "שולח..."}
      {state === "done" && "נשלחה ✓"}
      {state === "error" && "שגיאה - נסו שוב"}
    </Button>
  );
}
