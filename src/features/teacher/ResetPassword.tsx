import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { Avatar, Button, Card, CardBody, Field, Input, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { getStudentById } from "@/data/users";

export default function ResetPassword() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const student = id ? getStudentById(id) : undefined;
  const [password, setPassword] = useState("navodaya");

  if (!student) return <Navigate to="/teacher/students" replace />;

  const reset = () => {
    toast({ type: "success", title: "Password reset", message: `New password set for ${student.name}.` });
    navigate("/teacher/students");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <PageHeader title="Reset password" description="Set a new default password for this student." />

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl bg-canvas p-4">
            <Avatar name={student.name} color={student.avatarColor} size={48} />
            <div>
              <p className="text-sm font-semibold text-ink">{student.name}</p>
              <p className="text-xs text-muted">@{student.username} · Roll {student.rollNo}</p>
            </div>
          </div>

          <Field label="New default password">
            <div className="flex gap-2">
              <Input
                leftIcon={<KeyRound className="size-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="secondary" onClick={() => setPassword("navodaya")} leftIcon={<RefreshCw className="size-4" />}>
                Reset
              </Button>
            </div>
          </Field>

          <div className="flex items-start gap-2 rounded-xl bg-[var(--color-warning-soft)] p-3.5 text-[13px] text-amber-700">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            The student will use this password at next login. Share it with them securely.
          </div>

          <div className="flex justify-end gap-2">
            <Link to="/teacher/students">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={reset} leftIcon={<KeyRound className="size-4" />}>
              Reset password
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
