// Optional, user-triggered copy of the app's data in the user's OWN Google Drive.
// A plain JSON file ("Prakriya backup.json") in My Drive that the user can see, download or delete.
// Scope drive.file: Prakriyā can only touch files it created itself. Live sync is separate (Firebase).
import * as S from './store.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const NAME = 'Prakriya backup.json';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const LAST_KEY = 'prakriya_web_drive_last_v1';

let tokenClient = null, token = null, tokenExp = 0, pending = null;

export const isAvailable = () => !!(window.PRAKRIYA_GOOGLE && window.PRAKRIYA_GOOGLE.clientId);
export function lastBackup() { try { return Number(localStorage.getItem(LAST_KEY)) || 0; } catch { return 0; } }
function setLast(ms) { try { localStorage.setItem(LAST_KEY, String(ms)); } catch { /* storage blocked */ } }

function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => resolve(); s.onerror = () => reject(new Error('gsi'));
    document.head.append(s);
  });
}

async function getToken() {
  if (token && Date.now() < tokenExp - 60000) return token;
  await loadGis();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: window.PRAKRIYA_GOOGLE.clientId, scope: SCOPE,
      callback: (r) => { const f = pending; pending = null; if (f) f(r); },
      error_callback: () => { const f = pending; pending = null; if (f) f(null); },
    });
  }
  const r = await new Promise((resolve) => { pending = resolve; tokenClient.requestAccessToken({ prompt: '' }); setTimeout(() => { if (pending === resolve) { pending = null; resolve(null); } }, 120000); });
  if (!r || r.error || !r.access_token) throw new Error('auth');
  const g = window.google.accounts.oauth2.hasGrantedAllScopes;
  if (g && !g(r, SCOPE)) throw new Error('scope');
  token = r.access_token; tokenExp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
  return token;
}

async function api(url, opts = {}) {
  const t = await getToken();
  const r = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${t}`, ...(opts.headers || {}) } });
  if (r.status === 401) { token = null; throw new Error('auth'); }
  if (!r.ok) throw new Error(`drive ${r.status}`);
  return r;
}
async function findId() {
  const q = encodeURIComponent(`name='${NAME}' and trashed=false`);
  const j = await (await api(`${API}/files?q=${q}&orderBy=modifiedTime%20desc&pageSize=1&fields=files(id)`)).json();
  return j.files && j.files[0] ? j.files[0].id : null;
}

// Returns the time of the backup, or throws Error('auth' | 'scope' | 'drive …').
export async function backUp() {
  const payload = JSON.stringify({ app: 'prakriya', v: 1, savedAt: new Date().toISOString(), device: 'web', state: JSON.parse(JSON.stringify(S.get())) });
  const id = await findId();
  let r;
  if (id) r = await api(`${UPLOAD}/files/${id}?uploadType=media&fields=id,modifiedTime`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: payload });
  else {
    const b = '-------prakriya' + Math.random().toString(36).slice(2);
    const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: NAME, mimeType: 'application/json' })}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${payload}\r\n--${b}--`;
    r = await api(`${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body });
  }
  const j = await r.json(); const t = Date.parse(j.modifiedTime) || Date.now(); setLast(t); return t;
}

// Returns the saved state object (caller confirms with the user, then replaces data), or null if there is no backup.
export async function fetchBackup() {
  const id = await findId(); if (!id) return null;
  const body = await (await api(`${API}/files/${id}?alt=media`)).json();
  return body && body.state && typeof body.state === 'object' ? body.state : null;
}
