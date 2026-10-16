/* ---------- logo SVG ---------- */
let logoN = 0;
function logoSVG(size = 44, vivo = true) {
  const k = 'lq' + (logoN++);
  return `<svg class="logo ${vivo ? 'logo-vivo' : ''}" width="${size}" height="${size}" viewBox="0 0 240 240" role="img" aria-label="Logotipo Lobitos: lobo con red neuronal" data-logo>
  <defs>
    <linearGradient id="${k}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#94243F"/><stop offset="1" stop-color="#4A0E1E"/></linearGradient>
    <linearGradient id="${k}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE95"/><stop offset=".55" stop-color="#C8A04A"/><stop offset="1" stop-color="#8F6B22"/></linearGradient>
    <linearGradient id="${k}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E2D7DA"/></linearGradient>
  </defs>
  <path d="M120 8 L212 44 V124 C212 178 172 214 120 232 C68 214 28 178 28 124 V44 Z" fill="url(#${k}e)" stroke="url(#${k}o)" stroke-width="6" stroke-linejoin="round"/>
  <path d="M120 22 L200 53 V124 C200 170 166 201 120 218 C74 201 40 170 40 124 V53 Z" fill="none" stroke="#D9B45E" stroke-opacity=".35" stroke-width="1.5"/>
  <path class="chispa" d="M120 26 L124.5 39.5 L138 44 L124.5 48.5 L120 62 L115.5 48.5 L102 44 L115.5 39.5 Z" fill="url(#${k}o)"/>
  <g class="lobo">
    <path d="M120 70 L96 74 L64 38 L60 104 L50 130 L76 158 L104 184 L120 194 L136 184 L164 158 L190 130 L180 104 L176 38 L144 74 Z" fill="url(#${k}p)"/>
    <path d="M70 54 L90 76 L66 94 Z" fill="#5C1226"/><path d="M170 54 L150 76 L174 94 Z" fill="#5C1226"/>
    <path d="M60 104 L50 130 L76 158 L84 124 Z" fill="#CDBEC3"/><path d="M180 104 L190 130 L164 158 L156 124 Z" fill="#CDBEC3"/>
    <path d="M76 158 L104 184 L106 158 Z" fill="#B9A7AD"/><path d="M164 158 L136 184 L134 158 Z" fill="#B9A7AD"/>
    <path d="M96 74 L120 70 L144 74 L132 112 L120 134 L108 112 Z" fill="#2A0B15"/>
    <path class="ojo" d="M74 110 L104 117 L95 128 Z" fill="url(#${k}o)"/><path class="ojo" d="M166 110 L136 117 L145 128 Z" fill="url(#${k}o)"/>
    <path d="M108 142 L120 134 L132 142 L130 172 L120 186 L110 172 Z" fill="#FFFFFF"/>
    <path d="M109 165 L131 165 L120 178 Z" fill="#1A1214"/>
    <path d="M120 178 V186" stroke="#1A1214" stroke-width="2.2" stroke-linecap="round"/>
  </g>
  <g class="red" stroke="url(#${k}o)" stroke-width="1.8" fill="none" stroke-linecap="round">
    <path d="M120 82 L110 93"/><path d="M120 82 L130 93"/><path d="M110 93 L130 93"/><path d="M110 93 L114 107"/>
    <path d="M130 93 L126 107"/><path d="M114 107 L126 107"/><path d="M114 107 L120 121"/><path d="M126 107 L120 121"/><path d="M110 93 L126 107"/>
  </g>
  <g fill="#F6DE95">
    <circle class="nodo" cx="120" cy="82" r="3.4"/><circle class="nodo" cx="110" cy="93" r="2.7"/><circle class="nodo" cx="130" cy="93" r="2.7"/>
    <circle class="nodo" cx="114" cy="107" r="2.7"/><circle class="nodo" cx="126" cy="107" r="2.7"/><circle class="nodo" cx="120" cy="121" r="3.4"/>
  </g>
  <g class="panel-trivia">
    <rect x="56" y="196" width="128" height="26" rx="5" fill="#1A1214" stroke="url(#${k}o)" stroke-width="2.5"/>
    <path d="M98.7 199 V219 M141.3 199 V219" stroke="#C8A04A" stroke-opacity=".6" stroke-width="1.5"/>
    <g fill="#F6DE95" font-family="Saira Condensed, Arial Narrow, Arial, sans-serif" font-weight="800" font-size="15" text-anchor="middle">
      <text x="77.3" y="214.5">100</text><text x="120" y="214.5">80</text><text x="162.7" y="214.5">60</text>
    </g>
  </g>
</svg>`;
}

export { logoSVG };
