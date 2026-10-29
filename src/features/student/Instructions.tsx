import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Ban, Bookmark, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, Checkbox } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";

type DBTest = {
  id: string;
  title: string;
  pattern: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: string;
};

export default function Instructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<DBTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("mock_tests")
      .select("id, title, pattern, duration_minutes, total_questions, total_marks, status")
      .eq("id", id)
      .single()
      .then(({ data, error }: { data: DBTest | null; error: unknown }) => {
        if (error || !data) setNotFound(true);
        else setTest(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (notFound || !test) return <Navigate to="/student/mock-tests" replace />;

  const rules = [
    { icon: Clock, text: `The test is timed for ${test.duration_minutes} minutes and auto-submits when time runs out.` },
    { icon: Ban, text: "There is no negative marking — attempt every question." },
    { icon: Bookmark, text: "You can mark questions for review and revisit them using the question palette." },
    { icon: ShieldCheck, text: "This is a single-attempt test. Your answers are saved as you go." },
    { icon: CheckCircle2, text: "Each question carries marks as set by your teacher. Choose the single best option." },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/student/mock-tests" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to mock tests
      </Link>

      <PageHeader title={test.title} description={`${test.pattern} pattern · ${test.total_marks} marks`} />

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Questions", test.total_questions, "80 Questions"],
          ["Total Marks", test.total_marks, "1.25 per question"],
          ["Exam Time", `${test.duration_minutes}m`, "2 Hours Full"],
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
              <h3 className="text-base font-bold text-ink">Important Examination Rules</h3>
              <p className="text-xs text-muted">Please read carefully before starting the test</p>
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
              label="I understand the examination rules and I am ready to begin my test."
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link to="/student/mock-tests">
              <Button variant="secondary" size="md" className="w-full sm:w-auto">
                Not Now, Go Back
              </Button>
            </Link>
            <Button
              disabled={!agreed}
              size="md"
              onClick={() => navigate(`/student/exam/${test.id}`)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 font-bold shadow-sm"
              rightIcon={<ShieldCheck className="size-4" />}
            >
              Start Examination Now
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
