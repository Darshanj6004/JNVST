import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Bookmark, Check, CloudOff, Flag, Loader2, PanelRightClose } from "lucide-react";
import { Button, Card, CardBody, useToast } from "@/ui";
import { QuestionPalette, PaletteLegend, type QState } from "@/components/QuestionPalette";
import { TimerBadge } from "@/components/TimerBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDeadline } from "@/lib/hooks";
import { db, rpc } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { LangToggle, useNum, useT } from "@/lib/lang";

type Opt = "A" | "B" | "C" | "D";

type PaperQuestion = {
  question_id: string;
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
  marks: number;
  subject_code: string;
  subject_name: string;
};

type StartInfo = {
  attempt_id: string;
  status: string;
  deadline: string;
  server_now: string;
  title: string;
  pattern: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
};

type SubmitResult = {
  score: number;
  total_marks: number;
  total_correct: number;
  total_attempted: number;
  total_questions: number;
  title: string;
};

export default function LiveExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useT();
  const num = useNum();

  const [test, setTest] = useState<StartInfo | null>(null);
  const [paper, setPaper] = useState<PaperQuestion[]>([]);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unsaved, setUnsaved] = useState(0);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Opt>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Refs mirror state so async save/submit never read stale values.
  const answersRef = useRef(answers);
  const markedRef = useRef(marked);
  const paperRef = useRef(paper);
  answersRef.current = answers;
  markedRef.current = marked;
  paperRef.current = paper;

  const pendingRef = useRef<Set<number>>(new Set());
  const flushingRef = useRef<Promise<void> | null>(null);
  const timerRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  // ── Load: start/resume attempt on the server, then fetch the paper ──
  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const info = await rpc<StartInfo>("start_exam", { p_test_id: id });
        if (cancelled) return;
        if (info.status !== "in_progress") {
          navigate(`/student/result/${id}`, { replace: true });
          return;
        }
        // Server clock offset so a wrong device clock can't extend the exam.
        const offset = Date.parse(info.server_now) - Date.now();
        setDeadlineMs(Date.parse(info.deadline) - offset);
        setTest(info);

        const questions = await rpc<PaperQuestion[]>("get_exam_paper", { p_test_id: id });
        if (cancelled) return;
        setPaper(questions ?? []);

        const { data: saved } = await db
          .from("exam_answers")
          .select("question_id, selected_option, is_marked_for_review")
          .eq("attempt_id", info.attempt_id);

        const aMap: Record<number, Opt> = {};
        const mSet = new Set<number>();
        for (const a of (saved ?? []) as { question_id: string; selected_option: Opt | null; is_marked_for_review: boolean }[]) {
          const qi = (questions ?? []).findIndex((q) => q.question_id === a.question_id);
          if (qi < 0) continue;
          if (a.selected_option) aMap[qi] = a.selected_option;
          if (a.is_marked_for_review) mSet.add(qi);
        }
        setAnswers(aMap);
        setMarked(mSet);
      } catch (e) {
        if (cancelled) return;
        toast({ type: "error", title: t("परीक्षा उघडता आली नाही", "Cannot open test"), message: (e as Error).message });
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  // ── Autosave: batch pending question indexes into one upsert ──
  const flush = useCallback(async (): Promise<void> => {
    if (flushingRef.current) {
      await flushingRef.current;
    }
    if (!test || pendingRef.current.size === 0) return;

    const idxs = [...pendingRef.current];
    pendingRef.current.clear();
    const rows = idxs
      .map((i) => {
        const q = paperRef.current[i];
        if (!q) return null;
        return {
          attempt_id: test.attempt_id,
          question_id: q.question_id,
          selected_option: answersRef.current[i] ?? null,
          is_marked_for_review: markedRef.current.has(i),
        };
      })
      .filter(Boolean);

    const run = (async () => {
      const { error } = await db.from("exam_answers").upsert(rows, { onConflict: "attempt_id,question_id" });
      if (error) {
        // Put them back so the next flush retries.
        idxs.forEach((i) => pendingRef.current.add(i));
      }
      setUnsaved(pendingRef.current.size);
    })();
    flushingRef.current = run;
    await run;
    flushingRef.current = null;
  }, [test]);

  const queueSave = useCallback(
    (i: number) => {
      pendingRef.current.add(i);
      setUnsaved(pendingRef.current.size);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => void flush(), 600);
    },
    [flush],
  );

  // Retry unsaved answers every 10 s (e.g. after Wi-Fi drops).
  useEffect(() => {
    const t = window.setInterval(() => {
      if (pendingRef.current.size > 0) void flush();
    }, 10000);
    return () => window.clearInterval(t);
  }, [flush]);

  // Warn before closing the tab mid-exam.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleAnswer = (i: number, option: Opt) => {
    setAnswers((a) => {
      const next = { ...a, [i]: option };
      answersRef.current = next;
      return next;
    });
    queueSave(i);
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      markedRef.current = next;
      return next;
    });
    queueSave(idx);
  };

  const submit = useCallback(
    async (auto = false) => {
      if (!test || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        await flush();
        if (pendingRef.current.size > 0) await flush(); // one retry
        const res = await rpc<SubmitResult>("submit_exam", { p_attempt_id: test.attempt_id });
        if (auto) toast({ type: "info", title: t("वेळ संपली", "Time is up"), message: t("तुमची परीक्षा आपोआप सबमिट झाली.", "Your test was submitted automatically.") });
        navigate(`/student/result/${id}`, { replace: true, state: res });
      } catch (e) {
        submittedRef.current = false;
        setSubmitting(false);
        toast({
          type: "error",
          title: t("सबमिट झाले नाही", "Submit failed"),
          message: `${(e as Error).message} ${t("तुमची उत्तरे जतन आहेत — पुन्हा प्रयत्न करा.", "Your answers are saved — try again.")}`,
        });
      }
    },
    [test, flush, navigate, id, toast],
  );

  const remaining = useDeadline(deadlineMs, () => void submit(true));
  const durationSec = (test?.duration_minutes ?? 120) * 60;

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
              {t(`${num(paper.length)} प्रश्न · ${num(test.total_marks)} गुण`, `${test.pattern} Pattern · ${test.total_marks} Marks · ${paper.length} Questions`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {unsaved > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">
              <CloudOff className="size-3.5" /> <span className="hidden md:inline">{t("जतन होत आहे…", "Saving…")}</span> {num(unsaved)}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
              <Check className="size-3.5 stroke-[2.5]" /> {t("सर्व उत्तरे जतन झाली", "All answers saved")}
            </div>
          )}
          <LangToggle className="hidden sm:inline-flex" />
          <TimerBadge remaining={remaining} total={durationSec} />
          {/* Phones use the sticky submit bar at the bottom instead */}
          <span className="hidden sm:inline-flex">
            <Button
              onClick={() => setConfirmOpen(true)}
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs"
            >
              {t("परीक्षा सबमिट करा", "Submit Test")}
            </Button>
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Question area */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-50 text-brand-700 px-2.5 py-1 text-xs font-bold tabular">
                  {t(`प्रश्न ${num(idx + 1)} / ${num(paper.length)}`, `Question ${idx + 1} of ${paper.length}`)}
                </span>
                <span className="text-xs text-muted">+{num(q.marks)} {t("गुण", "marks")}</span>
              </div>
              <button
                onClick={() => setPaletteOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 lg:hidden"
              >
                <PanelRightClose className="size-4 text-brand-600" /> {t("प्रश्न क्रमांक", "Question Palette")}
              </button>
            </div>

            <Card className="rounded-2xl border border-line bg-white shadow-xs">
              <CardBody className="p-6 space-y-6">
                {/* Question text */}
                <p className="whitespace-pre-line text-[16px] font-semibold leading-relaxed text-ink">{q.question_text}</p>
                {q.image_url && (
                  <div className="overflow-hidden rounded-2xl border border-line bg-slate-50 p-2">
                    <img
                      src={q.image_url}
                      alt={t("प्रश्नाची आकृती", "Question figure")}
                      className="w-full max-h-[26rem] rounded-xl border border-line object-contain bg-white"
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
                {marked.has(idx) ? t("पुन्हा पाहण्यासाठी खूण केली", "Marked for Review") : t("पुन्हा पाहण्यासाठी खूण करा", "Mark for Review")}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={idx === 0}
                  onClick={() => setIdx(idx - 1)}
                  leftIcon={<ArrowLeft className="size-4" />}
                >
                  {t("मागील", "Previous")}
                </Button>
                <Button
                  disabled={idx === paper.length - 1}
                  onClick={() => setIdx(idx + 1)}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  {t("जतन करा व पुढे", "Save & Next")}
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
          {t("परीक्षा सबमिट करा", "Submit test")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void submit()}
        loading={submitting}
        title={t("परीक्षा सबमिट करायची?", "Submit your test?")}
        confirmLabel={t("होय, सबमिट करा", "Yes, submit")}
        description={
          t("mr", "en") === "mr" ? (
            <span>
              तुम्ही {num(paper.length)} पैकी <strong className="text-ink">{num(answeredCount)}</strong> प्रश्न सोडवले आहेत
              {markedCount > 0 && (
                <> आणि <strong className="text-ink">{num(markedCount)}</strong> प्रश्नांवर खूण केली आहे</>
              )}
              . सबमिट केल्यानंतर उत्तरे बदलता येणार नाहीत.
            </span>
          ) : (
            <span>
              You've answered <strong className="text-ink">{answeredCount}</strong> of {paper.length} questions
              {markedCount > 0 && (
                <> and marked <strong className="text-ink">{markedCount}</strong> for review</>
              )}
              . Once submitted, you can't change your answers.
            </span>
          )
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
  const t = useT();
  const num = useNum();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-ink">{t("प्रश्न क्रमांक", "Question palette")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MiniStat label={t("सोडवले", "Answered")} value={num(answeredCount)} tone="text-success" />
          <MiniStat label={t("बाकी", "Left")} value={num(total - answeredCount)} tone="text-muted" />
          <MiniStat label={t("खूण", "Review")} value={num(markedCount)} tone="text-warning" />
        </div>
      </div>
      <QuestionPalette states={states} current={idx} onJump={setIdx} />
      <div className="border-t border-line pt-4">
        <PaletteLegend />
      </div>
      <div className="rounded-xl bg-brand-50/60 p-3 text-[13px] text-brand-700 flex items-start gap-2">
        <Check className="mt-0.5 size-4 shrink-0" />
        {t("चुकीच्या उत्तराला गुण कापले जात नाहीत — सर्व प्रश्न सोडवा.", "No negative marking — attempt every question.")}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <p className={cn("text-lg font-semibold tabular", tone)}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
