import React from 'react';

/* ============================================================================
   01. MOCK TEST HERO — 3D ANIME/CARTOON SCHOLAR & MAGICAL SKY STUDY ISLAND
   ============================================================================ */
export const MockTestHeroIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full h-full'
}) => {
  return (
    <svg
      viewBox="0 0 540 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Ambient Soft Glows */}
        <radialGradient id="heroAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#C4B5FD" stopOpacity="0.55" />
          <stop offset="80%" stopColor="#FBCFE8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0" />
        </radialGradient>

        {/* 3D Floating Island Gradients */}
        <linearGradient id="islandTop" x1="120" y1="310" x2="420" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="islandBase" x1="150" y1="340" x2="390" y2="415" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* 3D Cloud Plump Gradient */}
        <linearGradient id="plumpCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="75%" stopColor="#F3E8FF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>

        {/* Character Skin 3D Soft Shading */}
        <radialGradient id="skin3D" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFF1E6" />
          <stop offset="65%" stopColor="#FFD8BE" />
          <stop offset="100%" stopColor="#F4B393" />
        </radialGradient>

        {/* Character Hair 3D Glossy Indigo */}
        <linearGradient id="hair3D" x1="200" y1="75" x2="335" y2="215" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="45%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Character Hoodie 3D Pastel Lavender & Aqua */}
        <linearGradient id="hoodie3D" x1="195" y1="215" x2="345" y2="335" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="55%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* 3D Desk Wood/Cream Gloss */}
        <linearGradient id="desk3D" x1="135" y1="280" x2="405" y2="335" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="55%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Floating Coral Book */}
        <linearGradient id="coralBook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9A8B" />
          <stop offset="50%" stopColor="#FF6A88" />
          <stop offset="100%" stopColor="#FF99AC" />
        </linearGradient>

        {/* Floating Aqua Book */}
        <linearGradient id="aquaBook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        {/* Golden Trophy / Star Gradient */}
        <linearGradient id="gold3D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        <filter id="softShadow" x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#4C1D95" floodOpacity="0.18" />
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#6366F1" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Back Magical Aura Sphere */}
      <circle cx="270" cy="215" r="195" fill="url(#heroAura)" />

      {/* Decorative Rainbow Arc in Background */}
      <path
        d="M 105 260 A 165 165 0 0 1 435 260"
        stroke="url(#coralBook)"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M 122 260 A 148 148 0 0 1 418 260"
        stroke="url(#aquaBook)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Back Fluffy 3D Clouds */}
      <g filter="url(#cardShadow)" opacity="0.92">
        <circle cx="105" cy="295" r="34" fill="url(#plumpCloud)" />
        <circle cx="140" cy="285" r="42" fill="url(#plumpCloud)" />
        <circle cx="405" cy="285" r="40" fill="url(#plumpCloud)" />
        <circle cx="440" cy="298" r="30" fill="url(#plumpCloud)" />
      </g>

      {/* Floating 3D Sky Island Pedestal */}
      <g filter="url(#softShadow)">
        <ellipse cx="270" cy="362" rx="158" ry="42" fill="url(#islandBase)" />
        <ellipse cx="270" cy="346" rx="166" ry="40" fill="url(#islandTop)" />
        {/* Glossy Rim Highlight */}
        <ellipse
          cx="270"
          cy="342"
          rx="154"
          ry="33"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeOpacity="0.65"
        />
      </g>

      {/* ==================== FLOATING 3D OBJECTS AROUND CHARACTER ==================== */}

      {/* Left Floating 3D Coral Spellbook */}
      <g transform="translate(46, 128) rotate(-14)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="76" height="94" rx="14" fill="url(#coralBook)" />
        <rect x="8" y="6" width="64" height="82" rx="10" fill="#FFF5F7" />
        <rect x="0" y="0" width="68" height="90" rx="13" fill="url(#coralBook)" />
        {/* Glossy Highlight */}
        <path d="M 10 8 L 56 8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        {/* Star Emblem on Cover */}
        <polygon
          points="34,26 39,37 51,38 42,46 44,58 34,52 24,58 26,46 17,38 29,37"
          fill="url(#gold3D)"
        />
      </g>

      {/* Right Floating 3D Aqua Question Cube & Winged Trophy Badge */}
      <g transform="translate(405, 112) rotate(12)" filter="url(#cardShadow)">
        <rect x="0" y="0" width="82" height="82" rx="22" fill="url(#aquaBook)" />
        <rect
          x="6"
          y="6"
          width="70"
          height="70"
          rx="18"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeOpacity="0.7"
        />
        {/* 3D Checkmark & Star inside */}
        <circle cx="41" cy="41" r="22" fill="#FFFFFF" fillOpacity="0.92" />
        <path
          d="M 31 41 L 38 48 L 53 33"
          stroke="#0EA5E9"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Top Left Floating 3D Golden Crown / A+ Star Orb */}
      <g transform="translate(96, 52)" filter="url(#cardShadow)">
        <circle cx="34" cy="34" r="28" fill="url(#gold3D)" />
        <ellipse cx="26" cy="22" rx="10" ry="6" transform="rotate(-25 26 22)" fill="#FFFFFF" opacity="0.65" />
        <polygon
          points="34,16 39,27 51,28 42,36 44,48 34,42 24,48 26,36 17,28 29,27"
          fill="#FFFFFF"
        />
      </g>

      {/* ==================== CUTE 3D ANIME / CARTOON SCHOLAR CHARACTER ==================== */}
      <g filter="url(#softShadow)">
        {/* Character Shoulders & Cozy 3D Hoodie */}
        <path
          d="M 192 315 C 192 248, 224 226, 270 226 C 316 226, 348 248, 348 315 Z"
          fill="url(#hoodie3D)"
        />
        {/* White Cozy Collar & Mint Tie/Scarf */}
        <path d="M 238 228 L 270 264 L 302 228 Z" fill="#FFFFFF" />
        <path d="M 262 246 L 278 246 L 283 288 L 270 298 L 257 288 Z" fill="url(#coralBook)" />
        {/* Little Gold Star Pin on Hoodie */}
        <circle cx="305" cy="268" r="10" fill="url(#gold3D)" />
        <circle cx="303" cy="266" r="3" fill="#FFFFFF" opacity="0.8" />

        {/* Back Hair Volume */}
        <circle cx="270" cy="148" r="74" fill="url(#hair3D)" />

        {/* Cute Rounded 3D Ears */}
        <circle cx="198" cy="166" r="16" fill="url(#skin3D)" />
        <circle cx="342" cy="166" r="16" fill="url(#skin3D)" />
        <circle cx="198" cy="166" r="8" fill="#F4B393" opacity="0.6" />
        <circle cx="342" cy="166" r="8" fill="#F4B393" opacity="0.6" />

        {/* 3D Head / Face Base */}
        <rect x="204" y="96" width="132" height="124" rx="62" fill="url(#skin3D)" />

        {/* Soft Rosy Anime Blush Cheeks */}
        <ellipse cx="226" cy="176" rx="13" ry="7.5" fill="#FF758F" opacity="0.48" />
        <ellipse cx="314" cy="176" rx="13" ry="7.5" fill="#FF758F" opacity="0.48" />

        {/* Expressive Glossy 3D Anime Eyes */}
        <g>
          {/* Left Eye */}
          <ellipse cx="242" cy="158" rx="13" ry="15" fill="#1E1B4B" />
          <ellipse cx="242" cy="160" rx="10" ry="11" fill="#4338CA" />
          <circle cx="238" cy="152" r="5.2" fill="#FFFFFF" />
          <circle cx="247" cy="164" r="2.5" fill="#FFFFFF" />

          {/* Right Eye */}
          <ellipse cx="298" cy="158" rx="13" ry="15" fill="#1E1B4B" />
          <ellipse cx="298" cy="160" rx="10" ry="11" fill="#4338CA" />
          <circle cx="294" cy="152" r="5.2" fill="#FFFFFF" />
          <circle cx="303" cy="164" r="2.5" fill="#FFFFFF" />

          {/* Friendly Eyebrows */}
          <path d="M 227 136 Q 242 129 255 135" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
          <path d="M 285 135 Q 298 129 313 136" stroke="#312E81" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Cute Golden Round Scholar Glasses */}
        <g>
          <circle
            cx="242"
            cy="158"
            r="21"
            fill="#FFFFFF"
            fillOpacity="0.15"
            stroke="url(#gold3D)"
            strokeWidth="4"
          />
          <circle
            cx="298"
            cy="158"
            r="21"
            fill="#FFFFFF"
            fillOpacity="0.15"
            stroke="url(#gold3D)"
            strokeWidth="4"
          />
          <path d="M 263 156 Q 270 151 277 156" stroke="url(#gold3D)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Cute Nose & Joyful Confident Smile */}
        <ellipse cx="270" cy="171" rx="3" ry="2" fill="#E09F7D" />
        <path
          d="M 256 184 Q 270 198 284 184"
          fill="#FF6B8B"
          stroke="#312E81"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Front Stylized 3D Anime Hair Bangs & Glossy Halo Highlight */}
        <path
          d="M 196 146 C 196 92, 232 74, 272 74 C 314 74, 346 96, 344 148 C 332 122, 314 112, 294 128 C 282 104, 256 102, 242 126 C 226 112, 208 122, 196 146 Z"
          fill="url(#hair3D)"
        />
        {/* Hair Specular Gloss */}
        <path
          d="M 224 98 Q 268 82 312 100"
          stroke="#818CF8"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* Cute Ahoge (Top Hair Tuft) */}
        <path
          d="M 268 76 Q 282 46 304 58 Q 288 68 278 76"
          fill="url(#hair3D)"
        />

        {/* Scholar Graduation Beret / Cap Perched Jauntily */}
        <g transform="translate(270, 74) rotate(7)">
          <ellipse cx="0" cy="0" rx="54" ry="14" fill="#4F46E5" />
          <polygon points="0,-18 68,-2 0,14 -68,-2" fill="#6366F1" stroke="#C4B5FD" strokeWidth="2" />
          <circle cx="0" cy="-2" r="7" fill="url(#gold3D)" />
          <path d="M 6 -2 Q 38 4 46 28" stroke="url(#gold3D)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="46" cy="30" r="5" fill="url(#gold3D)" />
        </g>
      </g>

      {/* ==================== 3D CURVED SKY DESK & ILLUMINATED EXAM SCROLL ==================== */}
      <g filter="url(#cardShadow)">
        {/* Desk Surface */}
        <rect x="136" y="294" width="268" height="36" rx="18" fill="url(#desk3D)" />
        <rect
          x="144"
          y="298"
          width="252"
          height="10"
          rx="5"
          fill="#FFFFFF"
          opacity="0.65"
        />

        {/* Open 3D Glowing Exam Book on Desk */}
        <path
          d="M 192 296 Q 230 276 270 294 Q 310 276 348 296 L 356 266 Q 312 248 270 268 Q 228 248 184 266 Z"
          fill="#FFFFFF"
          stroke="#C4B5FD"
          strokeWidth="2.5"
        />

        {/* Character Cute 3D Hands on Desk */}
        <circle cx="212" cy="292" r="15" fill="url(#skin3D)" />
        <circle cx="328" cy="286" r="15" fill="url(#skin3D)" />

        {/* Magical Glowing Fountain Pen in Right Hand */}
        <g transform="translate(328, 274) rotate(-32)">
          <rect x="-5" y="-58" width="12" height="56" rx="6" fill="url(#coralBook)" />
          <polygon points="-4,0 6,0 1,14" fill="url(#gold3D)" />
          <circle cx="1" cy="-58" r="7" fill="url(#gold3D)" />
        </g>
      </g>

      {/* Floating Magical Sparkles */}
      <g fill="#FFFFFF">
        <path d="M 164 115 L 168 127 L 180 131 L 168 135 L 164 147 L 160 135 L 148 131 L 160 127 Z" />
        <path d="M 382 212 L 385 221 L 394 224 L 385 227 L 382 236 L 379 227 L 370 224 L 379 221 Z" />
        <circle cx="148" cy="218" r="6" fill="#FDE047" />
        <circle cx="378" cy="78" r="7" fill="#F472B6" />
        <circle cx="468" cy="222" r="5" fill="#38BDF8" />
      </g>
    </svg>
  );
};

/* ============================================================================
   02. QUESTION BANK — 3D MAGICAL TREASURE ARCHIVE & GLOWING QUESTION CUBES
   ============================================================================ */
export const QuestionBank3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36'
}) => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="qbGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="qbBoxBase" x1="40" y1="90" x2="180" y2="175" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id="qbCubePink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF9A8B" />
        <stop offset="100%" stopColor="#FF6A88" />
      </linearGradient>
      <linearGradient id="qbGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    <circle cx="110" cy="105" r="88" fill="url(#qbGlow)" />

    {/* Soft Base Shadow */}
    <ellipse cx="110" cy="174" rx="68" ry="14" fill="#312E81" fillOpacity="0.16" />

    {/* Floating 3D Question Cube 1 (Top Center-Left) */}
    <g transform="translate(52, 22) rotate(-10)">
      <rect width="62" height="62" rx="18" fill="url(#qbCubePink)" />
      <rect
        x="4"
        y="4"
        width="54"
        height="54"
        rx="14"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.65"
      />
      <text
        x="31"
        y="44"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="36"
        fontWeight="800"
        fontFamily="Fredoka, sans-serif"
      >
        ?
      </text>
    </g>

    {/* Floating 3D Question Cube 2 (Top Right) */}
    <g transform="translate(118, 34) rotate(14)">
      <rect width="54" height="54" rx="16" fill="url(#qbGold)" />
      <rect
        x="4"
        y="4"
        width="46"
        height="46"
        rx="12"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.75"
      />
      <text
        x="27"
        y="38"
        textAnchor="middle"
        fill="#78350F"
        fontSize="30"
        fontWeight="800"
        fontFamily="Fredoka, sans-serif"
      >
        ?
      </text>
    </g>

    {/* 3D Glossy Knowledge Chest / Pod */}
    <rect x="42" y="96" width="136" height="74" rx="26" fill="url(#qbBoxBase)" />
    <path
      d="M 48 112 C 48 96, 172 96, 172 112"
      stroke="#FFFFFF"
      strokeWidth="5"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Golden Keyhole Shield */}
    <rect x="92" y="106" width="36" height="40" rx="12" fill="url(#qbGold)" />
    <circle cx="110" cy="122" r="5" fill="#78350F" />
    <path d="M 110 125 L 110 136" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />

    {/* Sparkles */}
    <circle cx="34" cy="76" r="5" fill="#FDE047" />
    <circle cx="186" cy="92" r="6" fill="#F472B6" />
    <path d="M 112 12 L 115 20 L 123 23 L 115 26 L 112 34 L 109 26 L 101 23 L 109 20 Z" fill="#FFFFFF" />
  </svg>
);

/* ============================================================================
   03. STUDY MATERIALS — 3D GLOSSY STACKED SPELLBOOKS & FLOATING SCROLL
   ============================================================================ */
export const StudyMaterials3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36'
}) => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="smGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bookMint" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="bookLavender" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="bookCoral" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>

    <circle cx="110" cy="105" r="88" fill="url(#smGlow)" />
    <ellipse cx="110" cy="174" rx="70" ry="14" fill="#065F46" fillOpacity="0.16" />

    {/* Bottom Book (Mint Emerald) */}
    <g transform="translate(36, 126)">
      <rect x="0" y="0" width="148" height="38" rx="14" fill="url(#bookMint)" />
      <rect x="14" y="6" width="128" height="26" rx="9" fill="#FFFBEB" />
      <path d="M 22 14 L 132 14 M 22 22 L 124 22" stroke="#D1FAE5" strokeWidth="3" strokeLinecap="round" />
      {/* Bookmark Ribbon */}
      <path d="M 116 26 L 116 46 L 124 41 L 132 46 L 132 26 Z" fill="#F43F5E" />
    </g>

    {/* Middle Book (Royal Lavender) */}
    <g transform="translate(44, 88) rotate(-4)">
      <rect x="0" y="0" width="134" height="36" rx="14" fill="url(#bookLavender)" />
      <rect x="12" y="6" width="116" height="24" rx="8" fill="#FFFFFF" />
      <circle cx="34" cy="18" r="6" fill="#FDE047" />
    </g>

    {/* Top Tilted Open 3D Book & Floating Magnifier */}
    <g transform="translate(54, 34) rotate(5)">
      <rect x="0" y="0" width="108" height="52" rx="16" fill="url(#bookCoral)" />
      <path d="M 12 10 L 52 10" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      <polygon
        points="54,14 59,25 71,26 62,34 64,46 54,40 44,46 46,34 37,26 49,25"
        fill="#FEF08A"
      />
    </g>

    {/* Floating 3D Magnifying Glass */}
    <g transform="translate(132, 24)">
      <circle cx="28" cy="28" r="22" fill="#E0F2FE" fillOpacity="0.7" stroke="#38BDF8" strokeWidth="7" />
      <path d="M 18 18 Q 26 12 34 18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="44" y1="44" x2="60" y2="60" stroke="#F59E0B" strokeWidth="9" strokeLinecap="round" />
    </g>
  </svg>
);

/* ============================================================================
   04. PRIVATE TUTOR — CHARMING 3D CARTOON AI COMPANION OWL-BOT
   ============================================================================ */
export const PrivateTutor3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36'
}) => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="ptGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="botBody" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#E0E7FF" />
        <stop offset="100%" stopColor="#A5B4FC" />
      </radialGradient>
      <linearGradient id="botVisor" x1="65" y1="75" x2="155" y2="125" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#312E81" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
    </defs>

    <circle cx="110" cy="105" r="88" fill="url(#ptGlow)" />
    <ellipse cx="110" cy="176" rx="58" ry="12" fill="#4C1D95" fillOpacity="0.16" />

    {/* Cute Floating Wings / Arms */}
    <ellipse cx="42" cy="116" rx="16" ry="26" transform="rotate(20 42 116)" fill="url(#botBody)" />
    <ellipse cx="178" cy="110" rx="16" ry="26" transform="rotate(-28 178 110)" fill="url(#botBody)" />

    {/* Main Plump 3D Companion Body */}
    <rect x="52" y="54" width="116" height="108" rx="54" fill="url(#botBody)" />
    <rect
      x="58"
      y="60"
      width="104"
      height="96"
      rx="48"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeOpacity="0.8"
    />

    {/* Cute Belly Badge */}
    <ellipse cx="110" cy="140" rx="28" ry="14" fill="#F3E8FF" />
    <path d="M 103 140 L 110 133 L 117 140 L 110 147 Z" fill="#A855F7" />

    {/* Glossy Dark Visor Face */}
    <rect x="68" y="76" width="84" height="48" rx="24" fill="url(#botVisor)" />

    {/* Glowing Happy Anime Eyes & Rosy Cheeks */}
    <circle cx="90" cy="100" r="9" fill="#38BDF8" />
    <circle cx="88" cy="97" r="3.5" fill="#FFFFFF" />
    <circle cx="130" cy="100" r="9" fill="#38BDF8" />
    <circle cx="128" cy="97" r="3.5" fill="#FFFFFF" />
    <ellipse cx="78" cy="110" rx="6" ry="3.5" fill="#F472B6" opacity="0.8" />
    <ellipse cx="142" cy="110" rx="6" ry="3.5" fill="#F472B6" opacity="0.8" />
    {/* Cute Happy Smile */}
    <path d="M 103 106 Q 110 113 117 106" stroke="#67E8F9" strokeWidth="3.5" strokeLinecap="round" />

    {/* Little Scholar Mortarboard Hat & Glowing Antenna */}
    <line x1="110" y1="54" x2="110" y2="34" stroke="#8B5CF6" strokeWidth="5" strokeLinecap="round" />
    <circle cx="110" cy="28" r="9" fill="#FACC15" />
    <circle cx="108" cy="26" r="3" fill="#FFFFFF" />

    {/* Floating Idea Speech Bubble */}
    <g transform="translate(148, 22)">
      <rect x="0" y="0" width="52" height="40" rx="16" fill="#FFFFFF" />
      <path d="M 26 10 L 29 19 L 38 22 L 29 25 L 26 34 L 23 25 L 14 22 L 23 19 Z" fill="#F43F5E" />
    </g>
  </svg>
);

/* ============================================================================
   05. BCS UPDATES — 3D MAGICAL MEGAPHONE, BELL & WINGED GAZETTE ENVELOPES
   ============================================================================ */
export const BCSUpdates3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-36 h-36'
}) => (
  <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="upGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.68" />
        <stop offset="100%" stopColor="#FDBA74" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bellGold" x1="50" y1="40" x2="160" y2="155" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="badgeCoral" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF758F" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>

    <circle cx="110" cy="105" r="88" fill="url(#upGlow)" />
    <ellipse cx="110" cy="174" rx="64" ry="13" fill="#9A3412" fillOpacity="0.16" />

    {/* Floating Envelope Behind */}
    <g transform="translate(26, 48) rotate(-15)">
      <rect width="74" height="50" rx="12" fill="#FFFFFF" />
      <path d="M 6 8 L 37 28 L 68 8" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" />
    </g>

    {/* 3D Glossy Golden Notification Bell */}
    <g transform="translate(110, 102) rotate(8)">
      {/* Bell Clapper */}
      <circle cx="0" cy="48" r="14" fill="#D97706" />
      {/* Bell Dome */}
      <path
        d="M -46 34 L 46 34 C 42 10, 34 -36, 0 -36 C -34 -36, -42 10, -46 34 Z"
        fill="url(#bellGold)"
      />
      <rect x="-54" y="28" width="108" height="16" rx="8" fill="url(#bellGold)" />
      {/* Top Ring */}
      <circle cx="0" cy="-42" r="10" fill="#FACC15" />
      {/* Specular Gloss Line */}
      <path
        d="M -22 -18 C -26 -2, -28 14, -30 22"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </g>

    {/* Glossy 3D Coral Notification Star Badge */}
    <g transform="translate(132, 34)">
      <circle cx="24" cy="24" r="22" fill="url(#badgeCoral)" />
      <circle cx="24" cy="24" r="20" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.8" />
      <polygon
        points="24,11 28,19 37,20 30,26 32,35 24,30 16,35 18,26 11,20 20,19"
        fill="#FFFFFF"
      />
    </g>

    {/* Sound Wave Arcs */}
    <path d="M 180 94 Q 192 108 180 122" stroke="#FB7185" strokeWidth="4" strokeLinecap="round" />
    <path d="M 190 86 Q 206 108 190 130" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/* ============================================================================
   00. BCS COUNTDOWN — 3D MAGICAL CHRONOMETER, HOURGLASS & CALENDAR FLIP-TILE
   ============================================================================ */
export const BCSCountdown3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-32 h-32'
}) => (
  <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="cdAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE047" stopOpacity="0.65" />
        <stop offset="55%" stopColor="#C084FC" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#C084FC" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cdCalendar" x1="30" y1="30" x2="150" y2="160" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F3E8FF" />
      </linearGradient>
      <linearGradient id="cdHeader" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EC4899" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="cdClockRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="45%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="cdAqua" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
    </defs>

    <circle cx="120" cy="102" r="90" fill="url(#cdAura)" />
    <ellipse cx="120" cy="178" rx="74" ry="12" fill="#4C1D95" fillOpacity="0.18" />

    {/* Back Tilted 3D Calendar Card (50th & 51st BCS) */}
    <g transform="translate(26, 26) rotate(-8)">
      <rect x="0" y="0" width="118" height="122" rx="24" fill="url(#cdCalendar)" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M 0 24 C 0 10.7 10.7 0 24 0 H 94 C 107.3 0 118 10.7 118 24 V 38 H 0 V 24 Z" fill="url(#cdHeader)" />
      {/* 3D Binder Rings */}
      <rect x="28" y="-8" width="10" height="22" rx="5" fill="url(#cdClockRim)" />
      <rect x="80" y="-8" width="10" height="22" rx="5" fill="url(#cdClockRim)" />
      {/* Number 50 Badge */}
      <text
        x="59"
        y="92"
        textAnchor="middle"
        fill="#4338CA"
        fontSize="44"
        fontWeight="800"
        fontFamily="Fredoka, sans-serif"
      >
        50
      </text>
      <text
        x="59"
        y="110"
        textAnchor="middle"
        fill="#EC4899"
        fontSize="12"
        fontWeight="700"
        fontFamily="Fredoka, sans-serif"
      >
        BCS STAGE
      </text>
    </g>

    {/* Front Glossy 3D Golden Stopwatch / Chronometer */}
    <g transform="translate(148, 114) rotate(8)">
      {/* Top Stopwatch Crown */}
      <rect x="-9" y="-66" width="18" height="14" rx="5" fill="url(#cdClockRim)" />
      <rect x="-15" y="-72" width="30" height="9" rx="4.5" fill="url(#cdClockRim)" />
      {/* Outer Gold Case */}
      <circle cx="0" cy="0" r="54" fill="url(#cdClockRim)" />
      <circle cx="0" cy="0" r="44" fill="#FFFFFF" />
      <circle cx="0" cy="0" r="40" stroke="#E0E7FF" strokeWidth="3" />
      {/* Progress Arc */}
      <path
        d="M 0 -34 A 34 34 0 1 1 -28 19"
        stroke="url(#cdHeader)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Clock Hands */}
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#1E1B4B" strokeWidth="5" strokeLinecap="round" />
      <line x1="0" y1="0" x2="18" y2="10" stroke="#EC4899" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="0" cy="0" r="6" fill="url(#cdClockRim)" />
      {/* Specular Highlight */}
      <path d="M -30 -24 Q -16 -38 6 -36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
    </g>

    {/* Floating 51st BCS Star Pill */}
    <g transform="translate(146, 18) rotate(10)">
      <rect x="0" y="0" width="68" height="36" rx="18" fill="url(#cdAqua)" stroke="#FFFFFF" strokeWidth="2" />
      <text
        x="28"
        y="24"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="800"
        fontFamily="Fredoka, sans-serif"
      >
        51st
      </text>
      <polygon
        points="54,10 56,15 61,16 57,19 58,24 54,21 50,24 51,19 47,16 52,15"
        fill="#FEF08A"
      />
    </g>
  </svg>
);

/* ============================================================================
   07. TOPIC MASTER — 3D CRYSTAL SYLLABUS COMPASS & KNOWLEDGE CONSTELLATION
   ============================================================================ */
export const TopicMaster3DIllustration: React.FC<{ className?: string }> = ({
  className = 'w-32 h-32'
}) => (
  <svg viewBox="0 0 240 210" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <radialGradient id="tmAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.9" />
        <stop offset="55%" stopColor="#C4B5FD" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="tmRing" x1="30" y1="25" x2="210" y2="185" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="52%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="tmCore" x1="65" y1="55" x2="175" y2="160" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="65%" stopColor="#EEF2FF" />
        <stop offset="100%" stopColor="#C7D2FE" />
      </linearGradient>
      <linearGradient id="tmGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="tmAqua" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
      <linearGradient id="tmRose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F9A8D4" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="tmMint" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>

    <circle cx="120" cy="102" r="90" fill="url(#tmAura)" />
    <ellipse cx="120" cy="182" rx="68" ry="11" fill="#4338CA" fillOpacity="0.18" />

    {/* Orbiting Syllabus Constellation Ring */}
    <ellipse
      cx="120"
      cy="104"
      rx="82"
      ry="34"
      transform="rotate(-18 120 104)"
      stroke="url(#tmRing)"
      strokeWidth="6"
      strokeDasharray="10 8"
      opacity="0.55"
    />

    {/* Central 3D Syllabus Target Emblem */}
    <circle cx="120" cy="102" r="62" fill="url(#tmRing)" />
    <circle cx="120" cy="102" r="51" fill="url(#tmCore)" stroke="#FFFFFF" strokeWidth="2.5" />
    <circle cx="120" cy="102" r="35" stroke="#818CF8" strokeWidth="5" strokeDasharray="140 44" strokeLinecap="round" />
    <circle cx="120" cy="102" r="20" fill="url(#tmRing)" opacity="0.16" />

    {/* 3D Compass Needle / Star Core */}
    <polygon points="120,64 131,93 158,102 131,111 120,140 109,111 82,102 109,93" fill="url(#tmGold)" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="120" cy="102" r="8" fill="#FFFFFF" />
    <circle cx="120" cy="102" r="4" fill="#6366F1" />

    {/* Orbiting Topic Nodes (4 colorful pills/orbs) */}
    <g transform="translate(36, 48)">
      <circle cx="16" cy="16" r="16" fill="url(#tmAqua)" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M 10 16 L 14 20 L 22 12" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g transform="translate(174, 34)">
      <circle cx="15" cy="15" r="15" fill="url(#tmRose)" stroke="#FFFFFF" strokeWidth="2.5" />
      <polygon points="15,8 17,13 22,13 18,16 19,21 15,18 11,21 12,16 8,13 13,13" fill="#FEF08A" />
    </g>
    <g transform="translate(176, 128)">
      <circle cx="16" cy="16" r="16" fill="url(#tmMint)" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M 11 19 L 15 13 L 18 16 L 22 11" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <g transform="translate(32, 134)">
      <rect x="0" y="0" width="54" height="26" rx="13" fill="url(#tmGold)" stroke="#FFFFFF" strokeWidth="2" />
      <text x="27" y="17" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="Fredoka, sans-serif">
        200M
      </text>
    </g>
  </svg>
);



