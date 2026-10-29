import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Bookmark, Check, Flag, Loader2, PanelRightClose } from "lucide-react";
import { Badge, Button, Card, CardBody, useToast } from "@/ui";
import { QuestionPalette, PaletteLegend, type QState } from "@/components/QuestionPalette";
import { TimerBadge } from "@/components/TimerBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useCountdown } from "@/lib/hooks";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

type DBQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  marks: number;
  image_url: string | null;
  explanation: string | null;
};

type DBTest = {
  id: string;
  title: string;
  pattern: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  status: string;
};

export default function LiveExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<DBTest | null>(null);
  const [paper, setPaper] = useState<DBQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const saveQueueRef = useRef<Set<number>>(new Set());
  const savingRef = useRef(false);

  // Load test + questions + create/resume attempt
  useEffect(() => {
    if (!id || !user?.id) return;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // Fetch test
      const { data: testData, error: testErr } = await sb
        .from("mock_tests")
        .select("*")
        .eq("id", id)
        .single();

      if (testErr || !testData) { setNotFound(true); setLoading(false); return; }
      setTest(testData as DBTest);

      // Fetch questions for this test via mock_test_questions join
      const { data: mqData } = await sb
        .from("mock_test_questions")
        .select("question_id, order_index, questions(*)")
        .eq("mock_test_id", id)
        .order("order_index");

      const questions: DBQuestion[] = (mqData ?? []).map(
        (row: { questions: DBQuestion }) => row.questions
      ).filter(Boolean);
      setPaper(questions);

      // Check for existing attempt
      const { data: existingAttempt } = await sb
        .from("exam_attempts")
        .select("id, status")
        .eq("student_id", user.id)
        .eq("mock_test_id", id)
        .maybeSingle();

      if (existingAttempt) {
        if (existingAttempt.status === "submitted") {
          navigate(`/student/result/${id}`, { replace: true });
          return;
        }
        setAttemptId(existingAttempt.id);

        // Load saved answers
        const { data: savedAnswers } = await sb
          .from("exam_answers")
          .select("question_id, selected_option, is_marked_for_review")
          .eq("attempt_id", existingAttempt.id);

        const aMap: Record<number, "A" | "B" | "C" | "D"> = {};
        const markedSet = new Set<number>();
        for (const a of savedAnswers ?? []) {
          const qIdx = questions.findIndex((q) => q.id === a.question_id);
          if (qIdx >= 0) {
            if (a.selected_option) aMap[qIdx] = a.selected_option;
            if (a.is_marked_for_review) markedSet.add(qIdx);
          }
        }
        setAnswers(aMap);
        setMarked(markedSet);
      } else {
        // Create new attempt
        const { data: newAttempt, error: aErr } = await sb
          .from("exam_attempts")
          .insert({ student_id: user.id, mock_test_id: id, status: "in_progress" })
          .select("id")
          .single();

        if (aErr || !newAttempt) {
          toast({ type: "error", title: "Cannot start test", message: aErr?.message ?? "Try again." });
          navigate("/student/mock-tests");
          return;
        }
        setAttemptId(newAttempt.id);
      }

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  // Save a single answer to Supabase (debounced via queue)
  const flushSaveQueue = useCallback(async () => {
    if (savingRef.current || saveQueueRef.current.size === 0 || !attemptId) return;
    savingRef.current = true;
    const toSave = [...saveQueueRef.current];
    saveQueueRef.current.clear();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    for (const qIdx of toSave) {
      const q = paper[qIdx];
      if (!q) continue;
      await sb.from("exam_answers").upsert({
        attempt_id: attemptId,
        question_id: q.id,
        selected_option: answers[qIdx] ?? null,
        is_marked_for_review: marked.has(qIdx),
      }, { onConflict: "attempt_id,question_id" });
    }
    savingRef.current = false;
  }, [attemptId, answers, marked, paper]);

  // Queue a save whenever answers change
  const queueSave = useCallback((qIdx: number) => {
    saveQueueRef.current.add(qIdx);
    setTimeout(flushSaveQueue, 800);
  }, [flushSaveQueue]);

  const handleAnswer = (i: number, option: "A" | "B" | "C" | "D") => {
    setAnswers((a) => ({ ...a, [i]: option }));
    queueSave(i);
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
    queueSave(idx);
  };

  const durationSec = (test?.duration_minutes ?? 120) * 60;

  const submit = useCallback(async () => {
    if (!attemptId || !test || !user?.id) return;
    setSubmitting(true);

    // Flush any pending saves
    await flushSaveQueue();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Calculate score and mark correct/wrong
    let score = 0;
    let correct = 0;
    for (let i = 0; i < paper.length; i++) {
      const q = paper[i];
      const sel = answers[i] ?? null;
      const isCorrect = sel !== null && sel === q.correct_option;
      if (isCorrect) { score += q.marks; correct++; }

      if (sel) {
        await sb.from("exam_answers").upsert({
          attempt_id: attemptId,
          question_id: q.id,
          selected_option: sel,
          is_marked_for_review: marked.has(i),
          is_correct: isCorrect,
        }, { onConflict: "attempt_id,question_id" });
      }
    }

    // Update attempt to submitted
    await sb.from("exam_attempts").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score: Math.round(score * 100) / 100,
      total_attempted: Object.keys(answers).length,
      total_correct: correct,
    }).eq("id", attemptId);

    setSubmitting(false);
    navigate(`/student/result/${test.id}`, {
      state: {
        score: Math.round(score),
        total: test.total_marks,
        correct,
        totalQ: paper.length,
        title: test.title,
        attemptId,
      },
    });
  }, [attemptId, test, user?.id, paper, answers, marked, flushSaveQueue, navigate]);

  // Auto-submit when timer hits zero
  const remaining = useCountdown(durationSec, !loading, () => submit());

  const opts = ["A", "B", "C", "D"] as const;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-400" />
      </div>
    );
  }
  if (notFound || !test || paper.length === 0) return <Navigate to="/student/mock-tests" replace />;

  const q = paper[idx];
  const options = [q.option_a, q.option_b, q.option_c, q.option_d];
  const answeredCount = Object.keys(answers).length;
  const markedCount = marked.size;

  const states: Exclude<QState, "current">[] = paper.map((_, i) =>
    marked.has(i) ? "review" : answers[i] !== undefined ? "answered" : "unanswered",
  );

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Exam header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
            <Flag className="size-5" />
          </span>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-ink truncate">{test.title}</p>
            <p className="text-xs text-muted truncate">
              {test.pattern} Pattern · {test.total_marks} Marks · {paper.length} Questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
            <Check className="size-3.5 stroke-[2.5]" /> Auto-saving answers
          </div>
          <TimerBadge remaining={remaining} total={durationSec} />
          <Button
            onClick={() => setConfirmOpen(true)}
            size="md"
            className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs"
          >
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Question area */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-50 text-brand-700 px-2.5 py-1 text-xs font-bold tabular">
                  Question {idx + 1} of {paper.length}
                </span>
                <span className="text-xs text-muted">+{q.marks} marks</span>
              </div>
              <button
                onClick={() => setPaletteOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 lg:hidden"
              >
                <PanelRightClose className="size-4 text-brand-600" /> Question Palette
              </button>
            </div>

            <Card className="rounded-2xl border border-line bg-white shadow-xs">
              <CardBody className="p-6 space-y-6">
                {/* Question text */}
                <p className="text-[16px] font-semibold leading-relaxed text-ink">{q.question_text}</p>
                {q.image_url && (
                  <div className="overflow-hidden rounded-2xl border border-line bg-slate-50 p-2">
                    <img
                      src={q.image_url}
                      alt="Question figure"
                      className="w-full max-h-56 rounded-xl border border-line object-contain bg-white"
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {options.map((opt, i) => {
                    const letter = opts[i];
                    const selected = answers[idx] === letter;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAnswer(idx, letter)}
                        className={cn(
                          "flex min-h-[52px] w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left text-sm transition-all select-none cursor-pointer",
                          selected
                            ? "border-brand-500 bg-brand-50/70 font-semibold text-brand-900 ring-2 ring-brand-500/20 shadow-xs"
                            : "border-line bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50/30 hover:shadow-xs",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors",
                            selected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {selected ? <Check className="size-4 stroke-[3]" /> : letter}
                        </span>
                        <span className="text-[15px] leading-snug flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant={marked.has(idx) ? "primary" : "secondary"}
                onClick={toggleMark}
                className={marked.has(idx) ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : ""}
                leftIcon={<Bookmark className={cn("size-4", marked.has(idx) && "fill-current")} />}
              >
                {marked.has(idx) ? "Marked for Review" : "Mark for Review"}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={idx === 0}
                  onClick={() => setIdx(idx - 1)}
                  leftIcon={<ArrowLeft className="size-4" />}
                >
                  Previous
                </Button>
                <Button
                  disabled={idx === paper.length - 1}
                  onClick={() => setIdx(idx + 1)}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Save & Next
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Desktop palette sidebar */}
        <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-line bg-white p-5 lg:block">
          <PaletteBody
            states={states}
            idx={idx}
            setIdx={setIdx}
            answeredCount={answeredCount}
            markedCount={markedCount}
            total={paper.length}
          />
        </aside>
      </div>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setPaletteOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[280px] overflow-y-auto bg-white p-5 shadow-[var(--shadow-lg)]">
            <PaletteBody
              states={states}
              idx={idx}
              setIdx={(n) => { setIdx(n); setPaletteOpen(false); }}
              answeredCount={answeredCount}
              markedCount={markedCount}
              total={paper.length}
            />
          </div>
        </div>
      )}

      {/* Sticky mobile submit */}
      <div className="border-t border-line bg-white p-3 sm:hidden">
        <Button block onClick={() => setConfirmOpen(true)}>
          Submit test
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        loading={submitting}
        title="Submit your test?"
        confirmLabel="Yes, submit"
        description={
          <span>
            You've answered <strong className="text-ink">{answeredCount}</strong> of {paper.length} questions
            {markedCount > 0 && (
              <> and marked <strong className="text-ink">{markedCount}</strong> for review</>
            )}
            . Once submitted, you can't change your answers.
          </span>
        }
      />
    </div>
  );
}

function PaletteBody({
  states, idx, setIdx, answeredCount, markedCount, total,
}: {
  states: Exclude<QState, "current">[];
  idx: number;
  setIdx: (n: number) => void;
  answeredCount: number;
  markedCount: number;
  total: number;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink">Question palette</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Answered" value={answeredCount} tone="text-success" />
          <MiniStat label="Left" value={total - answeredCount} tone="text-muted" />
          <MiniStat label="Review" value={markedCount} tone="text-warning" />
        </div>
      </div>
      <QuestionPalette states={states} current={idx} onJump={setIdx} />
      <div className="border-t border-line pt-4">
        <PaletteLegend />
      </div>
      <div className="rounded-xl bg-brand-50/60 p-3 text-[13px] text-brand-700 flex items-start gap-2">
        <Check className="mt-0.5 size-4 shrink-0" />
        No negative marking — attempt every question.
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <p className={cn("text-lg font-semibold tabular", tone)}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
