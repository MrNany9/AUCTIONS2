"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Phone, Mail, Truck, FileSignature, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Supplier {
  id: string;
  name: string;
  service: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  requestCount: number;
  expenseCount: number;
}
interface Contract {
  id: string;
  description: string;
  monthlyCost: number;
  startDate: string;
  endDate: string;
  supplierName: string;
  buildingName: string;
}
interface Opt {
  id: string;
  name: string;
}

const EXPIRY_SOON_DAYS = 60;

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function SuppliersClient({
  suppliers,
  contracts,
  buildings,
}: {
  suppliers: Supplier[];
  contracts: Contract[];
  buildings: Opt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [contractOpen, setContractOpen] = useState(false);
  const [contractForm, setContractForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({});
    setError("");
    setOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      service: s.service,
      phone: s.phone ?? "",
      email: s.email ?? "",
      notes: s.notes ?? "",
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
        await api(`/api/suppliers/${editing.id}`, { method: "PATCH", json: form });
      } else {
        await api("/api/suppliers", { method: "POST", json: form });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Supplier) {
    if (!confirm(`למחוק את הספק ${s.name}?`)) return;
    await api(`/api/suppliers/${s.id}`, { method: "DELETE" });
    router.refresh();
  }

  function openNewContract() {
    setContractForm({
      supplierId: suppliers[0]?.id ?? "",
      buildingId: "",
      startDate: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setContractOpen(true);
  }

  async function saveContract(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/contracts", { method: "POST", json: contractForm });
      setContractOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function removeContract(c: Contract) {
    if (!confirm(`למחוק את החוזה "${c.description}"?`)) return;
    await api(`/api/contracts/${c.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="ספקים"
        description="פנקס ספקי השירות וחוזי השירות של הבניינים"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={openNewContract} disabled={suppliers.length === 0}>
              <FileSignature className="h-4 w-4" />
              חוזה חדש
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              ספק חדש
            </Button>
          </div>
        }
      />

      {/* חוזי שירות */}
      {contracts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              חוזי שירות ({contracts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>חוזה</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>עלות חודשית</TableHead>
                  <TableHead>תוקף</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => {
                  const days = daysUntil(c.endDate);
                  const expired = days < 0;
                  const soon = !expired && days <= EXPIRY_SOON_DAYS;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.description}</TableCell>
                      <TableCell>{c.supplierName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.buildingName}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(c.monthlyCost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {formatDate(c.startDate)} — {formatDate(c.endDate)}
                          </span>
                          {(soon || expired) && (
                            <span
                              className={`flex items-center gap-1 text-xs font-medium ${
                                expired ? "text-destructive" : "text-warning-foreground"
                              }`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {expired ? "פג תוקף" : `פוקע בעוד ${days} ימים`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeContract(c)}
                        >
                          מחיקה
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {suppliers.length === 0 ? (
        <EmptyState message="עדיין אין ספקים." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <CardTitle>{s.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => remove(s)}
                  >
                    מחיקה
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium text-primary">{s.service}</p>
                {s.phone && (
                  <p className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                    <Phone className="h-3.5 w-3.5" /> {s.phone}
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-1 text-muted-foreground" dir="ltr">
                    <Mail className="h-3.5 w-3.5" /> {s.email}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {s.requestCount} קריאות · {s.expenseCount} הוצאות
                </p>
                {s.notes && (
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "עריכת ספק" : "ספק חדש"}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="שם הספק" required>
              <Input
                value={(form.name as string) ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field label="תחום שירות" required>
              <Input
                value={(form.service as string) ?? ""}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder="חשמל / אינסטלציה / ניקיון..."
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="טלפון">
              <Input
                dir="ltr"
                value={(form.phone as string) ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="אימייל">
              <Input
                dir="ltr"
                type="email"
                value={(form.email as string) ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
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

      {/* חוזה שירות חדש */}
      <Modal
        open={contractOpen}
        onClose={() => setContractOpen(false)}
        title="חוזה שירות חדש"
      >
        <form onSubmit={saveContract} className="space-y-4">
          <Field label="תיאור החוזה" required>
            <Input
              value={(contractForm.description as string) ?? ""}
              onChange={(e) =>
                setContractForm({ ...contractForm, description: e.target.value })
              }
              placeholder="למשל: חוזה שירות שנתי למעלית"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ספק" required>
              <Select
                value={(contractForm.supplierId as string) ?? ""}
                onChange={(e) =>
                  setContractForm({ ...contractForm, supplierId: e.target.value })
                }
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="בניין">
              <Select
                value={(contractForm.buildingId as string) ?? ""}
                onChange={(e) =>
                  setContractForm({ ...contractForm, buildingId: e.target.value })
                }
              >
                <option value="">כל הבניינים</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="עלות חודשית (₪)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={(contractForm.monthlyCost as string) ?? ""}
                onChange={(e) =>
                  setContractForm({ ...contractForm, monthlyCost: e.target.value })
                }
              />
            </Field>
            <Field label="תחילה" required>
              <Input
                type="date"
                value={(contractForm.startDate as string) ?? ""}
                onChange={(e) =>
                  setContractForm({ ...contractForm, startDate: e.target.value })
                }
                required
              />
            </Field>
            <Field label="סיום" required>
              <Input
                type="date"
                value={(contractForm.endDate as string) ?? ""}
                onChange={(e) =>
                  setContractForm({ ...contractForm, endDate: e.target.value })
                }
                required
              />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContractOpen(false)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "יצירת חוזה"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
