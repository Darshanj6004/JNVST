import type { Notification } from "@/types";

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "New mock test scheduled",
    body: "JNVST Full Mock #4 is scheduled for 10 Sep, 10:00 AM. Be ready 10 minutes early.",
    time: "2026-09-08T06:30:00Z",
    type: "test",
    read: false,
  },
  {
    id: "n2",
    title: "Result published",
    body: "Your result for JNVST Full Mock #3 is out — you scored 78/100. Great improvement!",
    time: "2026-09-01T13:00:00Z",
    type: "result",
    read: false,
  },
  {
    id: "n3",
    title: "Keep an eye on Fractions",
    body: "Your accuracy in Fractions dropped below 50%. Try a focused practice set.",
    time: "2026-08-30T09:15:00Z",
    type: "alert",
    read: false,
  },
  {
    id: "n4",
    title: "Practice streak: 5 days",
    body: "You practised 5 days in a row. Consistency is the key to cracking JNVST.",
    time: "2026-08-28T18:40:00Z",
    type: "info",
    read: true,
  },
];
