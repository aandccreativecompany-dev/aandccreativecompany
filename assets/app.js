// ============================================
// Prakriyā web app — auth + daily practice tools
// ============================================
//
// SETUP REQUIRED: this file will not work until you fill in your real
// Supabase project URL and anon (public) key below, and create the
// `prakriya_data` table + policies described in SETUP_PRAKRIYA.md at the
// repo root. Nothing here can substitute for real project credentials —
// see that file for the exact steps and SQL to run.
const SUPABASE_URL = 'https://xuijptnqnioukflgrjsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aWpwdG5xbmlvdWtmbGdyanNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NjcwOTEsImV4cCI6MjEwMzA0MzA5MX0.6uKuXqZmlPb8EXasop40PbQqSA2y1whEU2YadUkodEY';

const FEEDBACK_EMAIL = 'aandccreativecompany@gmail.com';

(function () {
  // Only run on pages that actually have the app shell (currently /prakriya).
  const shell = document.querySelector('.app-shell');
  if (!shell) return;

  const configured =
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('https://') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 20;

  const authMessageEl = document.getElementById('app-auth-message');

  if (!configured || typeof window.supabase === 'undefined') {
    if (authMessageEl) {
      authMessageEl.textContent =
        'Prakriyā sign-up isn’t connected yet — the site owner needs to add Supabase project credentials. Nothing is broken on your end.';
      authMessageEl.style.color = '#F2B93B';
    }
    document.querySelectorAll('#app-signup-form, #app-login-form').forEach((f) => {
      f.querySelectorAll('button, input').forEach((el) => (el.disabled = true));
    });
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ---------- Local state (mirrors the mobile app's single-JSON-blob model) ----------
  const DEFAULT_DATA = () => ({
    priorities: [], // {text, done}
    habits: [], // {name, doneDates: []}
    goals: { finance: [], health: [], mindset: [], relationships: [] }, // {text, done}
    scripts: [], // {text, ts}
    reflections: {}, // date -> {mood, journal}
    vision: [], // {url, label}
    mindMapNotes: {}, // date -> note
  });

  let data = DEFAULT_DATA();
  let currentUser = null;
  let saveTimer = null;

  const todayKey = () => new Date().toISOString().slice(0, 10);

  // ---------- Persistence ----------
  async function loadData() {
    const { data: row, error } = await sb
      .from('prakriya_data')
      .select('data')
      .eq('user_id', currentUser.id)
      .maybeSingle();
    if (error) {
      console.error('Prakriya load error', error);
      return;
    }
    data = { ...DEFAULT_DATA(), ...(row?.data || {}) };
  }

  function scheduleSave() {
    const statusEl = document.getElementById('dash-save-status');
    if (statusEl) statusEl.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { error } = await sb
        .from('prakriya_data')
        .upsert({ user_id: currentUser.id, data, updated_at: new Date().toISOString() });
      if (statusEl) {
        statusEl.textContent = error ? 'Could not save — check your connection' : 'Saved';
        setTimeout(() => (statusEl.textContent = ''), 2000);
      }
      if (error) console.error('Prakriya save error', error);
    }, 500);
  }

  // ---------- Affirmation (reuses the deterministic list from script.js) ----------
  function renderAppAffirmation() {
    const el = document.getElementById('app-affirmation-text');
    if (!el || typeof AFFIRMATIONS === 'undefined' || typeof dayOfYear === 'undefined') return;
    const today = new Date();
    el.textContent = '“' + AFFIRMATIONS[dayOfYear(today) % AFFIRMATIONS.length] + '”';
  }

  // ---------- Today: priorities ----------
  function renderPriorities() {
    const list = document.getElementById('app-priority-list');
    if (!list) return;
    list.innerHTML = '';
    data.priorities.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'task-row' + (p.done ? ' done' : '');
      row.innerHTML = `
        <label><input type="checkbox" data-i="${i}" class="priority-check" ${p.done ? 'checked' : ''}><span>${escapeHtml(p.text)}</span></label>
        <button class="row-remove" data-i="${i}" aria-label="Remove">✕</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.priority-check').forEach((cb) =>
      cb.addEventListener('change', (e) => {
        data.priorities[+e.target.dataset.i].done = e.target.checked;
        renderPriorities();
        scheduleSave();
      })
    );
    list.querySelectorAll('.row-remove').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        data.priorities.splice(+e.target.dataset.i, 1);
        renderPriorities();
        scheduleSave();
      })
    );
  }

  // ---------- Today: habits ----------
  function renderHabits() {
    const list = document.getElementById('app-habit-list');
    if (!list) return;
    const today = todayKey();
    list.innerHTML = '';
    data.habits.forEach((h, i) => {
      const doneToday = h.doneDates.includes(today);
      const streak = computeStreak(h.doneDates);
      const row = document.createElement('div');
      row.className = 'task-row' + (doneToday ? ' done' : '');
      row.innerHTML = `
        <label><input type="checkbox" data-i="${i}" class="habit-check" ${doneToday ? 'checked' : ''}><span>${escapeHtml(h.name)} ${streak > 0 ? `<em class="streak">🔥${streak}</em>` : ''}</span></label>
        <button class="row-remove" data-i="${i}" aria-label="Remove">✕</button>`;
      list.appendChild(row);
    });
    list.querySelectorAll('.habit-check').forEach((cb) =>
      cb.addEventListener('change', (e) => {
        const h = data.habits[+e.target.dataset.i];
        const idx = h.doneDates.indexOf(today);
        if (e.target.checked && idx === -1) h.doneDates.push(today);
        if (!e.target.checked && idx !== -1) h.doneDates.splice(idx, 1);
        renderHabits();
        renderMindMap();
        scheduleSave();
      })
    );
    list.querySelectorAll('.row-remove').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        data.habits.splice(+e.target.dataset.i, 1);
        renderHabits();
        scheduleSave();
      })
    );
  }

  function computeStreak(doneDates) {
    const set = new Set(doneDates);
    let streak = 0;
    let d = new Date();
    while (set.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  // ---------- Goals (4 life areas) ----------
  const GOAL_AREAS = ['finance', 'health', 'mindset', 'relationships'];
  function renderGoals() {
    GOAL_AREAS.forEach((area) => {
      const list = document.querySelector(`[data-goal-list="${area}"]`);
      if (!list) return;
      const items = data.goals[area] || [];
      list.innerHTML = '';
      if (items.length === 0) {
        list.innerHTML = '<p class="empty-hint">No goals here yet.</p>';
      }
      items.forEach((g, i) => {
        const row = document.createElement('div');
        row.className = 'task-row' + (g.done ? ' done' : '');
        row.innerHTML = `
          <label><input type="checkbox" data-area="${area}" data-i="${i}" class="goal-check" ${g.done ? 'checked' : ''}><span>${escapeHtml(g.text)}</span></label>
          <button class="row-remove goal-remove" data-area="${area}" data-i="${i}" aria-label="Remove">✕</button>`;
        list.appendChild(row);
      });
    });
    document.querySelectorAll('.goal-check').forEach((cb) =>
      cb.addEventListener('change', (e) => {
        data.goals[e.target.dataset.area][+e.target.dataset.i].done = e.target.checked;
        renderGoals();
        scheduleSave();
      })
    );
    document.querySelectorAll('.goal-remove').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        data.goals[e.target.dataset.area].splice(+e.target.dataset.i, 1);
        renderGoals();
        scheduleSave();
      })
    );
  }

  // ---------- Scripting ----------
  function renderScripts() {
    const list = document.getElementById('app-script-list');
    if (!list) return;
    list.innerHTML = '';
    [...data.scripts]
      .sort((a, b) => b.ts - a.ts)
      .forEach((s) => {
        const row = document.createElement('div');
        row.className = 'script-row';
        const when = new Date(s.ts).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        row.innerHTML = `<span class="script-ts">${when}</span><p>${escapeHtml(s.text)}</p>`;
        list.appendChild(row);
      });
  }

  // ---------- Reflection ----------
  let selectedMood = null;
  function loadTodayReflection() {
    const r = data.reflections[todayKey()] || {};
    document.getElementById('app-journal-box').value = r.journal || '';
    selectedMood = r.mood || null;
    document.querySelectorAll('.mood-btn').forEach((b) => b.classList.toggle('selected', b.dataset.mood === selectedMood));
  }

  // ---------- Vision board ----------
  function renderVision() {
    const grid = document.getElementById('app-vision-grid');
    if (!grid) return;
    grid.innerHTML = '';
    data.vision.forEach((v, i) => {
      const tile = document.createElement('div');
      tile.className = 'vision-tile';
      tile.style.backgroundImage = `url("${escapeAttr(v.url)}")`;
      tile.innerHTML = `
        ${v.label ? `<span class="vision-label">${escapeHtml(v.label)}</span>` : ''}
        <button class="vision-remove" data-i="${i}" aria-label="Remove">✕</button>`;
      grid.appendChild(tile);
    });
    grid.querySelectorAll('.vision-remove').forEach((btn) =>
      btn.addEventListener('click', (e) => {
        data.vision.splice(+e.target.dataset.i, 1);
        renderVision();
        scheduleSave();
      })
    );
  }

  // ---------- Mind map ----------
  function renderMindMap() {
    const el = document.getElementById('app-mindmap-stats');
    if (!el) return;
    const total = data.habits.length;
    const doneToday = data.habits.filter((h) => h.doneDates.includes(todayKey())).length;
    const priDone = data.priorities.filter((p) => p.done).length;
    const scriptsThisWeek = data.scripts.filter((s) => Date.now() - s.ts < 7 * 86400000).length;
    const journaledToday = !!(data.reflections[todayKey()] || {}).journal;
    el.innerHTML = `
      <div class="mm-stat"><span class="mm-num">${doneToday}/${total}</span><span class="mm-label">Habits today</span></div>
      <div class="mm-stat"><span class="mm-num">${priDone}/${data.priorities.length}</span><span class="mm-label">Priorities done</span></div>
      <div class="mm-stat"><span class="mm-num">${scriptsThisWeek}</span><span class="mm-label">Scripts this week</span></div>
      <div class="mm-stat"><span class="mm-num">${journaledToday ? 'Yes' : 'Not yet'}</span><span class="mm-label">Journaled today</span></div>`;
    document.getElementById('app-mindmap-note').value = data.mindMapNotes[todayKey()] || '';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function renderAll() {
    renderAppAffirmation();
    renderPriorities();
    renderHabits();
    renderGoals();
    renderScripts();
    loadTodayReflection();
    renderVision();
    renderMindMap();
  }

  // ---------- Wire up all the "add" controls (once) ----------
  function wireControls() {
    document.getElementById('app-priority-add-btn').addEventListener('click', () => {
      const input = document.getElementById('app-priority-input');
      const text = input.value.trim();
      if (!text || data.priorities.length >= 3) return;
      data.priorities.push({ text, done: false });
      input.value = '';
      renderPriorities();
      renderMindMap();
      scheduleSave();
    });

    document.getElementById('app-habit-add-btn').addEventListener('click', () => {
      const input = document.getElementById('app-habit-input');
      const name = input.value.trim();
      if (!name) return;
      data.habits.push({ name, doneDates: [] });
      input.value = '';
      renderHabits();
      renderMindMap();
      scheduleSave();
    });

    document.querySelectorAll('.goal-add-btn').forEach((btn) =>
      btn.addEventListener('click', () => {
        const area = btn.dataset.goalAdd;
        const input = document.querySelector(`[data-goal-input="${area}"]`);
        const text = input.value.trim();
        if (!text) return;
        data.goals[area].push({ text, done: false });
        input.value = '';
        renderGoals();
        scheduleSave();
      })
    );

    document.getElementById('app-script-save-btn').addEventListener('click', () => {
      const input = document.getElementById('app-script-input');
      const text = input.value.trim();
      if (!text) return;
      data.scripts.push({ text, ts: Date.now() });
      input.value = '';
      renderScripts();
      renderMindMap();
      scheduleSave();
    });

    document.querySelectorAll('.mood-btn').forEach((btn) =>
      btn.addEventListener('click', () => {
        selectedMood = btn.dataset.mood;
        document.querySelectorAll('.mood-btn').forEach((b) => b.classList.toggle('selected', b === btn));
      })
    );

    document.getElementById('app-journal-save-btn').addEventListener('click', () => {
      const journal = document.getElementById('app-journal-box').value.trim();
      data.reflections[todayKey()] = { mood: selectedMood, journal };
      const status = document.getElementById('app-journal-status');
      status.textContent = 'Saved';
      setTimeout(() => (status.textContent = ''), 2000);
      renderMindMap();
      scheduleSave();
    });

    document.getElementById('app-vision-add-btn').addEventListener('click', () => {
      const urlInput = document.getElementById('app-vision-input');
      const labelInput = document.getElementById('app-vision-label-input');
      const url = urlInput.value.trim();
      if (!url) return;
      data.vision.push({ url, label: labelInput.value.trim() });
      urlInput.value = '';
      labelInput.value = '';
      renderVision();
      scheduleSave();
    });

    document.getElementById('app-mindmap-save-btn').addEventListener('click', () => {
      data.mindMapNotes[todayKey()] = document.getElementById('app-mindmap-note').value.trim();
      scheduleSave();
    });

    // Dashboard tabs
    document.querySelectorAll('.dash-tab').forEach((tab) =>
      tab.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.dash-panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel).classList.add('active');
      })
    );

    // Feedback
    let feedbackKind = 'Feedback';
    document.querySelectorAll('#feedback-kind-row .app-tab').forEach((btn) =>
      btn.addEventListener('click', () => {
        feedbackKind = btn.dataset.kind;
        document.querySelectorAll('#feedback-kind-row .app-tab').forEach((b) => b.classList.toggle('active', b === btn));
      })
    );
    document.getElementById('app-feedback-send-btn').addEventListener('click', () => {
      const message = document.getElementById('app-feedback-box').value.trim();
      if (!message) return;
      const subject = encodeURIComponent(`Prakriyā ${feedbackKind}`);
      const body = encodeURIComponent(`${message}\n\n—\nSent from Prakriyā web${currentUser ? ' by ' + currentUser.email : ''}`);
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    });
  }

  // ---------- Auth ----------
  const authPanel = document.getElementById('app-auth-panel');
  const dashboard = document.getElementById('app-dashboard');
  const tabSignup = document.getElementById('app-tab-signup');
  const tabLogin = document.getElementById('app-tab-login');
  const formSignup = document.getElementById('app-signup-form');
  const formLogin = document.getElementById('app-login-form');

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    formSignup.classList.remove('app-hidden');
    formLogin.classList.add('app-hidden');
  });
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    formLogin.classList.remove('app-hidden');
    formSignup.classList.add('app-hidden');
  });

  function setAuthMessage(msg, isError) {
    if (!authMessageEl) return;
    authMessageEl.textContent = msg;
    authMessageEl.style.color = isError ? '#ff8a8a' : '#F2B93B';
  }

  formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('app-signup-email').value.trim();
    const password = document.getElementById('app-signup-password').value;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) return setAuthMessage(error.message, true);
    setAuthMessage('Check your email to confirm your account, then log in.', false);
  });

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('app-login-email').value.trim();
    const password = document.getElementById('app-login-password').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) setAuthMessage(error.message, true);
  });

  document.getElementById('app-logout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
  });

  let controlsWired = false;
  async function showDashboard(user) {
    currentUser = user;
    authPanel.classList.add('app-hidden');
    dashboard.classList.remove('app-hidden');
    document.getElementById('app-who-email').textContent = user.email;
    await loadData();
    if (!controlsWired) {
      wireControls();
      controlsWired = true;
    }
    renderAll();
  }

  function showAuth() {
    currentUser = null;
    data = DEFAULT_DATA();
    dashboard.classList.add('app-hidden');
    authPanel.classList.remove('app-hidden');
  }

  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showDashboard(session.user);
    else showAuth();
  });

  sb.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) showDashboard(session.user);
  });
})();
