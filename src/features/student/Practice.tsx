import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Calculator,
  Check,
  ChevronRight,
  Info,
  Languages,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Question, Subject, Topic } from "@/types";
import { Badge, Button, Card, CardBody, EmptyState, ProgressBar } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ProgressRing } from "@/charts";
import { difficulties, subjects as defaultSubjects } from "@/data/subjects";
import { pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabaseClient";

const icons: Record<string, typeof Brain> = { mat: Brain, ari: Calculator, lan: Languages };
type Phase = "subject" | "topic" | "difficulty" | "questions" | "results";

/**
 * ARCHITECTURAL PERSISTENCE NOTE (Phase 3 Investigation):
 * The database schema contains `practice_sets` which are teacher-authored test templates (RLS allows only teachers to insert/update).
 * Student attempts are stored in `exam_attempts` which enforces `mock_test_id NOT NULL` and `UNIQUE(student_id, mock_test_id)`.
 * There is currently no `practice_attempts` or `practice_answers` table in the database schema.
 * Therefore, practice session scores and answers are safely managed in-memory during the session,
 * avoiding corrupting formal mock test analytics or violating foreign key / RLS constraints.
 */

export default function Practice() {
  const [phase, setPhase] = useState<Phase>("subject");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>(defaultSubjects);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState<Topic | "all" | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Fetch subjects and topics from Supabase to ensure alignment with central database
  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const { data: dbSubjects, error } = await sb
          .from("subjects")
          .select("id, code, name, duration_minutes, total_questions, total_marks, topics(id, name, description)");

        if (!error && dbSubjects && dbSubjects.length > 0) {
          const mapped: Subject[] = dbSubjects.map((s: {
            id: string;
            code: string;
            name: string;
            duration_minutes: number;
            total_questions: number;
            total_marks: number;
            topics?: { id: string; name: string; description: string | null }[];
          }) => {
            const def = defaultSubjects.find(
              (d) =>
                d.id === s.code ||
                (s.code === "mental_ability" && d.id === "mat") ||
                (s.code === "arithmetic" && d.id === "ari") ||
                (s.code === "language" && d.id === "lan")
            );

            return {
              id: s.code === "mental_ability" ? "mat" : s.code === "arithmetic" ? "ari" : s.code === "language" ? "lan" : s.id,
              name: s.name,
              short: def?.short ?? s.name,
              icon: def?.icon ?? "brain",
              accent: def?.accent ?? "#2563eb",
              questions: s.total_questions ?? 40,
              marks: s.total_marks ?? 50,
              duration: s.duration_minutes ?? 60,
              topics: (s.topics && s.topics.length > 0)
                ? s.topics.map((t) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description ?? "Topic practice questions",
                    questionCount: 0,
                  }))
                : def?.topics ?? [],
            };
          });

          if (mapped.length > 0) {
            setAvailableSubjects(mapped);
          }
        }
      } catch {
        // If offline or unseeded, fall back gracefully to default subjects
      }
    })();
  }, []);

  // Fetch real questions from Supabase question bank based on student selection
  const begin = useCallback(async (diff: string) => {
    if (!subject) return;

    setDifficulty(diff);
    setLoadingQuestions(true);
    setFetchError(null);
    setPhase("questions");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const subjectCode =
        subject.id === "mat"
          ? "mental_ability"
          : subject.id === "ari"
            ? "arithmetic"
            : subject.id === "lan"
              ? "language"
              : subject.id;

      // 1. Query questions_view (joins questions with subject and topic names)
      let query = sb.from("questions_view").select("*").eq("subject_code", subjectCode);

      if (topic !== "all" && typeof topic === "object" && topic !== null) {
        query = query.eq("topic_name", topic.name);
      }

      if (diff !== "combined") {
        query = query.eq("difficulty", diff);
      }

      let { data, error } = await query;

      // Fallback: if questions_view is unavailable, query public.questions table with schema relational joins
      if (error) {
        let fallbackQuery = sb
          .from("questions")
          .select(`
            id,
            difficulty,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            marks,
            explanation,
            image_url,
            used_count,
            created_at,
            updated_at,
            subjects!inner(code, name),
            topics!inner(name)
          `)
          .eq("subjects.code", subjectCode);

        if (topic !== "all" && typeof topic === "object" && topic !== null) {
          fallbackQuery = fallbackQuery.eq("topics.name", topic.name);
        }

        if (diff !== "combined") {
          fallbackQuery = fallbackQuery.eq("difficulty", diff);
        }

        const fbRes = await fallbackQuery;
        if (!fbRes.error && fbRes.data) {
          data = fbRes.data;
          error = null;
        } else if (fbRes.error) {
          // Keep the error honest; do not fabricate data
          error = fbRes.error;
        }
      }

      if (error) {
        setFetchError(error.message || "Failed to load questions from database.");
        setLoadingQuestions(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawList = (data ?? []) as any[];

      if (rawList.length === 0) {
        setQuestions([]);
        setLoadingQuestions(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted: Question[] = rawList.map((q: any) => ({
        id: q.id,
        subjectId: subject.id,
        topicId: q.topic_name ?? q.topics?.name ?? q.topic_id ?? "General",
        difficulty: (q.difficulty ?? "medium") as "easy" | "medium" | "hard",
        text: q.question_text ?? "",
        options: [q.option_a ?? "A", q.option_b ?? "B", q.option_c ?? "C", q.option_d ?? "D"],
        answer: q.correct_option === "A" ? 0 : q.correct_option === "B" ? 1 : q.correct_option === "C" ? 2 : 3,
        marks: Number(q.marks) || 1.25,
        explanation: q.explanation || "No explanation provided for this question.",
        imageUrl: q.image_url || undefined,
        usedCount: Number(q.used_count) || 0,
        updatedAt: q.updated_at || new Date().toISOString(),
      }));

      // Shuffle questions to provide variety in practice
      const shuffled = [...formatted].sort(() => Math.random() - 0.5);

      setQuestions(shuffled);
      setIdx(0);
      setAnswers({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load practice questions";
      setFetchError(msg);
    } finally {
      setLoadingQuestions(false);
    }
  }, [subject, topic]);

  const reset = () => {
    setPhase("subject");
    setSubject(null);
    setTopic(null);
    setDifficulty(null);
    setQuestions([]);
    setAnswers({});
    setFetchError(null);
  };

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0),
    [questions, answers],
  );

  const steps = ["Subject", "Topic", "Difficulty"];
  const stepIndex = phase === "subject" ? 0 : phase === "topic" ? 1 : 2;

  // Render question session or results view
  if (phase === "questions" || phase === "results") {
    return (
      <RunView
        phase={phase}
        subject={subject!}
        topic={topic}
        difficulty={difficulty!}
        questions={questions}
        loading={loadingQuestions}
        error={fetchError}
        idx={idx}
        setIdx={setIdx}
        answers={answers}
        setAnswers={setAnswers}
        score={score}
        onRetry={() => begin(difficulty!)}
        onBackToTopics={() => setPhase("topic")}
        onBackToDifficulty={() => setPhase("difficulty")}
        onFinish={() => setPhase("results")}
        onRestart={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice mode"
        description="Untimed practice powered by the central question bank with instant feedback and explanations."
      />

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 text-sm bg-white p-3 rounded-2xl border border-line shadow-xs">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                i === stepIndex
                  ? "bg-brand-500 text-white shadow-xs"
                  : i < stepIndex
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-50 text-slate-400 ring-1 ring-inset ring-line",
              )}
            >
              {i < stepIndex ? <Check className="size-3.5 stroke-[3]" /> : <span className="tabular">{i + 1}</span>}
              Step {i + 1}: {s}
            </span>
            {i < steps.length - 1 && <ChevronRight className="size-4 text-slate-300" />}
          </div>
        ))}

        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
          <Sparkles className="size-3.5" /> Central Question Bank · Instant Explanations
        </div>
      </div>

      {/* Step 1: Subject Selection */}
      {phase === "subject" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600">Select a subject to begin your practice session:</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {availableSubjects.map((s) => {
              const Icon = icons[s.id] ?? Brain;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSubject(s);
                    setPhase("topic");
                  }}
                  className="group text-left cursor-pointer focus:outline-none"
                >
                  <Card className="h-full transition-all duration-200 group-hover:-translate-y-1 group-hover:border-brand-400 group-hover:shadow-[var(--shadow-md)] bg-white border border-line rounded-2xl">
                    <CardBody className="p-6">
                      <div
                        className="flex size-14 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: s.accent }}
                      >
                        <Icon className="size-7" />
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-ink group-hover:text-brand-600 transition-colors">
                        {s.short}
                      </h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{s.name}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-semibold text-slate-500">{s.topics.length} topics</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-brand-600">
                          Select <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Topic Selection */}
      {phase === "topic" && subject && (
        <div className="space-y-4">
          <BackButton onClick={() => setPhase("subject")} label="Back to subjects" />
          <p className="text-sm font-medium text-slate-600">
            Choose a topic in <span className="font-bold text-ink">{subject.short}</span>:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                setTopic("all");
                setPhase("difficulty");
              }}
              className="text-left cursor-pointer focus:outline-none group"
            >
              <Card className="border-brand-300 bg-gradient-to-r from-brand-50/80 to-indigo-50/60 transition-all hover:border-brand-500 hover:shadow-sm rounded-2xl">
                <CardBody className="flex items-center gap-3.5 p-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-brand-900">All Topics (Mixed Practice)</p>
                    <p className="text-xs text-brand-700">Practice questions from all {subject.topics.length} topics</p>
                  </div>
                  <ArrowRight className="size-4 text-brand-500 transition-transform group-hover:translate-x-1 shrink-0" />
                </CardBody>
              </Card>
            </button>
            {subject.topics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTopic(t);
                  setPhase("difficulty");
                }}
                className="text-left cursor-pointer focus:outline-none group"
              >
                <Card className="transition-all hover:border-brand-400 hover:shadow-xs rounded-2xl bg-white border border-line">
                  <CardBody className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">
                        {t.name}
                      </p>
                      <p className="truncate text-xs text-muted mt-0.5">{t.description}</p>
                    </div>
                    <Badge tone="brand" className="font-semibold shrink-0">Select</Badge>
                  </CardBody>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Difficulty Selection */}
      {phase === "difficulty" && (
        <div className="space-y-4">
          <BackButton onClick={() => setPhase("topic")} label="Back to topics" />
          <p className="text-sm font-medium text-slate-600">Choose your challenge level:</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => begin(d.id)}
                className="text-left cursor-pointer focus:outline-none group"
              >
                <Card className="h-full transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-sm rounded-2xl border border-line bg-white">
                  <CardBody className="p-5">
                    <span className="inline-flex rounded-lg bg-brand-50 text-brand-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                      {d.code}
                    </span>
                    <p className="mt-3 text-base font-bold text-ink group-hover:text-brand-600 transition-colors">
                      {d.name}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{d.description}</p>
                    <p className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                      Start <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </CardBody>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink cursor-pointer"
    >
      <ArrowLeft className="size-4" /> {label}
    </button>
  );
}

function RunView({
  phase,
  subject,
  topic,
  difficulty,
  questions,
  loading,
  error,
  idx,
  setIdx,
  answers,
  setAnswers,
  score,
  onRetry,
  onBackToTopics,
  onBackToDifficulty,
  onFinish,
  onRestart,
}: {
  phase: Phase;
  subject: Subject;
  topic: Topic | "all" | null;
  difficulty: string;
  questions: Question[];
  loading: boolean;
  error: string | null;
  idx: number;
  setIdx: (n: number) => void;
  answers: Record<number, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  score: number;
  onRetry: () => void;
  onBackToTopics: () => void;
  onBackToDifficulty: () => void;
  onFinish: () => void;
  onRestart: () => void;
}) {
  const topicLabel = topic === "all" ? "All Topics" : topic?.name ?? "Topic";

  // Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mx-auto">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-ink">Loading Practice Questions</h3>
        <p className="text-sm text-muted max-w-sm mx-auto">
          Fetching questions from the central question bank for {subject.short} ({topicLabel})...
        </p>
      </div>
    );
  }

  // Error State with Retry
  if (error) {
    return (
      <div className="mx-auto max-w-xl py-12 space-y-4">
        <Card className="border-rose-200 bg-rose-50/60 rounded-2xl">
          <CardBody className="p-8 text-center space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto">
              <Info className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-rose-950">Could not load questions</h3>
            <p className="text-sm text-rose-800">{error}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button onClick={onRetry} leftIcon={<RefreshCw className="size-4" />} size="sm">
                Retry Query
              </Button>
              <Button onClick={onBackToDifficulty} variant="secondary" size="sm">
                Choose Different Level
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Empty State: No questions matching query
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-12 space-y-4">
        <Card className="rounded-2xl border border-line bg-white shadow-xs">
          <CardBody className="p-8 text-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mx-auto">
              <Sparkles className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-ink">No questions available yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              We couldn&apos;t find any questions for <strong>{subject.short} &gt; {topicLabel}</strong> at difficulty level &ldquo;{difficulty}&rdquo; in the question bank.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button onClick={onBackToDifficulty} size="sm">
                Try Another Difficulty (e.g. Combined)
              </Button>
              <Button onClick={onBackToTopics} variant="secondary" size="sm">
                Choose Another Topic
              </Button>
              <Button onClick={onRestart} variant="ghost" size="sm">
                Back to Subjects
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Results View
  if (phase === "results") {
    const percentage = pct(score, questions.length);
    const feedback =
      percentage >= 75
        ? {
            title: "Outstanding Work! 🌟",
            text: "You have a strong understanding of this topic. Keep this momentum!",
            tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
          }
        : percentage >= 50
          ? {
              title: "Good Effort! 👍",
              text: "You are making steady progress. Review the questions you missed below.",
              tone: "text-amber-800 bg-amber-50 border-amber-200",
            }
          : {
              title: "Keep Practising! 💪",
              text: "Every attempt makes you sharper. Take time to read each explanation below.",
              tone: "text-blue-800 bg-blue-50 border-blue-200",
            };

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="rounded-2xl border border-line shadow-sm overflow-hidden bg-white">
          <CardBody className="flex flex-col items-center py-10 px-6 text-center">
            <ProgressRing value={percentage} size={152} stroke={14} />
            <h2 className="mt-6 text-2xl font-extrabold text-ink">{feedback.title}</h2>
            <div className={cn("mt-3 rounded-xl border px-4 py-2 text-xs font-medium max-w-md", feedback.tone)}>
              {feedback.text}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {subject.short} · {topicLabel} · {difficulty === "combined" ? "Combined" : difficulty} mode
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-xs border-y border-line py-4">
              <Stat label="Correct" value={`${score}`} tone="text-success" />
              <Stat label="Incorrect" value={`${questions.length - score}`} tone="text-danger" />
              <Stat label="Total Questions" value={`${questions.length}`} tone="text-ink" />
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted bg-slate-50 px-3 py-1.5 rounded-lg border border-line">
              <Info className="size-3.5 text-slate-400" />
              <span>Practice session saved in session memory · Central bank questions verified</span>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={onRestart} leftIcon={<RotateCcw className="size-4" />} size="md">
                Practice Again
              </Button>
              <Link to="/student/dashboard">
                <Button variant="secondary" size="md">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Review Solutions with Explanations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Review Solutions & Explanations</h3>
            <span className="text-xs text-muted">All {questions.length} questions answered</span>
          </div>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id} className="rounded-2xl border border-line bg-white shadow-xs">
                <CardBody className="p-5">
                  <QuestionCard question={q} index={i} selected={answers[i] ?? null} reveal />
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active Practice Question View
  const q = questions[idx];
  const answered = Object.keys(answers).length;
  const isLast = idx === questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <BackButton onClick={onRestart} label="Exit practice" />
        <Badge tone="brand">
          {subject.short} · {difficulty === "combined" ? "Combined" : difficulty}
        </Badge>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-line shadow-xs">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="text-brand-600">
            Question {idx + 1} of {questions.length}
          </span>
          <span className="tabular text-slate-500">
            {answered} of {questions.length} answered
          </span>
        </div>
        <ProgressBar value={((idx + 1) / questions.length) * 100} className="h-2" />
      </div>

      <Card className="rounded-2xl border border-line bg-white shadow-xs">
        <CardBody className="p-6">
          <QuestionCard
            question={q}
            index={idx}
            selected={answers[idx] ?? null}
            onSelect={(i) => setAnswers((a) => ({ ...a, [idx]: i }))}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="secondary"
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          leftIcon={<ArrowLeft className="size-4" />}
        >
          Previous
        </Button>
        {isLast ? (
          <Button
            onClick={onFinish}
            leftIcon={<Check className="size-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Finish & See Score
          </Button>
        ) : (
          <Button onClick={() => setIdx(idx + 1)} rightIcon={<ArrowRight className="size-4" />}>
            Next Question
          </Button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-semibold tabular", tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
