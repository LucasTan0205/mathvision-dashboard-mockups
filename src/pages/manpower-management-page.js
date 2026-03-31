import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';
import { Chart } from 'chart.js';
import { sliceRecentRows, transformToChartData } from '/src/lib/mapping-quality-transform.js';

const API_KEY = window.MATHVISION_API_KEY ?? 'dev-key';

/* ── Data ───────────────────────────────────────────────── */

const kpis = [
  { id: 'sparkOpenReq',   label: 'Open requests',   value: '24',  meta: 'Up 12% this week',          badge: '+12%', tone: 'red',   data: [14, 16, 18, 20, 19, 22, 24] },
  { id: 'sparkAutoMatch',  label: 'Auto-matched',    value: '86%', meta: 'Handled within SLA',        badge: '+3%',  tone: 'green', data: [78, 80, 82, 81, 84, 85, 86] },
  { id: 'sparkFillRate',   label: 'Fill rate',       value: '98%', meta: 'Above 95% target',          badge: '+1%',  tone: 'green', data: [95, 96, 97, 96, 97, 98, 98] },
  { id: 'sparkCritAlerts', label: 'Critical alerts',  value: '4',   meta: 'Needs immediate action',    badge: '+2',   tone: 'amber', data: [1, 2, 1, 3, 2, 3, 4] }
];

const actionQueue = [
  { urgency: 'urgent', tag: 'Urgent',  title: '3 night slots unfilled — class in 4 hours',     detail: 'S3 E-Math (19:00), S4 A-Math (19:00), J1 H2 Math (20:00) · 2 relief tutors match',       cta: 'Assign',     icon: 'lightning-charge' },
  { urgency: 'watch',  tag: 'Watch',   title: 'Mr Tan approaching capacity — 96% utilisation',  detail: '18 of 18.75 hrs filled this week · Suggest redistributing Sat PM S2 class to Ms Low',     cta: 'Rebalance',  icon: 'arrow-left-right' },
  { urgency: 'watch',  tag: 'Watch',   title: 'SA1 exam-prep demand spike next week',           detail: 'Projected +12 additional S3-S4 slots vs 4 bench tutors available · Plan relief coverage', cta: 'Plan',       icon: 'calendar-event' },
  { urgency: 'info',   tag: 'Info',    title: 'Saturday morning fully staffed — 16/16 confirmed', detail: 'All P3-P6 and S1-S2 morning slots covered · No action needed',                           cta: 'View',       icon: 'check-circle' }
];

/* ── Student-initials helper ────────────────────────────── */

function getStudentInitials() {
  try {
    const students = JSON.parse(localStorage.getItem('mathvision-students')) || [];
    return students.map(s => {
      const parts = (s.name || '').trim().split(/\s+/);
      return parts.map(w => w[0]).join('').toUpperCase().slice(0, 2);
    });
  } catch { return []; }
}

/* Build shift data, mapping filled slots → student initials */
function buildShifts() {
  const initials = getStudentInitials();
  let idx = 0;
  const next = (filled) => filled && idx < initials.length ? initials[idx++] : '';

  /* Fallback sample initials when no student records exist yet */
  const fallback = [
    'AL','BT','CT','DL','EW','FK','GR','HS','IC','JN','KP','LM','MO','NQ',
    'OC','PH','QS','RA','SB','TD','UL','VK','WJ','XY','ZN','AT','BR','CK',
    'DW','EH','FA','GQ','HB','IJ','JT','KM','LW','MR','NF','OL','PD','QW',
    'RN','SL'
  ];
  let fi = 0;
  const fb = (filled) => filled ? fallback[fi++ % fallback.length] : '';

  const pick = initials.length > 0 ? next : fb;

  return [
    {
      name: 'Morning', status: 'Full', statusTone: 'green', filled: 14, total: 14,
      slots: [
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }
      ]
    },
    {
      name: 'Afternoon', status: 'Full', statusTone: 'green', filled: 16, total: 16,
      slots: [
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }
      ]
    },
    {
      name: 'Evening', status: '3 gaps', statusTone: 'red', filled: 11, total: 14,
      slots: [
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: '', filled: false }, { code: pick(true), filled: true }, { code: pick(true), filled: true },
        { code: '', filled: false }, { code: '', filled: false }, { code: pick(true), filled: true },
        { code: pick(true), filled: true }, { code: pick(true), filled: true }
      ]
    }
  ];
}

const heatmap = [
  //         Mon  Tue  Wed  Thu  Fri  Sat  Sun
  { label: 'AM',  cells: [
    { v: 8, s: 'green' }, { v: 6, s: 'green' }, { v: 7, s: 'green' }, { v: 8, s: 'green' }, { v: 7, s: 'green' }, { v: 14, s: 'amber' }, { v: 4, s: 'green' }
  ]},
  { label: 'PM',  cells: [
    { v: 10, s: 'green' }, { v: 9, s: 'green' }, { v: 10, s: 'green' }, { v: 11, s: 'amber' }, { v: 10, s: 'green' }, { v: 16, s: 'red' }, { v: 6, s: 'green' }
  ]},
  { label: 'Eve', cells: [
    { v: 12, s: 'amber' }, { v: 11, s: 'amber' }, { v: 12, s: 'amber' }, { v: 13, s: 'red' }, { v: 12, s: 'amber' }, { v: 14, s: 'red' }, { v: 0, s: 'green' }
  ]}
];

const reliefPool = [
  { initials: 'JL', name: 'James Lim',    avail: 'Free tonight',  highlight: true },
  { initials: 'SR', name: 'Sarah Rao',    avail: 'Free tonight',  highlight: true },
  { initials: 'KT', name: 'Kevin Tan',    avail: 'Wed–Fri',       highlight: false },
  { initials: 'ML', name: 'Michelle Low', avail: 'Weekends',      highlight: false },
  { initials: 'AP', name: 'Arun Prasad',  avail: 'Thu–Sat',       highlight: false }
];

/* ── Helpers ────────────────────────────────────────────── */

function sparklineColor(tone) {
  if (tone === 'red') return '#E24B4A';
  if (tone === 'green') return '#1D9E75';
  return '#EF9F27';
}

function badgeClass(tone) {
  if (tone === 'red') return 'mp-badge--red';
  if (tone === 'green') return 'mp-badge--green';
  return 'mp-badge--amber';
}

function shiftPct(filled, total) {
  return Math.round((filled / total) * 100);
}

function progressTone(pct) {
  if (pct > 90) return 'green';
  if (pct >= 75) return 'amber';
  return 'red';
}

/* ── Content builder ────────────────────────────────────── */

export function createManpowerManagementContent() {

  /* Section 1 – Actionable Insight Banner */
  const banner = `
    <section class="mp-alert-banner">
      <div class="mp-alert-banner__icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
      <div class="mp-alert-banner__body">
        <p class="mp-alert-banner__title">Evening classes have 3 unfilled slots — 2 relief tutors match</p>
        <p class="mp-alert-banner__detail">S3 E-Math (19:00), S4 A-Math (19:00) &amp; J1 H2 Math (20:00) are uncovered. James Lim and Sarah Rao are available tonight and qualified for these levels.</p>
      </div>
      <div class="mp-alert-banner__actions">
        <button class="btn mp-btn mp-btn--primary" type="button"><i class="bi bi-magic"></i> Auto-assign</button>
        <button class="btn mp-btn mp-btn--secondary" type="button"><i class="bi bi-people"></i> View relief pool</button>
      </div>
    </section>`;

  /* Section 2 – KPI Cards with Sparklines */
  const kpiCards = kpis
    .map(
      (k) => `
      <div class="mp-kpi">
        <p class="mp-kpi__label">${k.label}</p>
        <div class="mp-kpi__row">
          <h3 class="mp-kpi__value">${k.value}</h3>
          <span class="mp-badge ${badgeClass(k.tone)}">${k.badge}</span>
        </div>
        <div class="mp-kpi__spark"><canvas id="${k.id}" aria-label="${k.label} sparkline"></canvas></div>
        <p class="mp-kpi__meta">${k.meta}</p>
      </div>`
    )
    .join('');

  /* Section 3 – Priority Action Queue */
  const queueItems = actionQueue
    .map(
      (a) => `
      <div class="mp-action mp-action--${a.urgency}">
        <span class="mp-action__badge mp-action__badge--${a.urgency}">${a.tag}</span>
        <div class="mp-action__body">
          <p class="mp-action__title">${a.title}</p>
          <p class="mp-action__detail">${a.detail}</p>
        </div>
        <button class="btn mp-btn mp-btn--outline" type="button"><i class="bi bi-${a.icon}"></i> ${a.cta}</button>
      </div>`
    )
    .join('');

  /* Section 4 – Enhanced Shift Coverage Cards */
  const shifts = buildShifts();
  const shiftCards = shifts
    .map((s) => {
      const pct = shiftPct(s.filled, s.total);
      const tone = progressTone(pct);
      const tiles = s.slots
        .map(
          (sl) =>
            `<span class="mp-slot ${sl.filled ? 'mp-slot--filled' : 'mp-slot--empty'}">${sl.code}</span>`
        )
        .join('');
      return `
      <article class="mp-shift">
        <div class="mp-shift__head">
          <h4 class="mp-shift__name">${s.name} Shift</h4>
          <span class="mp-shift__status mp-shift__status--${s.statusTone}">${s.status}</span>
        </div>
        <div class="mp-shift__bar-wrap">
          <div class="mp-shift__bar mp-shift__bar--${tone}" style="width:${pct}%"></div>
        </div>
        <p class="mp-shift__fraction">${s.filled} / ${s.total} filled <span class="text-${s.statusTone === 'red' ? 'danger' : 'success'}">${s.total - s.filled === 0 ? '' : `· ${s.total - s.filled} gaps`}</span></p>
        <div class="mp-shift__tiles">${tiles}</div>
      </article>`;
    })
    .join('');

  /* Section 5A – Demand Heatmap */
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatRows = heatmap
    .map(
      (row) => `
      <tr>
        <th class="mp-heat__label">${row.label}</th>
        ${row.cells.map((c) => `<td class="mp-heat__cell mp-heat__cell--${c.s}">${c.v}</td>`).join('')}
      </tr>`
    )
    .join('');

  /* Section 5B – Relief Pool */
  const reliefItems = reliefPool
    .map(
      (r) => `
      <div class="mp-relief__item">
        <span class="mp-relief__avatar">${r.initials}</span>
        <div class="mp-relief__info">
          <p class="mp-relief__name">${r.name}</p>
        </div>
        <span class="mp-relief__avail ${r.highlight ? 'mp-relief__avail--now' : ''}">${r.avail}</span>
      </div>`
    )
    .join('');

  /* Section 6 – Tutor-to-Student Mapping Quality */
  const mappingChart = `
    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Capability planning</p>
          <h3 class="panel-title">Tutor-to-student mapping quality</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-diagram-3"></i> Past 7 days</span>
      </div>
      <div class="mp-chart-legend">
        <span class="mp-chart-legend__item mp-chart-legend__item--green"><i></i> Mapping quality</span>
        <span class="mp-chart-legend__item mp-chart-legend__item--amber"><i></i> 90% target</span>
      </div>
      <div class="chart-card">
        <div class="chart-card__canvas chart-card__canvas--tall">
          <canvas id="skillMappingChart" aria-label="Mapping quality chart"></canvas>
        </div>
      </div>
    </section>`;

  /* Section 7 – Tutor Student Pairing Graph */
  const pairingGraph = `
    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Matching analytics</p>
          <h3 class="panel-title">Tutor Student Pairing</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-graph-up"></i> Past 7 days</span>
      </div>
      <div class="chart-card">
        <div class="chart-card__canvas chart-card__canvas--tall" id="pairingChartContainer">
          <canvas id="pairingChart" aria-label="Daily average satisfaction scores chart"></canvas>
        </div>
      </div>
    </section>`;

  /* Section 8 – Tutor Utilisation Panel */
  const utilisationPanel = `
    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Workforce</p>
          <h3 class="panel-title">Tutor Utilisation</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-people"></i> Live</span>
      </div>
      <div id="utilisationPanel"></div>
    </section>`;

  /* ── Assemble ─────────────────────────────────────────── */

  return `
    ${banner}

    <section class="mp-kpi-grid">${kpiCards}</section>

    <section class="mp-queue">
      <div class="mp-queue__header">
        <div>
          <p class="panel-label">Operations</p>
          <h3 class="panel-title">Priority action queue</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-sort-down"></i> Sorted by urgency</span>
      </div>
      ${queueItems}
    </section>

    <section class="mp-shifts-section">
      <div class="mp-shifts-section__header">
        <div>
          <p class="panel-label">Live coverage</p>
          <h3 class="panel-title">Shift coverage</h3>
        </div>
        <button class="btn mp-btn mp-btn--outline" id="viewTimetableBtn" type="button">
          <i class="bi bi-calendar3"></i> View all timetables
        </button>
      </div>
      <div class="mp-shifts-grid">${shiftCards}</div>
    </section>

    <!-- Timetable modal -->
    <div class="mp-timetable-overlay" id="timetableOverlay" role="dialog" aria-modal="true" aria-label="Timetable">
      <div class="mp-timetable-modal">
        <div class="mp-timetable-modal__header">
          <div>
            <p class="panel-label">Schedule</p>
            <h3 class="panel-title" id="timetableTitle">All Timetables</h3>
          </div>
          <button class="mp-timetable-modal__close" id="timetableClose" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="mp-timetable-modal__filters">
          <button class="mp-tt-filter mp-tt-filter--active" data-slot="">All days</button>
          <button class="mp-tt-filter" data-slot="Mon">Monday</button>
          <button class="mp-tt-filter" data-slot="Tue">Tuesday</button>
          <button class="mp-tt-filter" data-slot="Wed">Wednesday</button>
          <button class="mp-tt-filter" data-slot="Thu">Thursday</button>
          <button class="mp-tt-filter" data-slot="Fri">Friday</button>
          <button class="mp-tt-filter" data-slot="Sat">Saturday</button>
          <button class="mp-tt-filter" data-slot="Sun">Sunday</button>
        </div>
        <div class="mp-timetable-modal__body" id="timetableBody">
          <div class="mp-timetable-loading"><i class="bi bi-arrow-repeat mp-spin"></i> Loading pairings…</div>
        </div>
      </div>
    </div>

    <section class="mp-dual">
      <div class="mp-dual__left">
        <div class="mp-dual__header">
          <div>
            <p class="panel-label">Forward planning</p>
            <h3 class="panel-title">7-day demand heatmap</h3>
          </div>
          <select id="demandBranchSelect" class="mp-branch-select" aria-label="Filter by branch">
            <option value="">All Branches</option>
            <option value="Central">Central</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>
        <div id="demand-warning-container"></div>
        <div class="mp-heat-wrap">
          <table class="mp-heat">
            <thead>
              <tr><th></th>${days.map((d) => `<th class="mp-heat__day">${d}</th>`).join('')}</tr>
            </thead>
            <tbody>${heatRows}</tbody>
          </table>
        </div>
        <div class="mp-heat-legend">
          <span class="mp-heat-legend__item mp-heat-legend__item--green">Covered</span>
          <span class="mp-heat-legend__item mp-heat-legend__item--amber">Tight</span>
          <span class="mp-heat-legend__item mp-heat-legend__item--red">At risk</span>
          <span class="mp-heat-legend__item mp-heat-legend__item--peak">Peak</span>
        </div>
      </div>
      <div class="mp-dual__right">
        <div class="mp-dual__header">
          <div>
            <p class="panel-label">Available bench</p>
            <h3 class="panel-title">Relief pool</h3>
          </div>
          <span class="mp-badge mp-badge--green">${reliefPool.length} on standby</span>
        </div>
        ${reliefItems}
      </div>
    </section>

    <div id="demand-recommendations"></div>

    ${mappingChart}

    ${pairingGraph}

    ${utilisationPanel}
  `;
}

/* ── Chart initialisation ───────────────────────────────── */

function mountSparkline(id, data, tone) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const color = sparklineColor(tone);
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 0,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

/* ── Peak Demand Prediction – fetch, heatmap & recommendations ── */

const DEMAND_LS_BRANCH_KEY = 'mathvision-demand-branch';
const DEMAND_POLL_MS = 5 * 60 * 1000; // 5 minutes
const DEMAND_TIMEOUT_MS = 60_000; // Prophet fitting can take 20–30s on first run

let _lastDemandData = null;
let _demandPollTimer = null;
let _demandAbortCtrl = null;

/** Colour a cell based on score and threshold */
export function demandCellColour(score, threshold) {
  if (score >= threshold) return 'red';
  if (score >= 0.5) return 'amber';
  return 'green';
}

/** Urgency class for recommendation items */
export function demandUrgencyClass(score) {
  return score >= 0.9 ? 'urgent' : 'watch';
}

/** Show loading skeleton in the heatmap tbody */
function showHeatmapSkeleton() {
  const tbody = document.querySelector('.mp-heat tbody');
  if (!tbody) return;
  const days = 7;
  const slots = ['AM', 'PM', 'Eve'];
  tbody.innerHTML = slots.map(label => `
    <tr>
      <th class="mp-heat__label">${label}</th>
      ${Array.from({ length: days }, () => `<td class="mp-heat__cell"><div class="mp-skeleton mp-skeleton--cell"></div></td>`).join('')}
    </tr>
  `).join('');
  // Show a non-alarming loading note
  showDemandWarning('Calculating demand forecast — this may take up to 30 seconds on first load…');
}

/** Show or hide the warning banner */
function showDemandWarning(msg) {
  const container = document.getElementById('demand-warning-container');
  if (!container) return;
  if (!msg) { container.innerHTML = ''; return; }
  container.innerHTML = `<div class="mp-demand-warning"><i class="bi bi-exclamation-circle-fill"></i> ${msg}</div>`;
}

/** Render live heatmap from DemandPredictionResponse */
function renderLiveHeatmap(data) {
  const tbody = document.querySelector('.mp-heat tbody');
  if (!tbody || !data || !data.demand_matrix) return;

  const threshold = data.peak_threshold ?? 0.75;
  const slotLabels = ['AM', 'PM', 'Eve'];

  // demand_matrix is 3 rows (morning/afternoon/evening) × 7 cols (Mon–Sun)
  const rows = data.demand_matrix;
  tbody.innerHTML = rows.map((row, ri) => {
    const label = slotLabels[ri] || `Slot${ri}`;
    const cells = row.map(cell => {
      const colour = demandCellColour(cell.demand_score, threshold);
      const isPeak = cell.is_peak;
      const peakClass = isPeak ? ' mp-heat__cell--peak' : '';
      const icon = isPeak ? ' <i class="bi bi-exclamation-triangle-fill"></i>' : '';

      // Plain-language demand label for cell display
      const demandLabel = cell.demand_score >= threshold
        ? 'Very high'
        : cell.demand_score >= 0.5
          ? 'High'
          : cell.demand_score >= 0.25
            ? 'Moderate'
            : 'Low';

      // Find matching recommendation for tooltip
      const rec = (data.recommendations || []).find(
        r => r.day_of_week === cell.day_of_week && r.time_slot === cell.time_slot
      );

      // Tooltip: technical detail for those who want it
      const tipParts = [`Forecast: ~${cell.raw_session_count} sessions`, `Demand score: ${cell.demand_score.toFixed(2)}`];
      if (cell.forecast_lower != null && cell.forecast_upper != null) {
        tipParts.push(`Range: ${Math.round(cell.forecast_lower)}–${Math.round(cell.forecast_upper)}`);
      }
      if (isPeak && rec) tipParts.push(`Suggest ${rec.recommended_additional_tutors} extra tutor${rec.recommended_additional_tutors > 1 ? 's' : ''}`);
      const tooltipAttr = ` data-demand-tip="${tipParts.join(' · ')}"`;


      return `<td class="mp-heat__cell mp-heat__cell--${colour}${peakClass}"${tooltipAttr}>${demandLabel}${icon}</td>`;
    }).join('');
    return `<tr><th class="mp-heat__label">${label}</th>${cells}</tr>`;
  }).join('');

  // Attach tooltip behaviour
  _attachHeatmapTooltips();

  showDemandWarning(null);
}

/** Tooltip hover logic for peak cells */
function _attachHeatmapTooltips() {
  // Remove any existing tooltip
  document.querySelectorAll('.mp-heat__tooltip').forEach(el => el.remove());

  const tooltip = document.createElement('div');
  tooltip.className = 'mp-heat__tooltip';
  document.body.appendChild(tooltip);

  document.querySelectorAll('[data-demand-tip]').forEach(cell => {
    cell.style.position = 'relative';
    cell.addEventListener('mouseenter', () => {
      tooltip.textContent = cell.getAttribute('data-demand-tip');
      const rect = cell.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 6 + window.scrollY}px`;
      tooltip.classList.add('mp-heat__tooltip--visible');
    });
    cell.addEventListener('mouseleave', () => {
      tooltip.classList.remove('mp-heat__tooltip--visible');
    });
  });
}

/** Render recommendations panel */
function renderRecommendations(data) {
  const container = document.getElementById('demand-recommendations');
  if (!container) return;

  const recs = data && data.recommendations ? data.recommendations : [];

  let itemsHtml;
  if (recs.length === 0) {
    itemsHtml = `<p class="mp-ramp-panel__empty">No peak periods predicted for the current dataset.</p>`;
  } else {
    itemsHtml = recs.map(rec => {
      const urgency = demandUrgencyClass(rec.demand_score);
      const urgencyLabel = urgency === 'urgent' ? 'Urgent' : 'Watch';
      const slotLabel = rec.time_slot.charAt(0).toUpperCase() + rec.time_slot.slice(1);
      const demandPct = Math.round(rec.demand_score * 100);
      return `
        <div class="mp-ramp-panel__item mp-ramp-panel__item--${urgency}" data-ramp-expand>
          <div class="mp-ramp-panel__item-head">
            <span class="mp-ramp-panel__item-badge">${urgencyLabel}</span>
            <div class="mp-ramp-panel__item-body">
              <p class="mp-ramp-panel__item-title">${rec.day_label} ${slotLabel} — ${demandPct}% of peak capacity</p>
              <p class="mp-ramp-panel__item-meta">Suggest ${rec.recommended_additional_tutors} extra tutor${rec.recommended_additional_tutors > 1 ? 's' : ''} for this slot</p>
            </div>
          </div>
          <div class="mp-ramp-panel__item-detail">
            Based on ${rec.raw_session_count} past sessions in this slot — recent sessions weighted more heavily
            <span class="mp-ramp-panel__item-technical">Demand score: ${rec.demand_score.toFixed(2)} · Weighted count: ${rec.weighted_session_count.toFixed(2)}</span>
          </div>
        </div>`;
    }).join('');
  }

  container.innerHTML = `
    <section class="mp-ramp-panel">
      <div class="mp-ramp-panel__header">
        <div>
          <p class="panel-label">Predictions</p>
          <h3 class="panel-title">Predicted Peak Demand</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-graph-up-arrow"></i> AI-driven</span>
      </div>
      ${itemsHtml}
    </section>`;

  // Attach expand/collapse
  container.querySelectorAll('[data-ramp-expand]').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('mp-ramp-panel__item--expanded');
    });
  });
}

/** Fetch demand data from API */
async function fetchDemandData(branch) {
  // Abort any in-flight request
  if (_demandAbortCtrl) _demandAbortCtrl.abort();
  _demandAbortCtrl = new AbortController();

  const timeoutId = setTimeout(() => _demandAbortCtrl.abort(), DEMAND_TIMEOUT_MS);

  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  const qs = params.toString();
  const url = `/demand/predict${qs ? '?' + qs : ''}`;

  try {
    showHeatmapSkeleton();
    const res = await fetch(url, {
      headers: { 'X-API-Key': API_KEY },
      signal: _demandAbortCtrl.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _lastDemandData = data;

    renderLiveHeatmap(data);
    renderRecommendations(data);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[DemandPredict] request aborted/timed out');
    } else {
      console.warn('[DemandPredict] fetch failed:', err);
    }
    showDemandWarning('Demand data unavailable — showing last known data');

    // Restore last data if available, otherwise keep static fallback
    if (_lastDemandData) {
      renderLiveHeatmap(_lastDemandData);
      renderRecommendations(_lastDemandData);
    }
  }
}

/** Initialise demand prediction: branch selector, fetch, polling */
function initDemandPrediction() {
  const select = document.getElementById('demandBranchSelect');

  // Restore saved branch
  const savedBranch = localStorage.getItem(DEMAND_LS_BRANCH_KEY) || '';
  if (select) select.value = savedBranch;

  // Initial fetch
  fetchDemandData(savedBranch || null);

  // Branch change handler
  if (select) {
    select.addEventListener('change', () => {
      const branch = select.value;
      localStorage.setItem(DEMAND_LS_BRANCH_KEY, branch);
      fetchDemandData(branch || null);
    });
  }

  // 5-minute polling
  if (_demandPollTimer) clearInterval(_demandPollTimer);
  _demandPollTimer = setInterval(() => {
    const branch = select ? select.value : '';
    fetchDemandData(branch || null);
  }, DEMAND_POLL_MS);
}

export function initManpowerManagementCharts() {
  /* Sparklines */
  kpis.forEach((k) => mountSparkline(k.id, k.data, k.tone));

  /* Peak Demand Prediction */
  initDemandPrediction();

  /* Section 6 – Mapping quality line chart (live data) */
  (async () => {
    const canvas = document.getElementById('skillMappingChart');
    const container = canvas ? canvas.closest('.chart-card__canvas') : null;

    const targetDataset = {
      label: '90% target',
      data: [],
      borderColor: '#EF9F27',
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 0,
      fill: false
    };

    const LS_TIMESERIES_KEY = 'mathvision-mapping-quality-timeseries';

    function renderChart(rows) {
      const slice = sliceRecentRows(rows);
      const { labels, values } = transformToChartData(slice);
      const targetValues = slice.map(() => 90);
      // Re-query canvas at render time in case the DOM was mutated
      const liveCanvas = document.getElementById('skillMappingChart');
      if (!liveCanvas) return;
      mountChart('skillMappingChart', {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Mapping quality',
              data: values,
              borderColor: '#1D9E75',
              backgroundColor: 'rgba(29, 158, 117, 0.10)',
              pointBackgroundColor: '#1D9E75',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              tension: 0.32,
              fill: true
            },
            { ...targetDataset, data: targetValues }
          ]
        },
        options: {
          ...baseChartOptions,
          plugins: {
            ...baseChartOptions.plugins,
            legend: { display: false }
          },
          scales: {
            x: { ...baseChartOptions.scales.x },
            y: {
              ...baseChartOptions.scales.y,
              min: 50,
              max: 100,
              ticks: {
                ...baseChartOptions.scales.y.ticks,
                callback: (v) => `${v}%`
              }
            }
          }
        }
      });
    }

    try {
      const res = await fetch('/analytics/mapping-quality-timeseries', {
        headers: { 'X-API-Key': API_KEY }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();

      if (rows.length === 0) {
        if (container) container.innerHTML = '<p class="mp-no-data">No data available</p>';
        return;
      }

      try { localStorage.setItem(LS_TIMESERIES_KEY, JSON.stringify(rows)); } catch { /* silent */ }
      renderChart(rows);
    } catch (err) {
      console.warn('[MappingQualityChart] fetch failed:', err);
      const cached = (() => { try { return JSON.parse(localStorage.getItem(LS_TIMESERIES_KEY)); } catch { return null; } })();
      if (cached && cached.length > 0) {
        console.info('[MappingQualityChart] rendering from cache', cached.length, 'rows');
        renderChart(cached);
      } else {
        if (container) container.innerHTML = '<p class="mp-error-state">Could not load mapping quality data</p>';
      }
    }
  })();

  /* Expand / collapse action items */
  document.querySelectorAll('.mp-action').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      el.classList.toggle('mp-action--expanded');
    });
  });

  /* Section 7 – Tutor Student Pairing graph (Task 10.1) */
  function initPairingGraph() {
    let backoffDelay = 5000;
    const MAX_BACKOFF = 30000;
    let pollTimer = null;

    async function fetchAndRender() {
      try {
        const res = await fetch('/matching/stats/daily', {
          headers: { 'X-API-Key': API_KEY }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Reset back-off on success
        backoffDelay = 5000;

        const container = document.getElementById('pairingChartContainer');

        // Filter out days with no data (omit zero values per requirement 9.5)
        const filtered = (data || []).filter(d => d.pairing_count > 0 && d.avg_satisfaction_score > 0);

        if (filtered.length === 0) {
          if (container) container.innerHTML = '<p class="mp-no-data">No pairing data available yet</p>';
          return;
        }

        // Show at minimum the most recent 7 days
        const recent = filtered.slice(-7);

        mountChart('pairingChart', {
          type: 'line',
          data: {
            labels: recent.map(d => d.date),
            datasets: [{
              label: 'Avg Satisfaction Score',
              data: recent.map(d => d.avg_satisfaction_score),
              borderColor: '#1D9E75',
              backgroundColor: 'rgba(29, 158, 117, 0.10)',
              pointBackgroundColor: '#1D9E75',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              tension: 0.32,
              fill: true
            }]
          },
          options: {
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              legend: { display: false }
            },
            scales: {
              x: { ...baseChartOptions.scales.x },
              y: {
                ...baseChartOptions.scales.y,
                min: 0,
                max: 100,
                ticks: {
                  ...baseChartOptions.scales.y.ticks,
                  callback: (v) => `${v}`
                }
              }
            }
          }
        });
      } catch (err) {
        console.warn('[PairingGraph] fetch failed:', err);
        // Exponential back-off on failure (max 30 s)
        backoffDelay = Math.min(backoffDelay * 2, MAX_BACKOFF);
        clearInterval(pollTimer);
        pollTimer = setTimeout(() => {
          fetchAndRender();
          pollTimer = setInterval(fetchAndRender, 5000);
        }, backoffDelay);
        return;
      }
    }

    fetchAndRender();
    pollTimer = setInterval(fetchAndRender, 5000);
  }

  /* Section 8 – Tutor Utilisation panel (Task 10.2) */
  function initUtilisationPanel() {
    const BADGE_COLORS = {
      'Appropriately-utilised': '#1D9E75',
      'Under-utilised': '#EF9F27',
      'Over-utilised': '#E24B4A'
    };

    async function fetchAndRender() {
      try {
        const res = await fetch('/matching/tutors/utilisation', {
          headers: { 'X-API-Key': API_KEY }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const panel = document.getElementById('utilisationPanel');
        if (!panel) return;

        if (!data || data.length === 0) {
          panel.innerHTML = '<p class="mp-no-data">No tutor data available yet</p>';
          return;
        }

        panel.innerHTML = data.map(tutor => {
          const color = BADGE_COLORS[tutor.utilisation_status] || '#45504a';
          return `
            <div class="mp-relief__item">
              <div class="mp-relief__info">
                <p class="mp-relief__name">${tutor.name}</p>
              </div>
              <span class="mp-relief__avail">${tutor.utilisation.toFixed(1)}%</span>
              <span class="mp-badge" style="background:${color};color:#fff;border-color:${color}">${tutor.utilisation_status}</span>
            </div>`;
        }).join('');
      } catch (err) {
        console.warn('[UtilisationPanel] fetch failed:', err);
      }
    }

    fetchAndRender();
    setInterval(fetchAndRender, 5000);
  }

  initPairingGraph();
  initUtilisationPanel();
  initTimetable();
}

/* ── Timetable modal ─────────────────────────────────────────────── */

function initTimetable() {
  const overlay  = document.getElementById('timetableOverlay');
  const closeBtn = document.getElementById('timetableClose');
  const body     = document.getElementById('timetableBody');
  const title    = document.getElementById('timetableTitle');
  const filters  = document.querySelectorAll('.mp-tt-filter');
  const openBtn  = document.getElementById('viewTimetableBtn');

  if (!overlay) return;

  let _currentSlot = '';

  // ── Open / close ──────────────────────────────────────────────
  function openTimetable(slot = '') {
    _currentSlot = slot;
    // Sync filter buttons
    filters.forEach(btn => {
      btn.classList.toggle('mp-tt-filter--active', btn.dataset.slot === slot);
    });
    const dayNames = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' };
    title.textContent = slot
      ? `${dayNames[slot] || slot} Timetable`
      : 'All Timetables';
    overlay.classList.add('mp-timetable-overlay--visible');
    fetchAndRenderPairings(slot);
  }

  function closeTimetable() {
    overlay.classList.remove('mp-timetable-overlay--visible');
  }

  openBtn?.addEventListener('click', () => openTimetable(''));
  closeBtn?.addEventListener('click', closeTimetable);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeTimetable(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTimetable(); });

  // ── Filter buttons ────────────────────────────────────────────
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      openTimetable(btn.dataset.slot);
    });
  });

  // ── Shift tile click → open filtered by day ──────────────────
  document.addEventListener('click', e => {
    const tile = e.target.closest('.mp-slot--filled');
    if (!tile) return;
    // Shift cards don't carry day info — open all timetables
    openTimetable('');
  });

  // ── Heatmap cell click → open filtered by day ────────────────
  document.addEventListener('click', e => {
    const cell = e.target.closest('.mp-heat__cell[data-demand-tip]');
    if (!cell) return;
    // Get the column index to determine day
    const row  = cell.closest('tr');
    if (!row) return;
    const cells = Array.from(row.querySelectorAll('td.mp-heat__cell'));
    const colIdx = cells.indexOf(cell);
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const day  = days[colIdx] ?? '';
    openTimetable(day);
  });

  // ── Fetch & render ────────────────────────────────────────────
  async function fetchAndRenderPairings(slot) {
    body.innerHTML = '<div class="mp-timetable-loading"><i class="bi bi-arrow-repeat mp-spin"></i> Loading pairings…</div>';
    const qs  = slot ? `?time_slot=${encodeURIComponent(slot)}` : '';
    try {
      const res = await fetch(`/matching/pairings${qs}`, {
        headers: { 'X-API-Key': API_KEY }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const pairings = await res.json();
      renderPairings(pairings, slot);
    } catch (err) {
      body.innerHTML = `<p class="mp-timetable-empty">Could not load pairings — ${err.message}</p>`;
    }
  }

  function renderPairings(pairings, slot) {
    if (!pairings.length) {
      body.innerHTML = `<p class="mp-timetable-empty">No confirmed pairings${slot ? ` for ${slot}` : ''} yet.</p>`;
      return;
    }

    const DAY_ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const DAY_FULL  = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' };

    // Group by day prefix (first 3 chars of time_slot, normalised)
    const groups = {};
    pairings.forEach(p => {
      const raw = (p.time_slot || '').trim();
      const dayKey = raw.slice(0, 3);  // e.g. "Mon", "Sat"
      const normKey = dayKey.charAt(0).toUpperCase() + dayKey.slice(1).toLowerCase();
      if (!groups[normKey]) groups[normKey] = [];
      groups[normKey].push(p);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ai = DAY_ORDER.indexOf(a), bi = DAY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    body.innerHTML = sortedKeys.map(dayKey => {
      // Sort pairings within day by time
      const dayPairings = groups[dayKey].sort((a, b) => a.time_slot.localeCompare(b.time_slot));

      const rows = dayPairings.map((p, idx) => {
        const score = Math.round(p.satisfaction_score);
        const scoreClass = score >= 75 ? 'good' : score >= 50 ? 'ok' : 'low';
        const timeLabel = (p.time_slot || '').replace(/^[A-Za-z]+_/, '');
        const matchedDate = p.matched_at ? new Date(p.matched_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const band = idx % 2 === 0 ? 'even' : 'odd';

        return `
          <tr class="mp-tt-row mp-tt-row--pair-${band}">
            <td class="mp-tt-cell mp-tt-cell--muted" style="width:60px">${timeLabel}</td>
            <td class="mp-tt-cell">
              <span class="mp-tt-avatar">${initials(p.student_name)}</span>
              <span class="mp-tt-name">${p.student_name || p.student_id}</span>
            </td>
            <td class="mp-tt-cell mp-tt-cell--muted">${p.curriculum || '—'} · Gr ${p.grade_level || '—'}</td>
            <td class="mp-tt-cell mp-tt-cell--muted">${p.weak_topic || '—'}</td>
            <td class="mp-tt-cell">
              <span class="mp-tt-avatar mp-tt-avatar--tutor">${initials(p.tutor_name)}</span>
              <span class="mp-tt-name">${p.tutor_name || p.tutor_id}</span>
            </td>
            <td class="mp-tt-cell">
              <span class="mp-tt-score mp-tt-score--${scoreClass}">${score}%</span>
            </td>
            <td class="mp-tt-cell mp-tt-cell--muted">${matchedDate}</td>
          </tr>`;
      }).join('');

      const label = DAY_FULL[dayKey] || dayKey;
      return `
        <div class="mp-tt-group">
          <div class="mp-tt-group__header">
            <span class="mp-tt-group__label">${label}</span>
            <span class="mp-tt-group__count">${dayPairings.length} pairing${dayPairings.length !== 1 ? 's' : ''}</span>
          </div>
          <table class="mp-tt-table">
            <thead>
              <tr>
                <th>Time</th><th>Student</th><th>Level</th><th>Topic</th><th>Tutor</th><th>Match</th><th>Matched on</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');
  }

  function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
