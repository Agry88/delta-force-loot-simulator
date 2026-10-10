<template>
  <svg class="operator" viewBox="0 0 240 520" aria-hidden="true">
    <defs>
      <radialGradient id="spot" cx="50%" cy="45%" r="55%">
        <stop offset="0" stop-color="#2a333c" stop-opacity="0.9" />
        <stop offset="1" stop-color="#0b0e11" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="cloth" x1="0" x2="1">
        <stop offset="0" stop-color="#4a5140" />
        <stop offset="1" stop-color="#2f3429" />
      </linearGradient>
      <linearGradient id="pants" x1="0" x2="1">
        <stop offset="0" stop-color="#2c3036" />
        <stop offset="1" stop-color="#1b1e22" />
      </linearGradient>
      <linearGradient id="skin" x1="0" x2="1">
        <stop offset="0" stop-color="#8c6c58" />
        <stop offset="1" stop-color="#5e4537" />
      </linearGradient>
    </defs>

    <ellipse cx="120" cy="250" rx="130" ry="250" fill="url(#spot)" />
    <ellipse cx="120" cy="503" rx="78" ry="9" fill="#000" opacity="0.55" />

    <!-- legs and boots -->
    <path d="M90 282 L84 400 L80 488 L106 490 L112 400 L119 290 Z" fill="url(#pants)" />
    <path d="M121 290 L128 400 L134 490 L160 488 L156 400 L150 282 Z" fill="url(#pants)" />
    <rect x="76" y="482" width="34" height="16" rx="4" fill="#121417" />
    <rect x="130" y="482" width="34" height="16" rx="4" fill="#121417" />
    <rect x="88" y="270" width="64" height="18" fill="#24281f" />

    <!-- torso and vest -->
    <path d="M76 142 Q120 124 164 142 L156 284 L84 284 Z" fill="url(#cloth)" />
    <path d="M86 158 L154 158 L150 272 L90 272 Z" fill="#2a2f25" />
    <g fill="#373d30" stroke="#1d2119" stroke-width="2">
      <rect x="92" y="222" width="18" height="40" rx="2" />
      <rect x="111" y="222" width="18" height="40" rx="2" />
      <rect x="130" y="222" width="18" height="40" rx="2" />
      <rect x="96" y="172" width="20" height="26" rx="2" />
    </g>

    <!-- left arm -->
    <path d="M80 146 Q60 162 58 212 L56 258 Q62 270 74 264 L78 214 Z" fill="url(#cloth)" />

    <!-- rifle -->
    <g transform="rotate(-24 120 245)">
      <rect x="26" y="230" width="34" height="24" rx="3" fill="#1b1e22" />
      <rect x="56" y="236" width="150" height="15" rx="3" fill="#202429" />
      <rect x="200" y="240" width="38" height="5" fill="#15181b" />
      <rect x="98" y="224" width="44" height="9" rx="2" fill="#121417" />
      <rect x="108" y="249" width="13" height="28" rx="2" fill="#16191c" />
      <rect x="140" y="250" width="9" height="18" rx="2" fill="#16191c" />
    </g>

    <!-- right arm over the rifle -->
    <path d="M160 142 Q184 160 180 216 L142 248 L130 234 L160 206 Z" fill="url(#cloth)" />
    <circle cx="66" cy="266" r="10" fill="#1d2024" />
    <circle cx="136" cy="242" r="10" fill="#1d2024" />

    <!-- head -->
    <rect x="110" y="110" width="20" height="22" fill="#5e4537" />
    <ellipse cx="120" cy="92" rx="22" ry="26" fill="url(#skin)" />
    <path d="M99 98 Q120 132 141 98 L141 108 Q120 128 99 108 Z" fill="#3a2d25" />
    <path d="M92 90 Q92 48 120 46 Q148 48 148 90 L142 82 L98 82 Z" fill="#6b6553" />
    <rect x="96" y="72" width="48" height="9" fill="#4b4a3d" />
    <rect x="100" y="60" width="40" height="13" rx="6" fill="#2b393f" stroke="#59646b" stroke-width="2" />
  </svg>
</template>

<style scoped>
.operator {
  width: 100%;
  height: 100%;
  max-height: 560px;
}
</style>
