import { el, dayKey, addDays, fmtShort, weekStart } from '../util.js';
import * as S from '../store.js';
import { card, pageHead, empty } from '../ui.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (t, a = {}, ...k) => { const e = document.createElementNS(NS, t); Object.entries(a).forEach(([x, v]) => e.setAttribute(x, v)); k.forEach((c) => e.append(c)); return e; };
const MOOD_N = { Rough: 1, Meh: 2, Okay: 3, Good: 4, Amazing: 5 };

export function render(s) {
  const root = el('div', { class: 'view' }, pageHead('Progress', 'Small days add up. This is a look at your consistency, not a report card.'));
  const today = new Date();
  const facts = Array.from({ length: 84 }, (_, i) => S.dayFacts(addDays(today, i - 83), s));
  const last30 = facts.slice(-30), last7 = facts.slice(-7);
  const activeDays = last30.filter((f) => f.active).length;
  let streak = 0; for (let i = facts.length - 1; i >= 0; i--) { if (facts[i].active) streak++; else if (i === facts.length - 1) continue; else break; }
  const avg7 = Math.round((last7.reduce((a, f) => a + f.score, 0) / 7) * 100);
  const best = s.habits.map((h) => ({ h, st: S.habitStreak(h, today) })).sort((a, b) => b.st - a.st)[0];

  root.append(el('div', { class: 'stat-row' },
    stat(streak, 'day streak', 'Days in a row with any activity'),
    stat(activeDays, 'of last 30 days', 'Days with a habit, task or reflection'),
    stat(avg7 + '%', '7-day average', 'Average daily score this week'),
    stat(best && best.st ? best.st : '—', best && best.st ? best.h.name : 'best habit streak', 'Longest current habit streak')));

  // 14-day bars
  const days = facts.slice(-14), W = 560, H = 160, bw = W / days.length;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H + 24}`, class: 'chart', role: 'img', 'aria-label': 'Daily score for the last 14 days' });
  [0, 0.5, 1].forEach((g) => svg.append(svgEl('line', { x1: 0, x2: W, y1: H - g * H, y2: H - g * H, class: 'grid' })));
  days.forEach((f, i) => {
    const h = Math.max(2, f.score * H), d = addDays(today, i - 13);
    const bar = svgEl('rect', { x: i * bw + 5, y: H - h, width: bw - 10, height: h, rx: 5, class: f.active ? 'bar-on' : 'bar-off' });
    bar.append(svgEl('title', {}, document.createTextNode(`${fmtShort(d)}: ${Math.round(f.score * 100)}%`)));
    svg.append(bar);
    if (i % 2 === 0 || days.length < 8) svg.append(svgEl('text', { x: i * bw + bw / 2, y: H + 16, 'text-anchor': 'middle', class: 'axis' }, document.createTextNode(String(d.getDate()))));
  });
  root.append(card('Last 14 days', svg));

  // Heatmap 12 weeks
  const start = weekStart(addDays(today, -83));
  const cols = [];
  for (let w = 0; w < 12; w++) {
    const col = el('div', { class: 'hm-col' });
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d), f = S.dayFacts(date, s), future = date > today;
      const lvl = future ? -1 : f.score === 0 ? 0 : f.score < 0.34 ? 1 : f.score < 0.67 ? 2 : 3;
      col.append(el('span', { class: `hm l${lvl}`, title: `${fmtShort(date)}: ${future ? '' : Math.round(f.score * 100) + '%'}` }));
    }
    cols.push(col);
  }
  root.append(card('Consistency, last 12 weeks', el('div', { class: 'heatmap', role: 'img', 'aria-label': 'Heat map of daily activity over twelve weeks' }, cols),
    el('p', { class: 'muted small', text: 'Darker squares mean a fuller day. Weeks run Monday to Sunday, oldest on the left.' })));

  // Mood
  const moods = Object.entries(s.moodByDay || {}).filter(([k]) => k >= dayKey(addDays(today, -29))).sort();
  if (moods.length >= 2) {
    const pts = moods.map(([k, v]) => [new Date(k + 'T00:00:00'), MOOD_N[v] || 3]);
    const t0 = addDays(today, -29).getTime(), span = 29 * 86400000, Wm = 560, Hm = 110;
    const line = svgEl('svg', { viewBox: `0 0 ${Wm} ${Hm + 8}`, class: 'chart', role: 'img', 'aria-label': 'Mood over the last 30 days' });
    const xy = pts.map(([d, v]) => [((d.getTime() - t0) / span) * (Wm - 20) + 10, Hm - ((v - 1) / 4) * (Hm - 16) - 4]);
    line.append(svgEl('polyline', { points: xy.map((p) => p.join(',')).join(' '), class: 'mood-line', fill: 'none' }));
    xy.forEach(([x, y]) => line.append(svgEl('circle', { cx: x, cy: y, r: 4, class: 'mood-dot' })));
    root.append(card('Mood, last 30 days', line, el('p', { class: 'muted small', text: 'Higher is a better day. Tap a mood on the Today page each day to build this picture.' })));
  }

  // Habit completion
  if (s.habits.length) root.append(card('Habit consistency (30 days)', el('ul', { class: 'list plain' }, s.habits.map((h) => {
    const n = Array.from({ length: 30 }, (_, i) => S.habitDone(h, dayKey(addDays(today, -i)))).filter(Boolean).length;
    return el('li', { class: 'catrow' }, el('span', { text: h.name }), el('div', { class: 'bar thin' }, el('span', { style: `width:${(n / 30) * 100}%` })), el('strong', { text: `${n}/30` }));
  }))));
  else root.append(empty('Add a habit and check in for a few days to see your charts fill in.'));
  return root;
}
function stat(n, l, title) { return el('div', { class: 'stat', title }, el('span', { class: 'stat-n', text: String(n) }), el('span', { class: 'muted small', text: l })); }
