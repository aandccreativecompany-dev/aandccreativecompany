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
