#!/usr/bin/env node
// Gera todos os SVGs animados do README a partir de profile.json.
//   npm run build
// Cada peça sai em duas versões (dark/light) para usar com <picture>.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  THEMES,
  FONT_MONO,
  FONT_SANS,
  esc,
  svg,
  mono,
  sansW,
  wrap,
  mulberry32,
  f,
  animate,
  commonDefs,
  sweepDefs,
  card,
  heart,
} from './lib/ui.mjs';
import { renderDashboard, mockData } from './stats.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'assets');
const profile = JSON.parse(readFileSync(resolve(ROOT, 'profile.json'), 'utf8'));
mkdirSync(OUT, { recursive: true });

const write = (name, content) => writeFileSync(resolve(OUT, name), content);
const shadesOf = (t) => [t.b3, t.b4, t.b5, t.cy, t.b2];

/* ============================== HERO =============================== */

function hero(t, p) {
  const W = 1200;
  const H = 460;
  const rnd = mulberry32(7);
  const defs = commonDefs(t) + sweepDefs(t, W, 8);
  let b = '';

  b += `<rect width="${W}" height="${H}" fill="url(#bgG)"/>`;
  b += `<rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#fadeM)"/>`;

  // orbs
  const orb = (cx, cy, r, color, op, dx, dy, dur) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op}" filter="url(#blur60)">` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/></circle>`;
  b += orb(180, 80, 190, t.b2, t.orb, 80, 40, 14);
  b += orb(980, 360, 210, t.b3, t.orb * 0.9, -90, -30, 17);
  b += orb(620, 40, 150, t.cy, t.orb * 0.55, 40, 60, 12);

  // constelação
  const pts = Array.from({ length: 34 }, () => [40 + rnd() * (W - 80), 24 + rnd() * (H - 60), rnd()]);
  pts.forEach(([x1, y1], i) => {
    pts.slice(i + 1).forEach(([x2, y2]) => {
      const d = Math.hypot(x1 - x2, y1 - y2);
      if (d < 150) {
        b += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${t.b4}" stroke-opacity="${f(0.22 * (1 - d / 150))}"/>`;
      }
    });
  });
  pts.forEach(([x, y, r], i) => {
    b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + r * 1.6)}" fill="${t.b5}">${animate(
      'opacity',
      [0.25, 0.95, 0.25],
      [0, 0.5, 1],
      3 + (i % 5) * 0.8,
      `begin="${f(r * 3)}s"`
    )}</circle>`;
  });

  // status pill
  const stText = p.status;
  const pillW = Math.ceil(stText.length * mono(13) + 52);
  b += `<rect x="72" y="58" width="${pillW}" height="34" rx="17" fill="${t.panel}" fill-opacity="${t.name === 'dark' ? 0.7 : 0.9}" stroke="${t.line}"/>`;
  b += `<circle cx="94" cy="75" r="4.5" fill="${t.cy}"/>`;
  b += `<circle cx="94" cy="75" r="4.5" fill="${t.cy}">` +
    `<animate attributeName="r" values="4.5;13;4.5" dur="2.4s" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="0.7;0;0.7" dur="2.4s" repeatCount="indefinite"/></circle>`;
  b += `<text x="112" y="80" font-family="${FONT_MONO}" font-size="13" fill="${t.muted}">${esc(stText)}</text>`;

  // nome
  const nameSize = Math.min(72, Math.floor(580 / (p.name.length * 0.6)));
  b += `<text x="70" y="172" font-family="${FONT_SANS}" font-size="${nameSize}" font-weight="800" letter-spacing="-2.5" fill="url(#tg)">${esc(p.name)}</text>`;

  // tagline
  wrap(p.tagline, 50)
    .slice(0, 2)
    .forEach((ln, i) => {
      b += `<text x="72" y="${216 + i * 28}" font-family="${FONT_SANS}" font-size="21" fill="${t.muted}">${esc(ln)}</text>`;
    });

  // roles digitando
  const N = p.roles.length;
  const T = 4.2;
  const D = N * T;
  const x0 = 104;
  const ty = 292;
  b += `<text x="72" y="${ty + 22}" font-family="${FONT_MONO}" font-size="22" fill="${t.b4}" font-weight="700">›</text>`;
  p.roles.forEach((role, i) => {
    const w = Math.ceil(role.length * mono(22)) + 4;
    const t0 = i / N;
    const t1 = t0 + 0.38 / N;
    const t2 = t0 + 0.82 / N;
    const t3 = (i + 1) / N;
    const kt = [];
    const vw = [];
    const vx = [];
    const vo = [];
    const push = (k, width, op) => {
      if (kt.length && kt[kt.length - 1] === k && vw[vw.length - 1] === width && vo[vo.length - 1] === op) return;
      kt.push(k);
      vw.push(width);
      vx.push(f(x0 + width));
      vo.push(op);
    };
    push(0, 0, i === 0 ? 1 : 0);
    if (t0 > 0) push(t0, 0, 1);
    push(t1, w, 1);
    push(t2, w, 1);
    push(t3, 0, i === N - 1 ? 1 : 0);
    if (t3 < 1) push(1, 0, 0);
    b += `<clipPath id="rc${i}"><rect x="${x0}" y="${ty - 4}" width="${i === 0 ? w : 0}" height="34">${animate('width', vw, kt, D)}</rect></clipPath>`;
    b += `<text clip-path="url(#rc${i})" x="${x0}" y="${ty + 22}" font-family="${FONT_MONO}" font-size="22" fill="${t.text}" font-weight="600">${esc(role)}</text>`;
    // cursor (opacidade discreta: só aparece durante a janela deste papel)
    const kc = [0];
    const vc = [i === 0 ? 1 : 0];
    if (t0 > 0) {
      kc.push(t0);
      vc.push(1);
    }
    if (t3 < 1) {
      kc.push(t3);
      vc.push(0);
    }
    b += `<rect x="${x0}" y="${ty}" width="2.5" height="26" rx="1" fill="${t.cy}" opacity="0">${animate('x', vx, kt, D)}${animate('opacity', vc, kc, D, 'calcMode="discrete"')}</rect>`;
  });

  // chips
  let cx = 72;
  p.heroChips.forEach((chip, i) => {
    const w = Math.ceil(chip.length * mono(13) + 34);
    b += `<rect x="${cx}" y="338" width="${w}" height="32" rx="9" fill="${t.panel}" fill-opacity="${t.name === 'dark' ? 0.55 : 0.95}" stroke="${t.line}"/>`;
    b += `<circle cx="${cx + 15}" cy="354" r="3.5" fill="${shadesOf(t)[i % 5]}">${animate('opacity', [0.4, 1, 0.4], [0, 0.5, 1], 2.6, `begin="${f(i * 0.4)}s"`)}</circle>`;
    b += `<text x="${cx + 26}" y="359" font-family="${FONT_MONO}" font-size="13" fill="${t.text}">${esc(chip)}</text>`;
    cx += w + 10;
  });

  // janela de código
  const wx = 700;
  const wy = 60;
  const ww = 440;
  const wh = 330;
  b += `<rect x="${wx + 14}" y="${wy + 22}" width="${ww}" height="${wh}" rx="18" fill="${t.b3}" opacity="${t.name === 'dark' ? 0.28 : 0.18}" filter="url(#blur8)"/>`;
  b += `<g transform="rotate(-1.6 ${wx + ww / 2} ${wy + wh / 2})">`;
  b += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="18" fill="url(#panelG)"/>`;
  b += `<rect x="${wx + 0.5}" y="${wy + 0.5}" width="${ww - 1}" height="${wh - 1}" rx="18" stroke="${t.line}"/>`;
  b += `<rect x="${wx + 0.5}" y="${wy + 0.5}" width="${ww - 1}" height="${wh - 1}" rx="18" stroke="url(#sweep)" stroke-width="1.6"/>`;
  [t.b2, t.b4, t.b5].forEach((c, i) => (b += `<circle cx="${wx + 24 + i * 18}" cy="${wy + 22}" r="5.5" fill="${c}" opacity="0.9"/>`));
  b += `<text x="${wx + ww / 2}" y="${wy + 27}" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" fill="${t.dim}">profile.ts</text>`;
  b += `<line x1="${wx}" y1="${wy + 44}" x2="${wx + ww}" y2="${wy + 44}" stroke="${t.line}" stroke-opacity="0.7"/>`;

  const col = { kw: t.b4, id: t.text, prop: t.b5, str: t.cy, p: t.muted, cm: t.dim, fn: t.b3 };
  let chipStr = [];
  let used = 0;
  for (const c of p.heroChips) {
    if (used + c.length + 4 > 34) break;
    chipStr.push(c);
    used += c.length + 4;
  }
  const lines = [
    [['const ', 'kw'], ['dev ', 'id'], ['= {', 'p']],
    [['  name: ', 'prop'], [`"${p.name}"`, 'str'], [',', 'p']],
    [['  stack: ', 'prop'], ['[', 'p'], [chipStr.map((c) => `"${c}"`).join(', '), 'str'], ['],', 'p']],
    [['  focus: ', 'prop'], [`"${p.focus}"`, 'str'], [',', 'p']],
    [['  coffee: ', 'prop'], ['Infinity', 'fn'], [',', 'p']],
    [['};', 'p']],
    [],
    [['dev', 'id'], ['.ship', 'fn'], ['(); ', 'p'], ['// build passing', 'cm']],
  ];
  const clipId = 'winClip';
  b += `<clipPath id="${clipId}"><rect x="${wx + 1}" y="${wy + 45}" width="${ww - 2}" height="${wh - 46}" rx="0"/></clipPath>`;
  lines.forEach((ln, i) => {
    const y = wy + 80 + i * 28;
    b += `<text x="${wx + 22}" y="${y}" font-family="${FONT_MONO}" font-size="12" fill="${t.dim}" fill-opacity="0.7">${i + 1}</text>`;
    if (ln.length) {
      b += `<text x="${wx + 52}" y="${y}" font-family="${FONT_MONO}" font-size="14" xml:space="preserve">${ln
        .map(([s, k]) => `<tspan fill="${col[k]}">${esc(s)}</tspan>`)
        .join('')}</text>`;
    }
  });
  // cursor do editor
  b += `<rect x="${wx + 52 + 15 * mono(14) + 130}" y="${wy + 80 + 7 * 28 - 14}" width="8" height="18" fill="${t.cy}" opacity="0.9">${animate('opacity', [0.9, 0.9, 0, 0], [0, 0.5, 0.5, 1], 1.1)}</rect>`;
  // varredura
  b += `<g clip-path="url(#${clipId})"><rect x="${wx}" y="${wy + 45}" width="${ww}" height="46" fill="${t.b4}" opacity="0.07">${animate('y', [wy + 20, wy + wh - 20, wy + 20], [0, 0.5, 1], 6)}</rect></g>`;
  b += `</g>`;

  // linha inferior
  b += `<rect x="0" y="${H - 2}" width="${W}" height="2" fill="url(#accG)" opacity="0.8"/>`;
  return svg(W, H, b, defs, `Banner de ${p.name}`);
}

/* ======================= CABEÇALHOS DE SEÇÃO ======================= */

function sectionHeader(t, n, title, sub) {
  const W = 1200;
  const H = 76;
  const defs = commonDefs(t);
  let b = '';
  b += `<rect x="0" y="14" width="46" height="46" rx="13" fill="url(#accG)"/>`;
  b += `<rect x="0.5" y="14.5" width="45" height="45" rx="12.5" stroke="#fff" stroke-opacity="0.25"/>`;
  b += `<text x="23" y="43" text-anchor="middle" font-family="${FONT_MONO}" font-size="16" font-weight="700" fill="#fff">${esc(n)}</text>`;
  b += `<text x="66" y="37" font-family="${FONT_SANS}" font-size="28" font-weight="800" letter-spacing="-0.8" fill="${t.text}">${esc(title)}</text>`;
  b += `<text x="67" y="58" font-family="${FONT_MONO}" font-size="12.5" fill="${t.muted}">${esc(sub)}</text>`;
  const lx = 66 + Math.ceil(sansW(title, 28, true)) + 28;
  b += `<rect x="${lx}" y="29.25" width="${W - lx}" height="1.5" rx="0.75" fill="url(#lineG)"/>`;
  b += `<circle r="4" cy="30" fill="${t.cy}" filter="url(#blur3)">${animate('cx', [lx, W - 40, lx], [0, 0.5, 1], 5)}</circle>`;
  b += `<circle r="2.4" cy="30" fill="${t.b5}">${animate('cx', [lx, W - 40, lx], [0, 0.5, 1], 5)}</circle>`;
  return svg(W, H, b, defs, title);
}

/* ============================ TERMINAL ============================= */

function terminal(t, p) {
  const W = 620;
  const H = 340;
  const defs = commonDefs(t) + sweepDefs(t, W, 8);
  const cs = 14.5;
  const cw = mono(cs);
  let b = card(t, 0, 0, W, H, 18);
  [t.b2, t.b4, t.b5].forEach((c, i) => (b += `<circle cx="${26 + i * 18}" cy="24" r="5.5" fill="${c}" opacity="0.9"/>`));
  b += `<text x="${W / 2}" y="29" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" fill="${t.dim}">~/sobre — zsh</text>`;
  b += `<line x1="1" y1="46" x2="${W - 1}" y2="46" stroke="${t.line}" stroke-opacity="0.7"/>`;

  // linha do tempo
  const speed = 0.055;
  let ct = 0.6;
  const items = [];
  p.terminal.forEach((s) => {
    const cmdStart = ct;
    const cmdEnd = cmdStart + s.cmd.length * speed;
    const outStart = cmdEnd + 0.35;
    items.push({ ...s, cmdStart, cmdEnd, outStart });
    ct = outStart + 0.9;
  });
  const hold = 4.5;
  const total = ct + hold;
  const reset = (total - 0.5) / total;
  const px = 28;
  const startY = 84;
  const step = 56;
  const promptW = 2 * cw;

  items.forEach((it, i) => {
    const y = startY + i * step;
    const wFull = Math.ceil(it.cmd.length * cw) + 2;
    const a = it.cmdStart / total;
    const e = it.cmdEnd / total;
    b += `<text x="${px}" y="${y}" font-family="${FONT_MONO}" font-size="${cs}" fill="${t.cy}" font-weight="700">$<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${f(a)};${f(a + 0.001)};${f(reset)};1" dur="${total}s" repeatCount="indefinite"/></text>`;
    b += `<clipPath id="tc${i}"><rect x="${px + promptW}" y="${y - 16}" width="${wFull}" height="22">${animate('width', [0, 0, wFull, wFull, 0], [0, a, e, reset, 1], total)}</rect></clipPath>`;
    b += `<text clip-path="url(#tc${i})" x="${px + promptW}" y="${y}" font-family="${FONT_MONO}" font-size="${cs}" fill="${t.text}">${esc(it.cmd)}</text>`;
    const o = it.outStart / total;
    b += `<text x="${px + promptW}" y="${y + 24}" font-family="${FONT_MONO}" font-size="${cs - 1}" fill="${t.muted}" opacity="0">${esc(
      it.out
    )}${animate('opacity', [0, 0, 1, 1, 0], [0, o, o + 0.02, reset, 1], total)}</text>`;
  });
  const last = items[items.length - 1];
  const cy = startY + items.length * step;
  const ca = (last.outStart + 0.4) / total;
  b += `<text x="${px}" y="${cy}" font-family="${FONT_MONO}" font-size="${cs}" fill="${t.cy}" font-weight="700" opacity="0">$${animate(
    'opacity',
    [0, 0, 1, 1, 0],
    [0, ca, ca + 0.01, reset, 1],
    total
  )}</text>`;
  b += `<rect x="${px + promptW}" y="${cy - 14}" width="9" height="18" fill="${t.cy}" opacity="0">${animate(
    'opacity',
    [0, 0, 1, 0, 1, 0],
    [0, ca, ca + 0.01, ca + 0.04, ca + 0.07, 1],
    total
  )}</rect>`;
  return svg(W, H, b, defs, 'Terminal com apresentação');
}

/* ============================== STACK ============================== */

function stack(t, p) {
  const W = 1200;
  const gap = 20;
  const cols = 3;
  const cw = (W - gap * (cols - 1)) / cols;
  const chipH = 32;
  const chipGap = 10;
  const pad = 24;
  const cats = Object.entries(p.stack);
  const defs = commonDefs(t) + sweepDefs(t, W, 10);

  const layout = cats.map(([name, items]) => {
    const rows = [[]];
    let x = 0;
    const inner = cw - pad * 2;
    items.forEach((it) => {
      const w = Math.ceil(it.length * mono(13) + 36);
      if (x + w > inner && rows[rows.length - 1].length) {
        rows.push([]);
        x = 0;
      }
      rows[rows.length - 1].push({ it, w, x });
      x += w + chipGap;
    });
    return { name, rows, h: 66 + rows.length * (chipH + chipGap) - chipGap + pad };
  });

  const nRows = Math.ceil(layout.length / cols);
  const rowH = [];
  for (let r = 0; r < nRows; r++) {
    rowH.push(Math.max(...layout.slice(r * cols, r * cols + cols).map((l) => l.h)));
  }
  const H = rowH.reduce((s, h) => s + h, 0) + gap * (nRows - 1);

  let b = '';
  let y = 0;
  for (let r = 0; r < nRows; r++) {
    layout.slice(r * cols, r * cols + cols).forEach((cat, c) => {
      const x = c * (cw + gap);
      b += card(t, x, y, cw, rowH[r], 18);
      b += `<rect x="${x + pad}" y="${y + 24}" width="22" height="22" rx="7" fill="url(#accG)"/>`;
      b += `<text x="${x + pad + 11}" y="${y + 40}" text-anchor="middle" font-family="${FONT_MONO}" font-size="11" font-weight="700" fill="#fff">${String(r * cols + c + 1).padStart(2, '0')}</text>`;
      b += `<text x="${x + pad + 34}" y="${y + 41}" font-family="${FONT_SANS}" font-size="16" font-weight="700" fill="${t.text}">${esc(cat.name)}</text>`;
      const count = cat.rows.reduce((s, row) => s + row.length, 0);
      b += `<text x="${x + cw - pad}" y="${y + 40}" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${t.dim}">${String(count).padStart(2, '0')}</text>`;
      let k = 0;
      cat.rows.forEach((row, ri) => {
        row.forEach((chip) => {
          const cx = x + pad + chip.x;
          const cy = y + 66 + ri * (chipH + chipGap);
          b += `<rect x="${cx}" y="${cy}" width="${chip.w}" height="${chipH}" rx="10" fill="${t.panel2}" fill-opacity="${t.name === 'dark' ? 0.65 : 1}" stroke="${t.line}" stroke-opacity="0.85"/>`;
          b += `<circle cx="${cx + 15}" cy="${cy + 16}" r="3.6" fill="${shadesOf(t)[k % 5]}">${animate(
            'opacity',
            [0.35, 1, 0.35],
            [0, 0.5, 1],
            3.2,
            `begin="${f(((r * 3 + c) * 7 + k) * 0.23)}s"`
          )}</circle>`;
          b += `<text x="${cx + 27}" y="${cy + 21}" font-family="${FONT_MONO}" font-size="13" fill="${t.text}">${esc(chip.it)}</text>`;
          k++;
        });
      });
    });
    y += rowH[r] + gap;
  }
  return svg(W, H, b, defs, 'Tecnologias e ferramentas');
}

/* ============================= PROJETOS ============================ */

function projectCard(t, proj, handle) {
  const W = 590;
  const H = 232;
  const defs = commonDefs(t) + sweepDefs(t, W, 8);
  let b = card(t, 0, 0, W, H, 18);
  // pasta
  b += `<path d="M28 30h10l3 4h15a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3V33a3 3 0 0 1 3-3z" fill="url(#accG)"/>`;
  b += `<text x="70" y="52" font-family="${FONT_MONO}" font-size="17" font-weight="700" fill="${t.text}">${esc(proj.name)}</text>`;

  const st = proj.status;
  const stColor = st.startsWith('ativ') ? t.cy : st.startsWith('em ') ? t.b5 : t.dim;
  const sw = Math.ceil(st.length * mono(12) + 40);
  b += `<rect x="${W - 28 - sw}" y="32" width="${sw}" height="28" rx="14" fill="${t.panel2}" fill-opacity="${t.name === 'dark' ? 0.8 : 1}" stroke="${t.line}"/>`;
  b += `<circle cx="${W - 28 - sw + 16}" cy="46" r="4" fill="${stColor}">${animate('opacity', [1, 0.3, 1], [0, 0.5, 1], 2.2)}</circle>`;
  b += `<text x="${W - 28 - sw + 28}" y="50" font-family="${FONT_MONO}" font-size="12" fill="${t.muted}">${esc(st)}</text>`;

  wrap(proj.desc, 62)
    .slice(0, 3)
    .forEach((ln, i) => {
      b += `<text x="28" y="${92 + i * 24}" font-family="${FONT_SANS}" font-size="15" fill="${t.muted}">${esc(ln)}</text>`;
    });

  let x = 28;
  proj.tags.forEach((tag, i) => {
    const w = Math.ceil(tag.length * mono(12) + 28);
    b += `<rect x="${x}" y="164" width="${w}" height="26" rx="8" fill="${t.b3}" fill-opacity="${t.name === 'dark' ? 0.14 : 0.1}" stroke="${t.b4}" stroke-opacity="0.45"/>`;
    b += `<text x="${x + 14}" y="181" font-family="${FONT_MONO}" font-size="12" fill="${t.b5 === t.text ? t.text : t.name === 'dark' ? t.b5 : t.b3}">${esc(tag)}</text>`;
    x += w + 8;
  });

  b += `<line x1="28" y1="204" x2="${W - 28}" y2="204" stroke="${t.line}" stroke-opacity="0.6" stroke-dasharray="3 5"/>`;
  b += `<text x="28" y="223" font-family="${FONT_MONO}" font-size="11.5" fill="${t.dim}">github.com/${esc(handle)}/${esc(proj.name)}</text>`;
  b += `<text x="${W - 28}" y="223" text-anchor="end" font-family="${FONT_MONO}" font-size="12" fill="${t.b4}">abrir →</text>`;
  return svg(W, H, b, defs, `Projeto ${proj.name}`);
}

/* ============================== BOTÕES ============================= */

function linkButton(t, link) {
  const label = link.label;
  const W = Math.ceil(76 + sansW(label, 15, true) + 28);
  const H = 56;
  const defs = commonDefs(t) + sweepDefs(t, W, 5);
  let b = card(t, 0, 0, W, H, 16);
  b += `<rect x="10" y="10" width="36" height="36" rx="11" fill="url(#accG)"/>`;
  b += `<text x="28" y="34" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" font-weight="800" fill="#fff">${esc(link.glyph)}</text>`;
  b += `<text x="60" y="34" font-family="${FONT_SANS}" font-size="15" font-weight="700" fill="${t.text}">${esc(label)}</text>`;
  b += `<path d="M${W - 26} 22l6 6-6 6" stroke="${t.b4}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(W, H, b, defs, label);
}

/* ============================== RODAPÉ ============================= */

function footer(t, p) {
  const W = 1200;
  const H = 230;
  const defs =
    commonDefs(t) +
    `<linearGradient id="wv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.b4}" stop-opacity="0.55"/><stop offset="1" stop-color="${t.b1}" stop-opacity="0.08"/></linearGradient>`;
  const wave = (base, amp, period, phase) => {
    let d = `M${-period + phase} ${base}`;
    const segs = Math.ceil((W + period * 2) / (period / 2));
    for (let i = 0; i < segs; i++) {
      const x = -period + phase + (i + 1) * (period / 2);
      const cx = x - period / 4;
      d += ` Q${f(cx)} ${base + (i % 2 === 0 ? -amp : amp)} ${f(x)} ${base}`;
    }
    return `${d} V${H} H${-period + phase} Z`;
  };
  let b = '';
  b += `<rect x="0" y="39.5" width="${W}" height="1" fill="url(#lineG)" opacity="0.7"/>`;
  b += `<text x="${W / 2}" y="94" text-anchor="middle" font-family="${FONT_SANS}" font-size="16" fill="${t.muted}">Feito com <tspan fill="${t.b4}">♥</tspan> e muito café</text>`;
  b += `<text x="${W / 2}" y="118" text-anchor="middle" font-family="${FONT_MONO}" font-size="12" fill="${t.dim}">© ${new Date().getFullYear()} ${esc(p.name)} · @${esc(p.handle)}</text>`;
  [
    [150, 16, 600, 0, 0.9, 11],
    [162, 12, 480, 90, 0.65, 15],
    [176, 9, 360, 40, 0.45, 19],
  ].forEach(([base, amp, period, phase, op, dur]) => {
    b += `<path d="${wave(base, amp, period, phase)}" fill="url(#wv)" opacity="${op}"><animateTransform attributeName="transform" type="translate" values="0 0;${period} 0" dur="${dur}s" repeatCount="indefinite"/></path>`;
  });
  return svg(W, H, b, defs, 'Rodapé');
}

/* ============================== BUILD ============================== */

const sections = [
  ['sobre', '01', 'Sobre', '// quem sou eu'],
  ['stack', '02', 'Stack', '// ferramentas do dia a dia'],
  ['numeros', '03', 'Números', '// atividade no github'],
  ['projetos', '04', 'Projetos', '// o que andei construindo'],
  ['processo', '05', 'Processo', '// como eu trabalho'],
  ['codigo', '06', 'Código', '// princípios e filosofia'],
  ['contato', '07', 'Contato', '// vamos conversar'],
];

for (const key of ['dark', 'light']) {
  const t = THEMES[key];
  write(`hero-${key}.svg`, hero(t, profile));
  write(`terminal-${key}.svg`, terminal(t, profile));
  write(`stack-${key}.svg`, stack(t, profile));
  write(`footer-${key}.svg`, footer(t, profile));
  for (const [id, n, title, sub] of sections) write(`h-${id}-${key}.svg`, sectionHeader(t, n, title, sub));
  profile.projects.forEach((pr, i) => write(`project-${i + 1}-${key}.svg`, projectCard(t, pr, profile.handle)));
  profile.links.forEach((l) => write(`btn-${l.id}-${key}.svg`, linkButton(t, l)));
  // painel de números: só cria exemplo se ainda não existir (o workflow gera o real)
  const dash = resolve(OUT, `dashboard-${key}.svg`);
  if (!existsSync(dash)) writeFileSync(dash, renderDashboard(mockData(), t));
}

console.log('assets gerados em', OUT);
