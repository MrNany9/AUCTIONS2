"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Phone,
  Mail,
  BookOpen,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/client";
import {
  COLLECTION_STATUSES,
  COLLECTION_STATUS_LABELS,
  LOG_KINDS,
  LOG_KIND_LABELS,
  type CollectionStatus,
  type LogKind,
} from "@/lib/enums";

interface Resident {
  id: string;
  fullName: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  idNumber: string | null;
  isOwner: boolean;
  isCommitteeRep: boolean;
  collectionStatus: string;
  standingOrder: boolean;
  chargeDay: number | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  active: boolean;
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
interface LogEntry {
  id: string;
  kind: string;
  content: string;
  createdBy: string | null;
  createdAt: string;
}

const collectionVariant: Record<string, "neutral" | "warning" | "destructive"> = {
  COLLECTION: "warning",
  LAWYER: "destructive",
  EXECUTION: "destructive",
};

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
  const [journalFor, setJournalFor] = useState<Resident | null>(null);
  const [replaceFor, setReplaceFor] = useState<Resident | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const visible = residents.filter((r) => showInactive || r.active);
  const totalDebt = visible.reduce((s, r) => s + (r.balance > 0 ? r.balance : 0), 0);

  function openNew() {
    setEditing(null);
    setForm({ buildingId: buildings[0]?.id ?? "", isOwner: true, collectionStatus: "NONE" });
    setError("");
    setOpen(true);
  }
  function openEdit(r: Resident) {
    setEditing(r);
    setForm({
      fullName: r.fullName,
      phone: r.phone ?? "",
      phone2: r.phone2 ?? "",
      email: r.email ?? "",
      idNumber: r.idNumber ?? "",
      isOwner: r.isOwner,
      isCommitteeRep: r.isCommitteeRep,
      collectionStatus: r.collectionStatus,
      standingOrder: r.standingOrder,
      chargeDay: r.chargeDay ?? "",
      leaseStart: r.leaseStart?.slice(0, 10) ?? "",
      leaseEnd: r.leaseEnd?.slice(0, 10) ?? "",
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
  const isRenter = form.isOwner === false;

  return (
    <div>
      <PageHeader
        title="דיירים"
        description={`${visible.length} דיירים · חוב כולל ${formatCurrency(totalDebt)}`}
        action={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              הצג היסטוריה
            </label>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              דייר חדש
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {visible.length === 0 ? (
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
                  <TableHead>גבייה</TableHead>
                  <TableHead>קשר</TableHead>
                  <TableHead>יתרת חוב</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} className={!r.active ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium">
                        {r.fullName}
                        {r.isCommitteeRep && (
                          <Badge variant="default">נציג ועד</Badge>
                        )}
                        {!r.active && <Badge variant="neutral">עזב</Badge>}
                      </div>
                      {r.standingOrder && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          הוראת קבע{r.chargeDay ? ` · יום ${r.chargeDay}` : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{r.unitNumber ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.buildingName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isOwner ? "default" : "neutral"}>
                        {r.isOwner ? "בעלים" : "שוכר"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.collectionStatus !== "NONE" && (
                        <Badge
                          variant={collectionVariant[r.collectionStatus] ?? "neutral"}
                        >
                          {COLLECTION_STATUS_LABELS[
                            r.collectionStatus as CollectionStatus
                          ] ?? r.collectionStatus}
                        </Badge>
                      )}
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
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="עריכה"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="יומן דייר"
                          onClick={() => setJournalFor(r)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        {r.active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="החלפת דייר"
                            onClick={() => setReplaceFor(r)}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
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

      {/* יצירה/עריכה */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "עריכת דייר" : "דייר חדש"}
        className="max-w-2xl"
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="שם מלא" required>
              <Input
                value={(form.fullName as string) ?? ""}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="ת.זהות">
              <Input
                dir="ltr"
                value={(form.idNumber as string) ?? ""}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              />
            </Field>
          </div>
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="טלפון">
              <Input
                dir="ltr"
                value={(form.phone as string) ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="טלפון נוסף">
              <Input
                dir="ltr"
                value={(form.phone2 as string) ?? ""}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
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
          <div className="grid grid-cols-2 gap-3">
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
            <Field label="סטטוס גבייה">
              <Select
                value={(form.collectionStatus as string) ?? "NONE"}
                onChange={(e) =>
                  setForm({ ...form, collectionStatus: e.target.value })
                }
              >
                {COLLECTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {COLLECTION_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {isRenter && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="חוזה שכירות - תחילה">
                <Input
                  type="date"
                  value={(form.leaseStart as string) ?? ""}
                  onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
                />
              </Field>
              <Field label="חוזה שכירות - סיום">
                <Input
                  type="date"
                  value={(form.leaseEnd as string) ?? ""}
                  onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
                />
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.standingOrder)}
                onChange={(e) =>
                  setForm({ ...form, standingOrder: e.target.checked })
                }
              />
              הוראת קבע
            </label>
            {Boolean(form.standingOrder) && (
              <Field label="יום חיוב בחודש">
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={(form.chargeDay as string | number) ?? ""}
                  onChange={(e) => setForm({ ...form, chargeDay: e.target.value })}
                />
              </Field>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.isCommitteeRep)}
              onChange={(e) =>
                setForm({ ...form, isCommitteeRep: e.target.checked })
              }
            />
            נציג ועד הבית
          </label>
          {!editing && (
            <Field label="יתרה ישנה (חוב פתיחה בש״ח, אופציונלי)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={(form.openingBalance as string) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
                placeholder="יירשם כדרישת תשלום מסוג חוב ישן"
              />
            </Field>
          )}
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

      {journalFor && (
        <JournalModal resident={journalFor} onClose={() => setJournalFor(null)} />
      )}
      {replaceFor && (
        <ReplaceModal
          resident={replaceFor}
          onClose={() => setReplaceFor(null)}
          onDone={() => {
            setReplaceFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// יומן דייר - שיחות, מכתבים, הערות
function JournalModal({
  resident,
  onClose,
}: {
  resident: Resident;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [kind, setKind] = useState("CALL");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLogs(await api<LogEntry[]>(`/api/residents/${resident.id}/logs`));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resident.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await api(`/api/residents/${resident.id}/logs`, {
        method: "POST",
        json: { kind, content },
      });
      setContent("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`יומן דייר — ${resident.fullName}`}>
      <div className="space-y-4">
        <form onSubmit={add} className="space-y-2">
          <div className="flex gap-2">
            <Select
              className="w-36"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {LOG_KINDS.map((k) => (
                <option key={k} value={k}>
                  {LOG_KIND_LABELS[k]}
                </option>
              ))}
            </Select>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="מה סוכם בשיחה / תוכן המכתב..."
            />
            <Button type="submit" size="sm" disabled={saving || !content.trim()}>
              רישום
            </Button>
          </div>
        </form>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {logs === null ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין רישומים ביומן.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="neutral">
                    {LOG_KIND_LABELS[l.kind as LogKind] ?? l.kind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(l.createdAt)}
                    {l.createdBy && ` · ${l.createdBy}`}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{l.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

// החלפת דייר - הישן נשמר בהיסטוריה, החדש נכנס לאותה דירה
function ReplaceModal({
  resident,
  onClose,
  onDone,
}: {
  resident: Resident;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({ isOwner: true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function replace(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/api/residents/${resident.id}/replace`, {
        method: "POST",
        json: form,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`החלפת דייר — דירה ${resident.unitNumber ?? ""}`}>
      <form onSubmit={replace} className="space-y-4">
        <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          {resident.fullName} יסומן כדייר שעזב (ההיסטוריה הפיננסית נשמרת),
          והדייר החדש ייכנס לאותה דירה.
        </p>
        <Field label="שם הדייר החדש" required>
          <Input
            value={(form.fullName as string) ?? ""}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </Field>
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
        {form.isOwner === false && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="שכירות - תחילה">
              <Input
                type="date"
                value={(form.leaseStart as string) ?? ""}
                onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
              />
            </Field>
            <Field label="שכירות - סיום">
              <Input
                type="date"
                value={(form.leaseEnd as string) ?? ""}
                onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
              />
            </Field>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "מחליף..." : "ביצוע החלפה"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
