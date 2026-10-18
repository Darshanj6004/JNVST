import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { KeyRound, Pencil, Plus, UserRoundX } from "lucide-react";
import { Avatar, Badge, Button, Card, Pagination, SearchInput, Select, Table, TH, THead, TR, TD, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { students } from "@/data/users";
import { usePagination } from "@/lib/hooks";
import { relativeTime } from "@/lib/format";

export default function StudentManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [deactivate, setDeactivate] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      students.filter((s) => {
        if (status !== "all" && s.status !== status) return false;
        if (query && !`${s.name} ${s.username} ${s.rollNo}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [query, status],
  );
  const { page, setPage, pageCount, slice } = usePagination(filtered, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student management"
        description="Create and manage student accounts. Students can't self-register."
        actions={
          <Link to="/teacher/students/new">
            <Button leftIcon={<Plus className="size-4" />}>Add student</Button>
          </Link>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              placeholder="Search by name, username, roll…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:min-w-40">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <THead>
            <tr>
              <TH>Student</TH>
              <TH>Roll</TH>
              <TH>Class</TH>
              <TH>Status</TH>
              <TH>Last active</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <tbody>
            {slice.map((s) => (
              <TR key={s.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} color={s.avatarColor} size={36} />
                    <div>
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-muted">@{s.username}</p>
                    </div>
                  </div>
                </TD>
                <TD className="tabular text-muted">{s.rollNo}</TD>
                <TD className="text-muted">{s.className}</TD>
                <TD>
                  <Badge tone={s.status === "active" ? "success" : "neutral"} dot>
                    {s.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </TD>
                <TD className="text-muted whitespace-nowrap">{relativeTime(s.lastActive)}</TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title="Edit"
                      onClick={() => navigate(`/teacher/students/${s.id}/edit`)}
                      className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-brand-600"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      title="Reset password"
                      onClick={() => navigate(`/teacher/students/${s.id}/reset-password`)}
                      className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-warning"
                    >
                      <KeyRound className="size-4" />
                    </button>
                    <button
                      title="Deactivate"
                      onClick={() => setDeactivate(s.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-danger"
                    >
                      <UserRoundX className="size-4" />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <p className="text-[13px] text-muted">
            <span className="tabular">{filtered.length}</span> students
          </p>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </Card>

      <ConfirmDialog
        open={deactivate !== null}
        onClose={() => setDeactivate(null)}
        onConfirm={() => toast({ type: "success", title: "Student deactivated", message: "The account was soft-deleted and can be restored." })}
        title="Deactivate this student?"
        tone="danger"
        confirmLabel="Deactivate"
        description="The account will be deactivated (soft-deleted). The student won't be able to log in until reactivated."
      />
    </div>
  );
}
