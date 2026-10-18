import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabaseClient";

type StudentRow = {
  id: string;
  full_name: string;
  username: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  status: "active" | "inactive";
};

const AVATAR_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#16a34a"];

export default function CreateEditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [loadingData, setLoadingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [className, setClassName] = useState("4th A");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("Navodaya@123");
  const [avatarColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  // Load student data for edit mode
  useEffect(() => {
    if (!id) return;
    supabase
      .from("profiles")
      .select("id, full_name, username, roll_number, class_name, avatar_color, status")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({ type: "error", title: "Student not found", message: "Could not load student details." });
          navigate("/teacher/students");
          return;
        }
        const s = data as StudentRow;
        setName(s.full_name);
        setRollNo(s.roll_number ?? "");
        setClassName(s.class_name ?? "4th A");
        setUsername(s.username);
        setLoadingData(false);
      });
  }, [id, navigate, toast]);

  const genUsername = () => {
    const base = name.trim().toLowerCase().replace(/\s+/g, "_");
    setUsername(`${base}${rollNo ? `_${rollNo.padStart(2, "0")}` : ""}`);
  };

  const save = async () => {
    if (!name.trim() || !rollNo.trim() || !username.trim()) {
      toast({ type: "error", title: "Missing fields", message: "Please fill in name, roll number, and username." });
      return;
    }
    if (!isEdit && !password.trim()) {
      toast({ type: "error", title: "Missing password", message: "Please enter a default password for the student." });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase.rpc("update_student", {
          p_student_id: id,
          p_full_name: name.trim(),
          p_roll_number: rollNo.trim(),
          p_class_name: className,
          p_username: username.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        if (error) throw error;
        toast({ type: "success", title: "Student updated", message: "Account details saved." });
      } else {
        const { error } = await supabase.rpc("create_student", {
          p_full_name: name.trim(),
          p_username: username.trim(),
          p_roll_number: rollNo.trim(),
          p_class_name: className,
          p_password: password.trim(),
          p_avatar_color: avatarColor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        if (error) throw error;
        toast({ type: "success", title: "Student created", message: `Account for ${name.trim()} is ready. Username: ${username.trim()}, Password: ${password.trim()}` });
      }
      navigate("/teacher/students");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ type: "error", title: "Failed to save", message });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back to students
      </Link>

      <PageHeader
        title={isEdit ? "Edit student" : "Create student"}
        description={isEdit ? "Update account details." : "Set up a new student account with login credentials."}
      />

      <Card>
        <CardHeader title="Student details" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-canvas p-4">
            <Avatar name={name || "New Student"} color={avatarColor} size={52} />
            <div>
              <p className="text-sm font-semibold text-ink">{name || "New student"}</p>
              <p className="text-xs text-muted">{username ? `@${username}` : "Username not set"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Patil" />
            </Field>
            <Field label="Roll number">
              <Input value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="e.g. 04" />
            </Field>
            <Field label="Class">
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                <option>4th A</option>
                <option>4th B</option>
              </Select>
            </Field>
            <Field label="Username" hint="Students use this to log in">
              <div className="flex gap-2">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="auto-generated" />
                <Button variant="secondary" onClick={genUsername} leftIcon={<Sparkles className="size-4" />}>
                  Generate
                </Button>
              </div>
            </Field>
          </div>

          {!isEdit && (
            <Field label="Default password" hint="Share this with the student — they can't change it themselves">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Navodaya@123"
              />
            </Field>
          )}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Link to="/teacher/students">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={save} loading={saving} leftIcon={<Save className="size-4" />}>
              {isEdit ? "Save changes" : "Create student"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
