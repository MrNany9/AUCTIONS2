"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Users,
  Home,
  Pencil,
  AlertTriangle,
  Wrench,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/client";
import { TRADES, TRADE_LABELS, type Trade } from "@/lib/enums";

interface Rep {
  fullName: string;
  phone: string | null;
  unit: string | null;
}
interface Provider {
  id: string;
  trade: string;
  supplierName: string;
  supplierPhone: string | null;
}
interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  numUnits: number;
  floors: number | null;
  monthlyFeePerUnit: number;
  active: boolean;
  activeSince: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  contractor: string | null;
  notes: string | null;
  unitCount: number;
  residentCount: number;
  reps: Rep[];
  providers: Provider[];
}
interface SupplierOpt {
  id: string;
  name: string;
  service: string;
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export function BuildingsClient({
  buildings,
  canCreate,
  allSuppliers,
}: {
  buildings: Building[];
  canCreate: boolean;
  allSuppliers: SupplierOpt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [providersFor, setProvidersFor] = useState<Building | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [provForm, setProvForm] = useState({ trade: "PLUMBER", supplierId: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ monthlyFeePerUnit: 0, numUnits: 0 });
    setError("");
    setOpen(true);
  }
  function openEdit(b: Building) {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address,
      city: b.city,
      numUnits: b.numUnits,
      floors: b.floors ?? "",
      monthlyFeePerUnit: b.monthlyFeePerUnit,
      contractor: b.contractor ?? "",
      active: b.active,
      activeSince: toDateInput(b.activeSince),
      contractStart: toDateInput(b.contractStart),
      contractEnd: toDateInput(b.contractEnd),
      notes: b.notes ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api(`/api/buildings/${editing.id}`, { method: "PATCH", json: form });
      } else {
        await api("/api/buildings", { method: "POST", json: form });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function addProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!providersFor || !provForm.supplierId) return;
    setSaving(true);
    try {
      await api("/api/building-suppliers", {
        method: "POST",
        json: { buildingId: providersFor.id, ...provForm },
      });
      router.refresh();
      setProvidersFor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function removeProvider(id: string) {
    await api(`/api/building-suppliers/${id}`, { method: "DELETE" });
    router.refresh();
    setProvidersFor(null);
  }

  return (
    <div>
      <PageHeader
        title="בניינים"
        description="ניהול הבניינים שבאחריות חברת הניהול"
        action={
          canCreate && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              בניין חדש
            </Button>
          )
        }
      />

      {buildings.length === 0 ? (
        <EmptyState message="עדיין אין בניינים. הוסיפו בניין ראשון כדי להתחיל." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {buildings.map((b) => {
            const contractDays = b.contractEnd ? daysUntil(b.contractEnd) : null;
            const contractExpired = contractDays != null && contractDays < 0;
            const contractSoon =
              contractDays != null && contractDays >= 0 && contractDays <= 60;
            return (
              <Card key={b.id} className={!b.active ? "opacity-60" : ""}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>{b.name}</CardTitle>
                    {!b.active && <Badge variant="neutral">לא פעיל</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {b.address}, {b.city}
                    {b.contractor && ` · קבלן: ${b.contractor}`}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      {b.unitCount} דירות
                      {b.floors != null && ` · ${b.floors} קומות`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {b.residentCount} דיירים
                    </span>
                  </div>

                  {/* חוזה ניהול */}
                  {(b.contractStart || b.contractEnd) && (
                    <div
                      className={`rounded-md px-3 py-2 text-xs ${
                        contractExpired
                          ? "bg-destructive/10 text-destructive"
                          : contractSoon
                            ? "bg-warning/15"
                            : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      חוזה ניהול: {formatDate(b.contractStart)} —{" "}
                      {formatDate(b.contractEnd)}
                      {(contractExpired || contractSoon) && (
                        <span className="mr-2 inline-flex items-center gap-1 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          {contractExpired
                            ? "נדרש חידוש חוזה!"
                            : `לחידוש בעוד ${contractDays} ימים`}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    דמי ועד חודשיים:{" "}
                    <span className="font-semibold">
                      {formatCurrency(b.monthlyFeePerUnit)}
                    </span>
                  </div>

                  {/* נציגות ועד הבית */}
                  {b.reps.length > 0 && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-xs font-semibold">
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        נציגות ועד הבית
                      </p>
                      {b.reps.map((r, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          {r.fullName}
                          {r.unit && ` (דירה ${r.unit})`}
                          {r.phone && (
                            <span dir="ltr"> · {r.phone}</span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* ספקי הבניין */}
                  <div>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      onClick={() => {
                        setProvForm({ trade: "PLUMBER", supplierId: allSuppliers[0]?.id ?? "" });
                        setError("");
                        setProvidersFor(b);
                      }}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      ספקי הבניין ({b.providers.length})
                    </button>
                    {b.providers.slice(0, 3).map((p) => (
                      <p key={p.id} className="text-xs text-muted-foreground">
                        {TRADE_LABELS[p.trade as Trade] ?? p.trade}: {p.supplierName}
                        {p.supplierPhone && <span dir="ltr"> · {p.supplierPhone}</span>}
                      </p>
                    ))}
                  </div>

                  {b.notes && (
                    <p className="text-xs text-muted-foreground">{b.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* יצירה/עריכה */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "עריכת בניין" : "בניין חדש"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="שם הבניין" required>
            <Input
              value={(form.name as string) ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="כתובת" required>
              <Input
                value={(form.address as string) ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </Field>
            <Field label="עיר" required>
              <Input
                value={(form.city as string) ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="מספר דירות">
              <Input
                type="number"
                min={0}
                value={(form.numUnits as number) ?? 0}
                onChange={(e) =>
                  setForm({ ...form, numUnits: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="קומות">
              <Input
                type="number"
                min={0}
                value={(form.floors as string | number) ?? ""}
                onChange={(e) => setForm({ ...form, floors: e.target.value })}
              />
            </Field>
            <Field label="דמי ועד (₪)">
              <Input
                type="number"
                min={0}
                value={(form.monthlyFeePerUnit as number) ?? 0}
                onChange={(e) =>
                  setForm({ ...form, monthlyFeePerUnit: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="קבלן">
              <Input
                value={(form.contractor as string) ?? ""}
                onChange={(e) => setForm({ ...form, contractor: e.target.value })}
              />
            </Field>
            <Field label="תחילת פעילות">
              <Input
                type="date"
                value={(form.activeSince as string) ?? ""}
                onChange={(e) => setForm({ ...form, activeSince: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="חוזה ניהול - תחילה">
              <Input
                type="date"
                value={(form.contractStart as string) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, contractStart: e.target.value })
                }
              />
            </Field>
            <Field label="חוזה ניהול - סיום">
              <Input
                type="date"
                value={(form.contractEnd as string) ?? ""}
                onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
              />
            </Field>
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.active)}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              בניין פעיל
            </label>
          )}
          <Field label="הערות">
            <Textarea
              value={(form.notes as string) ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

      {/* ניהול ספקי הבניין */}
      <Modal
        open={!!providersFor}
        onClose={() => setProvidersFor(null)}
        title={providersFor ? `ספקי הבניין — ${providersFor.name}` : ""}
      >
        {providersFor && (
          <div className="space-y-4">
            {providersFor.providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                עדיין לא שויכו ספקים לבניין.
              </p>
            ) : (
              <div className="space-y-2">
                {providersFor.providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">
                        {TRADE_LABELS[p.trade as Trade] ?? p.trade}
                      </span>
                      : {p.supplierName}
                      {p.supplierPhone && <span dir="ltr"> · {p.supplierPhone}</span>}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeProvider(p.id)}
                    >
                      הסרה
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={addProvider} className="space-y-3 border-t pt-4">
              <Label className="font-semibold">שיוך ספק לתחום</Label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={provForm.trade}
                  onChange={(e) =>
                    setProvForm({ ...provForm, trade: e.target.value })
                  }
                >
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {TRADE_LABELS[t]}
                    </option>
                  ))}
                </Select>
                <Select
                  value={provForm.supplierId}
                  onChange={(e) =>
                    setProvForm({ ...provForm, supplierId: e.target.value })
                  }
                  required
                >
                  <option value="">בחרו ספק...</option>
                  {allSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.service})
                    </option>
                  ))}
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={saving || !provForm.supplierId}>
                  הוספה
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
