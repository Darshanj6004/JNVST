import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  LineChart,
  User,
  Bell,
  Users,
  Database,
  CalendarPlus,
  FileBarChart,
  TriangleAlert,
  Trophy,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const studentNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
      { label: "Practice", to: "/student/practice", icon: Dumbbell },
      { label: "Mock Tests", to: "/student/mock-tests", icon: ClipboardList },
      { label: "Progress", to: "/student/progress", icon: LineChart },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Notifications", to: "/student/notifications", icon: Bell, badge: 3 },
      { label: "Profile", to: "/student/profile", icon: User },
    ],
  },
];

export const teacherNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
      { label: "Students", to: "/teacher/students", icon: Users },
      { label: "Question Bank", to: "/teacher/questions", icon: Database },
      { label: "Schedule Mock", to: "/teacher/mock-tests/new", icon: CalendarPlus },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Reports", to: "/teacher/reports", icon: FileBarChart },
      { label: "Weak Students", to: "/teacher/weak-students", icon: TriangleAlert },
      { label: "Merit List", to: "/teacher/merit-list", icon: Trophy },
    ],
  },
  {
    heading: "System",
    items: [{ label: "Settings", to: "/teacher/settings", icon: Settings }],
  },
];
