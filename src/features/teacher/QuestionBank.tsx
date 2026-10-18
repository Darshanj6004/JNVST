import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Database, ImageIcon, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Badge, Button, Card, Pagination, SearchInput, Select, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { questions as seed } from "@/data/questions";
import { subjects } from "@/data/subjects";
import { usePagination } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const difficultyTone = { easy: "success", medium: "warning", hard: "danger" } as const;

export default function QuestionBank() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [imageFilter, setImageFilter] = useState<"all" | "with" | "without">("all");
  const [pending, setPending] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      seed.filter((q) => {
        if (subject !== "all" && q.subjectId !== subject) return false;
        if (difficulty !== "all" && q.difficulty !== difficulty) return false;
        if (imageFilter === "with" && !q.imageUrl && !q.optionImages?.some(Boolean)) return false;
        if (imageFilter === "without" && (q.imageUrl || q.optionImages?.some(Boolean))) return false;
        if (query && !q.text.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [query, subject, difficulty, imageFilter],
  );

  const { page, setPage, pageCount, slice } = usePagination(filtered, 8);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.short ?? id;
  const topicName = (sid: string, tid: string) =>
    subjects.find((s) => s.id === sid)?.topics.find((t) => t.id === tid)?.name ?? tid;

  const hasImages = (q: (typeof seed)[0]) =>
    Boolean(q.imageUrl) || Boolean(q.optionImages?.some(Boolean));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description="312 questions across 3 subjects — reusable across practice sets and mock tests."
        actions={
          <>
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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
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
                <TR
                  key={q.id}
                  className={cn(expandedId === q.id && "bg-slate-50/60")}
                >
                  <TD>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-1 max-w-md font-medium text-ink">{q.text}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-muted tabular">{q.marks} marks</span>
                          {hasImages(q) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-600">
                              <ImageIcon className="size-3" />
                              {q.imageUrl && q.optionImages?.some(Boolean)
                                ? "Q + options"
                                : q.imageUrl
                                  ? "Question"
                                  : "Options"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-muted">{subjectName(q.subjectId)}</TD>
                  <TD className="text-muted">{topicName(q.subjectId, q.topicId)}</TD>
                  <TD>
                    <Badge tone={difficultyTone[q.difficulty]}>
                      {q.difficulty[0].toUpperCase() + q.difficulty.slice(1)}
                    </Badge>
                  </TD>
                  <TD className="text-muted whitespace-nowrap">{formatDate(q.updatedAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      {hasImages(q) && (
                        <button
                          onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                          title="Preview images"
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
                {expandedId === q.id && (
                  <tr key={`${q.id}-preview`} className="bg-slate-50/60">
                    <td colSpan={6} className="px-4 pb-4 pt-0">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {q.imageUrl && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                              Question figure
                            </p>
                            <img
                              src={q.imageUrl}
                              alt="Question figure"
                              className="h-32 w-full rounded-xl border border-line object-cover bg-slate-100"
                            />
                          </div>
                        )}
                        {q.optionImages?.map((img, i) =>
                          img ? (
                            <div key={i} className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                Option {String.fromCharCode(65 + i)}
                                {i === q.answer && (
                                  <span className="ml-1.5 text-success">✓ correct</span>
                                )}
                              </p>
                              <img
                                src={img}
                                alt={`Option ${String.fromCharCode(65 + i)}`}
                                className="h-32 w-full rounded-xl border border-line object-cover bg-slate-100"
                              />
                            </div>
                          ) : null,
                        )}
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
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={() =>
          toast({
            type: "success",
            title: "Question deleted",
            message: "The question was removed from the bank.",
          })
        }
        title="Delete this question?"
        tone="danger"
        confirmLabel="Delete"
        description="This question will be removed from the bank. Questions used in active or completed tests can't be deleted."
      />
    </div>
  );
}
