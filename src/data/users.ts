import type { Student, Teacher } from "@/types";

export const teacher: Teacher = {
  id: "t1",
  role: "teacher",
  name: "Darshan Jadhav",
  username: "darshanjadhav0203",
  title: "Administrator & Teacher · JNVST Platform",
  avatarColor: "#1d4ed8",
};

export const currentStudent: Student = {
  id: "s1",
  role: "student",
  name: "Aarav Patil",
  username: "aarav_patil_04",
  rollNo: "04",
  className: "4th A",
  status: "active",
  joinedAt: "2026-06-12T09:00:00Z",
  lastActive: "2026-09-08T07:30:00Z",
  avatarColor: "#2563eb",
};

const colors = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#ea580c", "#16a34a", "#4f46e5", "#0d9488"];
const first = [
  "Aarav", "Isha", "Vivaan", "Saanvi", "Reyansh", "Ananya", "Arjun", "Diya", "Kabir", "Myra",
  "Vihaan", "Aadhya", "Sai", "Kiara", "Ayaan", "Anvi", "Krish", "Riya", "Dev", "Prisha",
  "Rudra", "Sara", "Atharv", "Navya", "Yash", "Pihu", "Om", "Aarohi", "Ved", "Ira",
];
const last = ["Patil", "Deshmukh", "Jadhav", "More", "Shinde", "Pawar", "Kulkarni", "Gaikwad", "Sawant", "Chavan"];

export const students: Student[] = first.map((f, i) => {
  const accuracy = 45 + ((i * 7) % 50);
  return {
    id: `s${i + 1}`,
    role: "student" as const,
    name: `${f} ${last[i % last.length]}`,
    username: `${f.toLowerCase()}_${last[i % last.length].toLowerCase()}_${String(i + 1).padStart(2, "0")}`,
    rollNo: String(i + 1).padStart(2, "0"),
    className: i % 2 === 0 ? "4th A" : "4th B",
    status: i === 27 || i === 19 ? "inactive" : "active",
    joinedAt: "2026-06-12T09:00:00Z",
    lastActive: `2026-09-0${(i % 8) + 1}T0${(i % 6) + 2}:15:00Z`,
    avatarColor: colors[i % colors.length],
    _accuracy: accuracy,
  } as Student & { _accuracy: number };
});

export function getStudentById(id: string) {
  return students.find((s) => s.id === id);
}
