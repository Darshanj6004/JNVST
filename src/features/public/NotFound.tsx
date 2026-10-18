import { Link } from "react-router";
import { ArrowLeft, Compass, GraduationCap } from "lucide-react";
import { Button } from "@/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-canvas px-5 text-center">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white">
          <GraduationCap className="size-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Navodaya Prep</span>
      </div>

      <div className="mt-12 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="size-8" />
      </div>
      <p className="mt-6 text-[64px] font-semibold leading-none tracking-tight text-ink tabular">404</p>
      <h1 className="mt-2 text-xl font-semibold text-ink">This page took a wrong turn</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The page you're looking for doesn't exist or may have moved. Let's get you back to familiar ground.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button leftIcon={<ArrowLeft className="size-4" />}>Back to home</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
