"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Phone, Mail, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
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

export function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
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

  return (
    <div>
      <PageHeader
        title="ספקים"
        description="פנקס ספקי השירות של הבניינים"
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            ספק חדש
          </Button>
        }
      />

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
    </div>
  );
}
