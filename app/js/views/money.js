import { el, dayKey, money, isoLocal, newId, toast, confirmBox, parseDay, fmtShort } from '../util.js';
import * as S from '../store.js';
import { card, pageHead, empty } from '../ui.js';

const SAV = { emergencyFund: 'Emergency fund', stocks: 'Stocks', mutualFunds: 'Mutual funds', gold: 'Gold', fixedDeposit: 'Fixed deposit', ppfEpf: 'PPF / EPF', realEstate: 'Real estate', crypto: 'Crypto', other: 'Other' };

function periodStart(s) {
  const now = new Date();
  if (s.spendBudgetPeriod === 'weekly') { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
const entryDate = (e) => { const d = new Date(e.date); return isNaN(d) ? new Date(0) : d; };
const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : NaN; };

export function render(s, rerender) {
  const root = el('div', { class: 'view' }, pageHead('Money', 'See where it goes, set a budget, and keep savings moving.'));
  const start = periodStart(s);
  const cats = s.spendCategories?.length ? s.spendCategories : [{ id: 'other', name: 'Other', subcategories: [] }];
  const inPeriod = (s.spendEntries || []).filter((e) => entryDate(e) >= start);
  const spent = inPeriod.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const needs = inPeriod.filter((e) => e.isNeed).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const wants = spent - needs;
  const budget = Number(s.spendBudgetAmount) || 0;

  // Overview + budget
  const frac = budget ? Math.min(1, spent / budget) : 0;
  const bar = el('div', { class: `bar${budget && spent > budget ? ' over' : ''}`, role: 'img', 'aria-label': budget ? `${Math.round((spent / budget) * 100)}% of budget used` : 'No budget set' }, el('span', { style: `width:${frac * 100}%` }));
  const bin = el('input', { type: 'number', min: '0', step: '100', placeholder: 'Set a budget', value: budget || '', 'aria-label': 'Budget amount' });
  const per = el('select', { 'aria-label': 'Budget period' }, el('option', { value: 'monthly', selected: s.spendBudgetPeriod !== 'weekly' ? true : null }, 'per month'), el('option', { value: 'weekly', selected: s.spendBudgetPeriod === 'weekly' ? true : null }, 'per week'));
  const saveBudget = () => { const v = num(bin.value); S.commit((st) => { st.spendBudgetAmount = isFinite(v) && v > 0 ? v : null; st.spendBudgetPeriod = per.value; }); };
  bin.addEventListener('change', saveBudget); per.addEventListener('change', saveBudget);
  root.append(card(s.spendBudgetPeriod === 'weekly' ? 'This week' : 'This month',
    el('div', { class: 'stats' },
      el('div', null, el('span', { class: 'stat-n', text: money(spent) }), el('span', { class: 'muted small', text: budget ? `of ${money(budget)} budget` : 'spent' })),
      el('div', null, el('span', { class: 'stat-n need', text: money(needs) }), el('span', { class: 'muted small', text: 'needs' })),
      el('div', null, el('span', { class: 'stat-n want', text: money(wants) }), el('span', { class: 'muted small', text: 'wants' }))),
    bar, budget ? el('p', { class: 'muted small', text: spent > budget ? `Over budget by ${money(spent - budget)}.` : `${money(budget - spent)} left.` }) : null,
    el('div', { class: 'add-row tight' }, bin, per)));

  // Add expense
  const cSel = el('select', { 'aria-label': 'Category' }, cats.map((c) => el('option', { value: c.id, text: c.name })));
  const sSel = el('select', { 'aria-label': 'Sub-category' });
  const fillSubs = () => { const c = cats.find((x) => x.id === cSel.value); sSel.replaceChildren(el('option', { value: '', text: '— no sub-category —' }), ...((c?.subcategories || []).map((x) => el('option', { value: x, text: x })))); };
  cSel.addEventListener('change', fillSubs); fillSubs();
  const amt = el('input', { type: 'number', min: '0', step: 'any', required: true, placeholder: 'Amount (₹)', 'aria-label': 'Amount' });
  const kind = el('select', { 'aria-label': 'Need or want' }, el('option', { value: 'need', text: 'Need' }), el('option', { value: 'want', text: 'Want' }));
  const note = el('input', { type: 'text', maxlength: 100, placeholder: 'Note (optional)', 'aria-label': 'Note' });
  const when = el('input', { type: 'date', value: dayKey(), max: dayKey(), 'aria-label': 'Date' });
  root.append(card('Log an expense', el('form', { class: 'form-grid', onsubmit: (e) => {
    e.preventDefault(); const a = num(amt.value); if (!(a > 0)) { toast('Enter an amount above 0'); return; }
    const d = when.value ? parseDay(when.value) : new Date(); const n = new Date(); d.setHours(n.getHours(), n.getMinutes(), n.getSeconds());
    S.commit((st) => { st.spendEntries = st.spendEntries || []; st.spendEntries.push({ id: newId(), categoryId: cSel.value, subcategory: sSel.value, amount: a, isNeed: kind.value === 'need', note: note.value.trim(), date: isoLocal(d) }); });
    toast('Expense added');
  } }, cSel, sSel, amt, kind, when, note, el('button', { class: 'btn primary', type: 'submit' }, 'Add expense'))));

  // Where it went
  const byCat = new Map(); inPeriod.forEach((e) => byCat.set(e.categoryId, (byCat.get(e.categoryId) || 0) + Number(e.amount || 0)));
  const rows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  root.append(card('Where it went', rows.length ? el('ul', { class: 'list plain' }, rows.map(([id, v]) => {
    const name = cats.find((c) => c.id === id)?.name || 'Other';
    return el('li', { class: 'catrow' }, el('span', { text: name }), el('div', { class: 'bar thin' }, el('span', { style: `width:${spent ? (v / spent) * 100 : 0}%` })), el('strong', { text: money(v) }));
  })) : empty('No expenses in this period yet.')));

  const recent = [...(s.spendEntries || [])].sort((a, b) => entryDate(b) - entryDate(a)).slice(0, 12);
  root.append(card('Recent expenses', recent.length ? el('ul', { class: 'list plain' }, recent.map((e) => el('li', { class: 'exprow' },
    el('span', { class: 'muted small', text: fmtShort(entryDate(e)) }),
    el('span', { text: `${cats.find((c) => c.id === e.categoryId)?.name || 'Other'}${e.subcategory ? ' · ' + e.subcategory : ''}${e.note ? ' — ' + e.note : ''}` }),
    el('span', { class: `chip ${e.isNeed ? 'need' : 'want'}`, text: e.isNeed ? 'Need' : 'Want' }),
    el('strong', { text: money(e.amount) }),
    el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Delete expense', onclick: async () => { if (await confirmBox('Delete this expense?', `${money(e.amount)} will be removed.`)) S.commit((st) => { st.spendEntries = st.spendEntries.filter((x) => x.id !== e.id); }); } }, '✕')))) : empty('Nothing logged yet.')));

  // Savings
  const totals = {}; (s.savingsEntries || []).forEach((e) => { totals[e.type] = (totals[e.type] || 0) + Number(e.amount || 0); });
  const totalSaved = Object.values(totals).reduce((a, b) => a + b, 0);
  const sType = el('select', { 'aria-label': 'Savings type' }, Object.entries(SAV).map(([k, l]) => el('option', { value: k, text: l })));
  const sAmt = el('input', { type: 'number', min: '0', step: 'any', required: true, placeholder: 'Amount (₹)', 'aria-label': 'Savings amount' });
  root.append(card('Savings & investments', el('p', { class: 'stat-n', text: money(totalSaved) }),
    Object.keys(totals).length ? el('ul', { class: 'list plain' }, Object.entries(totals).map(([k, v]) => el('li', { class: 'catrow' }, el('span', { text: SAV[k] || k }), el('span'), el('strong', { text: money(v) })))) : empty('Log what you set aside to see it add up.'),
    el('form', { class: 'add-row', onsubmit: (e) => { e.preventDefault(); const a = num(sAmt.value); if (!(a > 0)) return;
      S.commit((st) => { st.savingsEntries = st.savingsEntries || []; st.savingsEntries.push({ id: newId(), type: sType.value, amount: a, note: '', date: isoLocal() }); }); toast('Saved'); } },
      sType, sAmt, el('button', { class: 'btn primary', type: 'submit' }, 'Add'))));

  // 50/30/20
  const inc = el('input', { type: 'number', min: '0', step: '500', placeholder: 'Monthly income (₹)', value: s.financeBudgetIncome || '', 'aria-label': 'Monthly income' });
  const split = [['financeBudgetNeedsPct', 'Needs'], ['financeBudgetWantsPct', 'Wants'], ['financeBudgetSavingsPct', 'Savings & debt']];
  const out = el('div', { class: 'split' });
  const paint = () => {
    const income = num(inc.value) || 0;
    out.replaceChildren(...split.map(([k, l]) => el('div', { class: 'split-item' }, el('span', { class: 'muted small', text: `${l} (${s[k]}%)` }), el('strong', { text: money(income * (s[k] / 100)) }))));
  };
  inc.addEventListener('input', paint);
  inc.addEventListener('change', () => { const v = num(inc.value); S.commit((st) => { st.financeBudgetIncome = isFinite(v) && v > 0 ? v : null; }); });
  paint();
  const sliders = split.map(([k, l]) => {
    const out2 = el('span', { class: 'muted small', text: `${s[k]}%` });
    const r = el('input', { type: 'range', min: '0', max: '100', step: '5', value: s[k], 'aria-label': `${l} percent`, oninput: () => { out2.textContent = r.value + '%'; },
      onchange: () => { S.commit((st) => { st[k] = Number(r.value); }); } });
    return el('label', { class: 'slider' }, el('span', { text: l }), r, out2);
  });
  const sum = split.reduce((a, [k]) => a + (Number(s[k]) || 0), 0);
  root.append(card('50 / 30 / 20 budget planner', el('div', { class: 'add-row tight' }, inc), out, sliders,
    sum !== 100 ? el('p', { class: 'warn small', text: `These add up to ${sum}%, not 100%.` }) : null,
    el('button', { class: 'btn ghost', type: 'button', onclick: () => S.commit((st) => { st.financeBudgetNeedsPct = 50; st.financeBudgetWantsPct = 30; st.financeBudgetSavingsPct = 20; }) }, 'Reset to 50/30/20')));

  // Goal roadmap
  const rm = s.financeRoadmap;
  if (rm && rm.months) {
    const per2 = rm.targetAmount / rm.months, done = (rm.monthsDone || []).filter(Boolean).length;
    root.append(card('Goal roadmap', el('strong', { text: rm.dreamGoal || 'My goal' }),
      el('p', { class: 'muted', text: `${money(per2 * done)} of ${money(rm.targetAmount)} · ${money(per2)} a month for ${rm.months} months` }),
      el('div', { class: 'months' }, Array.from({ length: rm.months }, (_, i) => el('button', { type: 'button', class: `month${rm.monthsDone?.[i] ? ' on' : ''}`, 'aria-pressed': String(!!rm.monthsDone?.[i]), 'aria-label': `Month ${i + 1}`,
        onclick: () => S.commit((st) => { st.financeRoadmap.monthsDone = Array.from({ length: st.financeRoadmap.months }, (_, k) => !!st.financeRoadmap.monthsDone?.[k]); st.financeRoadmap.monthsDone[i] = !st.financeRoadmap.monthsDone[i]; }) }, String(i + 1)))),
      el('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await confirmBox('Remove this roadmap?', 'Your goal and progress will be removed.')) S.commit((st) => { st.financeRoadmap = null; }); } }, 'Remove roadmap')));
  } else {
    const g = el('input', { type: 'text', maxlength: 80, placeholder: 'Dream goal, e.g. Down payment', required: true, 'aria-label': 'Dream goal' });
    const t = el('input', { type: 'number', min: '1', step: 'any', placeholder: 'Target amount (₹)', required: true, 'aria-label': 'Target amount' });
    const m = el('input', { type: 'number', min: '1', max: '120', value: 12, 'aria-label': 'Months' });
    root.append(card('Goal roadmap', el('p', { class: 'muted', text: 'Break one big money goal into monthly milestones.' }),
      el('form', { class: 'form-grid', onsubmit: (e) => { e.preventDefault(); const target = num(t.value), months = Math.max(1, Math.min(120, parseInt(m.value, 10) || 12)); if (!(target > 0)) return;
        S.commit((st) => { st.financeRoadmap = { dreamGoal: g.value.trim(), targetAmount: target, months, monthsDone: Array(months).fill(false) }; }); } },
        g, t, el('label', { class: 'inline' }, 'Months ', m), el('button', { class: 'btn primary', type: 'submit' }, 'Create roadmap'))));
  }
  return root;
}
