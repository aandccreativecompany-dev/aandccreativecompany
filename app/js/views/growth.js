import { el, toast, dayKey, addDays, fmtShort } from '../util.js';
import * as S from '../store.js';
import { card, pageHead } from '../ui.js';
import { companion, stagesFor } from '../companion.js';
import { getUi, setUi, motionOff } from '../appearance.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (t, a = {}, ...k) => { const e = document.createElementNS(NS, t); Object.entries(a).forEach(([x, v]) => e.setAttribute(x, v)); k.forEach((c) => e.append(c)); return e; };
export const kindNow = () => (getUi().companion === 'bird' ? 'bird' : 'tree');

// A burst of sparkles over a host element when the companion reaches a new stage.
export function celebrate(host) {
  if (motionOff()) return;
  const box = el('div', { class: 'burst', 'aria-hidden': 'true' });
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + Math.random() * 0.3, d = 70 + Math.random() * 70;
    const p = el('i'); p.style.setProperty('--dx', `${Math.cos(a) * d}px`); p.style.setProperty('--dy', `${Math.sin(a) * d - 20}px`);
    p.style.setProperty('--d', `${Math.random() * 120}ms`); p.style.background = ['#F2B93B', '#FFE17A', '#F59AB4', 'var(--accent)'][i % 4];
    box.append(p);
  }
  host.append(box); setTimeout(() => box.remove(), 1400);
}

// Tell the person when the companion has grown since they last looked.
function checkStageUp(g, host) {
  const ui = getUi();
  if (ui.plantSeen == null) { setUi({ plantSeen: g.stage }); return; }
  if (g.stage > ui.plantSeen) {
    setUi({ plantSeen: g.stage });
    const st = stagesFor(kindNow())[g.stage];
    celebrate(host); toast(`Your ${kindNow()} grew into: ${st[0]}`, 3600);
  }
}

const toggle = (onPick) => {
  const kinds = [['tree', 'Tree'], ['bird', 'Bird']], cur = kindNow();
  const wrap = el('div', { class: 'seg', role: 'group', 'aria-label': 'Companion' });
  const btns = kinds.map(([k, label]) => el('button', { type: 'button', class: k === cur ? 'on' : '', 'aria-pressed': String(k === cur),
    onclick: () => { setUi({ companion: k }); btns.forEach((b, i) => { const on = kinds[i][0] === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); if (navigator.vibrate) try { navigator.vibrate(8); } catch {} onPick(k); } }, label));
  wrap.append(...btns);
  return wrap;
};

// Compact card for the Today page.
export function companionCard(s) {
  const g = S.growth(s), kind = kindNow();
  const cmp = companion({ kind, stage: g.stage, quiet: g.thirsty, size: 128 });
  const name = el('strong', { class: 'cmp-name' }), blurb = el('span', { class: 'muted small' });
  const bar = el('div', { class: 'bar thin' }, el('span', { style: `width:${Math.round(g.toNext * 100)}%` })), pts = el('span', { class: 'muted small' });
  const paint = (k) => {
    const st = stagesFor(k)[g.stage]; name.textContent = st[0]; blurb.textContent = g.thirsty ? 'Waiting for you — one small win wakes it up.' : st[1];
    pts.textContent = g.next == null ? `${g.points} points · fully grown` : `${g.points} / ${g.next} points to ${stagesFor(k)[g.stage + 1][0]}`;
  };
  paint(kind);
  const root = el('section', { class: 'card cmp-card' }, cmp.el,
    el('div', { class: 'cmp-body' }, el('span', { class: 'eyebrow', text: 'Your companion' }), name, blurb, bar, pts,
      el('div', { class: 'row' }, toggle((k) => { cmp.set(k, g.stage, g.thirsty); paint(k); }), el('a', { class: 'btn ghost', href: '#/growth' }, 'See growth'))));
  setTimeout(() => checkStageUp(g, root), 600);
  return root;
}

export function render(s) {
  const g = S.growth(s), kind = kindNow();
  const root = el('div', { class: 'view' }, pageHead('Growth', 'Your companion grows with your effort. It never shrinks and it never judges — a quiet day just makes it thirsty.'));
  const cmp = companion({ kind, stage: g.stage, quiet: g.thirsty, size: 240 });
  const name = el('h2', { class: 'cmp-big' }), blurb = el('p', { class: 'muted' }), pts = el('p', { class: 'small muted' });
  const bar = el('div', { class: 'bar' }, el('span', { style: `width:${Math.round(g.toNext * 100)}%` }));
  const strip = el('ol', { class: 'stages', 'aria-label': 'Growth stages' });
  const paint = (k) => {
    const list = stagesFor(k), st = list[g.stage];
    name.textContent = st[0]; blurb.textContent = g.thirsty ? 'It has been a few quiet days. Any small win — a habit, a task, a mood — wakes it right up.' : st[1];
    pts.textContent = g.next == null ? `${g.points} points — fully grown. Keep tending it.` : `${g.points} points · ${g.next - g.points} to go until ${list[g.stage + 1][0]}`;
    strip.replaceChildren(...list.map(([n, , min], i) => el('li', { class: i < g.stage ? 'done' : i === g.stage ? 'now' : '', 'aria-current': i === g.stage ? 'step' : null },
      el('span', { class: 'sd' }, i < g.stage ? '✓' : String(i + 1)), el('span', { class: 'sn', text: n }), el('span', { class: 'sm muted', text: `${min}+` }))));
  };
  paint(kind);
  const hero = card(null, el('div', { class: 'cmp-hero' }, cmp.el, el('div', { class: 'cmp-hero-text' }, el('span', { class: 'eyebrow', text: g.thirsty ? 'Needs a little attention' : `Stage ${g.stage + 1} of 7` }), name, blurb, bar, pts,
    toggle((k) => { cmp.set(k, g.stage, g.thirsty); paint(k); }))));
  hero.classList.add('cmp-hero-card');
  root.append(hero, card('Stages', strip, el('p', { class: 'muted small', text: 'Tree and bird share the same stages and points, so switching never loses progress.' })));

  // 30-day points
  const W = 560, H = 140, n = g.daily.length, bw = W / n;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H + 24}`, class: 'chart', role: 'img', 'aria-label': 'Points earned each day for the last 30 days' });
  [0, 0.5, 1].forEach((q) => svg.append(svgEl('line', { x1: 0, x2: W, y1: H - q * H, y2: H - q * H, class: 'grid' })));
  g.daily.forEach((f, i) => {
    const h = Math.max(2, (f.points / 100) * H), d = addDays(new Date(), i - (n - 1));
    const r = svgEl('rect', { x: i * bw + 2.5, y: H - h, width: bw - 5, height: h, rx: 3, class: f.points ? 'bar-on' : 'bar-off', style: `animation-delay:${i * 14}ms` });
    r.classList.add('grow-bar'); r.append(svgEl('title', {}, document.createTextNode(`${fmtShort(d)}: ${f.points} points`)));
    svg.append(r);
    if (g.stageUps[f.key]) svg.append(svgEl('text', { x: i * bw + bw / 2, y: H - h - 6, 'text-anchor': 'middle', class: 'axis' }, document.createTextNode('★')));
    if (i % 5 === 0) svg.append(svgEl('text', { x: i * bw + bw / 2, y: H + 16, 'text-anchor': 'middle', class: 'axis' }, document.createTextNode(String(d.getDate()))));
  });
  root.append(card('Points, last 30 days', svg, el('p', { class: 'muted small', text: 'A full day is 100 points: habits 30, priorities 25, mind 20, body 15. ★ marks a day your companion grew.' })));

  // Balance
  const rows = [['Habits', g.wheel.habits], ['Priorities', g.wheel.priorities], ['Mind', g.wheel.mind], ['Body', g.wheel.body]];
  const weakest = rows.slice().sort((a, b) => a[1] - b[1])[0];
  root.append(card('This week’s balance', el('ul', { class: 'list plain' }, rows.map(([l, v]) => el('li', { class: 'catrow' }, el('span', { text: l }), el('div', { class: 'bar thin' }, el('span', { style: `width:${Math.round(v * 100)}%` })), el('strong', { text: `${Math.round(v * 100)}%` })))),
    el('p', { class: 'muted small', text: g.activeDays ? `Active on ${g.activeDays} of the last 7 days. Easiest next win: ${weakest[0].toLowerCase()}.` : 'No activity this week yet — one small win is all it takes.' }),
    el('p', { class: 'muted small', text: 'Water, calls and meditation are logged on the phone and are not counted here yet, so your stage on the phone can be a little higher.' })));
  setTimeout(() => checkStageUp(g, hero), 500);
  return root;
}
