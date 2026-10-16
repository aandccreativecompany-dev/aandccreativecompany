// ============================================
// A&C Creative Ventures — shared site behavior
// ============================================

// ---------- Theme toggle (dark/light) ----------
// The actual theme is applied as early as possible by a small blocking
// inline script in each page's <head> (before first paint, to avoid a
// flash of the wrong theme). This just wires up the button and keeps
// localStorage in sync once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    if (next === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', 'light');
    }
    try { localStorage.setItem('ac-theme', next); } catch (e) { /* storage unavailable */ }
  });
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
  }
});

// ---------- Daily Affirmation Engine ----------
// Deterministic "affirmation of the day": same affirmation all day for every
// visitor, changes at midnight. Replace/expand this list any time — no code
// knowledge needed beyond editing this array.
const AFFIRMATIONS = [
  "I am building momentum one small action at a time.",
  "My focus goes where my energy flows — today I choose growth.",
  "I trust the timing of my life while still showing up daily.",
  "Discipline today is freedom tomorrow.",
  "I am becoming the version of myself I used to admire.",
  "Small, consistent steps are still progress.",
  "I release what I can't control and act on what I can.",
  "My mindset shapes my momentum.",
  "I am allowed to grow at my own pace.",
  "Today's effort is tomorrow's evidence.",
  "I attract clarity when I take action instead of waiting for certainty.",
  "Rest is part of the process, not a departure from it.",
  "I am the architect of my next chapter.",
  "Progress doesn't require perfection.",
  "I choose intention over autopilot today.",
  "My potential compounds every time I follow through.",
  "I am worthy of the goals I'm working toward.",
  "Consistency is my superpower.",
  "I turn setbacks into setup for what's next.",
  "Today I practice believing before I see the proof.",
  "My habits are quietly building my future.",
  "I show up for myself first.",
  "Growth feels uncomfortable because it's real.",
  "I am exactly where I need to be to build what's next.",
  "I choose one aligned action over ten scattered ones.",
  "My energy is a resource — I spend it on purpose.",
  "I don't need permission to begin again today.",
  "What I repeat, I become.",
  "I am patient with progress and impatient with excuses.",
  "Today's small win is still a win."
];

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

function renderAffirmation() {
  const el = document.getElementById('affirmation-text');
  if (!el) return;
  const today = new Date();
  const index = dayOfYear(today) % AFFIRMATIONS.length;
  el.textContent = "\u201C" + AFFIRMATIONS[index] + "\u201D";

  const dateEl = document.getElementById('affirmation-date');
  if (dateEl) {
    dateEl.textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }
}

function shuffleAffirmation() {
  const el = document.getElementById('affirmation-text');
  if (!el) return;
  const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = "\u201C" + random + "\u201D";
    el.style.opacity = 1;
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAffirmation();
  const btn = document.getElementById('shuffle-affirmation');
  if (btn) btn.addEventListener('click', shuffleAffirmation);
});

// ---------- Social feed embeds (Instagram / Threads) ----------
// The two slots below (#ig-embed-slot, #threads-embed-slot) start empty.
// To feature a real post: open it on Instagram or Threads, use its "..."
// menu → Embed → Copy Embed Code, and paste the <blockquote> snippet
// straight into the matching slot's <div> in index.html. This function
// only loads the platform's own embed.js (no API key, no backend) when it
// notices a real embed was pasted in, and hides the "follow us" fallback
// once at least one real post is showing.
document.addEventListener('DOMContentLoaded', () => {
  const igSlot = document.getElementById('ig-embed-slot');
  const threadsSlot = document.getElementById('threads-embed-slot');
  const fallback = document.getElementById('social-feed-fallback');
  if (!igSlot && !threadsSlot) return;

  const hasContent = (el) => !!(el && el.children.length > 0);
  const igHasPosts = hasContent(igSlot);
  const threadsHasPosts = hasContent(threadsSlot);

  function loadScriptOnce(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }

  if (igHasPosts) loadScriptOnce('https://www.instagram.com/embed.js');
  if (threadsHasPosts) loadScriptOnce('https://www.threads.net/embed.js');
  if ((igHasPosts || threadsHasPosts) && fallback) fallback.style.display = 'none';
});

// ---------- Newsletter form ----------
// NOTE: This currently just shows a confirmation message locally.
// Once your Brevo account is set up, replace the form's `action` attribute
// (in each HTML file) with your real Brevo form endpoint — no JS changes needed.
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      if (form.dataset.liveEndpoint !== 'true') {
        e.preventDefault();
        const input = form.querySelector('input[type=email]');
        const note = form.parentElement.querySelector('.newsletter-note');
        if (note) {
          note.textContent = 'Signup form not yet connected — see Step 4 in your setup guide to link Brevo.';
          note.style.color = '#F2B93B';
        }
        if (input) input.value = '';
      }
    });
  });
});

// ---------- Masterclass registration form (Netlify Forms) ----------
// Real submission, unlike the newsletter form above — Netlify picks this
// form up at deploy time because of the data-netlify attribute + hidden
// form-name field in the HTML. Submitted here via fetch so the page doesn't
// navigate away; falls back to a normal (non-JS) form POST if fetch fails,
// since the form still works without JavaScript at all.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.register-form');
  if (!form) return;
  const successNote = document.getElementById('register-success');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const body = new URLSearchParams(data).toString();

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Submission failed: ' + res.status);
        form.reset();
        form.hidden = true;
        if (successNote) successNote.hidden = false;
      })
      .catch(() => {
        // Netlify Forms isn't set up on this deploy yet (or the request
        // failed) — fall back to a plain form submission so the browser's
        // own POST still reaches Netlify's form handler once it is live,
        // rather than silently losing the registration.
        form.submit();
      });
  });
});

// Interactive framework: pillar tabs plus live, animated diagrams.
(function () {
  const section = document.getElementById('framework');
  if (!section) return;
  const tabs = Array.from(section.querySelectorAll('.fw-tab'));
  const panels = Array.from(section.querySelectorAll('.fw-panel'));
  if (!tabs.length || tabs.length !== panels.length) return;
  section.classList.add('fw-js');

  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const NS = 'http://www.w3.org/2000/svg';
  const C = { ink: '#1B1233', coral: '#F26B5B', coralFill: '#FBE4E0', teal: '#2F7B7B', tealFill: '#DDEDEA', gold: '#F2B93B', cream: '#FBF8F3' };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- Lesson content: every box explains itself on hover, focus or tap ----
  const LESSONS = [
    {
      layout: 'fan', name: 'Outcome Engineering',
      wrongTitle: ['MOST PEOPLE'], rightTitle: ['OUTCOME', 'ENGINEERING'],
      wrong: [
        { l: ['ACTION'], t: 'Busy work: a task picked because it was in front of you, not because it leads somewhere.' },
        { l: ['ACTION'], t: 'Another task on the pile. Still no clear destination.' },
        { l: ['ACTION'], t: 'And another. It feels productive, but nothing connects them.' },
        { l: ['?'], t: 'Where is all this heading? Nobody can say, so you end up busy, not effective.' }
      ],
      right: [
        { l: ['OUTCOME'], t: 'A specific result, like "Leading a team of 3 within 12 months". A direction is not an outcome.' },
        { l: ['ACTION'], t: 'Chosen because it moves you toward the outcome.' },
        { l: ['ACTION'], t: 'Every action has a reason, and the reason is the outcome.' },
        { l: ['ACTION'], t: 'If an action does not serve the outcome, it does not make the list.' }
      ],
      wrongSay: 'busy...', rightSay: 'on target!'
    },
    {
      layout: 'stack', loop: true, name: 'Belief Refactoring',
      wrongTitle: ['MOST PEOPLE'], rightTitle: ['BELIEF', 'REFACTORING'],
      wrong: [
        { l: ['WAIT FOR', 'PROOF'], t: '"Seeing is believing." You hold back until evidence shows up.' },
        { l: ['NEVER', 'ACT'], t: 'With no action, no evidence is ever created.' },
        { l: ['NOTHING', 'TO SEE'], t: 'So there is still nothing to see, and the loop starts over.' }
      ],
      right: [
        { l: ['BELIEVE', 'FIRST'], t: '"Believing is seeing." Decide it is true before the proof arrives.' },
        { l: ['ACT LIKE', "IT'S TRUE"], t: 'Take the actions someone who believed it would take, starting today.' },
        { l: ['RESULTS', 'APPEAR'], t: 'The promotion becomes evidence of what you already decided.' }
      ],
      wrongSay: 'again...', rightSay: 'it shows up!'
    },
    {
      layout: 'stack', loop: true, name: 'Identity Deployment',
      wrongTitle: ['MOST PEOPLE'], rightTitle: ['IDENTITY', 'DEPLOYMENT'],
      wrong: [
        { l: ['WAIT TO', 'FEEL READY'], t: '"Feel ready, then act." Confidence is expected to arrive first.' },
        { l: ['NEVER', 'ACT'], t: 'Readiness never comes on its own, so nothing happens.' },
        { l: ['STAY THE', 'SAME'], t: 'Nothing changed, so you wait again.' }
      ],
      right: [
        { l: ['ACT LIKE', 'THEM NOW'], t: 'Be the version of you who has already made the change. Today, not eventually.' },
        { l: ['REPEAT', 'IT'], t: 'Speak up once, send the message once, then do it again. Identity is built from repetition.' },
        { l: ['BECOME', 'THEM'], t: 'The feeling is not the starting line. It is the byproduct.' }
      ],
      wrongSay: 'not yet...', rightSay: "that's you!"
    },
    {
      layout: 'stack', loop: true, name: 'Systems vs Goals',
      wrongTitle: ['MOST PEOPLE'], rightTitle: ['SYSTEM', 'DESIGN'],
      wrong: [
        { l: ['WANT THE', 'OUTCOME'], t: 'A goal on its own is just a wish with a date on it.' },
        { l: ['RELY ON', 'WILLPOWER'], t: 'Willpower is a battery. It drains fastest when life gets busy.' },
        { l: ['BURN', 'OUT'], t: 'When the battery dies, so does the effort, and you start over.' }
      ],
      right: [
        { l: ['BUILD THE', 'PROCESS'], t: 'Design the routine that produces the result, so it does not depend on mood.' },
        { l: ['SHOW UP', 'DAILY'], t: 'Small, steady reps beat occasional bursts.' },
        { l: ['RESULTS', 'AUTOMATED'], t: 'The routine runs, and the results follow without a daily fight.' }
      ],
      wrongSay: 'drained...', rightSay: 'on autopilot!'
    }
  ];

  function lines(parent, cx, cy, arr, size, fill) {
    const lh = size + 3;
    const t = el('text', { 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: fill, 'font-family': 'inherit' }, parent);
    arr.forEach((ln, i) => {
      const sp = el('tspan', { x: cx, y: cy - ((arr.length - 1) * lh) / 2 + i * lh + size * 0.35 }, t);
      sp.textContent = ln;
    });
    return t;
  }

  function build(fig, L) {
    const uid = 'fw' + Math.random().toString(36).slice(2, 7);
    const live = document.createElement('div');
    live.className = 'fw-live';
    const svg = el('svg', { viewBox: '0 0 640 600', class: 'fw-svg', role: 'group', 'aria-label': L.name + ': most people versus ' + L.name + '. Touch any box to see what it means.' });
    const defs = el('defs', {}, svg);
    [['c', C.coral], ['t', C.teal]].forEach((m) => {
      const mk = el('marker', { id: uid + m[0], viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M1 1 L9 5 L1 9', fill: 'none', stroke: m[1], 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mk);
    });
    const flt = el('filter', { id: uid + 'w', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.025', numOctaves: 2, seed: 4, result: 'n' }, flt);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3 }, flt);

    el('rect', { x: 0, y: 0, width: 640, height: 600, fill: C.cream }, svg);
    el('rect', { x: 10, y: 10, width: 300, height: 580, rx: 26, fill: C.coralFill, stroke: C.coral, 'stroke-width': 3, filter: 'url(#' + uid + 'w)' }, svg);
    el('rect', { x: 330, y: 10, width: 300, height: 580, rx: 26, fill: C.tealFill, stroke: C.teal, 'stroke-width': 3, filter: 'url(#' + uid + 'w)' }, svg);
    lines(svg, 160, 52, L.wrongTitle, 22, C.coral);
    lines(svg, 480, L.rightTitle.length > 1 ? 44 : 52, L.rightTitle, 22, C.teal);
    // a few twinkling stars on the good side
    [[596, 120], [366, 560], [600, 480]].forEach((p, i) => {
      const sg = el('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')' }, svg);
      const st = el('path', { d: 'M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5Z', fill: C.gold, class: 'fw-twinkle' }, sg);
      st.style.animationDelay = i * 0.7 + 's';
    });

    const nodes = { wrong: [], right: [] };
    const all = [];
    const arrows = [];

    function arrow(d, side) {
      const p = el('path', { d: d, fill: 'none', stroke: side === 'wrong' ? C.coral : C.teal, 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': 'url(#' + uid + (side === 'wrong' ? 'c' : 't') + ')' }, svg);
      arrows.push(p);
      return p;
    }
    function node(side, spec, i, x, y, w, h, kind) {
      const wrong = side === 'wrong';
      const primary = !wrong && i === 0;
      const g = el('g', { class: 'fw-node', tabindex: 0, role: 'button', 'aria-label': spec.l.join(' ') + ': ' + spec.t }, svg);
      const stroke = wrong ? C.coral : C.teal;
      const fill = primary ? C.teal : '#FFFFFF';
      let shape;
      if (kind === 'circle') shape = el('circle', { cx: x + w / 2, cy: y + h / 2, r: w / 2, fill: fill, stroke: stroke, 'stroke-width': 3, class: 'fw-shape' }, g);
      else shape = el('rect', { x: x, y: y, width: w, height: h, rx: 18, fill: fill, stroke: stroke, 'stroke-width': 3, class: 'fw-shape', filter: 'url(#' + uid + 'w)' }, g);
      lines(g, x + w / 2, y + h / 2, spec.l, kind === 'circle' ? 34 : (w < 100 ? 14 : 20), primary ? C.cream : C.ink);
      const n = { round: kind === 'circle', g: g, cx: x + w / 2, cy: y + h / 2, top: y, bottom: y + h, left: x, right: x + w, spec: spec, side: side };
      nodes[side].push(n); all.push(n);
      const show = () => info(n);
      g.addEventListener('mouseenter', show);
      g.addEventListener('focus', show);
      g.addEventListener('click', show);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
      return n;
    }

    if (L.layout === 'stack') {
      const ys = [140, 270, 400], w = 190, h = 84;
      [['wrong', 160], ['right', 480]].forEach((s) => {
        const list = L[s[0]];
        list.forEach((spec, i) => node(s[0], spec, i, s[1] - w / 2 + (s[0] === 'wrong' ? 12 : 0), ys[i], w, h));
        for (let i = 0; i < 2; i++) {
          const a = nodes[s[0]][i], b = nodes[s[0]][i + 1];
          arrow('M' + a.cx + ' ' + (a.bottom + 4) + ' L' + b.cx + ' ' + (b.top - 6), s[0]);
        }
      });
      const n0 = nodes.wrong[0], n2 = nodes.wrong[2];
      L._loop = el('path', { d: 'M' + n2.left + ' ' + n2.cy + ' C ' + (n2.left - 48) + ' ' + n2.cy + ' ' + (n0.left - 48) + ' ' + n0.cy + ' ' + (n0.left - 4) + ' ' + n0.cy, fill: 'none', stroke: C.coral, 'stroke-width': 3, 'stroke-linecap': 'round', 'marker-end': 'url(#' + uid + 'c)' }, svg);
      arrows.push(L._loop);
    } else {
      const ys = [120, 214, 308], w = 190, h = 64;
      for (let i = 0; i < 3; i++) node('wrong', L.wrong[i], i, 160 - w / 2, ys[i], w, h);
      node('wrong', L.wrong[3], 3, 160 - 38, 404, 76, 76, 'circle');
      for (let i = 0; i < 3; i++) {
        const a = nodes.wrong[i], b = nodes.wrong[i + 1];
        arrow('M' + a.cx + ' ' + (a.bottom + 4) + ' L' + b.cx + ' ' + (b.top - 6), 'wrong');
      }
      const o = node('right', L.right[0], 0, 480 - 95, 120, 190, 74);
      [-98, 0, 98].forEach((dx, k) => {
        const a = node('right', L.right[k + 1], k + 1, 480 + dx - 44, 372, 88, 62);
        arrow('M' + (o.cx + dx * 0.35) + ' ' + (o.bottom + 4) + ' C ' + (o.cx + dx * 0.35) + ' ' + (o.bottom + 90) + ' ' + a.cx + ' ' + (a.top - 90) + ' ' + a.cx + ' ' + (a.top - 6), 'right');
      });
    }

    const spark = {};
    ['wrong', 'right'].forEach((side) => {
      const g = el('g', { class: 'fw-spark', opacity: 0 }, svg);
      el('circle', { r: 15, fill: C.gold, opacity: 0.35 }, g);
      el('circle', { r: 9, fill: C.gold, stroke: C.ink, 'stroke-width': 1.5 }, g);
      el('path', { d: 'M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4Z', fill: '#fff' }, g);
      spark[side] = g;
    });

    live.appendChild(svg);
    const infoBar = document.createElement('div');
    infoBar.className = 'fw-info';
    infoBar.setAttribute('aria-live', 'polite');
    const DEFAULT_INFO = 'Hover, tap or tab to any box to see what it means.';
    infoBar.textContent = DEFAULT_INFO;
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'fw-replay';
    replay.textContent = '↻ Replay';
    const foot = document.createElement('div');
    foot.className = 'fw-foot';
    foot.appendChild(infoBar);
    foot.appendChild(replay);
    live.appendChild(foot);
    fig.appendChild(live);
    fig.classList.add('fw-live-on');

    function info(n) {
      infoBar.className = 'fw-info ' + (n.side === 'wrong' ? 'is-wrong' : 'is-right');
      infoBar.textContent = '';
      const st = document.createElement('strong');
      st.textContent = (n.side === 'wrong' ? 'MOST PEOPLE: ' : L.name.toUpperCase() + ': ') + n.spec.l.join(' ');
      infoBar.appendChild(st);
      infoBar.appendChild(document.createTextNode(n.spec.t));
    }

    // ---- Motion ----
    let run = 0;
    const alive = (r) => r === run;
    const place = (s, x, y) => s.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    function tween(r, ms, fn) {
      return new Promise((res) => {
        const t0 = performance.now();
        (function f(t) {
          if (!alive(r)) return res();
          const p = Math.min(1, (t - t0) / ms);
          fn(ease(p));
          if (p < 1) requestAnimationFrame(f); else res();
        })(t0);
      });
    }
    const moveTo = (r, s, from, to, ms) => tween(r, ms, (p) => place(s, from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p));
    const alongPath = (r, s, path, ms) => { const len = path.getTotalLength(); return tween(r, ms, (p) => { const pt = path.getPointAtLength(len * p); place(s, pt.x, pt.y); }); };
    async function light(r, n, ms) { n.g.classList.add('lit'); await sleep(ms); n.g.classList.remove('lit'); }
    async function say(r, x, y, text, color) {
      const g = el('g', { class: 'fw-say' }, svg);
      const w = text.length * 8.2 + 22;
      el('rect', { x: x - w / 2, y: y - 18, width: w, height: 28, rx: 14, fill: '#fff', stroke: color, 'stroke-width': 2 }, g);
      const t = el('text', { x: x, y: y + 1, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: C.ink, 'font-family': 'inherit' }, g);
      t.textContent = text;
      g.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250, fill: 'forwards' });
      await sleep(1300);
      g.remove();
    }
    function burst(x, y) {
      const cols = [C.gold, C.teal, C.coral, '#fff'];
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14, d = 46 + (i % 3) * 16;
        const dot = el(i % 2 ? 'circle' : 'path', i % 2 ? { r: 4.5, fill: cols[i % 4] } : { d: 'M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z', fill: cols[i % 4] }, svg);
        dot.style.pointerEvents = 'none';
        dot.animate([
          { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1 },
          { transform: 'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d) + 'px) scale(.2)', opacity: 0 }
        ], { duration: 950, easing: 'ease-out', fill: 'forwards' }).onfinish = () => dot.remove();
      }
    }
    const show = (s, v) => s.setAttribute('opacity', v);
    const pt = (n) => (n.round ? [n.cx, n.cy] : [n.left + 14, n.cy]);

    async function wrongSeq(r) {
      const s = spark.wrong, w = nodes.wrong;
      show(s, 1); place(s, ...pt(w[0]));
      await light(r, w[0], 550);
      for (let i = 1; i < w.length && alive(r); i++) {
        await moveTo(r, s, pt(w[i - 1]), pt(w[i]), 650);
        await light(r, w[i], 500);
      }
      if (!alive(r)) return;
      const last = w[w.length - 1];
      last.g.classList.remove('shake'); void last.g.getBoundingClientRect(); last.g.classList.add('shake');
      say(r, last.cx, last.top - 14, L.wrongSay, C.coral);
      if (L.layout === 'stack') {
        await moveTo(r, s, pt(last), [last.left, last.cy], 250);
        await alongPath(r, s, L._loop, 1100);
        await moveTo(r, s, [w[0].left - 4, w[0].cy], pt(w[0]), 250);
        await light(r, w[0], 400);
      } else {
        await sleep(1100);
      }
      show(s, 0);
    }
    async function rightSeq(r) {
      const s = spark.right, n = nodes.right;
      show(s, 1); place(s, ...pt(n[0]));
      await light(r, n[0], 600);
      if (L.layout === 'stack') {
        for (let i = 1; i < n.length && alive(r); i++) {
          await moveTo(r, s, pt(n[i - 1]), pt(n[i]), 650);
          await light(r, n[i], 500);
        }
        if (!alive(r)) return;
        burst(n[n.length - 1].cx, n[n.length - 1].cy);
        n[n.length - 1].g.classList.add('lit');
        await say(r, n[n.length - 1].cx, n[n.length - 1].top - 14, L.rightSay, C.teal);
        n[n.length - 1].g.classList.remove('lit');
      } else {
        for (let i = 1; i < n.length && alive(r); i++) {
          await moveTo(r, s, pt(n[0]), pt(n[i]), 600);
          await light(r, n[i], 450);
          await moveTo(r, s, pt(n[i]), pt(n[0]), 450);
        }
        if (!alive(r)) return;
        burst(n[0].cx, n[0].cy);
        n[0].g.classList.add('lit');
        await say(r, n[0].cx, n[0].top - 14, L.rightSay, C.teal);
        n[0].g.classList.remove('lit');
      }
      show(s, 0);
    }
    async function loopSide(r, seq, gap) {
      while (alive(r)) { await seq(r); if (alive(r)) await sleep(gap); }
    }

    function resetNodes(animated) {
      all.forEach((n) => { n.g.classList.remove('in', 'lit', 'shake'); n.g.style.transitionDelay = ''; });
      arrows.forEach((a) => {
        const len = a.getTotalLength ? a.getTotalLength() : 0;
        a.style.transition = 'none';
        a.style.strokeDasharray = len; a.style.strokeDashoffset = animated ? len : 0;
        a.style.opacity = animated ? 0 : 1;
      });
    }
    function enter(animated) {
      void svg.getBoundingClientRect();
      all.forEach((n, i) => {
        if (animated) n.g.style.transitionDelay = i * 110 + 'ms';
        n.g.classList.add('in');
      });
      arrows.forEach((a, i) => {
        if (!animated) return;
        a.style.transition = 'stroke-dashoffset .6s ease ' + (260 + i * 90) + 'ms, opacity .2s ease ' + (260 + i * 90) + 'ms';
        a.style.strokeDashoffset = 0; a.style.opacity = 1;
      });
      if (animated) setTimeout(() => { all.forEach((n) => { n.g.style.transitionDelay = ''; }); }, all.length * 110 + 500);
    }

    const api = {
      play() {
        const r = ++run;
        show(spark.wrong, 0); show(spark.right, 0);
        infoBar.className = 'fw-info'; infoBar.textContent = DEFAULT_INFO;
        if (reduce) { resetNodes(false); enter(false); return; }
        resetNodes(true); enter(true);
        setTimeout(() => {
          if (!alive(r)) return;
          loopSide(r, wrongSeq, 700);
          setTimeout(() => { if (alive(r)) loopSide(r, rightSeq, 1200); }, 500);
        }, 1100);
      },
      stop() { run++; show(spark.wrong, 0); show(spark.right, 0); }
    };
    replay.addEventListener('click', () => api.play());
    resetNodes(false);
    return api;
  }

  const diagrams = [];
  panels.forEach((p, i) => {
    const fig = p.querySelector('.fw-fig');
    const idx = fig ? parseInt(fig.getAttribute('data-lesson'), 10) : -1;
    diagrams[i] = fig && LESSONS[idx] ? build(fig, LESSONS[idx]) : null;
  });

  // ---- Tabs ----
  let current = 0, visible = false;
  function sync() {
    diagrams.forEach((d, n) => { if (d && (!visible || n !== current)) d.stop(); });
    if (visible && diagrams[current]) diagrams[current].play();
  }
  function select(i, focus) {
    current = i;
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[n].hidden = !on;
    });
    if (focus) tabs[i].focus();
    sync();
  }
  const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { if (i !== current) select(i); });
    if (canHover) t.addEventListener('mouseenter', () => { if (i !== current) select(i); });
    t.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); select(next, true); }
    });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const now = entries[0].isIntersecting;
      if (now !== visible) { visible = now; sync(); }
    }, { threshold: 0.15 }).observe(section);
  } else {
    visible = true;
  }
  select(0);
})();
