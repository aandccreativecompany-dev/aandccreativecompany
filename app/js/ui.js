import { el, newId } from './util.js';
import * as S from './store.js';

export const card = (title, ...kids) => el('section', { class: 'card' }, title ? el('h2', { class: 'card-title', text: title }) : null, ...kids);
export const pageHead = (title, sub) => el('header', { class: 'page-head' }, el('h1', { text: title }), sub ? el('p', { class: 'muted', text: sub }) : null);
export const empty = (msg) => el('p', { class: 'empty', text: msg });

// A checklist with add / toggle / edit / delete. `get()` returns the array of
// {title, done}; `mutate(fn)` applies fn(array) through the store so it persists.
export function checklist({ get, mutate, placeholder = 'Add an item…', emptyText = 'Nothing here yet.', max = 200 }) {
  const wrap = el('div', { class: 'checklist' });
  const list = el('ul', { class: 'list' });
  const items = get();
  if (!items.length) list.append(el('li', { class: 'empty-li' }, emptyText));
  items.forEach((t, i) => {
    const cb = el('input', { type: 'checkbox', id: `c-${newId()}`, checked: t.done, 'aria-label': `Mark done: ${t.title}`,
      onchange: () => { const v = cb.checked; cb.classList.add('pop'); label.classList.toggle('done', v); setTimeout(() => mutate((arr) => { if (arr[i]) arr[i].done = v; }), 170); } });
    const label = el('span', { class: `li-text${t.done ? ' done' : ''}`, tabindex: '0', title: 'Click to edit',
      onclick: () => edit(), onkeydown: (e) => { if (e.key === 'Enter') edit(); } }, t.title);
    function edit() {
      const inp = el('input', { type: 'text', class: 'inline-edit', value: t.title, maxlength: 200, 'aria-label': 'Edit item' });
      const save = () => { const v = inp.value.trim(); mutate((arr) => { if (v) arr[i].title = v; else arr.splice(i, 1); }); };
      inp.addEventListener('blur', save);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.removeEventListener('blur', save); mutate(() => {}); } });
      label.replaceWith(inp); inp.focus(); inp.select();
    }
    const del = el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Delete: ${t.title}`, title: 'Delete', onclick: () => mutate((arr) => { arr.splice(i, 1); }) }, '✕');
    list.append(el('li', null, cb, label, del));
  });
  const input = el('input', { type: 'text', placeholder, maxlength: 200, 'aria-label': placeholder });
  const add = () => { const v = input.value.trim(); if (!v || get().length >= max) return; mutate((arr) => { arr.push({ title: v, done: false }); }); };
  const form = el('form', { class: 'add-row', onsubmit: (e) => { e.preventDefault(); add(); } }, input, el('button', { class: 'btn primary', type: 'submit' }, 'Add'));
  wrap.append(list, form);
  return wrap;
}

export function ring(frac, label, sub) {
  const r = 44, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'ring'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${label} ${sub || ''}`);
  const mk = (cls, extra) => { const e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', 50); e.setAttribute('cy', 50); e.setAttribute('r', r); e.setAttribute('class', cls); Object.entries(extra || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const defs = document.createElementNS(ns, 'defs'), lg = document.createElementNS(ns, 'linearGradient');
  lg.setAttribute('id', 'rg'); lg.setAttribute('x1', '0'); lg.setAttribute('y1', '0'); lg.setAttribute('x2', '1'); lg.setAttribute('y2', '1');
  [['0', 'var(--ring-a, #F2B93B)'], ['1', 'var(--ring-b, #7B55E0)']].forEach(([o, c]) => { const st = document.createElementNS(ns, 'stop'); st.setAttribute('offset', o); st.setAttribute('style', `stop-color:${c}`); lg.append(st); });
  defs.append(lg); svg.append(defs);
  svg.append(mk('ring-bg'), mk('ring-fg', { 'stroke-dasharray': `${c * f} ${c}`, transform: 'rotate(-90 50 50)', style: `--dash:${c * f}px;--circ:${c}px` }));
  const t = document.createElementNS(ns, 'text'); t.setAttribute('x', 50); t.setAttribute('y', 55); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'ring-t'); t.textContent = label;
  svg.append(t);
  return svg;
}
