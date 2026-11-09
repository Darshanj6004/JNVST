// गणित चाचणी (Arithmetic Test) — मराठी माध्यम.
// सर्व उत्तरे संगणकाने काढलेली आहेत; हाताने टाईप केलेली नाहीत.
// Numbers are written in Devanagari digits (०-९) as in Marathi-medium textbooks.
import { arrange, uuidFrom } from "./lib.mjs";

const NAMES = ["रवी", "आशा", "सुनीता", "अर्जुन", "मीना", "किरण", "पूजा", "राहुल", "स्नेहा", "विकास", "अनिता", "रोहन", "प्रिया", "सचिन", "नेहा", "गणेश", "सई", "ओंकार", "प्रथमेश", "वैष्णवी"];
const DEV = "०१२३४५६७८९";
/** Convert ASCII digits to Devanagari digits. */
export const mr = (s) => String(s).replace(/[0-9]/g, (d) => DEV[d]);
const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString("en-IN") : String(+n.toFixed(3)));
const rs = (n) => `₹${fmt(n)}`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;
const frac = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const tod = (h, m) => {
  const part = h < 12 ? "सकाळी" : h < 16 ? "दुपारी" : h < 20 ? "सायंकाळी" : "रात्री";
  return `${part} ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`;
};

/** Build 3 distinct distractors near the answer. */
function near(ans, cands, show = fmt) {
  const out = [];
  const A = typeof ans === "string" ? ans : show(ans);
  const add = (v) => {
    if (v === undefined || v === null || Number.isNaN(v)) return;
    if (typeof v === "number" && v < 0) return;
    const s = typeof v === "string" ? v : show(v);
    if (s !== A && !out.includes(s)) out.push(s);
  };
  cands.forEach(add);
  let k = 1;
  while (out.length < 3 && k < 60 && typeof ans === "number") {
    const step = Number.isInteger(ans) ? 1 : 0.5;
    add(ans + k * step); add(ans - k * step); k++;
  }
  return out.slice(0, 3);
}

let counter = 0;
function mk(rng, topic, difficulty, text, ans, distractors, explanation, show = fmt) {
  const a = typeof ans === "string" ? ans : show(ans);
  const d = near(ans, distractors, show);
  const { options, correct } = arrange(rng, mr(a), d.map(mr));
  const key = `arimr:${topic}:${counter++}`;
  return { id: uuidFrom(key), key, subject: "arithmetic", topic, difficulty, text: mr(text), options, correct, explanation: mr(explanation) };
}

export const T = {
  numsys: "संख्याज्ञान (Number System)",
  ops: "मूलभूत क्रिया (Four Operations)",
  factors: "अवयव व पट (Factors & Multiples)",
  lcmhcf: "ल.सा.वि. व म.सा.वि. (LCM & HCF)",
  fractions: "अपूर्णांक (Fractions)",
  decimals: "दशांश अपूर्णांक (Decimals)",
  convert: "अपूर्णांक-दशांश रूपांतर (Conversion)",
  simplify: "सरलीकरण (Simplification)",
  approx: "अंदाज व आसन्न किंमत (Approximation)",
  percent: "शेकडेवारी (Percentage)",
  profit: "नफा-तोटा (Profit & Loss)",
  si: "सरळव्याज (Simple Interest)",
  speed: "अंतर, वेळ व वेग (Distance, Time & Speed)",
  measure: "मापन (Measurement)",
  area: "परिमिती, क्षेत्रफळ व घनफळ (Perimeter, Area & Volume)",
  ratio: "गुणोत्तर व प्रमाण (Ratio & Proportion)",
  average: "सरासरी (Average)",
};

const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const toRoman = (n) => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");
const PLACE = ["दशहजार", "हजार", "शतक", "दशक", "एकक"];

const gens = {
  numsys: [
    (r) => {
      const n = r.int(10000, 99999), digits = String(n), pos = r.int(0, 3), d = Number(digits[pos]);
      if (d === 0) return null;
      const place = 10 ** (4 - pos), ans = d * place;
      return mk(r, T.numsys, "easy", `${fmt(n)} या संख्येतील ${d} या अंकाची स्थानिक किंमत किती?`, ans, [d, d * place * 10, d * (place / 10 || 1)], `${d} हा अंक ${PLACE[pos]} स्थानी आहे; म्हणून स्थानिक किंमत = ${d} × ${fmt(place)} = ${fmt(ans)}.`);
    },
    (r) => {
      const n = r.int(14, 99);
      return mk(r, T.numsys, "easy", `${n} ही संख्या रोमन अंकांत कशी लिहितात?`, toRoman(n), [toRoman(n + 1), toRoman(n - 1), toRoman(n + 10 <= 99 ? n + 10 : n - 10)], `${n} = ${toRoman(n)}.`, String);
    },
    (r) => {
      const n = r.int(1000, 9999);
      return mk(r, T.numsys, "easy", `${fmt(n)} च्या लगेच नंतरची संख्या (उत्तरक) कोणती?`, n + 1, [n - 1, n + 10, n + 100], `उत्तरक = दिलेली संख्या + १ = ${fmt(n + 1)}.`);
    },
    (r) => {
      const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
      const big = Number([...ds].sort((a, b) => b - a).join(""));
      const asc = [...ds].sort((a, b) => a - b);
      if (asc[0] === 0) { const nz = asc.findIndex((x) => x > 0); [asc[0], asc[nz]] = [asc[nz], asc[0]]; }
      const small = Number(asc.join("")), diff = big - small;
      return mk(r, T.numsys, "medium", `${ds.join(", ")} हे अंक एकदाच वापरून तयार होणाऱ्या चार अंकी मोठ्यात मोठ्या व लहानात लहान संख्यांमधील फरक किती?`, diff, [big + small, diff + 9, diff - 90], `मोठी संख्या = ${fmt(big)}, लहान संख्या = ${fmt(small)}. फरक = ${fmt(diff)}.`);
    },
    (r) => {
      const n = r.int(10000, 99999), digits = String(n), pos = r.int(0, 4), d = Number(digits[pos]);
      if (d === 0) return null;
      const pv = d * 10 ** (4 - pos);
      return mk(r, T.numsys, "medium", `${fmt(n)} या संख्येतील ${d} च्या स्थानिक किमतीतून दर्शनी किंमत वजा केल्यास किती उरतात?`, pv - d, [pv, pv + d, d], `स्थानिक किंमत = ${fmt(pv)}, दर्शनी किंमत = ${d}. फरक = ${fmt(pv - d)}.`);
    },
    (r) => {
      const a = r.int(100, 999), b = r.int(100, 999);
      const lo = Math.min(a, b), hi = Math.max(a, b); if (hi - lo < 3) return null;
      return mk(r, T.numsys, "medium", `${lo} आणि ${hi} यांच्या दरम्यान (दोन्ही संख्या सोडून) किती पूर्ण संख्या आहेत?`, hi - lo - 1, [hi - lo, hi - lo + 1, hi - lo - 2], `${hi} − ${lo} − १ = ${hi - lo - 1}.`);
    },
    (r) => {
      const d = r.int(2, 9), a = r.int(1, 9), b = r.int(0, 9), c = r.int(0, 9);
      if (a === d || b === d || c === d) return null;
      const n = Number(`${d}${a}${d}${b}${c}`), ans = d * 10000 - d * 100;
      return mk(r, T.numsys, "hard", `${fmt(n)} या संख्येतील दोन ${d} अंकांच्या स्थानिक किमतींमधील फरक किती?`, ans, [d * 10000 + d * 100, d * 990, 0], `स्थानिक किमती ${fmt(d * 10000)} व ${fmt(d * 100)}. फरक = ${fmt(ans)}.`);
    },
    (r) => {
      const k = r.int(3, 5), ans = 9 * 10 ** (k - 1);
      return mk(r, T.numsys, "hard", `${k} अंकी एकूण किती संख्या आहेत?`, ans, [10 ** k, 10 ** k - 1, ans - 1], `सर्वांत लहान ${fmt(10 ** (k - 1))}, सर्वांत मोठी ${fmt(10 ** k - 1)}; एकूण = ${fmt(10 ** k - 1)} − ${fmt(10 ** (k - 1))} + १ = ${fmt(ans)}.`);
    },
    (r) => {
      const d = r.int(1, 9), z = r.int(3, 6), n = d * 10 ** z;
      return mk(r, T.numsys, "hard", `${fmt(n)} ही संख्या अक्षरांत लिहिताना तिच्यात एकूण किती शून्ये असतात?`, z, [z + 1, z - 1, z + 2], `${fmt(n)} मध्ये ${d} नंतर ${z} शून्ये आहेत.`);
    },
  ],
  ops: [
    (r) => {
      const a = r.int(1200, 9800), b = r.int(1100, 8900), name = r.pick(NAMES);
      return mk(r, T.ops, "easy", `${name}कडे ${rs(a)} होते. आणखी ${rs(b)} मिळाले. आता एकूण किती रुपये झाले?`, a + b, [a + b - 100, a + b + 10, Math.abs(a - b)], `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`, rs);
    },
    (r) => {
      const a = r.int(5000, 9999), b = r.int(1000, 4999);
      return mk(r, T.ops, "easy", `${fmt(a)} मधून किती वजा केल्यास ${fmt(b)} उरतील?`, a - b, [a + b, a - b + 10, a - b - 100], `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`);
    },
    (r) => {
      const per = r.int(12, 48), boxes = r.int(15, 65);
      return mk(r, T.ops, "medium", `एका खोक्यात ${per} पेन्सिली आहेत. अशा ${boxes} खोक्यांत एकूण किती पेन्सिली?`, per * boxes, [per * boxes + per, per * boxes - per, per + boxes], `${per} × ${boxes} = ${fmt(per * boxes)}.`);
    },
    (r) => {
      const each = r.int(15, 75), n = r.int(12, 40), total = each * n;
      return mk(r, T.ops, "medium", `${fmt(total)} आंबे ${n} टोपल्यांत सारखे भरले. प्रत्येक टोपलीत किती आंबे?`, each, [each + 1, each - 2, total - n], `${fmt(total)} ÷ ${n} = ${each}.`);
    },
    (r) => {
      const nb = r.int(2, 6), pb = r.int(18, 45), np = r.int(2, 5), pp = r.int(5, 15), paid = 500;
      const cost = nb * pb + np * pp; if (cost >= paid) return null;
      return mk(r, T.ops, "hard", `${r.pick(NAMES)}ने ${pb} रुपये दराने ${nb} वह्या आणि ${pp} रुपये दराने ${np} पेन घेतले व ₹५०० ची नोट दिली. किती रुपये परत मिळतील?`, paid - cost, [cost, paid - nb * pb, paid - cost + pp], `खर्च = ${nb} × ${pb} + ${np} × ${pp} = ${cost}. परत = ५०० − ${cost} = ${paid - cost}.`, rs);
    },
    (r) => {
      const seats = r.int(32, 56), buses = r.int(4, 9), extra = r.int(3, seats - 5), students = seats * buses + extra;
      return mk(r, T.ops, "hard", `${students} विद्यार्थी सहलीला जाणार आहेत. एका बसमध्ये ${seats} विद्यार्थी बसतात. प्रत्येकाला जागा मिळण्यासाठी किमान किती बस लागतील?`, buses + 1, [buses, buses + 2, Math.round(students / 10)], `${students} ÷ ${seats} = ${buses}, बाकी ${extra}. उरलेल्या ${extra} विद्यार्थ्यांसाठी आणखी एक बस, म्हणून ${buses + 1}.`);
    },
    (r) => {
      const salary = r.int(80, 200) * 100, spend = r.int(40, 70) * 100, months = r.int(3, 8);
      return mk(r, T.ops, "hard", `एका व्यक्तीचा मासिक पगार ${rs(salary)} आहे. ती दरमहा ${rs(spend)} खर्च करते. ${months} महिन्यांत तिची किती बचत होईल?`, (salary - spend) * months, [salary * months - spend, (salary - spend) * (months - 1), salary - spend], `दरमहा बचत = ${fmt(salary)} − ${fmt(spend)} = ${fmt(salary - spend)}; ${months} महिन्यांत = ${fmt((salary - spend) * months)}.`, rs);
    },
  ],
  factors: [
    (r) => {
      const n = r.int(6, 13), k = r.int(8, 15);
      return mk(r, T.factors, "easy", `${n} चा ${k} वा पट कोणता?`, n * k, [n * (k - 1), n * (k + 1), n + k], `${n} × ${k} = ${n * k}.`);
    },
    (r) => {
      const n = r.pick([2, 3, 4, 5, 6, 7, 8, 9]), lim = r.pick([30, 40, 50, 60, 70, 80, 90, 100]);
      const cnt = Math.floor(lim / n);
      return mk(r, T.factors, "easy", `१ ते ${lim} मध्ये ${n} चे किती पट आहेत?`, cnt, [cnt + 1, cnt - 1, lim - n], `${lim} ÷ ${n} = ${cnt} (पूर्ण भाग).`);
    },
    (r) => {
      const n = r.pick([12, 18, 20, 24, 28, 30, 36, 40, 45, 48, 60, 72]);
      const f = [...Array(n).keys()].map((x) => x + 1).filter((x) => n % x === 0);
      return mk(r, T.factors, "medium", `${n} चे एकूण किती अवयव आहेत?`, f.length, [f.length - 1, f.length + 1, f.length - 2], `${n} चे अवयव: ${f.join(", ")} — एकूण ${f.length}.`);
    },
    (r) => {
      const primes = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
      const p = r.pick(primes), comps = r.sample([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93], 3);
      return mk(r, T.factors, "medium", `खालीलपैकी मूळ संख्या कोणती?`, String(p), comps.map(String), `${p} ला फक्त १ व ${p} हेच अवयव आहेत. बाकीच्या संख्यांना इतर अवयव आहेत.`, String);
    },
    (r) => {
      const d = r.pick([3, 4, 6, 9, 11]), base = r.int(100, 900) * d;
      return mk(r, T.factors, "hard", `खालीलपैकी कोणत्या संख्येला ${d} ने निःशेष भाग जातो?`, String(base), [base + 1, base + 2, base - 1].map(String), `${fmt(base)} ÷ ${d} = ${fmt(base / d)}, बाकी ०.`, String);
    },
    (r) => {
      const n = r.pick([30, 42, 60, 66, 70, 84, 90, 105, 110, 126, 130, 154]);
      const ps = [2, 3, 5, 7, 11, 13].filter((p) => n % p === 0), sum = ps.reduce((a, b) => a + b, 0);
      return mk(r, T.factors, "hard", `${n} च्या सर्व मूळ अवयवांची बेरीज किती?`, sum, [sum + 2, sum - 1, ps.length], `${n} चे मूळ अवयव ${ps.join(", ")}; बेरीज = ${sum}.`);
    },
  ],
  lcmhcf: [
    (r) => {
      const g = r.int(2, 9), a = g * r.int(2, 9), b = g * r.int(2, 9); if (a === b) return null;
      const h = gcd(a, b);
      return mk(r, T.lcmhcf, "easy", `${a} आणि ${b} यांचा म.सा.वि. किती?`, h, [lcm(a, b), h * 2, Math.max(1, h - 1)], `${a} व ${b} दोघांना भाग जाणारी सर्वांत मोठी संख्या ${h}.`);
    },
    (r) => {
      const a = r.int(4, 18), b = r.int(4, 18); if (a === b) return null;
      const l = lcm(a, b);
      return mk(r, T.lcmhcf, "easy", `${a} आणि ${b} यांचा ल.सा.वि. किती?`, l, [a * b === l ? l * 2 : a * b, gcd(a, b), l + a], `${a} व ${b} दोघांनी भाग जाणारी सर्वांत लहान संख्या ${l}.`);
    },
    (r) => {
      const a = r.pick([10, 12, 15, 20]), b = r.pick([25, 30, 36, 40]), l = lcm(a, b);
      return mk(r, T.lcmhcf, "medium", `दोन घंटा अनुक्रमे ${a} मिनिटांनी व ${b} मिनिटांनी वाजतात. सकाळी ९ वाजता त्या एकत्र वाजल्या, तर किती मिनिटांनी पुन्हा एकत्र वाजतील?`, l, [a + b, gcd(a, b), l * 2], `ल.सा.वि.(${a}, ${b}) = ${l} मिनिटे.`);
    },
    (r) => {
      const g = r.pick([4, 5, 6, 8, 10, 12]), a = g * r.int(3, 9), b = g * r.int(3, 9); if (a === b || gcd(a, b) !== g) return null;
      return mk(r, T.lcmhcf, "medium", `${a} सेमी व ${b} सेमी लांबीच्या दोन फिती सारख्या लांबीच्या तुकड्यांत कापायच्या आहेत. प्रत्येक तुकडा जास्तीत जास्त किती सेमी लांब असेल?`, g, [lcm(a, b), g / 2, g + 2], `म.सा.वि.(${a}, ${b}) = ${g} सेमी.`);
    },
    (r) => {
      const a = r.pick([6, 8, 10, 12, 15]), b = r.pick([9, 14, 16, 18, 20]); if (a === b) return null;
      const l = lcm(a, b), rem = r.int(1, Math.min(a, b) - 1);
      return mk(r, T.lcmhcf, "hard", `${a} आणि ${b} ने भागल्यावर प्रत्येक वेळी ${rem} बाकी उरणारी सर्वांत लहान संख्या कोणती?`, l + rem, [l, l - rem, a * b + rem], `ल.सा.वि. = ${l}; उत्तर = ${l} + ${rem} = ${l + rem}.`);
    },
    (r) => {
      const h = r.int(3, 9), x = r.int(2, 7), y = r.int(2, 7); if (x === y || gcd(x, y) !== 1) return null;
      const a = h * x, b = h * y, l = lcm(a, b);
      return mk(r, T.lcmhcf, "hard", `दोन संख्यांचा म.सा.वि. ${h} व ल.सा.वि. ${l} आहे. त्यांपैकी एक संख्या ${a} असल्यास दुसरी संख्या कोणती?`, b, [l / h, a, b + h], `दोन संख्यांचा गुणाकार = म.सा.वि. × ल.सा.वि. = ${h * l}; दुसरी संख्या = ${h * l} ÷ ${a} = ${b}.`);
    },
  ],
  fractions: [
    (r) => {
      const d = r.pick([6, 8, 10, 12]), a = r.int(1, d - 2), b = r.int(1, d - a - 1);
      return mk(r, T.fractions, "easy", `${a}/${d} + ${b}/${d} = ?`, frac(a + b, d), [frac(a + b, 2 * d), frac(a * b, d), frac(a + b + 1, d)], `छेद सारखे: (${a} + ${b})/${d} = ${frac(a + b, d)}.`, String);
    },
    (r) => {
      const total = r.pick([24, 36, 40, 48, 60, 72, 120]), [n, d] = r.pick([[1, 4], [3, 4], [2, 3], [1, 3], [5, 6], [3, 8]]);
      if (total % d) return null;
      const ans = (total * n) / d;
      return mk(r, T.fractions, "easy", `${r.pick(NAMES)}ने ${total} पानांच्या पुस्तकाचा ${n}/${d} भाग वाचला. किती पाने वाचली?`, ans, [total - ans, total / d, ans + n], `${n}/${d} × ${total} = ${ans}.`);
    },
    (r) => {
      const [a, b] = r.pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5]]), [c, d] = r.pick([[1, 6], [1, 5], [1, 8], [3, 10], [1, 12]]);
      const n = a * d + c * b, den = b * d;
      return mk(r, T.fractions, "medium", `${a}/${b} + ${c}/${d} = ?`, frac(n, den), [frac(a + c, b + d), frac(Math.abs(a * d - c * b), den), frac(n + 1, den)], `छेद सारखे करून: ${a}/${b} + ${c}/${d} = ${frac(n, den)}.`, String);
    },
    (r) => {
      const opts = r.sample([[1, 2], [2, 3], [3, 4], [3, 5], [5, 8], [4, 7], [7, 10]], 4);
      const val = (f) => f[0] / f[1], big = opts.reduce((m, f) => (val(f) > val(m) ? f : m));
      return mk(r, T.fractions, "medium", `खालीलपैकी सर्वांत मोठा अपूर्णांक कोणता?`, `${big[0]}/${big[1]}`, opts.filter((f) => f !== big).map((f) => `${f[0]}/${f[1]}`), `दशांशात: ${opts.map((f) => `${f[0]}/${f[1]} = ${val(f).toFixed(2)}`).join(", ")}.`, String);
    },
    (r) => {
      const [n, d] = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [4, 7]]), k = r.int(3, 15), whole = d * k, part = n * k;
      return mk(r, T.fractions, "hard", `एका संख्येचा ${n}/${d} भाग ${part} आहे. ती संख्या कोणती?`, whole, [(part * n) / d, part + d, whole + k], `${n}/${d} भाग = ${part}, म्हणून १/${d} भाग = ${k}; संख्या = ${d} × ${k} = ${whole}.`);
    },
    (r) => {
      const total = r.pick([60, 72, 90, 120, 180, 240]);
      const [n1, d1] = r.pick([[1, 2], [1, 3], [1, 4]]), [n2, d2] = r.pick([[1, 3], [1, 4], [1, 5], [1, 6]]);
      const s1 = (total * n1) / d1; if (!Number.isInteger(s1)) return null;
      const rem = total - s1, s2 = (rem * n2) / d2; if (!Number.isInteger(s2)) return null;
      return mk(r, T.fractions, "hard", `${r.pick(NAMES)}कडे ${rs(total)} होते. त्यातील ${n1}/${d1} रक्कम पुस्तकांवर व उरलेल्या रकमेचा ${n2}/${d2} भाग दप्तरावर खर्च केला. किती रुपये उरले?`, rem - s2, [total - s1 - (total * n2) / d2, rem, s2], `पुस्तके: ${s1}; उरले ${rem}. दप्तर: ${n2}/${d2} × ${rem} = ${s2}. उरले ${rem - s2}.`, rs);
    },
  ],
  decimals: [
    (r) => {
      const a = r.int(105, 999) / 100, b = r.int(105, 999) / 100;
      return mk(r, T.decimals, "easy", `${a.toFixed(2)} + ${b.toFixed(2)} = ?`, +(a + b).toFixed(2), [+(a + b + 0.1).toFixed(2), +(a + b - 1).toFixed(2), +(a + b + 1.01).toFixed(2)], `दशांश चिन्ह एका रेषेत ठेवून: ${(a + b).toFixed(2)}.`, (v) => v.toFixed(2));
    },
    (r) => {
      const a = r.int(11, 99) / 100, k = r.pick([10, 100, 1000]);
      return mk(r, T.decimals, "easy", `${a.toFixed(2)} × ${k} = ?`, +(a * k).toFixed(2), [+((a * k) / 10).toFixed(2), +(a * k * 10).toFixed(2), +(a + k).toFixed(2)], `${k} ने गुणल्यास दशांश चिन्ह ${String(k).length - 1} स्थाने उजवीकडे सरकते: ${+(a * k).toFixed(2)}.`, (v) => String(v));
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
      const vals = r.sample([0.5, 0.45, 0.405, 0.054, 0.55, 0.505, 0.0505], 4), mx = Math.max(...vals);
      return mk(r, T.decimals, "hard", `खालीलपैकी सर्वांत मोठी संख्या कोणती?`, String(mx), vals.filter((v) => v !== mx).map(String), `दशांश चिन्हानंतरचे अंक क्रमाने तुलना करा: ${mx} सर्वांत मोठी.`, String);
    },
    (r) => {
      const price = r.int(12, 48) + r.pick([0.25, 0.5, 0.75]), qty = r.int(3, 8);
      return mk(r, T.decimals, "hard", `एका वहीची किंमत ₹${price} आहे. अशा ${qty} वह्यांची किंमत किती?`, +(price * qty).toFixed(2), [+(price * qty + 1).toFixed(2), +(price + qty).toFixed(2), +(price * (qty - 1)).toFixed(2)], `${price} × ${qty} = ${+(price * qty).toFixed(2)}.`, (v) => `₹${v}`);
    },
  ],
  convert: [
    (r) => {
      const [n, d] = r.pick([[1, 4], [3, 4], [1, 5], [2, 5], [3, 8], [7, 20], [9, 25], [1, 8], [3, 5], [11, 20]]);
      const v = n / d;
      return mk(r, T.convert, "easy", `${n}/${d} हा अपूर्णांक दशांशात लिहा.`, String(v), [String(n / 10), String(+(v * 10).toFixed(3)), String(+(v + 0.05).toFixed(3))], `${n} ÷ ${d} = ${v}.`, String);
    },
    (r) => {
      const p = r.pick([5, 12, 25, 35, 45, 60, 75, 80]);
      return mk(r, T.convert, "easy", `${p}% हे दशांशात कसे लिहाल?`, String(p / 100), [String(p / 10), String(p), String(p / 1000)], `${p}% = ${p}/१०० = ${p / 100}.`, String);
    },
    (r) => {
      const v = r.pick([0.25, 0.75, 0.2, 0.4, 0.6, 0.125, 0.35, 0.05, 0.8]);
      const num = Math.round(v * 1000), ans = frac(num, 1000);
      return mk(r, T.convert, "medium", `${v} हा दशांश अपूर्णांक संक्षिप्त रूपात लिहा.`, ans, [frac(num, 100), `${Math.round(v * 100)}/10`, frac(num + 50, 1000)], `${v} = ${num}/१००० = ${ans}.`, String);
    },
    (r) => {
      const w = r.int(1, 5), [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [2, 5], [1, 5]]);
      const v = +(w + n / d).toFixed(2);
      return mk(r, T.convert, "medium", `${w} ${n}/${d} ही मिश्र संख्या दशांशात लिहा.`, String(v), [String(+(w + n / 10).toFixed(2)), String(+(w + d / 10).toFixed(2)), String(+(v + 1).toFixed(2))], `${w} + ${n / d} = ${v}.`, String);
    },
    (r) => {
      const [n, d] = r.pick([[3, 8], [1, 4], [3, 4], [1, 8], [2, 5], [7, 20]]), dec = r.pick([0.25, 0.5, 0.75, 0.125, 0.2]);
      const v = +(n / d + dec).toFixed(3);
      return mk(r, T.convert, "hard", `${n}/${d} + ${dec} = ? (उत्तर दशांशात)`, String(v), [String(+(n / d).toFixed(3)), String(+(v + 0.1).toFixed(3)), String(+((n + dec) / d).toFixed(3))], `${n}/${d} = ${n / d}; ${n / d} + ${dec} = ${v}.`, String);
    },
  ],
  simplify: [
    (r) => {
      const a = r.int(10, 50), b = r.int(2, 9), c = r.int(2, 9), ans = a + b * c;
      return mk(r, T.simplify, "easy", `सोडवा: ${a} + ${b} × ${c}`, ans, [(a + b) * c, a * b + c, ans + 1], `आधी गुणाकार: ${b} × ${c} = ${b * c}; नंतर ${a} + ${b * c} = ${ans}.`);
    },
    (r) => {
      const a = r.int(20, 90), b = r.int(5, 19), c = r.int(2, 9), ans = a - b + c;
      return mk(r, T.simplify, "easy", `सोडवा: ${a} − ${b} + ${c}`, ans, [a - (b + c), ans + 2, a + b - c], `डावीकडून: ${a} − ${b} = ${a - b}; ${a - b} + ${c} = ${ans}.`);
    },
    (r) => {
      const c = r.int(2, 9), q = r.int(3, 12), a = c * q, b = r.int(5, 40), d = r.int(2, 6), ans = q + b - d;
      return mk(r, T.simplify, "medium", `सोडवा: ${a} ÷ ${c} + ${b} − ${d}`, ans, [ans + 2 * d, ans - 1, ans + c], `आधी भागाकार: ${a} ÷ ${c} = ${q}; ${q} + ${b} − ${d} = ${ans}.`);
    },
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), d = r.int(10, 30), ans = (a + b) * c - d; if (ans <= 0) return null;
      return mk(r, T.simplify, "medium", `सोडवा: (${a} + ${b}) × ${c} − ${d}`, ans, [a + b * c - d, ans + c, ans - a], `आधी कंस: ${a + b}; × ${c} = ${(a + b) * c}; − ${d} = ${ans}.`);
    },
    (r) => {
      const a = r.int(100, 500), b = r.int(10, 99), c = r.int(2, 5), d = r.int(2, 5), ans = a - b + c * d;
      return mk(r, T.simplify, "hard", `सोडवा: ${a} − ${b} + ${c} × ${d}`, ans, [(a - b + c) * d, a - (b + c * d), ans - 2 * c * d], `${c} × ${d} = ${c * d}; ${a} − ${b} = ${a - b}; ${a - b} + ${c * d} = ${ans}.`);
    },
    (r) => {
      const x = r.int(2, 9), y = r.int(2, 9), z = r.int(1, 9), ans = x * x + y * y - z;
      return mk(r, T.simplify, "hard", `सोडवा: ${x} × ${x} + ${y} × ${y} − ${z}`, ans, [(x + y) * (x + y) - z, x * x + y * y + z, 2 * x + 2 * y - z], `${x * x} + ${y * y} − ${z} = ${ans}.`);
    },
  ],
  approx: [
    (r) => {
      const n = r.int(1000, 9999), to = r.pick([10, 100, 1000]), ans = Math.round(n / to) * to;
      const name = to === 10 ? "दशक" : to === 100 ? "शतक" : "हजार";
      return mk(r, T.approx, "easy", `${fmt(n)} ही संख्या जवळच्या ${name} पर्यंत पूर्णांकित करा.`, ans, [Math.floor(n / to) * to === ans ? Math.ceil(n / to) * to : Math.floor(n / to) * to, Math.round(n / (to * 10)) * to * 10, ans + to], `${fmt(n)} ≈ ${fmt(ans)}.`);
    },
    (r) => {
      const a = r.int(41, 98), b = r.int(21, 79), ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10, ans = ra * rb;
      return mk(r, T.approx, "medium", `${a} × ${b} चा अंदाजे गुणाकार (दोन्ही संख्या जवळच्या दशकापर्यंत पूर्णांकित करून) किती?`, ans, [a * b, (ra + 10) * rb, ra * (rb - 10)], `${a} ≈ ${ra}, ${b} ≈ ${rb}; ${ra} × ${rb} = ${fmt(ans)}.`);
    },
    (r) => {
      const a = r.int(2101, 8999), b = r.int(1101, 5999), ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
      return mk(r, T.approx, "medium", `${fmt(a)} + ${fmt(b)} ची अंदाजे बेरीज (जवळच्या शतकापर्यंत पूर्णांकित करून) किती?`, ra + rb, [a + b, ra + rb + 100, ra + rb - 100], `${fmt(a)} ≈ ${fmt(ra)}, ${fmt(b)} ≈ ${fmt(rb)}; बेरीज ≈ ${fmt(ra + rb)}.`);
    },
    (r) => {
      const b = r.pick([19, 21, 29, 31, 39, 41, 49, 51]), q0 = r.int(12, 60), a = b * q0 + r.int(-8, 8);
      const rb = Math.round(b / 10) * 10, est = Math.round(a / rb);
      return mk(r, T.approx, "hard", `${fmt(a)} ÷ ${b} चा सर्वोत्तम अंदाज कोणता? (भाजक जवळच्या दशकापर्यंत पूर्णांकित करा.)`, est, [est * 10, Math.round(a / 100), est + 10], `${b} ≈ ${rb}; ${fmt(a)} ÷ ${rb} ≈ ${est}.`);
    },
    (r) => {
      const a = r.int(301, 899), b = r.int(301, 899), ra = Math.round(a / 100) * 100, rb = Math.round(b / 100) * 100;
      if (ra === rb) return null;
      return mk(r, T.approx, "hard", `${Math.max(a, b)} − ${Math.min(a, b)} या वजाबाकीचे जवळच्या शतकापर्यंत पूर्णांकित करून अंदाजे उत्तर किती?`, Math.abs(ra - rb), [Math.abs(a - b), Math.abs(ra - rb) + 100, ra + rb], `${a} ≈ ${ra}, ${b} ≈ ${rb}; फरक ≈ ${Math.abs(ra - rb)}.`);
    },
  ],
  percent: [
    (r) => {
      const p = r.pick([10, 20, 25, 30, 40, 50, 75, 15, 5]), n = r.pick([40, 60, 80, 120, 200, 240, 400, 500, 360]);
      const ans = (p * n) / 100; if (!Number.isInteger(ans)) return null;
      return mk(r, T.percent, "easy", `${n} चे ${p}% किती?`, ans, [n - ans, ans * 2, p + n / 10], `${p}/१०० × ${n} = ${ans}.`);
    },
    (r) => {
      const total = r.pick([40, 50, 60, 80, 120, 200]), got = r.int(1, total - 1), p = (got / total) * 100;
      if (!Number.isInteger(p)) return null;
      return mk(r, T.percent, "medium", `${r.pick(NAMES)}ला ${total} पैकी ${got} गुण मिळाले. हे किती टक्के?`, `${p}%`, [`${100 - p}%`, `${got}%`, `${p + 5}%`], `${got}/${total} × १०० = ${p}%.`, String);
    },
    (r) => {
      const students = r.pick([40, 50, 60, 80]), p = r.pick([25, 40, 45, 60, 75]), girls = (students * p) / 100;
      if (!Number.isInteger(girls)) return null;
      return mk(r, T.percent, "medium", `${students} विद्यार्थ्यांच्या वर्गात ${p}% मुली आहेत. मुले किती?`, students - girls, [girls, students - p, students / 2], `मुली = ${girls}; मुले = ${students} − ${girls} = ${students - girls}.`);
    },
    (r) => {
      const price = r.pick([200, 400, 500, 800, 1200]), p = r.pick([10, 20, 25]), ans = price + (price * p) / 100;
      return mk(r, T.percent, "hard", `एका दप्तराची किंमत ${rs(price)} होती. ती ${p}% ने वाढली. नवी किंमत किती?`, ans, [price - (price * p) / 100, price + p, (price * p) / 100], `वाढ = ${(price * p) / 100}; नवी किंमत = ${fmt(ans)}.`, rs);
    },
    (r) => {
      const p = r.pick([10, 20, 25, 40, 50]), whole = r.pick([80, 120, 160, 200, 240, 400]), part = (whole * p) / 100;
      return mk(r, T.percent, "hard", `एका संख्येचे ${p}% म्हणजे ${part}. ती संख्या कोणती?`, whole, [(part * p) / 100, part * 2, whole + p], `${p}% = ${part}, म्हणून १% = ${part / p}; १००% = ${whole}.`);
    },
  ],
  profit: [
    (r) => {
      const cp = r.int(20, 90) * 10, p = r.int(2, 30) * 5;
      return mk(r, T.profit, "easy", `दुकानदाराने एक खेळणे ${rs(cp)} ला घेऊन ${rs(cp + p)} ला विकले. नफा किती?`, p, [cp + p, cp - p, p + 10], `नफा = विक्री − खरेदी = ${cp + p} − ${cp} = ${p}.`, rs);
    },
    (r) => {
      const cp = r.int(20, 90) * 10, l = r.int(2, 15) * 5;
      return mk(r, T.profit, "easy", `एक वस्तू ${rs(cp)} ला घेऊन ${rs(cp - l)} ला विकली. तोटा किती?`, l, [cp - l, cp + l, l + 10], `तोटा = खरेदी − विक्री = ${cp} − ${cp - l} = ${l}.`, rs);
    },
    (r) => {
      const cp = r.pick([200, 250, 400, 500, 800]), p = r.pick([10, 20, 25, 30]), sp = cp + (cp * p) / 100;
      return mk(r, T.profit, "medium", `${rs(cp)} खरेदी किमतीची वस्तू ${p}% नफ्याने विकली. विक्री किंमत किती?`, sp, [cp - (cp * p) / 100, cp + p, (cp * p) / 100], `नफा = ${(cp * p) / 100}; विक्री किंमत = ${fmt(sp)}.`, rs);
    },
    (r) => {
      const cp = r.int(20, 80) * 10, p = r.int(2, 20) * 5;
      return mk(r, T.profit, "medium", `एक घड्याळ ${rs(cp + p)} ला विकल्याने ${rs(p)} नफा झाला. त्याची खरेदी किंमत किती?`, cp, [cp + 2 * p, cp + p, p], `खरेदी = विक्री − नफा = ${cp + p} − ${p} = ${cp}.`, rs);
    },
    (r) => {
      const cp = r.pick([200, 400, 500, 800]), sp = cp + r.pick([20, 40, 50, 100, 200]), p = ((sp - cp) / cp) * 100;
      if (!Number.isInteger(p)) return null;
      return mk(r, T.profit, "hard", `खरेदी किंमत ${rs(cp)}, विक्री किंमत ${rs(sp)}. नफा शेकडा किती?`, `${p}%`, [`${sp - cp}%`, `${p + 5}%`, `${Math.round(((sp - cp) / sp) * 100)}%`], `नफा = ${sp - cp}; नफा % = ${sp - cp}/${cp} × १०० = ${p}%.`, String);
    },
    (r) => {
      const a = r.pick([200, 300, 400, 500]), b = r.pick([200, 300, 400, 500]), g = r.pick([10, 20, 25]), l = r.pick([10, 20]);
      const net = (a * g) / 100 - (b * l) / 100; if (net === 0) return null;
      const ans = net > 0 ? `₹${net} नफा` : `₹${-net} तोटा`;
      return mk(r, T.profit, "hard", `दुकानदाराने ${rs(a)} ची एक वस्तू ${g}% नफ्याने आणि ${rs(b)} ची दुसरी वस्तू ${l}% तोट्याने विकली. एकूण व्यवहारात काय झाले?`, ans, [net > 0 ? `₹${net} तोटा` : `₹${-net} नफा`, `₹${(a * g) / 100 + (b * l) / 100} नफा`, "नफा नाही, तोटा नाही"], `पहिल्यावर नफा ${(a * g) / 100}; दुसऱ्यावर तोटा ${(b * l) / 100}; एकूण ${ans}.`, String);
    },
  ],
  si: [
    (r) => {
      const P = r.pick([100, 200, 500, 1000]), R = r.pick([5, 8, 10, 12]);
      return mk(r, T.si, "easy", `${rs(P)} चे द.सा.द.शे. ${R} दराने १ वर्षाचे सरळव्याज किती?`, (P * R) / 100, [P + (P * R) / 100, R, (P * R) / 10], `सरळव्याज = ${P} × ${R} × १ / १०० = ${(P * R) / 100}.`, rs);
    },
    (r) => {
      const P = r.pick([1000, 2000, 2500, 4000, 5000]), R = r.pick([4, 5, 6, 8, 10]), Tt = r.int(2, 5), si = (P * R * Tt) / 100;
      return mk(r, T.si, "medium", `${rs(P)} चे द.सा.द.शे. ${R} दराने ${Tt} वर्षांचे सरळव्याज किती?`, si, [(P * R) / 100, P + si, si + (P * R) / 100], `सरळव्याज = मुद्दल × दर × मुदत / १०० = ${P} × ${R} × ${Tt} / १०० = ${fmt(si)}.`, rs);
    },
    (r) => {
      const P = r.pick([500, 1000, 2000]), Tt = r.int(2, 5), R = r.pick([4, 5, 8, 10]), si = (P * R * Tt) / 100;
      return mk(r, T.si, "medium", `${rs(P)} चे ${Tt} वर्षांचे सरळव्याज ${rs(si)} आहे. व्याजाचा दर किती?`, `${R}%`, [`${R + 1}%`, `${R * 2}%`, `${Tt}%`], `दर = सरळव्याज × १०० / (मुद्दल × मुदत) = ${R}%.`, String);
    },
    (r) => {
      const P = r.pick([1000, 1500, 2000, 3000]), R = r.pick([5, 10]), Tt = r.int(2, 4), amt = P + (P * R * Tt) / 100;
      return mk(r, T.si, "hard", `${rs(P)} ही रक्कम द.सा.द.शे. ${R} दराने ${Tt} वर्षांत किती रास होईल?`, amt, [(P * R * Tt) / 100, P + (P * R) / 100, amt + 100], `व्याज = ${(P * R * Tt) / 100}; रास = ${P} + ${(P * R * Tt) / 100} = ${fmt(amt)}.`, rs);
    },
    (r) => {
      const P = r.pick([1000, 2000, 4000]), R = r.pick([5, 10]), Tt = r.int(2, 5), si = (P * R * Tt) / 100;
      return mk(r, T.si, "hard", `${rs(P)} चे द.सा.द.शे. ${R} दराने सरळव्याज ${rs(si)} झाले. मुदत किती वर्षे?`, `${Tt} वर्षे`, [`${Tt + 1} वर्षे`, `${Tt - 1 || Tt + 2} वर्षे`, `${Tt * 2} वर्षे`], `मुदत = ${si} × १०० / (${P} × ${R}) = ${Tt} वर्षे.`, String);
    },
  ],
  speed: [
    (r) => {
      const s = r.pick([30, 40, 45, 50, 60]), t = r.int(2, 6);
      return mk(r, T.speed, "easy", `एक बस ताशी ${s} किमी वेगाने जाते. ${t} तासांत ती किती अंतर जाईल?`, `${s * t} किमी`, [`${s + t} किमी`, `${s * (t + 1)} किमी`, `${s * t - 10} किमी`], `अंतर = वेग × वेळ = ${s} × ${t} = ${s * t} किमी.`, String);
    },
    (r) => {
      const s = r.pick([10, 12, 15, 20]), t = r.int(2, 5);
      return mk(r, T.speed, "easy", `${r.pick(NAMES)}च्या सायकलचा वेग ताशी ${s} किमी आहे. ${t} तासांत सायकलने किती किमी अंतर कापले जाईल?`, `${s * t} किमी`, [`${s + t} किमी`, `${s * t + s} किमी`, `${s * t - 5} किमी`], `${s} × ${t} = ${s * t} किमी.`, String);
    },
    (r) => {
      const s = r.pick([20, 25, 40, 50, 60]), t = r.int(2, 7), d = s * t;
      return mk(r, T.speed, "medium", `एक मोटार ${d} किमी अंतर ${t} तासांत जाते. तिचा वेग किती?`, `${s} किमी/तास`, [`${s + 5} किमी/तास`, `${d - t} किमी/तास`, `${s * 2} किमी/तास`], `वेग = अंतर ÷ वेळ = ${d} ÷ ${t} = ${s} किमी/तास.`, String);
    },
    (r) => {
      const s = r.pick([4, 5, 6]), m = r.pick([30, 45, 90]), d = (s * m) / 60; if (!Number.isInteger(d * 2)) return null;
      return mk(r, T.speed, "medium", `${r.pick(NAMES)}चा चालण्याचा वेग ताशी ${s} किमी आहे. ${m} मिनिटांत किती अंतर चालून होईल?`, `${d} किमी`, [`${s * m} किमी`, `${d + 1} किमी`, `${s} किमी`], `${m} मिनिटे = ${m / 60} तास; अंतर = ${s} × ${m / 60} = ${d} किमी.`, String);
    },
    (r) => {
      const s = r.pick([36, 54, 72, 90]);
      return mk(r, T.speed, "hard", `ताशी ${s} किमी हा वेग मीटर/सेकंदात किती?`, `${(s * 5) / 18} मी/सेकंद`, [`${s / 2} मी/सेकंद`, `${(s * 18) / 5} मी/सेकंद`, `${(s * 5) / 18 + 5} मी/सेकंद`], `${s} × ५/१८ = ${(s * 5) / 18} मी/सेकंद.`, String);
    },
    (r) => {
      const s = r.pick([40, 48, 60, 80]), d = s * r.int(2, 5) + s / 2, h = Math.floor(d / s), m = Math.round((d / s - h) * 60);
      return mk(r, T.speed, "hard", `एक आगगाडी ताशी ${s} किमी वेगाने धावते. ${d} किमी अंतर जाण्यास तिला किती वेळ लागेल?`, `${h} तास ${m} मिनिटे`, [`${h} तास`, `${h + 1} तास ${m} मिनिटे`, `${h} तास ${m + 15} मिनिटे`], `वेळ = ${d} ÷ ${s} = ${d / s} तास = ${h} तास ${m} मिनिटे.`, String);
    },
  ],
  measure: [
    (r) => {
      const km = r.int(2, 9), m = r.int(50, 950);
      return mk(r, T.measure, "easy", `${km} किमी ${m} मी = किती मीटर?`, km * 1000 + m, [km * 100 + m, km * 1000 + m * 10, km * 10000 + m], `१ किमी = १००० मी; ${km * 1000} + ${m} = ${fmt(km * 1000 + m)} मी.`);
    },
    (r) => {
      const kg = r.int(2, 9), g = r.int(100, 900);
      return mk(r, T.measure, "easy", `${kg} किग्रॅ ${g} ग्रॅ मध्ये किती ग्रॅम आहेत?`, kg * 1000 + g, [kg * 100 + g, kg + g, kg * 1000 + g + 100], `${kg} × १००० + ${g} = ${fmt(kg * 1000 + g)} ग्रॅ.`);
    },
    (r) => {
      const notes = r.int(3, 9), coins = r.int(4, 19), tot = notes * 50 + coins * 5;
      return mk(r, T.measure, "easy", `${r.pick(NAMES)}कडे ₹५० च्या ${notes} नोटा आणि ₹५ ची ${coins} नाणी आहेत. एकूण किती रुपये?`, tot, [notes * 50 + coins, (notes + coins) * 50, tot + 50], `${notes} × ५० + ${coins} × ५ = ${tot}.`, rs);
    },
    (r) => {
      const h1 = r.int(7, 10), m1 = r.pick([0, 15, 30, 45]), dur = r.int(70, 220);
      const end = h1 * 60 + m1 + dur, h2 = Math.floor(end / 60), m2 = end % 60;
      return mk(r, T.measure, "medium", `एक आगगाडी ${tod(h1, m1)} वाजता सुटते आणि प्रवासाला ${Math.floor(dur / 60)} तास ${dur % 60} मिनिटे लागतात. ती किती वाजता पोहोचेल?`, tod(h2, m2), [tod(h2 + 1, m2), tod(h2, (m2 + 10) % 60), tod(Math.max(0, h2 - 1), m2)], `${tod(h1, m1)} + ${Math.floor(dur / 60)} तास ${dur % 60} मिनिटे = ${tod(h2, m2)}.`, String);
    },
    (r) => {
      const days = r.pick([2, 3, 4, 5, 6, 7]), h = days * 24;
      return mk(r, T.measure, "medium", `${days} दिवसांत किती तास असतात?`, h, [days * 12, h + 24, days * 60], `१ दिवस = २४ तास; ${days} × २४ = ${h}.`);
    },
    (r) => {
      const l = r.int(2, 9), ml = r.pick([250, 500, 750]), bottles = r.pick([250, 500]), total = l * 1000 + ml;
      if (total % bottles) return null;
      return mk(r, T.measure, "hard", `${l} लीटर ${ml} मिलि दुधातून ${bottles} मिलिच्या किती बाटल्या भरतील?`, total / bottles, [total / bottles + 1, l * 2, total / 100], `${fmt(total)} मिलि ÷ ${bottles} = ${total / bottles}.`);
    },
    (r) => {
      const m = r.int(2, 9), cm = r.int(10, 90), pieces = r.pick([5, 10, 20, 25]), total = m * 100 + cm;
      if (total % pieces) return null;
      return mk(r, T.measure, "hard", `${m} मी ${cm} सेमी लांबीच्या दोरीचे ${pieces} सारखे तुकडे केले. प्रत्येक तुकडा किती सेमी?`, total / pieces, [total / pieces + 1, total / pieces + 2, total], `${total} सेमी ÷ ${pieces} = ${total / pieces} सेमी.`);
    },
  ],
  area: [
    (r) => {
      const l = r.int(8, 30), b = r.int(4, l - 1);
      return mk(r, T.area, "easy", `लांबी ${l} सेमी व रुंदी ${b} सेमी असलेल्या आयताची परिमिती किती?`, `${2 * (l + b)} सेमी`, [`${l * b} सेमी`, `${l + b} सेमी`, `${2 * l + b} सेमी`], `परिमिती = २ × (${l} + ${b}) = ${2 * (l + b)} सेमी.`, String);
    },
    (r) => {
      const s = r.int(5, 25);
      return mk(r, T.area, "easy", `बाजू ${s} मी असलेल्या चौरसाचे क्षेत्रफळ किती?`, `${s * s} चौ.मी.`, [`${4 * s} चौ.मी.`, `${2 * s} चौ.मी.`, `${s * s + s} चौ.मी.`], `क्षेत्रफळ = बाजू × बाजू = ${s * s} चौ.मी.`, String);
    },
    (r) => {
      const l = r.int(3, 12), b = r.int(2, 10), h = r.int(2, 9);
      return mk(r, T.area, "medium", `लांबी ${l} सेमी, रुंदी ${b} सेमी व उंची ${h} सेमी असलेल्या खोक्याचे घनफळ किती?`, `${l * b * h} घन सेमी`, [`${l + b + h} घन सेमी`, `${2 * (l * b + b * h + l * h)} घन सेमी`, `${l * b} घन सेमी`], `घनफळ = ${l} × ${b} × ${h} = ${l * b * h} घन सेमी.`, String);
    },
    (r) => {
      const P = r.pick([24, 32, 40, 48, 60, 80]), side = P / 4;
      return mk(r, T.area, "medium", `एका चौरसाची परिमिती ${P} सेमी आहे. त्याचे क्षेत्रफळ किती?`, `${side * side} चौ.सेमी.`, [`${P * 4} चौ.सेमी.`, `${side * 2} चौ.सेमी.`, `${P} चौ.सेमी.`], `बाजू = ${P} ÷ ४ = ${side}; क्षेत्रफळ = ${side * side} चौ.सेमी.`, String);
    },
    (r) => {
      const l = r.int(10, 25), b = r.int(6, 12), rate = r.pick([5, 10, 20]), cost = 2 * (l + b) * rate;
      return mk(r, T.area, "hard", `${l} मी लांब व ${b} मी रुंद शेताला ₹${rate} प्रति मीटर दराने कुंपण घालण्याचा खर्च किती?`, cost, [l * b * rate, (l + b) * rate, cost + rate * 10], `परिमिती = ${2 * (l + b)} मी; खर्च = ${2 * (l + b)} × ${rate} = ${fmt(cost)}.`, rs);
    },
    (r) => {
      const s = r.pick([2, 3, 4, 5, 6, 7, 8]);
      return mk(r, T.area, "hard", `बाजू ${s} सेमी असलेल्या घनाचे घनफळ किती?`, `${s ** 3} घन सेमी`, [`${s * s} घन सेमी`, `${6 * s * s} घन सेमी`, `${3 * s} घन सेमी`], `घनफळ = ${s} × ${s} × ${s} = ${s ** 3} घन सेमी.`, String);
    },
  ],
  ratio: [
    (r) => {
      const a = r.int(2, 9) * r.int(2, 6), b = r.int(2, 9) * r.int(2, 6), g = gcd(a, b); if (a === b) return null;
      return mk(r, T.ratio, "easy", `${a} : ${b} हे गुणोत्तर संक्षिप्त रूपात लिहा.`, `${a / g} : ${b / g}`, [`${b / g} : ${a / g}`, `${a} : ${b / g}`, `${a / g + 1} : ${b / g}`], `म.सा.वि. ${g}; ${a} : ${b} = ${a / g} : ${b / g}.`, String);
    },
    (r) => {
      const boys = r.int(10, 30), girls = r.int(10, 30), g = gcd(boys, girls); if (boys === girls) return null;
      return mk(r, T.ratio, "easy", `एका वर्गात ${boys} मुले व ${girls} मुली आहेत. मुलांचे मुलींशी गुणोत्तर किती?`, `${boys / g} : ${girls / g}`, [`${girls / g} : ${boys / g}`, `${boys} : ${boys + girls}`, `${boys / g + 1} : ${girls / g}`], `${boys} : ${girls} = ${boys / g} : ${girls / g}.`, String);
    },
    (r) => {
      const x = r.int(1, 5), y = r.int(1, 5), k = r.int(5, 20); if (x === y) return null;
      const total = (x + y) * k;
      return mk(r, T.ratio, "medium", `${rs(total)} रवी व आशा यांच्यात ${x} : ${y} या प्रमाणात वाटले. आशाला किती रुपये मिळाले?`, y * k, [x * k, total / 2, y * k + k], `एकूण भाग ${x + y}; एक भाग = ${k}; आशा = ${y} × ${k} = ${y * k}.`, rs);
    },
    (r) => {
      const n = r.int(3, 8), cost = r.int(12, 60) * n, m = r.int(9, 20);
      return mk(r, T.ratio, "medium", `${n} पेनांची किंमत ${rs(cost)} आहे, तर ${m} पेनांची किंमत किती?`, (cost / n) * m, [cost * m, (cost / n) * (m - 1), cost + m], `एक पेन = ${cost / n}; ${m} पेन = ${(cost / n) * m}.`, rs);
    },
    (r) => {
      const men = r.pick([4, 6, 8, 10, 12]), days = r.pick([6, 9, 10, 12, 15]), men2 = r.pick([2, 3, 4, 5, 6, 15, 20, 24, 30]);
      const d2 = (men * days) / men2; if (!Number.isInteger(d2) || men2 === men) return null;
      return mk(r, T.ratio, "hard", `${men} कामगार एक भिंत ${days} दिवसांत बांधतात. तीच भिंत ${men2} कामगार किती दिवसांत बांधतील?`, `${d2} दिवस`, [`${+((days * men2) / men).toFixed(2)} दिवस`, `${days + men - men2} दिवस`, `${d2 + 2} दिवस`], `एकूण काम = ${men} × ${days} = ${men * days}; ${men * days} ÷ ${men2} = ${d2} दिवस.`, String);
    },
    (r) => {
      const a = r.int(2, 6), b = r.int(2, 6), k = r.int(3, 9); if (a === b) return null;
      return mk(r, T.ratio, "hard", `दोन संख्यांचे गुणोत्तर ${a} : ${b} असून त्यांची बेरीज ${(a + b) * k} आहे. मोठी संख्या कोणती?`, Math.max(a, b) * k, [Math.min(a, b) * k, (a + b) * k, Math.max(a, b) * k + k], `एक भाग = ${(a + b) * k} ÷ ${a + b} = ${k}; मोठी संख्या = ${Math.max(a, b)} × ${k} = ${Math.max(a, b) * k}.`);
    },
  ],
  average: [
    (r) => {
      const n = r.int(3, 5), nums = Array.from({ length: n }, () => r.int(10, 60)), sum = nums.reduce((a, b) => a + b, 0);
      if (sum % n) return null;
      return mk(r, T.average, "easy", `${nums.join(", ")} यांची सरासरी किती?`, sum / n, [sum, sum / n + 2, Math.max(...nums)], `बेरीज = ${sum}; सरासरी = ${sum} ÷ ${n} = ${sum / n}.`);
    },
    (r) => {
      const start = r.int(1, 30), n = r.pick([5, 7, 9]);
      return mk(r, T.average, "easy", `${start} ते ${start + n - 1} या ${n} क्रमागत संख्यांची सरासरी किती?`, start + (n - 1) / 2, [start + n, start + (n - 1) / 2 + 1, start], `क्रमागत संख्यांची सरासरी म्हणजे मधली संख्या: ${start + (n - 1) / 2}.`);
    },
    (r) => {
      const avg = r.int(20, 60), known = Array.from({ length: 4 }, () => avg + r.int(-10, 10));
      const last = avg * 5 - known.reduce((a, b) => a + b, 0); if (last <= 0) return null;
      return mk(r, T.average, "medium", `एका दुकानात चार दिवसांत ${known.join(", ")} किग्रॅ तांदूळ विकला गेला. पाच दिवसांची सरासरी ${avg} किग्रॅ होण्यासाठी पाचव्या दिवशी किती तांदूळ विकावा लागेल?`, `${last} किग्रॅ`, [`${avg} किग्रॅ`, `${last + 5} किग्रॅ`, `${avg * 5} किग्रॅ`], `एकूण हवे = ${avg * 5}; विकले ${avg * 5 - last}; पाचव्या दिवशी ${last} किग्रॅ.`, String);
    },
    (r) => {
      const n = r.int(3, 6), avg = r.int(30, 80);
      return mk(r, T.average, "medium", `${n} विद्यार्थ्यांच्या गुणांची सरासरी ${avg} आहे. त्यांच्या गुणांची एकूण बेरीज किती?`, avg * n, [avg + n, avg * (n + 1), avg * n - n], `बेरीज = सरासरी × संख्या = ${avg} × ${n} = ${avg * n}.`);
    },
    (r) => {
      const n = r.int(4, 9), avg = r.int(30, 45), newAvg = avg + r.int(1, 4), newVal = newAvg * (n + 1) - avg * n;
      return mk(r, T.average, "hard", `${n} विद्यार्थ्यांच्या वजनाची सरासरी ${avg} किग्रॅ आहे. शिक्षक त्यांच्यात सामील झाल्यावर सरासरी ${newAvg} किग्रॅ होते. शिक्षकांचे वजन किती?`, `${newVal} किग्रॅ`, [`${newAvg} किग्रॅ`, `${newVal + n} किग्रॅ`, `${avg + newAvg} किग्रॅ`], `आधीची बेरीज ${avg * n}; नंतरची ${newAvg * (n + 1)}; शिक्षक = ${newVal} किग्रॅ.`, String);
    },
    (r) => {
      const n = r.int(5, 8), avg = r.int(40, 70), removed = avg + r.int(5, 20);
      const newAvg = (avg * n - removed) / (n - 1); if (!Number.isInteger(newAvg)) return null;
      return mk(r, T.average, "hard", `${n} संख्यांची सरासरी ${avg} आहे. त्यातून ${removed} ही संख्या काढल्यास उरलेल्या संख्यांची सरासरी किती?`, newAvg, [avg, avg - 1 === newAvg ? avg + 1 : avg - 1, newAvg - 2], `बेरीज = ${avg * n}; ${avg * n} − ${removed} = ${avg * n - removed}; ÷ ${n - 1} = ${newAvg}.`);
    },
  ],
};

export function buildArithmetic(rng, perTopic = 10) {
  const out = [];
  const LEVELS = ["easy", "medium", "hard"];
  for (const [key, list] of Object.entries(gens)) {
    const seen = new Set();
    const pool = { easy: [], medium: [], hard: [] };
    let guard = 0;
    while (guard++ < 4000 && LEVELS.some((l) => pool[l].length < perTopic)) {
      const qn = list[guard % list.length](rng);
      if (!qn || new Set(qn.options).size !== 4) continue;
      const sig = qn.text + "|" + [...qn.options].sort().join("|");
      if (seen.has(sig) || [...seen].filter((x) => x.startsWith(qn.text + "|")).length >= 3) continue;
      seen.add(sig);
      pool[qn.difficulty].push(qn);
    }
    const picked = [];
    for (let k = 0; picked.length < perTopic && k < perTopic * 3; k++) {
      const lv = LEVELS[k % 3];
      if (pool[lv].length) picked.push(pool[lv].shift());
    }
    if (picked.length < perTopic) throw new Error(`arith ${key}: only ${picked.length}`);
    if (new Set(picked.map((x) => x.difficulty)).size < 3) throw new Error(`arith ${key}: missing a level`);
    out.push(...picked);
  }
  return out;
}
export const ARITH_TOPICS = Object.values(T);
