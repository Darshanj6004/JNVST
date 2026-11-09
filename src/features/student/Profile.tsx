import { Award, CalendarDays, GraduationCap, Hash, Info, Lock, School, ShieldCheck, User } from "lucide-react";
import { Avatar, Badge, Card, CardBody, CardHeader, Field, Input } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Student } from "@/types";
import { useT } from "@/lib/lang";

export default function Profile() {
  const { user } = useAuth();
  const tr = useT();
  const s = user as Student | null;

  if (!s) return null;

  const rows = [
    { icon: User, label: tr("पूर्ण नाव", "Full Name"), value: s.name },
    { icon: Hash, label: tr("हजेरी क्रमांक", "Roll Number"), value: s.rollNo || tr("दिलेला नाही", "Not assigned") },
    { icon: GraduationCap, label: tr("इयत्ता / तुकडी", "Enrolled Class"), value: s.className || tr("इयत्ता ५", "Class 5") },
    { icon: User, label: tr("वापरकर्ता नाव", "Portal Username"), value: `@${s.username}` },
    { icon: School, label: tr("परीक्षा", "Program Track"), value: tr("जवाहर नवोदय विद्यालय प्रवेश परीक्षा (इयत्ता ६ प्रवेश)", "Jawahar Navodaya Vidyalaya Selection Test (entry to Class 6)") },
    { icon: CalendarDays, label: tr("खाते तयार झाले", "Account Created"), value: s.joinedAt ? formatDate(s.joinedAt) : tr("सक्रिय खाते", "Active Account") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("माझी माहिती", "My Student Profile")}
        description={tr("शाळेतील तुमची नोंद व लॉगिन माहिती.", "Your school enrollment record and examination credentials.")}
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
              <Badge tone="brand">{s.className || tr("इयत्ता ५", "Class 5")}</Badge>
            </div>

            <div className="mt-6 w-full rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 p-4 border border-brand-100 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-900">
                <Award className="size-4 text-brand-600" /> {tr("नवोदय परीक्षार्थी", "Navodaya Scholar Candidate")}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-700">
                {tr("रोज थोडा सराव करा — तुमचे गुण नक्की वाढतील.", "Registered under the JNVST Digital Practice Initiative. Maintain regular daily practice to improve your test scores.")}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Detailed Info Card */}
        <Card className="lg:col-span-2 rounded-2xl border border-line bg-white shadow-xs">
          <CardHeader title={tr("विद्यार्थ्याची माहिती", "Student Details & Credentials")} subtitle={tr("ही माहिती शिक्षक बदलू शकतात", "Managed by your school administrator")} />
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
          title={tr("खात्याची सुरक्षा", "Account Security & Passwords")}
          subtitle={tr("पासवर्ड वर्गशिक्षक सांभाळतात", "Student credentials are centrally managed by your class teacher")}
        />
        <CardBody className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-xs">
                <Lock className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{tr("खात्याचा पासवर्ड", "Account Password")}</p>
                <p className="text-xs text-muted">{tr("•••••••••••• (सुरक्षित ठेवलेला)", "•••••••••••• (Encrypted on school server)")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="size-4" /> {tr("शाळेचे अधिकृत खाते", "Verified School Account")}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50/70 p-4 text-xs text-brand-800 border border-brand-100">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <p className="leading-relaxed">
              {tr("पासवर्ड विसरल्यास किंवा माहिती बदलायची असल्यास तुमच्या वर्गशिक्षकांना सांगा. ते नवीन पासवर्ड देऊ शकतात.", "If you ever forget your password or need your login details updated, please ask your class teacher. Teachers can securely reset student passwords directly from their management dashboard.")}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
