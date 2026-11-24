import { el, toast, dialog, confirmBox, dayKey } from '../util.js';
import * as S from '../store.js';
import * as Sync from '../sync.js';
import * as Drive from '../drivebackup.js';
import { card, pageHead } from '../ui.js';

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode); else root.removeAttribute('data-theme');
}

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Settings'));

  const name = el('input', { type: 'text', maxlength: 40, value: s.userName || '', placeholder: 'Your name', 'aria-label': 'Your name' });
  name.addEventListener('change', () => S.commit((st) => { st.userName = name.value.trim(); }));
  const theme = el('select', { 'aria-label': 'Theme' }, [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => el('option', { value: v, text: l, selected: (s.themeMode || 'system') === v ? true : null })));
  theme.addEventListener('change', () => { S.commit((st) => { st.themeMode = theme.value; }, { silent: true }); applyTheme(theme.value); });
  root.append(card('Profile', el('label', { class: 'field' }, el('span', { text: 'Name' }), name), el('label', { class: 'field' }, el('span', { text: 'Theme' }), theme)));

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

  root.append(card('About', el('p', { class: 'muted' }, 'Prakriyā Web ', el('span', { class: 'chip', text: 'beta' }), ' — the desktop companion to the Prakriyā Android app, by A&C Creative Ventures. ',
    el('a', { href: '/privacy', target: '_blank', rel: 'noopener' }, 'Privacy policy'), ' · ', el('a', { href: '/contact', target: '_blank', rel: 'noopener' }, 'Send feedback'))));
  return root;
}
