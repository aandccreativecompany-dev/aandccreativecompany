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
    themeAccentId: 'gold', fontFamilyId: 'inter', fontScaleId: 'default',
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

// ---- growth (tree / bird) -------------------------------------------------
// Same engine as the phone app: a day earns up to 100 points (habits 30,
// priorities 25, mind 20, body 15, reaching out 10); the companion's stage is
// decided by the running total over the last 365 days. Water, calls and
// meditation are logged only on the phone, so they are not counted here.
export const STAGE_MIN = [0, 40, 150, 400, 800, 1400, 2400];
export const stageFor = (points) => { let o = 0; STAGE_MIN.forEach((m, i) => { if (points >= m) o = i; }); return o; };

export function growth(s = state, now = new Date()) {
  const today = addDays(now, 0);
  const meals = {};
  for (const e of (s.nutritionEntries || [])) { const k = String((e && e.date) || '').slice(0, 10); if (k) meals[k] = (meals[k] || 0) + 1; }
  const facts = (d) => {
    const key = dayKey(d), hs = s.habits || [], ts = tasksFor(key, s);
    const habitsFrac = hs.length ? hs.filter((h) => habitDone(h, key)).length / hs.length : 0;
    const tasksFrac = ts.length ? ts.filter((t) => t.done).length / ts.length : 0;
    const mood = !!(s.moodByDay && s.moodByDay[key]), journal = !journalEmpty(s.journalByDay && s.journalByDay[key]);
    const minds = ((s.doseByDay && s.doseByDay[key]) || []).length + ((s.stressBucketFills && s.stressBucketFills[key]) || []).length + ((s.stressBucketEmpties && s.stressBucketEmpties[key]) || []).length;
    const mindFrac = ((mood ? 1 : 0) + (journal ? 1 : 0) + (minds > 0 ? 1 : 0)) / 3;
    const bodyFrac = ((meals[key] || 0) > 0 ? 1 : 0) / 2;
    const active = habitsFrac > 0 || tasksFrac > 0 || mood || journal || minds > 0 || (meals[key] || 0) > 0;
    return { key, habitsFrac, tasksFrac, mindFrac, bodyFrac, active, points: Math.round(habitsFrac * 30 + tasksFrac * 25 + mindFrac * 20 + bodyFrac * 15) };
  };
  // Start at the earliest recorded activity (at most a year back, at least a week).
  let first = null;
  const consider = (k) => { const d = parseDay(String(k).slice(0, 10)); if (isNaN(d) || d > today) return; if (!first || d < first) first = d; };
  (s.habits || []).forEach((h) => (h.completedDays || []).forEach(consider));
  Object.entries(s.tasksByDay || {}).forEach(([k, v]) => { if ((v || []).some((t) => t.done)) consider(k); });
  Object.keys(s.moodByDay || {}).forEach(consider);
  Object.entries(s.journalByDay || {}).forEach(([k, v]) => { if (!journalEmpty(v)) consider(k); });
  Object.keys(meals).forEach(consider);
  let start = first || today; const limit = addDays(today, -365), week = addDays(today, -6);
  if (start < limit) start = limit; if (start > week) start = week;
  const days = []; let total = 0, lastStage = 0; const stageUps = {};
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const f = facts(d); days.push(f); total += f.points;
    const st = stageFor(total); if (st > lastStage) { stageUps[f.key] = st; lastStage = st; }
  }
  const stage = stageFor(total), next = stage < 6 ? STAGE_MIN[stage + 1] : null;
  const toNext = next == null ? 1 : clamp01((total - STAGE_MIN[stage]) / (next - STAGE_MIN[stage]));
  let quiet = 0; for (let i = days.length - 1; i >= 0; i--) { if (days[i].active) break; quiet++; }
  const wk = days.slice(-7), avg = (fn) => (wk.length ? wk.reduce((a, f) => a + fn(f), 0) / wk.length : 0);
  return { points: total, stage, next, toNext, thirsty: quiet >= 3, activeDays: wk.filter((f) => f.active).length,
    daily: days.slice(-30), stageUps,
    wheel: { habits: avg((f) => f.habitsFrac), priorities: avg((f) => f.tasksFrac), mind: avg((f) => f.mindFrac), body: avg((f) => f.bodyFrac) } };
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export { dayKey, parseDay };
