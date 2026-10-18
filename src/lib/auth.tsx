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
  user: User | null;
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

function buildUser(profile: ProfileRow): User {
  if (profile.role === "teacher") {
    return {
      id: profile.id,
      role: "teacher",
      name: profile.full_name,
      username: profile.username,
      avatarColor: profile.avatar_color,
      title: "Class Teacher",
    } satisfies Teacher;
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
  } satisfies Student;
}

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      setUser(buildUser(data as ProfileRow));
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
      // Derive email from username
      // Teachers use their real email; students use rollnumber@jnvst.local
      const email =
        role === "teacher"
          ? username.includes("@")
            ? username
            : `${username}@jnvst.local`
          : `${username}@jnvst.local`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid username or password. Please try again.");
        setLoading(false);
        throw signInError;
      }
      // onAuthStateChange will handle setting the user
    } catch (err) {
      setLoading(false);
      throw err;
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
