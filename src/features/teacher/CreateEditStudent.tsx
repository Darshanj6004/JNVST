import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCw, Save, Sparkles } from "lucide-react";
import { Avatar, Button, Card, CardBody, CardHeader, Field, Input, Select, useToast } from "@/ui";
import { PageHeader } from "@/components/PageHeader";
import { getStudentById } from "@/data/users";

export default function CreateEditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const existing = id ? getStudentById(id) : undefined;
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [rollNo, setRollNo] = useState(existing?.rollNo ?? "");
  const [className, setClassName] = useState(existing?.className ?? "4th A");
  const [username, setUsername] = useState(existing?.username ?? "");
  const [password, setPassword] = useState(isEdit ? "" : "navodaya");

  const genUsername = () => {
    const base = name.trim().toLowerCase().replace(/\s+/g, "_");
    setUsername(`${base}${rollNo ? `_${rollNo}` : ""}`);
  };

  const save = () => {
    toast({
      type: "success",
      title: isEdit ? "Student updated" : "Student created",
      message: isEdit ? "Account details saved." : `Account for ${name || "student"} is ready.`,
    });
    navigate("/teacher/students");
  };

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
            <Avatar name={name || "New Student"} color={existing?.avatarColor ?? "#2563eb"} size={52} />
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
            <Field label="Username" hint="Must be unique">
              <div className="flex gap-2">
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="auto-generated" />
                <Button variant="secondary" onClick={genUsername} leftIcon={<Sparkles className="size-4" />}>
                  Generate
                </Button>
              </div>
            </Field>
          </div>

          <Field label={isEdit ? "Reset default password" : "Default password"} hint="Shared with the student">
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a default password" />
              <Button variant="secondary" onClick={() => setPassword("navodaya")} leftIcon={<RefreshCw className="size-4" />}>
                Default
              </Button>
            </div>
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Link to="/teacher/students">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button onClick={save} leftIcon={<Save className="size-4" />}>
          {isEdit ? "Save changes" : "Create student"}
        </Button>
      </div>
    </div>
  );
}
