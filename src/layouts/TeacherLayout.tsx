import { AppShell } from "@/app/AppShell";
import { teacherNav } from "@/lib/nav";
import { RequireRole } from "@/routes/guards";

export default function TeacherLayout() {
  return (
    <RequireRole role="teacher">
      <AppShell nav={teacherNav} portalLabel="Teacher Portal" />
    </RequireRole>
  );
}
