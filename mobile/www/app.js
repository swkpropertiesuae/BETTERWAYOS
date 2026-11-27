// Betterway Mortgages Mobile App v2.0 (3-Mode PWA + Capacitor 7 — Full SWKOS v3.9.0 Parity)
// Strict CSP safe: zero inline scripts, zero inline style attributes, full HTML escaping, live /api/sync/changes feed.

const API_BASE = '';
const TOKEN_KEY = 'bw.mobile.token';

const state = {
  mode: 'advisor', // advisor | borrower | partner
  tab: 'home',
  clientsSub: 'vault', // vault | deals
  bankFilter: 'all', // all | Islamic | Conventional | LowDoc | NonRes
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  dashboard: null,
  cases: [],
  tasks: [],
  vaultLeads: [],
  fieldSessions: [],
  banks: [],
  eibor: null,
  borrowerRef: 'BW-2026-M03',
  borrowerData: null,
  partnerReferrals: [],
  syncSeq: 0,
  calc: { price: 2800000, downPct: 20, rate: 3.89, years: 25, salary: 50000, emis: 2500, cards: 25000 },
};

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const aed = (n, compact = false) => {
  const v = Number(n || 0);
  if (compact && Math.abs(v) >= 1e6) return `AED ${(v / 1e6).toFixed(2)}M`;
  if (compact && Math.abs(v) >= 1e3) return `AED ${(v / 1e3).toFixed(0)}K`;
  return `AED ${Math.round(v).toLocaleString('en-AE')}`;
};

function showToast(msg, isErr = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.toggle('err', isErr);
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 3600);
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function calcEmi(P, ratePct, yrs) {
  const n = Math.round(yrs * 12);
  const r = ratePct / 100 / 12;
  if (P <= 0 || n <= 0) return 0;
  const f = Math.pow(1 + r, n);
  return (P * r * f) / (f - 1);
}

function calcMaxLoan(salary, emis, cards, yrs) {
  const avail = Math.max(0, salary * 0.5 - emis - cards * 0.05);
  const r = 6.5 / 100 / 12;
  const n = yrs * 12;
  const f = Math.pow(1 + r, n);
  const byDbr = (avail * (f - 1)) / (r * f);
  return Math.min(byDbr, salary * 12 * 7);
}

const DOCKS = {
  advisor: [
    ['home', '🏠', 'Today'],
    ['clients', '🔒', 'Clients'],
    ['banks', '🏦', '24 Banks'],
    ['calc', '🧮', 'Quote'],
    ['ops', '📍', 'Field'],
  ],
  borrower: [
    ['track', '✨', 'My Loan'],
    ['docs', '📄', 'Upload'],
    ['calc', '🧮', 'Planner'],
  ],
  partner: [
    ['refer', '🤝', 'Refer'],
    ['wallet', '💰', 'Payouts'],
    ['calc', '🧮', 'Pre-Qual'],
  ],
};

function renderDock() {
  const dock = document.getElementById('dock');
  const items = DOCKS[state.mode];
  if (state.mode === 'advisor' && !state.user) {
    dock.innerHTML = '';
    return;
  }
  dock.innerHTML = items
    .map(
      ([id, ico, lbl]) =>
        `<button type="button" class="dock-item ${state.tab === id ? 'active' : ''}" data-tab="${id}"><span class="dock-icon">${ico}</span><span>${lbl}</span></button>`,
    )
    .join('');
}

async function renderAdvisorLogin() {
  const { accounts } = await api('/api/auth/demo-accounts');
  return `
    <div class="hero-banner">
      <img class="bg" src="assets/images/hero-morning-01-2048.webp" alt="Dubai Skyline" />
      <div class="hero-content">
        <div class="eyebrow">Betterway Mobile v2.0 · Advisor App</div>
        <h1 class="hero-title">Sign In &amp; Close More Loans</h1>
        <p class="hero-sub">Today's tasks, masked client calls, 12-step deals, 24 UAE banks &amp; Field GPS in one tap.</p>
      </div>
    </div>
    <div class="card stack-sm">
      <div class="eyebrow">1-Tap Official Betterway Team Sign In</div>
      ${accounts
        .map(
          (a) => `
        <button type="button" class="card staff-btn row-between" data-quick-login="${esc(a.email)}">
          <div class="flex-row">
            ${
              a.avatar
                ? `<img class="avatar" src="assets${esc(a.avatar)}" alt="${esc(a.name)}" />`
                : `<div class="avatar-fallback">${esc(a.initials)}</div>`
            }
            <div class="min-w-0">
              <div class="title-13 truncate">${esc(a.name)}</div>
              <div class="muted truncate">${esc(a.designation)}</div>
            </div>
          </div>
          <span class="chip">Sign In →</span>
        </button>`,
        )
        .join('')}
    </div>
  `;
}

function renderAdvisorHome() {
  const k = state.dashboard?.kpis || {};
  const u = state.user;
  const openTasks = state.tasks.filter((t) => t.status !== 'Done');
  const topBanks = state.banks.slice(0, 8);
  return `
    <div class="hero-banner">
      <img class="bg" src="assets/images/hero-dubai-residence.webp" alt="Dubai" />
      <div class="hero-content">
        <div class="row-between">
          <div>
            <div class="eyebrow">Betterway Dubai · ${esc(u.designation)}</div>
            <h1 class="hero-title">Hi ${esc(u.name.split(' ')[0])}, let's close today</h1>
          </div>
          ${
            u.avatar
              ? `<img class="avatar" src="assets${esc(u.avatar)}" alt="${esc(u.name)}" />`
              : `<div class="avatar-fallback">${esc(u.initials)}</div>`
          }
        </div>
        <p class="hero-sub">3M Bank Rate: <b>${state.eibor?.latest?.threeMonth?.toFixed(3) || '4.207'}%</b> · SWK Sister Brand Bridge Live</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box"><div class="kpi-label">Active Loan Book</div><div class="kpi-val">${aed(k.totalPipelineLoanAed, true)}</div></div>
      <div class="kpi-box"><div class="kpi-label">Expected Commission</div><div class="kpi-val em">${aed(k.projectedDsaAed, true)}</div></div>
      <div class="kpi-box"><div class="kpi-label">Tasks To Finish</div><div class="kpi-val">${openTasks.length}</div></div>
      <div class="kpi-box"><div class="kpi-label">My Vault Clients</div><div class="kpi-val em">${state.vaultLeads.length}</div></div>
    </div>

    <div class="card stack-sm">
      <div class="row-between">
        <div>
          <div class="eyebrow">Do First Today</div>
          <b class="title-14">My Action Checklist</b>
        </div>
        <span class="chip">${openTasks.length} open</span>
      </div>
      ${state.tasks
        .slice(0, 5)
        .map((t) => {
          const isDone = t.status === 'Done';
          return `
        <div class="task-row ${isDone ? 'done' : ''}">
          <div class="flex-row">
            <button type="button" class="task-check ${isDone ? 'checked' : ''}" data-toggle-task="${esc(t.id)}|${isDone ? 'To do' : 'Done'}">${isDone ? '✓' : ''}</button>
            <div class="min-w-0">
              <div class="title-13 truncate ${isDone ? 'line-through' : ''}">${esc(t.title)}</div>
              <div class="muted">${esc(t.due_date || 'Today')} · ${esc(t.priority || 'Normal')} ${t.case_code ? `· ${esc(t.case_code)}` : ''}</div>
            </div>
          </div>
          <span class="chip ${t.priority === 'Urgent' ? 'red' : t.priority === 'High' ? 'gold' : ''}">${esc(t.priority || 'Normal')}</span>
        </div>`;
        })
        .join('') || '<div class="muted">All tasks finished for today!</div>'}
    </div>

    <div class="card stack-sm">
      <div class="row-between">
        <b class="title-13">Top Partner UAE Banks (24 Live)</b>
        <button type="button" class="btn-outline" data-tab="banks">All 24 →</button>
      </div>
      <div class="brand-strip">
        ${topBanks
          .map((b) => `<div class="brand-pill" title="${esc(b.name)}"><img src="assets${esc(b.logo)}" alt="${esc(b.short)}" /></div>`)
          .join('')}
      </div>
    </div>

    <div class="action-pair">
      <button type="button" class="btn-primary" data-tab="clients">🔒 Call My Clients</button>
      <button type="button" class="btn-gold" data-tab="ops">📍 Start Field Visit</button>
    </div>

    <button type="button" class="btn-outline" id="btn-logout">Sign Out (${esc(u.email)})</button>
  `;
}

function renderAdvisorClients() {
  return `
    <div class="seg-bar">
      <button type="button" class="seg-btn ${state.clientsSub === 'vault' ? 'active' : ''}" data-clients-sub="vault">🔒 My Vault Clients (${state.vaultLeads.length})</button>
      <button type="button" class="seg-btn ${state.clientsSub === 'deals' ? 'active' : ''}" data-clients-sub="deals">📋 12-Step Deals (${state.cases.length})</button>
    </div>

    ${
      state.clientsSub === 'vault'
        ? `
      <div class="card">
        <div class="eyebrow">Safe Client Protection (Zero Number Leak)</div>
        <b class="title-15">Your Assigned Buyers</b>
        <div class="muted mt-2">Phone numbers stay hidden automatically. Tap Call or WhatsApp below and your activity saves immediately.</div>
      </div>
      ${state.vaultLeads
        .map(
          (l) => `
        <div class="card stack-sm">
          <div class="row-between">
            <div>
              <span class="mono fs-11 text-em fw-700">${esc(l.vault_code)}</span>
              <div class="title-14">${esc(l.client_name)}</div>
            </div>
            <span class="chip ${l.vault_status === 'In Progress' ? '' : 'gold'}">${esc(l.vault_status)}</span>
          </div>
          <div class="muted">${esc(l.community || 'Dubai')} · ${esc(l.project_unit || 'Property')} · Loan ${aed(l.target_loan_aed, true)}</div>
          <div class="row-between">
            <span class="mono fs-12 text-gold">${esc(l.masked_phone)}</span>
            <span class="muted">${(l.calls_count || 0) + (l.wa_count || 0)} calls/WA logged</span>
          </div>
          <div class="action-pair divider-top">
            <button type="button" class="btn-outline btn-em" data-vault-action="${esc(l.id)}|call|${esc(l.client_name)}">📞 Masked Call</button>
            <button type="button" class="btn-outline" data-vault-action="${esc(l.id)}|whatsapp|${esc(l.client_name)}">💬 WhatsApp</button>
          </div>
        </div>`,
        )
        .join('') || '<div class="card muted">No assigned Vault clients yet. Ask your manager to assign leads from Client Vault.</div>'}
    `
        : `
      <div class="card">
        <div class="eyebrow">Step 1 to Step 12 Mortgage Tracker</div>
        <b class="title-15">Active Home Loan Deals (${state.cases.length})</b>
      </div>
      ${state.cases
        .map(
          (c) => `
        <div class="card stack-sm">
          <div class="row-between">
            <div>
              <span class="mono fs-11 text-em fw-700">${esc(c.case_code)}</span>
              <div class="title-14">${esc(c.borrower_name)}</div>
            </div>
            ${c.is_swk_relay ? '<span class="chip gold">SWK Referral</span>' : `<span class="chip">${esc(c.borrower_profile)}</span>`}
          </div>
          <div class="muted">${esc(c.mortgage_type)} · ${esc(c.project_name)} (${esc(c.community)})</div>
          <div class="row-between">
            <span class="mono fs-125 fw-700">${aed(c.requested_loan_aed)}</span>
            <span class="mono muted">LTV ${c.ltv_pct}% · DBR ${c.dbr_pct}%</span>
          </div>
          <div class="muted fs-11">Next step: ${esc(c.next_action)}</div>
          <div class="row-between divider-top">
            <span class="chip">${esc(c.stage_code.replace(/_/g, ' '))}</span>
            <button type="button" class="btn-outline" data-quick-call="${esc(c.borrower_name)}|${esc(c.borrower_phone)}">📞 Safe Call</button>
          </div>
        </div>`,
        )
        .join('')}
    `
    }
  `;
}

function renderBanksPanel() {
  const filtered = state.banks.filter((b) => {
    if (state.bankFilter === 'Islamic') return b.type === 'Islamic' || b.type === 'Dual';
    if (state.bankFilter === 'Conventional') return b.type === 'Conventional';
    if (state.bankFilter === 'LowDoc') return Boolean(b.lowDocSupported);
    if (state.bankFilter === 'NonRes') return Boolean(b.nonResidentSupported);
    return true;
  });
  return `
    <div class="card">
      <div class="eyebrow">All 24 Official Partner UAE Banks</div>
      <b class="title-16">Compare Rates &amp; Speed (${filtered.length} shown)</b>
      <div class="muted mt-2">Official 3M EIBOR: ${state.eibor?.latest?.threeMonth?.toFixed(3) || '4.207'}% (${esc(state.eibor?.asOfDate || '2026-11-06')})</div>
    </div>
    <div class="filter-pills">
      ${[
        ['all', 'All 24'],
        ['Islamic', 'Islamic'],
        ['Conventional', 'Conventional'],
        ['LowDoc', 'Self-Employed / Low-Doc'],
        ['NonRes', 'Non-Resident'],
      ]
        .map(
          ([k, lbl]) =>
            `<button type="button" class="filter-pill ${state.bankFilter === k ? 'active' : ''}" data-bank-filter="${k}">${lbl}</button>`,
        )
        .join('')}
    </div>
    ${filtered
      .map(
        (b) => `
      <div class="card row-between">
        <div class="flex-row">
          <div class="bank-chip-logo"><img src="assets${esc(b.logo)}" alt="${esc(b.name)}" /></div>
          <div class="min-w-0">
            <div class="title-13 truncate">${esc(b.name)}</div>
            <div class="muted">${esc(b.type)} · ${b.slaDays}d approval · Bank pays ${b.dsaRatePct}%</div>
          </div>
        </div>
        <div class="text-end">
          <div class="mono fw-800 text-em">${b.indicativeFixed3Y.toFixed(2)}%</div>
          <div class="muted fs-10">3Y Fixed*</div>
        </div>
      </div>`,
      )
      .join('')}
  `;
}

function renderCalculator() {
  const c = state.calc;
  const loan = Math.max(0, c.price * (1 - c.downPct / 100));
  const emiVal = calcEmi(loan, c.rate, c.years);
  const maxLoan = calcMaxLoan(c.salary, c.emis, c.cards, c.years);
  const dld = c.price * 0.04 + 580 + loan * 0.0025 + 290 + 4200 + 3150;
  const cashTotal = c.price * (c.downPct / 100) + dld;
  const stressedEmi = calcEmi(loan, 6.5, c.years);
  const dbrPct = c.salary > 0 ? ((c.emis + c.cards * 0.05 + stressedEmi) / c.salary) * 100 : 100;

  return `
    <div class="card calc-hero">
      <div class="eyebrow">UAE Central Bank Safe Borrowing Check</div>
      <div class="row-between mt-8">
        <div>
          <div class="muted">Estimated Monthly Payment</div>
          <div class="mono fs-24 fw-800 text-em">${aed(emiVal)}/mo</div>
        </div>
        <span class="chip ${dbrPct <= 50 ? '' : 'red'}">${dbrPct <= 50 ? 'Safe' : 'Over Limit'} · ${dbrPct.toFixed(1)}% / 50%</span>
      </div>
      <div class="kpi-grid mt-12">
        <div class="calc-box">
          <div class="kpi-label">Max Client Can Borrow</div>
          <div class="mono fw-700 text-gold mt-2">${aed(maxLoan, true)}</div>
        </div>
        <div class="calc-box">
          <div class="kpi-label">Upfront Cash Needed</div>
          <div class="mono fw-700 text-white mt-2">${aed(cashTotal, true)}</div>
        </div>
      </div>
    </div>

    <div class="card stack-sm">
      <div><label class="field-label">Home Price (AED)</label><input type="number" step="50000" class="input mono" data-calc="price" value="${c.price}" /></div>
      <div class="kpi-grid">
        <div><label class="field-label">Down Payment % (Loan ${100 - c.downPct}%)</label><input type="number" class="input mono" data-calc="downPct" value="${c.downPct}" /></div>
        <div><label class="field-label">Bank Rate (%)</label><input type="number" step="0.05" class="input mono" data-calc="rate" value="${c.rate}" /></div>
      </div>
      <div class="kpi-grid">
        <div><label class="field-label">Monthly Salary (AED)</label><input type="number" step="2000" class="input mono" data-calc="salary" value="${c.salary}" /></div>
        <div><label class="field-label">Loan Years</label><input type="number" class="input mono" data-calc="years" value="${c.years}" /></div>
      </div>
      <div class="kpi-grid">
        <div><label class="field-label">Other Monthly Loans</label><input type="number" class="input mono" data-calc="emis" value="${c.emis}" /></div>
        <div><label class="field-label">Total Credit Card Limits</label><input type="number" class="input mono" data-calc="cards" value="${c.cards}" /></div>
      </div>
    </div>
  `;
}

function renderOpsField() {
  const activeField = state.fieldSessions.filter((s) => s.status === 'Active' || s.status === 'SOS');
  return `
    <div class="card stack-sm">
      <div class="eyebrow">Live Field Visits (Bank, Valuation &amp; Trustee)</div>
      <b class="title-15">Start a GPS Field Visit</b>
      <form id="form-field-start" class="stack-sm">
        <select name="purpose" class="select">
          <option value="Bank FOL Signing">Bank FOL Signing</option>
          <option value="Property Valuation Visit">Property Valuation Visit</option>
          <option value="DLD Trustee Transfer">DLD Trustee Transfer</option>
          <option value="Developer Handover Desk">Developer Handover Desk</option>
        </select>
        <input name="community" class="input" required placeholder="Place (e.g. Emirates NBD DIFC / Dubai Hills)" />
        <button type="submit" class="btn-primary">📍 Start GPS Visit Now</button>
      </form>
      ${activeField
        .map(
          (s) => `
        <div class="sub-card stack-sm">
          <div class="row-between">
            <b class="title-13">${esc(s.purpose)}</b>
            <span class="chip ${s.status === 'SOS' ? 'red' : ''}">${esc(s.status)}</span>
          </div>
          <div class="muted">${esc(s.community)} · ${esc(s.user_name)}</div>
          <div class="action-pair">
            <button type="button" class="btn-outline btn-em" data-field-end="${esc(s.id)}">✓ End Visit</button>
            <button type="button" class="btn-danger" data-field-sos="${esc(s.id)}">🚨 SOS Alert</button>
          </div>
        </div>`,
        )
        .join('')}
    </div>

    <div class="card stack-sm">
      <div class="eyebrow">Al Nasr Plaza Office Attendance</div>
      <b class="title-15">Office Check-In &amp; Check-Out</b>
      <p class="muted">Records Dubai time and verified GPS coordinates automatically.</p>
      <div class="action-pair">
        <button type="button" class="btn-primary" id="btn-mobile-checkin">📍 Check In</button>
        <button type="button" class="btn-gold" id="btn-mobile-checkout">🏁 Check Out</button>
      </div>
    </div>

    <form id="form-daily-close" class="card stack-sm">
      <div class="eyebrow">Required Before Shift Ends</div>
      <b class="title-15">End-of-Day Summary &amp; Tomorrow Plan</b>
      <div>
        <label class="field-label">What did you finish today? (min 30 chars)</label>
        <textarea name="summary_today" class="textarea" required placeholder="List client calls completed, bank approvals received, and quotes sent…"></textarea>
      </div>
      <div>
        <label class="field-label">What will you close tomorrow? (min 30 chars)</label>
        <textarea name="plan_tomorrow" class="textarea" required placeholder="List tomorrow valuations, FOL signings, and SWK referrals…"></textarea>
      </div>
      <button type="submit" class="btn-primary">Submit Daily Close &amp; Notify Owner</button>
    </form>
  `;
}

function renderBorrowerTrack() {
  const d = state.borrowerData;
  const order = d ? Number(String(d.case.stage_code).slice(0, 2)) : 1;
  return `
    <div class="hero-banner">
      <img class="bg" src="assets/images/keys-handover.webp" alt="Dubai Home Keys" />
      <div class="hero-content">
        <div class="eyebrow">Betterway Client Tracker</div>
        <h1 class="hero-title">${d ? esc(d.case.borrower_name) : 'Track Your Home Loan'}</h1>
        <p class="hero-sub">${d ? `${esc(d.case.project_name)} · ${aed(d.case.requested_loan_aed)} (${d.case.ltv_pct}% Loan)` : 'Enter your Betterway reference below.'}</p>
      </div>
    </div>

    <form id="form-track-ref" class="card row-between">
      <input name="ref" class="input mono" value="${esc(state.borrowerRef)}" placeholder="BW-2026-M03" />
      <button type="submit" class="btn-outline btn-em">Check</button>
    </form>

    ${
      d
        ? `
      <div class="card">
        <div class="row-between">
          <b>Your 12-Step Loan Progress</b>
          <span class="chip">Step ${order} of 12</span>
        </div>
        <div class="progress-grid">
          ${d.milestones
            .map((m) => `<div class="step-box ${m.order <= order ? 'done' : ''}">${String(m.order).padStart(2, '0')}<br/>${esc(m.label.split(' ')[0])}</div>`)
            .join('')}
        </div>
        <div class="muted mt-10">Next Step: <b class="text-white">${esc(d.case.next_action)}</b></div>
      </div>

      ${
        d.advisor
          ? `<div class="card row-between">
              <div class="flex-row">
                ${d.advisor.avatar ? `<img class="avatar" src="assets${esc(d.advisor.avatar)}" alt="${esc(d.advisor.name)}" />` : `<div class="avatar-fallback">BW</div>`}
                <div>
                  <div class="eyebrow">Your Mortgage Specialist</div>
                  <div class="fw-700">${esc(d.advisor.name)}</div>
                  <div class="muted">${esc(d.advisor.email)}</div>
                </div>
              </div>
              <span class="chip gold">AED 0 Fee</span>
            </div>`
          : ''
      }

      <div class="card stack-sm">
        <b>Your Bank Offers</b>
        ${d.submissions
          .map(
            (s) => `
          <div class="row-between sub-row">
            <div>
              <div class="fw-700">${esc(s.bank_name)}</div>
              <div class="mono muted">${s.rate_pct}% · ${esc(s.product_type)}</div>
            </div>
            <span class="chip">${esc(s.status)}</span>
          </div>`,
          )
          .join('')}
      </div>
    `
        : ''
    }
  `;
}

function renderBorrowerDocs() {
  const docs = state.borrowerData?.documents || [];
  return `
    <div class="card">
      <div class="eyebrow">Safe Document Upload (UAE PDPL)</div>
      <b class="title-15">Documents Needed for Bank Approval</b>
      <div class="muted mt-2">Tap Upload on any missing document to send it straight to your Betterway advisor.</div>
    </div>
    ${docs
      .map(
        (doc) => `
      <div class="card row-between">
        <div class="min-w-0 pr-8">
          <div class="fw-700 fs-125">${esc(doc.doc_name)}</div>
          <div class="muted">${doc.mandatory ? 'Required for Bank Approval' : 'Optional'}</div>
        </div>
        ${
          doc.status === 'Missing'
            ? `<button type="button" class="btn-outline btn-em" data-upload-doc="${esc(doc.id)}">📷 Upload</button>`
            : `<span class="chip ${doc.status === 'Verified' ? '' : 'gold'}">${esc(doc.status)}</span>`
        }
      </div>`,
      )
      .join('')}
  `;
}

function renderPartnerRefer() {
  return `
    <div class="hero-banner">
      <img class="bg" src="assets/images/dubai-waterfront-1280.webp" alt="Dubai Waterfront" />
      <div class="hero-content">
        <div class="eyebrow">Betterway RERA Partner App</div>
        <h1 class="hero-title">Refer a Buyer in 60 Seconds</h1>
        <p class="hero-sub">Lock your agency credit, follow bank approval live, and receive guaranteed partner payouts.</p>
      </div>
    </div>
    <form id="form-partner-refer" class="card stack-sm">
      <div><label class="field-label">Real Estate Agency Name</label><input name="agency_name" class="input" required value="SWK Properties LLC" /></div>
      <div class="kpi-grid">
        <div><label class="field-label">Broker Name</label><input name="agent_name" class="input" required placeholder="Your Name" /></div>
        <div><label class="field-label">RERA BRN #</label><input name="rera_brn" class="input mono" required value="BRN-54210" /></div>
      </div>
      <div><label class="field-label">Buyer Full Name</label><input name="buyer_name" class="input" required placeholder="Client Name" /></div>
      <div class="kpi-grid">
        <div><label class="field-label">Home Price (AED)</label><input name="property_value_aed" type="number" class="input mono" value="2800000" /></div>
        <div><label class="field-label">Loan Needed (AED)</label><input name="target_loan_aed" type="number" class="input mono" value="2240000" /></div>
      </div>
      <button type="submit" class="btn-gold">Lock Referral &amp; Issue Pre-Qual Link</button>
    </form>
  `;
}

function renderPartnerWallet() {
  const list = state.partnerReferrals;
  const estTotal = list.reduce((s, r) => s + Number(r.estimated_payout_aed || 0), 0);
  return `
    <div class="card wallet-hero">
      <div class="eyebrow text-gold">My Partner Payout Wallet</div>
      <div class="mono fs-26 fw-800 text-gold mt-4">${aed(estTotal)}</div>
      <div class="muted">${list.length} active referrals · Paid by Betterway corporate bank transfer</div>
    </div>
    ${list
      .map(
        (r) => `
      <div class="card stack-sm">
        <div class="row-between">
          <b>${esc(r.buyer_name)}</b>
          <span class="chip gold">${aed(r.estimated_payout_aed)}</span>
        </div>
        <div class="muted">${esc(r.agency_name)} · ${esc(r.agent_name)} (${esc(r.referral_code)})</div>
        <div class="row-between">
          <span class="mono muted">${aed(r.target_loan_aed, true)}</span>
          <span class="chip">${esc(r.stage_label)}</span>
        </div>
      </div>`,
      )
      .join('')}
  `;
}

async function hydrateAll() {
  try {
    const bankData = await api('/api/banks');
    state.banks = bankData.banks || [];
    state.eibor = bankData.eibor || null;
  } catch {}
  try {
    state.borrowerData = await api(`/api/v1/public/status?ref=${encodeURIComponent(state.borrowerRef)}`);
  } catch {}
  if (state.token) {
    try {
      const me = await api('/api/auth/me');
      state.user = me.user;
      const [dash, cs, prt, tsk, vlt, fld] = await Promise.all([
        api('/api/dashboard'),
        api('/api/cases'),
        api('/api/partners'),
        api('/api/tasks?scope=all'),
        api('/api/vault/mine'),
        api('/api/field-duty'),
      ]);
      state.dashboard = dash;
      state.cases = cs.cases || [];
      state.partnerReferrals = prt.referrals || [];
      state.tasks = tsk.tasks || [];
      state.vaultLeads = vlt.rows || [];
      state.fieldSessions = fld.sessions || [];
    } catch {
      state.token = '';
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

async function render() {
  const view = document.getElementById('view');
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
  renderDock();

  if (state.mode === 'advisor') {
    if (!state.user) {
      view.innerHTML = await renderAdvisorLogin();
      return;
    }
    if (state.tab === 'home') view.innerHTML = renderAdvisorHome();
    else if (state.tab === 'clients') view.innerHTML = renderAdvisorClients();
    else if (state.tab === 'banks') view.innerHTML = renderBanksPanel();
    else if (state.tab === 'calc') view.innerHTML = renderCalculator();
    else if (state.tab === 'ops') view.innerHTML = renderOpsField();
  } else if (state.mode === 'borrower') {
    if (state.tab === 'track') view.innerHTML = renderBorrowerTrack();
    else if (state.tab === 'docs') view.innerHTML = renderBorrowerDocs();
    else view.innerHTML = renderCalculator();
  } else {
    if (state.tab === 'refer') view.innerHTML = renderPartnerRefer();
    else if (state.tab === 'wallet') view.innerHTML = renderPartnerWallet();
    else view.innerHTML = renderCalculator();
  }
}

async function pollSync() {
  const lbl = document.getElementById('sync-label');
  if (!state.token) return;
  try {
    const res = await api(`/api/sync/changes?since=${state.syncSeq}`);
    lbl.textContent = 'Live';
    if (res.latestSeq > state.syncSeq) {
      const hadSeq = state.syncSeq > 0;
      state.syncSeq = res.latestSeq;
      if (hadSeq && res.changes?.length) {
        await hydrateAll();
        await render();
      }
    }
  } catch {
    lbl.textContent = 'Offline';
  }
}

document.addEventListener('click', async (e) => {
  const modeBtn = e.target.closest('[data-mode]');
  if (modeBtn) {
    state.mode = modeBtn.dataset.mode;
    state.tab = DOCKS[state.mode][0][0];
    await render();
    return;
  }
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab;
    await render();
    return;
  }
  const subBtn = e.target.closest('[data-clients-sub]');
  if (subBtn) {
    state.clientsSub = subBtn.dataset.clientsSub;
    await render();
    return;
  }
  const bankFilterBtn = e.target.closest('[data-bank-filter]');
  if (bankFilterBtn) {
    state.bankFilter = bankFilterBtn.dataset.bankFilter;
    await render();
    return;
  }
  const toggleTaskBtn = e.target.closest('[data-toggle-task]');
  if (toggleTaskBtn) {
    const [id, nextStatus] = toggleTaskBtn.dataset.toggleTask.split('|');
    try {
      await api(`/api/tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await hydrateAll();
      showToast(nextStatus === 'Done' ? 'Task marked done!' : 'Task re-opened');
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const vaultBtn = e.target.closest('[data-vault-action]');
  if (vaultBtn) {
    const [id, kind, clientName] = vaultBtn.dataset.vaultAction.split('|');
    try {
      await api(`/api/vault/${encodeURIComponent(id)}/masked-action`, {
        method: 'POST',
        body: JSON.stringify({ kind, note: `Mobile ${kind} logged for ${clientName}` }),
      });
      await hydrateAll();
      showToast(`${kind === 'call' ? 'Masked Call' : 'WhatsApp'} logged for ${clientName}`);
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const fieldEndBtn = e.target.closest('[data-field-end]');
  if (fieldEndBtn) {
    try {
      await api(`/api/field-duty/${encodeURIComponent(fieldEndBtn.dataset.fieldEnd)}/action`, {
        method: 'POST',
        body: JSON.stringify({ action: 'complete' }),
      });
      await hydrateAll();
      showToast('Field visit completed & saved');
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const fieldSosBtn = e.target.closest('[data-field-sos]');
  if (fieldSosBtn) {
    try {
      await api(`/api/field-duty/${encodeURIComponent(fieldSosBtn.dataset.fieldSos)}/action`, {
        method: 'POST',
        body: JSON.stringify({ action: 'sos' }),
      });
      await hydrateAll();
      showToast('SOS Alert sent to Owner & Admin!', true);
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const quickBtn = e.target.closest('[data-quick-login]');
  if (quickBtn) {
    try {
      const res = await api('/api/auth/quick-role', {
        method: 'POST',
        body: JSON.stringify({ email: quickBtn.dataset.quickLogin }),
      });
      state.token = res.token;
      localStorage.setItem(TOKEN_KEY, res.token);
      await hydrateAll();
      showToast(`Signed in as ${res.user.name}`);
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const callBtn = e.target.closest('[data-quick-call]');
  if (callBtn) {
    const [contact_name, phone] = callBtn.dataset.quickCall.split('|');
    try {
      const res = await api('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ contact_name, phone, outcome: 'Mobile Masked Call', notes: 'Initiated from Betterway Mobile' }),
      });
      showToast(`Masked Call Logged: ${contact_name} (${res.masked_number})`);
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  const upBtn = e.target.closest('[data-upload-doc]');
  if (upBtn) {
    try {
      await api('/api/v1/public/upload-doc', {
        method: 'POST',
        body: JSON.stringify({ docId: upBtn.dataset.uploadDoc, fileName: 'mobile_camera_scan.pdf' }),
      });
      state.borrowerData = await api(`/api/v1/public/status?ref=${encodeURIComponent(state.borrowerRef)}`);
      showToast('Uploaded safely to Betterway Vault!');
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
    return;
  }
  if (e.target.id === 'btn-mobile-checkin') {
    try {
      const qr = await api('/api/attendance/qr-terminal');
      const res = await api('/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({ qrToken: qr.code, mode: 'MOBILE_FIELD_GPS', gpsLat: 25.2361, gpsLng: 55.3114, note: 'Mobile Verified Check-In' }),
      });
      showToast(`Checked In at ${res.dubaiTime} GST`);
      await hydrateAll();
    } catch (err) {
      showToast(err.message, true);
    }
  } else if (e.target.id === 'btn-mobile-checkout') {
    try {
      const res = await api('/api/attendance/checkout', { method: 'POST' });
      showToast(`Checked out at ${res.dubaiTime} GST`);
    } catch (err) {
      showToast(err.message, true);
    }
  } else if (e.target.id === 'btn-logout') {
    state.token = '';
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    showToast('Signed out');
    await render();
  } else if (e.target.id === 'btn-rtl') {
    const isRtl = document.documentElement.dir === 'rtl';
    document.documentElement.dir = isRtl ? 'ltr' : 'rtl';
    e.target.textContent = isRtl ? 'AR' : 'EN';
  } else if (e.target.id === 'btn-lock') {
    document.getElementById('lock-overlay').classList.remove('hidden');
  } else if (e.target.id === 'btn-unlock') {
    document.getElementById('lock-overlay').classList.add('hidden');
    showToast('Biometric unlock verified');
  }
});

document.addEventListener('input', (e) => {
  const key = e.target.dataset?.calc;
  if (key) {
    state.calc[key] = Number(e.target.value || 0);
    render();
  }
});

document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'form-field-start') {
    const fd = new FormData(f);
    try {
      await api('/api/field-duty/start', {
        method: 'POST',
        body: JSON.stringify({
          purpose: fd.get('purpose'),
          community: fd.get('community'),
          lat: 25.2115,
          lng: 55.2812,
        }),
      });
      f.reset();
      await hydrateAll();
      showToast('GPS Field Visit started!');
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
  } else if (f.id === 'form-daily-close') {
    const fd = new FormData(f);
    try {
      await api('/api/daily/report', {
        method: 'POST',
        body: JSON.stringify({
          summary_today: fd.get('summary_today'),
          plan_tomorrow: fd.get('plan_tomorrow'),
          calls_made: 12,
          cases_submitted: 2,
        }),
      });
      f.reset();
      showToast('Daily Close saved — Check-Out unlocked!');
    } catch (err) {
      showToast(err.message, true);
    }
  } else if (f.id === 'form-track-ref') {
    state.borrowerRef = new FormData(f).get('ref') || 'BW-2026-M03';
    try {
      state.borrowerData = await api(`/api/v1/public/status?ref=${encodeURIComponent(state.borrowerRef)}`);
      showToast(`Loaded case ${state.borrowerData.case.case_code}`);
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
  } else if (f.id === 'form-partner-refer') {
    const fd = new FormData(f);
    try {
      const res = await api('/api/partners/referrals', {
        method: 'POST',
        body: JSON.stringify({
          agency_name: fd.get('agency_name'),
          agent_name: fd.get('agent_name'),
          rera_brn: fd.get('rera_brn'),
          buyer_name: fd.get('buyer_name'),
          property_value_aed: Number(fd.get('property_value_aed')),
          target_loan_aed: Number(fd.get('target_loan_aed')),
        }),
      });
      f.reset();
      showToast(`Locked Referral ${res.referral_code} (${aed(res.estimated_payout_aed)} est.)`);
      await hydrateAll();
      state.tab = 'wallet';
      await render();
    } catch (err) {
      showToast(err.message, true);
    }
  }
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

(async () => {
  await hydrateAll();
  await render();
  setInterval(pollSync, 8000);
})();
