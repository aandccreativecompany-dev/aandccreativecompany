// Local-first state. The whole app state is ONE plain JSON object that is
// shaped exactly like the Android app's AppState JSON, so the same Firestore
// document (users/{uid}.state) can be read and written by both. We only ever
// touch the keys we know about and leave everything else in the object alone,
// so data created on the phone (vision photos, mind-map notes, PIN, widget
// settings...) survives a round trip through the web app untouched.
import { dayKey, parseDay, addDays, newId } from './util.js';

const LS_STATE = 'prakriya_web_state_v1';
const LS_META = 'prakriya_web_meta_v1';

export function initialState() {
  return {
    tasksByDay: {}, habits: [], weeklyGoals: [], monthlyGoals: [],
    journalByDay: {}, moodByDay: {}, scripts: [], visionItems: [], customReframes: [],
    spendCategories: [
      { id: 'food', name: 'Food', subcategories: ['Groceries', 'Dining out'] },
      { id: 'transport', name: 'Transport', subcategories: ['Fuel', 'Public transit'] },
      { id: 'shopping', name: 'Shopping', subcategories: ['Clothing', 'Electronics'] },
      { id: 'bills', name: 'Bills', subcategories: ['Rent', 'Utilities', 'Subscriptions'] },
      { id: 'other', name: 'Other', subcategories: [] },
    ],
    spendEntries: [], savingsEntries: [], spendBudgetAmount: null, spendBudgetPeriod: 'monthly',
    financeBudgetIncome: null, financeBudgetNeedsPct: 50, financeBudgetWantsPct: 30, financeBudgetSavingsPct: 20,
    financeRoadmap: null, userName: '', themeMode: 'system',
  };
}

const listeners = new Set();
let state = initialState();
let meta = { dirty: false, remoteStamp: 0, uid: null, updatedLocal: 0 };

function readLS(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }

export function load() {
  const s = readLS(LS_STATE, null);
  state = s && typeof s === 'object' ? { ...initialState(), ...s } : initialState();
  meta = { ...meta, ...readLS(LS_META, {}) };
}
export const get = () => state;
export const getMeta = () => meta;
export function setMeta(patch) { meta = { ...meta, ...patch }; writeLS(LS_META, meta); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(reason) { listeners.forEach((fn) => fn(reason)); }

// Every edit goes through commit(): persist locally, flag as "not yet synced".
export function commit(mutator, opts = {}) {
  mutator(state);
  meta.dirty = true; meta.updatedLocal = Date.now();
  writeLS(LS_STATE, state); writeLS(LS_META, meta);
  emit(opts.silent ? 'silent' : 'local');
}
// Replace everything with a copy that came from the cloud or an import.
export function replaceState(next, { markDirty = false } = {}) {
  state = { ...initialState(), ...next };
  meta.dirty = markDirty;
  writeLS(LS_STATE, state); writeLS(LS_META, meta);
  emit('replace');
}
export function looksEmpty(s = state) {
  return !(s.habits?.length || Object.keys(s.tasksByDay || {}).length || Object.keys(s.journalByDay || {}).length ||
    s.scripts?.length || s.spendEntries?.length || s.visionItems?.length || s.weeklyGoals?.length || s.monthlyGoals?.length);
}
export function wipeLocal() {
  state = initialState(); meta = { dirty: false, remoteStamp: 0, uid: null, updatedLocal: 0 };
  try { localStorage.removeItem(LS_STATE); localStorage.removeItem(LS_META); } catch {}
  emit('replace');
}

// ---- selectors / helpers -------------------------------------------------
export const tasksFor = (key, s = state) => (s.tasksByDay?.[key] || []);
export const journalFor = (key, s = state) => {
  const j = s.journalByDay?.[key];
  return { achievements: ['', '', ''], gratitude: '', reflection: '', ...(j || {}) };
};
export const journalEmpty = (j) => !j || ((j.achievements || []).every((a) => !String(a).trim()) && !String(j.gratitude || '').trim() && !String(j.reflection || '').trim());
export const habitDone = (h, key) => (h.completedDays || []).includes(key);
export function habitStreak(h, today = new Date()) {
  let n = 0; let c = addDays(today, 0);
  // an unchecked "today" should not zero a streak that ran through yesterday
  if (!habitDone(h, dayKey(c))) c = addDays(c, -1);
  while (habitDone(h, dayKey(c))) { n++; c = addDays(c, -1); }
  return n;
}
export function toggleHabit(id, key) {
  commit((s) => {
    const h = s.habits.find((x) => x.id === id); if (!h) return;
    h.completedDays = h.completedDays || [];
    const i = h.completedDays.indexOf(key);
    if (i >= 0) h.completedDays.splice(i, 1); else h.completedDays.push(key);
  });
}
export function addHabit(name) {
  commit((s) => { s.habits.push({ id: newId(), name, completedDays: [], iconIndex: 0, colorIndex: s.habits.length % 6 }); });
}

// A day's score 0..1: habits 40%, priorities 35%, a reflection or mood 25%.
export function dayFacts(d, s = state) {
  const key = dayKey(d);
  const hs = s.habits || [];
  const habitsFrac = hs.length ? hs.filter((h) => habitDone(h, key)).length / hs.length : 0;
  const ts = tasksFor(key, s);
  const tasksFrac = ts.length ? ts.filter((t) => t.done).length / ts.length : 0;
  const mind = (!journalEmpty(s.journalByDay?.[key]) || s.moodByDay?.[key]) ? 1 : 0;
  const hasAny = hs.length > 0 || ts.length > 0;
  let score = 0, weight = 0;
  if (hs.length) { score += habitsFrac * 40; weight += 40; }
  if (ts.length) { score += tasksFrac * 35; weight += 35; }
  score += mind * 25; weight += 25;
  return { key, habitsFrac, tasksFrac, mind, score: weight ? score / weight : 0, active: habitsFrac > 0 || tasksFrac > 0 || mind > 0, hasAny };
}

export { dayKey, parseDay };
