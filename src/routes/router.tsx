import { createBrowserRouter } from "react-router";

import Welcome from "@/features/public/Welcome";
import Login from "@/features/public/Login";
import NotFound from "@/features/public/NotFound";
import ShowcasePage from "@/features/design-system/ShowcasePage";

import StudentLayout from "@/layouts/StudentLayout";
import TeacherLayout from "@/layouts/TeacherLayout";
import { RequireRole } from "@/routes/guards";

import StudentDashboard from "@/features/student/Dashboard";
import Practice from "@/features/student/Practice";
import MockTests from "@/features/student/MockTests";
import Instructions from "@/features/student/Instructions";
import LiveExam from "@/features/student/LiveExam";
import Result from "@/features/student/Result";
import Progress from "@/features/student/Progress";
import Profile from "@/features/student/Profile";
import Notifications from "@/features/student/Notifications";

import TeacherDashboard from "@/features/teacher/Dashboard";
import StudentManagement from "@/features/teacher/StudentManagement";
import CreateEditStudent from "@/features/teacher/CreateEditStudent";
import ResetPassword from "@/features/teacher/ResetPassword";
import QuestionBank from "@/features/teacher/QuestionBank";
import AddEditQuestion from "@/features/teacher/AddEditQuestion";
import ExcelImport from "@/features/teacher/ExcelImport";
import CreatePracticeSet from "@/features/teacher/CreatePracticeSet";
import CreateScheduleMock from "@/features/teacher/CreateScheduleMock";
import Reports from "@/features/teacher/Reports";
import WeakStudents from "@/features/teacher/WeakStudents";
import MeritList from "@/features/teacher/MeritList";
import Settings from "@/features/teacher/Settings";
import MockTestManagement from "@/features/teacher/MockTestManagement";

export const router = createBrowserRouter([
  { path: "/", Component: Welcome },
  { path: "/login", Component: Login },
  ...(import.meta.env.DEV ? [{ path: "/design-system", Component: ShowcasePage }] : []),

  {
    path: "/student/exam/:id",
    element: (
      <RequireRole role="student">
        <LiveExam />
      </RequireRole>
    ),
  },
  {
    path: "/student",
    Component: StudentLayout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: "dashboard", Component: StudentDashboard },
      { path: "practice", Component: Practice },
      { path: "mock-tests", Component: MockTests },
      { path: "mock-tests/:id/instructions", Component: Instructions },
      { path: "result/:id", Component: Result },
      { path: "progress", Component: Progress },
      { path: "notifications", Component: Notifications },
      { path: "profile", Component: Profile },
    ],
  },

  {
    path: "/teacher",
    Component: TeacherLayout,
    children: [
      { index: true, Component: TeacherDashboard },
      { path: "dashboard", Component: TeacherDashboard },
      { path: "students", Component: StudentManagement },
      { path: "students/new", Component: CreateEditStudent },
      { path: "students/:id/edit", Component: CreateEditStudent },
      { path: "students/:id/reset-password", Component: ResetPassword },
      { path: "questions", Component: QuestionBank },
      { path: "questions/new", Component: AddEditQuestion },
      { path: "questions/:id/edit", Component: AddEditQuestion },
      { path: "questions/import", Component: ExcelImport },
      { path: "practice-sets/new", Component: CreatePracticeSet },
      { path: "mock-tests", Component: MockTestManagement },
      { path: "mock-tests/new", Component: CreateScheduleMock },
      { path: "reports", Component: Reports },
      { path: "weak-students", Component: WeakStudents },
      { path: "merit-list", Component: MeritList },
      { path: "settings", Component: Settings },
    ],
  },

  { path: "*", Component: NotFound },
]);
