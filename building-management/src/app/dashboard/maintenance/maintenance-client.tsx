"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench, CalendarClock, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BILL_TO_OPTIONS,
  BILL_TO_LABELS,
  type MaintCategory,
  type BillTo,
} from "@/lib/enums";

interface RequestRow {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  priority: string;
  status: string;
  cost: number | null;
  billTo: string;
  recurring: boolean;
  receivedBy: string | null;
  reporterPhone: string | null;
  createdAt: string;
  buildingName: string;
  supplierId: string | null;
  supplierName: string | null;
  reporterName: string | null;
  fromSchedule: boolean;
}
interface ScheduleRow {
  id: string;
  title: string;
  category: string;
  frequencyMonths: number;
  nextDueAt: string;
  active: boolean;
  buildingId: string;
  buildingName: string;
  supplierId: string | null;
  supplierName: string | null;
  generatedCount: number;
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
  schedules,
  buildings,
  suppliers,
  isManager,
}: {
  requests: RequestRow[];
  schedules: ScheduleRow[];
  buildings: Opt[];
  suppliers: SupplierOpt[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<RequestRow | null>(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [schedForm, setSchedForm] = useState<Record<string, unknown>>({});
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
      billTo: r.billTo,
      recurring: r.recurring,
    });
    setError("");
  }

  function openNewSchedule() {
    setSchedForm({
      buildingId: buildings[0]?.id ?? "",
      category: "OTHER",
      frequencyMonths: 6,
      nextDueAt: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setSchedOpen(true);
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

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/schedules", { method: "POST", json: schedForm });
      setSchedOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchedule(s: ScheduleRow) {
    await api(`/api/schedules/${s.id}`, {
      method: "PATCH",
      json: { active: !s.active },
    });
    router.refresh();
  }

  async function removeSchedule(s: ScheduleRow) {
    if (!confirm(`למחוק את תוכנית התחזוקה "${s.title}"?`)) return;
    await api(`/api/schedules/${s.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="תיקונים ותחזוקה"
        description={`${openCount} קריאות פתוחות מתוך ${requests.length}`}
        action={
          <div className="flex gap-2">
            {isManager && (
              <Button variant="outline" onClick={openNewSchedule}>
                <CalendarClock className="h-4 w-4" />
                תוכנית תחזוקה מונעת
              </Button>
            )}
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              קריאת תיקון חדשה
            </Button>
          </div>
        }
      />

      {/* תוכניות תחזוקה מונעת */}
      {isManager && schedules.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              תחזוקה מונעת ({schedules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תוכנית</TableHead>
                  <TableHead>בניין</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>תדירות</TableHead>
                  <TableHead>מועד הבא</TableHead>
                  <TableHead>ספק</TableHead>
                  <TableHead>נוצרו</TableHead>
                  <TableHead>מצב</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.buildingName}
                    </TableCell>
                    <TableCell>
                      {MAINT_CATEGORY_LABELS[s.category as MaintCategory] ??
                        s.category}
                    </TableCell>
                    <TableCell>
                      כל {s.frequencyMonths} חודשים
                    </TableCell>
                    <TableCell>{formatDate(s.nextDueAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.supplierName ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s.generatedCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.active ? "success" : "neutral"}>
                        {s.active ? "פעילה" : "מושהית"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSchedule(s)}
                        >
                          {s.active ? "השהיה" : "הפעלה"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeSchedule(s)}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
                      <div className="flex items-center gap-2 font-medium">
                        {r.title}
                        {r.fromSchedule && (
                          <Badge variant="default">מונעת</Badge>
                        )}
                        {r.recurring && (
                          <Badge variant="warning">חוזרת</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {r.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {r.location}
                          </span>
                        )}
                        {r.reporterName && <span>דווח ע״י {r.reporterName}</span>}
                        {r.receivedBy && <span>נקלט ע״י {r.receivedBy}</span>}
                      </div>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="מיקום בבניין">
              <Input
                value={(form.location as string) ?? ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="לובי / חניון / קומה 2 / גג..."
              />
            </Field>
            <Field label="טלפון מוסר הקריאה">
              <Input
                dir="ltr"
                value={(form.reporterPhone as string) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, reporterPhone: e.target.value })
                }
              />
            </Field>
          </div>
          {isManager && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.recurring)}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              תקלה חוזרת
            </label>
          )}
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="עלות (₪)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={(form.cost as string) ?? ""}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </Field>
              <Field label="למי לחייב">
                <Select
                  value={(form.billTo as string) ?? "COMMITTEE"}
                  onChange={(e) => setForm({ ...form, billTo: e.target.value })}
                >
                  {BILL_TO_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {BILL_TO_LABELS[b as BillTo]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.recurring)}
                onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              />
              תקלה חוזרת
            </label>
            <p className="text-xs text-muted-foreground">
              <Wrench className="mb-0.5 inline h-3 w-3" /> סגירת קריאה עם עלות:
              חיוב ועד/בניין רושם הוצאה, חיוב דייר יוצר דרישת תשלום לדייר שדיווח.
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

      {/* תוכנית תחזוקה מונעת חדשה */}
      <Modal
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        title="תוכנית תחזוקה מונעת חדשה"
      >
        <form onSubmit={createSchedule} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            המערכת תיצור קריאת תיקון אוטומטית בכל פעם שמגיע מועד הביצוע,
            ותקדם את המועד הבא לפי התדירות.
          </p>
          <Field label="שם התוכנית" required>
            <Input
              value={(schedForm.title as string) ?? ""}
              onChange={(e) =>
                setSchedForm({ ...schedForm, title: e.target.value })
              }
              placeholder="למשל: בדיקת בטיחות שנתית למעלית"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="בניין" required>
              <Select
                value={(schedForm.buildingId as string) ?? ""}
                onChange={(e) =>
                  setSchedForm({ ...schedForm, buildingId: e.target.value })
                }
                required
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="קטגוריה">
              <Select
                value={(schedForm.category as string) ?? "OTHER"}
                onChange={(e) =>
                  setSchedForm({ ...schedForm, category: e.target.value })
                }
              >
                {MAINT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {MAINT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="תדירות (חודשים)" required>
              <Input
                type="number"
                min={1}
                max={60}
                value={(schedForm.frequencyMonths as number) ?? 6}
                onChange={(e) =>
                  setSchedForm({
                    ...schedForm,
                    frequencyMonths: Number(e.target.value),
                  })
                }
                required
              />
            </Field>
            <Field label="מועד ביצוע ראשון" required>
              <Input
                type="date"
                value={(schedForm.nextDueAt as string) ?? ""}
                onChange={(e) =>
                  setSchedForm({ ...schedForm, nextDueAt: e.target.value })
                }
                required
              />
            </Field>
          </div>
          <Field label="ספק קבוע">
            <Select
              value={(schedForm.supplierId as string) ?? ""}
              onChange={(e) =>
                setSchedForm({ ...schedForm, supplierId: e.target.value })
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
          <Field label="תיאור">
            <Textarea
              value={(schedForm.description as string) ?? ""}
              onChange={(e) =>
                setSchedForm({ ...schedForm, description: e.target.value })
              }
            />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSchedOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "שומר..." : "יצירת תוכנית"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
