import { useState } from "react";
import { GaugeCircle, Save, School, Timer } from "lucide-react";
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import type { Teacher } from "@/types";

function Toggle({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-[13px] text-muted">{description}</p>
      </div>
      <button
        onClick={() => setOn((o) => !o)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand-500" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const teacher = user as Teacher | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile, exam thresholds and preferences." />

      <Card>
        <CardHeader title="Profile" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-canvas p-4">
            <Avatar name={teacher?.name ?? "Teacher"} color={teacher?.avatarColor ?? "#2563EB"} size={52} />
            <div>
              <p className="text-sm font-semibold text-ink">{teacher?.name ?? "—"}</p>
              <p className="text-xs text-muted">{teacher?.title ?? "Class Teacher"}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input defaultValue={teacher?.name ?? ""} disabled />
            </Field>
            <Field label="Username">
              <Input defaultValue={teacher?.username ?? ""} disabled />
            </Field>
          </div>
          <p className="text-[12px] text-muted">Profile changes must be made by the administrator in Supabase.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Performance thresholds" subtitle="Used to classify topics as strong / average / weak" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Strong topic (≥ %)" hint="accuracy">
            <Input type="number" defaultValue={75} leftIcon={<GaugeCircle className="size-4" />} />
          </Field>
          <Field label="Weak topic (< %)" hint="accuracy">
            <Input type="number" defaultValue={50} leftIcon={<GaugeCircle className="size-4" />} />
          </Field>
          <Field label="Session auto-logout">
            <Select defaultValue="30">
              <option value="15">After 15 minutes</option>
              <option value="30">After 30 minutes</option>
              <option value="60">After 60 minutes</option>
            </Select>
          </Field>
          <Field label="Default mock duration">
            <Input type="number" defaultValue={120} leftIcon={<Timer className="size-4" />} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Notifications" />
        <CardBody className="divide-y divide-line">
          <Toggle label="Weak-student alerts" description="Notify me when a student's accuracy drops below the weak threshold." defaultOn />
          <Toggle label="Test completion summary" description="Email a summary when a mock test window closes." defaultOn />
          <Toggle label="Weekly class digest" description="A weekly overview of class performance." />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="School" />
        <CardBody>
          <div className="flex items-start gap-3 rounded-xl bg-canvas p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <School className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Z.P.P. School, Kasare</p>
              <p className="text-[13px] text-muted">Tal. Sangamner, Dist. Ahilyanagar, Maharashtra</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => toast({ type: "success", title: "Settings saved", message: "Your preferences have been updated." })}
          leftIcon={<Save className="size-4" />}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
