import { el, dayKey, addDays, fmtShort, newId } from '../util.js';
import * as S from '../store.js';
import { card, pageHead, empty } from '../ui.js';
import { confirmBox } from '../util.js';

const SUGGEST = ['Morning walk', 'Drink water', 'Read 10 pages', 'Meditate', 'Journal', 'Stretch', 'Sleep by 11pm', 'No phone first hour'];

export function render(s) {
  const root = el('div', { class: 'view' }, pageHead('Habits', 'Tap a day to mark it. Missing a day is fine — just start the next streak.'));
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const form = el('form', { class: 'add-row', onsubmit: (e) => { e.preventDefault(); const v = inp.value.trim(); if (v) { S.addHabit(v); } } });
  const inp = el('input', { type: 'text', placeholder: 'New habit, e.g. “Walk for 20 minutes”', maxlength: 80, 'aria-label': 'New habit name' });
  form.append(inp, el('button', { class: 'btn primary', type: 'submit' }, 'Add habit'));
  root.append(card(null, form,
    !s.habits.length ? el('div', { class: 'chips' }, SUGGEST.map((x) => el('button', { class: 'chip btn-chip', type: 'button', onclick: () => S.addHabit(x) }, '+ ' + x))) : null));

  if (!s.habits.length) { root.append(empty('Start with one small habit you can do in under five minutes.')); return root; }

  const head = el('div', { class: 'habit-days', 'aria-hidden': 'true' }, days.map((d) => el('span', { text: d.toLocaleDateString(undefined, { weekday: 'narrow' }) })));
  const grid = el('div', { class: 'habit-grid' }, el('div', { class: 'habit-row head' }, el('span'), head, el('span')));
  s.habits.forEach((hb) => {
    const streak = S.habitStreak(hb, today);
    const last30 = Array.from({ length: 30 }, (_, i) => S.habitDone(hb, dayKey(addDays(today, -i)))).filter(Boolean).length;
    const dots = el('div', { class: 'habit-days' }, days.map((d) => {
      const k = dayKey(d), on = S.habitDone(hb, k);
      return el('button', { class: `dot${on ? ' on' : ''}${k === dayKey() ? ' today' : ''}`, type: 'button', 'aria-pressed': String(on),
        'aria-label': `${hb.name}, ${fmtShort(d)}: ${on ? 'done' : 'not done'}`, title: fmtShort(d), onclick: () => S.toggleHabit(hb.id, k) });
    }));
    const name = el('div', { class: 'habit-name' }, el('strong', { text: hb.name }), el('span', { class: 'muted small', text: `${streak ? '🔥 ' + streak + '-day streak · ' : ''}${last30}/30 days` }));
    const menu = el('div', { class: 'row-actions' },
      el('button', { class: 'icon-btn', type: 'button', title: 'Rename', 'aria-label': `Rename ${hb.name}`, onclick: () => {
        const v = prompt('Rename habit', hb.name); if (v && v.trim()) S.commit((st) => { st.habits.find((x) => x.id === hb.id).name = v.trim().slice(0, 80); }); } }, '✎'),
      el('button', { class: 'icon-btn', type: 'button', title: 'Delete', 'aria-label': `Delete ${hb.name}`, onclick: async () => {
        if (await confirmBox('Delete this habit?', `“${hb.name}” and its history will be removed.`)) S.commit((st) => { st.habits = st.habits.filter((x) => x.id !== hb.id); }); } }, '✕'));
    grid.append(el('div', { class: 'habit-row' }, name, dots, menu));
  });
  root.append(card(null, grid));
  return root;
}
