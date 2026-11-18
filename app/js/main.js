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

const ROUTES = [
  ['today', 'Today', '☀️', Today], ['tasks', 'Tasks & goals', '✅', Tasks], ['habits', 'Habits', '🔥', Habits],
  ['journal', 'Reflection', '📝', Journal], ['money', 'Money', '💰', Money], ['progress', 'Progress', '📈', Progress],
  ['mind', 'Mind & vision', '🧠', Mind], ['settings', 'Settings', '⚙️', Settings],
];

S.load();
Settings.applyTheme(S.get().themeMode);
await Today.loadMantras();

const view = el('main', { id: 'view', tabindex: '-1' });
const nav = el('nav', { class: 'nav', 'aria-label': 'Main' });
const syncPill = el('button', { class: 'sync-pill', type: 'button', title: 'Sync status', onclick: () => { location.hash = '#/settings'; } });

function current() { const k = (location.hash.replace(/^#\/?/, '') || 'today').split('?')[0]; return ROUTES.find((r) => r[0] === k) || ROUTES[0]; }

function paintNav() {
  const cur = current()[0];
  nav.replaceChildren(...ROUTES.map(([k, label, icon]) => el('a', { href: `#/${k}`, class: k === cur ? 'on' : '', 'aria-current': k === cur ? 'page' : null },
    el('span', { class: 'ni', 'aria-hidden': 'true' }, icon), el('span', { class: 'nl', text: label }))));
}
function paintSync() {
  const { status } = Sync.getStatus();
  const map = { off: ['Saved on this device', 'local'], signedout: ['Saved on this device', 'local'], idle: ['Synced', 'ok'], syncing: ['Saving…', 'busy'], error: ['Offline — saved here', 'warn'], conflict: ['Needs attention', 'warn'] };
  const [t, c] = map[status] || map.off;
  syncPill.className = `sync-pill ${c}`; syncPill.replaceChildren(el('i'), t);
}

function render() {
  const [key, label, , mod] = current();
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
const side = el('aside', { class: 'side' },
  el('a', { class: 'brand', href: '#/today' }, el('img', { src: '/app/icons/icon-192.png', alt: '', width: 36, height: 36 }), el('span', null, el('strong', { text: 'Prakriyā' }), el('em', { text: 'Daily practice' }))),
  nav, syncPill);

// Sign-in gate: when Firebase is configured, people sign in before using the app.
// (Not configured yet = local-only mode, so the app still works during setup.)
const gated = Sync.isConfigured();
const gateMsg = el('p', { class: 'gate-msg', role: 'status' });
const gateBtn = el('button', { class: 'btn gate-btn', type: 'button', onclick: () => Sync.signIn() }, 'Continue with Google');
const gate = el('section', { class: 'gate', 'aria-labelledby': 'gate-h' },
  el('div', { class: 'gate-card' },
    el('img', { src: '/app/icons/icon-192.png', alt: '', width: 72, height: 72 }),
    el('h1', { id: 'gate-h', text: 'Welcome to Prakriyā' }),
    el('p', { text: 'Sign in to open your daily practice. Your habits, journal and goals stay private to you and sync with the Prakriyā phone app.' }),
    gateBtn, gateMsg,
    el('p', { class: 'gate-fine' }, 'We only use your Google account to keep your data yours. ', el('a', { href: '/privacy.html' }, 'Privacy'))));
let shellShown = null;
function paintGate() {
  if (!gated) return;
  const { status, msg } = Sync.getStatus();
  const known = !!S.getMeta().uid;                 // has signed in on this device before
  const allow = !!Sync.getUser() || (status === 'error' && known); // offline return visit
  if (allow !== shellShown) { shellShown = allow; [skip, side, view].forEach((n) => { n.hidden = !allow; }); gate.hidden = allow; if (allow) render(); }
  const loading = status === 'off' || (status === 'syncing' && !Sync.getUser());
  gateBtn.disabled = loading;
  gateBtn.textContent = loading ? 'One moment…' : 'Continue with Google';
  gateMsg.textContent = status === 'error' && !known ? 'Could not reach sign-in. Check your connection and reload.' : (msg && !Sync.getUser() ? msg : '');
}
Sync.onStatus(paintGate);

document.getElementById('app').replaceChildren(skip, side, view, gate);
if (gated) { [skip, side, view].forEach((n) => { n.hidden = true; }); } else { gate.hidden = true; }
render();
Sync.init();
paintGate();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(() => {});
let deferred = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferred = e;
  const b = el('button', { class: 'install', type: 'button', onclick: async () => { b.remove(); deferred.prompt(); deferred = null; } }, 'Install app');
  document.querySelector('.side')?.append(b);
});
