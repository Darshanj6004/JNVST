/**
 * Shape of a "previous year paper". Papers are built at runtime from questions
 * in the bank that share the same Source tag (e.g. "JNVST 2024").
 */

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
  /** Short labels shown on the paper card */
  tags: string[];
  /** Short note shown on the card */
  note?: string;
}
