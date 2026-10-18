import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Hash,
  ImageIcon,
  Library,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Select,
  useToast,
} from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/cn";
import { questions as allQuestions } from "@/data/questions";
import { subjects } from "@/data/subjects";
import { previousYearPapers } from "@/data/previousYearPapers";
import type { PreviousYearPaper } from "@/data/previousYearPapers";
import type { Question } from "@/types";

// ── constants ─────────────────────────────────────────────────────────────────

const JNVST_SECTIONS = [
  { subjectId: "mat", label: "Mental Ability Test", quota: 40, marks: 50 },
  { subjectId: "ari", label: "Arithmetic Test", quota: 20, marks: 25 },
  { subjectId: "lan", label: "Language Test", quota: 20, marks: 25 },
];

const DIFF_TONE = { easy: "success", medium: "warning", hard: "danger" } as const;
const DIFF_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

type Pattern = "JNVST" | "Manual" | "PreviousYear";
type Step = "details" | "paper" | "questions";

// ── helpers ───────────────────────────────────────────────────────────────────

function UsagePill({ count }: { count: number }) {
  if (count === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
        <Hash className="size-3" /> Never used
      </span>
    );
  const heat =
    count >= 7
      ? "bg-orange-50 text-orange-600"
      : count >= 4
        ? "bg-amber-50 text-amber-600"
        : "bg-emerald-50 text-emerald-600";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", heat)}>
      <Hash className="size-3" />
      Used {count}×
    </span>
  );
}

function SectionQuota({
  label,
  quota,
  selected,
}: {
  label: string;
  quota: number;
  selected: number;
}) {
  const pct = Math.min(100, (selected / quota) * 100);
  const over = selected > quota;
  const done = selected >= quota;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-[13px] font-medium text-ink">{label}</span>
          <span
            className={cn(
              "ml-2 shrink-0 text-[13px] font-semibold tabular",
              over ? "text-danger" : done ? "text-success" : "text-muted",
            )}
          >
            {selected}/{quota}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              over ? "bg-danger" : done ? "bg-success" : "bg-brand-500",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── question row ──────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  checked,
  onToggle,
  expanded,
  onExpand,
}: {
  question: Question;
  checked: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const subjectAccent: Record<string, string> = {
    mat: "text-brand-600 bg-brand-50",
    ari: "text-violet-600 bg-violet-50",
    lan: "text-cyan-600 bg-cyan-50",
  };
  const subjectLabel: Record<string, string> = { mat: "MAT", ari: "ARI", lan: "LAN" };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        checked ? "border-brand-400 bg-brand-50/30" : "border-line bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Checkbox checked={checked} onChange={onToggle} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
                subjectAccent[question.subjectId] ?? "bg-slate-100 text-slate-600",
              )}
            >
              {subjectLabel[question.subjectId] ?? question.subjectId.toUpperCase()}
            </span>
            <Badge tone={DIFF_TONE[question.difficulty]}>{DIFF_LABEL[question.difficulty]}</Badge>
            <UsagePill count={question.usedCount} />
            {question.imageUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
                <ImageIcon className="size-3" /> Has image
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[13px] leading-snug text-ink">{question.text}</p>
        </div>
        <button
          onClick={onExpand}
          className="shrink-0 rounded-lg p-1 text-muted transition-colors hover:bg-slate-100 hover:text-ink"
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-line px-3 pb-3 pt-3">
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question figure"
              className="max-h-40 w-full rounded-lg bg-slate-100 object-cover"
            />
          )}
          <div className="grid gap-1.5">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]",
                  i === question.answer
                    ? "border-success/40 bg-[var(--color-success-soft)] font-medium text-success"
                    : "border-line bg-canvas text-muted",
                )}
              >
                {question.optionImages?.[i] && (
                  <img
                    src={question.optionImages[i]}
                    alt={`Option ${i + 1}`}
                    className="size-8 rounded object-cover bg-slate-100"
                  />
                )}
                <span className="mr-1 text-xs font-semibold tabular text-slate-400">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
                {i === question.answer && (
                  <span className="ml-auto text-[11px] font-semibold text-success">✓ correct</span>
                )}
              </div>
            ))}
          </div>
          <p className="border-l-2 border-brand-200 pl-3 text-[12px] leading-relaxed text-muted">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ── previous year paper card ──────────────────────────────────────────────────

function PaperCard({
  paper,
  selected,
  onSelect,
}: {
  paper: PreviousYearPaper;
  selected: boolean;
  onSelect: () => void;
}) {
  const bankIds = new Set(allQuestions.map((q) => q.id));
  const totalMapped = paper.sections.reduce(
    (sum, s) => sum + s.questionIds.filter((id) => bankIds.has(id)).length,
    0,
  );
  const coverage = Math.round((totalMapped / paper.totalQuestions) * 100);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-brand-500 bg-brand-50/40 ring-[3px] ring-brand-500/15"
          : "border-line bg-white hover:border-brand-300 hover:shadow-[var(--shadow-sm)]",
      )}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold tabular text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md">
              {paper.year}
            </span>
            {paper.tags.map((t) => (
              <Badge key={t} tone={t === "Official" ? "brand" : "neutral"}>
                {t}
              </Badge>
            ))}
          </div>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{paper.title}</p>
          <p className="mt-0.5 text-[12px] text-muted">{paper.region}</p>
        </div>
        {selected && <CheckCircle2 className="size-5 shrink-0 text-brand-600" />}
      </div>

      {/* section summary */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {paper.sections.map((s) => {
          const label: Record<string, string> = { mat: "Mental", ari: "Arith.", lan: "Language" };
          return (
            <div key={s.subjectId} className="rounded-lg bg-canvas px-2 py-1.5 text-center">
              <p className="text-[10px] font-medium text-muted">{label[s.subjectId]}</p>
              <p className="text-[13px] font-semibold tabular text-ink">{s.quota} Q</p>
            </div>
          );
        })}
      </div>

      {/* bank coverage */}
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="text-muted">
          {paper.totalQuestions} Q · {paper.totalMarks} marks · {paper.durationMin} min
        </span>
        <span
          className={cn(
            "font-medium tabular",
            coverage >= 80 ? "text-success" : coverage >= 50 ? "text-warning" : "text-muted",
          )}
        >
          {coverage}% in bank
        </span>
      </div>

      {paper.note && (
        <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-muted">
          {paper.note}
        </p>
      )}
    </button>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function CreateScheduleMock() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("details");
  const [pattern, setPattern] = useState<Pattern>("JNVST");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-09-15");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(120);
  const [selectedPaper, setSelectedPaper] = useState<PreviousYearPaper | null>(null);
  const [yearFilter, setYearFilter] = useState("all");

  // question selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [filterUsed, setFilterUsed] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleTopics = useMemo(() => {
    if (filterSubject === "all") return [];
    return subjects.find((s) => s.id === filterSubject)?.topics ?? [];
  }, [filterSubject]);

  const filtered = useMemo(() => {
    let pool = allQuestions;
    if (filterSubject !== "all") pool = pool.filter((q) => q.subjectId === filterSubject);
    if (filterTopic !== "all") pool = pool.filter((q) => q.topicId === filterTopic);
    if (filterDiff !== "all") pool = pool.filter((q) => q.difficulty === filterDiff);
    if (filterUsed === "unused") pool = pool.filter((q) => q.usedCount === 0);
    else if (filterUsed === "low") pool = pool.filter((q) => q.usedCount <= 3);
    else if (filterUsed === "high") pool = pool.filter((q) => q.usedCount >= 7);
    if (search.trim()) {
      const q = search.toLowerCase();
      pool = pool.filter((qu) => qu.text.toLowerCase().includes(q));
    }
    return pool;
  }, [filterSubject, filterTopic, filterDiff, filterUsed, search]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of selectedIds) {
      const q = allQuestions.find((x) => x.id === id);
      if (q) counts[q.subjectId] = (counts[q.subjectId] ?? 0) + 1;
    }
    return counts;
  }, [selectedIds]);

  const totalSelected = selectedIds.size;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    const allVisible = filtered.map((q) => q.id);
    const allChecked = allVisible.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) allVisible.forEach((id) => next.delete(id));
      else allVisible.forEach((id) => next.add(id));
      return next;
    });
  }
  const allVisibleChecked = filtered.length > 0 && filtered.every((q) => selectedIds.has(q.id));

  // Load a previous year paper's questions into the selection
  function applyPaper(paper: PreviousYearPaper) {
    const bankIds = new Set(allQuestions.map((q) => q.id));
    const ids = paper.sections.flatMap((s) => s.questionIds.filter((id) => bankIds.has(id)));
    setSelectedIds(new Set(ids));
  }

  // Years available for filter
  const availableYears = [...new Set(previousYearPapers.map((p) => p.year))].sort((a, b) => b - a);

  const filteredPapers = useMemo(
    () =>
      yearFilter === "all"
        ? previousYearPapers
        : previousYearPapers.filter((p) => String(p.year) === yearFilter),
    [yearFilter],
  );

  function handleSchedule() {
    toast({
      type: "success",
      title: "Mock test scheduled",
      message: `"${title || "Untitled mock"}" set for ${date} · ${totalSelected} questions selected.`,
    });
    navigate("/teacher/dashboard");
  }

  // ── step 1: details ──────────────────────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Create & schedule mock test"
          description="Choose a source — official pattern, a previous year paper, or a fully custom set."
        />

        {/* Pattern picker */}
        <Card>
          <CardHeader title="Question source" subtitle="Pick how you want to build this test" />
          <CardBody className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  id: "JNVST" as Pattern,
                  icon: <FileText className="size-5" />,
                  label: "JNVST pattern",
                  sub: "Pick questions manually · 80 Q / 100 marks",
                },
                {
                  id: "PreviousYear" as Pattern,
                  icon: <Library className="size-5" />,
                  label: "Previous year paper",
                  sub: "Load a ready-made official paper",
                },
                {
                  id: "Manual" as Pattern,
                  icon: <Brain className="size-5" />,
                  label: "Manual / Custom",
                  sub: "Your own question count and marks",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPattern(opt.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  pattern === opt.id
                    ? "border-brand-500 bg-brand-50/40 ring-[3px] ring-brand-500/15"
                    : "border-line hover:border-brand-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      pattern === opt.id ? "bg-brand-500 text-white" : "bg-slate-100 text-muted",
                    )}
                  >
                    {opt.icon}
                  </span>
                  {pattern === opt.id && <CheckCircle2 className="size-5 text-brand-600" />}
                </div>
                <p className="mt-3 text-[14px] font-semibold text-ink">{opt.label}</p>
                <p className="mt-0.5 text-[12px] text-muted">{opt.sub}</p>
              </button>
            ))}
          </CardBody>
        </Card>

        {/* Test details */}
        <Card>
          <CardHeader title="Test details" />
          <CardBody className="space-y-4">
            <Field label="Test title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  pattern === "PreviousYear" && selectedPaper
                    ? selectedPaper.title
                    : "e.g. JNVST Full Mock #5"
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Start time">
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </Field>
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  value={pattern !== "Manual" ? 120 : duration}
                  disabled={pattern !== "Manual"}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Assign to">
              <Select defaultValue="all">
                <option value="all">All students (4th A & 4th B)</option>
                <option value="a">4th A only</option>
                <option value="b">4th B only</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        {/* JNVST blueprint (when not custom / previous year) */}
        {pattern === "JNVST" && (
          <Card>
            <CardHeader title="Section blueprint" subtitle="Locked to the official pattern · no negative marking" />
            <CardBody className="space-y-2.5">
              {JNVST_SECTIONS.map((s) => (
                <div key={s.subjectId} className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                  <span className="text-sm font-medium text-ink">{s.label}</span>
                  <span className="text-[13px] text-muted tabular">
                    {s.quota} Q · {s.marks} marks
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Clock className="size-4" /> Total
                </span>
                <span className="text-sm font-semibold text-ink tabular">80 Q · 100 marks · 120 min</span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Selected paper preview */}
        {pattern === "PreviousYear" && selectedPaper && (
          <Card>
            <CardHeader
              title="Selected paper"
              action={
                <button
                  onClick={() => { setSelectedPaper(null); setSelectedIds(new Set()); }}
                  className="text-[13px] text-muted hover:text-ink"
                >
                  Change
                </button>
              }
            />
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Library className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink">{selectedPaper.title}</p>
                  <p className="text-[13px] text-muted">
                    {selectedPaper.totalQuestions} Q · {selectedPaper.totalMarks} marks ·{" "}
                    {selectedPaper.durationMin} min · {selectedPaper.region}
                  </p>
                  {selectedPaper.note && (
                    <p className="mt-1 text-[12px] text-slate-400">{selectedPaper.note}</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* CTA bar */}
        <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <CalendarClock className="size-4 text-brand-500" />
            {date} at {time}
          </span>
          <Button
            onClick={() => {
              if (pattern === "PreviousYear") {
                setStep("paper");
              } else {
                setStep("questions");
              }
            }}
          >
            {pattern === "PreviousYear" ? "Choose paper →" : "Select questions →"}
          </Button>
        </div>
      </div>
    );
  }

  // ── step 2: previous year paper picker ───────────────────────────────────────
  if (step === "paper") {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Choose a previous year paper"
            description="Select a paper to pre-load its questions. You can still add or remove questions in the next step."
          />
          <Button variant="ghost" onClick={() => setStep("details")}>
            ← Back
          </Button>
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-muted">Year:</span>
          {(["all", ...availableYears.map(String)] as const).map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
                yearFilter === y
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line text-muted hover:border-brand-300 hover:text-ink",
              )}
            >
              {y === "all" ? "All years" : y}
            </button>
          ))}
        </div>

        {/* Paper grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              selected={selectedPaper?.id === paper.id}
              onSelect={() => {
                setSelectedPaper(paper);
                applyPaper(paper);
                if (!title) setTitle(paper.title);
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between rounded-2xl border border-line bg-white p-4">
          <span className="text-[13px] text-muted">
            {selectedPaper ? (
              <>
                <span className="font-medium text-ink">{selectedPaper.title}</span> selected ·{" "}
                {selectedIds.size} questions loaded from bank
              </>
            ) : (
              "No paper selected yet"
            )}
          </span>
          <Button disabled={!selectedPaper} onClick={() => setStep("questions")}>
            Review & edit questions →
          </Button>
        </div>
      </div>
    );
  }

  // ── step 3: question selection ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={pattern === "PreviousYear" ? "Review & edit questions" : "Select questions"}
          description={
            pattern === "PreviousYear"
              ? `Questions from "${selectedPaper?.title}" are pre-loaded. Add or remove as needed.`
              : pattern === "JNVST"
                ? "Pick exactly 40 MAT · 20 ARI · 20 LAN questions for the official JNVST pattern."
                : "Choose any questions for this custom mock."
          }
        />
        <Button
          variant="ghost"
          onClick={() => setStep(pattern === "PreviousYear" ? "paper" : "details")}
        >
          ← Back
        </Button>
      </div>

      {/* Paper banner (when loaded) */}
      {pattern === "PreviousYear" && selectedPaper && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <Library className="size-4 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-medium text-brand-800">{selectedPaper.title}</span>
            <span className="mx-2 text-brand-300">·</span>
            <span className="text-[13px] text-brand-600">
              {selectedIds.size} of {selectedPaper.totalQuestions} questions matched in your bank
            </span>
          </div>
          <Badge tone="brand">{selectedPaper.year}</Badge>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* left: question list */}
        <div className="min-w-0 space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search question text…"
                  className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-9 pr-4 text-[14px] text-ink placeholder:text-muted outline-none transition-all focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/15"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Subject">
                  <Select
                    value={filterSubject}
                    onChange={(e) => {
                      setFilterSubject(e.target.value);
                      setFilterTopic("all");
                    }}
                  >
                    <option value="all">All subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.short}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Topic">
                  <Select
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    disabled={filterSubject === "all"}
                  >
                    <option value="all">All topics</option>
                    {visibleTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Difficulty">
                  <Select value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
                    <option value="all">All levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="self-center text-[12px] text-muted">Usage:</span>
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "unused", label: "Never used" },
                    { id: "low", label: "Used ≤3×" },
                    { id: "high", label: "Used ≥7×" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterUsed(opt.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
                      filterUsed === opt.id
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-line text-muted hover:border-brand-300 hover:text-ink",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Checkbox checked={allVisibleChecked} onChange={toggleAll} />
              <span className="text-[13px] text-muted">
                {filtered.length} question{filtered.length !== 1 ? "s" : ""} shown
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-danger"
              >
                <RotateCcw className="size-3.5" />
                Clear all ({selectedIds.size})
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
              <Brain className="mb-3 size-8 text-slate-300" />
              <p className="text-sm font-medium text-muted">No questions match your filters</p>
              <p className="mt-1 text-[12px] text-slate-400">
                Try adjusting the subject, topic or difficulty
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  checked={selectedIds.has(q.id)}
                  onToggle={() => toggle(q.id)}
                  expanded={expandedId === q.id}
                  onExpand={() => setExpandedId(expandedId === q.id ? null : q.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* right: sidebar */}
        <div className="space-y-4">
          {/* section quotas */}
          {(pattern === "JNVST" || pattern === "PreviousYear") && (
            <Card>
              <CardHeader
                title="Section quotas"
                subtitle={
                  pattern === "PreviousYear"
                    ? "Target: official JNVST blueprint"
                    : "Must match exactly to proceed"
                }
              />
              <CardBody className="space-y-4">
                {JNVST_SECTIONS.map((s) => (
                  <SectionQuota
                    key={s.subjectId}
                    label={s.label}
                    quota={s.quota}
                    selected={sectionCounts[s.subjectId] ?? 0}
                  />
                ))}
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[13px] font-semibold text-ink">Total</span>
                  <span
                    className={cn(
                      "text-[13px] font-bold tabular",
                      totalSelected > 80
                        ? "text-danger"
                        : totalSelected === 80
                          ? "text-success"
                          : "text-muted",
                    )}
                  >
                    {totalSelected} / 80
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {pattern === "Manual" && (
            <Card>
              <CardHeader title="Selected" />
              <CardBody>
                <div className="py-2 text-center">
                  <p className="text-3xl font-bold tabular text-ink">{totalSelected}</p>
                  <p className="mt-1 text-[13px] text-muted">questions chosen</p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* breakdown */}
          {totalSelected > 0 && (
            <Card>
              <CardHeader title="Breakdown" />
              <CardBody className="space-y-2">
                {subjects
                  .filter((s) => (sectionCounts[s.id] ?? 0) > 0)
                  .map((s) => {
                    const subjectLabel: Record<string, string> = {
                      mat: "Mental Ability",
                      ari: "Arithmetic",
                      lan: "Language",
                    };
                    const subjectColor: Record<string, string> = {
                      mat: "bg-brand-50 text-brand-700",
                      ari: "bg-violet-50 text-violet-700",
                      lan: "bg-cyan-50 text-cyan-700",
                    };
                    return (
                      <div key={s.id} className="flex items-center justify-between text-[13px]">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            subjectColor[s.id] ?? "bg-slate-100 text-slate-600",
                          )}
                        >
                          {subjectLabel[s.id] ?? s.short}
                        </span>
                        <span className="font-medium tabular text-ink">
                          {sectionCounts[s.id]} Q
                        </span>
                      </div>
                    );
                  })}
              </CardBody>
            </Card>
          )}

          {/* test meta */}
          <Card>
            <CardHeader title="Test info" />
            <CardBody className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted">Title</span>
                <span className="ml-2 max-w-[130px] truncate font-medium text-ink">
                  {title || "Untitled mock"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Source</span>
                <Badge tone="brand">
                  {pattern === "PreviousYear"
                    ? `${selectedPaper?.year ?? ""} Paper`
                    : pattern}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Date</span>
                <span className="font-medium tabular text-ink">{date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Time</span>
                <span className="font-medium tabular text-ink">{time}</span>
              </div>
            </CardBody>
          </Card>

          <Button
            className="w-full"
            disabled={
              totalSelected === 0 ||
              (pattern === "JNVST" &&
                (totalSelected !== 80 ||
                  JNVST_SECTIONS.some(
                    (s) => (sectionCounts[s.subjectId] ?? 0) !== s.quota,
                  )))
            }
            onClick={handleSchedule}
          >
            <CalendarClock className="mr-2 size-4" />
            Schedule test
          </Button>

          {pattern === "JNVST" && totalSelected !== 80 && (
            <p className="text-center text-[11px] text-muted">
              {totalSelected < 80
                ? `${80 - totalSelected} more question${80 - totalSelected !== 1 ? "s" : ""} needed`
                : `${totalSelected - 80} too many — remove some`}
            </p>
          )}

          {pattern === "PreviousYear" && selectedPaper && totalSelected < selectedPaper.totalQuestions && (
            <p className="text-center text-[11px] text-muted">
              {selectedPaper.totalQuestions - totalSelected} questions from this paper aren't in your
              bank yet — add them via the Question Bank to reach the full 80.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
