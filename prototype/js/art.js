// Original creature and postcard art as inline SVG.
// The postcard is the placeholder for Grok Imagine output.
import { hashString } from "./geo.js";

const PALETTES = [
  { sky: ["#ffd8a8", "#ffb4a2"], hills: ["#8fc97a", "#5fa052"], sun: "#fff3c4" },
  { sky: ["#bde0fe", "#a2d2ff"], hills: ["#95d5b2", "#52b788"], sun: "#ffffff" },
  { sky: ["#e0c3fc", "#ffc8dd"], hills: ["#b7e4c7", "#74c69d"], sun: "#fff0f3" },
  { sky: ["#caf0f8", "#90e0ef"], hills: ["#a7c957", "#6a994e"], sun: "#fefae0" },
];

export function creatureSvg(agent, level = 1) {
  const hat = level >= 2
    ? `<g transform="translate(32 9)">
         <circle r="4" fill="#ff8fab"/><circle cx="-5" cy="2" r="3" fill="#ffc2d1"/>
         <circle cx="5" cy="2" r="3" fill="#ffc2d1"/><circle r="2" fill="#ffe066"/>
       </g>`
    : "";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${agent.name}">
      <path d="M32 18 C30 8 22 6 20 4 C26 4 33 8 32 18" fill="${agent.leaf}"/>
      <ellipse cx="32" cy="40" rx="18" ry="20" fill="${agent.color}"/>
      <ellipse cx="32" cy="46" rx="10" ry="8" fill="#ffffff" opacity="0.25"/>
      <circle cx="25" cy="36" r="3.2" fill="#2c3a2a"/>
      <circle cx="39" cy="36" r="3.2" fill="#2c3a2a"/>
      <circle cx="26" cy="35" r="1" fill="#fff"/>
      <circle cx="40" cy="35" r="1" fill="#fff"/>
      <path d="M28 44 Q32 47 36 44" stroke="#2c3a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="42" rx="3" ry="2" fill="#ff8a8a" opacity="0.5"/>
      <ellipse cx="42" cy="42" rx="3" ry="2" fill="#ff8a8a" opacity="0.5"/>
      ${hat}
    </svg>`;
}

export function postcardSvg(placeTitle, agent) {
  const palette = PALETTES[hashString(placeTitle) % PALETTES.length];
  return `
    <svg viewBox="0 0 400 180">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${palette.sky[0]}"/>
          <stop offset="1" stop-color="${palette.sky[1]}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="180" fill="url(#sky)"/>
      <circle cx="320" cy="50" r="26" fill="${palette.sun}" opacity="0.9"/>
      <path d="M0 120 Q100 70 200 115 T400 105 V180 H0 Z" fill="${palette.hills[0]}"/>
      <path d="M0 150 Q120 110 240 145 T400 140 V180 H0 Z" fill="${palette.hills[1]}"/>
      <path d="M120 180 Q190 150 210 128" stroke="#f1e3c6" stroke-width="10" fill="none" stroke-linecap="round"/>
      <text x="200" y="166" text-anchor="middle" font-size="12" fill="#fff" font-family="system-ui">
        🌸 🌼 🌷 Wish you were here! 🌷 🌼 🌸
      </text>
      <g transform="translate(36 70) scale(1.3)">${creatureSvg(agent)}</g>
    </svg>`;
}
