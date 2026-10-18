import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { AlertTriangle, ArrowLeft, Ban, Bookmark, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, Checkbox } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { getMockTest } from "@/data/mockTests";

export default function Instructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = id ? getMockTest(id) : undefined;
  const [agreed, setAgreed] = useState(false);

  if (!test) return <Navigate to="/student/mock-tests" replace />;

  const rules = [
    { icon: Clock, text: `The test is timed for ${test.durationMin} minutes and auto-submits when time runs out.` },
    { icon: Ban, text: "There is no negative marking — attempt every question." },
    { icon: Bookmark, text: "You can mark questions for review and revisit them using the question palette." },
    { icon: ShieldCheck, text: "This is a single-attempt test. Your answers are saved as you go." },
    { icon: CheckCircle2, text: "Each question carries 1.25 marks. Choose the single best option." },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/student/mock-tests" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to mock tests
      </Link>

      <PageHeader title={test.title} description={`${test.pattern} pattern · ${test.totalMarks} marks`} />

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Questions", test.totalQuestions],
          ["Total marks", test.totalMarks],
          ["Duration", `${test.durationMin}m`],
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
