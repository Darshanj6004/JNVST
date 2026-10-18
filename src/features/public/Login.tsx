import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, GraduationCap, Info, Lock, User } from "lucide-react";
import type { Role } from "@/types";
import { useAuth } from "@/lib/auth";
import { Button, Field, Input } from "@/ui";
import { cn } from "@/lib/cn";

const demo: Record<Role, { username: string; password: string }> = {
  student: { username: "aarav_patil_04", password: "navodaya" },
  teacher: { username: "darshanjadhav0203", password: "navodaya" },
};

export default function Login() {
  const [role, setRole] = useState<Role>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login(role);
      navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }, 550);
  };

  const fillDemo = () => {
    setUsername(demo[role].username);
    setPassword(demo[role].password);
    setError("");
  };

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 lg:block">
        <div className="login-dot-grid absolute inset-0 opacity-20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Navodaya Prep</span>
          </Link>
          <div>
            <blockquote className="text-2xl font-medium leading-snug tracking-tight">
              “Every mock test we ran digitally saved hours of paper checking — and the children could finally see
              their own progress.”
            </blockquote>
            <p className="mt-5 text-sm text-brand-100">Darshan Jadhav · Platform Administrator, Z.P.P. School Kasare</p>
          </div>
          <div className="flex gap-8">
            {[
              ["30+", "Students"],
              ["80", "Questions / mock"],
              ["120", "Minute exams"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-semibold tabular">{n}</p>
                <p className="text-xs text-brand-100">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-canvas px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Navodaya Prep</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted">Sign in to continue your JNVST preparation.</p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(["student", "teacher"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError("");
                }}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium capitalize transition-all",
                  role === r ? "bg-white text-ink shadow-[var(--shadow-xs)]" : "text-muted hover:text-ink",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Username">
              <Input
                leftIcon={<User className="size-4" />}
                placeholder={role === "teacher" ? "teacher_username" : "student_username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                leftIcon={<Lock className="size-4" />}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-[13px] text-red-700">
                <Info className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" block size="lg" loading={loading} rightIcon={<ArrowRight className="size-4" />}>
              Sign in
            </Button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-4 w-full rounded-lg border border-dashed border-line py-2.5 text-[13px] font-medium text-muted transition-colors hover:border-brand-300 hover:text-brand-600"
          >
            Use demo {role} credentials
          </button>

          <p className="mt-6 text-center text-[13px] text-muted">
            {role === "student"
              ? "Students can't self-register — ask your teacher for credentials."
              : "Teacher accounts are provisioned by the school administrator."}
          </p>
        </div>
      </div>
    </div>
  );
}
