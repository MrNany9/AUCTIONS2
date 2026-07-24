"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Users, Home, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/client";

interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  numUnits: number;
  monthlyFeePerUnit: number;
  notes: string | null;
  unitCount: number;
  residentCount: number;
}

export function BuildingsClient({
  buildings,
  canCreate,
}: {
  buildings: Building[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState<Partial<Building>>({});
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
    setForm(b);
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
          {buildings.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>{b.name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {b.address}, {b.city}
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {b.unitCount} דירות
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {b.residentCount} דיירים
                  </span>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  דמי ועד חודשיים:{" "}
                  <span className="font-semibold">
                    {formatCurrency(b.monthlyFeePerUnit)}
                  </span>
                </div>
                {b.notes && (
                  <p className="text-xs text-muted-foreground">{b.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "עריכת בניין" : "בניין חדש"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="שם הבניין" required>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="כתובת" required>
              <Input
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </Field>
            <Field label="עיר" required>
              <Input
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="מספר דירות">
              <Input
                type="number"
                min={0}
                value={form.numUnits ?? 0}
                onChange={(e) =>
                  setForm({ ...form, numUnits: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="דמי ועד חודשיים (₪)">
              <Input
                type="number"
                min={0}
                value={form.monthlyFeePerUnit ?? 0}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthlyFeePerUnit: Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <Field label="הערות">
            <Textarea
              value={form.notes ?? ""}
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
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
