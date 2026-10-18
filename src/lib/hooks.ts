import { useEffect, useMemo, useRef, useState } from "react";

/** Countdown timer in seconds. Calls onExpire once when it reaches 0. */
export function useCountdown(initialSeconds: number, running = true, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const fired = useRef(false);
  const cb = useRef(onExpire);
  cb.current = onExpire;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!fired.current) {
            fired.current = true;
            cb.current?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return remaining;
}

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const clamped = Math.min(page, pageCount);
  const slice = useMemo(
    () => items.slice((clamped - 1) * pageSize, clamped * pageSize),
    [items, clamped, pageSize],
  );
  return { page: clamped, setPage, pageCount, slice };
}
