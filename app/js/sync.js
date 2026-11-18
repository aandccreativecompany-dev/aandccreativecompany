// Optional Google sign-in + Firestore sync, using the same project and the
// same document as the Android app: users/{uid} = { state, updatedAt }.
// Last-write-wins like the phone app, but with a guard: before the web app
// overwrites the cloud copy it checks that nobody else (your phone) wrote
// newer data since we last looked, and asks you instead of clobbering it.
import * as S from './store.js';
import { dialog, toast } from './util.js';

const V = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${V}`;
let fb = null;           // loaded SDK pieces
let user = null;
let status = 'off';      // off | signedout | idle | syncing | error | conflict
let statusMsg = '';
let pushTimer = null;
let busy = false;
const subs = new Set();

export const isConfigured = () => !!window.PRAKRIYA_FIREBASE;
export const getUser = () => user;
export const getStatus = () => ({ status, msg: statusMsg });
export const onStatus = (fn) => { subs.add(fn); return () => subs.delete(fn); };
function setStatus(s, msg = '') { status = s; statusMsg = msg; subs.forEach((f) => f()); }

export async function init() {
  if (!isConfigured()) { setStatus('off'); return; }
  try {
    const [app, auth, fs] = await Promise.all([
      import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`)]);
    const a = app.initializeApp(window.PRAKRIYA_FIREBASE);
    fb = { app, auth, fs, a, authInst: auth.getAuth(a), db: fs.getFirestore(a) };
    setStatus('signedout');
    auth.onAuthStateChanged(fb.authInst, async (u) => {
      user = u;
      if (!u) { setStatus('signedout'); return; }
      S.setMeta({ uid: u.uid });
      await firstSync();
    });
    S.subscribe((reason) => { if (reason === 'local' || reason === 'silent') schedulePush(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRemote(); });
    window.addEventListener('online', () => { if (user) syncNow(); });
  } catch (e) {
    setStatus('error', 'Sync could not start. You can keep using Prakriyā on this device.');
  }
}

export async function signIn() {
  if (!fb) return;
  try {
    setStatus('syncing', 'Signing in…');
    await fb.auth.signInWithPopup(fb.authInst, new fb.auth.GoogleAuthProvider());
  } catch (e) {
    const cancelled = e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request');
    setStatus('signedout', cancelled ? '' : 'Sign-in did not complete. Please try again.');
  }
}
export async function signOut() {
  if (!fb) return;
  await maybePushBeforeLeaving();
  await fb.auth.signOut(fb.authInst);
  S.setMeta({ uid: null, remoteStamp: 0 });
}
async function maybePushBeforeLeaving() { if (user && S.getMeta().dirty) await push(true); }

const ref = () => fb.fs.doc(fb.db, 'users', user.uid);
async function fetchRemote() {
  const snap = await fb.fs.getDoc(ref());
  if (!snap.exists()) return null;
  const d = snap.data();
  const ts = d.updatedAt && d.updatedAt.toMillis ? d.updatedAt.toMillis() : 0;
  const st = d.state && typeof d.state === 'object' ? d.state : null;
  return { state: st, stamp: ts };
}

async function firstSync() {
  try {
    setStatus('syncing', 'Syncing…');
    const remote = await fetchRemote();
    const meta = S.getMeta();
    if (!remote || !remote.state) { await push(true); return; }
    if (S.looksEmpty()) { adopt(remote); toast('Loaded your data from the cloud'); return; }
    if (meta.remoteStamp && meta.remoteStamp === remote.stamp) {
      if (meta.dirty) await push(true); else setStatus('idle', 'Up to date');
      return;
    }
    // Both sides have data and we have never reconciled them — let the user choose.
    const choice = await dialog({
      title: 'Which data should we keep?',
      body: 'This browser and your Prakriyā account both already have data. Pick one — the other will be replaced. (Your phone app is not affected until it next syncs.)',
      actions: [
        { label: 'Use my account data (recommended)', value: 'cloud', kind: 'primary' },
        { label: 'Use this browser’s data', value: 'local' },
      ],
    });
    if (choice === 'local') await push(true, true); else adopt(remote);
  } catch (e) { setStatus('error', 'Could not reach the cloud. Your changes are saved on this device.'); }
}

function adopt(remote) {
  S.replaceState(remote.state, { markDirty: false });
  S.setMeta({ remoteStamp: remote.stamp, dirty: false });
  setStatus('idle', 'Up to date');
}

function schedulePush() {
  if (!user || !fb) return;
  clearTimeout(pushTimer);
  setStatus('syncing', 'Saving…');
  pushTimer = setTimeout(() => push(false), 2000);
}

async function push(immediate, force = false) {
  if (!user || !fb || busy) return;
  busy = true;
  try {
    if (!force) {
      const remote = await fetchRemote();
      const known = S.getMeta().remoteStamp;
      if (remote && remote.state && known && remote.stamp > known) {
        busy = false;
        await handleConflict(remote);
        return;
      }
    }
    const clean = JSON.parse(JSON.stringify(S.get()));
    await fb.fs.setDoc(ref(), { state: clean, updatedAt: fb.fs.serverTimestamp() });
    const after = await fetchRemote();
    S.setMeta({ remoteStamp: after ? after.stamp : Date.now(), dirty: false });
    setStatus('idle', 'Saved to your account');
  } catch (e) {
    setStatus('error', navigator.onLine ? 'Could not save to the cloud. Will retry.' : 'You are offline. Changes are saved on this device.');
  } finally { busy = false; }
}

async function handleConflict(remote) {
  setStatus('conflict', 'Your phone has newer data');
  const choice = await dialog({
    title: 'Newer data from your other device',
    body: 'Your account has newer changes (probably from your phone) and this browser also has unsaved edits. Which should win?',
    actions: [
      { label: 'Load the newer data (discard my web edits)', value: 'cloud', kind: 'primary' },
      { label: 'Keep my web edits (overwrite the cloud)', value: 'local' },
    ],
  });
  if (choice === 'local') await push(true, true); else if (choice === 'cloud') adopt(remote); else setStatus('conflict', 'Not synced — your phone has newer data');
}

export async function checkRemote() {
  if (!user || !fb || busy || document.hidden) return;
  try {
    const remote = await fetchRemote();
    const meta = S.getMeta();
    if (!remote || !remote.state || !remote.stamp || remote.stamp <= (meta.remoteStamp || 0)) return;
    if (!meta.dirty) { adopt(remote); toast('Updated from your other device'); }
    else await handleConflict(remote);
  } catch { /* offline: ignore */ }
}
export async function syncNow() {
  if (!user || !fb) return;
  await checkRemote();
  if (S.getMeta().dirty) await push(true);
  else setStatus('idle', 'Up to date');
}
setInterval(() => { checkRemote(); }, 90000);
