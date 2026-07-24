"use client";
import { useMemo, useState } from "react";
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
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/enums";

interface PaymentRow {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference: string | null;
  note: string | null;
  residentName: string;
  unitNumber: string | null;
  chargeDescription: string | null;
}
interface ResidentOpt {
  id: string;
  fullName: string;
}
interface OpenCharge {
  id: string;
  residentId: string;
  description: string;
  remaining: number;
}

export function PaymentsClient({
  payments,
  residents,
  openCharges,
  isManager,
}: {
  payments: PaymentRow[];
  residents: ResidentOpt[];
  openCharges: OpenCharge[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const residentCharges = useMemo(
    () => openCharges.filter((c) => c.residentId === form.residentId),
    [openCharges, form.residentId]
  );

  function openNew() {
    setForm({ method: "TRANSFER", date: new Date().toISOString().slice(0, 10) });
    setError("");
    setOpen(true);
  }

  // בחירת דרישה ממלאת אוטומטית את הסכום הנותר
  function pickCharge(chargeId: string) {
    const charge = residentCharges.find((c) => c.id === chargeId);
    setForm({
      ...form,
      chargeId,
      amount: charge ? String(charge.remaining) : form.amount,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/payments", { method: "POST", json: form });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: PaymentRow) {
    if (!confirm(`למחוק את התשלום של ${p.residentName} על ${formatCurrency(p.amount)}?`))
      return;
    await api(`/api/payments/${p.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="תשלומים וגבייה"
        description={`${payments.length} תשלומים · סה"כ ${formatCurrency(total)}`}
        action={
          isManager && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              רישום תשלום
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState message="עדיין לא נרשמו תשלומים." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>דייר</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>אמצעי</TableHead>
                  <TableHead>עבור</TableHead>
                  <TableHead>אסמכתא</TableHead>
                  {isManager && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.residentName}
                      {p.unitNumber && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          (דירה {p.unitNumber})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums text-success">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.chargeDescription ?? p.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                      {p.reference ?? "—"}
                    </TableCell>
                    {isManager && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="רישום תשלום">
        <form onSubmit={save} className="space-y-4">
          <Field label="דייר" required>
            <Select
              value={(form.residentId as string) ?? ""}
              onChange={(e) =>
                setForm({ ...form, residentId: e.target.value, chargeId: "" })
              }
              required
            >
              <option value="">בחרו דייר...</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </Select>
          </Field>
          {residentCharges.length > 0 && (
            <Field label="שיוך לדרישת תשלום">
              <Select
                value={(form.chargeId as string) ?? ""}
                onChange={(e) => pickCharge(e.target.value)}
              >
                <option value="">— ללא שיוך —</option>
                {residentCharges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.description} (נותר {formatCurrency(c.remaining)})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="סכום (₪)" required>
              <Input
                type="number"
                min={1}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="אמצעי תשלום">
              <Select
                value={(form.method as string) ?? "TRANSFER"}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="אסמכתא">
              <Input
                dir="ltr"
                value={(form.reference as string) ?? ""}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </Field>
          </div>
          <Field label="הערה">
            <Input
              value={(form.note as string) ?? ""}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "רישום"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
