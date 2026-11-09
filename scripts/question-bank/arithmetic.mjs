// Arithmetic Test — all 15 JNVST topics. Answers are computed, never typed.
import { arrange, uuidFrom } from "./lib.mjs";

const NAMES = ["Ravi", "Asha", "Sunita", "Arjun", "Meena", "Kiran", "Pooja", "Rahul", "Sneha", "Vikas", "Anita", "Rohan", "Priya", "Sachin", "Neha", "Ganesh"];
const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString("en-IN") : String(+n.toFixed(2)));
const rs = (n) => `₹${fmt(n)}`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const frac = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };

/** Build 3 distinct distractors near the answer. */
function near(rng, ans, cands, show = fmt) {
  const out = [];
  const add = (v) => {
    if (v === undefined || v === null || Number.isNaN(v)) return;
    const s = typeof v === "string" ? v : show(v);
    if (s !== (typeof ans === "string" ? ans : show(ans)) && !out.includes(s) && !(typeof v === "number" && v < 0)) out.push(s);
  };
  cands.forEach(add);
  let k = 1;
  while (out.length < 3 && k < 50) {
    if (typeof ans === "number") { add(ans + k * (Number.isInteger(ans) ? 1 : 0.5)); add(ans - k * (Number.isInteger(ans) ? 1 : 0.5)); }
    k++;
  }
  return out.slice(0, 3);
}

let counter = 0;
function mk(rng, topic, difficulty, text, ans, distractors, explanation, show = fmt) {
  const a = typeof ans === "string" ? ans : show(ans);
  const d = near(rng, ans, distractors, show);
  const { options, correct } = arrange(rng, a, d);
  const key = `ari:${topic}:${counter++}`;
  return { id: uuidFrom(key), key, subject: "arithmetic", topic, difficulty, text, options, correct, explanation };
}

const T = {
  numsys: "Number System",
  ops: "Four Fundamental Operations",
  factors: "Factors and Multiples",
  lcmhcf: "LCM and HCF",
  fractions: "Fractions",
  decimals: "Decimals",
  convert: "Fractions and Decimals Conversion",
  simplify: "Simplification",
  approx: "Approximation",
  percent: "Percentage",
  profit: "Profit and Loss",
  si: "Simple Interest",
  speed: "Distance, Time and Speed",
  measure: "Measurement (Length, Mass, Capacity, Time, Money)",
  area: "Perimeter, Area and Volume",
};

const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const toRoman = (n) => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");

const gens = {
  numsys: [
    (r) => {
      const n = r.int(10000, 99999), digits = String(n), pos = r.int(0, 3);
      const d = Number(digits[pos]); if (d === 0) return null;
      const place = 10 ** (4 - pos), ans = d * place;
      return mk(r, T.numsys, "easy", `What is the place value of ${d} in ${fmt(n)}?`, ans, [d, d * place * 10, d * (place / 10 || 1) ], `${d} is in the ${["ten-thousands", "thousands", "hundreds", "tens"][pos]} place, so its place value is ${d} × ${fmt(place)} = ${fmt(ans)}.`);
    },
    (r) => {
      const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      if (ds.every((d) => d === 0)) return null;
      const big = Number([...ds].sort((a, b) => b - a).join(""));
      const asc = [...ds].sort((a, b) => a - b);
      if (asc[0] === 0) { const nz = asc.findIndex((x) => x > 0); [asc[0], asc[nz]] = [asc[nz], asc[0]]; }
      const small = Number(asc.join(""));
      const diff = big - small;
      return mk(r, T.numsys, "medium", `Using the digits ${ds.join(", ")} only once each, what is the difference between the greatest and the smallest 4-digit numbers?`, diff, [big + small, diff + 9, diff - 90], `Greatest = ${fmt(big)}, smallest = ${fmt(small)}. Difference = ${fmt(big)} − ${fmt(small)} = ${fmt(diff)}.`);
    },
    (r) => {
      const n = r.int(14, 99);
      return mk(r, T.numsys, "easy", `Which Roman numeral represents ${n}?`, toRoman(n), [toRoman(n + 1), toRoman(n - 1), toRoman(n + 10 <= 99 ? n + 10 : n - 10)], `${n} = ${toRoman(n)}.`, String);
    },
    (r) => {
      const n = r.int(100000, 9999999);
      const ans = String(n).length;
      const s = n.toLocaleString("en-IN");
      return mk(r, T.numsys, "easy", `The number ${s} written in figures has how many digits?`, ans, [ans + 1, ans - 1, ans + 2], `${s} has ${ans} digits.`);
    },
  ],
  ops: [
    (r) => {
      const a = r.int(1200, 9800), b = r.int(1100, 8900), name = r.pick(NAMES);
      return mk(r, T.ops, "easy", `${name} had ${rs(a)}. ${name} earned ${rs(b)} more. How much money does ${name} have now?`, a + b, [a + b - 100, a + b + 10, Math.abs(a - b)], `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, rs);
    },
    (r) => {
      const per = r.int(12, 48), boxes = r.int(15, 65);
      return mk(r, T.ops, "medium", `A box holds ${per} pencils. How many pencils are there in ${boxes} such boxes?`, per * boxes, [per * boxes + per, per * boxes - per, per + boxes], `${per} × ${boxes} = ${fmt(per * boxes)} pencils.`);
    },
    (r) => {
      const each = r.int(15, 75), n = r.int(12, 40), total = each * n;
      return mk(r, T.ops, "medium", `${fmt(total)} mangoes are packed equally into ${n} baskets. How many mangoes are in each basket?`, each, [each + 1, each - 2, total - n], `${fmt(total)} ÷ ${n} = ${each}.`);
    },
    (r) => {
      const a = r.int(5000, 9999), b = r.int(1000, 4999);
      return mk(r, T.ops, "easy", `What should be subtracted from ${fmt(a)} to get ${fmt(b)}?`, a - b, [a + b, a - b + 10, a - b - 100], `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`);
    },
  ],
  factors: [
    (r) => {
      const n = r.pick([12, 18, 20, 24, 28, 30, 36, 40, 45, 48, 60, 72]);
      const f = [...Array(n).keys()].map((x) => x + 1).filter((x) => n % x === 0);
      return mk(r, T.factors, "medium", `How many factors does ${n} have?`, f.length, [f.length - 1, f.length + 1, f.length - 2], `Factors of ${n}: ${f.join(", ")} — that is ${f.length} factors.`);
    },
    (r) => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
      const p = r.pick(primes.filter((x) => x > 20));
      const comps = r.sample([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93], 3);
      return mk(r, T.factors, "medium", `Which of the following is a prime number?`, String(p), comps.map(String), `${p} has only two factors, 1 and ${p}. The others can be divided by smaller numbers (e.g. ${comps[0]}).`, String);
    },
    (r) => {
      const d = r.pick([3, 4, 6, 9, 11]), base = r.int(100, 900) * d;
      const wrong = [base + 1, base + 2, base - 1].map(String);
      return mk(r, T.factors, "hard", `Which of these numbers is divisible by ${d}?`, String(base), wrong, `${fmt(base)} ÷ ${d} = ${fmt(base / d)} with no remainder.`, String);
    },
    (r) => {
      const n = r.int(6, 13), k = r.int(8, 15);
      return mk(r, T.factors, "easy", `What is the ${k}th multiple of ${n}?`, n * k, [n * (k - 1), n * (k + 1), n + k], `${k}th multiple of ${n} = ${n} × ${k} = ${n * k}.`);
    },
  ],
  lcmhcf: [
    (r) => {
      const g = r.int(2, 9), a = g * r.int(2, 9), b = g * r.int(2, 9); if (a === b) return null;
      const h = gcd(a, b);
      return mk(r, T.lcmhcf, "easy", `Find the HCF of ${a} and ${b}.`, h, [lcm(a, b), h * 2, Math.max(1, h - 1)], `The greatest number dividing both ${a} and ${b} is ${h}.`);
    },
    (r) => {
      const a = r.int(4, 18), b = r.int(4, 18); if (a === b) return null;
      const l = lcm(a, b);
      return mk(r, T.lcmhcf, "easy", `Find the LCM of ${a} and ${b}.`, l, [a * b === l ? l * 2 : a * b, gcd(a, b), l + a], `The smallest number divisible by both ${a} and ${b} is ${l}.`);
    },
    (r) => {
      const a = r.pick([6, 8, 10, 12, 15]), b = r.pick([9, 14, 16, 18, 20]); if (a === b) return null;
      const l = lcm(a, b), rem = r.int(1, Math.min(a, b) - 1);
      return mk(r, T.lcmhcf, "hard", `What is the smallest number which, when divided by ${a} and ${b}, leaves a remainder of ${rem} in each case?`, l + rem, [l, l - rem, a * b + rem], `LCM of ${a} and ${b} = ${l}. Required number = ${l} + ${rem} = ${l + rem}.`);
    },
    (r) => {
      const a = r.pick([10, 12, 15, 20]), b = r.pick([25, 30, 36, 40]);
      const l = lcm(a, b);
      return mk(r, T.lcmhcf, "medium", `Two bells ring at intervals of ${a} minutes and ${b} minutes. If they ring together at 9:00 a.m., after how many minutes will they ring together again?`, l, [a + b, gcd(a, b), l * 2], `They ring together after LCM(${a}, ${b}) = ${l} minutes.`);
    },
  ],
  fractions: [
    (r) => {
      const d = r.pick([6, 8, 10, 12]), a = r.int(1, d - 2), b = r.int(1, d - a - 1);
      return mk(r, T.fractions, "easy", `${a}/${d} + ${b}/${d} = ?`, frac(a + b, d), [frac(a + b, 2 * d), frac(a * b, d), frac(a + b + 1, d)], `Same denominators: (${a} + ${b})/${d} = ${frac(a + b, d)}.`, String);
    },
    (r) => {
      const [a, b] = r.pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5]]), [c, d] = r.pick([[1, 6], [1, 5], [1, 8], [3, 10], [1, 12]]);
      const n = a * d + c * b, den = b * d;
      return mk(r, T.fractions, "medium", `${a}/${b} + ${c}/${d} = ?`, frac(n, den), [frac(a + c, b + d), frac(a * d - c * b, den), frac(n + 1, den)], `LCM of ${b} and ${d}; ${a}/${b} + ${c}/${d} = ${frac(n, den)}.`, String);
    },
    (r) => {
      const total = r.pick([24, 36, 40, 48, 60, 72, 120]), [n, d] = r.pick([[1, 4], [3, 4], [2, 3], [1, 3], [5, 6], [3, 8]]);
      if (total % d) return null;
      const ans = (total * n) / d;
      return mk(r, T.fractions, "easy", `${r.pick(NAMES)} read ${n}/${d} of a book of ${total} pages. How many pages were read?`, ans, [total - ans, total / d, ans + n], `${n}/${d} × ${total} = ${ans} pages.`);
    },
    (r) => {
      const opts = r.sample([[1, 2], [2, 3], [3, 4], [3, 5], [5, 8], [4, 7], [7, 10]], 4);
      const val = (f) => f[0] / f[1];
      const biggest = opts.reduce((m, f) => (val(f) > val(m) ? f : m));
      return mk(r, T.fractions, "medium", `Which is the largest fraction?`, `${biggest[0]}/${biggest[1]}`, opts.filter((f) => f !== biggest).map((f) => `${f[0]}/${f[1]}`), `As decimals: ${opts.map((f) => `${f[0]}/${f[1]} = ${val(f).toFixed(2)}`).join(", ")}.`, String);
    },
  ],
  decimals: [
    (r) => {
      const a = r.int(105, 999) / 100, b = r.int(105, 999) / 100;
      return mk(r, T.decimals, "easy", `${a.toFixed(2)} + ${b.toFixed(2)} = ?`, +(a + b).toFixed(2), [+(a + b + 0.1).toFixed(2), +(a + b - 1).toFixed(2), +(a + b + 1.01).toFixed(2)], `Line up the decimal points: ${a.toFixed(2)} + ${b.toFixed(2)} = ${(a + b).toFixed(2)}.`, (v) => v.toFixed(2));
    },
    (r) => {
      const a = r.int(11, 99) / 10, k = r.int(3, 9);
      return mk(r, T.decimals, "medium", `${a.toFixed(1)} × ${k} = ?`, +(a * k).toFixed(1), [+(a * k * 10).toFixed(1), +(a * k + 1).toFixed(1), +(a * k - 0.9).toFixed(1)], `${a.toFixed(1)} × ${k} = ${(a * k).toFixed(1)}.`, (v) => v.toFixed(1));
    },
    (r) => {
      const a = r.int(2001, 9999) / 100, b = r.int(101, 1999) / 100;
      return mk(r, T.decimals, "medium", `${a.toFixed(2)} − ${b.toFixed(2)} = ?`, +(a - b).toFixed(2), [+(a - b + 1).toFixed(2), +(a + b).toFixed(2), +(a - b - 0.1).toFixed(2)], `${a.toFixed(2)} − ${b.toFixed(2)} = ${(a - b).toFixed(2)}.`, (v) => v.toFixed(2));
    },
    (r) => {
      const vals = r.sample([0.5, 0.45, 0.405, 0.054, 0.55, 0.505, 0.0505], 4);
      const mx = Math.max(...vals);
      return mk(r, T.decimals, "hard", `Which is the greatest?`, String(mx), vals.filter((v) => v !== mx).map(String), `Compare digit by digit after the decimal point: ${mx} is the greatest.`, String);
    },
  ],
  convert: [
    (r) => {
      const [n, d] = r.pick([[1, 4], [3, 4], [1, 5], [2, 5], [3, 8], [7, 20], [9, 25], [1, 8], [3, 5], [11, 20]]);
      const v = n / d;
      return mk(r, T.convert, "easy", `Write ${n}/${d} as a decimal.`, String(v), [String(n / 10), String(+(v * 10).toFixed(3)), String(+(v + 0.05).toFixed(3))], `${n} ÷ ${d} = ${v}.`, String);
    },
    (r) => {
      const v = r.pick([0.25, 0.75, 0.2, 0.4, 0.6, 0.125, 0.35, 0.05, 0.8]);
      const den = 1000, num = Math.round(v * den), ans = frac(num, den);
      return mk(r, T.convert, "medium", `Write ${v} as a fraction in its lowest terms.`, ans, [frac(num, den / 10 || 1), `${Math.round(v * 100)}/10`, frac(num + 50, den)], `${v} = ${num}/${den} = ${ans}.`, String);
    },
    (r) => {
      const w = r.int(1, 5), [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [2, 5], [1, 5]]);
      const v = +(w + n / d).toFixed(2);
      return mk(r, T.convert, "medium", `Write the mixed number ${w} ${n}/${d} as a decimal.`, String(v), [String(+(w + n / 10).toFixed(2)), String(+(w + d / 10).toFixed(2)), String(+(v + 1).toFixed(2))], `${w} ${n}/${d} = ${w} + ${n / d} = ${v}.`, String);
    },
  ],
  simplify: [
    (r) => {
      const a = r.int(10, 50), b = r.int(2, 9), c = r.int(2, 9);
      const ans = a + b * c;
      return mk(r, T.simplify, "easy", `Simplify: ${a} + ${b} × ${c}`, ans, [(a + b) * c, a * b + c, ans + 1], `Multiply first (BODMAS): ${b} × ${c} = ${b * c}; then ${a} + ${b * c} = ${ans}.`);
    },
    (r) => {
      const c = r.int(2, 9), q = r.int(3, 12), a = c * q, b = r.int(5, 40), d = r.int(2, 6);
      const ans = a / c + b - d;
      return mk(r, T.simplify, "medium", `Simplify: ${a} ÷ ${c} + ${b} − ${d}`, ans, [a / (c + b) - d, ans + 2 * d, ans - 1], `Divide first: ${a} ÷ ${c} = ${q}; then ${q} + ${b} − ${d} = ${ans}.`);
    },
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), d = r.int(10, 30);
      const ans = (a + b) * c - d; if (ans <= 0) return null;
      return mk(r, T.simplify, "medium", `Simplify: (${a} + ${b}) × ${c} − ${d}`, ans, [a + b * c - d, (a + b) * (c - d), ans + c], `Brackets first: ${a + b}; × ${c} = ${(a + b) * c}; − ${d} = ${ans}.`);
    },
    (r) => {
      const a = r.int(100, 500), b = r.int(10, 99), c = r.int(2, 5), d = r.int(2, 5);
      const ans = a - b + c * d;
      return mk(r, T.simplify, "hard", `Simplify: ${a} − ${b} + ${c} × ${d}`, ans, [(a - b + c) * d, a - (b + c * d), ans - 2 * c * d], `${c} × ${d} = ${c * d}; ${a} − ${b} = ${a - b}; ${a - b} + ${c * d} = ${ans}.`);
    },
  ],
  approx: [
    (r) => {
      const n = r.int(1000, 9999), to = r.pick([10, 100, 1000]);
      const ans = Math.round(n / to) * to;
      return mk(r, T.approx, "easy", `Round off ${fmt(n)} to the nearest ${to === 10 ? "ten" : to === 100 ? "hundred" : "thousand"}.`, ans, [Math.floor(n / to) * to === ans ? Math.ceil(n / to) * to : Math.floor(n / to) * to, Math.round(n / (to * 10)) * to * 10, ans + to], `Look at the digit to the right of the ${to === 10 ? "tens" : to === 100 ? "hundreds" : "thousands"} place: ${fmt(n)} ≈ ${fmt(ans)}.`);
    },
    (r) => {
      const a = r.int(41, 98), b = r.int(21, 79);
      const ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10, ans = ra * rb;
      return mk(r, T.approx, "medium", `Estimate ${a} × ${b} by rounding each number to the nearest ten.`, ans, [a * b, (ra + 10) * rb, ra * (rb - 10)], `${a} ≈ ${ra}, ${b} ≈ ${rb}; ${ra} × ${rb} = ${fmt(ans)}.`);
    },
    (r) => {
      const a = r.int(2101, 8999), b = r.int(1101, 5999);
      const ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100, ans = ra + rb;
      return mk(r, T.approx, "medium", `Estimate ${fmt(a)} + ${fmt(b)} by rounding each number to the nearest hundred.`, ans, [a + b, ans + 100, ans - 100], `${fmt(a)} ≈ ${fmt(ra)}, ${fmt(b)} ≈ ${fmt(rb)}; sum ≈ ${fmt(ans)}.`);
    },
  ],
  percent: [
    (r) => {
      const p = r.pick([10, 20, 25, 30, 40, 50, 75, 15, 5]), n = r.pick([40, 60, 80, 120, 200, 240, 400, 500, 360]);
      const ans = (p * n) / 100; if (!Number.isInteger(ans)) return null;
      return mk(r, T.percent, "easy", `What is ${p}% of ${n}?`, ans, [n - ans, ans * 2, p + n / 10], `${p}% of ${n} = ${p}/100 × ${n} = ${ans}.`);
    },
    (r) => {
      const total = r.pick([40, 50, 60, 80, 120, 200]), got = r.int(1, total - 1), p = (got / total) * 100;
      if (!Number.isInteger(p)) return null;
      return mk(r, T.percent, "medium", `${r.pick(NAMES)} scored ${got} marks out of ${total}. What percentage is this?`, `${p}%`, [`${100 - p}%`, `${got}%`, `${p + 5}%`], `${got}/${total} × 100 = ${p}%.`, String);
    },
    (r) => {
      const students = r.pick([40, 50, 60, 80]), p = r.pick([25, 40, 45, 60, 75]);
      const girls = (students * p) / 100; if (!Number.isInteger(girls)) return null;
      return mk(r, T.percent, "medium", `In a class of ${students} students, ${p}% are girls. How many boys are there?`, students - girls, [girls, students - p, students / 2], `Girls = ${p}% of ${students} = ${girls}. Boys = ${students} − ${girls} = ${students - girls}.`);
    },
    (r) => {
      const price = r.pick([200, 400, 500, 800, 1200]), p = r.pick([10, 20, 25]);
      const ans = price + (price * p) / 100;
      return mk(r, T.percent, "hard", `The price of a bag was ${rs(price)}. It increased by ${p}%. What is the new price?`, ans, [price - (price * p) / 100, price + p, (price * p) / 100], `Increase = ${p}% of ${price} = ${(price * p) / 100}. New price = ${fmt(ans)}.`, rs);
    },
  ],
  profit: [
    (r) => {
      const cp = r.int(20, 90) * 10, p = r.int(2, 30) * 5;
      return mk(r, T.profit, "easy", `A shopkeeper buys a toy for ${rs(cp)} and sells it for ${rs(cp + p)}. What is the profit?`, p, [cp + p, cp - p, p + 10], `Profit = SP − CP = ${fmt(cp + p)} − ${fmt(cp)} = ${p}.`, rs);
    },
    (r) => {
      const cp = r.pick([200, 250, 400, 500, 800]), p = r.pick([10, 20, 25, 30]);
      const sp = cp + (cp * p) / 100;
      return mk(r, T.profit, "medium", `An article costing ${rs(cp)} is sold at a profit of ${p}%. Find the selling price.`, sp, [cp - (cp * p) / 100, cp + p, (cp * p) / 100], `Profit = ${p}% of ${cp} = ${(cp * p) / 100}. SP = ${fmt(sp)}.`, rs);
    },
    (r) => {
      const cp = r.pick([200, 400, 500, 250, 800]), l = r.pick([10, 20, 25]);
      const sp = cp - (cp * l) / 100;
      return mk(r, T.profit, "medium", `${r.pick(NAMES)} bought a cycle for ${rs(cp * 10)} and sold it at a loss of ${l}%. What was the selling price?`, sp * 10, [cp * 10 + (cp * l) / 10, (cp * l) / 10, cp * 10 - l], `Loss = ${l}% of ${fmt(cp * 10)} = ${fmt((cp * l) / 10)}. SP = ${fmt(sp * 10)}.`, rs);
    },
    (r) => {
      const cp = r.pick([200, 400, 500, 800]), sp = cp + r.pick([20, 40, 50, 100, 200]);
      const p = ((sp - cp) / cp) * 100; if (!Number.isInteger(p)) return null;
      return mk(r, T.profit, "hard", `CP = ${rs(cp)}, SP = ${rs(sp)}. What is the profit per cent?`, `${p}%`, [`${sp - cp}%`, `${p + 5}%`, `${Math.round(((sp - cp) / sp) * 100)}%`], `Profit = ${sp - cp}. Profit % = ${sp - cp}/${cp} × 100 = ${p}%.`, String);
    },
  ],
  si: [
    (r) => {
      const P = r.pick([1000, 2000, 2500, 4000, 5000]), R = r.pick([4, 5, 6, 8, 10]), Tt = r.int(2, 5);
      const si = (P * R * Tt) / 100;
      return mk(r, T.si, "medium", `Find the simple interest on ${rs(P)} at ${R}% per year for ${Tt} years.`, si, [(P * R) / 100, P + si, si + (P * R) / 100], `SI = P × R × T / 100 = ${P} × ${R} × ${Tt} / 100 = ${fmt(si)}.`, rs);
    },
    (r) => {
      const P = r.pick([1000, 1500, 2000, 3000]), R = r.pick([5, 10]), Tt = r.int(2, 4);
      const amt = P + (P * R * Tt) / 100;
      return mk(r, T.si, "hard", `What amount will ${rs(P)} become in ${Tt} years at ${R}% simple interest per year?`, amt, [(P * R * Tt) / 100, P + (P * R) / 100, amt + 100], `SI = ${(P * R * Tt) / 100}; Amount = ${P} + ${(P * R * Tt) / 100} = ${fmt(amt)}.`, rs);
    },
    (r) => {
      const P = r.pick([1000, 2000, 4000]), R = r.pick([5, 10]), Tt = r.int(2, 5), si = (P * R * Tt) / 100;
      return mk(r, T.si, "hard", `The simple interest on ${rs(P)} at ${R}% per year is ${rs(si)}. For how many years was the money kept?`, `${Tt} years`, [`${Tt + 1} years`, `${Tt - 1 || Tt + 2} years`, `${Tt * 2} years`], `T = SI × 100 / (P × R) = ${si} × 100 / (${P} × ${R}) = ${Tt} years.`, String);
    },
  ],
  speed: [
    (r) => {
      const s = r.pick([30, 40, 45, 50, 60]), t = r.int(2, 6);
      return mk(r, T.speed, "easy", `A bus travels at ${s} km per hour. How far will it travel in ${t} hours?`, `${s * t} km`, [`${s + t} km`, `${s * (t + 1)} km`, `${s * t - 10} km`], `Distance = speed × time = ${s} × ${t} = ${s * t} km.`, String);
    },
    (r) => {
      const s = r.pick([20, 25, 40, 50, 60]), t = r.int(2, 7), d = s * t;
      return mk(r, T.speed, "medium", `A car covers ${d} km in ${t} hours. What is its speed?`, `${s} km/h`, [`${s + 5} km/h`, `${d - t} km/h`, `${s * 2} km/h`], `Speed = distance ÷ time = ${d} ÷ ${t} = ${s} km/h.`, String);
    },
    (r) => {
      const s = r.pick([36, 54, 72, 90]);
      return mk(r, T.speed, "hard", `Convert ${s} km/h into metres per second.`, `${(s * 5) / 18} m/s`, [`${s / 2} m/s`, `${(s * 18) / 5} m/s`, `${(s * 5) / 18 + 5} m/s`], `${s} × 5/18 = ${(s * 5) / 18} m/s.`, String);
    },
    (r) => {
      const s = r.pick([4, 5, 6]), m = r.pick([30, 45, 90]);
      const d = (s * m) / 60; if (!Number.isInteger(d * 2)) return null;
      const who = r.pick(NAMES);
      return mk(r, T.speed, "medium", `${who} walks at ${s} km/h. How far will ${who} walk in ${m} minutes?`, `${d} km`, [`${s * m} km`, `${d + 1} km`, `${s} km`], `${m} minutes = ${m / 60} hour; distance = ${s} × ${m / 60} = ${d} km.`, String);
    },
  ],
  measure: [
    (r) => {
      const km = r.int(2, 9), m = r.int(50, 950);
      return mk(r, T.measure, "easy", `${km} km ${m} m = ? metres`, km * 1000 + m, [km * 100 + m, km * 1000 + m * 10, km * 10000 + m], `1 km = 1000 m, so ${km} km ${m} m = ${km * 1000} + ${m} = ${fmt(km * 1000 + m)} m.`);
    },
    (r) => {
      const kg = r.int(2, 9), g = r.int(100, 900);
      return mk(r, T.measure, "easy", `How many grams are there in ${kg} kg ${g} g?`, kg * 1000 + g, [kg * 100 + g, kg + g, kg * 1000 + g + 100], `${kg} × 1000 + ${g} = ${fmt(kg * 1000 + g)} g.`);
    },
    (r) => {
      const h1 = r.int(7, 10), m1 = r.pick([0, 15, 30, 45]), dur = r.int(70, 220);
      const end = h1 * 60 + m1 + dur, h2 = Math.floor(end / 60), m2 = end % 60;
      const tf = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "p.m." : "a.m."}`;
      return mk(r, T.measure, "medium", `A train leaves at ${tf(h1, m1)} and the journey takes ${Math.floor(dur / 60)} hours ${dur % 60} minutes. When does it arrive?`, tf(h2, m2), [tf(h2 + 1, m2), tf(h2, (m2 + 10) % 60), tf(h2 - 1 < 0 ? 0 : h2 - 1, m2)], `${tf(h1, m1)} + ${Math.floor(dur / 60)} h ${dur % 60} min = ${tf(h2, m2)}.`, String);
    },
    (r) => {
      const l = r.int(2, 9), ml = r.int(100, 900), bottles = r.pick([250, 500]);
      const total = l * 1000 + ml; if (total % bottles) return null;
      return mk(r, T.measure, "hard", `How many ${bottles} mL bottles can be filled from ${l} L ${ml} mL of milk?`, total / bottles, [total / bottles + 1, l * 2, total / 100], `${fmt(total)} mL ÷ ${bottles} = ${total / bottles} bottles.`);
    },
    (r) => {
      const notes = r.int(3, 9), coins = r.int(4, 19);
      const tot = notes * 50 + coins * 5;
      return mk(r, T.measure, "easy", `${r.pick(NAMES)} has ${notes} notes of ₹50 and ${coins} coins of ₹5. How much money is that?`, tot, [notes * 50 + coins, (notes + coins) * 50, tot + 50], `${notes} × 50 + ${coins} × 5 = ${notes * 50} + ${coins * 5} = ${tot}.`, rs);
    },
  ],
  area: [
    (r) => {
      const l = r.int(8, 30), b = r.int(4, l - 1);
      return mk(r, T.area, "easy", `Find the perimeter of a rectangle of length ${l} cm and breadth ${b} cm.`, `${2 * (l + b)} cm`, [`${l * b} cm`, `${l + b} cm`, `${2 * l + b} cm`], `Perimeter = 2 × (l + b) = 2 × (${l} + ${b}) = ${2 * (l + b)} cm.`, String);
    },
    (r) => {
      const s = r.int(5, 25);
      return mk(r, T.area, "easy", `Find the area of a square of side ${s} m.`, `${s * s} sq m`, [`${4 * s} sq m`, `${2 * s} sq m`, `${s * s + s} sq m`], `Area = side × side = ${s} × ${s} = ${s * s} sq m.`, String);
    },
    (r) => {
      const l = r.int(3, 12), b = r.int(2, 10), h = r.int(2, 9);
      return mk(r, T.area, "medium", `Find the volume of a box of length ${l} cm, breadth ${b} cm and height ${h} cm.`, `${l * b * h} cu cm`, [`${l + b + h} cu cm`, `${2 * (l * b + b * h + l * h)} cu cm`, `${l * b} cu cm`], `Volume = l × b × h = ${l} × ${b} × ${h} = ${l * b * h} cu cm.`, String);
    },
    (r) => {
      const P = r.pick([24, 32, 40, 48, 60, 80]), side = P / 4;
      return mk(r, T.area, "medium", `The perimeter of a square is ${P} cm. What is its area?`, `${side * side} sq cm`, [`${P * 4} sq cm`, `${side * 2} sq cm`, `${P} sq cm`], `Side = ${P} ÷ 4 = ${side} cm. Area = ${side} × ${side} = ${side * side} sq cm.`, String);
    },
    (r) => {
      const l = r.int(10, 25), b = r.int(6, 12), rate = r.pick([5, 10, 20]);
      const cost = 2 * (l + b) * rate;
      return mk(r, T.area, "hard", `A field is ${l} m long and ${b} m wide. What is the cost of fencing it at ${rs(rate)} per metre?`, cost, [l * b * rate, (l + b) * rate, cost + rate * 10], `Perimeter = 2 × (${l} + ${b}) = ${2 * (l + b)} m. Cost = ${2 * (l + b)} × ${rate} = ${fmt(cost)}.`, rs);
    },
  ],
};

export function buildArithmetic(rng, perTopic = 10) {
  const out = [];
  for (const [key, list] of Object.entries(gens)) {
    const seen = new Set();
    let made = 0, guard = 0;
    while (made < perTopic && guard++ < 500) {
      const g = list[guard % list.length];
      const qn = g(rng);
      const sig = qn ? qn.text + "|" + [...qn.options].sort().join("|") : "";
      if (!qn || seen.has(sig) || (list.length > 1 && [...seen].filter((x) => x.startsWith(qn.text + "|")).length >= 3)) continue;
      if (new Set(qn.options).size !== 4) continue;
      seen.add(sig);
      qn.topic = T[key];
      out.push(qn);
      made++;
    }
    if (made < perTopic) throw new Error(`arith ${key}: only ${made}`);
  }
  return out;
}
export const ARITH_TOPICS = Object.values(T);
