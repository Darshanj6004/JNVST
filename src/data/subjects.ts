import type { Subject } from "@/types";

export const subjects: Subject[] = [
  {
    id: "mat",
    name: "Mental Ability Test",
    short: "Mental Ability",
    icon: "brain",
    accent: "#2563eb",
    questions: 40,
    marks: 50,
    duration: 60,
    topics: [
      { id: "analogy", name: "Analogy", description: "Identifying relationships between pairs", questionCount: 48 },
      { id: "classification", name: "Classification", description: "Odd-one-out identification", questionCount: 36 },
      { id: "series", name: "Series", description: "Number, letter & figure series completion", questionCount: 52 },
      { id: "pattern", name: "Pattern Recognition", description: "Identifying visual patterns", questionCount: 40 },
      { id: "visual", name: "Visual Reasoning", description: "Spatial and figure-based reasoning", questionCount: 34 },
      { id: "coding", name: "Coding–Decoding", description: "Letter/number substitution patterns", questionCount: 44 },
      { id: "mirror", name: "Mirror & Water Images", description: "Reflection-based questions", questionCount: 28 },
      { id: "embedded", name: "Embedded Figures", description: "Finding figures within complex shapes", questionCount: 22 },
    ],
  },
  {
    id: "ari",
    name: "Arithmetic Test",
    short: "Arithmetic",
    icon: "calculator",
    accent: "#7c3aed",
    questions: 20,
    marks: 25,
    duration: 30,
    topics: [
      { id: "numsys", name: "Number System", description: "Place value, comparison, ordering", questionCount: 42 },
      { id: "addition", name: "Addition", description: "Single and multi-digit addition", questionCount: 30 },
      { id: "subtraction", name: "Subtraction", description: "Single and multi-digit subtraction", questionCount: 28 },
      { id: "multiplication", name: "Multiplication", description: "Tables and multi-digit multiplication", questionCount: 34 },
      { id: "division", name: "Division", description: "Simple and long division", questionCount: 26 },
      { id: "fractions", name: "Fractions", description: "Comparison and operations on fractions", questionCount: 24 },
      { id: "geometry", name: "Geometry", description: "Basic shapes, perimeter, area", questionCount: 20 },
      { id: "measurement", name: "Measurement", description: "Length, weight, capacity, time", questionCount: 22 },
      { id: "data", name: "Data Interpretation", description: "Reading simple tables and charts", questionCount: 18 },
    ],
  },
  {
    id: "lan",
    name: "Language Test",
    short: "Language",
    icon: "languages",
    accent: "#0891b2",
    questions: 20,
    marks: 25,
    duration: 30,
    topics: [
      { id: "comprehension", name: "Reading Comprehension", description: "Understanding short passages", questionCount: 30 },
      { id: "grammar", name: "Grammar", description: "Sentence structure and usage", questionCount: 26 },
      { id: "vocab", name: "Vocabulary", description: "Word meanings and synonyms", questionCount: 24 },
      { id: "spelling", name: "Spelling", description: "Correct spelling identification", questionCount: 18 },
    ],
  },
];

export const difficulties = [
  { id: "easy", code: "L1", name: "Easy", description: "Foundational questions testing basic understanding" },
  { id: "medium", code: "L2", name: "Medium", description: "Intermediate questions requiring application" },
  { id: "hard", code: "L3", name: "Hard", description: "Advanced questions requiring analysis and reasoning" },
  { id: "combined", code: "ALL", name: "Combined", description: "A mixed set drawn proportionally from L1, L2 and L3" },
] as const;

export function getSubject(id: string) {
  return subjects.find((s) => s.id === id);
}
export function getTopic(subjectId: string, topicId: string) {
  return getSubject(subjectId)?.topics.find((t) => t.id === topicId);
}
