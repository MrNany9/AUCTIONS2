"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהתחברות");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-primary p-3 text-primary-foreground">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">מערכת ניהול ועד בית</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            התחברו כדי לנהל בניינים, דיירים ותשלומים
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vaad.co.il"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "מתחבר..." : "התחברות"}
              </Button>
            </form>
            <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium">כניסה לדוגמה:</p>
              <p>מנהל: admin@vaad.co.il / admin123</p>
              <p>ועד: vaad@vaad.co.il / vaad123</p>
              <p>דייר: dana@herzl15.co.il / dana123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
