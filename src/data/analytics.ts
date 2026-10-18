import type { Attempt, TopicPerformance } from "@/types";

export const scoreHistory = [
  { label: "Jul W1", score: 54, average: 58 },
  { label: "Jul W3", score: 61, average: 60 },
  { label: "Aug W1", score: 66, average: 62 },
  { label: "Aug W2", score: 71, average: 64 },
  { label: "Aug W4", score: 74, average: 66 },
  { label: "Sep W1", score: 78, average: 68 },
];

export const subjectAccuracy = [
  { subject: "Mental Ability", accuracy: 82, attempted: 210 },
  { subject: "Arithmetic", accuracy: 68, attempted: 164 },
  { subject: "Language", accuracy: 57, attempted: 96 },
];

export const topicPerformance: TopicPerformance[] = [
  { topicId: "series", topic: "Series", subject: "Mental Ability", accuracy: 88, attempted: 40, band: "strong" },
  { topicId: "analogy", topic: "Analogy", subject: "Mental Ability", accuracy: 84, attempted: 36, band: "strong" },
  { topicId: "classification", topic: "Classification", subject: "Mental Ability", accuracy: 79, attempted: 28, band: "strong" },
  { topicId: "multiplication", topic: "Multiplication", subject: "Arithmetic", accuracy: 72, attempted: 30, band: "average" },
  { topicId: "numsys", topic: "Number System", subject: "Arithmetic", accuracy: 66, attempted: 34, band: "average" },
  { topicId: "coding", topic: "Coding–Decoding", subject: "Mental Ability", accuracy: 61, attempted: 24, band: "average" },
  { topicId: "fractions", topic: "Fractions", subject: "Arithmetic", accuracy: 48, attempted: 26, band: "weak" },
  { topicId: "grammar", topic: "Grammar", subject: "Language", accuracy: 44, attempted: 22, band: "weak" },
  { topicId: "geometry", topic: "Geometry", subject: "Arithmetic", accuracy: 39, attempted: 18, band: "weak" },
];

export const attempts: Attempt[] = [
  { id: "a1", kind: "mock", label: "JNVST Full Mock #3", date: "2026-09-01T10:00:00Z", correct: 62, total: 80, score: 78, percentage: 78 },
  { id: "a2", kind: "practice", label: "Series · Combined", date: "2026-08-30T15:20:00Z", correct: 9, total: 10, score: 11.25, percentage: 90 },
  { id: "a3", kind: "practice", label: "Fractions · Medium", date: "2026-08-29T16:00:00Z", correct: 4, total: 8, score: 5, percentage: 50 },
  { id: "a4", kind: "mock", label: "Arithmetic Booster Test", date: "2026-08-25T10:00:00Z", correct: 17, total: 20, score: 21, percentage: 85 },
  { id: "a5", kind: "practice", label: "Grammar · Easy", date: "2026-08-22T14:10:00Z", correct: 6, total: 10, score: 7.5, percentage: 60 },
];
