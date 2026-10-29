import { Award, CalendarDays, GraduationCap, Hash, Info, Lock, School, ShieldCheck, User } from "lucide-react";
import { Avatar, Badge, Card, CardBody, CardHeader, Field, Input } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";

export default function Profile() {
  const { user } = useAuth();
  const s = user as Student | null;

  if (!s) return null;

  const rows = [
    { icon: User, label: "Full Name", value: s.name },
    { icon: Hash, label: "Roll Number", value: s.rollNo || "Not assigned" },
    { icon: GraduationCap, label: "Enrolled Class", value: s.className || "Class 4" },
    { icon: User, label: "Portal Username", value: `@${s.username}` },
    { icon: School, label: "Program Track", value: "Jawahar Navodaya Selection (Class 4)" },
    { icon: CalendarDays, label: "Account Created", value: s.joinedAt ? formatDate(s.joinedAt) : "Active Account" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Student Profile"
        description="Your school enrollment record and examination credentials."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Student Identity Card */}
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardBody className="flex flex-col items-center py-8 px-6 text-center">
            <div className="relative">
              <Avatar name={s.name} color={s.avatarColor} size={84} />
              <span className="absolute bottom-0 right-0 size-5 rounded-full border-2 border-white bg-emerald-500 shadow-xs" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink">{s.name}</h2>
            <p className="text-xs text-muted font-medium">@{s.username}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge tone={s.status === "active" ? "success" : "danger"} dot>
                {s.status === "active" ? "Active Enrolment" : "Inactive"}
              </Badge>
              <Badge tone="brand">Class 4</Badge>
            </div>

            <div className="mt-6 w-full rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 p-4 border border-brand-100 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                <Award className="size-4 text-brand-600" /> Navodaya Scholar Candidate
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-700">
                Registered under the JNVST Digital Practice Initiative. Maintain regular daily practice to improve your test scores.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Detailed Info Card */}
        <Card className="lg:col-span-2 rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader title="Student Details & Credentials" subtitle="Managed by your school administrator" />
          <CardBody className="divide-y divide-line p-6">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3.5 py-3.5 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <r.icon className="size-4" />
                </span>
                <span className="text-xs font-medium text-muted">{r.label}</span>
                <span className="ml-auto text-sm font-semibold text-ink tabular">{r.value}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Security & Password Card */}
      <Card className="rounded-2xl border border-line bg-white shadow-xs">
        <CardHeader
          title="Account Security & Passwords"
          subtitle="Student credentials are centrally managed by your class teacher"
        />
        <CardBody className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-xs">
                <Lock className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Account Password</p>
                <p className="text-xs text-muted">•••••••••••• (Encrypted on school server)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="size-4" /> Verified School Account
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50/70 p-4 text-xs text-brand-800 border border-brand-100">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <p className="leading-relaxed">
              If you ever forget your password or need your login details updated, please ask your class teacher. Teachers can securely reset student passwords directly from their management dashboard.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
