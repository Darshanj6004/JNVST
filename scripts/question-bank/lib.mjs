// Shared helpers: seeded RNG, deterministic UUIDs, option shuffling.
import { createHash } from "node:crypto";

export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  const next = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample: (arr, n) => rng.shuffle(arr).slice(0, n),
    chance: (p) => next() < p,
  };
  return rng;
}

/** Deterministic UUID (v5-style layout) from a string key. */
export function uuidFrom(key) {
  const h = createHash("sha1").update("jnvst-qbank:" + key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Place the correct answer and 3 distractors in random order.
 * Returns { options: [a,b,c,d], correct: "A"|"B"|"C"|"D" }.
 */
export function arrange(rng, correct, distractors) {
  const all = rng.shuffle([{ v: correct, ok: true }, ...distractors.map((v) => ({ v, ok: false }))]);
  const idx = all.findIndex((x) => x.ok);
  return { options: all.map((x) => x.v), correct: "ABCD"[idx], order: all };
}

export const LETTERS = ["A", "B", "C", "D"];
