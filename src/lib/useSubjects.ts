import { useCallback, useEffect, useState } from "react";
import type { Subject } from "@/types";
import { subjects as subjectMeta } from "@/data/subjects";
import { codeToLocal, db } from "@/lib/api";

/**
 * JNVST subjects (fixed: Mental Ability, Arithmetic, Language) with their
 * topics loaded from the database. Display metadata (icon, colour, pattern)
 * comes from src/data/subjects.ts; topics and counts are real.
 *
 * Pass `practiceCounts` to get, per topic, how many questions are available
 * for student practice (excludes questions locked in upcoming tests).
 */
export function useSubjects(opts: { practiceCounts?: boolean } = {}) {
  const [subjects, setSubjects] = useState<Subject[]>(() => subjectMeta.map((s) => ({ ...s, topics: [] })));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const counts: Record<string, number> = {};
    if (opts.practiceCounts) {
      const { data } = await db.rpc("get_practice_topics");
      for (const r of (data ?? []) as { subject_code: string; topic_name: string; question_count: number }[]) {
        counts[`${r.subject_code}::${r.topic_name}`] = r.question_count;
      }
    }
    const { data: topics } = await db.from("topics").select("id, name, subjects(code)").order("name");
    const bySubject: Record<string, Subject["topics"]> = {};
    for (const t of (topics ?? []) as { id: string; name: string; subjects: { code: string } | null }[]) {
      const code = t.subjects?.code;
      if (!code) continue;
      const local = codeToLocal[code] ?? code;
      (bySubject[local] ??= []).push({
        id: t.id,
        name: t.name,
        description: "",
        questionCount: counts[`${code}::${t.name}`] ?? 0,
      });
    }
    setSubjects(subjectMeta.map((s) => ({ ...s, topics: bySubject[s.id] ?? [] })));
    setLoading(false);
  }, [opts.practiceCounts]);

  useEffect(() => {
    void load();
  }, [load]);

  return { subjects, loading, reload: load };
}
