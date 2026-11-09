import { useEffect, useState } from "react";
import { GaugeCircle, KeyRound, Save, School, Timer } from "lucide-react";
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { db, DEFAULT_SETTINGS, friendlyError, loadSettings, type AppSettings } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import type { Teacher } from "@/types";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const teacher = user as Teacher | null;

  const [s, setS] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(teacher?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    loadSettings()
      .then((v) => setS(v))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (teacher?.name) setFullName(teacher.name);
  }, [teacher?.name]);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setS((prev) => ({ ...prev, [k]: v }));

  const saveSettings = async () => {
    if (s.weak_threshold >= s.strong_threshold) {
      toast({ type: "error", title: "Check thresholds", message: "Weak threshold must be lower than strong threshold." });
      return;
    }
    if (!s.school_name.trim()) {
      toast({ type: "error", title: "School name required" });
      return;
    }
    setSaving(true);
    const { error } = await db
      .from("app_settings")
      .update({
        school_name: s.school_name.trim(),
        school_address: s.school_address.trim(),
        strong_threshold: s.strong_threshold,
        weak_threshold: s.weak_threshold,
        default_duration_minutes: s.default_duration_minutes,
        idle_logout_minutes: s.idle_logout_minutes,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) toast({ type: "error", title: "Save failed", message: friendlyError(error.message) });
    else toast({ type: "success", title: "Settings saved", message: "Changes apply to all teachers and students." });
  };

  const saveName = async () => {
    if (!user || !fullName.trim()) return;
    setSavingName(true);
    const { error } = await db.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
    setSavingName(false);
    if (error) toast({ type: "error", title: "Update failed", message: friendlyError(error.message) });
    else toast({ type: "success", title: "Name updated", message: "Reload the page to see it everywhere." });
  };

  const changePassword = async () => {
    if (pw1.length < 8) {
      toast({ type: "error", title: "Password too short", message: "Use at least 8 characters." });
      return;
    }
    if (pw1 !== pw2) {
      toast({ type: "error", title: "Passwords don't match" });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setSavingPw(false);
    if (error) {
      toast({ type: "error", title: "Could not change password", message: friendlyError(error.message) });
      return;
    }
    setPw1("");
    setPw2("");
    toast({ type: "success", title: "Password changed", message: "Use the new password next time you log in." });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Your account, school details and exam thresholds." />

      <Card>
        <CardHeader title="Your profile" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-canvas p-4">
            <Avatar name={teacher?.name ?? "Teacher"} color={teacher?.avatarColor ?? "#2563EB"} size={52} />
            <div>
              <p className="text-sm font-semibold text-ink">{teacher?.name ?? "—"}</p>
              <p className="text-xs text-muted">Username: {teacher?.username ?? "—"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Full name">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
            </div>
            <Button variant="secondary" onClick={() => void saveName()} loading={savingName}>
              Update name
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" subtitle="Change the default password before using the system with students" />
        <CardBody className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              leftIcon={<KeyRound className="size-4" />}
            />
          </Field>
          <Field label="Confirm password">
            <Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          <Button onClick={() => void changePassword()} loading={savingPw}>
            Change
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="School" subtitle="Shown on printed results and reports" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="School name">
            <Input
              value={s.school_name}
              onChange={(e) => set("school_name", e.target.value)}
              leftIcon={<School className="size-4" />}
              disabled={!loaded}
            />
          </Field>
          <Field label="Address">
            <Input value={s.school_address} onChange={(e) => set("school_address", e.target.value)} disabled={!loaded} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Performance thresholds & exams" subtitle="Used to classify topics and students" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Strong (≥ %)" hint="accuracy">
            <Input
              type="number"
              min={1}
              max={100}
              value={s.strong_threshold}
              onChange={(e) => set("strong_threshold", Number(e.target.value))}
              leftIcon={<GaugeCircle className="size-4" />}
              disabled={!loaded}
            />
          </Field>
          <Field label="Weak (< %)" hint="accuracy">
            <Input
              type="number"
              min={1}
              max={100}
              value={s.weak_threshold}
              onChange={(e) => set("weak_threshold", Number(e.target.value))}
              leftIcon={<GaugeCircle className="size-4" />}
              disabled={!loaded}
            />
          </Field>
          <Field label="Auto-logout when idle">
            <Select
              value={String(s.idle_logout_minutes)}
              onChange={(e) => set("idle_logout_minutes", Number(e.target.value))}
              disabled={!loaded}
            >
              <option value="10">After 10 minutes</option>
              <option value="15">After 15 minutes</option>
              <option value="30">After 30 minutes</option>
              <option value="60">After 60 minutes</option>
            </Select>
          </Field>
          <Field label="Default mock duration (minutes)">
            <Input
              type="number"
              min={5}
              max={300}
              value={s.default_duration_minutes}
              onChange={(e) => set("default_duration_minutes", Number(e.target.value))}
              leftIcon={<Timer className="size-4" />}
              disabled={!loaded}
            />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => void saveSettings()} loading={saving} disabled={!loaded} leftIcon={<Save className="size-4" />}>
          Save settings
        </Button>
      </div>
    </div>
  );
}
