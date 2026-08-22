// ============================================
// A&C Creative Company — shared site behavior
// ============================================

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
