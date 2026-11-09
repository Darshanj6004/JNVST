import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Layers, Loader2, Save } from "lucide-react";
import { Button, Card, CardBody, CardHeader, Checkbox, Field, Input, Select, Textarea, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { difficulties } from "@/data/subjects";
import { db, localToCode, rpc } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSubjects } from "@/lib/useSubjects";

type Row = { id: string };

export default function CreatePracticeSet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { subjects, loading: loadingTopics } = useSubjects({ practiceCounts: true });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("mat");
  const [difficulty, setDifficulty] = useState("combined");
  const [count, setCount] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const topics = useMemo(() => subjects.find((s) => s.id === subjectId)?.topics ?? [], [subjects, subjectId]);
  const available = (selected.length ? topics.filter((t) => selected.includes(t.name)) : topics).reduce(
    (n, t) => n + t.questionCount,
    0,
  );

  const toggle = (topicName: string) =>
    setSelected((prev) => (prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]));

  const save = async () => {
    if (!name.trim()) {
      toast({ type: "error", title: "Name required", message: "Give the practice set a name." });
      return;
    }
    if (count < 1 || count > 100) {
      toast({ type: "error", title: "Invalid count", message: "Choose between 1 and 100 questions." });
      return;
    }
    setSaving(true);
    try {
      const code = localToCode[subjectId];
      const diff = difficulty === "combined" ? null : difficulty;
      const topicList: (string | null)[] = selected.length ? selected : [null];
      const pools = await Promise.all(
        topicList.map((t) =>
          rpc<Row[]>("get_practice_questions", {
            p_subject_code: code,
            p_topic_name: t,
            p_difficulty: diff,
            p_limit: 100,
          }),
        ),
      );
      const ids = [...new Set(pools.flat().map((r) => r.id))];
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const picked = ids.slice(0, count);
      if (picked.length === 0) {
        throw new Error("No matching questions are available. Add questions or choose other topics.");
      }

      const { data: subj } = await db.from("subjects").select("id").eq("code", code).single();
      const { error } = await db.from("practice_sets").insert({
        title: name.trim(),
        description: description.trim() || null,
        subject_id: subj?.id,
        difficulty,
        question_ids: picked,
        created_by: user?.id,
        is_active: true,
      });
      if (error) throw new Error(error.message);

      toast({
        type: "success",
        title: "Practice set created",
        message:
          picked.length < count
            ? `Only ${picked.length} matching questions were available; the set uses all of them.`
            : `"${name.trim()}" is now visible to students.`,
      });
      navigate("/teacher/practice-sets");
    } catch (e) {
      toast({ type: "error", title: "Could not create set", message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create practice set"
        description="Pick topics and the system draws random questions from the bank. Questions in upcoming tests are never used."
      />

      <Card>
        <CardHeader title="Set configuration" />
        <CardBody className="space-y-4">
          <Field label="Practice set name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Series & Analogy Warm-up" />
          </Field>
          <Field label="Instructions for students (optional)">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Finish before Friday's mock test"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Subject">
              <Select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setSelected([]);
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.short}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {difficulties.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Number of questions">
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={1}
                max={100}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Topics"
          subtitle={selected.length ? `${selected.length} selected` : "Leave empty to include all topics"}
        />
        <CardBody className="grid gap-2.5 sm:grid-cols-2">
          {loadingTopics ? (
            <div className="col-span-full flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-brand-400" />
            </div>
          ) : topics.length === 0 ? (
            <p className="col-span-full text-sm text-muted">No topics yet. Add questions to the bank first.</p>
          ) : (
            topics.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selected.includes(t.name) ? "border-brand-300 bg-brand-50/40" : "border-line hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <Checkbox label={t.name} checked={selected.includes(t.name)} onChange={() => toggle(t.name)} />
                </div>
                <span className="text-xs text-muted tabular">{t.questionCount} Q</span>
              </label>
            ))
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-line p-4">
        <div className="flex items-center gap-3 text-sm">
          <Layers className="size-5 text-brand-500" />
          <span className="text-muted">
            <strong className="text-ink tabular">{Math.min(count, available)}</strong> of {count} questions available ·{" "}
            <strong className="text-ink">{difficulties.find((d) => d.id === difficulty)?.name}</strong> ·{" "}
            {selected.length ? `${selected.length} topics` : "all topics"}
          </span>
        </div>
        <Button onClick={() => void save()} loading={saving} leftIcon={<Save className="size-4" />}>
          Create set
        </Button>
      </div>
    </div>
  );
}
