import { supabase } from "@/lib/supabaseClient";

/**
 * Untyped Supabase access for tables / RPCs that are not in the generated
 * Database types yet. Keeps the `as any` in one place.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

/** Call an RPC and throw a readable Error on failure. */
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(friendlyError(error.message));
  return data as T;
}

/** Turn raw Postgres / network messages into something a teacher can act on. */
export function friendlyError(msg: string | undefined | null): string {
  if (!msg) return "Something went wrong. Please try again.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "No internet connection. Check the network and try again.";
  if (/JWT expired|invalid JWT/i.test(msg)) return "Your session has expired. Please log in again.";
  if (/could not find the function/i.test(msg))
    return "The database is not fully set up. Ask the administrator to run supabase/production_hardening.sql.";
  if (/violates foreign key constraint/i.test(msg)) return "This item is in use elsewhere and cannot be removed.";
  if (/duplicate key/i.test(msg)) return "An entry with these details already exists.";
  if (/row-level security|permission denied/i.test(msg)) return "You don't have permission to do this.";
  return msg;
}

/** Best-effort: grade attempts whose time ran out (student closed the browser, etc.). */
export async function finalizeExpiredAttempts() {
  try {
    await db.rpc("finalize_expired_attempts");
  } catch {
    /* non-critical */
  }
}

export type SubjectCode = "mental_ability" | "arithmetic" | "language";

export const SUBJECT_LABELS: Record<string, string> = {
  mental_ability: "Mental Ability",
  arithmetic: "Arithmetic",
  language: "Language",
};

/** Local short ids used by the UI subject metadata (src/data/subjects.ts). */
export const codeToLocal: Record<string, string> = { mental_ability: "mat", arithmetic: "ari", language: "lan" };
export const localToCode: Record<string, string> = { mat: "mental_ability", ari: "arithmetic", lan: "language" };

export interface AppSettings {
  school_name: string;
  school_address: string;
  strong_threshold: number;
  weak_threshold: number;
  default_duration_minutes: number;
  idle_logout_minutes: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  school_name: "Z.P.P. School, Kasare",
  school_address: "Tal. Sangamner, Dist. Ahilyanagar, Maharashtra",
  strong_threshold: 75,
  weak_threshold: 50,
  default_duration_minutes: 120,
  idle_logout_minutes: 30,
};

export async function loadSettings(): Promise<AppSettings> {
  const { data } = await db.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export interface TopicStat {
  mock_test_id: string;
  subject_code: string;
  subject_name: string;
  topic_name: string;
  total: number;
  correct: number;
  attempted: number;
  marks_earned: number;
  marks_total: number;
}

export interface StudentSummary {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  tests_taken: number;
  avg_pct: number | null;
  best_pct: number | null;
  last_pct: number | null;
  last_submitted_at: string | null;
  practice_sessions: number;
}

export interface TestSummary {
  mock_test_id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  total_marks: number;
  total_questions: number;
  attempts: number;
  avg_pct: number | null;
  max_pct: number | null;
  min_pct: number | null;
}

/**
 * Load every row of a table/view. Supabase returns at most 1000 rows per
 * request, so this pages through the results with .range().
 */
export async function fetchAll<T>(
  table: string,
  select = "*",
  order: { column: string; ascending?: boolean } = { column: "id" },
): Promise<{ data: T[]; error: string | null }> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select(select)
      .order(order.column, { ascending: order.ascending ?? true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { data: out, error: friendlyError(error.message) };
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return { data: out, error: null };
}

export interface ActivityRow {
  student_id: string;
  full_name: string;
  roll_number: string | null;
  class_name: string | null;
  avatar_color: string;
  last_seen_at: string | null;
  practice_total: number;
  practice_7d: number;
  practice_30d: number;
  practice_days_14: number;
  last_practice_at: string | null;
  practice_accuracy: number | null;
  sets_done: number;
  tests_taken: number;
  avg_test_pct: number | null;
  last_test_at: string | null;
}

export type Regularity = "regular" | "occasional" | "inactive";

/** Practice regularity from the number of practice days in the last 14 days. */
export function regularity(practiceDays14: number): Regularity {
  if (practiceDays14 >= 6) return "regular";
  if (practiceDays14 >= 2) return "occasional";
  return "inactive";
}

export const REGULARITY_META: Record<Regularity, { label: string; tone: "success" | "warning" | "danger"; hint: string }> = {
  regular: { label: "Regular", tone: "success", hint: "practised on 6+ of the last 14 days" },
  occasional: { label: "Occasional", tone: "warning", hint: "practised on 2–5 of the last 14 days" },
  inactive: { label: "Not practising", tone: "danger", hint: "practised on 0–1 of the last 14 days" },
};

/** "3 days ago", "today", "—" */
export function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
