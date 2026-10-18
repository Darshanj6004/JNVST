export type Role = "student" | "teacher";

export type Difficulty = "easy" | "medium" | "hard" | "combined";

export interface User {
  id: string;
  role: Role;
  name: string;
  username: string;
  avatarColor: string;
}

export interface Student extends User {
  role: "student";
  rollNo: string;
  className: string;
  status: "active" | "inactive";
  joinedAt: string;
  lastActive: string;
}

export interface Teacher extends User {
  role: "teacher";
  title: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

export interface Subject {
  id: string;
  name: string;
  short: string;
  icon: string;
  accent: string;
  questions: number;
  marks: number;
  duration: number; // minutes (mock section duration)
  topics: Topic[];
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  difficulty: Exclude<Difficulty, "combined">;
  text: string;
  /** Optional image URL shown below the question stem */
  imageUrl?: string;
  options: string[];
  /** Per-option image URLs; index matches options array (undefined = text-only option) */
  optionImages?: (string | undefined)[];
  answer: number; // index into options
  marks: number;
  explanation: string;
  /** How many scheduled mock tests have included this question */
  usedCount: number;
  updatedAt: string;
}

export type MockStatus = "upcoming" | "live" | "completed" | "missed";

export interface MockTest {
  id: string;
  title: string;
  pattern: "JNVST" | "Manual";
  totalQuestions: number;
  totalMarks: number;
  durationMin: number;
  scheduledFor: string;
  status: MockStatus;
  assigned: number;
  attempted: number;
  score?: number; // student's score if completed
}

export interface TopicPerformance {
  topicId: string;
  topic: string;
  subject: string;
  accuracy: number; // 0-100
  attempted: number;
  band: "strong" | "average" | "weak";
}

export interface Attempt {
  id: string;
  kind: "practice" | "mock";
  label: string;
  date: string;
  correct: number;
  total: number;
  score: number;
  percentage: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "test" | "result" | "info" | "alert";
  read: boolean;
}
