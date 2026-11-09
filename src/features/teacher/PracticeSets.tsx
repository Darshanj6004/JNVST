import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff, Layers, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardBody, EmptyState, Spinner, Table, TD, TH, THead, TR, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { db, friendlyError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type SetRow = {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  question_ids: string[];
  is_active: boolean;
  created_at: string;
  subjects: { name: string } | null;
};

export default function PracticeSets() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SetRow[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SetRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: att }] = await Promise.all([
      db
        .from("practice_sets")
        .select("id, title, description, difficulty, question_ids, is_active, created_at, subjects(name)")
        .order("created_at", { ascending: false }),
      db.from("practice_attempts").select("practice_set_id").not("practice_set_id", "is", null).limit(10000),
    ]);
    if (error) toast({ type: "error", title: "Failed to load", message: friendlyError(error.message) });
    setRows((data as SetRow[]) ?? []);
    const counts: Record<string, number> = {};
    for (const a of (att ?? []) as { practice_set_id: string }[]) counts[a.practice_set_id] = (counts[a.practice_set_id] ?? 0) + 1;
    setAttemptCounts(counts);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (r: SetRow) => {
    const { error } = await db.from("practice_sets").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) {
      toast({ type: "error", title: "Update failed", message: friendlyError(error.message) });
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !r.is_active } : x)));
    toast({ type: "success", title: r.is_active ? "Hidden from students" : "Visible to students" });
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    const { error } = await db.from("practice_sets").delete().eq("id", deleteTarget.id);
    setBusy(false);
    if (error) {
      toast({ type: "error", title: "Delete failed", message: friendlyError(error.message) });
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ type: "success", title: "Practice set deleted" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice sets"
        description="Curated question sets that appear on every student's Practice page."
        actions={
          <Link to="/teacher/practice-sets/new">
            <Button leftIcon={<Plus className="size-4" />}>New practice set</Button>
          </Link>
        }
      />

      <Card>
        {loading ? (
          <CardBody className="flex justify-center py-16">
            <Spinner />
          </CardBody>
        ) : rows.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Layers className="size-6" />}
              title="No practice sets yet"
              description="Create a set to give students focused practice on weak topics."
              action={
                <Link to="/teacher/practice-sets/new">
                  <Button leftIcon={<Plus className="size-4" />}>Create practice set</Button>
                </Link>
              }
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Subject</TH>
                  <TH>Questions</TH>
                  <TH>Times practised</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <p className="font-medium text-ink">{r.title}</p>
                      {r.description && <p className="text-xs text-muted line-clamp-1">{r.description}</p>}
                    </TD>
                    <TD>
                      {r.subjects?.name ?? "—"}
                      {r.difficulty && r.difficulty !== "combined" && (
                        <span className="text-xs text-muted capitalize"> · {r.difficulty}</span>
                      )}
                    </TD>
                    <TD className="tabular">{r.question_ids.length}</TD>
                    <TD className="tabular">{attemptCounts[r.id] ?? 0}</TD>
                    <TD>
                      <Badge tone={r.is_active ? "success" : "neutral"} dot>
                        {r.is_active ? "Visible" : "Hidden"}
                      </Badge>
                    </TD>
                    <TD className="text-xs text-muted">{formatDateTime(r.created_at)}</TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void toggleActive(r)}
                          leftIcon={r.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        >
                          {r.is_active ? "Hide" : "Show"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          onClick={() => setDeleteTarget(r)}
                          leftIcon={<Trash2 className="size-4" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
        loading={busy}
        tone="danger"
        title="Delete practice set?"
        confirmLabel="Delete"
        description={`"${deleteTarget?.title ?? ""}" will be removed. Students' practice history is kept.`}
      />
    </div>
  );
}
