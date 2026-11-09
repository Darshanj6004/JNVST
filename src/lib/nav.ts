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
  Layers,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  /** Marathi label (student portal) */
  mr?: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

export interface NavSection {
  heading?: string;
  headingMr?: string;
  items: NavItem[];
}

export const studentNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", mr: "मुख्य पान", to: "/student/dashboard", icon: LayoutDashboard },
      { label: "Practice", mr: "सराव", to: "/student/practice", icon: Dumbbell },
      { label: "Mock Tests", mr: "सराव परीक्षा", to: "/student/mock-tests", icon: ClipboardList },
      { label: "Progress", mr: "माझी प्रगती", to: "/student/progress", icon: LineChart },
    ],
  },
  {
    heading: "Account",
    headingMr: "खाते",
    items: [
      { label: "Notifications", mr: "सूचना", to: "/student/notifications", icon: Bell },
      { label: "Profile", mr: "माझी माहिती", to: "/student/profile", icon: User },
    ],
  },
];

export const teacherNav: NavSection[] = [
  {
    items: [
      { label: "Dashboard", to: "/teacher/dashboard", icon: LayoutDashboard },
      { label: "Students", to: "/teacher/students", icon: Users },
      { label: "Question Bank", to: "/teacher/questions", icon: Database },
      { label: "Practice Sets", to: "/teacher/practice-sets", icon: Layers, end: true },
      { label: "Mock Tests", to: "/teacher/mock-tests", icon: ClipboardList, end: true },
      { label: "Schedule Mock", to: "/teacher/mock-tests/new", icon: CalendarPlus },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Student Activity", to: "/teacher/activity", icon: Activity },
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
