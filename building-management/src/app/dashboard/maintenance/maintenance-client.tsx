"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import { MaintStatusBadge, PriorityBadge } from "@/components/status-badge";
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
  MAINT_CATEGORIES,
  MAINT_CATEGORY_LABELS,
  MAINT_PRIORITIES,
  MAINT_PRIORITY_LABELS,
  MAINT_STATUSES,
  MAINT_STATUS_LABELS,
  type MaintCategory,
} from "@/lib/enums";

interface RequestRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  cost: number | null;
  createdAt: string;
  buildingName: string;
  supplierId: string | null;
  supplierName: string | null;
  reporterName: string | null;
}
interface Opt {
  id: string;
  name: string;
}
interface SupplierOpt extends Opt {
  service: string;
}

export function MaintenanceClient({
  requests,
  buildings,
  suppliers,
  isManager,
}: {
  requests: RequestRow[];
  buildings: Opt[];
  suppliers: SupplierOpt[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openCount = requests.filter(
    (r) => r.status === "OPEN" || r.status === "IN_PROGRESS"
  ).length;

  function openNew() {
    setForm({
      buildingId: buildings[0]?.id ?? "",
      category: "OTHER",
      priority: "MED",
    });
    setError("");
    setNewOpen(true);
  }

  function openEdit(r: RequestRow) {
    if (!isManager) return;
    setEditing(r);
    setForm({
      status: r.status,
      priority: r.priority,
      assignedSupplierId: r.supplierId ?? "",
      cost: r.cost != null ? String(r.cost) : "",
    });
    setError("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/maintenance", { method: "POST", json: form });
      setNewOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/maintenance/${editing.id}`, { method: "PATCH", json: form });
      setEditing(null);
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
        title="תיקונים ותחזוקה"
        description={`${openCount} קריאות פתוחות מתוך ${requests.length}`}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            קריאת תיקון חדשה
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-6">
              <EmptyState message="אין קריאות תיקון." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>נושא</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>עדיפות</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>עלות</TableHead>
                  <TableHead>נפתחה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow
                    key={r.id}
                    className={isManager ? "cursor-pointer" : ""}
                    onClick={() => openEdit(r)}
                  >
                    <TableCell>
                      <div className="font-medium">{r.title}</div>
                      {r.reporterName && (
                        <div className="text-xs text-muted-foreground">
                          דווח ע״י {r.reporterName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.buildingName}
                    </TableCell>
                    <TableCell>
                      {MAINT_CATEGORY_LABELS[r.category as MaintCategory] ??
                        r.category}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={r.priority} />
                    </TableCell>
                    <TableCell>
                      <MaintStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.supplierName ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {r.cost != null ? formatCurrency(r.cost) : "—"}
                    </TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* קריאה חדשה */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="קריאת תיקון חדשה">
        <form onSubmit={create} className="space-y-4">
          {isManager && (
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
          )}
          <Field label="נושא" required>
            <Input
              value={(form.title as string) ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="למשל: נזילה בחניון"
              required
            />
          </Field>
          <Field label="תיאור">
            <Textarea
              value={(form.description as string) ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="קטגוריה">
              <Select
                value={(form.category as string) ?? "OTHER"}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {MAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {MAINT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="עדיפות">
              <Select
                value={(form.priority as string) ?? "MED"}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {MAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {MAINT_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שולח..." : "פתיחת קריאה"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* עריכת קריאה (מנהל) */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `טיפול בקריאה: ${editing.title}` : ""}
      >
        {editing && (
          <form onSubmit={update} className="space-y-4">
            {editing.description && (
              <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                {editing.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="סטטוס">
                <Select
                  value={(form.status as string) ?? "OPEN"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {MAINT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {MAINT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="עדיפות">
                <Select
                  value={(form.priority as string) ?? "MED"}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {MAINT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {MAINT_PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="ספק מטפל">
              <Select
                value={(form.assignedSupplierId as string) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, assignedSupplierId: e.target.value })
                }
              >
                <option value="">— ללא —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.service})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="עלות (₪)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={(form.cost as string) ?? ""}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              <Wrench className="mb-0.5 inline h-3 w-3" /> סגירת קריאה עם עלות
              וספק תרשום הוצאה אוטומטית.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "שומר..." : "עדכון"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
