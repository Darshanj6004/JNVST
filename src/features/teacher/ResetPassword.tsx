import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Avatar, Button, Card, CardBody, Field, Input, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";

type StudentRow = {
  id: string;
  full_name: string;
  username: string;
  roll_number: string | null;
  avatar_color: string;
};

export default function ResetPassword() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("Navodaya@123");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("profiles")
      .select("id, full_name, username, roll_number, avatar_color")
      .eq("id", id)
      .eq("role", "student")
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          navigate("/teacher/students");
        } else {
          setStudent(data as StudentRow);
        }
        setLoading(false);
      });
  }, [id, navigate]);

  const reset = async () => {
    if (!student || !password.trim()) return;
    setSaving(true);
    const { error } = await supabase.rpc("reset_student_password", {
      p_student_id: student.id,
      p_new_password: password.trim(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) {
      toast({ type: "error", title: "Reset failed", message: error.message });
    } else {
      toast({ type: "success", title: "Password reset", message: `New password set for ${student.full_name}.` });
      navigate("/teacher/students");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <PageHeader title="Reset password" description="Set a new default password for this student." />

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl bg-canvas p-4">
            <Avatar name={student.full_name} color={student.avatar_color} size={48} />
            <div>
              <p className="text-sm font-semibold text-ink">{student.full_name}</p>
              <p className="text-xs text-muted">@{student.username} · Roll {student.roll_number}</p>
            </div>
          </div>

          <Field label="New password">
            <div className="flex gap-2">
              <Input
                leftIcon={<KeyRound className="size-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="secondary" onClick={() => setPassword("Navodaya@123")} leftIcon={<RefreshCw className="size-4" />}>
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
            <Button onClick={reset} loading={saving} leftIcon={<KeyRound className="size-4" />}>
              Reset password
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
