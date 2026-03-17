import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';
import { Chart } from 'chart.js';

/* ── Thresholds (configurable defaults) ─────────────────── */
const BURNOUT_HOURS = 100;
const HIGH_LOAD_MIN = 80;
const BALANCED_MIN  = 60;
const UNDER_MIN     = 45;
const TARGET_CAP    = 120; // monthly teaching capacity per tutor

/* ── Data ───────────────────────────────────────────────── */

const tutors = [
  { name: 'Alicia Tan',   hours: 112, lastMonth: 104, avail: [[1,2],[2,2],[4,2]] },
  { name: 'Marcus Lee',   hours: 96,  lastMonth: 92,  avail: [[0,0],[3,1],[5,2]] },
  { name: 'Nur Aisyah',   hours: 88,  lastMonth: 85,  avail: [[1,0],[4,1],[6,2]] },
  { name: 'Benjamin Goh', hours: 84,  lastMonth: 82,  avail: [[2,0],[3,2],[5,0]] },
  { name: 'Ethan Ong',    hours: 76,  lastMonth: 78,  avail: [[0,1],[2,2],[6,0]] },
  { name: 'Priya Nair',   hours: 72,  lastMonth: 68,  avail: [[1,1],[3,0],[5,1]] },
  { name: 'Daniel Ho',    hours: 64,  lastMonth: 70,  avail: [[0,2],[4,0],[6,1]] },
  { name: 'Sarah Wong',   hours: 62,  lastMonth: 66,  avail: [[2,1],[3,0],[5,2]] },
  { name: 'Grace Lim',    hours: 53,  lastMonth: 58,  avail: [[1,2],[4,2],[6,0]] },
  { name: 'Hannah Teo',   hours: 47,  lastMonth: 52,  avail: [[0,0],[2,1],[3,2],[5,0],[6,1]] },
  { name: 'Jason Koh',    hours: 39,  lastMonth: 42,  avail: [[0,2],[1,0],[2,2],[4,0],[5,1],[6,2]] },
  { name: 'Mei Chen',     hours: 34,  lastMonth: 38,  avail: [[0,0],[1,1],[3,0],[4,2],[5,0],[6,1]] }
];

const reassignments = [
  { tutor: 'Jason Koh',  hours: 39, spare: 21, slots: '6 open evening slots this week overlap with his free time',  slotCount: 6 },
  { tutor: 'Mei Chen',   hours: 34, spare: 26, slots: '4 open Saturday morning slots available',                    slotCount: 4 },
  { tutor: 'Hannah Teo', hours: 47, spare: 13, slots: '3 open afternoon slots match her availability',              slotCount: 3 },
  { tutor: 'Grace Lim',  hours: 53, spare: 7,  slots: '2 open weekday PM slots available',                          slotCount: 2 }
];

const kpis = [
  { id: 'capSparkUtil',    label: 'Avg utilisation', value: '74%', badge: '−8% vs 2 mths ago', tone: 'amber', spark: [82, 80, 78, 76, 75, 74] },
  { id: 'capSparkHours',   label: 'Avg tutor hours', value: '68h', badge: 'Target 60–90h',     tone: 'green', spark: [74, 72, 70, 69, 68, 68] },
  { id: 'capSparkOver',    label: 'Overloaded tutors', value: '1', badge: '>100h / mth',       tone: 'red',   spark: [2, 3, 2, 1, 1, 1] },
  { id: 'capSparkUnder',   label: 'Underutilised tutors', value: '5', badge: '<45h / mth',     tone: 'amber', spark: [2, 3, 3, 4, 4, 5] }
];

const monthlyTrend = [
  { month: 'Oct', value: 82 },
  { month: 'Nov', value: 80 },
  { month: 'Dec', value: 78 },
  { month: 'Jan', value: 76 },
  { month: 'Feb', value: 75 },
  { month: 'Mar', value: 74 }
];

/* ── Helpers ────────────────────────────────────────────── */

function statusOf(hours) {
  if (hours > BURNOUT_HOURS) return { label: 'Overloaded',              key: 'overloaded', tone: 'red' };
  if (hours >= HIGH_LOAD_MIN) return { label: 'High load',             key: 'high',       tone: 'dkgreen' };
  if (hours >= BALANCED_MIN)  return { label: 'Balanced',              key: 'balanced',   tone: 'green' };
  if (hours >= UNDER_MIN)     return { label: 'Underutilised',         key: 'under',      tone: 'amber' };
  return                             { label: 'Severely underutilised', key: 'severe',     tone: 'red' };
}

function delta(cur, prev) {
  const d = cur - prev;
  if (d > 0) return { arrow: '↑', text: `+${d}h`, cls: 'positive-text' };
  if (d < 0) return { arrow: '↓', text: `${d}h`,  cls: 'negative-text' };
  return { arrow: '→', text: '0h', cls: 'neutral-text' };
}

function sparkColor(tone) {
  if (tone === 'red') return '#E24B4A';
  if (tone === 'green') return '#1D9E75';
  return '#EF9F27';
}

function badgeClass(tone) {
  if (tone === 'red') return 'mp-badge--red';
  if (tone === 'green') return 'mp-badge--green';
  return 'mp-badge--amber';
}

function actionLabel(status) {
  if (status.key === 'overloaded') return 'Redistribute';
  if (status.key === 'severe' || status.key === 'under') return 'Assign more';
  return '';
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const slotNames = ['AM', 'PM', 'Eve'];

function miniGrid(avail) {
  const free = new Set(avail.map(([d, s]) => `${d}-${s}`));
  let cells = '';
  for (let s = 0; s < 3; s++) {
    cells += `<tr><td class="cu-mini__label">${slotNames[s]}</td>`;
    for (let d = 0; d < 7; d++) {
      const isFree = free.has(`${d}-${s}`);
      cells += `<td class="cu-mini__cell ${isFree ? 'cu-mini__cell--free' : 'cu-mini__cell--busy'}"></td>`;
    }
    cells += '</tr>';
  }
  return `<table class="cu-mini"><thead><tr><th></th>${dayNames.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>${cells}</tbody></table>`;
}

/* ── Distribution buckets ──────────────────────────────── */

function buildDistribution() {
  const bands = [
    { label: '0–44h', key: 'severe',     color: '#E24B4A', count: 0 },
    { label: '45–59h', key: 'under',      color: '#EF9F27', count: 0 },
    { label: '60–79h', key: 'balanced',   color: '#1D9E75', count: 0 },
    { label: '80–99h', key: 'high',       color: '#157a56', count: 0 },
    { label: '100h+',  key: 'overloaded', color: '#E24B4A', count: 0 }
  ];
  tutors.forEach((t) => {
    if (t.hours >= BURNOUT_HOURS)      bands[4].count++;
    else if (t.hours >= HIGH_LOAD_MIN) bands[3].count++;
    else if (t.hours >= BALANCED_MIN)  bands[2].count++;
    else if (t.hours >= UNDER_MIN)     bands[1].count++;
    else                               bands[0].count++;
  });
  return bands;
}

/* ── Content builder ────────────────────────────────────── */

export function createCapacityUtilizationContent() {
  const bands = buildDistribution();
  const totalSpare = reassignments.reduce((s, r) => s + r.spare, 0);

  /* Section 1 – Actionable Insight Banner */
  const banner = `
    <section class="mp-alert-banner">
      <div class="mp-alert-banner__icon"><i class="bi bi-lightbulb-fill"></i></div>
      <div class="mp-alert-banner__body">
        <p class="mp-alert-banner__title">5 underutilised tutors have ${totalSpare} combined free hours — enough to cover the projected SA1 demand spike without hiring</p>
        <p class="mp-alert-banner__detail">24 open requests on Manpower Management can be matched against ${totalSpare}h of spare tutor capacity identified below. Reassigning just 3 tutors would close the evening gap entirely.</p>
      </div>
      <div class="mp-alert-banner__actions">
        <button class="btn mp-btn mp-btn--primary" type="button"><i class="bi bi-arrow-repeat"></i> View reassignment opportunities</button>
        <button class="btn mp-btn mp-btn--secondary" type="button"><i class="bi bi-download"></i> Export capacity report</button>
      </div>
    </section>`;

  /* Cross-page callout */
  const crossPage = `
    <div class="cu-cross-callout">
      <i class="bi bi-link-45deg"></i>
      <span><strong>24 open requests</strong> on Manpower Management — <strong>${totalSpare}h spare tutor capacity</strong> available here</span>
      <a href="manpower-management.html" class="cu-cross-callout__link">Go to Manpower Management →</a>
    </div>`;

  /* Section 2 – KPI Cards */
  const kpiCards = kpis.map(k => `
    <div class="mp-kpi">
      <p class="mp-kpi__label">${k.label}</p>
      <div class="mp-kpi__row">
        <h3 class="mp-kpi__value">${k.value}</h3>
        <span class="mp-badge ${badgeClass(k.tone)}">${k.badge}</span>
      </div>
      <div class="mp-kpi__spark"><canvas id="${k.id}" aria-label="${k.label} sparkline"></canvas></div>
    </div>`).join('');

  /* Section 3 – Utilisation Distribution Chart */
  const distChart = `
    <section class="cu-panel">
      <div class="cu-panel__header">
        <div>
          <p class="panel-label">Distribution</p>
          <h3 class="panel-title">Utilisation distribution</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-bar-chart-steps"></i> Click a bar to filter table</span>
      </div>
      <div class="cu-dist-wrap">
        <canvas id="capDistChart" aria-label="Utilisation distribution chart"></canvas>
      </div>
      <div class="cu-dist-thresholds">
        <span class="cu-dist-th cu-dist-th--red"><i class="bi bi-exclamation-triangle"></i> Burnout risk: &gt;100h</span>
        <span class="cu-dist-th cu-dist-th--amber"><i class="bi bi-arrow-return-right"></i> Review for reassignment: &lt;45h</span>
      </div>
    </section>`;

  /* Section 4 – Reassignment Opportunities */
  const reassignItems = reassignments.map(r => `
    <div class="cu-reassign__item">
      <div class="cu-reassign__info">
        <p class="cu-reassign__name">${r.tutor} <span class="cu-reassign__hours">${r.hours}h this month · ${r.spare}h spare</span></p>
        <p class="cu-reassign__match"><i class="bi bi-clock-history"></i> ${r.slots}</p>
      </div>
      <div class="cu-reassign__right">
        <span class="mp-badge mp-badge--green">+${r.spare}h recoverable</span>
        <button class="btn mp-btn mp-btn--outline" type="button"><i class="bi bi-plus-circle"></i> Assign</button>
      </div>
    </div>`).join('');

  const reassignPanel = `
    <section class="cu-panel">
      <div class="cu-panel__header">
        <div>
          <p class="panel-label">Capacity planning</p>
          <h3 class="panel-title">Reassignment opportunities</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-shuffle"></i> Sorted by hours recoverable</span>
      </div>
      ${reassignItems}
    </section>`;

  /* Section 5 – Tutor Table */
  const sortedTutors = [...tutors].sort((a, b) => a.hours - b.hours);
  const filterChips = ['All', 'Overloaded', 'High load', 'Balanced', 'Underutilised', 'Severely underutilised'];
  const chips = filterChips.map((f, i) => `<button class="cu-chip${i === 0 ? ' cu-chip--active' : ''}" data-filter="${f}" type="button">${f}</button>`).join('');

  const tableRows = sortedTutors.map(t => {
    const st = statusOf(t.hours);
    const d  = delta(t.hours, t.lastMonth);
    const remaining = TARGET_CAP - t.hours;
    const act = actionLabel(st);
    return `
      <tr class="cu-row" data-status="${st.label}">
        <td class="cu-row__name">${t.name}</td>
        <td>${t.hours}h</td>
        <td>${Math.round((t.hours / TARGET_CAP) * 100)}%</td>
        <td><span class="cu-status cu-status--${st.tone}">${st.label}</span></td>
        <td><span class="${d.cls}">${d.arrow} ${d.text}</span></td>
        <td>${remaining}h</td>
        <td>${act ? `<button class="btn mp-btn mp-btn--outline mp-btn--sm" type="button">${act}</button>` : '—'}</td>
      </tr>
      <tr class="cu-row__expand" data-status="${st.label}"><td colspan="7"><div class="cu-row__grid">${miniGrid(t.avail)}</div></td></tr>`;
  }).join('');

  const tutorTable = `
    <section class="cu-panel">
      <div class="cu-panel__header">
        <div>
          <p class="panel-label">Full roster</p>
          <h3 class="panel-title">Tutor capacity table</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-table"></i> ${tutors.length} tutors</span>
      </div>
      <div class="cu-chips" id="cuChips">${chips}</div>
      <div class="table-responsive">
        <table class="table align-middle cu-table">
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Hours</th>
              <th>Util %</th>
              <th>Status</th>
              <th>Trend</th>
              <th>Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="cuTableBody">${tableRows}</tbody>
        </table>
      </div>
    </section>`;

  /* Section 6 – Monthly Utilisation Trend */
  const trendChart = `
    <section class="cu-panel">
      <div class="cu-panel__header">
        <div>
          <p class="panel-label">Trend</p>
          <h3 class="panel-title">Monthly utilisation trend</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-graph-up"></i> Past 6 months</span>
      </div>
      <div class="mp-chart-legend">
        <span class="mp-chart-legend__item mp-chart-legend__item--green"><i></i> Avg utilisation</span>
        <span class="mp-chart-legend__item mp-chart-legend__item--amber"><i></i> Healthy range (60–85%)</span>
      </div>
      <div class="chart-card"><div class="chart-card__canvas chart-card__canvas--tall"><canvas id="capTrendChart" aria-label="Monthly utilisation trend"></canvas></div></div>
    </section>`;

  return `
    ${banner}
    ${crossPage}
    <section class="mp-kpi-grid">${kpiCards}</section>
    ${distChart}
    ${reassignPanel}
    ${tutorTable}
    ${trendChart}
  `;
}

/* ── Chart & interaction init ───────────────────────────── */

function mountSparkline(id, data, tone) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{ data, borderColor: sparkColor(tone), borderWidth: 2, pointRadius: 0, pointHitRadius: 0, tension: 0.4, fill: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

export function initCapacityUtilizationCharts() {
  /* Sparklines */
  kpis.forEach(k => mountSparkline(k.id, k.spark, k.tone));

  /* Section 3 – Distribution bar chart */
  const bands = buildDistribution();
  mountChart('capDistChart', {
    type: 'bar',
    data: {
      labels: bands.map(b => b.label),
      datasets: [{
        data: bands.map(b => b.count),
        backgroundColor: bands.map(b => b.color),
        borderRadius: 6,
        maxBarThickness: 56
      }]
    },
    options: {
      ...baseChartOptions,
      indexAxis: 'y',
      plugins: { ...baseChartOptions.plugins, legend: { display: false },
        tooltip: { ...baseChartOptions.plugins.tooltip, callbacks: { label: ctx => `${ctx.raw} tutors` } }
      },
      scales: {
        x: { ...baseChartOptions.scales.x, title: { display: true, text: 'Tutor count', color: chartPalette.text, font: { family: 'Manrope, sans-serif', size: 11 } } },
        y: { ...baseChartOptions.scales.y, grid: { display: false } }
      },
      onClick(_e, elements) {
        if (!elements.length) return;
        const idx = elements[0].index;
        const filterMap = ['Severely underutilised', 'Underutilised', 'Balanced', 'High load', 'Overloaded'];
        applyFilter(filterMap[idx]);
      }
    }
  });

  /* Section 6 – Monthly trend line chart */
  mountChart('capTrendChart', {
    type: 'line',
    data: {
      labels: monthlyTrend.map(m => m.month),
      datasets: [
        {
          label: 'Avg utilisation',
          data: monthlyTrend.map(m => m.value),
          borderColor: '#1D9E75',
          backgroundColor: 'rgba(29, 158, 117, 0.10)',
          pointBackgroundColor: monthlyTrend.map((_, i, a) => i === a.length - 1 ? '#1D9E75' : 'rgba(29,158,117,0.5)'),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: monthlyTrend.map((_, i, a) => i === a.length - 1 ? 7 : 4),
          pointHoverRadius: 7,
          tension: 0.3,
          fill: false
        },
        {
          label: 'Healthy ceiling (85%)',
          data: monthlyTrend.map(() => 85),
          borderColor: 'rgba(239, 159, 39, 0.5)',
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: '+1'
        },
        {
          label: 'Healthy floor (60%)',
          data: monthlyTrend.map(() => 60),
          borderColor: 'rgba(239, 159, 39, 0.5)',
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          backgroundColor: 'rgba(29, 158, 117, 0.06)',
          fill: false
        },
        {
          label: 'Burnout (100%)',
          data: monthlyTrend.map(() => 100),
          borderColor: 'rgba(226, 75, 74, 0.45)',
          borderDash: [4, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      ...baseChartOptions,
      plugins: { ...baseChartOptions.plugins, legend: { display: false } },
      scales: {
        x: { ...baseChartOptions.scales.x },
        y: { ...baseChartOptions.scales.y, min: 0, max: 100,
          ticks: { ...baseChartOptions.scales.y.ticks, callback: v => `${v}%` }
        }
      }
    }
  });

  /* Filter chips */
  document.querySelectorAll('.cu-chip').forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
  });

  /* Row expansion */
  document.querySelectorAll('.cu-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      row.classList.toggle('cu-row--open');
      const expand = row.nextElementSibling;
      if (expand?.classList.contains('cu-row__expand')) expand.classList.toggle('cu-row__expand--open');
    });
  });
}

function applyFilter(status) {
  /* Update chips */
  document.querySelectorAll('.cu-chip').forEach(c => c.classList.toggle('cu-chip--active', c.dataset.filter === status || (status === 'All' && c.dataset.filter === 'All')));

  /* Filter rows */
  document.querySelectorAll('#cuTableBody tr').forEach(tr => {
    if (status === 'All') {
      tr.style.display = '';
    } else {
      const rowStatus = tr.dataset.status;
      tr.style.display = (rowStatus === status || !rowStatus) ? '' : 'none';
    }
  });
}
