import { el, toast, dialog, confirmBox, dayKey } from '../util.js';
import * as S from '../store.js';
import * as Sync from '../sync.js';
import * as Drive from '../drivebackup.js';
import { card, pageHead } from '../ui.js';
import * as Look from '../appearance.js';
import { mark } from '../climber.js';

export const applyTheme = Look.applyThemeMode;

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Settings'));

  const name = el('input', { type: 'text', maxlength: 40, value: s.userName || '', placeholder: 'Your name', 'aria-label': 'Your name' });
  name.addEventListener('change', () => S.commit((st) => { st.userName = name.value.trim(); }));
  root.append(card('Profile', el('label', { class: 'field' }, el('span', { text: 'Name' }), name)));
  root.append(appearanceCard(s));

  // Sync
  const syncBox = el('div', { class: 'stack' });
  const paintSync = () => {
    const { status, msg } = Sync.getStatus(), u = Sync.getUser();
    syncBox.replaceChildren();
    if (!Sync.isConfigured()) {
      syncBox.append(el('p', { class: 'muted', text: 'Account sync is not switched on for this site yet. Your data is saved privately in this browser, and you can move it with Export and Import below.' }));
    } else if (!u) {
      syncBox.append(el('p', { class: 'muted', text: 'Sign in with Google to keep this app and the Prakriyā phone app in sync. It is optional — everything works without it.' }),
        el('button', { class: 'btn primary', type: 'button', onclick: () => Sync.signIn() }, 'Sign in with Google'), msg ? el('p', { class: 'warn small', text: msg }) : null);
    } else {
      syncBox.append(el('p', null, 'Signed in as ', el('strong', { text: u.email || u.displayName || 'your account' })),
        el('p', { class: `small ${status === 'error' || status === 'conflict' || status === 'reconnect' ? 'warn' : 'muted'}`, text: msg || 'Up to date', 'aria-live': 'polite' }),
        el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: () => Sync.syncNow().then(() => toast('Synced')) }, status === 'reconnect' ? 'Reconnect to Google' : 'Sync now'),
          el('button', { class: 'btn ghost', type: 'button', onclick: () => Sync.signOut() }, 'Sign out')));
    }
  };
  paintSync();
  const unsub = Sync.onStatus(() => { if (syncBox.isConnected) paintSync(); else unsub(); });
  root.append(card('Sync with your phone', syncBox));

  // Optional: copy to the person's own Google Drive
  if (Drive.isAvailable()) {
    const driveBox = el('div', { class: 'stack' });
    const when = () => { const t = Drive.lastBackup(); return t ? `Last backed up ${new Date(t).toLocaleString()}` : 'Not backed up to Drive yet'; };
    const note = el('p', { class: 'small muted', text: when(), 'aria-live': 'polite' });
    const oops = (e) => toast(e && e.message === 'scope' ? 'Please tick the Google Drive box when asked, then try again.' : e && e.message === 'auth' ? 'Google sign-in was cancelled or blocked. Allow pop-ups and try again.' : 'Could not reach Google Drive. Please try again.', 4500);
    const b1 = el('button', { class: 'btn', type: 'button', onclick: async () => {
      b1.disabled = true; try { await Drive.backUp(); note.textContent = when(); toast('Saved to your Google Drive'); } catch (e) { oops(e); } b1.disabled = false; } }, 'Back up to my Drive');
    const b2 = el('button', { class: 'btn ghost', type: 'button', onclick: async () => {
      b2.disabled = true;
      try {
        const st = await Drive.fetchBackup();
        if (!st) toast('No Drive backup found yet. Back up first.', 4000);
        else if (await dialog({ title: 'Restore from Drive?', body: 'This replaces everything in this browser with your last Drive backup.', actions: [{ label: 'Cancel', value: false }, { label: 'Restore', value: true, kind: 'primary' }] })) { S.replaceState(st, { markDirty: true }); toast('Restored from Drive'); }
      } catch (e) { oops(e); } b2.disabled = false; } }, 'Restore from Drive');
    driveBox.append(el('p', { class: 'muted', text: 'Keep an extra copy of your data in your own Google Drive. It is a single file you can see and delete anytime. Prakriyā can only access that file, nothing else in your Drive.' }), note, el('div', { class: 'row' }, b1, b2));
    root.append(card('Google Drive backup', driveBox));
  }

  // Export / import
  const file = el('input', { type: 'file', accept: 'application/json,.json', hidden: true, 'aria-label': 'Import file',
    onchange: async () => {
      const f = file.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        const st = data && data.state && typeof data.state === 'object' ? data.state : data;
        if (!st || typeof st !== 'object' || Array.isArray(st) || !('habits' in st || 'tasksByDay' in st || 'journalByDay' in st)) throw new Error('shape');
        if (await dialog({ title: 'Replace your data?', body: 'This replaces everything in this browser with the contents of the file.', actions: [{ label: 'Cancel', value: false }, { label: 'Import', value: true, kind: 'primary' }] })) {
          S.replaceState(st, { markDirty: true }); toast('Imported'); }
      } catch { toast('That does not look like a Prakriyā backup file.', 4000); }
      file.value = '';
    } });
  root.append(card('Your data', el('p', { class: 'muted', text: 'A backup file is plain JSON. You own it — keep it somewhere safe.' }), el('div', { class: 'row' },
    el('button', { class: 'btn', type: 'button', onclick: () => {
      const blob = new Blob([JSON.stringify({ app: 'prakriya-web', exportedAt: new Date().toISOString(), state: S.get() }, null, 2)], { type: 'application/json' });
      const a = el('a', { href: URL.createObjectURL(blob), download: `prakriya-backup-${dayKey()}.json` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } }, 'Export backup'),
    el('button', { class: 'btn', type: 'button', onclick: () => file.click() }, 'Import backup'), file,
    el('button', { class: 'btn danger ghost', type: 'button', onclick: async () => {
      if (await confirmBox('Erase data on this device?', Sync.getUser() ? 'This clears this browser. Your cloud copy is not deleted, and it will load again next time you sign in.' : 'This permanently clears everything saved in this browser. Export a backup first if you might want it back.', 'Erase')) { S.wipeLocal(); toast('Erased'); } } }, 'Erase this device'))));

  root.append(card('About', el('div', { class: 'row' }, el('div', { class: 'gate-mark', style: 'width:64px;height:64px;border-radius:16px;margin:0' }, mark(64, { animate: true })), el('p', { class: 'muted', style: 'flex:1;min-width:200px' }, 'Prakriyā Web ', el('span', { class: 'chip', text: 'beta' }), ' — the desktop companion to the Prakriyā Android app, by A&C Creative Ventures. ',
    el('a', { href: '/privacy', target: '_blank', rel: 'noopener' }, 'Privacy policy'), ' · ', el('a', { href: '/contact', target: '_blank', rel: 'noopener' }, 'Send feedback')))));
  return root;
}


// ---- Appearance: mode, presets, colours, fonts, text size, background ----------
function appearanceCard(s0) {
  const cur = () => S.get();
  const set = (patch) => { S.commit((st) => Object.assign(st, patch), { silent: true }); Look.apply(S.get()); refresh(); };
  // A single-choice group of buttons that keeps its own highlighted state.
  const group = (cls, items, value, onPick, label) => {
    const wrap = el('div', { class: cls, role: 'radiogroup', 'aria-label': label });
    const btns = items.map((it) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', class: it.cls || '', title: it.title || it.label, onclick: () => onPick(it.id) }, ...it.kids);
      b.dataset.id = it.id; return b;
    });
    wrap.append(...btns);
    wrap.sync = () => { const v = value(); btns.forEach((b) => { const on = b.dataset.id === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }); };
    return wrap;
  };
  const mode = group('seg wide', [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([id, label]) => ({ id, label, kids: [label] })),
    () => cur().themeMode || 'system', (id) => set({ themeMode: id }), 'Light or dark');
  const dot = (c) => el('i', { class: 'sw', style: `background:${c}` });
  const accents = group('swatches', Look.ACCENTS.map((a) => ({ id: a.id, label: a.label, kids: [dot(`linear-gradient(135deg, ${a.light} 50%, ${a.dark} 50%)`), el('span', { text: a.label })] })),
    () => Look.accentOf(cur()).id, (id) => set({ themeAccentId: id }), 'Accent colour');
  const presets = group('presets', Look.PRESETS.map((p) => { const a = Look.ACCENTS.find((x) => x.id === p.accent), f = Look.FONTS.find((x) => x.id === p.font);
    return { id: p.id, label: p.label, kids: [el('span', { class: 'ps-dots' }, dot(a.light), dot(a.dark)), el('strong', { text: p.label, style: `font-family:"${f.family}",system-ui,sans-serif` }), el('span', { class: 'muted small', text: p.blurb })] }; }),
    () => { const st = cur(); const p = Look.PRESETS.find((x) => x.accent === Look.accentOf(st).id && x.font === Look.fontOf(st).id && x.scale === Look.scaleOf(st).id); return p ? p.id : ''; },
    (id) => { const p = Look.PRESETS.find((x) => x.id === id); set({ themeAccentId: p.accent, fontFamilyId: p.font, fontScaleId: p.scale }); }, 'Theme presets');
  Look.FONTS.forEach(Look.loadFont); // so each name below can show in its own typeface
  const fonts = group('fonts', Look.FONTS.map((f) => ({ id: f.id, label: f.label, kids: [el('span', { class: 'fa', style: `font-family:"${f.family}",${f.serif ? 'Georgia,serif' : 'system-ui,sans-serif'}`, text: 'Aa' }), el('span', { text: f.label })] })),
    () => Look.fontOf(cur()).id, (id) => set({ fontFamilyId: id }), 'Reading font');
  const sizes = group('seg wide', Look.SCALES.map((x) => ({ id: x.id, label: x.label, kids: [el('span', { style: `font-size:${Math.round(14 * x.factor)}px`, text: x.label })] })),
    () => Look.scaleOf(cur()).id, (id) => set({ fontScaleId: id }), 'Text size');
  const bgs = group('seg wide', Look.BACKGROUNDS.map((b) => ({ id: b.id, label: b.label, title: b.blurb, kids: [b.label] })),
    () => (Look.BACKGROUNDS.some((b) => b.id === Look.getUi().bg) ? Look.getUi().bg : 'soft'), (id) => { Look.setUi({ bg: id }); refresh(); }, 'Page background');
  const calm = el('input', { type: 'checkbox', id: 'calm', checked: !!Look.getUi().calm, 'aria-describedby': 'calm-d',
    onchange: () => { Look.setUi({ calm: calm.checked }); } });
  const refresh = () => [mode, accents, presets, fonts, sizes, bgs].forEach((g) => g.sync());
  refresh();
  const sample = el('div', { class: 'sample' }, el('span', { class: 'eyebrow', text: 'Preview' }), el('p', { class: 'sample-q', text: '“Small steps, taken daily, change everything.”' }),
    el('p', { class: 'muted small', text: 'This is how your text will look across the app.' }));
  return card('Appearance',
    el('p', { class: 'muted small', text: 'Your colour, font and size choices follow you to the Prakriyā phone app when you are signed in.' }),
    el('div', { class: 'opt' }, el('h3', { text: 'Mode' }), mode),
    el('div', { class: 'opt' }, el('h3', { text: 'Quick themes' }), presets),
    el('div', { class: 'opt' }, el('h3', { text: 'Accent colour' }), accents),
    el('div', { class: 'opt' }, el('h3', { text: 'Reading font' }), fonts),
    el('div', { class: 'opt' }, el('h3', { text: 'Text size' }), sizes),
    el('div', { class: 'opt' }, el('h3', { text: 'Page background' }), bgs, el('p', { class: 'muted small', text: 'Applies to light mode, on this device.' })),
    el('label', { class: 'switchrow', for: 'calm' }, calm, el('span', null, el('strong', { text: 'Calm mode' }), el('span', { id: 'calm-d', class: 'muted small', text: ' Turn off animations and the intro. Also follows your device’s “reduce motion” setting.' }))),
    sample,
    el('div', { class: 'row' }, el('button', { class: 'btn', type: 'button', onclick: () => { Look.setUi({ bg: 'soft' }); set({ themeAccentId: 'gold', fontFamilyId: 'inter', fontScaleId: 'default', themeMode: 'system' }); toast('Back to the classic look'); } }, 'Reset to classic'),
      el('button', { class: 'btn ghost', type: 'button', onclick: () => { try { sessionStorage.removeItem('prakriya_splash'); } catch {} location.reload(); } }, 'Replay the intro')));
}
