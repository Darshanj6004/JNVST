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
          ["Questions", test.total_questions],
          ["Total marks", test.total_marks],
          ["Duration", `${test.duration_minutes}m`],
        ].map(([l, v]) => (
          <Card key={l as string}>
            <CardBody className="text-center">
              <p className="text-2xl font-semibold text-ink tabular">{v}</p>
              <p className="mt-0.5 text-[13px] text-muted">{l}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <AlertTriangle className="size-4 text-warning" /> Instructions
          </h3>
          <ul className="space-y-3">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <r.icon className="size-4" />
                </span>
                {r.text}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-line bg-canvas p-4">
            <Checkbox
              label="I have read and understood the instructions above."
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Link to="/student/mock-tests">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button disabled={!agreed} onClick={() => navigate(`/student/exam/${test.id}`)}>
              Start test now
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
