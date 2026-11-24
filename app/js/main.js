import { el, toast } from './util.js';
import * as S from './store.js';
import * as Sync from './sync.js';
import * as Today from './views/today.js';
import * as Tasks from './views/tasks.js';
import * as Habits from './views/habits.js';
import * as Journal from './views/journal.js';
import * as Money from './views/money.js';
import * as Progress from './views/progress.js';
import * as Mind from './views/mind.js';
import * as Settings from './views/settings.js';

const ICONS = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  tasks: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/>',
  habits: '<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 .5 1 1 1.5 2 1.5C11 8 11 5 12 3z"/>',
  journal: '<path d="M4 4h12a3 3 0 013 3v13H7a3 3 0 01-3-3V4z"/><path d="M8 9h7M8 13h5"/>',
  money: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  progress: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  mind: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
};
function icon(k) { const w = document.createElement('span'); w.className = 'ni'; w.setAttribute('aria-hidden', 'true'); w.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[k]}</svg>`; return w; } // static strings only
const ROUTES = [
  ['today', 'Today', Today], ['tasks', 'Tasks', Tasks], ['habits', 'Habits', Habits],
  ['journal', 'Reflect', Journal], ['money', 'Money', Money], ['progress', 'Progress', Progress],
  ['mind', 'Mind', Mind], ['settings', 'Settings', Settings],
];

S.load();
Settings.applyTheme(S.get().themeMode);
await Today.loadMantras();

const view = el('main', { id: 'view', tabindex: '-1' });
const nav = el('nav', { class: 'nav', 'aria-label': 'Main' });
const pillClick = () => { if (Sync.getStatus().status === 'reconnect') Sync.reconnect(); else location.hash = '#/settings'; };
const syncPill = el('button', { class: 'sync-pill', type: 'button', title: 'Sync status', onclick: pillClick });
const syncPill2 = el('button', { class: 'sync-pill', type: 'button', title: 'Sync status', onclick: pillClick });
const meBox = el('div', { class: 'me' });
function paintMe() {
  const u = Sync.getUser(); meBox.replaceChildren(); if (!u) return;
  const av = el('span', { class: 'av' }, (u.displayName || u.email || '?').trim().charAt(0).toUpperCase());
  meBox.append(av, el('span', { class: 'who', text: u.email || u.displayName }));
}

function current() { const k = (location.hash.replace(/^#\/?/, '') || 'today').split('?')[0]; return ROUTES.find((r) => r[0] === k) || ROUTES[0]; }

function paintNav() {
  const cur = current()[0];
  nav.replaceChildren(...ROUTES.map(([k, label]) => el('a', { href: `#/${k}`, class: k === cur ? 'on' : '', 'aria-current': k === cur ? 'page' : null },
    icon(k), el('span', { class: 'nl', text: label }))));
}
function paintSync() {
  const { status } = Sync.getStatus();
  const map = { off: ['Saved on this device', 'local'], signedout: ['Saved on this device', 'local'], idle: ['Synced', 'ok'], syncing: ['Saving…', 'busy'], error: ['Offline — saved here', 'warn'], reconnect: ['Reconnect Google', 'warn'], conflict: ['Needs attention', 'warn'] };
  const [t, c] = map[status] || map.off;
  [syncPill, syncPill2].forEach((b) => { b.className = `sync-pill ${c}`; b.replaceChildren(el('i'), t); });
  paintMe();
}

function render() {
  const [key, label, mod] = current();
  const scroll = window.scrollY;
  document.title = `${label} · Prakriyā`;
  paintNav();
  view.replaceChildren(mod.render(S.get(), render));
  if (view.dataset.k === key) window.scrollTo(0, scroll); else { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  view.dataset.k = key;
}

S.subscribe((reason) => { if (reason !== 'silent') render(); });
Sync.onStatus(paintSync); paintSync();
window.addEventListener('hashchange', render);
// New calendar day while the tab stays open: refresh "today".
let lastDay = new Date().toDateString();
setInterval(() => { const d = new Date().toDateString(); if (d !== lastDay) { lastDay = d; render(); } }, 60000);

const skip = el('a', { class: 'skip', href: '#view', onclick: (e) => { e.preventDefault(); view.focus(); } }, 'Skip to content');
const brandLink = () => el('a', { class: 'brand', href: '#/today' }, el('img', { src: '/app/icons/icon-192.png', alt: '', width: 36, height: 36 }), el('span', null, el('strong', { text: 'Prakriyā' }), el('em', { text: 'Daily practice' })));
const side = el('aside', { class: 'side' }, brandLink(), nav, el('div', { class: 'side-foot' }, meBox, syncPill));
const topbar = el('div', { class: 'topbar' }, brandLink(), syncPill2);
const main = el('div', { class: 'main' }, topbar, view);

// Sign-in gate: when Firebase is configured, people sign in before using the app.
// (Not configured yet = local-only mode, so the app still works during setup.)
const gated = Sync.isConfigured();
const gateMsg = el('p', { class: 'gate-msg', role: 'status' });
const G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';
const gateBtn = el('button', { class: 'gate-btn', type: 'button', onclick: () => Sync.signIn() });
function setGateBtn(label) { gateBtn.innerHTML = G; gateBtn.append(document.createTextNode(label)); } // G is a static string
setGateBtn('Continue with Google');
const gate = el('section', { class: 'gate', 'aria-labelledby': 'gate-h' },
  el('div', { class: 'gate-card' },
    el('img', { src: '/app/icons/icon-192.png', alt: '', width: 72, height: 72 }),
    el('h1', { id: 'gate-h', text: 'Welcome to Prakriyā' }),
    el('p', { text: 'A calm place for your daily practice — habits, priorities, reflection and money, in one view.' }),
    el('ul', { class: 'gate-points' },
      el('li', { text: 'Backed up to your own Google Drive — we never hold your data' }),
      el('li', { text: 'Stays in sync with the Prakriyā phone app' }),
      el('li', { text: 'Works offline, and installs like an app' })),
    gateBtn, gateMsg,
    el('p', { class: 'gate-fine muted' }, 'Prakriyā can only see its own hidden folder in your Drive. ', el('a', { href: '/privacy.html' }, 'Privacy'))));
let shellShown = null;
function paintGate() {
  if (!gated) return;
  const { status, msg } = Sync.getStatus();
  const known = !!S.getMeta().uid;                 // has signed in on this device before
  const allow = !!Sync.getUser() || (status === 'error' && known); // offline return visit
  if (allow !== shellShown) { shellShown = allow; [skip, side, main].forEach((n) => { n.hidden = !allow; }); gate.hidden = allow; if (allow) render(); }
  const loading = status === 'off' || (status === 'syncing' && !Sync.getUser());
  gateBtn.disabled = loading;
  setGateBtn(loading ? 'One moment…' : 'Continue with Google');
  gateMsg.textContent = status === 'error' && !known ? 'Could not reach sign-in. Check your connection and reload.' : (msg && !Sync.getUser() ? msg : '');
}
Sync.onStatus(paintGate);

document.getElementById('app').replaceChildren(skip, side, main, gate);
if (gated) { [skip, side, main].forEach((n) => { n.hidden = true; }); } else { gate.hidden = true; }
render();
Sync.init();
paintGate();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {});
let deferred = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferred = e;
  const b = el('button', { class: 'install', type: 'button', onclick: async () => { b.remove(); deferred.prompt(); deferred = null; } }, 'Install app');
  document.querySelector('.side-foot')?.append(b);
});
