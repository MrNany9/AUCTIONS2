"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pin, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, EmptyState } from "@/components/page-header";
import { formatDate } from "@/lib/utils";
import { api } from "@/lib/client";

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  buildingName: string;
}
interface Opt {
  id: string;
  name: string;
}

export function AnnouncementsClient({
  announcements,
  buildings,
  isManager,
}: {
  announcements: Announcement[];
  buildings: Opt[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setForm({ buildingId: buildings[0]?.id ?? "", pinned: false });
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/announcements", { method: "POST", json: form });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(a: Announcement) {
    await api(`/api/announcements/${a.id}`, {
      method: "PATCH",
      json: { pinned: !a.pinned },
    });
    router.refresh();
  }

  async function remove(a: Announcement) {
    if (!confirm(`למחוק את ההודעה "${a.title}"?`)) return;
    await api(`/api/announcements/${a.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="הודעות לדיירים"
        description="לוח מודעות של הבניין"
        action={
          isManager && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              הודעה חדשה
            </Button>
          )
        }
      />

      {announcements.length === 0 ? (
        <EmptyState message="אין הודעות בלוח המודעות." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-primary/40" : ""}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <CardTitle>{a.title}</CardTitle>
                  {a.pinned && (
                    <Badge variant="default">
                      <Pin className="ml-1 h-3 w-3" />
                      נעוצה
                    </Badge>
                  )}
                </div>
                {isManager && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => togglePin(a)}>
                      {a.pinned ? "ביטול נעיצה" : "נעיצה"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => remove(a)}
                    >
                      מחיקה
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{a.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {a.buildingName} · {formatDate(a.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="הודעה חדשה לדיירים">
        <form onSubmit={save} className="space-y-4">
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
          <Field label="כותרת" required>
            <Input
              value={(form.title as string) ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="למשל: הפסקת מים מתוכננת ביום ראשון"
              required
            />
          </Field>
          <Field label="תוכן ההודעה" required>
            <Textarea
              rows={5}
              value={(form.body as string) ?? ""}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.pinned)}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            />
            נעיצה בראש הלוח
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "מפרסם..." : "פרסום"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
