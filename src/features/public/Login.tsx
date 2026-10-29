import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Info, Lock, School, ShieldCheck, Sparkles, User } from "lucide-react";
import type { Role } from "@/types";
import { useAuth } from "@/lib/auth";
import { Button, Field, Input } from "@/ui";
import { cn } from "@/lib/cn";

export default function Login() {
  const [role, setRole] = useState<Role>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both your identifier and password.");
      return;
    }
    setLoading(true);
    try {
      await login({ username: username.trim(), password, role });
      navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch {
      setError(
        role === "student"
          ? "Invalid roll number, username, or password. Please verify with your teacher."
          : "Invalid teacher credentials. Please check your username/email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-12 bg-canvas">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 lg:col-span-5 lg:flex lg:flex-col justify-between p-12 text-white shadow-lg">
        <div className="login-dot-grid absolute inset-0 opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-xs transition-transform group-hover:scale-105">
              <GraduationCap className="size-5" />
            </span>
            <div className="leading-tight">
              <span className="text-lg font-bold tracking-tight text-white block">Navodaya Prep</span>
              <span className="text-xs text-brand-200">JNVST Examination Portal</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 backdrop-blur-md">
            <Sparkles className="size-3.5 text-amber-300" /> Scholarship Examination Preparation
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug tracking-tight text-white">
            Empowering students with structured digital examination practice.
          </h2>
          <p className="text-sm leading-relaxed text-brand-100">
            A secure school platform providing untimed conceptual practice and realistic 120-minute timed mock tests for the Jawahar Navodaya Vidyalaya Selection Test.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "Official 80-question JNVST syllabus pattern",
              "Instant step-by-step solution rationales",
              "Teacher-supervised accounts & merit rankings",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-xs font-medium text-brand-100">
                <CheckCircle2 className="size-4 text-emerald-300 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/15 pt-6 text-xs text-brand-200 flex items-center justify-between">
          <span>Digital Scholarship Platform</span>
          <span>Class 4 · Entrance Prep</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center lg:col-span-7 px-5 py-12 sm:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to Overview
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <ShieldCheck className="size-4 text-emerald-600" /> Secure Login
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              Sign In to Your Portal
            </h1>
            <p className="text-sm text-muted">
              Select your role below and enter your authorized credentials.
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setRole("student");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                role === "student"
                  ? "bg-white text-brand-700 shadow-xs ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-ink",
              )}
            >
              <GraduationCap className="size-4" />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("teacher");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                role === "teacher"
                  ? "bg-white text-brand-700 shadow-xs ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-ink",
              )}
            >
              <School className="size-4" />
              Teacher Portal
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-xs">
            <Field
              label={role === "teacher" ? "Teacher Username or Email" : "Student Roll Number or Username"}
              hint={role === "teacher" ? "e.g. teacher_sunita" : "e.g. 04 or your school username"}
            >
              <Input
                leftIcon={<User className="size-4" />}
                placeholder={role === "teacher" ? "teacher_sunita or name@school.edu" : "e.g. 04 or student_username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                autoFocus
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                leftIcon={<Lock className="size-4" />}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs leading-relaxed text-rose-800">
                <Info className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              block
              size="lg"
              loading={loading}
              rightIcon={<ArrowRight className="size-4" />}
              className="font-bold shadow-xs mt-2"
            >
              {loading ? "Authenticating…" : role === "student" ? "Sign In as Student" : "Sign In as Teacher"}
            </Button>
          </form>

          {/* Institutional note */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-brand-600" /> Account Management Policy
            </p>
            <p>
              {role === "student"
                ? "Student accounts are centrally provisioned by school teachers to maintain fair exam records. Student self-registration is disabled. If you forgot your password, contact your class teacher."
                : "Teacher and administrator accounts are set up by the school administration. If you require credentials, please consult your exam coordinator."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
