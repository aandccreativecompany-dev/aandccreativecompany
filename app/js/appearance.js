// Themes: accent colours, reading fonts, text size, presets and a few extras.
// The accent / font / size choices live in the synced state (same keys as the
// Android app: themeAccentId, fontFamilyId, fontScaleId, themeMode) so picking
// a look on one device carries to the other. Purely cosmetic extras (page
// background, reduced motion) are per-device and kept in localStorage.

export const ACCENTS = [
  // `classic` keeps the web app's original violet-and-gold look for "Gold".
  { id: 'gold', label: 'Gold', light: '#5B3FC4', dark: '#9B7BF0', hi: '#F2B93B', hiDeep: '#A87510', hiDeepDark: '#E6B450', classic: true },
  { id: 'rose', label: 'Rose', light: '#D9536F', dark: '#F08BA0', deep: '#B23A54' },
  { id: 'amethyst', label: 'Amethyst', light: '#9B5DE5', dark: '#C79BF0', deep: '#6E31B0' },
  { id: 'emerald', label: 'Emerald', light: '#23A870', dark: '#6FDCA8', deep: '#17754D' },
  { id: 'sky', label: 'Sky', light: '#2E9BE6', dark: '#7FC8F8', deep: '#1B6FA8' },
  { id: 'coral', label: 'Coral', light: '#F06A3F', dark: '#FF9770', deep: '#B8481F' },
  { id: 'teal', label: 'Teal', light: '#1FA396', dark: '#6FE0D0', deep: '#0D6D63' },
  { id: 'indigo', label: 'Indigo', light: '#5A64E0', dark: '#9FA8FF', deep: '#3A3FA0' },
  { id: 'sunset', label: 'Sunset', light: '#E8822E', dark: '#FFB36F', deep: '#A85A14' },
];

// family = CSS name, gf = Google Fonts query, serif = needs a serif fallback
export const FONTS = [
  { id: 'inter', label: 'Inter', family: 'Inter', gf: 'Inter:wght@400;500;600;700' },
  { id: 'poppins', label: 'Poppins', family: 'Poppins', gf: 'Poppins:wght@400;500;600;700' },
  { id: 'nunito', label: 'Nunito', family: 'Nunito', gf: 'Nunito:wght@400;500;600;700' },
  { id: 'quicksand', label: 'Quicksand', family: 'Quicksand', gf: 'Quicksand:wght@400;500;600;700' },
  { id: 'workSans', label: 'Work Sans', family: 'Work Sans', gf: 'Work+Sans:wght@400;500;600;700' },
  { id: 'montserrat', label: 'Montserrat', family: 'Montserrat', gf: 'Montserrat:wght@400;500;600;700' },
  { id: 'lora', label: 'Lora', family: 'Lora', gf: 'Lora:wght@400;500;600;700', serif: true },
  { id: 'merriweather', label: 'Merriweather', family: 'Merriweather', gf: 'Merriweather:wght@400;700', serif: true },
  { id: 'dmSans', label: 'DM Sans', family: 'DM Sans', gf: 'DM+Sans:wght@400;500;600;700' },
  { id: 'spaceGrotesk', label: 'Space Grotesk', family: 'Space Grotesk', gf: 'Space+Grotesk:wght@400;500;600;700' },
  { id: 'sourceSans', label: 'Source Sans 3', family: 'Source Sans 3', gf: 'Source+Sans+3:wght@400;500;600;700' },
  { id: 'fraunces', label: 'Fraunces', family: 'Fraunces', gf: 'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600', serif: true },
];

export const SCALES = [
  { id: 'small', label: 'Small', factor: 0.92 },
  { id: 'default', label: 'Default', factor: 1 },
  { id: 'large', label: 'Large', factor: 1.12 },
];

export const PRESETS = [
  { id: 'classic', label: 'Classic Gold', blurb: 'The original Prakriyā look.', accent: 'gold', font: 'inter', scale: 'default' },
  { id: 'midnight', label: 'Midnight Amethyst', blurb: 'Cool, calm, a little mystical.', accent: 'amethyst', font: 'poppins', scale: 'default' },
  { id: 'blush', label: 'Morning Blush', blurb: 'Soft and warm, rounded reading font.', accent: 'rose', font: 'quicksand', scale: 'default' },
  { id: 'forest', label: 'Forest Calm', blurb: 'Grounded green, friendly and legible.', accent: 'emerald', font: 'nunito', scale: 'default' },
  { id: 'ocean', label: 'Ocean Breeze', blurb: 'Clean and modern, slightly larger text.', accent: 'sky', font: 'workSans', scale: 'large' },
  { id: 'sunset', label: 'Sunset Coral', blurb: 'Warm coral with a classic serif for reading.', accent: 'coral', font: 'lora', scale: 'default' },
];

export const BACKGROUNDS = [
  { id: 'soft', label: 'Soft', blurb: 'Warm white' },
  { id: 'paper', label: 'Paper', blurb: 'Cream, easy on the eyes' },
  { id: 'mist', label: 'Mist', blurb: 'Cool grey-blue' },
];

const LS_UI = 'prakriya_web_ui_v1';
export function getUi() {
  try { const v = JSON.parse(localStorage.getItem(LS_UI) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function setUi(patch) {
  const next = { ...getUi(), ...patch };
  try { localStorage.setItem(LS_UI, JSON.stringify(next)); } catch {}
  applyUi();
  return next;
}

const find = (list, id, fallback = list[0]) => list.find((x) => x.id === id) || fallback;
export const accentOf = (s) => find(ACCENTS, s && s.themeAccentId);
export const fontOf = (s) => find(FONTS, s && s.fontFamilyId);
export const scaleOf = (s) => find(SCALES, s && s.fontScaleId, SCALES[1]);

const loaded = new Set(['Inter', 'Fraunces']); // already linked in index.html
export function loadFont(f) {
  if (loaded.has(f.family)) return;
  loaded.add(f.family);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`;
  document.head.append(l);
}

function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}
// Black or white text, whichever reads better on the accent.
function inkFor(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const lin = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return L > 0.36 ? '#1B1230' : '#FFFFFF';
}

export function applyThemeMode(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode); else root.removeAttribute('data-theme');
}

// Paint the synced choices onto the page.
export function apply(s) {
  const root = document.documentElement;
  applyThemeMode(s && s.themeMode);
  const a = accentOf(s), f = fontOf(s), sc = scaleOf(s), dark = isDark();
  const accent = dark ? a.dark : a.light;
  const hi = a.classic ? a.hi : accent;
  const hiDeep = a.classic ? (dark ? a.hiDeepDark : a.hiDeep) : (dark ? a.dark : a.deep);
  root.classList.toggle('is-dark', dark);
  const st = root.style;
  st.setProperty('--accent', accent);
  st.setProperty('--accent-ink', inkFor(accent));
  st.setProperty('--gold', hi);
  st.setProperty('--gold-deep', hiDeep);
  st.setProperty('--ring-a', hi);
  st.setProperty('--ring-b', a.classic ? (dark ? '#9B7BF0' : '#7B55E0') : (dark ? a.light : a.deep));
  // The mantra card: classic violet for Gold, otherwise a deep shade of the accent.
  if (a.classic) { st.setProperty('--mantra-a', '#2B1A57'); st.setProperty('--mantra-b', '#4A2FA3'); }
  else { st.setProperty('--mantra-a', `color-mix(in srgb, ${a.light} 28%, #150C28)`); st.setProperty('--mantra-b', `color-mix(in srgb, ${a.light} 78%, #150C28)`); }
  st.setProperty('--theme-color', accent);
  loadFont(f);
  st.setProperty('--sans', `"${f.family}", ${f.serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'}`);
  st.setProperty('--fs', String(sc.factor));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1B0F33' : '#FBF8F3');
  applyUi();
}

// Per-device extras.
export function applyUi() {
  const root = document.documentElement, ui = getUi();
  const bg = BACKGROUNDS.some((b) => b.id === ui.bg) ? ui.bg : 'soft';
  if (bg === 'soft') root.removeAttribute('data-bg'); else root.setAttribute('data-bg', bg);
  if (ui.calm) root.setAttribute('data-calm', ''); else root.removeAttribute('data-calm');
}
export const motionOff = () => {
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch {}
  return 'calm' in document.documentElement.dataset;
};

// Re-apply when the device's light/dark setting changes while on "Match my device".
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { window.dispatchEvent(new Event('prakriya:reapply')); }); } catch {}
