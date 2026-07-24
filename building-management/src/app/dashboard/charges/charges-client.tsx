"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarClock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import { ChargeStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, currentPeriod } from "@/lib/utils";
import { api } from "@/lib/client";
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  CHARGE_STATUSES,
  CHARGE_STATUS_LABELS,
  type ChargeType,
  type ChargeStatus,
} from "@/lib/enums";

interface ChargeRow {
  id: string;
  type: string;
  amount: number;
  paid: number;
  dueDate: string;
  period: string | null;
  description: string | null;
  status: ChargeStatus;
  residentName: string;
  unitNumber: string | null;
  buildingName: string;
}
interface BuildingOpt {
  id: string;
  name: string;
  monthlyFeePerUnit: number;
}
interface ResidentOpt {
  id: string;
  fullName: string;
  buildingId: string;
}

export function ChargesClient({
  charges,
  buildings,
  residents,
  isManager,
}: {
  charges: ChargeRow[];
  buildings: BuildingOpt[];
  residents: ResidentOpt[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [genForm, setGenForm] = useState({
    buildingId: "",
    period: currentPeriod(),
    dueDay: 10,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [genResult, setGenResult] = useState("");

  const filtered = useMemo(
    () =>
      statusFilter ? charges.filter((c) => c.status === statusFilter) : charges,
    [charges, statusFilter]
  );

  const totals = useMemo(() => {
    const open = charges.filter((c) => c.status !== "PAID");
    return {
      openCount: open.length,
      openSum: open.reduce((s, c) => s + (c.amount - c.paid), 0),
    };
  }, [charges]);

  async function createCharge(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const resident = residents.find((r) => r.id === form.residentId);
      await api("/api/charges", {
        method: "POST",
        json: { ...form, buildingId: resident?.buildingId },
      });
      setNewOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setGenResult("");
    try {
      const res = await api<{ created: number; skipped: number; error?: string }>(
        "/api/charges/generate",
        { method: "POST", json: genForm }
      );
      if (res.error) throw new Error(res.error);
      setGenResult(
        `נוצרו ${res.created} דרישות חדשות (${res.skipped} דיירים כבר חויבו לתקופה זו).`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: ChargeRow) {
    if (!confirm(`למחוק את הדרישה של ${c.residentName} על ${formatCurrency(c.amount)}?`))
      return;
    await api(`/api/charges/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="דרישות תשלום"
        description={`${totals.openCount} דרישות פתוחות · יתרה לגבייה ${formatCurrency(totals.openSum)}`}
        action={
          isManager && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setGenResult(""); setError(""); setGenOpen(true); }}>
                <CalendarClock className="h-4 w-4" />
                הפקת דרישות חודשיות
              </Button>
              <Button onClick={() => { setForm({ type: "SPECIAL" }); setError(""); setNewOpen(true); }}>
                <Plus className="h-4 w-4" />
                דרישה חדשה
              </Button>
            </div>
          )
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">סינון לפי סטטוס:</span>
        <Select
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">הכל</option>
          {CHARGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CHARGE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState message="אין דרישות תשלום להצגה." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>דייר</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>סכום</TableHead>
                  <TableHead>שולם</TableHead>
                  <TableHead>לתשלום עד</TableHead>
                  <TableHead>סטטוס</TableHead>
                  {isManager && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.residentName}
                      {c.unitNumber && (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          (דירה {c.unitNumber})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.buildingName}
                    </TableCell>
                    <TableCell>{c.description ?? "—"}</TableCell>
                    <TableCell>
                      {CHARGE_TYPE_LABELS[c.type as ChargeType] ?? c.type}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(c.amount)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatCurrency(c.paid)}
                    </TableCell>
                    <TableCell>{formatDate(c.dueDate)}</TableCell>
                    <TableCell>
                      <ChargeStatusBadge status={c.status} />
                    </TableCell>
                    {isManager && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => remove(c)}
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

      {/* דרישה בודדת */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="דרישת תשלום חדשה">
        <form onSubmit={createCharge} className="space-y-4">
          <Field label="דייר" required>
            <Select
              value={(form.residentId as string) ?? ""}
              onChange={(e) => setForm({ ...form, residentId: e.target.value })}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="סוג" required>
              <Select
                value={(form.type as string) ?? "SPECIAL"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {CHARGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CHARGE_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
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
          </div>
          <Field label="לתשלום עד" required>
            <Input
              type="date"
              value={(form.dueDate as string) ?? ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </Field>
          <Field label="תיאור">
            <Input
              value={(form.description as string) ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="למשל: השתתפות בשיפוץ לובי"
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "יצירה"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* מחולל חודשי */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="הפקת דרישות דמי ועד חודשיות"
      >
        <form onSubmit={generate} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            הפקה אוטומטית של דרישת דמי ועד לכל דיירי הבניין לתקופה שנבחרה.
            דיירים שכבר חויבו לתקופה זו ידולגו.
          </p>
          <Field label="בניין" required>
            <Select
              value={genForm.buildingId}
              onChange={(e) =>
                setGenForm({ ...genForm, buildingId: e.target.value })
              }
              required
            >
              <option value="">בחרו בניין...</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({formatCurrency(b.monthlyFeePerUnit)}/דירה)
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="תקופה (חודש)" required>
              <Input
                type="month"
                value={genForm.period}
                onChange={(e) =>
                  setGenForm({ ...genForm, period: e.target.value })
                }
                required
              />
            </Field>
            <Field label="יום לתשלום בחודש">
              <Input
                type="number"
                min={1}
                max={28}
                value={genForm.dueDay}
                onChange={(e) =>
                  setGenForm({ ...genForm, dueDay: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          {genResult && (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
              {genResult}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setGenOpen(false)}>
              סגירה
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "מפיק..." : "הפקה"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
