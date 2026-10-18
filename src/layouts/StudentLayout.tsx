import { AppShell } from "@/app/AppShell";
import { studentNav } from "@/lib/nav";
import { RequireRole } from "@/routes/guards";

export default function StudentLayout() {
  return (
    <RequireRole role="student">
      <AppShell nav={studentNav} portalLabel="Student Portal" />
    </RequireRole>
  );
}
