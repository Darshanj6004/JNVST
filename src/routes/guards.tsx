import { Navigate } from "react-router";
import type { Role } from "@/types";
import { useAuth } from "@/lib/auth";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"} replace />;
  return <>{children}</>;
}
