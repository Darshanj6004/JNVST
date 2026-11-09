import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Ban, Bookmark, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, Checkbox } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";
import { formatDateTime } from "@/lib/format";
import { finalizeExpiredAttempts } from "@/lib/api";
import { useNum, useT } from "@/lib/lang";

type DBTest = {
  id: string;
  title: string;
  pattern: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: string;
  scheduled_at: string | null;
  ends_at: string | null;
};

export default function Instructions() {
  const t = useT();
  const num = useNum();
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<DBTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Re-check every 15 s so the Start button unlocks at the scheduled time.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 15000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!id) return;
    if (tick > 0) void finalizeExpiredAttempts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("mock_tests")
      .select("id, title, pattern, duration_minutes, total_questions, total_marks, status, scheduled_at, ends_at")
      .eq("id", id)
      .single()
      .then(({ data, error }: { data: DBTest | null; error: unknown }) => {
        if (error || !data) setNotFound(true);
        else setTest(data);
        setLoading(false);
      });
  }, [id, tick]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (notFound || !test) return <Navigate to="/student/mock-tests" replace />;

  const rules = [
    { icon: Clock, text: t(`परीक्षेसाठी ${num(test.duration_minutes)} मिनिटे वेळ आहे. वेळ संपताच परीक्षा आपोआप सबमिट होईल.`, `The test is timed for ${test.duration_minutes} minutes and auto-submits when time runs out.`) },
    { icon: Ban, text: t("चुकीच्या उत्तराला गुण कापले जात नाहीत — म्हणून सर्व प्रश्न सोडवा.", "There is no negative marking — attempt every question.") },
    { icon: Bookmark, text: t("शंका असलेल्या प्रश्नावर खूण करा आणि नंतर प्रश्न क्रमांकावरून पुन्हा पाहा.", "You can mark questions for review and revisit them using the question palette.") },
    { icon: ShieldCheck, text: t("ही परीक्षा एकदाच देता येते. तुमची उत्तरे आपोआप जतन होतात.", "This is a single-attempt test. Your answers are saved as you go.") },
    { icon: CheckCircle2, text: t("प्रत्येक प्रश्नासाठी चार पर्यायांपैकी एकच योग्य उत्तर निवडा.", "Each question carries marks as set by your teacher. Choose the single best option.") },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/student/mock-tests" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> {t("सराव परीक्षांकडे परत", "Back to mock tests")}
      </Link>

      <PageHeader title={test.title} description={t(`${num(test.total_marks)} गुण`, `${test.pattern} pattern · ${test.total_marks} marks`)} />

      <div className="grid grid-cols-3 gap-3">
        {[
          [t("प्रश्न", "Questions"), num(test.total_questions), t("एकूण प्रश्न", "questions in total")],
          [t("एकूण गुण", "Total Marks"), num(test.total_marks), t("प्रत्येक प्रश्नाला गुण", "marks for the test")],
          [t("वेळ", "Exam Time"), t(`${num(test.duration_minutes)} मि.`, `${test.duration_minutes}m`), t("मिनिटे", "minutes")],
        ].map(([l, v, hint]) => (
          <Card key={l as string} className="rounded-2xl border border-line bg-white shadow-xs">
            <CardBody className="p-4 text-center">
              <p className="text-2xl font-bold text-ink tabular">{v}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{l}</p>
              <p className="mt-1 text-[11px] font-medium text-brand-600">{hint}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
        <CardBody className="p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-line">
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-ink">{t("परीक्षेचे महत्त्वाचे नियम", "Important Examination Rules")}</h3>
              <p className="text-xs text-muted">{t("परीक्षा सुरू करण्यापूर्वी नीट वाचा", "Please read carefully before starting the test")}</p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs leading-relaxed text-slate-700">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-xs border border-slate-200">
                  <r.icon className="size-3.5" />
                </span>
                <span className="font-medium">{r.text}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 transition-colors">
            <Checkbox
              label={t("मी सर्व नियम वाचले आहेत आणि परीक्षा देण्यास तयार आहे.", "I understand the examination rules and I am ready to begin my test.")}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link to="/student/mock-tests">
              <Button variant="secondary" size="md" className="w-full sm:w-auto">
                {t("आता नाही, परत जा", "Not Now, Go Back")}
              </Button>
            </Link>
            <Button
              disabled={!agreed || test.status !== "live"}
              size="md"
              onClick={() => navigate(`/student/exam/${test.id}`)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm"
              rightIcon={<ShieldCheck className="size-4" />}
            >
              {test.status === "live"
                ? t("परीक्षा सुरू करा", "Start Examination Now")
                : test.status === "completed"
                  ? t("ही परीक्षा बंद झाली आहे", "This test is closed")
                  : test.scheduled_at
                    ? t(`${formatDateTime(test.scheduled_at)} ला सुरू होईल`, `Opens ${formatDateTime(test.scheduled_at)}`)
                    : t("परीक्षा अजून सुरू झाली नाही", "Test is not open yet")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
