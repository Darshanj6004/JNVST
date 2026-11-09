/**
 * Lightweight inline illustration for the landing page (no image download).
 * A school building with the tricolour, trees, an open book, an answer sheet
 * with filled bubbles, a pencil and a medal.
 */
export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} role="img" aria-labelledby="hero-title">
      <title id="hero-title">School building with books, an answer sheet and a medal</title>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe7fe" />
          <stop offset="1" stopColor="#eff5ff" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1e3a8a" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* backdrop */}
      <circle cx="270" cy="210" r="200" fill="url(#sky)" />
      <circle cx="420" cy="80" r="26" fill="#fde68a" />
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="140" cy="92" rx="34" ry="12" />
        <ellipse cx="166" cy="84" rx="22" ry="12" />
        <ellipse cx="360" cy="140" rx="28" ry="9" />
      </g>

      {/* ground */}
      <path d="M70 330 Q270 300 470 330 L470 360 L70 360 Z" fill="#bbf7d0" />
      <path d="M70 342 Q270 318 470 342" stroke="#86efac" strokeWidth="3" fill="none" />

      {/* trees */}
      <g>
        <rect x="96" y="268" width="8" height="40" rx="3" fill="#92400e" />
        <circle cx="100" cy="258" r="26" fill="#22c55e" />
        <circle cx="86" cy="268" r="16" fill="#16a34a" />
        <rect x="438" y="272" width="8" height="38" rx="3" fill="#92400e" />
        <circle cx="442" cy="262" r="24" fill="#22c55e" />
        <circle cx="456" cy="272" r="14" fill="#16a34a" />
      </g>

      {/* school building */}
      <g filter="url(#soft)">
        <rect x="150" y="200" width="240" height="118" rx="6" fill="url(#wall)" stroke="#cbd5e1" />
        <path d="M138 204 L270 140 L402 204 Z" fill="url(#roof)" />
        <rect x="236" y="168" width="68" height="20" rx="4" fill="#ffffff" opacity="0.95" />
        <text x="270" y="182" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e3a8a" fontFamily="Arial, sans-serif">
          JNVST
        </text>
        {/* windows */}
        {[168, 206, 314, 352].map((x) => (
          <g key={x}>
            <rect x={x} y="222" width="24" height="26" rx="3" fill="#bfdbfe" stroke="#93c5fd" />
            <line x1={x + 12} y1="222" x2={x + 12} y2="248" stroke="#93c5fd" />
            <rect x={x} y="266" width="24" height="26" rx="3" fill="#bfdbfe" stroke="#93c5fd" />
            <line x1={x + 12} y1="266" x2={x + 12} y2="292" stroke="#93c5fd" />
          </g>
        ))}
        {/* door */}
        <rect x="250" y="252" width="40" height="66" rx="4" fill="#1e40af" />
        <circle cx="282" cy="288" r="2.5" fill="#fde68a" />
        <rect x="244" y="314" width="52" height="6" rx="2" fill="#94a3b8" />
      </g>

      {/* flag */}
      <line x1="270" y1="140" x2="270" y2="86" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <g>
        <rect x="271" y="88" width="40" height="9" fill="#f97316" />
        <rect x="271" y="97" width="40" height="9" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
        <rect x="271" y="106" width="40" height="9" fill="#16a34a" />
        <circle cx="291" cy="101.5" r="3" fill="none" stroke="#1e3a8a" strokeWidth="1" />
      </g>

      {/* answer sheet card */}
      <g filter="url(#soft)" transform="rotate(-6 92 318)">
        <rect x="34" y="250" width="116" height="140" rx="10" fill="#ffffff" stroke="#e2e8f0" />
        <rect x="48" y="264" width="60" height="7" rx="3.5" fill="#1e40af" />
        <rect x="48" y="276" width="40" height="5" rx="2.5" fill="#cbd5e1" />
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <text x="48" y={304 + r * 17} fontSize="8" fill="#64748b" fontFamily="Arial, sans-serif">
              {r + 1}
            </text>
            {[0, 1, 2, 3].map((c) => (
              <circle
                key={c}
                cx={64 + c * 18}
                cy={301 + r * 17}
                r="5.5"
                fill={(r + c * 2) % 4 === 1 ? "#1e40af" : "#ffffff"}
                stroke="#94a3b8"
              />
            ))}
          </g>
        ))}
      </g>

      {/* check badge */}
      <g transform="translate(124 236)">
        <circle r="17" fill="#16a34a" />
        <path d="M-7 0 L-2 6 L8 -6" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* open book */}
      <g filter="url(#soft)">
        <path d="M300 352 Q350 330 400 348 L400 404 Q350 388 300 408 Z" fill="#ffffff" stroke="#cbd5e1" />
        <path d="M400 348 Q450 330 500 352 L500 408 Q450 388 400 404 Z" fill="#f8fafc" stroke="#cbd5e1" />
        <line x1="400" y1="348" x2="400" y2="404" stroke="#94a3b8" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
            <line x1="314" y1={364 + i * 9} x2="388" y2={358 + i * 9} />
            <line x1="412" y1={358 + i * 9} x2={486 - (i === 3 ? 26 : 0)} y2={364 + i * 9} />
          </g>
        ))}
        <text x="352" y="350" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e40af" fontFamily="Arial, sans-serif">
          अ आ इ
        </text>
        <text x="450" y="350" textAnchor="middle" fontSize="13" fontWeight="700" fill="#16a34a" fontFamily="Arial, sans-serif">
          1 2 3
        </text>
      </g>

      {/* pencil */}
      <g transform="rotate(38 470 280)">
        <rect x="430" y="274" width="74" height="12" rx="2" fill="#facc15" />
        <rect x="430" y="274" width="10" height="12" fill="#f472b6" />
        <rect x="440" y="274" width="4" height="12" fill="#cbd5e1" />
        <path d="M504 274 L518 280 L504 286 Z" fill="#fde68a" />
        <path d="M513 278 L518 280 L513 282 Z" fill="#334155" />
      </g>

      {/* medal */}
      <g transform="translate(456 186)">
        <path d="M-10 -26 L-3 -6 L3 -6 L10 -26 Z" fill="#2563eb" />
        <circle r="15" fill="#f59e0b" stroke="#fbbf24" strokeWidth="3" />
        <path d="M0 -7 L2.2 -2 L7.5 -2 L3.2 1.4 L4.8 6.6 L0 3.6 L-4.8 6.6 L-3.2 1.4 L-7.5 -2 L-2.2 -2 Z" fill="#ffffff" />
      </g>
    </svg>
  );
}
