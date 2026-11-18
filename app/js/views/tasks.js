import { el, dayKey, parseDay, addDays, fmtLong } from '../util.js';
import * as S from '../store.js';
import { card, checklist, pageHead } from '../ui.js';

let tab = 'day';
let dateKey = dayKey();

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Tasks & goals', 'A short daily list, plus the bigger goals behind it.'));
  const tabs = [['day', 'Daily'], ['week', 'This week'], ['month', 'This month']];
  root.append(el('div', { class: 'tabs', role: 'tablist' }, tabs.map(([k, l]) =>
    el('button', { class: `tab${tab === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(tab === k), type: 'button', onclick: () => { tab = k; rerender(); } }, l))));

  if (tab === 'day') {
    const d = parseDay(dateKey);
    root.append(el('div', { class: 'datebar' },
      el('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Previous day', onclick: () => { dateKey = dayKey(addDays(d, -1)); rerender(); } }, '‹'),
      el('strong', { text: dateKey === dayKey() ? `Today · ${fmtLong(d)}` : fmtLong(d) }),
      el('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Next day', onclick: () => { dateKey = dayKey(addDays(d, 1)); rerender(); } }, '›'),
      dateKey !== dayKey() ? el('button', { class: 'btn', type: 'button', onclick: () => { dateKey = dayKey(); rerender(); } }, 'Today') : null));
    const k = dateKey;
    root.append(card(null, checklist({
      get: () => S.tasksFor(k), placeholder: 'Add a task…', emptyText: 'No tasks for this day.',
      mutate: (fn) => S.commit((st) => { st.tasksByDay = st.tasksByDay || {}; const a = st.tasksByDay[k] = st.tasksByDay[k] || []; fn(a); if (!a.length) delete st.tasksByDay[k]; }),
    })));
  } else {
    const field = tab === 'week' ? 'weeklyGoals' : 'monthlyGoals';
    const done = s[field].filter((t) => t.done).length;
    root.append(card(tab === 'week' ? 'Weekly goals' : 'Monthly goals',
      el('p', { class: 'muted', text: s[field].length ? `${done} of ${s[field].length} complete` : 'Set the few things that would make this period a success.' }),
      checklist({ get: () => s[field], placeholder: tab === 'week' ? 'Add a weekly goal…' : 'Add a monthly goal…', emptyText: 'No goals yet.',
        mutate: (fn) => S.commit((st) => { st[field] = st[field] || []; fn(st[field]); }) })));
    const clear = s[field].some((t) => t.done);
    if (clear) root.append(el('button', { class: 'btn ghost', type: 'button', onclick: () => S.commit((st) => { st[field] = st[field].filter((t) => !t.done); }) }, 'Clear completed'));
  }
  return root;
}
