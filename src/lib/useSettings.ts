import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, loadSettings, type AppSettings } from "@/lib/api";

/** School-wide settings (thresholds, school name, durations). */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    let alive = true;
    loadSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return settings;
}
