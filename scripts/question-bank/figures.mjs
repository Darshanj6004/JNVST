// Mental Ability Test — figure-based questions for all 10 official JNVST sections.
// Every figure is a list of primitives in a 100x100 cell centred on (0,0).
// Answers are verified geometrically: each option must be visually distinct
// (canonical comparison) and the correct one must be the unique valid answer.
import { arrange, uuidFrom } from "./lib.mjs";

const INK = "#1f2937";
const R2 = (v) => Math.round(v * 10) / 10 + 0; // +0 turns -0 into 0

// ── primitives ─────────────────────────────────────────────────────────────
const poly = (p, closed = true, fill = false, w = 2.5) => ({ t: "poly", p, c: closed, f: fill, w });
const line = (a, b, w = 2.5) => poly([a, b], false, false, w);
const circ = (c, r, fill = false) => ({ t: "circ", p: [c], r, f: fill });
const dot = (c, r = 4.5) => circ(c, r, true);

const mapPts = (fig, fn) => fig.map((pr) => ({ ...pr, p: pr.p.map(fn) }));
export const rot = (fig, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return mapPts(fig, ([x, y]) => [x * c - y * s, x * s + y * c]);
};
export const flipX = (fig) => mapPts(fig, ([x, y]) => [-x, y]);
export const flipY = (fig) => mapPts(fig, ([x, y]) => [x, -y]);
const move = (fig, dx, dy) => mapPts(fig, ([x, y]) => [x + dx, y + dy]);
const scale = (fig, k) => fig.map((pr) => ({ ...pr, p: pr.p.map(([x, y]) => [x * k, y * k]), r: pr.r ? pr.r * k : pr.r }));

/** Canonical string: equal strings ⇔ visually identical figures. */
export function canon(fig) {
  const parts = fig.map((pr) => {
    const pts = pr.p.map(([x, y]) => `${R2(x)},${R2(y)}`);
    if (pr.t === "circ") return `c${pts[0]}r${R2(pr.r)}${pr.f ? "f" : ""}`;
    if (pr.t === "path") return `path:${pr.key}`;
    let best;
    if (pr.c) {
      const n = pts.length, cands = [];
      for (let i = 0; i < n; i++) {
        const fwd = [], rev = [];
        for (let k = 0; k < n; k++) {
          fwd.push(pts[(i + k) % n]);
          rev.push(pts[(i - k + n) % n]);
        }
        cands.push(fwd.join(" "), rev.join(" "));
      }
      best = cands.sort()[0];
    } else {
      best = [pts.join(" "), [...pts].reverse().join(" ")].sort()[0];
    }
    return `${pr.c ? "P" : "L"}${pr.f ? "f" : ""}[${best}]`;
  });
  return parts.sort().join("|");
}
const same = (a, b) => canon(a) === canon(b);
const allDistinct = (figs) => new Set(figs.map(canon)).size === figs.length;

// ── shapes ─────────────────────────────────────────────────────────────────
const regular = (n, r, start = -90) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 / n) * i) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
const BASES = {
  square: () => [poly(regular(4, 38, -45))],
  circle: () => [circ([0, 0], 32)],
  triangle: () => [poly(regular(3, 40, -90))],
  pentagon: () => [poly(regular(5, 36, -90))],
  hexagon: () => [poly(regular(6, 35, 0))],
};
const MARKERS = {
  dot: (c) => [dot(c)],
  ring: (c) => [circ(c, 5)],
  tri: ([x, y]) => [poly([[x, y - 6], [x + 6, y + 5], [x - 6, y + 5]], true, true)],
  box: ([x, y]) => [poly([[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]], true, true)],
  dash: ([x, y]) => [line([x - 6, y], [x + 6, y])],
  cross: ([x, y]) => [line([x - 5, y - 5], [x + 5, y + 5]), line([x - 5, y + 5], [x + 5, y - 5])],
};
const SLOTS = regular(8, 20, -90); // 8 marker positions inside the base

function isChiral(fig) {
  const m = flipX(fig);
  for (let k = 0; k < 8; k++) if (same(m, rot(fig, k * 45))) return false;
  return true;
}
function noRotSymmetry(fig, step = 45) {
  for (let k = 1; k * step < 360; k++) if (same(fig, rot(fig, k * step))) return false;
  return true;
}

/** Random asymmetric composite: base outline + 2–3 different markers. */
function composite(rng, nMarkers = 3, bases = Object.keys(BASES)) {
  for (let tries = 0; tries < 200; tries++) {
    const base = rng.pick(bases);
    const slots = rng.sample([0, 1, 2, 3, 4, 5, 6, 7], nMarkers);
    const kinds = rng.sample(Object.keys(MARKERS), nMarkers);
    const fig = [...BASES[base]()];
    slots.forEach((s, i) => fig.push(...MARKERS[kinds[i]](SLOTS[s])));
    if (isChiral(fig) && noRotSymmetry(fig)) return { fig, base, slots, kinds };
  }
  throw new Error("composite: could not build chiral figure");
}

/** Arrow with a one-sided flag: clearly chiral, easy to read when rotated. */
function flagArrow(rng) {
  const variant = rng.int(0, 2);
  const fig = [line([0, 30], [0, -30]), poly([[-9, -19], [0, -30], [9, -19]], false)];
  if (variant === 0) fig.push(poly([[0, 30], [14, 22], [0, 14]], true, true));
  if (variant === 1) fig.push(line([0, 10], [14, 10]), dot([14, 10], 3.5));
  if (variant === 2) fig.push(poly([[0, 0], [12, -6], [12, 6]], true, false), dot([-10, 24], 4));
  return fig;
}

// ── SVG rendering ──────────────────────────────────────────────────────────
function primSvg(pr, ox, oy, k = 1) {
  const P = ([x, y]) => [R2(ox + x * k), R2(oy + y * k)];
  if (pr.t === "circ") {
    const [cx, cy] = P(pr.p[0]);
    return `<circle cx="${cx}" cy="${cy}" r="${R2(pr.r * k)}" fill="${pr.f ? INK : "none"}" stroke="${INK}" stroke-width="2.2"/>`;
  }
  if (pr.t === "path") return pr.svg(ox, oy, k);
  const pts = pr.p.map((q) => P(q).join(",")).join(" ");
  const tag = pr.c ? "polygon" : "polyline";
  const dash = pr.dash ? ` stroke-dasharray="5 4"` : "";
  return `<${tag} points="${pts}" fill="${pr.f ? INK : "none"}" stroke="${pr.col ?? INK}" stroke-width="${pr.w ?? 2.5}" stroke-linejoin="round" stroke-linecap="round"${dash}/>`;
}
const figSvg = (fig, ox, oy, k = 1) => fig.map((pr) => primSvg(pr, ox, oy, k)).join("");
const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>`;
const label = (x, y, t, size = 13, weight = 600) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="#334155" text-anchor="middle">${t}</text>`;
const qmark = (x, y) => `<text x="${x}" y="${y + 14}" font-family="Arial" font-size="40" font-weight="700" fill="#94a3b8" text-anchor="middle">?</text>`;

const CELL = 104, GAP = 14;
/** Answer row: 4 cells labelled A–D. Each item is either a figure or {svg:(cx,cy)=>string}. */
function answerRow(items, y) {
  const total = 4 * CELL + 3 * GAP, x0 = (600 - total) / 2;
  let s = label(300, y - 8, "Answer Figures", 13, 700);
  items.forEach((it, i) => {
    const x = x0 + i * (CELL + GAP);
    s += box(x, y, CELL, CELL);
    s += it.svg ? it.svg(x + CELL / 2, y + CELL / 2) : figSvg(it, x + CELL / 2, y + CELL / 2, 0.92);
    s += label(x + CELL / 2, y + CELL + 18, `(${"ABCD"[i]})`);
  });
  return s;
}
function wrap(inner, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${h}" width="600" height="${h}"><rect width="600" height="${h}" fill="#ffffff"/>${inner}</svg>`;
}
/** Problem row with n cells (some may be "?"), optional separators between cells. */
function problemRow(items, y, title = "Problem Figures", seps = []) {
  const n = items.length, total = n * CELL + (n - 1) * GAP + seps.filter(Boolean).length * 10;
  let x = (600 - total) / 2;
  let s = label(300, y - 8, title, 13, 700);
  items.forEach((it, i) => {
    s += box(x, y, CELL, CELL);
    if (it === "?") s += qmark(x + CELL / 2, y + CELL / 2);
    else s += it.svg ? it.svg(x + CELL / 2, y + CELL / 2) : figSvg(it, x + CELL / 2, y + CELL / 2, 0.92);
    x += CELL;
    if (i < n - 1) {
      const sep = seps[i];
      if (sep) {
        s += `<text x="${x + (GAP + 10) / 2}" y="${y + CELL / 2 + 7}" font-family="Arial" font-size="22" font-weight="700" fill="#334155" text-anchor="middle">${sep}</text>`;
        x += GAP + 10;
      } else x += GAP;
    }
  });
  return s;
}
const standard = (problem, answers, problemTitle, seps) =>
  wrap(problemRow(problem, 26, problemTitle, seps) + answerRow(answers, 26 + CELL + 48), 26 + CELL + 48 + CELL + 30);

// ── question factory ──────────────────────────────────────────────────────
function q(section, idx, difficulty, text, svg, correctFig, distractorFigs, explanation, rng, opts = {}) {
  const figs = [correctFig, ...distractorFigs];
  if (!opts.skipCheck && !allDistinct(figs)) return null; // caller retries
  const arr = arrange(rng, 0, [1, 2, 3]);
  const ordered = arr.order.map((o) => figs[o.v]);
  const key = `mat:${section}:${idx}`;
  return {
    id: uuidFrom(key),
    key,
    subject: "mental_ability",
    topic: section,
    difficulty,
    text,
    options: ["Figure A", "Figure B", "Figure C", "Figure D"],
    correct: arr.correct,
    explanation,
    svg: svg(ordered),
  };
}
function build(n, fn) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const r = fn(out.length);
    if (r) out.push(r);
  }
  if (out.length < n) throw new Error("could not build enough questions");
  return out;
}

// ── 1. Odd Man Out ────────────────────────────────────────────────────────
const S1 = "Odd Man Out";
function oddManOut(rng, i) {
  if (i % 3 === 2) {
    // counting variant: three figures have k lines, one has k+1 (or k-1)
    const k = rng.int(3, 5), odd = rng.pick([k + 1, k - 1]);
    const star = (n) => {
      const start = rng.int(0, 359);
      // no two rays may point in opposite directions (they would look like one line)
      let slots;
      do slots = rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], n);
      while (slots.some((a) => slots.includes((a + 6) % 12)));
      const angs = slots.map((a) => start + a * 30);
      return angs.map((a) => line([0, 0], [34 * Math.cos((a * Math.PI) / 180), 34 * Math.sin((a * Math.PI) / 180)]));
    };
    const shape = rng.pick(["circle", "none"]);
    const wrapS = (f) => (shape === "circle" ? [circ([0, 0], 38), ...f] : f);
    return q(S1, i, "easy", "Three of the following figures are alike in some way. Which one is different?",
      (o) => wrap(answerRow(o, 30), 30 + CELL + 30),
      wrapS(star(odd)), [wrapS(star(k)), wrapS(star(k)), wrapS(star(k))],
      `Count the lines that start from the centre: three figures have ${k} each, but the odd figure has ${odd}.`, rng);
  }
  const g = rng.chance(0.5) ? composite(rng, 3).fig : flagArrow(rng);
  const angs = rng.sample([0, 90, 180, 270], 4);
  return q(S1, i, i % 3 === 0 ? "medium" : "hard", "Three of the following figures are alike in some way. Which one is different?",
    (o) => wrap(answerRow(o, 30), 30 + CELL + 30),
    rot(flipX(g), angs[3]), [rot(g, angs[0]), rot(g, angs[1]), rot(g, angs[2])],
    "Three figures are the same figure turned to different positions. The odd figure is a mirror image, which cannot be obtained by turning.", rng);
}

// ── 2. Figure Matching ────────────────────────────────────────────────────
const S2 = "Figure Matching";
function figureMatching(rng, i) {
  const { base, slots, kinds } = composite(rng, 3);
  const make = (sl, kd) => {
    const f = [...BASES[base]()];
    sl.forEach((s, j) => f.push(...MARKERS[kd[j]](SLOTS[s])));
    return f;
  };
  const g = make(slots, kinds);
  const free = [0, 1, 2, 3, 4, 5, 6, 7].filter((s) => !slots.includes(s));
  const moved = [...slots]; moved[rng.int(0, 2)] = rng.pick(free);
  const swapped = [...kinds]; const j = rng.int(0, 2);
  swapped[j] = rng.pick(Object.keys(MARKERS).filter((k) => !kinds.includes(k)));
  const d3 = rng.chance(0.5) ? flipX(g) : make([slots[1], slots[0], slots[2]], kinds);
  return q(S2, i, i % 2 ? "easy" : "medium", "Select the answer figure that is exactly the same as the problem figure.",
    (o) => standard([g], o, "Problem Figure"),
    g, [make(moved, kinds), make(slots, swapped), d3],
    "Compare each part: only this answer figure has every mark in the same place and of the same kind as the problem figure.", rng);
}

// ── 3. Pattern Completion ─────────────────────────────────────────────────
const S3 = "Pattern Completion";
function quadrantDesign(rng) {
  // design lives in the top-left quadrant [-40,0]x[-40,0]
  for (let t = 0; t < 200; t++) {
    const pts = () => [rng.int(-36, -4), rng.int(-36, -4)];
    const d = [line(pts(), pts()), line(pts(), pts())];
    d.push(rng.chance(0.5) ? dot(pts()) : poly((() => { const [x, y] = pts(); return [[x, y - 5], [x + 5, y + 4], [x - 5, y + 4]]; })(), true, true));
    const c = move(d, 20, 20); // centred quadrant
    if (allDistinct([c, flipX(c), flipY(c), flipX(flipY(c))])) return d;
  }
  throw new Error("quadrant");
}
function patternCompletion(rng, i) {
  const d = quadrantDesign(rng);
  const full = [...d, ...flipX(d), ...flipY(d), ...flipX(flipY(d))];
  const missing = rng.int(0, 3); // 0 TL,1 TR,2 BL,3 BR
  const qc = [[-20, -20], [20, -20], [-20, 20], [20, 20]][missing];
  const inQuad = (pr) => pr.p.every(([x, y]) => Math.sign(x || -1) === Math.sign(qc[0]) && Math.sign(y || -1) === Math.sign(qc[1]));
  const shown = full.filter((pr) => !inQuad(pr));
  const c = move(d, 20, 20);
  const variants = [c, flipX(c), flipY(c), flipX(flipY(c))];
  const correct = variants[missing];
  const frame = (f) => [poly([[-20, -20], [20, -20], [20, 20], [-20, 20]], true, false, 1.2), ...f];
  const big = {
    svg: (cx, cy) => {
      const k = 1.15;
      let s = `<rect x="${cx - 40 * k}" y="${cy - 40 * k}" width="${80 * k}" height="${80 * k}" fill="none" stroke="${INK}" stroke-width="2"/>`;
      s += `<rect x="${cx + (qc[0] - 20) * k}" y="${cy + (qc[1] - 20) * k}" width="${40 * k}" height="${40 * k}" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="4 3"/>`;
      s += `<text x="${cx + qc[0] * k}" y="${cy + qc[1] * k + 8}" font-family="Arial" font-size="22" font-weight="700" fill="#94a3b8" text-anchor="middle">?</text>`;
      return s + figSvg(shown, cx, cy, k);
    },
  };
  return q(S3, i, i % 2 ? "medium" : "hard", "Which answer figure will complete the pattern in the problem figure?",
    (o) => standard([big], o.map((f) => scale(frame(f), 1.9)), "Problem Figure"),
    correct, variants.filter((_, k) => k !== missing),
    "The pattern is symmetrical: each quarter is the mirror image of the quarter next to it. The missing quarter must mirror its neighbours.", rng);
}

// ── 4. Figure Series Completion ──────────────────────────────────────────
const S4 = "Figure Series Completion";
function series(rng, i) {
  if (i % 3 === 2) {
    // dots increase by one, base alternates
    const n0 = rng.int(1, 2), bases = rng.sample(["square", "circle", "triangle", "hexagon"], 2);
    const fig = (k) => {
      const f = [...BASES[bases[k % 2]]()];
      const pos = regular(Math.max(n0 + k, 1), n0 + k === 1 ? 0 : 16, -90);
      pos.forEach((p) => f.push(dot(p, 4)));
      return f;
    };
    const ans = fig(4);
    const wrongBase = (() => { const f = [...BASES[bases[1]]()]; regular(n0 + 4, 16, -90).forEach((p) => f.push(dot(p, 4))); return f; })();
    return q(S4, i, "easy", "Which answer figure will continue the series of problem figures?",
      (o) => standard([fig(0), fig(1), fig(2), fig(3), "?"], o),
      ans, [fig(3), fig(5), wrongBase],
      `The number of dots increases by one each time and the outer shape alternates between ${bases[0]} and ${bases[1]}.`, rng);
  }
  const g = rng.chance(0.5) ? flagArrow(rng) : composite(rng, 2).fig;
  const step = rng.pick([45, 90, 135, -45, -90]);
  const f = (k) => rot(g, k * step);
  const dir = step > 0 ? "clockwise" : "anticlockwise";
  return q(S4, i, Math.abs(step) === 90 ? "medium" : "hard", "Which answer figure will continue the series of problem figures?",
    (o) => standard([f(0), f(1), f(2), f(3), "?"], o),
    f(4), [f(3), f(5), flipX(f(4))],
    `The figure turns ${Math.abs(step)}° ${dir} at every step, so the next figure is turned once more.`, rng);
}

// ── 5. Analogy ───────────────────────────────────────────────────────────
const S5 = "Analogy";
const TRANSFORMS = [
  ["turned 90° clockwise", (f) => rot(f, 90)],
  ["turned upside down (180°)", (f) => rot(f, 180)],
  ["turned 90° anticlockwise", (f) => rot(f, -90)],
  ["reflected left-to-right", flipX],
  ["reflected top-to-bottom", flipY],
  ["turned 45° clockwise", (f) => rot(f, 45)],
];
function analogy(rng, i) {
  const A = composite(rng, rng.int(2, 3)).fig, C = composite(rng, rng.int(2, 3)).fig;
  const ti = rng.int(0, TRANSFORMS.length - 1);
  const [name, T] = TRANSFORMS[ti];
  // T(A) must not be explainable by another transform (unambiguous)
  if (TRANSFORMS.some(([, t], k) => k !== ti && same(t(A), T(A)))) return null;
  const others = rng.sample(TRANSFORMS.filter((_, k) => k !== ti), 3).map(([, t]) => t(C));
  return q(S5, i, ti >= 3 ? "hard" : "medium", "Figure (1) is related to figure (2) in a certain way. In the same way, figure (3) is related to which answer figure?",
    (o) => standard([A, T(A), C, "?"], o, "Problem Figures", ["", "::", ""]),
    T(C), others, `Figure (2) is figure (1) ${name}. Doing the same to figure (3) gives the answer.`, rng);
}

// ── 6. Geometrical Figure Completion ─────────────────────────────────────
const S6 = "Geometrical Figure Completion";
function cutPiece(rng, verts, vi, jags) {
  const V = verts[vi], N = verts[(vi + 1) % verts.length], Pv = verts[(vi - 1 + verts.length) % verts.length];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const f = verts.length === 3 ? 0.5 : 0.6;
  const P = lerp(V, N, f), Q = lerp(V, Pv, f);
  const J = jags.map(([t, off]) => {
    const m = lerp(P, Q, t), cx = (P[0] + Q[0]) / 2 - V[0], cy = (P[1] + Q[1]) / 2 - V[1];
    const len = Math.hypot(cx, cy) || 1;
    return [m[0] + (cx / len) * off, m[1] + (cy / len) * off];
  });
  const piece = [V, P, ...J, Q];
  const rest = [];
  verts.forEach((v, k) => (k === vi ? rest.push(Q, ...[...J].reverse(), P) : rest.push(v)));
  return { piece, rest };
}
function centred(pts) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [x - cx, y - cy]);
}
function geoCompletion(rng, i) {
  if (i % 4 === 3) {
    // circle with a missing sector
    const angs = rng.sample([45, 60, 90, 120, 150], 4), phi = rng.pick([-90, 0, 45, 180]);
    const pt = (a, r = 34) => [R2(r * Math.cos((a * Math.PI) / 180)), R2(r * Math.sin((a * Math.PI) / 180))];
    const sector = (a) => ({
      t: "path", key: `sector${a}`, p: [],
      svg: (ox, oy, k) => {
        const [x1, y1] = pt(phi), [x2, y2] = pt(phi + a);
        return `<path d="M${ox},${oy} L${ox + x1 * k},${oy + y1 * k} A${34 * k},${34 * k} 0 ${a > 180 ? 1 : 0} 1 ${ox + x2 * k},${oy + y2 * k} Z" fill="#e2e8f0" stroke="${INK}" stroke-width="2.4"/>`;
      },
    });
    const prob = {
      svg: (ox, oy) => {
        const [x1, y1] = pt(phi + angs[0]), [x2, y2] = pt(phi);
        return `<path d="M${ox},${oy} L${ox + x1},${oy + y1} A34,34 0 ${360 - angs[0] > 180 ? 1 : 0} 1 ${ox + x2},${oy + y2} Z" fill="#e2e8f0" stroke="${INK}" stroke-width="2.4"/>`;
      },
    };
    return q(S6, i, "easy", "Which answer figure will complete the circle in the problem figure?",
      (o) => standard([prob], o.map((f) => ({ svg: (cx, cy) => figSvg(f, cx, cy, 1) }))),
      [sector(angs[0])], [[sector(angs[1])], [sector(angs[2])], [sector(angs[3])]],
      `The missing part is a sector of ${angs[0]}°. Only that piece fits exactly.`, rng);
  }
  const shape = i % 4 === 2 ? "triangle" : "square";
  const verts = shape === "triangle" ? regular(3, 44, -90) : regular(4, 40, -135);
  const vi = rng.int(0, verts.length - 1);
  const jag = () => [[rng.int(25, 40) / 100, rng.int(-8, 18)], [rng.int(60, 75) / 100, rng.int(-8, 18)]];
  const real = cutPiece(rng, verts, vi, jag());
  const fake1 = cutPiece(rng, verts, vi, jag()), fake2 = cutPiece(rng, verts, vi, jag());
  const pc = (p) => [poly(centred(p), true, true)];
  const prob = [{ ...poly(real.rest, true, false), col: INK }];
  return q(S6, i, shape === "triangle" ? "hard" : "medium", `Which answer figure will complete the ${shape} in the problem figure?`,
    (o) => standard([prob], o),
    pc(real.piece), [pc(fake1.piece), pc(fake2.piece), flipX(pc(real.piece))],
    `Match the zig-zag edge: only this piece has exactly the same cut as the gap, in the same position, so it completes the ${shape}.`, rng);
}

// ── 7. Mirror Imaging ────────────────────────────────────────────────────
const S7 = "Mirror Imaging";
const WORDS = ["RJ5F", "B7GK", "N2PZ", "FR46", "J9KL", "S3RQ", "PG72", "LKR8", "Z4JN", "7FGR", "CR5P", "K2LJ"];
function textFig(str, mode) {
  return {
    t: "path", key: `txt:${str}:${mode}`, p: [],
    svg: (ox, oy, k) => {
      const tr = { id: "", fx: " scale(-1,1)", fy: " scale(1,-1)", r180: " scale(-1,-1)" }[mode];
      return `<g transform="translate(${ox},${oy})${tr}"><text x="0" y="${9 * k}" font-family="Arial, sans-serif" font-size="${26 * k}" font-weight="700" fill="${INK}" text-anchor="middle">${str}</text></g>`;
    },
  };
}
function mirror(rng, i) {
  const water = i % 4 === 3;
  const mirrorLine = water
    ? (cx, cy) => `<line x1="${cx - 48}" y1="${cy + 46}" x2="${cx + 48}" y2="${cy + 46}" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${cx + 44}" y="${cy + 42}" font-family="Arial" font-size="11" fill="#2563eb" text-anchor="end">M</text>`
    : (cx, cy) => `<line x1="${cx + 47}" y1="${cy - 46}" x2="${cx + 47}" y2="${cy + 46}" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${cx + 42}" y="${cy - 36}" font-family="Arial" font-size="11" fill="#2563eb" text-anchor="end">M</text>`;
  const text = water ? "Which answer figure is the water image (reflection in the line M below) of the problem figure?"
    : "Which answer figure is the mirror image of the problem figure when the mirror is placed along the line M?";
  if (i % 2 === 0) {
    const w = WORDS[i % WORDS.length];
    const modes = water ? ["fy", "id", "fx", "r180"] : ["fx", "id", "fy", "r180"];
    const prob = { svg: (cx, cy) => figSvg([textFig(w, "id")], cx, cy, 0.95) + mirrorLine(cx, cy) };
    return q(S7, i, "medium", text,
      (o) => standard([prob], o.map((f) => ({ svg: (cx, cy) => figSvg(f, cx, cy, 0.9) })), "Problem Figure"),
      [textFig(w, modes[0])], modes.slice(1).map((m) => [textFig(w, m)]),
      water ? "In a water image, top and bottom are exchanged while left and right stay the same."
        : "In a mirror image, left and right are exchanged while top and bottom stay the same.", rng, { skipCheck: true });
  }
  const g = rng.chance(0.5) ? flagArrow(rng) : composite(rng, 3).fig;
  const ans = water ? flipY(g) : flipX(g);
  const prob = { svg: (cx, cy) => figSvg(g, cx, cy, 0.85) + mirrorLine(cx, cy) };
  return q(S7, i, "hard", text,
    (o) => standard([prob], o, "Problem Figure"),
    ans, [g, water ? flipX(g) : flipY(g), rot(g, 180)],
    water ? "In a water image, top and bottom are exchanged while left and right stay the same."
      : "In a mirror image, left and right are exchanged while top and bottom stay the same.", rng);
}

// ── 8. Punched Hole Pattern ──────────────────────────────────────────────
const S8 = "Punched Hole Pattern";
const FOLDS = {
  vertical: { region: (x, y) => x < -6 && x > -34 && Math.abs(y) < 30, mirrors: [(p) => [-p[0], p[1]]], wrong: (p) => [p[0], -p[1]], shape: [[-40, -40], [0, -40], [0, 40], [-40, 40]], dash: [[0, -40], [0, 40]], name: "vertically (right half folded over the left half)" },
  horizontal: { region: (x, y) => y < -6 && y > -34 && Math.abs(x) < 30, mirrors: [(p) => [p[0], -p[1]]], wrong: (p) => [-p[0], p[1]], shape: [[-40, -40], [40, -40], [40, 0], [-40, 0]], dash: [[-40, 0], [40, 0]], name: "horizontally (bottom half folded over the top half)" },
  diagonal: { region: (x, y) => y < x - 10 && x < 32 && y > -32, mirrors: [(p) => [p[1], p[0]]], wrong: (p) => [-p[1], -p[0]], shape: [[-40, -40], [40, -40], [40, 40]], dash: [[-40, -40], [40, 40]], name: "along the diagonal" },
  double: { region: (x, y) => x < -8 && y < -8 && x > -32 && y > -32, mirrors: [(p) => [-p[0], p[1]], (p) => [p[0], -p[1]], (p) => [-p[0], -p[1]]], wrong: null, shape: [[-40, -40], [0, -40], [0, 0], [-40, 0]], dash: null, name: "twice (first vertically, then horizontally)" },
};
function holesFig(holes) {
  return [poly([[-40, -40], [40, -40], [40, 40], [-40, 40]], true, false, 2), ...holes.map((h) => circ(h, 5.5, true))];
}
function punched(rng, i) {
  const kind = ["vertical", "horizontal", "diagonal", "double"][i % 4];
  const F = FOLDS[kind];
  const nh = kind === "double" ? 1 : rng.int(1, 2);
  const holes = [];
  for (let t = 0; holes.length < nh && t < 500; t++) {
    const h = [rng.int(-34, 34), rng.int(-34, 34)];
    if (F.region(...h) && holes.every((o) => Math.hypot(o[0] - h[0], o[1] - h[1]) > 14)) holes.push(h);
  }
  if (holes.length < nh) return null;
  const all = [...holes, ...F.mirrors.flatMap((m) => holes.map(m))];
  const correct = holesFig(all);
  let d;
  if (kind === "double") {
    d = [holesFig(holes), holesFig([...holes, ...holes.map(F.mirrors[0])]), holesFig([...holes, ...holes.map(F.mirrors[2])])];
  } else {
    const shifted = holes.map(([x, y]) => [x, y + (y > 0 ? -10 : 10)]);
    d = [holesFig(holes), holesFig([...holes, ...holes.map(F.wrong)]), holesFig([...holes, ...shifted.map(F.mirrors[0])])];
  }
  const step1 = [poly([[-40, -40], [40, -40], [40, 40], [-40, 40]], true, false, 2), ...(F.dash ? [{ ...line(...F.dash, 2), dash: true }] : [{ ...line([0, -40], [0, 40], 2), dash: true }])];
  const folded = [poly(F.shape, true, false, 2), ...holes.map((h) => circ(h, 5.5, true))];
  const problems = kind === "double"
    ? [step1, [poly([[-40, -40], [0, -40], [0, 40], [-40, 40]], true, false, 2), { ...line([-40, 0], [0, 0], 2), dash: true }], folded]
    : [step1, folded];
  return q(S8, i, kind === "double" ? "hard" : kind === "diagonal" ? "hard" : "medium",
    `A square sheet of paper is folded ${F.name} along the dotted line(s) and holes are punched as shown. How will the paper look when it is unfolded?`,
    (o) => standard(problems, o, "Problem Figures", problems.map(() => "→")),
    correct, d,
    `Each hole punched through the folded paper also goes through the layer underneath, so every hole appears again as a mirror image across the fold line${kind === "double" ? "s (4 holes in total)" : ""}.`, rng);
}

// ── 9. Space Visualisation ───────────────────────────────────────────────
const S9 = "Space Visualisation";
function space(rng, i) {
  const g = rng.chance(0.4) ? flagArrow(rng) : composite(rng, 3).fig;
  const r = rng.pick([90, 180, 270]);
  const mr = rng.sample([0, 90, 180, 270], 3);
  return q(S9, i, r === 180 ? "medium" : "hard",
    "The problem figure is turned (rotated) on the paper without lifting it. Which answer figure can be obtained?",
    (o) => standard([g], o, "Problem Figure"),
    rot(g, r), mr.map((a) => rot(flipX(g), a)),
    `The correct figure is the problem figure turned ${r}°. The others are mirror images, which can never be obtained by only turning the paper.`, rng);
}

// ── 10. Embedded Figure ──────────────────────────────────────────────────
const S10 = "Embedded Figure";
const EMB_SHAPES = [
  [[[-14, -12], [0, -12], [0, 12], [14, 12]], false],
  [[[-12, -14], [-12, 12], [12, 12], [12, 2]], false],
  [[[-14, -12], [14, -4], [-6, 14]], true],
  [[[-14, -12], [10, -14], [14, 10], [-4, 12]], true],
  [[[-14, 12], [-14, 0], [0, 0], [0, -12], [14, -12]], false],
  [[[0, -14], [12, -2], [2, 14], [-10, 0]], true],
  [[[-14, 14], [-2, -14], [6, 4], [14, -6]], false],
  [[[-14, -12], [14, -12], [14, -2], [0, -2], [0, 14], [-14, 14]], true],
];
function embedded(rng, i) {
  const [pts, closed] = EMB_SHAPES[(i + rng.int(0, 7)) % EMB_SHAPES.length];
  let Xf = rot([poly(pts, closed, false)], rng.pick([0, 90, 180, 270]));
  if (rng.chance(0.5)) Xf = flipX(Xf);
  if (!isChiral(Xf)) return null;
  const X = Xf[0].p, shapeN = X.length;
  const extra = (n) => Array.from({ length: n }, () => line([rng.int(-36, 36), rng.int(-36, 36)], [rng.int(-36, 36), rng.int(-36, 36)], 2.5));
  const place = (f) => { const dx = rng.int(-14, 14), dy = rng.int(-14, 14); return [...move(f, dx, dy), poly(regular(4, 44, -135), true, false, 1.5), ...extra(rng.int(3, 5))]; };
  const bent = [poly(X.map((p, k) => (k === 1 ? [p[0] + 10, p[1] + 10] : p)), Xf[0].c, false)];
  return q(S10, i, shapeN === 4 ? "hard" : "medium",
    "In which answer figure is the problem figure hidden (embedded) in exactly the same size and position?",
    (o) => standard([scale(Xf, 1.6)], o, "Problem Figure"),
    place(Xf), [place(flipX(Xf)), place(rot(Xf, 90)), place(bent)],
    "Look for the problem figure in the same size and orientation; the other answer figures contain a mirrored, turned or changed version.", rng);
}

export const MAT_SECTIONS = [
  [S1, oddManOut], [S2, figureMatching], [S3, patternCompletion], [S4, series], [S5, analogy],
  [S6, geoCompletion], [S7, mirror], [S8, punched], [S9, space], [S10, embedded],
];

export function buildMental(rng, perSection = 12) {
  return MAT_SECTIONS.flatMap(([, fn]) => build(perSection, (i) => fn(rng, i)));
}
