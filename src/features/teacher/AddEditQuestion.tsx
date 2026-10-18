import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Eye, Image, ImagePlus, Save, X } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Select, Textarea, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { subjects } from "@/data/subjects";
import { questions } from "@/data/questions";
import { cn } from "@/lib/cn";

const letters = ["A", "B", "C", "D"];

// ── reusable image input with preview ────────────────────────────────────────

function ImageInput({
  value,
  onChange,
  placeholder = "Paste image URL…",
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="relative">
        <Image className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
        <input
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setErrored(false); }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-canvas pl-8 pr-8 py-2 text-[13px] text-ink placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-[3px] focus:ring-brand-500/15 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {value && !errored && (
        <div className={cn("relative overflow-hidden rounded-xl border border-line bg-slate-50", compact ? "h-24" : "h-40")}>
          <img
            src={value}
            alt="Preview"
            onError={() => setErrored(true)}
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {value && errored && (
        <p className="text-[12px] text-danger">Image failed to load — check the URL.</p>
      )}
    </div>
  );
}

// ── option row with togglable image slot ────────────────────────────────────

function OptionRow({
  index,
  value,
  imageUrl,
  isAnswer,
  onTextChange,
  onImageChange,
  onSelectAnswer,
}: {
  index: number;
  value: string;
  imageUrl: string;
  isAnswer: boolean;
  onTextChange: (v: string) => void;
  onImageChange: (v: string) => void;
  onSelectAnswer: () => void;
}) {
  const [showImg, setShowImg] = useState(Boolean(imageUrl));

  return (
    <div
      className={cn(
        "rounded-xl border p-3 space-y-2.5 transition-colors",
        isAnswer ? "border-success/40 bg-success-soft/30" : "border-line bg-white",
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* correct-answer toggle */}
        <button
          type="button"
          onClick={onSelectAnswer}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold ring-1 ring-inset transition-colors",
            isAnswer
              ? "bg-success text-white ring-success"
              : "bg-white text-muted ring-line hover:ring-brand-300",
          )}
        >
          {isAnswer ? <Check className="size-4" /> : letters[index]}
        </button>

        <Input
          value={value}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Option ${letters[index]}`}
          className="flex-1"
        />

        {/* image toggle */}
        <button
          type="button"
          onClick={() => setShowImg((v) => !v)}
          title={showImg ? "Remove image slot" : "Add image to this option"}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
            showImg || imageUrl
              ? "bg-sky-50 text-sky-600 ring-sky-200"
              : "bg-white text-muted ring-line hover:text-sky-600 hover:ring-sky-300",
          )}
        >
          <ImagePlus className="size-4" />
        </button>
      </div>

      {(showImg || imageUrl) && (
        <div className="pl-10">
          <ImageInput
            value={imageUrl}
            onChange={onImageChange}
            placeholder={`Image URL for option ${letters[index]}…`}
            compact
          />
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function AddEditQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const existing = id ? questions.find((q) => q.id === id) : undefined;
  const isEdit = Boolean(existing);

  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? subjects[0].id);
  const [topicId, setTopicId] = useState(existing?.topicId ?? subjects[0].topics[0].id);
  const [difficulty, setDifficulty] = useState(existing?.difficulty ?? "easy");
  const [text, setText] = useState(existing?.text ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? "");
  const [options, setOptions] = useState<string[]>(existing?.options ?? ["", "", "", ""]);
  const [optionImages, setOptionImages] = useState<string[]>(
    existing?.optionImages?.map((v) => v ?? "") ?? ["", "", "", ""],
  );
  const [answer, setAnswer] = useState(existing?.answer ?? 0);
  const [marks, setMarks] = useState(existing?.marks ?? 1.25);
  const [explanation, setExplanation] = useState(existing?.explanation ?? "");

  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];

  function setOptionText(i: number, v: string) {
    setOptions((o) => o.map((x, xi) => (xi === i ? v : x)));
  }
  function setOptionImage(i: number, v: string) {
    setOptionImages((o) => o.map((x, xi) => (xi === i ? v : x)));
  }

  const save = () => {
    toast({
      type: "success",
      title: isEdit ? "Question updated" : "Question added",
      message: isEdit ? "Your changes have been saved." : "The question is now in the bank.",
    });
    navigate("/teacher/questions");
  };

  const previewQ = {
    id: "preview",
    subjectId,
    topicId,
    difficulty: difficulty as "easy" | "medium" | "hard",
    text: text || "Your question text will appear here…",
    imageUrl: imageUrl || undefined,
    options: options.map((o, i) => o || `Option ${letters[i]}`),
    optionImages: optionImages.map((v) => v || undefined),
    answer,
    marks,
    explanation: explanation || "Explanation will appear here after submission.",
    updatedAt: new Date().toISOString(),
    usedCount: 0,
  };

  return (
    <div className="space-y-6">
      <Link
        to="/teacher/questions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to question bank
      </Link>

      <PageHeader
        title={isEdit ? "Edit question" : "Add question"}
        description="Tag with subject, topic and difficulty. Add images to the question stem or individual options."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ── Form ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Classification" />
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <Field label="Subject">
                <Select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    const t = subjects.find((s) => s.id === e.target.value)?.topics[0];
                    if (t) setTopicId(t.id);
                  }}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.short}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Topic">
                <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Difficulty">
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                >
                  <option value="easy">Easy (L1)</option>
                  <option value="medium">Medium (L2)</option>
                  <option value="hard">Hard (L3)</option>
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Question stem"
              subtitle="Write the question text, then optionally attach a figure or diagram"
            />
            <CardBody className="space-y-4">
              <Field label="Question text">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type the question…"
                />
              </Field>

              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink">
                  Question image{" "}
                  <span className="font-normal text-muted">(optional — figure, diagram, table)</span>
                </p>
                <ImageInput
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="Paste image URL for the question figure…"
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Answer options"
              subtitle="Click a letter badge to mark the correct answer · use the image icon to attach a figure to an option"
            />
            <CardBody className="space-y-2.5">
              {options.map((opt, i) => (
                <OptionRow
                  key={i}
                  index={i}
                  value={opt}
                  imageUrl={optionImages[i]}
                  isAnswer={answer === i}
                  onTextChange={(v) => setOptionText(i, v)}
                  onImageChange={(v) => setOptionImage(i, v)}
                  onSelectAnswer={() => setAnswer(i)}
                />
              ))}

              <div className="pt-2">
                <Field label="Marks">
                  <Input
                    type="number"
                    step="0.25"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="max-w-36"
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Explanation" subtitle="Shown to students after they submit" />
            <CardBody>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why the correct answer is right…"
              />
            </CardBody>
          </Card>

          <div className="flex justify-end gap-2">
            <Link to="/teacher/questions">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={save} leftIcon={<Save className="size-4" />}>
              {isEdit ? "Save changes" : "Add question"}
            </Button>
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader
              title="Live preview"
              subtitle="How students will see this question"
              action={
                <Badge tone="brand">
                  <Eye className="size-3.5" /> Preview
                </Badge>
              }
            />
            <CardBody>
              <QuestionCard question={previewQ} index={0} selected={answer} reveal />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
