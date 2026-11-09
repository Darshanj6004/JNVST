// Build the JNVST question bank (all Marathi).
//   npm run qbank
// Outputs:
//   public/qbank/mat/<id>.svg              figures for Mental Ability questions
//   supabase/question_bank/NN_*.sql        seed files — run them in order in the Supabase SQL editor
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { makeRng } from "./lib.mjs";
import { buildMental, MAT_SECTIONS } from "./figures.mjs";
import { buildArithmetic, ARITH_TOPICS } from "./arithmetic.mjs";
import { buildLanguage, LANG_TOPICS, PASSAGE_COUNT } from "./language.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const rng = makeRng(20261110);

const MAT_PER_SECTION = 90; // 30 easy + 30 medium + 30 hard
const ARI_PER_TOPIC = 60; // 20 easy + 20 medium + 20 hard
const PAPER_COUNT = 20;
const LEVELS = ["easy", "medium", "hard"];
const DEV = "०१२३४५६७८९";
const mrNum = (n) => String(n).replace(/[0-9]/g, (d) => DEV[d]);

const mental = buildMental(rng, MAT_PER_SECTION);
const arith = buildArithmetic(rng, ARI_PER_TOPIC);
const lang = buildLanguage(rng);

// ── Ready-made tests: JNVST pattern, 40 MAT + 20 Arithmetic + 20 Language ──
// Every question belongs to at most one ready-made test, so no test repeats another.
const PAPERS = Array.from({ length: PAPER_COUNT }, (_, i) => `सराव प्रश्नपत्रिका ${mrNum(i + 1)} (JNVST नमुना)`);

// MAT: 4 per section per paper (consecutive items cycle easy/medium/hard → mixed levels)
for (const [section] of MAT_SECTIONS) {
  const list = mental.filter((x) => x.topic === section);
  PAPERS.forEach((paper, p) => list.slice(p * 4, p * 4 + 4).forEach((x) => (x.source = paper)));
}
// Arithmetic: one question from every topic (17) + 3 extra = 20; levels rotate per paper
{
  const extra = 20 - ARITH_TOPICS.length;
  const pools = Object.fromEntries(
    ARITH_TOPICS.map((t) => [t, Object.fromEntries(LEVELS.map((l) => [l, arith.filter((x) => x.topic === t && x.difficulty === l)]))]),
  );
  PAPERS.forEach((paper, p) => {
    ARITH_TOPICS.forEach((t, ti) => {
      const picks = ti < extra ? [0, 1] : [0];
      for (const k of picks) {
        const lv = LEVELS[(p + ti + k) % 3];
        const q = pools[t][lv].shift();
        if (!q) throw new Error(`not enough ${lv} questions in ${t} for ${paper}`);
        q.source = paper;
      }
    });
  });
}
// Language: 4 passages per paper, dealt from a level-sorted list so each paper gets a mix
{
  const passages = [...new Set(lang.map((x) => x.passage))];
  const levelOf = (pi) => lang.find((x) => x.passage === pi).difficulty;
  passages.sort((a, b) => LEVELS.indexOf(levelOf(a)) - LEVELS.indexOf(levelOf(b)) || a - b);
  passages.forEach((pi, k) => {
    if (k >= PAPER_COUNT * 4) return;
    const paper = PAPERS[k % PAPER_COUNT];
    lang.filter((x) => x.passage === pi).forEach((x) => (x.source = paper));
  });
}

const all = [...mental, ...arith, ...lang];

// ── validation ──
const errors = [];
const ids = new Set();
for (const q of all) {
  if (ids.has(q.id)) errors.push(`duplicate id ${q.key}`);
  ids.add(q.id);
  if (q.options.length !== 4 || new Set(q.options).size !== 4) errors.push(`options not 4 distinct: ${q.key}`);
  if (!"ABCD".includes(q.correct)) errors.push(`bad correct: ${q.key}`);
  if (!q.text || !q.topic || !LEVELS.includes(q.difficulty)) errors.push(`missing fields: ${q.key}`);
  for (const s of [q.text, q.explanation, ...q.options]) if (s.includes("$qb$")) errors.push(`dollar quote clash ${q.key}`);
}
const texts = new Map();
for (const q of all) {
  if (q.subject === "mental_ability") continue;
  const sig = q.text + "|" + [...q.options].sort().join("|");
  if (texts.has(sig)) errors.push(`duplicate question ${q.key} = ${texts.get(sig)}`);
  texts.set(sig, q.key);
}
for (const p of PAPERS) {
  const n = (sub) => all.filter((q) => q.source === p && q.subject === sub).length;
  if (n("mental_ability") !== 40 || n("arithmetic") !== 20 || n("language") !== 20)
    errors.push(`${p}: ${n("mental_ability")}/${n("arithmetic")}/${n("language")}`);
}
const topicsBySubject = {
  mental_ability: MAT_SECTIONS.map(([s]) => s),
  arithmetic: ARITH_TOPICS,
  language: Object.values(LANG_TOPICS),
};
for (const [sub, names] of Object.entries(topicsBySubject))
  for (const t of names)
    for (const lv of LEVELS)
      if (!all.some((q) => q.subject === sub && q.topic === t && q.difficulty === lv))
        errors.push(`no ${lv} question in ${sub} / ${t}`);
if (errors.length) {
  console.error(errors.slice(0, 40).join("\n"));
  process.exit(1);
}

// ── write SVGs ──
const svgDir = join(root, "public", "qbank", "mat");
rmSync(svgDir, { recursive: true, force: true });
mkdirSync(svgDir, { recursive: true });
for (const q of mental) {
  writeFileSync(join(svgDir, `${q.id}.svg`), q.svg);
  q.image = `/qbank/mat/${q.id}.svg`;
}

// ── write SQL (split into files small enough for the Supabase SQL editor) ──
const outDir = join(root, "supabase", "question_bank");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const lit = (s) => (s == null ? "null" : `$qb$${s}$qb$`);
const files = [];
const header = (title) => `-- ================================================================
-- JNVST QUESTION BANK — ${title}
-- Generated by scripts/question-bank/build.mjs (npm run qbank). Do not edit by hand.
-- Run ALL files in this folder in order (01, 02, 03 …) in the Supabase SQL editor.
-- Safe to run again: questions are updated in place.
-- ================================================================
`;

// 01: setup + topics
let setup = header("01 setup and topics") + `begin;
alter table public.questions add column if not exists seed_key text;
create unique index if not exists idx_questions_seed_key on public.questions(seed_key);
`;
for (const [code, names] of Object.entries(topicsBySubject)) {
  for (const t of names) {
    setup += `insert into public.topics (subject_id, name)
select s.id, ${lit(t)} from public.subjects s
where s.code = '${code}' and not exists (select 1 from public.topics x where x.subject_id = s.id and lower(x.name) = lower(${lit(t)}));
`;
  }
}
setup += "commit;\n";
files.push(["01_setup_and_topics.sql", setup]);

// 02…: questions in chunks of ≤ 450 KB
const row = (q) =>
  `(${[`'${q.id}'`, `'${q.key}'`, `'${q.subject}'`, lit(q.topic), `'${q.difficulty}'`, lit(q.text), ...q.options.map(lit), `'${q.correct}'`, lit(q.explanation), lit(q.image ?? null), lit(q.source ?? null)].join(", ")})`;
const chunkSql = (title, rows) => header(title) + `begin;
create temporary table _qb (
  id uuid, seed_key text, subject_code text, topic_name text, difficulty text, question_text text,
  option_a text, option_b text, option_c text, option_d text, correct_option text,
  explanation text, image_url text, source text
) on commit drop;

insert into _qb values
${rows.join(",\n")};

insert into public.questions (id, seed_key, subject_id, topic_id, difficulty, question_text, option_a, option_b, option_c, option_d,
  correct_option, explanation, image_url, marks, source)
select b.id, b.seed_key, s.id, t.id, b.difficulty, b.question_text, b.option_a, b.option_b, b.option_c, b.option_d,
       b.correct_option, b.explanation, b.image_url, 1.25, b.source
from _qb b
join public.subjects s on s.code = b.subject_code
join public.topics t on t.subject_id = s.id and lower(t.name) = lower(b.topic_name)
on conflict (id) do update set
  seed_key = excluded.seed_key, topic_id = excluded.topic_id, difficulty = excluded.difficulty,
  question_text = excluded.question_text, option_a = excluded.option_a, option_b = excluded.option_b,
  option_c = excluded.option_c, option_d = excluded.option_d, correct_option = excluded.correct_option,
  explanation = excluded.explanation, image_url = excluded.image_url, source = excluded.source, updated_at = now();
commit;
`;
const LIMIT = 450 * 1024;
const groups = [["mental_ability", mental], ["arithmetic", arith], ["language", lang]];
let n = 2;
for (const [name, qs] of groups) {
  let cur = [], size = 0, part = 1;
  const flush = () => {
    if (!cur.length) return;
    const fname = `${String(n).padStart(2, "0")}_${name}_${part}.sql`;
    files.push([fname, chunkSql(`${fname} (${cur.length} questions)`, cur)]);
    n++; part++; cur = []; size = 0;
  };
  for (const q of qs) {
    const r = row(q);
    const bytes = Buffer.byteLength(r);
    if (size + bytes > LIMIT) flush();
    cur.push(r);
    size += bytes;
  }
  flush();
}

// last: cleanup + summary
const v1Ids = readFileSync(join(here, "v1-ids.txt"), "utf8").split(/\s+/).filter(Boolean).filter((id) => !ids.has(id));
const last = `${String(n).padStart(2, "0")}_cleanup_and_summary.sql`;
const cleanup = header(`${last} — run LAST`) + `begin;
-- Remove generated questions that are no longer part of the bank (older versions),
-- unless students already answered them or they are used in a mock test.
create temporary table _keep (id uuid primary key) on commit drop;
insert into _keep values
${[...ids].map((id) => `('${id}')`).join(",\n")};

delete from public.questions q
where ((q.seed_key is not null and not exists (select 1 from _keep k where k.id = q.id))
       or q.id in (${v1Ids.map((id) => `'${id}'`).join(", ")}))
  and not exists (select 1 from public.exam_answers a where a.question_id = q.id)
  and not exists (select 1 from public.mock_test_questions m where m.question_id = q.id);

-- Topics follow the official JNVST syllabus. Remove topics left without questions.
delete from public.topics t
where not exists (select 1 from public.questions q where q.topic_id = t.id);
commit;

-- Summary: questions per topic and level
select s.name as subject, t.name as topic,
       count(q.id) filter (where q.difficulty = 'easy') as easy,
       count(q.id) filter (where q.difficulty = 'medium') as medium,
       count(q.id) filter (where q.difficulty = 'hard') as hard,
       count(q.id) as total
from public.topics t join public.subjects s on s.id = t.subject_id
left join public.questions q on q.topic_id = t.id
group by s.name, t.name order by s.name, t.name;
`;
files.push([last, cleanup]);

let readme = `JNVST question bank — ${all.length} questions (all in Marathi), ${PAPER_COUNT} ready-made tests.

Run these files IN ORDER in Supabase → SQL Editor (open each file, paste, Run):
`;
for (const [f, sql] of files) {
  writeFileSync(join(outDir, f), sql);
  readme += `  ${f}  (${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB)\n`;
}
readme += `
Or, with psql:  for f in supabase/question_bank/*.sql; do psql "$DATABASE_URL" -f "$f"; done
All files are safe to run again.
`;
writeFileSync(join(outDir, "README.txt"), readme);

const by = (k) => Object.entries(all.reduce((m, q) => ((m[q[k]] = (m[q[k]] ?? 0) + 1), m), {}));
console.log(`questions: ${all.length}  (passages: ${PASSAGE_COUNT})`);
console.log("by subject:", JSON.stringify(by("subject")));
console.log("by difficulty:", JSON.stringify(by("difficulty")));
console.log("correct letters:", JSON.stringify(by("correct")));
console.log(`ready-made tests: ${PAPERS.length}`);
console.log(readme);
