#!/usr/bin/env node
// Gera o painel de estatísticas (dashboard) em SVG, com tema azul.
//   node scripts/stats.mjs          -> busca dados reais via GraphQL do GitHub
//   node scripts/stats.mjs --mock   -> usa dados de exemplo (sem rede)
//
// Variáveis de ambiente (modo real): GH_TOKEN (ou GITHUB_TOKEN) e GH_LOGIN.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  THEMES,
  FONT_MONO,
  FONT_SANS,
  esc,
  svg,
  commonDefs,
  sweepDefs,
  card,
  animate,
  mulberry32,
  f,
} from './lib/ui.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------ dados ------------------------------ */

const QUERY = `
query($login:String!){
  user(login:$login){
    followers{ totalCount }
    pullRequests{ totalCount }
    issues{ totalCount }
    repositories(ownerAffiliations:OWNER, isFork:false, first:100, orderBy:{field:STARGAZERS, direction:DESC}){
      totalCount
      nodes{
        stargazerCount
        languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } }
      }
    }
    contributionsCollection{
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount } }
      }
    }
  }
}`;

export async function fetchData(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-readme-stats',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL respondeu ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const u = json.data.user;
  const cc = u.contributionsCollection;

  const langBytes = new Map();
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) {
      langBytes.set(e.node.name, (langBytes.get(e.node.name) || 0) + e.size);
    }
  }
  const sorted = [...langBytes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const sum = sorted.reduce((s, [, v]) => s + v, 0) || 1;
  const langs = sorted.map(([name, v]) => ({ name, pct: (v / sum) * 100 }));

  const weeks = cc.contributionCalendar.weeks.map((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  );

  return finalize({
    login,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: u.pullRequests.totalCount,
    issues: u.issues.totalCount,
    stars,
    repos: u.repositories.totalCount,
    followers: u.followers.totalCount,
    total: cc.contributionCalendar.totalContributions,
    langs,
    weeks,
  });
}

export function mockData() {
  const rnd = mulberry32(2026);
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (52 * 7 + end.getUTCDay()));
  const weeks = [];
  let total = 0;
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + w * 7 + d);
      if (dt > end) continue;
      const weekday = dt.getUTCDay();
      const trend = 0.35 + (w / 53) * 0.65;
      const active = rnd() < (weekday === 0 || weekday === 6 ? 0.35 : 0.8) * trend + 0.05;
      const count = active ? Math.round(rnd() * rnd() * 14 * trend) + (rnd() < 0.6 ? 1 : 0) : 0;
      total += count;
      days.push({ date: dt.toISOString().slice(0, 10), count });
    }
    if (days.length) weeks.push(days);
  }
  return finalize({
    login: 'SEU-USUARIO',
    commits: Math.round(total * 0.78),
    prs: 64,
    issues: 31,
    stars: 187,
    repos: 42,
    followers: 128,
    total,
    langs: [
      { name: 'TypeScript', pct: 34 },
      { name: 'Python', pct: 24 },
      { name: 'JavaScript', pct: 15 },
      { name: 'Go', pct: 11 },
      { name: 'Rust', pct: 9 },
      { name: 'Shell', pct: 7 },
    ],
    weeks,
  });
}

function finalize(d) {
  const days = d.weeks.flat();
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // sequência atual: ignora hoje se ainda estiver zerado
  let cur = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  for (; i >= 0 && days[i].count > 0; i--) cur++;
  return { ...d, streakCurrent: cur, streakLongest: longest };
}

/* ----------------------------- render ------------------------------ */

const fmt = (n) =>
  n >= 10000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : n.toLocaleString('pt-BR');

function levelFn(days) {
  const nz = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  if (!nz.length) return () => 0;
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(nz.length * p))];
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (c) => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function renderDashboard(data, t) {
  const W = 1200;
  const H = 556;
  const defs = commonDefs(t) + sweepDefs(t, W, 9);
  let b = '';

  // ---- Card 1: visão geral ----
  const c1w = 724;
  b += card(t, 0, 0, c1w, 244);
  b += `<text x="28" y="38" font-family="${FONT_MONO}" font-size="12" fill="${t.muted}" letter-spacing="1.5">// VISÃO GERAL</text>`;
  const big = [
    ['commits', data.commits, '12 meses'],
    ['pull requests', data.prs, 'total'],
    ['issues', data.issues, 'total'],
    ['estrelas', data.stars, 'recebidas'],
  ];
  const colW = (c1w - 56) / 4;
  big.forEach(([label, val, sub], i) => {
    const x = 28 + i * colW;
    b += `<rect x="${x}" y="64" width="22" height="3" rx="1.5" fill="url(#accG)"/>`;
    b += `<text x="${x}" y="118" font-family="${FONT_SANS}" font-size="44" font-weight="800" fill="url(#tg)" letter-spacing="-1.5">${esc(fmt(val))}</text>`;
    b += `<text x="${x}" y="142" font-family="${FONT_MONO}" font-size="12.5" fill="${t.text}">${esc(label)}</text>`;
    b += `<text x="${x}" y="158" font-family="${FONT_MONO}" font-size="11" fill="${t.dim}">${esc(sub)}</text>`;
  });
  b += `<line x1="28" y1="176" x2="${c1w - 28}" y2="176" stroke="${t.line}" stroke-opacity="0.7" stroke-dasharray="3 5"/>`;
  const small = [
    ['seguidores', fmt(data.followers)],
    ['repositórios', fmt(data.repos)],
    ['sequência atual', `${data.streakCurrent}d`],
    ['maior sequência', `${data.streakLongest}d`],
  ];
  small.forEach(([label, val], i) => {
    const x = 28 + i * colW;
    b += `<text x="${x}" y="208" font-family="${FONT_SANS}" font-size="22" font-weight="700" fill="${t.text}">${esc(val)}</text>`;
    b += `<text x="${x}" y="226" font-family="${FONT_MONO}" font-size="11" fill="${t.muted}">${esc(label)}</text>`;
  });

  // ---- Card 2: linguagens ----
  const c2x = 744;
  const c2w = 456;
  b += card(t, c2x, 0, c2w, 244);
  b += `<text x="${c2x + 28}" y="38" font-family="${FONT_MONO}" font-size="12" fill="${t.muted}" letter-spacing="1.5">// LINGUAGENS</text>`;
  const shades = [t.b3, t.b4, t.b5, t.cy, t.b2, t.dim];
  const barX = c2x + 28;
  const barW = c2w - 56;
  b += `<clipPath id="barClip"><rect x="${barX}" y="58" width="${barW}" height="12" rx="6"/></clipPath><g clip-path="url(#barClip)">`;
  let acc = 0;
  data.langs.forEach((l, i) => {
    const w = (l.pct / 100) * barW;
    b += `<rect x="${f(barX + acc)}" y="58" width="${f(Math.max(0, w - 2))}" height="12" fill="${shades[i % shades.length]}">${animate(
      'opacity',
      [0.75, 1, 0.75],
      [0, 0.5, 1],
      4 + i * 0.4
    )}</rect>`;
    acc += w;
  });
  b += `</g>`;
  data.langs.forEach((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = c2x + 28 + col * 206;
    const y = 112 + row * 38;
    b += `<circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${shades[i % shades.length]}"/>`;
    b += `<text x="${x + 18}" y="${y}" font-family="${FONT_SANS}" font-size="14" font-weight="600" fill="${t.text}">${esc(l.name)}</text>`;
    b += `<text x="${x + 18}" y="${y + 16}" font-family="${FONT_MONO}" font-size="11.5" fill="${t.muted}">${l.pct.toFixed(1)}%</text>`;
  });

  // ---- Card 3: heatmap ----
  const c3y = 264;
  b += card(t, 0, c3y, W, 288);
  b += `<text x="28" y="${c3y + 38}" font-family="${FONT_MONO}" font-size="12" fill="${t.muted}" letter-spacing="1.5">// CONTRIBUIÇÕES — ÚLTIMOS 12 MESES</text>`;
  b += `<text x="${W - 28}" y="${c3y + 38}" text-anchor="end" font-family="${FONT_MONO}" font-size="13" fill="${t.text}"><tspan fill="${t.b4}" font-weight="700">${esc(fmt(data.total))}</tspan> contribuições</text>`;

  const all = data.weeks.flat();
  const level = levelFn(all);
  const cell = 16;
  const gap = 4;
  const gx = 64;
  const gy = c3y + 88;
  const labels = [['seg', 1], ['qua', 3], ['sex', 5]];
  labels.forEach(([txt, row]) => {
    b += `<text x="28" y="${gy + row * (cell + gap) + 12}" font-family="${FONT_MONO}" font-size="10.5" fill="${t.dim}">${txt}</text>`;
  });
  let lastMonth = -1;
  data.weeks.forEach((week, wi) => {
    const x = gx + wi * (cell + gap);
    const m = new Date(week[0].date + 'T00:00:00Z').getUTCMonth();
    if (m !== lastMonth && wi < data.weeks.length - 2) {
      b += `<text x="${x}" y="${gy - 10}" font-family="${FONT_MONO}" font-size="10.5" fill="${t.dim}">${MONTHS[m]}</text>`;
      lastMonth = m;
    }
    b += `<g>`;
    week.forEach((day) => {
      const row = new Date(day.date + 'T00:00:00Z').getUTCDay();
      b += `<rect x="${x}" y="${gy + row * (cell + gap)}" width="${cell}" height="${cell}" rx="4" fill="${t.heat[level(day.count)]}"><title>${esc(day.date)}: ${day.count}</title></rect>`;
    });
    b += animate('opacity', [1, 1, 0.5, 1, 1], [0, 0.1, 0.18, 0.28, 1], 7, `begin="${f(wi * 0.07)}s"`);
    b += `</g>`;
  });

  // legenda
  const lx = W - 28 - (5 * (cell + 4) + 90);
  const ly = c3y + 252;
  b += `<text x="${lx}" y="${ly + 12}" font-family="${FONT_MONO}" font-size="11" fill="${t.dim}">menos</text>`;
  t.heat.forEach((c, i) => {
    b += `<rect x="${lx + 46 + i * (cell + 4)}" y="${ly}" width="${cell}" height="${cell}" rx="4" fill="${c}"/>`;
  });
  b += `<text x="${lx + 46 + 5 * (cell + 4) + 4}" y="${ly + 12}" font-family="${FONT_MONO}" font-size="11" fill="${t.dim}">mais</text>`;
  b += `<text x="28" y="${ly + 12}" font-family="${FONT_MONO}" font-size="11" fill="${t.dim}">gerado por scripts/stats.mjs · @${esc(data.login)}</text>`;

  return svg(W, H, b, defs, `Painel de estatísticas do GitHub de ${data.login}`);
}

/* ------------------------------ main ------------------------------- */

async function main() {
  const mock = process.argv.includes('--mock');
  let data;
  if (mock) {
    data = mockData();
  } else {
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    let login = process.env.GH_LOGIN;
    if (!login) {
      try {
        login = JSON.parse(readFileSync(resolve(ROOT, 'profile.json'), 'utf8')).handle;
      } catch {}
    }
    if (!token || !login || login === 'SEU-USUARIO') {
      console.error('Defina GH_TOKEN e GH_LOGIN (ou use --mock).');
      process.exit(1);
    }
    data = await fetchData(login, token);
  }
  const out = resolve(ROOT, 'assets');
  mkdirSync(out, { recursive: true });
  for (const key of ['dark', 'light']) {
    writeFileSync(resolve(out, `dashboard-${key}.svg`), renderDashboard(data, THEMES[key]));
  }
  console.log(`dashboard gerado (${mock ? 'mock' : data.login})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
