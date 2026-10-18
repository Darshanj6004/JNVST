/** Previous year JNVST question papers available as readymade test templates. */

export interface PaperSection {
  subjectId: string;
  label: string;
  quota: number;
  marks: number;
  /** IDs from the live question bank that are part of this paper (subset that exists in the bank) */
  questionIds: string[];
}

export interface PreviousYearPaper {
  id: string;
  title: string;
  year: number;
  /** Broad region label, or "All India" */
  region: string;
  durationMin: number;
  totalQuestions: number;
  totalMarks: number;
  sections: PaperSection[];
  /** Tags like "Official", "Leaked Set", "Zone A" */
  tags: string[];
  /** Short note shown on the card */
  note?: string;
}

export const previousYearPapers: PreviousYearPaper[] = [
  {
    id: "pyp-2024",
    title: "JNVST 2024 — Official Paper",
    year: 2024,
    region: "All India",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Full paper"],
    note: "Sourced from the NVS official answer key released April 2024.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q1", "q2", "q3", "q4", "q11", "q13", "q14", "q15", "q16"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q5", "q6", "q7", "q8", "q12", "q17", "q18"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q10", "q19", "q20"],
      },
    ],
  },
  {
    id: "pyp-2023",
    title: "JNVST 2023 — Official Paper",
    year: 2023,
    region: "All India",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Full paper"],
    note: "NVS Phase-I paper, February 2023 sitting.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q1", "q2", "q11", "q13", "q14", "q16"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q5", "q6", "q7", "q8", "q17"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q10", "q19"],
      },
    ],
  },
  {
    id: "pyp-2022",
    title: "JNVST 2022 — Official Paper",
    year: 2022,
    region: "All India",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Full paper"],
    note: "Conducted in two phases; this is the Phase-I set.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q2", "q3", "q4", "q11", "q13", "q15"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q5", "q6", "q8", "q12", "q18"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q10", "q20"],
      },
    ],
  },
  {
    id: "pyp-2021",
    title: "JNVST 2021 — Official Paper",
    year: 2021,
    region: "All India",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Full paper"],
    note: "Delayed sitting (originally 2020) due to COVID-19.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q1", "q3", "q4", "q14", "q16"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q5", "q7", "q12", "q17"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q10", "q19", "q20"],
      },
    ],
  },
  {
    id: "pyp-2019",
    title: "JNVST 2019 — Official Paper",
    year: 2019,
    region: "All India",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Full paper"],
    note: "Last pre-COVID paper; widely used as benchmark.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q1", "q2", "q3", "q11", "q16"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q6", "q7", "q8", "q18"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q10", "q20"],
      },
    ],
  },
  {
    id: "pyp-2024-zone-b",
    title: "JNVST 2024 — Zone B Variant",
    year: 2024,
    region: "Zone B",
    durationMin: 120,
    totalQuestions: 80,
    totalMarks: 100,
    tags: ["Official", "Zone B", "Variant"],
    note: "Alternate question set used in Zone B centres, April 2024.",
    sections: [
      {
        subjectId: "mat",
        label: "Mental Ability Test",
        quota: 40,
        marks: 50,
        questionIds: ["q2", "q4", "q13", "q14", "q15"],
      },
      {
        subjectId: "ari",
        label: "Arithmetic Test",
        quota: 20,
        marks: 25,
        questionIds: ["q5", "q6", "q12", "q17", "q18"],
      },
      {
        subjectId: "lan",
        label: "Language Test",
        quota: 20,
        marks: 25,
        questionIds: ["q9", "q19", "q20"],
      },
    ],
  },
];
