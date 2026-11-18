import { el, dayKey, parseDay, addDays, fmtLong, fmtShort, toast } from '../util.js';
import * as S from '../store.js';
import { card, pageHead, empty } from '../ui.js';

let dateKey = dayKey();

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Evening reflection', 'Three small wins and one thing you are grateful for. It takes two minutes.'));
  const d = parseDay(dateKey);
  root.append(el('div', { class: 'datebar' },
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Previous day', onclick: () => { dateKey = dayKey(addDays(d, -1)); rerender(); } }, '‹'),
    el('strong', { text: dateKey === dayKey() ? `Today · ${fmtLong(d)}` : fmtLong(d) }),
    el('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Next day', disabled: dateKey >= dayKey() ? true : null, onclick: () => { dateKey = dayKey(addDays(d, 1)); rerender(); } }, '›')));

  const j = S.journalFor(dateKey, s);
  const k = dateKey;
  let t;
  const status = el('span', { class: 'muted small', 'aria-live': 'polite' });
  const save = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      S.commit((st) => {
        const entry = { ...(st.journalByDay?.[k] || {}), achievements: ach.map((i) => i.value.slice(0, 300)), gratitude: grat.value.slice(0, 1000), reflection: refl.value.slice(0, 2000) };
        st.journalByDay = st.journalByDay || {}; st.journalByDay[k] = entry;
        if (S.journalEmpty(entry)) delete st.journalByDay[k];
      }, { silent: true });
      status.textContent = 'Saved';
    }, 600);
    status.textContent = 'Saving…';
  };
  const ach = [0, 1, 2].map((i) => el('input', { type: 'text', maxlength: 300, value: (j.achievements || [])[i] || '', placeholder: ['I finished…', 'I handled…', 'I learned…'][i], 'aria-label': `Achievement ${i + 1}`, oninput: save }));
  const grat = el('textarea', { rows: 3, maxlength: 1000, placeholder: 'Today I am grateful for…', 'aria-label': 'Gratitude', oninput: save }); grat.value = j.gratitude || '';
  const refl = el('textarea', { rows: 4, maxlength: 2000, placeholder: 'Anything else on your mind? (optional)', 'aria-label': 'Reflection', oninput: save }); refl.value = j.reflection || '';
  root.append(card(null,
    el('label', { class: 'field' }, el('span', { text: 'What did you achieve today?' }), ach),
    el('label', { class: 'field' }, el('span', { text: 'Gratitude' }), grat),
    el('label', { class: 'field' }, el('span', { text: 'Reflection' }), refl),
    status));

  const keys = Object.keys(s.journalByDay || {}).filter((x) => !S.journalEmpty(s.journalByDay[x])).sort().reverse().slice(0, 14);
  root.append(card('Recent entries', keys.length ? el('ul', { class: 'list plain' }, keys.map((x) => {
    const e = S.journalFor(x, s); const first = (e.achievements || []).find((a) => String(a).trim()) || e.gratitude || e.reflection || '';
    return el('li', null, el('button', { class: 'linklike', type: 'button', onclick: () => { dateKey = x; rerender(); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
      el('strong', { text: fmtShort(parseDay(x)) }), el('span', { class: 'muted', text: ' — ' + String(first).slice(0, 90) })));
  })) : empty('Your past reflections will appear here.')));
  return root;
}
