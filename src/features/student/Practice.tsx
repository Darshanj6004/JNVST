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
import { difficulties } from "@/data/subjects";
import { useSubjects } from "@/lib/useSubjects";
import { useAuth } from "@/lib/auth";
import { codeToLocal, db, localToCode, rpc, SUBJECT_LABELS_MR } from "@/lib/api";
import { useNum, useT } from "@/lib/lang";
import { pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const icons: Record<string, typeof Brain> = { mat: Brain, ari: Calculator, lan: Languages };
type Phase = "subject" | "topic" | "difficulty" | "questions" | "results";


type PracticeSet = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  question_ids: string[];
  subjects: { code: string; name: string } | null;
};

type PracticeRow = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  image_url: string | null;
  marks: number;
  difficulty: string;
  subject_code: string;
  topic_name: string;
};

const PRACTICE_SIZE = 20;

// Marathi names for the student portal
const SUBJ_MR: Record<string, string> = { mat: "बुद्धिमत्ता चाचणी", ari: "अंकगणित", lan: "भाषा" };
const LEVEL_MR: Record<string, { name: string; description: string }> = {
  easy: { name: "सोपे", description: "मूलभूत समज तपासणारे सोपे प्रश्न" },
  medium: { name: "मध्यम", description: "थोडा विचार करायला लावणारे प्रश्न" },
  hard: { name: "कठीण", description: "जास्त विचार व तर्क लागणारे प्रश्न" },
  combined: { name: "मिश्र", description: "सोपे, मध्यम व कठीण प्रश्न एकत्र" },
};

function toQuestion(q: PracticeRow): Question {
  return {
    id: q.id,
    subjectId: codeToLocal[q.subject_code] ?? q.subject_code,
    topicId: q.topic_name ?? "General",
    difficulty: (q.difficulty ?? "medium") as "easy" | "medium" | "hard",
    text: q.question_text ?? "",
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
    answer: Math.max(0, ["A", "B", "C", "D"].indexOf(q.correct_option)),
    marks: Number(q.marks) || 1.25,
    explanation: q.explanation || "या प्रश्नासाठी स्पष्टीकरण उपलब्ध नाही.",
    imageUrl: q.image_url || undefined,
    usedCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

export default function Practice() {
  const tr = useT();
  const num = useNum();
  const { user } = useAuth();
  const { subjects: availableSubjects } = useSubjects({ practiceCounts: true });
  const [phase, setPhase] = useState<Phase>("subject");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState<Topic | "all" | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState<PracticeSet | null>(null);
  const [sets, setSets] = useState<PracticeSet[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Teacher-assigned practice sets
  useEffect(() => {
    db.from("practice_sets")
      .select("id, title, description, difficulty, question_ids, subjects(code, name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: PracticeSet[] | null }) => setSets(data ?? []));
  }, []);

  const begin = useCallback(
    async (diff: string) => {
      if (!subject) return;
      setActiveSet(null);
      setDifficulty(diff);
      setLoadingQuestions(true);
      setFetchError(null);
      setPhase("questions");
      try {
        const rows = await rpc<PracticeRow[]>("get_practice_questions", {
          p_subject_code: localToCode[subject.id] ?? subject.id,
          p_topic_name: topic && topic !== "all" ? topic.name : null,
          p_difficulty: diff === "combined" ? null : diff,
          p_limit: PRACTICE_SIZE,
        });
        setQuestions((rows ?? []).map(toQuestion));
        setIdx(0);
        setAnswers({});
      } catch (err) {
        setFetchError((err as Error).message);
      } finally {
        setLoadingQuestions(false);
      }
    },
    [subject, topic],
  );

  const beginSet = useCallback(
    async (set: PracticeSet) => {
      const local = codeToLocal[set.subjects?.code ?? ""] ?? "mat";
      setSubject(availableSubjects.find((s) => s.id === local) ?? availableSubjects[0]);
      setTopic("all");
      setDifficulty(set.difficulty ?? "combined");
      setActiveSet(set);
      setLoadingQuestions(true);
      setFetchError(null);
      setPhase("questions");
      try {
        const rows = await rpc<PracticeRow[]>("get_practice_set_questions", { p_set_id: set.id });
        setQuestions((rows ?? []).map(toQuestion));
        setIdx(0);
        setAnswers({});
      } catch (err) {
        setFetchError((err as Error).message);
      } finally {
        setLoadingQuestions(false);
      }
    },
    [availableSubjects],
  );

  const finish = async () => {
    setPhase("results");
    if (!user?.id || questions.length === 0) return;
    const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
    await db.from("practice_attempts").insert({
      student_id: user.id,
      practice_set_id: activeSet?.id ?? null,
      subject_code: subject ? (localToCode[subject.id] ?? subject.id) : "mental_ability",
      topic_name: topic && topic !== "all" ? topic.name : null,
      difficulty,
      total: questions.length,
      correct,
    });
  };

  const reset = () => {
    setPhase("subject");
    setSubject(null);
    setTopic(null);
    setDifficulty(null);
    setQuestions([]);
    setAnswers({});
    setFetchError(null);
    setActiveSet(null);
  };

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0),
    [questions, answers],
  );

  const steps = [tr("विषय", "Subject"), tr("घटक", "Topic"), tr("पातळी", "Difficulty")];
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
        onFinish={() => void finish()}
        onRestart={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("सराव", "Practice mode")}
        description={tr("वेळेचे बंधन नाही — प्रत्येक प्रश्नानंतर लगेच योग्य उत्तर व स्पष्टीकरण पाहा.", "Untimed practice powered by the central question bank with instant feedback and explanations.")}
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
              {tr(`पायरी ${num(i + 1)}: ${s}`, `Step ${i + 1}: ${s}`)}
            </span>
            {i < steps.length - 1 && <ChevronRight className="size-4 text-slate-300" />}
          </div>
        ))}

        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
          <Sparkles className="size-3.5" /> {tr("लगेच उत्तर व स्पष्टीकरण", "Central Question Bank · Instant Explanations")}
        </div>
      </div>

      {/* Teacher-assigned practice sets */}
      {phase === "subject" && sets.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">{tr("शिक्षकांनी दिलेले सराव संच", "Assigned by your teacher")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((ps) => (
              <button key={ps.id} onClick={() => void beginSet(ps)} className="text-left cursor-pointer group">
                <Card className="h-full rounded-2xl border border-line bg-white transition-all hover:border-brand-400 hover:shadow-xs">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-ink group-hover:text-brand-600">{ps.title}</p>
                      <Badge tone="brand" className="shrink-0">
                        {tr(`${num(ps.question_ids.length)} प्रश्न`, `${ps.question_ids.length} Q`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {tr(SUBJECT_LABELS_MR[ps.subjects?.code ?? ""] ?? "मिश्र", ps.subjects?.name ?? "Mixed")}
                      {ps.difficulty && ps.difficulty !== "combined" ? ` · ${tr(LEVEL_MR[ps.difficulty]?.name ?? ps.difficulty, ps.difficulty)}` : ""}
                    </p>
                    {ps.description && <p className="mt-2 line-clamp-2 text-xs text-slate-600">{ps.description}</p>}
                  </CardBody>
                </Card>
              </button>
            ))}
          </div>
          <p className="pt-2 text-sm font-semibold text-ink">{tr("किंवा स्वतः सराव करा", "Or practise on your own")}</p>
        </div>
      )}

      {/* Step 1: Subject Selection */}
      {phase === "subject" && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-600">{tr("सराव सुरू करण्यासाठी विषय निवडा:", "Select a subject to begin your practice session:")}</p>
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
                        {tr(SUBJ_MR[s.id] ?? s.short, s.short)}
                      </h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{tr(`${SUBJ_MR[s.id] ?? s.name} — सर्व घटक`, s.name)}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-semibold text-slate-500">{tr(`${num(s.topics.length)} घटक`, `${s.topics.length} topics`)}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-brand-600">
                          {tr("निवडा", "Select")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
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
          <BackButton onClick={() => setPhase("subject")} label={tr("विषयांकडे परत", "Back to subjects")} />
          <p className="text-sm font-medium text-slate-600">
            {tr("घटक निवडा —", "Choose a topic in")} <span className="font-bold text-ink">{tr(SUBJ_MR[subject.id] ?? subject.short, subject.short)}</span>:
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
                    <p className="text-sm font-bold text-brand-900">{tr("सर्व घटक (मिश्र सराव)", "All Topics (Mixed Practice)")}</p>
                    <p className="text-xs text-brand-700">{tr(`सर्व ${num(subject.topics.length)} घटकांचे प्रश्न`, `Practice questions from all ${subject.topics.length} topics`)}</p>
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
                      <p className="truncate text-xs text-muted mt-0.5">
                        {t.questionCount > 0 ? tr(`${num(t.questionCount)} सराव प्रश्न`, `${t.questionCount} practice questions`) : tr("अजून प्रश्न नाहीत", "No questions yet")}
                      </p>
                    </div>
                    <Badge tone="brand" className="font-semibold shrink-0">{tr("निवडा", "Select")}</Badge>
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
          <BackButton onClick={() => setPhase("topic")} label={tr("घटकांकडे परत", "Back to topics")} />
          <p className="text-sm font-medium text-slate-600">{tr("काठिण्य पातळी निवडा:", "Choose your challenge level:")}</p>
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
                      {tr(LEVEL_MR[d.id]?.name ?? d.name, d.name)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{tr(LEVEL_MR[d.id]?.description ?? d.description, d.description)}</p>
                    <p className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600">
                      {tr("सुरू करा", "Start")} <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
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
  const tr = useT();
  const num = useNum();
  const subjName = tr(SUBJ_MR[subject.id] ?? subject.short, subject.short);
  const levelName = (d: string) => tr(LEVEL_MR[d]?.name ?? d, d === "combined" ? "Combined" : d);
  const topicLabel = topic === "all" ? tr("सर्व घटक", "All Topics") : topic?.name ?? tr("घटक", "Topic");

  // Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mx-auto">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-ink">{tr("सराव प्रश्न येत आहेत", "Loading Practice Questions")}</h3>
        <p className="text-sm text-muted max-w-sm mx-auto">
          {tr(`${subjName} (${topicLabel}) चे प्रश्न आणत आहे…`, `Fetching questions for ${subject.short} (${topicLabel})...`)}
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
            <h3 className="text-lg font-bold text-rose-950">{tr("प्रश्न आणता आले नाहीत", "Could not load questions")}</h3>
            <p className="text-sm text-rose-800">{error}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Button onClick={onRetry} leftIcon={<RefreshCw className="size-4" />} size="sm">
                {tr("पुन्हा प्रयत्न करा", "Retry Query")}
              </Button>
              <Button onClick={onBackToDifficulty} variant="secondary" size="sm">
                {tr("दुसरी पातळी निवडा", "Choose Different Level")}
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
            <h3 className="text-lg font-bold text-ink">{tr("अजून प्रश्न उपलब्ध नाहीत", "No questions available yet")}</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              {tr(`${subjName} › ${topicLabel} — "${levelName(difficulty)}" पातळीचे प्रश्न सध्या उपलब्ध नाहीत.`, `We couldn't find any questions for ${subject.short} › ${topicLabel} at difficulty level "${difficulty}".`)}
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <Button onClick={onBackToDifficulty} size="sm">
                {tr("दुसरी पातळी निवडा (उदा. मिश्र)", "Try Another Difficulty (e.g. Combined)")}
              </Button>
              <Button onClick={onBackToTopics} variant="secondary" size="sm">
                {tr("दुसरा घटक निवडा", "Choose Another Topic")}
              </Button>
              <Button onClick={onRestart} variant="ghost" size="sm">
                {tr("विषयांकडे परत", "Back to Subjects")}
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
            title: tr("खूप छान! 🌟", "Outstanding Work! 🌟"),
            text: tr("तुम्हाला हा घटक चांगला समजला आहे. असाच सराव करत राहा!", "You have a strong understanding of this topic. Keep this momentum!"),
            tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
          }
        : percentage >= 50
          ? {
              title: tr("चांगला प्रयत्न! 👍", "Good Effort! 👍"),
              text: tr("तुमची प्रगती होत आहे. चुकलेले प्रश्न खाली पुन्हा पाहा.", "You are making steady progress. Review the questions you missed below."),
              tone: "text-amber-800 bg-amber-50 border-amber-200",
            }
          : {
              title: tr("सराव करत राहा! 💪", "Keep Practising! 💪"),
              text: tr("प्रत्येक प्रयत्नाने तुम्ही अधिक हुशार होता. खालील स्पष्टीकरणे नीट वाचा.", "Every attempt makes you sharper. Take time to read each explanation below."),
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
              {subjName} · {topicLabel} · {levelName(difficulty)}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-xs border-y border-line py-4">
              <Stat label={tr("बरोबर", "Correct")} value={num(score)} tone="text-success" />
              <Stat label={tr("चूक", "Incorrect")} value={num(questions.length - score)} tone="text-danger" />
              <Stat label={tr("एकूण प्रश्न", "Total Questions")} value={num(questions.length)} tone="text-ink" />
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted bg-slate-50 px-3 py-1.5 rounded-lg border border-line">
              <Info className="size-3.5 text-slate-400" />
              <span>{tr("तुमचे गुण सराव इतिहासात जतन झाले आहेत", "Your score has been saved to your practice history")}</span>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={onRestart} leftIcon={<RotateCcw className="size-4" />} size="md">
                {tr("पुन्हा सराव करा", "Practice Again")}
              </Button>
              <Link to="/student/dashboard">
                <Button variant="secondary" size="md">
                  {tr("मुख्य पानावर परत", "Back to Dashboard")}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        {/* Review Solutions with Explanations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">{tr("उत्तरे व स्पष्टीकरण पाहा", "Review Solutions & Explanations")}</h3>
            <span className="text-xs text-muted">{tr(`सर्व ${num(questions.length)} प्रश्न`, `All ${questions.length} questions answered`)}</span>
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
        <BackButton onClick={onRestart} label={tr("सराव थांबवा", "Exit practice")} />
        <Badge tone="brand">
          {subjName} · {levelName(difficulty)}
        </Badge>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-line shadow-xs">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="text-brand-600">
            {tr(`प्रश्न ${num(idx + 1)} / ${num(questions.length)}`, `Question ${idx + 1} of ${questions.length}`)}
          </span>
          <span className="tabular text-slate-500">
            {tr(`${num(questions.length)} पैकी ${num(answered)} सोडवले`, `${answered} of ${questions.length} answered`)}
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
          {tr("मागील", "Previous")}
        </Button>
        {isLast ? (
          <Button
            onClick={onFinish}
            leftIcon={<Check className="size-4" />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {tr("संपवा व गुण पाहा", "Finish & See Score")}
          </Button>
        ) : (
          <Button onClick={() => setIdx(idx + 1)} rightIcon={<ArrowRight className="size-4" />}>
            {tr("पुढचा प्रश्न", "Next Question")}
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
