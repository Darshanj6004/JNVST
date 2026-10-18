import { CalendarDays, GraduationCap, Hash, Info, ShieldCheck, User } from "lucide-react";
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Field, Input } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";

export default function Profile() {
  const { user } = useAuth();
  const s = user as Student | null;

  if (!s) return null;

  const rows = [
    { icon: User, label: "Full name", value: s.name },
    { icon: Hash, label: "Roll number", value: s.rollNo || "—" },
    { icon: GraduationCap, label: "Class", value: s.className || "—" },
    { icon: User, label: "Username", value: `@${s.username}` },
    { icon: CalendarDays, label: "Joined", value: formatDate(s.joinedAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="Your account details, managed by your teacher." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Avatar name={s.name} color={s.avatarColor} size={80} />
            <h2 className="mt-4 text-lg font-semibold text-ink">{s.name}</h2>
            <p className="text-sm text-muted">@{s.username}</p>
            <Badge tone={s.status === "active" ? "success" : "danger"} dot className="mt-3">
              {s.status === "active" ? "Active" : "Inactive"}
            </Badge>
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-lg font-semibold text-ink tabular">—</p>
                <p className="text-xs text-muted">Tests taken</p>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-lg font-semibold text-ink tabular">—</p>
                <p className="text-xs text-muted">Class rank</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Account details" />
          <CardBody className="divide-y divide-line">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <r.icon className="size-4" />
                </span>
                <span className="text-[13px] text-muted">{r.label}</span>
                <span className="ml-auto text-sm font-medium text-ink">{r.value}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Password" subtitle="Passwords are managed by your teacher" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password">
              <Input type="password" value="••••••••••" disabled />
            </Field>
            <div className="flex items-end">
              <Button variant="secondary" disabled leftIcon={<ShieldCheck className="size-4" />}>
                Change password
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/60 p-3.5 text-[13px] text-brand-700">
            <Info className="mt-0.5 size-4 shrink-0" />
            To reset your password, please contact your class teacher. Students cannot change credentials directly.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
