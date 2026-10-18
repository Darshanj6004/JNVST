import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Database, ImageIcon, Pencil, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Badge, Button, Card, Pagination, SearchInput, Select, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { subjects } from "@/data/subjects";
import { usePagination } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabaseClient";

const difficultyTone = { easy: "success", medium: "warning", hard: "danger" } as const;

type DBQuestion = {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  marks: number;
  explanation: string | null;
  image_url: string | null;
  used_count: number;
  updated_at: string;
  subject_code: string;
  subject_name: string;
  topic_name: string;
  subject_id: string;
  topic_id: string;
};

export default function QuestionBank() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [imageFilter, setImageFilter] = useState<"all" | "with" | "without">("all");
  const [pending, setPending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("questions_view" as never)
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ type: "error", title: "Failed to load questions", message: error.message });
    } else {
      setQuestions((data as DBQuestion[]) ?? []);
    }
    setLoadingData(false);
  }, [toast]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const filtered = useMemo(() => {
    const subjectCode = subjects.find((s) => s.id === subject)?.name.toLowerCase().replace(/ test$/, "").replace(/ /g, "_");
    return questions.filter((q) => {
      if (subject !== "all") {
        // match by subject_code
        const sc = subjects.find((s) => s.id === subject);
        if (sc) {
          const codeMap: Record<string, string> = { mat: "mental_ability", ari: "arithmetic", lan: "language" };
          if (q.subject_code !== codeMap[sc.id]) return false;
        }
      }
      if (difficulty !== "all" && q.difficulty !== difficulty) return false;
      if (imageFilter === "with" && !q.image_url) return false;
      if (imageFilter === "without" && q.image_url) return false;
      if (query && !q.question_text.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [questions, query, subject, difficulty, imageFilter]);

  const { page, setPage, pageCount, slice } = usePagination(filtered, 10);

  const subjectLabel = (code: string) => {
    const map: Record<string, string> = {
      mental_ability: "Mental Ability",
      arithmetic: "Arithmetic",
      language: "Language",
    };
    return map[code] ?? code;
  };

  const handleDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_question", {
      p_question_id: pending,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    setDeleting(false);
    setPending(null);
    if (error) {
      toast({ type: "error", title: "Cannot delete", message: error.message });
    } else {
      setQuestions((prev) => prev.filter((q) => q.id !== pending));
      toast({ type: "success", title: "Question deleted", message: "Removed from the bank." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description={`${questions.length} question${questions.length !== 1 ? "s" : ""} across 3 subjects — reusable across practice sets and mock tests.`}
        actions={
          <>
            <Button
              variant="ghost"
              leftIcon={<RefreshCw className={cn("size-4", loadingData && "animate-spin")} />}
              onClick={loadQuestions}
              disabled={loadingData}
            >
              Refresh
            </Button>
            <Link to="/teacher/questions/import">
              <Button variant="secondary" leftIcon={<Upload className="size-4" />}>
                Import Excel
              </Button>
            </Link>
            <Link to="/teacher/questions/new">
              <Button leftIcon={<Plus className="size-4" />}>Add question</Button>
            </Link>
          </>
        }
      />

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              placeholder="Search questions…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setPage(1); }}
              className="min-w-40"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.short}</option>
              ))}
            </Select>
            <Select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              className="min-w-36"
            >
              <option value="all">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>
        </div>

        {/* image filter pills */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">Images:</span>
          {(
            [
              { id: "all", label: "All" },
              { id: "with", label: "Has image" },
              { id: "without", label: "Text only" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setImageFilter(opt.id); setPage(1); }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-all",
                imageFilter === opt.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-line text-muted hover:border-brand-300 hover:text-ink",
              )}
            >
              {opt.id === "with" && <ImageIcon className="size-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loadingData ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
            <Database className="size-8 animate-pulse text-brand-400" />
            <p className="text-sm">Loading questions from database…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
            <Database className="size-8 text-slate-300" />
            <p className="text-sm font-medium">No questions found</p>
            <p className="text-xs">
              {questions.length === 0
                ? "Add your first question or import from Excel."
                : "Try adjusting your filters."}
            </p>
            {questions.length === 0 && (
              <Link to="/teacher/questions/new">
                <Button size="sm" leftIcon={<Plus className="size-4" />}>Add question</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH className="w-[42%]">Question</TH>
                  <TH>Subject</TH>
                  <TH>Topic</TH>
                  <TH>Level</TH>
                  <TH>Updated</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </THead>
              <tbody>
                {slice.map((q) => (
                  <Fragment key={q.id}>
                    <TR className={cn(expandedId === q.id && "bg-slate-50/60")}>
                      <TD>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-1 max-w-md font-medium text-ink">{q.question_text}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-muted tabular">{q.marks} marks</span>
                              {q.image_url && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-600">
                                  <ImageIcon className="size-3" />
                                  Image
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-muted">{subjectLabel(q.subject_code)}</TD>
                      <TD className="text-muted">{q.topic_name}</TD>
                      <TD>
                        <Badge tone={difficultyTone[q.difficulty]}>
                          {q.difficulty[0].toUpperCase() + q.difficulty.slice(1)}
                        </Badge>
                      </TD>
                      <TD className="text-muted whitespace-nowrap">{formatDate(q.updated_at)}</TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          {q.image_url && (
                            <button
                              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                              title="Preview image"
                              className={cn(
                                "rounded-lg p-1.5 transition-colors",
                                expandedId === q.id
                                  ? "bg-sky-50 text-sky-600"
                                  : "text-muted hover:bg-sky-50 hover:text-sky-600",
                              )}
                            >
                              <ImageIcon className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/teacher/questions/${q.id}/edit`)}
                            className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-brand-600"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => setPending(q.id)}
                            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </TD>
                    </TR>

                    {/* inline image preview row */}
                    {expandedId === q.id && q.image_url && (
                      <tr key={`${q.id}-preview`} className="bg-slate-50/60">
                        <td colSpan={6} className="px-4 pb-4 pt-0">
                          <div className="max-w-sm space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                              Question figure
                            </p>
                            <img
                              src={q.image_url}
                              alt="Question figure"
                              className="h-40 w-full rounded-xl border border-line object-contain bg-slate-100"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>

            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <p className="text-[13px] text-muted">
                Showing <span className="tabular">{slice.length}</span> of{" "}
                <span className="tabular">{filtered.length}</span> questions
              </p>
              <Pagination page={page} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this question?"
        tone="danger"
        confirmLabel="Delete"
        description="This question will be removed from the bank. Questions used in active or completed tests cannot be deleted."
      />
    </div>
  );
}
