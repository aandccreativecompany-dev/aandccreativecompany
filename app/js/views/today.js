import { el, dayKey, fmtLong } from '../util.js';
import * as S from '../store.js';
import { card, checklist, ring, empty } from '../ui.js';
import { companionCard } from './growth.js';

let MANTRAS = null;
export async function loadMantras() {
  if (MANTRAS) return MANTRAS;
  try { MANTRAS = await (await fetch('/app/mantras.json')).json(); } catch { MANTRAS = []; }
  return MANTRAS;
}
export function mantraOfToday(s) {
  const m = MANTRAS || []; if (!m.length) return ['Begin where you are.', 'Prakriyā'];
  const order = s.mantraShuffleOrder, cur = s.mantraShuffleCursor;
  if (Array.isArray(order) && order.length === m.length && Number.isInteger(cur) && cur >= 0 && cur < m.length && s.mantraLastShownDay === dayKey())
    return m[order[cur]] || m[0];
  const dayNo = Math.floor((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - new Date(2026, 0, 1)) / 86400000);
  return m[(((dayNo + (s.mantraSeed || 0)) % m.length) + m.length) % m.length];
}

const MOODS = [['Rough', '😔'], ['Meh', '😕'], ['Okay', '😐'], ['Good', '🙂'], ['Amazing', '🤩']];

export function render(s) {
  const now = new Date(), key = dayKey(now), h = now.getHours();
  const hello = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const name = (s.userName || '').trim();
  const facts = S.dayFacts(now, s);
  const root = el('div', { class: 'view' });

  root.append(el('header', { class: 'hero' },
    el('div', null, el('h1', { text: name ? `${hello}, ${name}` : hello }), el('p', { class: 'muted', text: fmtLong(now) })),
    el('div', { class: 'hero-ring' }, ring(facts.score, `${Math.round(facts.score * 100)}%`, "today's progress"), el('span', { class: 'muted small', text: "Today's progress" }))));

  root.append(companionCard(s));

  const [text, src] = mantraOfToday(s);
  root.append(el('section', { class: 'card mantra' },
    el('span', { class: 'eyebrow', text: 'Mantra of the day' }),
    el('blockquote', null, el('p', { text: text }), el('footer', { text: src })),
    el('button', { class: 'btn ghost', type: 'button', onclick: async () => {
      const t = `“${text}” — ${src}`;
      try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); (await import('../util.js')).toast('Copied to clipboard'); } } catch {}
    } }, 'Share or copy')));

  const cur = s.moodByDay?.[key];
  root.append(card('How are you feeling today?', el('div', { class: 'moods', role: 'group', 'aria-label': 'Mood' },
    MOODS.map(([label, emoji]) => el('button', { class: `mood${cur === label ? ' on' : ''}`, type: 'button', 'aria-pressed': String(cur === label),
      onclick: () => S.commit((st) => { st.moodByDay = st.moodByDay || {}; if (st.moodByDay[key] === label) delete st.moodByDay[key]; else st.moodByDay[key] = label; }) },
      el('span', { class: 'mood-e', 'aria-hidden': 'true' }, emoji), el('span', { text: label }))))));

  const two = el('div', { class: 'grid2' });
  two.append(card("Today's priorities", checklist({
    get: () => S.tasksFor(key), placeholder: 'Add a priority for today…', emptyText: 'Pick the 1–3 things that matter most today.',
    mutate: (fn) => S.commit((st) => { st.tasksByDay = st.tasksByDay || {}; const a = st.tasksByDay[key] = st.tasksByDay[key] || []; fn(a); if (!a.length) delete st.tasksByDay[key]; }),
  })));

  const habitsBox = card('Habits', ...(s.habits.length ? [el('ul', { class: 'list' }, s.habits.map((hb) => {
    const done = S.habitDone(hb, key), streak = S.habitStreak(hb, now);
    return el('li', null,
      el('input', { type: 'checkbox', checked: done, 'aria-label': `${hb.name}: mark done today`, onchange: (e) => { e.target.classList.add('pop'); setTimeout(() => S.toggleHabit(hb.id, key), 170); } }),
      el('span', { class: `li-text${done ? ' done' : ''}` }, hb.name),
      streak > 0 ? el('span', { class: 'chip', title: `${streak}-day streak` }, `🔥 ${streak}`) : null);
  }))] : [empty('No habits yet.'), el('a', { class: 'btn primary', href: '#/habits' }, 'Add your first habit')]));
  two.append(habitsBox);
  root.append(two);

  const j = S.journalFor(key);
  root.append(card('Evening reflection', el('p', { class: 'muted', text: S.journalEmpty(j) ? 'Take two minutes to note what went well and what you are grateful for.' : 'Reflection saved for today. Nice work.' }),
    el('a', { class: 'btn', href: '#/journal' }, S.journalEmpty(j) ? 'Write today’s reflection' : 'View or edit')));
  return root;
}
