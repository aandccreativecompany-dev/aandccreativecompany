// The Prakriyā mark: a little stick-man climbing the gold steps — the same
// picture as the app icon, and the same animation as the Android app's
// opening screen (drawn in a 1024 x 1024 space, scaled to fit).
import { motionOff } from './appearance.js';

const TOPS = [826, 700, 573, 447], LEFT = [192, 352, 512, 672], W = 160, BOTTOM = 952;
const COLORS = ['#B07D12', '#DEA51A', '#F2BA3E', '#FDE9A9'];
const SKIN = '#FFF6E3';
const THIGH = 96, SHIN = 96, TORSO = 118, HEAD = 36, STROKE = 30;
const cx = (i) => LEFT[i] + W / 2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x) => 1 - (1 - x) ** 3;
const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function leg(hip, foot) {
  let dx = foot[0] - hip[0], dy = foot[1] - hip[1];
  const reach = (THIGH + SHIN) * 0.985, d0 = Math.hypot(dx, dy);
  if (d0 > reach) { dx = (dx / d0) * reach; dy = (dy / d0) * reach; }
  const L = Math.max(1, Math.hypot(dx, dy));
  const a = (THIGH * THIGH - SHIN * SHIN + L * L) / (2 * L), h = Math.sqrt(Math.max(0, THIGH * THIGH - a * a));
  const ux = dx / L, uy = dy / L, px = -uy, py = ux;
  const k1 = [hip[0] + ux * a + px * h, hip[1] + uy * a + py * h], k2 = [hip[0] + ux * a - px * h, hip[1] + uy * a - py * h];
  return [hip, k2[0] > k1[0] ? k2 : k1, [hip[0] + dx, hip[1] + dy]];
}

function star(c, x, y, r, op, grow) {
  if (grow <= 0) return;
  const k = r * grow;
  c.beginPath(); c.moveTo(x, y - k); c.quadraticCurveTo(x, y, x + k, y); c.quadraticCurveTo(x, y, x, y + k); c.quadraticCurveTo(x, y, x - k, y); c.quadraticCurveTo(x, y, x, y - k); c.closePath();
  c.fillStyle = `rgba(255,233,168,${clamp01(op)})`; c.fill();
}

export function drawClimber(c, size, t, withGlow = true) {
  const seg = (a, b) => clamp01((t - a) / (b - a));
  c.save(); c.scale(size / 1024, size / 1024);
  if (withGlow) {
    const g = c.createRadialGradient(760, 330, 0, 760, 330, 360);
    g.addColorStop(0, `rgba(255,214,107,${0.38 * seg(0.1, 0.85)})`); g.addColorStop(1, 'rgba(255,214,107,0)');
    c.fillStyle = g; c.beginPath(); c.arc(760, 330, 360, 0, Math.PI * 2); c.fill();
  }
  const tw = t * Math.PI * 4;
  star(c, 330, 250, 34, 0.55 + 0.35 * Math.sin(tw), seg(0.35, 0.6));
  star(c, 180, 520, 22, 0.45 + 0.3 * Math.sin(tw + 1.6), seg(0.4, 0.65));
  star(c, 520, 170, 26, 0.5 + 0.3 * Math.sin(tw + 3.1), seg(0.45, 0.7));
  star(c, 900, 150, 22, 0.45 + 0.3 * Math.sin(tw + 4.5), seg(0.5, 0.75));
  for (let i = 0; i < 4; i++) {
    const p = easeOutCubic(seg(0.02 + i * 0.06, 0.22 + i * 0.06)), h = (BOTTOM - TOPS[i]) * p;
    if (h <= 0) continue;
    c.fillStyle = COLORS[i]; c.fillRect(LEFT[i], BOTTOM - h, W, h);
  }
  const appear = seg(0.2, 0.3);
  if (appear > 0) man(c, t, appear, seg);
  c.restore();
}

function man(c, t, appear, seg) {
  const standY = THIGH + SHIN - 14, t0 = 0.34, per = 0.15;
  let k = 0, p = 0;
  if (t >= t0) { k = Math.max(0, Math.min(3, Math.floor((t - t0) / per))); p = k >= 3 ? 1 : clamp01((t - t0 - k * per) / per); if (k >= 3) k = 2; }
  const from = k, to = k + 1, e = easeInOutCubic(p);
  const hipA = [cx(from), TOPS[from] - standY], hipB = [cx(to), TOPS[to] - standY];
  let hip = lerpP(hipA, hipB, e); hip = [hip[0], hip[1] + 10 * Math.sin(p * Math.PI * 2)];
  const foot = (a, b, lo, hi) => { const q = clamp01((p - lo) / (hi - lo)), pos = lerpP(a, b, easeInOut(q)); return [pos[0], pos[1] - Math.sin(q * Math.PI) * 46]; };
  const lead = foot([cx(from) + 22, TOPS[from]], [cx(to) - 18, TOPS[to]], 0, 0.6);
  const trail = foot([cx(from) - 26, TOPS[from]], [cx(to) + 24, TOPS[to]], 0.4, 1);
  const top = t >= t0 + 3 * per, cheer = easeOutBack(seg(t0 + 3 * per, t0 + 3 * per + 0.12));
  const lean = top ? 0 : 0.16;
  const neck = [hip[0] + Math.sin(lean) * TORSO, hip[1] - Math.cos(lean) * TORSO];
  const head = [neck[0] + Math.sin(lean) * 40, neck[1] - Math.cos(lean) * 40];
  const legs = [leg(hip, lead), leg(hip, trail)];
  const sh = [neck[0], neck[1] + 14], swing = Math.sin(p * Math.PI * 2) * 0.8;
  const angle = (side) => { const walking = (side === 0 ? swing : -swing) + 0.35; return top ? lerp(walking, side === 0 ? 2.6 : 3.7, cheer) : walking; };
  const hand = (side) => { const a = angle(side); return [sh[0] + Math.sin(a) * 92, sh[1] + Math.cos(a) * 92]; };
  c.globalAlpha = appear; c.strokeStyle = SKIN; c.fillStyle = SKIN; c.lineWidth = STROKE; c.lineCap = 'round'; c.lineJoin = 'round';
  const seg2 = (a, b) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  const poly = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((q) => c.lineTo(q[0], q[1])); c.stroke(); };
  seg2(sh, hand(1)); poly(legs[1]); seg2(hip, neck); poly(legs[0]); seg2(sh, hand(0));
  c.beginPath(); c.arc(head[0], head[1], HEAD, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1;
}

export const DURATION = 2600;

// A small canvas with the mark. animate:true plays the climb once, then rests.
export function mark(size = 96, { animate = false } = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cv = document.createElement('canvas');
  cv.width = cv.height = Math.round(size * dpr); cv.style.width = cv.style.height = `${size}px`; cv.className = 'climber'; cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d');
  const paint = (t) => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size); drawClimber(ctx, size, t, false); };
  paint(1);
  if (animate && !motionOff()) {
    const start = performance.now() + 150;
    const step = (now) => { if (!cv.isConnected && now - start > 600) return; const t = clamp01((now - start) / DURATION); paint(Math.max(0, t)); if (t < 1) requestAnimationFrame(step); };
    paint(0); requestAnimationFrame(step);
  }
  return cv;
}

// The opening screen, shown once per browser session. Tap / any key skips it.
export function splash({ name = 'Prakriyā', tagline = 'one small step at a time' } = {}) {
  return new Promise((resolve) => {
    if (motionOff()) return resolve();
    try { if (sessionStorage.getItem('prakriya_splash')) return resolve(); sessionStorage.setItem('prakriya_splash', '1'); } catch {}
    const size = Math.min(300, Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.6));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = cv.height = Math.round(size * dpr); cv.style.width = cv.style.height = `${size}px`;
    const ctx = cv.getContext('2d');
    const title = document.createElement('div'); title.className = 'splash-title'; title.textContent = name;
    const sub = document.createElement('div'); sub.className = 'splash-sub'; sub.textContent = tagline;
    const wrap = document.createElement('div'); wrap.className = 'splash'; wrap.setAttribute('role', 'presentation');
    const col = document.createElement('div'); col.className = 'splash-col'; col.append(cv, title, sub); wrap.append(col);
    document.body.append(wrap);
    const start = performance.now() + 120;
    let done = false, skipAt = null;
    const finish = () => { if (done) return; done = true; wrap.classList.add('out'); setTimeout(() => { wrap.remove(); resolve(); }, 380); };
    const skip = () => { if (skipAt == null) skipAt = performance.now(); };
    wrap.addEventListener('pointerdown', skip); addEventListener('keydown', skip, { once: true });
    const frame = (now) => {
      if (done) return;
      let t = clamp01((now - start) / DURATION);
      if (skipAt != null) { const k = clamp01((now - skipAt) / 180); t = t + (1 - t) * k; if (k >= 1) return finish(); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size); drawClimber(ctx, size, Math.max(0, t), true);
      const ti = easeOutCubic(clamp01((t - 0.55) / 0.25)); title.style.opacity = ti; title.style.transform = `translateY(${10 * (1 - ti)}px)`; sub.style.opacity = ti;
      if (t >= 1 && skipAt == null) return setTimeout(finish, 250);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    setTimeout(finish, DURATION + 1500); // never trap anyone behind the intro
  });
}
