"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/client";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/enums";

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  supplierName: string | null;
  buildingName: string;
}
interface Opt {
  id: string;
  name: string;
}

export function ExpensesClient({
  expenses,
  buildings,
  suppliers,
}: {
  expenses: ExpenseRow[];
  buildings: Opt[];
  suppliers: Opt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  function openNew() {
    setForm({
      buildingId: buildings[0]?.id ?? "",
      category: "OTHER",
      date: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/expenses", { method: "POST", json: form });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function remove(x: ExpenseRow) {
    if (!confirm(`למחוק הוצאה של ${formatCurrency(x.amount)}?`)) return;
    await api(`/api/expenses/${x.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="הוצאות"
        description={`${expenses.length} הוצאות · סה"כ ${formatCurrency(total)}`}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            הוצאה חדשה
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="p-6">
              <EmptyState message="עדיין אין הוצאות." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תיאור</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="font-medium">
                      {x.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {x.buildingName}
                    </TableCell>
                    <TableCell>
                      {EXPENSE_CATEGORY_LABELS[x.category as ExpenseCategory] ??
                        x.category}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {x.supplierName ?? "—"}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums text-destructive">
                      {formatCurrency(x.amount)}
                    </TableCell>
                    <TableCell>{formatDate(x.date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(x)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="הוצאה חדשה">
        <form onSubmit={save} className="space-y-4">
          <Field label="בניין" required>
            <Select
              value={(form.buildingId as string) ?? ""}
              onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              required
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="קטגוריה">
              <Select
                value={(form.category as string) ?? "OTHER"}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ספק">
              <Select
                value={(form.supplierId as string) ?? ""}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              >
                <option value="">— ללא —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="סכום (₪)" required>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={(form.amount as string) ?? ""}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </Field>
            <Field label="תאריך" required>
              <Input
                type="date"
                value={(form.date as string) ?? ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="תיאור">
            <Input
              value={(form.description as string) ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "שמירה"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
