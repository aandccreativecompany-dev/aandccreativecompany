import { el, newId, toast, confirmBox, parseDay, fmtShort, isoLocal } from '../util.js';
import * as S from '../store.js';
import { card, pageHead, empty } from '../ui.js';

const PAIRS = [
  ['I don’t want to make a mistake.', 'Mistakes help me learn and grow.'],
  ['I can’t do it.', 'I will keep trying.'],
  ['I give up.', 'I believe in me.'],
  ['They are better at it than me.', 'What can I learn from them?'],
  ['This is too hard.', 'With more practice it will get easier.'],
];
const AREAS = [['', 'No area'], ['career', 'Career'], ['health', 'Health'], ['money', 'Money'], ['relationships', 'Relationships'], ['growth', 'Personal growth'], ['fun', 'Fun & travel']];
let tab = 'reframe';

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Mind & vision', 'Reframe a thought, write your scripts, and keep your dreams in sight.'));
  const tabs = [['reframe', 'Reframe'], ['scripts', 'Scripts'], ['vision', 'Vision board']];
  root.append(el('div', { class: 'tabs', role: 'tablist' }, tabs.map(([k, l]) => el('button', { class: `tab${tab === k ? ' on' : ''}`, role: 'tab', 'aria-selected': String(tab === k), type: 'button', onclick: () => { tab = k; rerender(); } }, l))));
  if (tab === 'reframe') reframe(root, s); else if (tab === 'scripts') scripts(root, s, rerender); else vision(root, s);
  return root;
}

function reframe(root, s) {
  const neg = el('input', { type: 'text', maxlength: 140, placeholder: 'Instead of… (the thought)', required: true, 'aria-label': 'Negative thought' });
  const pos = el('input', { type: 'text', maxlength: 140, placeholder: 'Try… (a kinder, truer version)', required: true, 'aria-label': 'Reframed thought' });
  root.append(card('Reframe a thought', el('p', { class: 'muted', text: 'Notice the thought, then write a version you could believe on a good day.' }),
    el('form', { class: 'form-grid', onsubmit: (e) => { e.preventDefault(); if (neg.value.trim() && pos.value.trim()) { S.commit((st) => { st.customReframes = st.customReframes || []; st.customReframes.push({ negative: neg.value.trim(), positive: pos.value.trim() }); }); toast('Added'); } } },
      neg, pos, el('button', { class: 'btn primary', type: 'submit' }, 'Save reframe'))));
  const mine = s.customReframes || [];
  root.append(card('Your reframes', mine.length ? el('ul', { class: 'list plain' }, mine.map((r, i) => pairRow(r.negative, r.positive, () => S.commit((st) => { st.customReframes.splice(i, 1); })))) : empty('Your own reframes will appear here.')));
  root.append(card('Ideas to start from', el('ul', { class: 'list plain' }, PAIRS.map(([n, p]) => pairRow(n, p)))));
}
const pairRow = (n, p, onDel) => el('li', { class: 'pair' }, el('div', null, el('span', { class: 'muted small', text: 'Instead of' }), el('p', { class: 'strike', text: n })),
  el('div', null, el('span', { class: 'muted small', text: 'Try' }), el('p', { text: p })), onDel ? el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete reframe', onclick: onDel }, '✕') : null);

let editing = null;
function scripts(root, s, rerender) {
  const list = s.scripts || [];
  if (editing !== null) {
    const cur = editing >= 0 ? list[editing] : { title: '', body: '', mode: 'manifest' };
    const title = el('input', { type: 'text', maxlength: 100, value: cur.title, placeholder: 'Title', 'aria-label': 'Title' });
    const body = el('textarea', { rows: 10, maxlength: 8000, placeholder: 'Write in the present tense, as if it is already true…', 'aria-label': 'Script' }); body.value = cur.body;
    const mode = el('select', { 'aria-label': 'Type' }, el('option', { value: 'manifest', text: 'Manifestation script', selected: cur.mode !== 'dump' ? true : null }), el('option', { value: 'dump', text: 'Brain dump', selected: cur.mode === 'dump' ? true : null }));
    root.append(card(editing >= 0 ? 'Edit script' : 'New script', el('div', { class: 'stack' }, title, mode, body,
      el('div', { class: 'row' }, el('button', { class: 'btn primary', type: 'button', onclick: () => {
        const t = title.value.trim() || 'Untitled', b = body.value;
        if (!b.trim()) { toast('Write something first'); return; }
        const idx = editing; editing = null;
        S.commit((st) => { st.scripts = st.scripts || []; if (idx >= 0) Object.assign(st.scripts[idx], { title: t, body: b, mode: mode.value }); else st.scripts.unshift({ title: t, body: b, mode: mode.value, createdAt: isoLocal() }); });
        toast('Saved'); } }, 'Save'), el('button', { class: 'btn', type: 'button', onclick: () => { editing = null; rerender(); } }, 'Cancel')))));
    return;
  }
  root.append(el('button', { class: 'btn primary', type: 'button', onclick: () => { editing = -1; rerender(); } }, '+ New script'));
  root.append(list.length ? el('div', { class: 'grid2' }, list.map((sc, i) => el('article', { class: 'card script' },
    el('span', { class: 'eyebrow', text: sc.mode === 'dump' ? 'Brain dump' : 'Script' }), el('h3', { text: sc.title || 'Untitled' }),
    el('p', { class: 'clamp', text: sc.body }),
    el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: () => { editing = i; rerender(); } }, 'Open'),
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete script', onclick: async () => { if (await confirmBox('Delete this script?', `“${sc.title || 'Untitled'}” will be removed.`)) S.commit((st) => { st.scripts.splice(i, 1); }); } }, '✕'))))) : empty('Manifestation scripts and brain dumps you write will be saved here.'));
}

function vision(root, s) {
  const cap = el('input', { type: 'text', maxlength: 120, required: true, placeholder: 'A dream, e.g. “Run my first 10K”', 'aria-label': 'Dream' });
  const aff = el('input', { type: 'text', maxlength: 160, placeholder: 'Affirmation in the present tense (optional)', 'aria-label': 'Affirmation' });
  const area = el('select', { 'aria-label': 'Life area' }, AREAS.map(([v, l]) => el('option', { value: v, text: l })));
  const date = el('input', { type: 'date', 'aria-label': 'Target date' });
  root.append(card('Add to your vision board', el('form', { class: 'form-grid', onsubmit: (e) => { e.preventDefault(); const c = cap.value.trim(); if (!c) return;
    S.commit((st) => { st.visionItems = st.visionItems || []; st.visionItems.push({ caption: c, colorIndex: st.visionItems.length % 6, imagePath: null, shape: '', spanX: 1, spanY: 1, imageOffsetX: 0.5, imageOffsetY: 0.5, imageZoom: 1.0, frameStyle: '', filter: '', area: area.value, affirmation: aff.value.trim(), targetDate: date.value || '', achieved: false }); }); } },
    cap, aff, area, date, el('button', { class: 'btn primary', type: 'submit' }, 'Add dream'))));
  const items = s.visionItems || [];
  root.append(items.length ? el('div', { class: 'vision' }, items.map((v, i) => el('article', { class: `tile c${(v.colorIndex || 0) % 6}${v.achieved ? ' achieved' : ''}` },
    el('h3', { text: v.caption || 'Dream' }), v.affirmation ? el('p', { class: 'aff', text: '“' + v.affirmation + '”' }) : null,
    el('div', { class: 'tile-meta' }, v.area ? el('span', { class: 'chip', text: (AREAS.find((a) => a[0] === v.area) || [0, v.area])[1] }) : null, v.targetDate ? el('span', { class: 'chip', text: 'By ' + fmtShort(parseDay(v.targetDate)) }) : null, v.achieved ? el('span', { class: 'chip', text: '✓ Achieved' }) : null),
    el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: () => S.commit((st) => { st.visionItems[i].achieved = !st.visionItems[i].achieved; }) }, v.achieved ? 'Undo' : 'Mark achieved'),
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete dream', onclick: async () => { if (await confirmBox('Remove this dream?', `“${v.caption}” will be removed from your board.`, 'Remove')) S.commit((st) => { st.visionItems.splice(i, 1); }); } }, '✕'))))
  ) : empty('Add your first dream. Photos you pinned in the phone app stay safe and still appear there.'));
  if (items.some((v) => v.imagePath)) root.append(el('p', { class: 'muted small', text: 'Some dreams have photos from your phone. They are kept as-is and show in the phone app.' }));
}
