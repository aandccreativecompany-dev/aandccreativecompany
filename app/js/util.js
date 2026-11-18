// Small DOM + date helpers. Everything is built with textContent / DOM nodes,
// never innerHTML, so user text (and anything arriving from the cloud) can
// never inject markup.
export function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') n.value = v;
      else if (k === 'checked') n.checked = !!v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    n.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return n;
}

export const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseDay(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
export const isoLocal = (d = new Date()) =>
  `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
export const fmtLong = (d) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
let seq = 0;
export const newId = () => `${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${seq++}`;
export function weekStart(d) { const x = addDays(d, 0); const dow = (x.getDay() + 6) % 7; return addDays(x, -dow); }

export function toast(msg, ms = 2600) {
  let host = document.getElementById('toasts');
  if (!host) { host = el('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(host); }
  const t = el('div', { class: 'toast', text: msg });
  host.append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

export function dialog({ title, body, actions }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const close = (v) => { wrap.remove(); prev && prev.focus && prev.focus(); resolve(v); };
    const btns = actions.map((a) => el('button', { class: `btn ${a.kind || ''}`, type: 'button', onclick: () => close(a.value) }, a.label));
    const wrap = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title,
      onkeydown: (e) => { if (e.key === 'Escape') close(null); } },
      el('div', { class: 'modal' }, el('h2', { text: title }), typeof body === 'string' ? el('p', { text: body }) : body, el('div', { class: 'modal-actions' }, btns)));
    document.body.append(wrap);
    (btns[btns.length - 1]).focus();
  });
}
export const confirmBox = (title, body, yes = 'Delete') =>
  dialog({ title, body, actions: [{ label: 'Cancel', value: false }, { label: yes, value: true, kind: 'danger' }] });
