// The tree and the bird: canvas drawings ported 1:1 from the Android app
// (growth_plant.dart) so a given stage looks the same on both. A tiny shared
// animation loop drives every companion on screen and stops when none is
// visible, when the tab is hidden, or when motion is turned off.
import { motionOff } from './appearance.js';

export const TREE_STAGES = [
  ['Seed', 'Resting in the soil, waiting for your first win.', 0],
  ['Sprout', 'A first green shoot — you showed up.', 40],
  ['Seedling', 'Two leaves open to the light.', 150],
  ['Sapling', 'A strong little stem, still growing fast.', 400],
  ['Young tree', 'Branching out in every direction.', 800],
  ['In bloom', 'Flowers open — your effort is showing.', 1400],
  ['Fruiting tree', 'Rooted, full and generous. Keep tending it.', 2400],
];
export const BIRD_STAGES = [
  ['Egg', 'Warm and waiting for your first win.', 0],
  ['Hatchling', 'A tiny beak pokes out — you showed up.', 40],
  ['Chick', 'Fluffy and curious, learning to chirp.', 150],
  ['Fledgling', 'Feathers coming in, wings testing the air.', 400],
  ['Young bird', 'Bright and bold — hopping branch to branch.', 800],
  ['Songbird', 'Singing every morning because of your effort.', 1400],
  ['Soaring bird', 'Wings wide, riding the wind you created.', 2400],
];
export const stagesFor = (kind) => (kind === 'bird' ? BIRD_STAGES : TREE_STAGES);

// ---- tiny drawing helpers ---------------------------------------------------
const hexToRgb = (h) => { if (h[0] !== '#') return h.match(/\d+/g).slice(0, 3).map(Number); const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
const oval = (c, x, y, w, h, fill) => { c.beginPath(); c.ellipse(x, y, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); };
const circ = (c, x, y, r, fill) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); };
const line = (c, x1, y1, x2, y2, color, width, cap = 'round') => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.lineCap = cap; c.stroke(); };
const glow = (c, w, h, cy, dark) => {
  const g = c.createRadialGradient(w / 2, h * cy, 0, w / 2, h * cy, w * 0.5);
  g.addColorStop(0, dark ? 'rgba(242,185,59,.10)' : 'rgba(255,233,168,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(w / 2, h * cy, w * 0.5, 0, Math.PI * 2); c.fill();
};

// ---- the tree ---------------------------------------------------------------
export function drawTree(c, w, h, stage, thirsty, t, dark) {
  const leaf = thirsty ? '#9AA77A' : '#4CAF6A', leafDark = thirsty ? '#7F8C62' : '#2E8B57', wood = '#8B5E3C';
  const sway = Math.sin(t * 2 * Math.PI) * 0.035 * (thirsty ? 0.4 : 1), droop = thirsty ? 0.16 : 0;
  const s = Math.max(0, Math.min(6, stage));
  glow(c, w, h, 0.6, dark);
  oval(c, w / 2, h * 0.9, w * 0.62, h * 0.14, '#6B4423');
  const gx = w / 2, gy = h * 0.86;
  oval(c, gx, gy, w * 0.5, h * 0.09, '#8A5A33');

  const leaf2 = (x, y, len, ang) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.38, len, 0); c.quadraticCurveTo(len * 0.5, len * 0.38, 0, 0); c.closePath();
    c.fillStyle = leaf; c.fill();
    line(c, 0, 0, len * 0.9, 0, leafDark, 1.2, 'butt');
    c.restore();
  };
  const pair = (x, y, len, lift) => { leaf2(x, y, len, -Math.PI * lift + droop); leaf2(x, y, len, -Math.PI * (1 - lift) - droop); };
  const stem = (len, width) => line(c, gx, gy, gx, gy - len, leafDark, width);

  c.save();
  c.translate(gx, gy); c.rotate(sway + droop * 0.3); c.translate(-gx, -gy);
  if (s === 0) {
    c.save(); c.translate(gx, gy - w * 0.01); c.rotate(-0.4); oval(c, 0, 0, w * 0.12, w * 0.075, '#5A3A1E'); c.restore();
  } else if (s === 1) {
    stem(h * 0.16, w * 0.018); pair(gx, gy - h * 0.16, w * 0.11, 0.4);
  } else if (s === 2) {
    stem(h * 0.28, w * 0.022); pair(gx, gy - h * 0.14, w * 0.12, 0.5); pair(gx, gy - h * 0.27, w * 0.13, 0.45);
  } else if (s === 3) {
    stem(h * 0.42, w * 0.03);
    pair(gx, gy - h * 0.12, w * 0.13, 0.55); pair(gx, gy - h * 0.23, w * 0.14, 0.5); pair(gx, gy - h * 0.34, w * 0.14, 0.45);
    leaf2(gx, gy - h * 0.42, w * 0.1, -Math.PI / 2);
  } else {
    const trunkH = h * (0.34 + 0.02 * (s - 4)), trunkW = w * (0.05 + 0.008 * (s - 4));
    const topX = gx, topY = gy - trunkH;
    line(c, gx, gy, topX, topY, wood, trunkW);
    line(c, gx, gy - trunkH * 0.55, gx - w * 0.12, gy - trunkH * 0.85, wood, trunkW * 0.55);
    line(c, gx, gy - trunkH * 0.45, gx + w * 0.13, gy - trunkH * 0.78, wood, trunkW * 0.55);
    const r = w * (0.17 + 0.02 * (s - 4)), cy = topY - r * 0.35 + droop * h * 0.15;
    const centers = [[topX, cy - r * 0.55], [topX - r * 0.95, cy + r * 0.1], [topX + r * 0.95, cy + r * 0.1], [topX - r * 0.45, cy + r * 0.2], [topX + r * 0.45, cy + r * 0.2]];
    centers.forEach(([x, y]) => circ(c, x, y, r * 0.82, leafDark));
    centers.forEach(([x, y]) => circ(c, x - r * 0.08, y - r * 0.1, r * 0.62, leaf));
    if (s === 5) {
      [[-0.2, -0.9], [0.7, -0.2], [-1.1, 0.05], [0.1, 0.25], [1.2, 0.35], [-0.6, 0.5]].forEach(([dx, dy]) => {
        const px = topX + r * dx, py = cy + r * dy;
        for (let i = 0; i < 5; i++) { const a = (i * 2 * Math.PI) / 5; circ(c, px + Math.cos(a) * r * 0.1, py + Math.sin(a) * r * 0.1, r * 0.075, '#F59AB4'); }
        circ(c, px, py, r * 0.06, '#FFE17A');
      });
    }
    if (s >= 6) {
      [[-0.3, -0.7], [0.8, -0.05], [-1.1, 0.2], [0.2, 0.4], [1.15, 0.45], [-0.6, 0.55], [0.35, -0.45]].forEach(([dx, dy]) => {
        const px = topX + r * dx, py = cy + r * dy;
        circ(c, px, py, r * 0.12, '#E5573F'); circ(c, px - r * 0.04, py - r * 0.04, r * 0.035, 'rgba(255,255,255,.6)');
      });
    }
  }
  c.restore();
}

// ---- the bird ---------------------------------------------------------------
export function drawBird(c, w, h, stage, sleepy, t, dark) {
  const s = Math.max(0, Math.min(6, stage));
  const tone = (col) => (sleepy ? mix(col, '#9A9AA8', 0.45) : col);
  const bob = Math.sin(t * 2 * Math.PI) * h * (sleepy ? 0.004 : 0.012);
  glow(c, w, h, 0.58, dark);

  if (s <= 3) { // nest
    oval(c, w / 2, h * 0.86, w * 0.62, h * 0.17, '#6B4423');
    for (let i = 0; i < 7; i++) {
      const x = w * (0.26 + i * 0.08), a0 = 0.2 + i * 0.25;
      c.beginPath(); c.ellipse(x, h * 0.855, w * 0.1, h * 0.035, 0, a0, a0 + 2.2); c.strokeStyle = '#C9A36B'; c.lineWidth = w * 0.012; c.lineCap = 'round'; c.stroke();
    }
  } else { // branch
    line(c, w * 0.14, h * 0.84, w * 0.86, h * 0.82, '#8B5E3C', w * 0.035);
    oval(c, w * 0.2, h * 0.79, w * 0.1, h * 0.045, tone('#4CAF6A')); oval(c, w * 0.8, h * 0.78, w * 0.1, h * 0.045, tone('#4CAF6A'));
  }

  const beak = (x, y, len, open) => {
    c.fillStyle = tone('#F59E2F');
    c.beginPath(); c.moveTo(x, y - len * 0.35); c.lineTo(x + len, y - (open ? len * 0.2 : 0)); c.lineTo(x, y + (open ? 0 : len * 0.3)); c.closePath(); c.fill();
    if (open) { c.beginPath(); c.moveTo(x, y + len * 0.05); c.lineTo(x + len * 0.85, y + len * 0.45); c.lineTo(x, y + len * 0.4); c.closePath(); c.fill(); }
  };
  const eye = (x, y, r) => {
    if (sleepy) { c.beginPath(); c.arc(x, y, r * 1.4, 0.2, 2.9); c.strokeStyle = '#2B2140'; c.lineWidth = r * 0.7; c.lineCap = 'round'; c.stroke(); return; }
    circ(c, x, y, r, '#2B2140'); circ(c, x + r * 0.3, y - r * 0.3, r * 0.35, '#fff');
  };

  const perchY = h * 0.8;
  if (s === 0) {
    const cx = w / 2, cy = perchY - h * 0.07 + bob, rx = w * 0.095, ry = h * 0.12;
    oval(c, cx, cy, rx * 2, ry * 2, tone('#F6EBD3'));
    const sp = tone('#D9B98C'); circ(c, cx - rx * 0.35, cy - ry * 0.2, rx * 0.16, sp); circ(c, cx + rx * 0.3, cy + ry * 0.25, rx * 0.2, sp); circ(c, cx + rx * 0.05, cy - ry * 0.55, rx * 0.12, sp);
  } else if (s === 1) {
    const cx = w / 2, cy = perchY - h * 0.05 + bob, hx = cx, hy = cy - h * 0.07;
    circ(c, hx, hy, w * 0.085, tone('#F7D154')); beak(hx + w * 0.075, hy + w * 0.01, w * 0.04, false); eye(hx + w * 0.025, hy - w * 0.015, w * 0.016);
    c.beginPath(); c.moveTo(cx - w * 0.1, cy); c.lineTo(cx - w * 0.06, cy - h * 0.03); c.lineTo(cx - w * 0.02, cy); c.lineTo(cx + w * 0.02, cy - h * 0.03); c.lineTo(cx + w * 0.06, cy); c.lineTo(cx + w * 0.1, cy - h * 0.03);
    c.bezierCurveTo(cx + w * 0.1, cy + h * 0.12, cx - w * 0.1, cy + h * 0.12, cx - w * 0.1, cy); c.closePath(); c.fillStyle = tone('#F6EBD3'); c.fill();
  } else {
    const k = w * (0.26 + 0.026 * (s - 2));
    const body = tone(['#F7D154', '#F2A65A', '#5B9BD5', '#4F7FD6', '#7A55D9'][s - 2]);
    const belly = tone(['#FFF0A8', '#FFE3B8', '#F4F1E8', '#F2784B', '#F2B93B'][s - 2]);
    const dkBody = mix(body, '#000000', 0.22);
    const cx = w / 2 - k * 0.05, cy = perchY - k * 0.5 + bob;
    const legC = tone('#E08A2E');
    line(c, cx - k * 0.1, cy + k * 0.38, cx - k * 0.1, cy + k * 0.52, legC, k * 0.06); line(c, cx + k * 0.12, cy + k * 0.38, cx + k * 0.12, cy + k * 0.52, legC, k * 0.06);
    const path = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) c.quadraticCurveTo(p[0], p[1], p[2], p[3]); else c.lineTo(p[0], p[1]); } c.closePath(); };
    if (s >= 6) {
      path([[cx - k * 0.1, cy - k * 0.1], [cx - k * 0.9, cy - k * 1.15, cx - k * 0.3, cy - k * 1.0], [cx - k * 0.5, cy - k * 0.55, cx + k * 0.05, cy - k * 0.3]]); c.fillStyle = dkBody; c.fill();
      path([[cx + k * 0.1, cy - k * 0.15], [cx + k * 0.5, cy - k * 1.25, cx + k * 0.9, cy - k * 0.95], [cx + k * 0.65, cy - k * 0.55, cx + k * 0.2, cy - k * 0.25]]); c.globalAlpha = 0.85; c.fillStyle = body; c.fill(); c.globalAlpha = 1;
    }
    if (s >= 3) {
      const d = 0.06 * (s - 3);
      path([[cx - k * 0.4, cy], [cx - k * (0.8 + d), cy - k * 0.18], [cx - k * (0.78 + d), cy + k * 0.2]]); c.fillStyle = dkBody; c.fill();
    }
    oval(c, cx, cy, k, k * 0.86, body); oval(c, cx + k * 0.1, cy + k * 0.12, k * 0.62, k * 0.5, belly);
    const hx = cx + k * 0.32, hy = cy - k * 0.42;
    if (s >= 3) {
      const col = s >= 6 ? tone('#F2B93B') : dkBody, n = s >= 6 ? 3 : 2;
      for (let i = 0; i < n; i++) line(c, hx - k * 0.05 + i * k * 0.07, hy - k * 0.28, hx - k * 0.16 + i * k * 0.1, hy - k * (0.5 + 0.05 * i), col, k * 0.07);
    }
    circ(c, hx, hy, k * 0.34, body);
    beak(hx + k * 0.3, hy + k * 0.02, k * 0.22, s === 5 && !sleepy);
    eye(hx + k * 0.1, hy - k * 0.06, k * 0.06);
    if (s >= 2) circ(c, hx + k * 0.14, hy + k * 0.1, k * 0.05, 'rgba(240,139,160,.55)');
    path([[cx - k * 0.18, cy - k * 0.12], [cx - k * 0.02, cy - k * 0.3, cx + k * 0.22, cy - k * 0.04], [cx + k * 0.05, cy + k * 0.32, cx - k * 0.3, cy + k * 0.18]]); c.fillStyle = dkBody; c.fill();
    c.font = `700 ${w * 0.09}px system-ui, sans-serif`;
    if (s === 5 && !sleepy) { c.fillStyle = '#F2B93B'; c.fillText('♪ ♫', w * 0.68, h * 0.17 + w * 0.08 - bob * 3); }
    if (s >= 6 && !sleepy) [[0.2, 0.22], [0.8, 0.3], [0.72, 0.12], [0.3, 0.1]].forEach(([x, y]) => circ(c, w * x, h * y + bob, w * 0.012, '#FFE17A'));
  }
  if (sleepy && s >= 1) { c.font = `700 ${w * 0.09}px system-ui, sans-serif`; c.fillStyle = dark ? 'rgba(255,255,255,.7)' : '#6B6B80'; c.fillText('z z', w * 0.66, h * 0.18 + w * 0.08 - bob * 2); }
}

// ---- shared animation loop --------------------------------------------------
const live = new Set();
let raf = 0, last = 0;
function tick(now) {
  raf = 0;
  for (const inst of live) {
    if (!inst.canvas.isConnected) { live.delete(inst); continue; }
    if (inst.visible) inst.draw(now);
  }
  if (live.size && !document.hidden && !motionOff()) raf = requestAnimationFrame(tick);
}
function kick() { if (!raf && live.size && !document.hidden && !motionOff()) raf = requestAnimationFrame(tick); }
document.addEventListener('visibilitychange', kick);

const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { const i = e.target.__inst; if (i) { i.visible = e.isIntersecting; if (i.visible) { i.draw(performance.now()); kick(); } } })) : null;

function layer(host, size, kind, state) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.round(size * dpr);
  canvas.style.width = canvas.style.height = `${size}px`;
  canvas.className = 'cmp-layer';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const inst = {
    canvas, visible: true, kind, state,
    draw(now) {
      const dark = document.documentElement.classList.contains('is-dark');
      const period = kind === 'bird' ? 4000 : 5000;
      const tt = motionOff() ? 0.25 : ((now % period) / period);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
      (kind === 'bird' ? drawBird : drawTree)(ctx, size, size, state.stage, state.quiet, tt, dark);
    },
  };
  canvas.__inst = inst;
  host.append(canvas);
  live.add(inst);
  if (io) io.observe(canvas);
  inst.draw(performance.now());
  kick();
  return inst;
}

// A companion that can switch between tree and bird without the page changing:
// the new picture fades and scales in while the old one fades out.
export function companion({ kind = 'tree', stage = 0, quiet = false, size = 200 }) {
  const host = document.createElement('div');
  host.className = 'cmp'; host.style.width = host.style.height = `${size}px`;
  host.setAttribute('role', 'img');
  const state = { stage, quiet };
  let cur = layer(host, size, kind, state);
  const label = () => { const st = stagesFor(cur.kind)[Math.max(0, Math.min(6, state.stage))]; host.setAttribute('aria-label', `${cur.kind === 'bird' ? 'Bird' : 'Tree'} companion: ${st[0]}${state.quiet ? ', needs a little attention' : ''}`); };
  label();
  return {
    el: host,
    set(nextKind, nextStage, nextQuiet) {
      state.stage = nextStage; state.quiet = nextQuiet;
      if (nextKind !== cur.kind) {
        const old = cur;
        old.canvas.classList.add('out');
        cur = layer(host, size, nextKind, state);
        cur.canvas.classList.add('in');
        requestAnimationFrame(() => requestAnimationFrame(() => cur.canvas.classList.remove('in')));
        setTimeout(() => { live.delete(old); old.canvas.remove(); }, 420);
      } else cur.draw(performance.now());
      label();
    },
  };
}
