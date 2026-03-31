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
        <span class="feature-pill"><i class="bi bi-clock-history"></i> Real-time</span>
      </div>
      <div class="mp-shifts-grid">${shiftCards}</div>
    </section>

    <section class="mp-dual">
      <div class="mp-dual__left">
        <div class="mp-dual__header">
          <div>
            <p class="panel-label">Forward planning</p>
            <h3 class="panel-title">7-day demand heatmap</h3>
          </div>
        </div>
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

export function initManpowerManagementCharts() {
  /* Sparklines */
  kpis.forEach((k) => mountSparkline(k.id, k.data, k.tone));

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
}
