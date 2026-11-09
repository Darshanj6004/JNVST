/**
 * Landing-page illustration: three school students in uniform — a girl reading,
 * a boy raising his hand to answer, and a student with a tablet showing a
 * correct answer. Pure inline SVG (no image download, scales to any screen).
 */

type Kid = {
  x: number; // centre x of the figure
  skin: string;
  hair: string;
  girl?: boolean;
  scale?: number;
};

const NAVY = "#1e3a8a";
const SHIRT = "#ffffff";
const SHIRT_SHADE = "#e2e8f0";

/** Head with face and hair. Origin = centre of the head. */
function Head({ skin, hair, girl }: { skin: string; hair: string; girl?: boolean }) {
  return (
    <g>
      {girl && (
        <>
          {/* braids with ribbons */}
          <path d="M-21 2 C-30 18 -28 34 -22 44" stroke={hair} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M21 2 C30 18 28 34 22 44" stroke={hair} strokeWidth="9" strokeLinecap="round" fill="none" />
          <circle cx="-22" cy="44" r="5" fill="#ef4444" />
          <circle cx="22" cy="44" r="5" fill="#ef4444" />
        </>
      )}
      <ellipse cx="-22" cy="4" rx="5" ry="7" fill={skin} />
      <ellipse cx="22" cy="4" rx="5" ry="7" fill={skin} />
      <circle r="23" fill={skin} />
      {/* hair */}
      {girl ? (
        <path d="M-24 2 C-26 -22 -8 -30 0 -30 C12 -30 26 -22 24 2 C18 -8 8 -14 0 -14 C-8 -14 -18 -8 -24 2 Z" fill={hair} />
      ) : (
        <path d="M-23 -2 C-25 -24 -6 -30 2 -29 C16 -28 26 -18 23 -2 C18 -12 10 -16 2 -15 C-8 -16 -18 -10 -23 -2 Z" fill={hair} />
      )}
      {/* face */}
      <circle cx="-8" cy="2" r="2.6" fill="#1f2937" />
      <circle cx="8" cy="2" r="2.6" fill="#1f2937" />
      <circle cx="-13" cy="10" r="3.5" fill="#f87171" opacity="0.35" />
      <circle cx="13" cy="10" r="3.5" fill="#f87171" opacity="0.35" />
      <path d="M-6 11 Q0 16 6 11" stroke="#7c2d12" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Standing student body (legs, uniform) — arms are drawn by each pose. Origin = feet centre. */
function Body({ girl, skin }: { girl?: boolean; skin: string }) {
  return (
    <g>
      {/* legs + shoes */}
      <rect x="-15" y="-52" width="11" height="44" rx="5" fill={skin} />
      <rect x="4" y="-52" width="11" height="44" rx="5" fill={skin} />
      <rect x="-15" y="-22" width="11" height="14" fill="#ffffff" />
      <rect x="4" y="-22" width="11" height="14" fill="#ffffff" />
      <ellipse cx="-10" cy="-6" rx="10" ry="6" fill="#111827" />
      <ellipse cx="10" cy="-6" rx="10" ry="6" fill="#111827" />
      {/* skirt / shorts */}
      {girl ? (
        <path d="M-26 -50 L26 -50 L32 -88 L-32 -88 Z" fill={NAVY} />
      ) : (
        <path d="M-22 -60 L22 -60 L24 -92 L-24 -92 Z" fill={NAVY} />
      )}
      {/* shirt */}
      <path d="M-26 -88 C-28 -112 -24 -128 -14 -132 L14 -132 C24 -128 28 -112 26 -88 Z" fill={SHIRT} stroke={SHIRT_SHADE} strokeWidth="1.5" />
      {/* collar + tie */}
      <path d="M-12 -132 L0 -120 L12 -132" fill="none" stroke={SHIRT_SHADE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-3 -122 L3 -122 L5 -100 L0 -94 L-5 -100 Z" fill={girl ? "#ef4444" : NAVY} />
      {/* neck */}
      <rect x="-6" y="-140" width="12" height="10" rx="4" fill={skin} />
    </g>
  );
}

function GirlReading({ x, skin, hair, scale = 1 }: Kid) {
  return (
    <g transform={`translate(${x} 380) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="40" ry="7" fill="#1e3a8a" opacity="0.12" />
      <Body girl skin={skin} />
      {/* arms holding the book */}
      <path d="M-24 -124 C-36 -108 -34 -96 -18 -94" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M24 -124 C36 -108 34 -96 18 -94" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* open book */}
      <path d="M-30 -118 Q-15 -126 0 -118 L0 -88 Q-15 -96 -30 -88 Z" fill="#2563eb" />
      <path d="M30 -118 Q15 -126 0 -118 L0 -88 Q15 -96 30 -88 Z" fill="#1d4ed8" />
      <path d="M-27 -115 Q-14 -121 -2 -115 L-2 -91 Q-14 -97 -27 -91 Z" fill="#ffffff" />
      <path d="M27 -115 Q14 -121 2 -115 L2 -91 Q14 -97 27 -91 Z" fill="#f8fafc" />
      <g stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round">
        <line x1="-22" y1="-110" x2="-7" y2="-112" />
        <line x1="-22" y1="-104" x2="-7" y2="-106" />
        <line x1="-22" y1="-98" x2="-10" y2="-100" />
        <line x1="7" y1="-112" x2="22" y2="-110" />
        <line x1="7" y1="-106" x2="22" y2="-104" />
      </g>
      <circle cx="-20" cy="-93" r="5" fill={skin} />
      <circle cx="20" cy="-93" r="5" fill={skin} />
      <g transform="translate(0 -166)">
        <Head skin={skin} hair={hair} girl />
      </g>
    </g>
  );
}

function BoyHandUp({ x, skin, hair, scale = 1 }: Kid) {
  return (
    <g transform={`translate(${x} 388) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="40" ry="7" fill="#1e3a8a" opacity="0.12" />
      <Body skin={skin} />
      {/* left arm down, holding a notebook */}
      <path d="M-24 -124 C-32 -110 -34 -96 -32 -84" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <rect x="-44" y="-90" width="22" height="28" rx="3" fill="#f59e0b" transform="rotate(-8 -33 -76)" />
      <rect x="-41" y="-86" width="16" height="4" rx="2" fill="#ffffff" opacity="0.8" transform="rotate(-8 -33 -76)" />
      <circle cx="-32" cy="-82" r="5" fill={skin} />
      {/* right arm raised */}
      <path d="M22 -126 C34 -142 38 -164 36 -190" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="-196" r="7" fill={skin} />
      <rect x="31" y="-210" width="4" height="12" rx="2" fill={skin} />
      <rect x="35.5" y="-212" width="4" height="13" rx="2" fill={skin} />
      <rect x="40" y="-209" width="4" height="11" rx="2" fill={skin} />
      <g transform="translate(0 -166)">
        <Head skin={skin} hair={hair} />
      </g>
    </g>
  );
}

function StudentTablet({ x, skin, hair, scale = 1 }: Kid) {
  return (
    <g transform={`translate(${x} 384) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="40" ry="7" fill="#1e3a8a" opacity="0.12" />
      {/* school bag behind */}
      <rect x="-30" y="-130" width="60" height="58" rx="12" fill="#16a34a" />
      <rect x="-22" y="-104" width="44" height="22" rx="6" fill="#15803d" />
      <Body skin={skin} />
      {/* bag straps */}
      <path d="M-16 -132 L-18 -92" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
      <path d="M16 -132 L18 -92" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
      {/* arms holding the tablet */}
      <path d="M-24 -124 C-36 -110 -30 -98 -16 -100" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M24 -124 C36 -110 30 -98 16 -100" stroke={SHIRT} strokeWidth="11" strokeLinecap="round" fill="none" />
      <rect x="-24" y="-124" width="48" height="34" rx="5" fill="#0f172a" />
      <rect x="-20" y="-120" width="40" height="26" rx="3" fill="#dbeafe" />
      <circle cx="0" cy="-107" r="8" fill="#16a34a" />
      <path d="M-4 -107 L-1 -104 L4 -110" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-18" cy="-99" r="5" fill={skin} />
      <circle cx="18" cy="-99" r="5" fill={skin} />
      <g transform="translate(0 -166)">
        <Head skin={skin} hair={hair} />
      </g>
    </g>
  );
}

export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} role="img" aria-labelledby="hero-title">
      <title id="hero-title">Three school students: a girl reading a book, a boy raising his hand and a student with a tablet</title>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe7fe" />
          <stop offset="1" stopColor="#eff5ff" />
        </linearGradient>
      </defs>

      {/* backdrop */}
      <circle cx="265" cy="225" r="200" fill="url(#bg)" />
      {/* faint school building */}
      <g opacity="0.35" fill="#93b4fd">
        <path d="M160 200 L265 150 L370 200 Z" />
        <rect x="175" y="200" width="180" height="90" rx="4" />
        <line x1="265" y1="150" x2="265" y2="112" stroke="#93b4fd" strokeWidth="3" />
        <rect x="266" y="112" width="26" height="15" fill="#bfd3fe" />
      </g>
      <path d="M70 392 Q265 364 460 392 L460 404 Q265 384 70 404 Z" fill="#bbf7d0" />

      {/* floating learning symbols */}
      <g fontFamily="Arial, sans-serif" fontWeight="700">
        <g transform="translate(70 120) rotate(-8)">
          <rect width="78" height="36" rx="10" fill="#ffffff" stroke="#bfd3fe" />
          <text x="39" y="24" textAnchor="middle" fontSize="17" fill="#1d4ed8">अ आ इ</text>
        </g>
        <g transform="translate(392 104) rotate(7)">
          <rect width="74" height="36" rx="10" fill="#ffffff" stroke="#bbf7d0" />
          <text x="37" y="24" textAnchor="middle" fontSize="17" fill="#16a34a">१ २ ३</text>
        </g>
        <g transform="translate(470 178)">
          <circle r="20" fill="#f59e0b" />
          <path d="M0 -9 L2.6 -3 L9 -3 L4 1.5 L6 8 L0 4.4 L-6 8 L-4 1.5 L-9 -3 L-2.6 -3 Z" fill="#ffffff" />
        </g>
        <g transform="translate(62 262)">
          <circle r="18" fill="#ffffff" stroke="#bfd3fe" />
          <text y="7" textAnchor="middle" fontSize="20" fill="#7c3aed">?</text>
        </g>
      </g>

      {/* students (back to front) */}
      <StudentTablet x={398} skin="#c68642" hair="#1f2937" scale={1.0} />
      <GirlReading x={140} skin="#e0ac69" hair="#111827" scale={1.07} />
      <BoyHandUp x={270} skin="#a9713d" hair="#111827" scale={1.15} />
    </svg>
  );
}
