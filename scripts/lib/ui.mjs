// Sistema de design compartilhado: temas, helpers de SVG, animação e texto.
// Zero dependências — roda em qualquer Node 18+.

export const FONT_MONO =
  "ui-monospace,SFMono-Regular,'JetBrains Mono','Cascadia Code',Menlo,Consolas,'Liberation Mono',monospace";
export const FONT_SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,'Helvetica Neue',Arial,sans-serif";

export const THEMES = {
  dark: {
    name: 'dark',
    bg0: '#030A18',
    bg1: '#081738',
    panel: '#0A1B3F',
    panel2: '#0E2252',
    line: '#1D3A7A',
    text: '#EAF2FF',
    muted: '#8AA3D1',
    dim: '#6B84B8',
    b1: '#1E40AF',
    b2: '#2563EB',
    b3: '#3B82F6',
    b4: '#60A5FA',
    b5: '#93C5FD',
    cy: '#38BDF8',
    orb: 0.5,
    grid: 0.16,
    heat: ['#0C1D44', '#16337D', '#1D4ED8', '#3B82F6', '#93C5FD'],
  },
  light: {
    name: 'light',
    bg0: '#F8FBFF',
    bg1: '#E3EDFF',
    panel: '#FFFFFF',
    panel2: '#EEF4FF',
    line: '#B9CEF5',
    text: '#0A1B3D',
    muted: '#4B6393',
    dim: '#6F87B6',
    b1: '#1E3A8A',
    b2: '#1D4ED8',
    b3: '#2563EB',
    b4: '#3B82F6',
    b5: '#60A5FA',
    cy: '#0284C7',
    orb: 0.28,
    grid: 0.35,
    heat: ['#E2EBFB', '#BDD3FA', '#8DB2F5', '#3B82F6', '#1D4ED8'],
  },
};

export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const svg = (w, h, body, defs = '', label = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img"${
    label ? ` aria-label="${esc(label)}"` : ''
  }>${label ? `<title>${esc(label)}</title>` : ''}<defs>${defs}</defs>${body}</svg>`;

export const mono = (size) => size * 0.602;
export const sansW = (str, size, bold = false) =>
  str.length * size * (bold ? 0.6 : 0.55);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f = (n) => +Number(n).toFixed(2);

/** <animate> com validação de keyTimes. */
export function animate(attr, values, keyTimes, dur, extra = '') {
  if (values.length !== keyTimes.length) {
    throw new Error(`animate(${attr}): values/keyTimes divergem`);
  }
  return `<animate attributeName="${attr}" values="${values.join(
    ';'
  )}" keyTimes="${keyTimes.map((k) => f(Math.min(1, Math.max(0, k)))).join(';')}" dur="${dur}s" repeatCount="indefinite" ${extra}/>`;
}

/** Quebra de texto simples por largura estimada. */
export function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Definições comuns: gradientes, filtros, grid. */
export function commonDefs(t) {
  return `
<linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${t.bg0}"/><stop offset="1" stop-color="${t.bg1}"/>
</linearGradient>
<linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${t.text}"/><stop offset="0.55" stop-color="${t.b4}"/><stop offset="1" stop-color="${t.cy}"/>
</linearGradient>
<linearGradient id="accG" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${t.b2}"/><stop offset="1" stop-color="${t.cy}"/>
</linearGradient>
<linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${t.b4}" stop-opacity="0.9"/>
  <stop offset="0.5" stop-color="${t.line}" stop-opacity="0.8"/>
  <stop offset="1" stop-color="${t.line}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="panelG" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${t.panel2}" stop-opacity="${t.name === 'dark' ? 0.85 : 1}"/>
  <stop offset="1" stop-color="${t.panel}" stop-opacity="${t.name === 'dark' ? 0.75 : 1}"/>
</linearGradient>
<filter id="blur60" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="blur8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="blur3" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
  <path d="M40 0H0V40" stroke="${t.line}" stroke-opacity="${t.grid}" stroke-width="1"/>
</pattern>
<radialGradient id="fadeG" cx="0.5" cy="0.45" r="0.65">
  <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
</radialGradient>
<mask id="fadeM"><rect width="100%" height="100%" fill="url(#fadeG)"/></mask>
`;
}

/** Gradiente de varredura (shimmer) para bordas de cards. */
export function sweepDefs(t, w, dur = 7) {
  return `
<linearGradient id="sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w * 0.45}" y2="0">
  <stop offset="0" stop-color="${t.line}" stop-opacity="0.55"/>
  <stop offset="0.5" stop-color="${t.b4}" stop-opacity="1"/>
  <stop offset="1" stop-color="${t.line}" stop-opacity="0.55"/>
  <animateTransform attributeName="gradientTransform" type="translate" values="${-w * 0.45} 0;${w} 0" dur="${dur}s" repeatCount="indefinite"/>
</linearGradient>`;
}

/** Card de vidro com borda de varredura. */
export function card(t, x, y, w, h, r = 18) {
  return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#panelG)"/>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" stroke="${t.line}" stroke-opacity="0.8"/>
  <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" stroke="url(#sweep)" stroke-width="1.5"/>
</g>`;
}

export const heart = (x, y, s, fill) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -6 C-3 -12 -14 -9 -14 0 C-14 8 -4 14 0 18 C4 14 14 8 14 0 C14 -9 3 -12 0 -6 Z" fill="${fill}"/>`;
