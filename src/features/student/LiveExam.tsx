import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Bookmark, Check, Flag, PanelRightClose } from "lucide-react";
import type { Question } from "@/types";
import { Badge, Button, Card, CardBody } from "@/ui";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionPalette, PaletteLegend, type QState } from "@/components/QuestionPalette";
import { TimerBadge } from "@/components/TimerBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useCountdown } from "@/lib/hooks";
import { getMockTest } from "@/data/mockTests";
import { questions as pool } from "@/data/questions";
import { cn } from "@/lib/cn";

/** Build a paper of `count` questions by cycling the authored pool. */
function buildPaper(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    const base = pool[i % pool.length];
    return { ...base, id: `${base.id}-p${i}` };
  });
}

export default function LiveExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = id ? getMockTest(id) : undefined;

  // Keep the demo paper compact but honest to the pattern proportions.
  const total = test ? Math.min(test.totalQuestions, 24) : 24;
  const paper = useMemo(() => buildPaper(total), [total]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);

  const durationSec = (test?.durationMin ?? 120) * 60;
  const remaining = useCountdown(durationSec, true, () => submit());

  if (!test) return <Navigate to="/student/mock-tests" replace />;

  const submit = () => {
    const score = paper.reduce((acc, q, i) => acc + (answers[i] === q.answer ? q.marks : 0), 0);
    navigate(`/student/result/${test.id}`, {
      state: {
        score: Math.round(score),
        total: test.totalMarks,
        correct: paper.filter((q, i) => answers[i] === q.answer).length,
        totalQ: paper.length,
        title: test.title,
      },
    });
  };

  const states: Exclude<QState, "current">[] = paper.map((_, i) =>
    marked.has(i) ? "review" : answers[i] !== undefined ? "answered" : "unanswered",
  );

  const answeredCount = Object.keys(answers).length;
  const markedCount = marked.size;
  const q = paper[idx];

  const toggleMark = () =>
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  return (
    <div className="flex h-full flex-col bg-canvas">
      {/* Exam header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Flag className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{test.title}</p>
            <p className="text-xs text-muted">
              {test.pattern} pattern · {test.totalMarks} marks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TimerBadge remaining={remaining} total={durationSec} />
          <Button onClick={() => setConfirmOpen(true)} className="hidden sm:inline-flex">
            Submit test
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Question area */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">
                Question <span className="text-ink tabular">{idx + 1}</span> of {paper.length}
              </span>
              <button
                onClick={() => setPaletteOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:bg-slate-100 lg:hidden"
              >
                <PanelRightClose className="size-4" /> Palette
              </button>
            </div>

            <Card>
              <CardBody>
                <QuestionCard
                  question={q}
                  index={idx}
                  selected={answers[idx] ?? null}
                  onSelect={(i) => setAnswers((a) => ({ ...a, [idx]: i }))}
                />
              </CardBody>
            </Card>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant={marked.has(idx) ? "primary" : "secondary"}
                onClick={toggleMark}
                leftIcon={<Bookmark className={cn("size-4", marked.has(idx) && "fill-current")} />}
              >
                {marked.has(idx) ? "Marked for review" : "Mark for review"}
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)} leftIcon={<ArrowLeft className="size-4" />}>
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

        {/* Palette */}
        <aside
          className={cn(
            "w-[300px] shrink-0 overflow-y-auto border-l border-line bg-white p-5",
            paletteOpen ? "hidden lg:block" : "hidden",
          )}
        >
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
          <div className="absolute inset-y-0 right-0 w-[300px] overflow-y-auto bg-white p-5 shadow-[var(--shadow-lg)]">
            <PaletteBody
              states={states}
              idx={idx}
              setIdx={(n) => {
                setIdx(n);
                setPaletteOpen(false);
              }}
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
        title="Submit your test?"
        confirmLabel="Yes, submit"
        description={
          <span>
            You've answered <strong className="text-ink">{answeredCount}</strong> of {paper.length} questions
            {markedCount > 0 && (
              <>
                {" "}
                and marked <strong className="text-ink">{markedCount}</strong> for review
              </>
            )}
            . Once submitted, you can't change your answers.
          </span>
        }
      />
    </div>
  );
}

function PaletteBody({
  states,
  idx,
  setIdx,
  answeredCount,
  markedCount,
  total,
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
