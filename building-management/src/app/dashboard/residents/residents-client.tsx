"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/client";

interface Resident {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  isOwner: boolean;
  unitNumber: string | null;
  unitId: string | null;
  buildingId: string;
  buildingName: string;
  balance: number;
}
interface Opt {
  id: string;
  name: string;
}
interface Unit {
  id: string;
  number: string;
  buildingId: string;
}

export function ResidentsClient({
  residents,
  buildings,
  units,
}: {
  residents: Resident[];
  buildings: Opt[];
  units: Unit[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalDebt = residents.reduce(
    (s, r) => s + (r.balance > 0 ? r.balance : 0),
    0
  );

  function openNew() {
    setEditing(null);
    setForm({
      buildingId: buildings[0]?.id ?? "",
      isOwner: true,
    });
    setError("");
    setOpen(true);
  }
  function openEdit(r: Resident) {
    setEditing(r);
    setForm({
      fullName: r.fullName,
      phone: r.phone ?? "",
      email: r.email ?? "",
      isOwner: r.isOwner,
      unitId: r.unitId ?? "",
      buildingId: r.buildingId,
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
        await api(`/api/residents/${editing.id}`, { method: "PATCH", json: form });
      } else {
        await api("/api/residents", { method: "POST", json: form });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Resident) {
    if (!confirm(`למחוק את הדייר ${r.fullName}? פעולה זו תמחק גם חיובים ותשלומים.`))
      return;
    await api(`/api/residents/${r.id}`, { method: "DELETE" });
    router.refresh();
  }

  const availableUnits = units.filter((u) => u.buildingId === form.buildingId);

  return (
    <div>
      <PageHeader
        title="דיירים"
        description={`${residents.length} דיירים · חוב כולל ${formatCurrency(totalDebt)}`}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            דייר חדש
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {residents.length === 0 ? (
            <div className="p-6">
              <EmptyState message="עדיין אין דיירים." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>דירה</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>קשר</TableHead>
                  <TableHead>יתרת חוב</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.fullName}</TableCell>
                    <TableCell>{r.unitNumber ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.buildingName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isOwner ? "default" : "neutral"}>
                        {r.isOwner ? "בעלים" : "שוכר"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {r.phone && (
                          <span className="flex items-center gap-1" dir="ltr">
                            <Phone className="h-3 w-3" />
                            {r.phone}
                          </span>
                        )}
                        {r.email && (
                          <span className="flex items-center gap-1" dir="ltr">
                            <Mail className="h-3 w-3" />
                            {r.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={`font-semibold tabular-nums ${
                        r.balance > 0 ? "text-destructive" : "text-success"
                      }`}
                    >
                      {formatCurrency(r.balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => remove(r)}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "עריכת דייר" : "דייר חדש"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="שם מלא" required>
            <Input
              value={(form.fullName as string) ?? ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="בניין" required>
              <Select
                value={(form.buildingId as string) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, buildingId: e.target.value, unitId: "" })
                }
                disabled={!!editing}
                required
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="דירה">
              <Select
                value={(form.unitId as string) ?? ""}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              >
                <option value="">— ללא —</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    דירה {u.number}
                  </option>
                ))}
              </Select>
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
          <Field label="סוג">
            <Select
              value={form.isOwner ? "owner" : "tenant"}
              onChange={(e) =>
                setForm({ ...form, isOwner: e.target.value === "owner" })
              }
            >
              <option value="owner">בעלים</option>
              <option value="tenant">שוכר</option>
            </Select>
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
