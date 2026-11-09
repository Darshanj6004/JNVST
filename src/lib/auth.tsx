import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Role, Student, Teacher, User } from "@/types";

// ── Types ────────────────────────────────────────────────────
interface AuthState {
  user: Student | Teacher | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  login: (credentials: { username: string; password: string; role: Role }) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// ── Context ──────────────────────────────────────────────────
const AuthCtx = createContext<AuthState | null>(null);

// ── Helper: Build app User from profile row ──────────────────
type ProfileRow = {
  id: string;
  role: "teacher" | "student";
  full_name: string;
  username: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  status: "active" | "inactive";
  created_at: string;
};

function buildUser(profile: ProfileRow): Student | Teacher {
  if (profile.role === "teacher") {
    return {
      id: profile.id,
      role: "teacher",
      name: profile.full_name,
      username: profile.username,
      avatarColor: profile.avatar_color,
      title: "Class Teacher",
    };
  }
  return {
    id: profile.id,
    role: "student",
    name: profile.full_name,
    username: profile.username,
    avatarColor: profile.avatar_color,
    rollNo: profile.roll_number ?? "",
    className: profile.class_name ?? "4th A",
    status: profile.status,
    joinedAt: profile.created_at,
    lastActive: new Date().toISOString(),
  };
}

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | Teacher | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      const profile = data as ProfileRow;
      if (profile.status === "inactive") {
        setError("This account has been deactivated. Please contact your teacher.");
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(buildUser(profile));
      // Record activity for the teacher's "last seen" (throttled on the server).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (supabase.rpc as any)("touch_last_seen").then(() => undefined, () => undefined);
    } else {
      console.error("Failed to fetch profile:", error?.message);
    }
    setLoading(false);
  }

  const login = async ({
    username,
    password,
    role,
  }: {
    username: string;
    password: string;
    role: Role;
  }) => {
    setError(null);
    setLoading(true);
    try {
      let email = username.trim();

      if (!email.includes("@")) {
        if (role === "teacher") {
          // Look up teacher's email via RPC (SECURITY DEFINER can read auth.users)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: emailData, error: lookupErr } = await (supabase.rpc as any)(
            "get_teacher_email_by_username",
            { p_username: email }
          );

          if (lookupErr || !emailData) {
            throw new Error("Teacher not found. Check your username or use your email address.");
          }
          email = emailData as string;
        } else {
          // Student: look up by username or roll number (RPC works before sign-in)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: studentEmail, error: sErr } = await (supabase.rpc as any)("get_student_email", {
            p_login: email,
          });
          if (sErr || !studentEmail) {
            throw new Error(
              sErr && /could not find the function/i.test(sErr.message)
                ? "Login is not set up yet. Ask your teacher to finish the database setup."
                : "Student not found. Check your roll number or username.",
            );
          }
          email = studentEmail as string;
        }
      }

      const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signIn.user) {
        throw new Error(
          /fetch|network/i.test(signInError?.message ?? "")
            ? "No internet connection. Check the network and try again."
            : "Invalid username or password. Please try again.",
        );
      }

      // Verify account status and that the right portal was chosen.
      const { data: prof } = await supabase.from("profiles").select("role, status").eq("id", signIn.user.id).single();
      const p = prof as { role: Role; status: string } | null;
      if (!p) {
        await supabase.auth.signOut();
        throw new Error("Account profile is missing. Please contact your teacher.");
      }
      if (p.status === "inactive") {
        await supabase.auth.signOut();
        throw new Error("This account has been deactivated. Please contact your teacher.");
      }
      if (p.role !== role) {
        await supabase.auth.signOut();
        throw new Error(
          p.role === "teacher"
            ? "This is a teacher account. Please choose the Teacher tab."
            : "This is a student account. Please choose the Student tab.",
        );
      }
      // onAuthStateChange will handle setting the user
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
      setLoading(false);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
    setLoading(false);
  };

  // Auto-logout after inactivity (shared school computers). Never during an exam.
  useEffect(() => {
    if (!user) return;
    let limitMs = 30 * 60 * 1000;
    let last = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("app_settings")
      .select("idle_logout_minutes")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }: { data: { idle_logout_minutes: number } | null }) => {
        if (data?.idle_logout_minutes) limitMs = data.idle_logout_minutes * 60 * 1000;
      });
    const bump = () => {
      last = Date.now();
    };
    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = window.setInterval(() => {
      if (window.location.pathname.startsWith("/student/exam/")) {
        last = Date.now();
        return;
      }
      if (Date.now() - last > limitMs) {
        void supabase.auth.signOut().then(() => {
          setUser(null);
          window.location.assign("/login");
        });
      }
    }, 30000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(t);
    };
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({ user, supabaseUser, session, loading, error, login, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, supabaseUser, session, loading, error]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
