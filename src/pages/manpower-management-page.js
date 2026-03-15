import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';

export function createManpowerManagementContent() {
  const roster = [
    { team: 'Morning Shift', status: 'Ready', count: '12/14', short: '2 gap', tone: 'danger' },
    { team: 'Afternoon Shift', status: 'Ready', count: '16/16', short: '0 gap', tone: 'success' },
    { team: 'Night Shift', status: 'Needs help', count: '11/14', short: '3 gap', tone: 'danger' }
  ];

  const rows = roster
    .map(
      (row) => `
      <tr>
        <td>${row.team}</td>
        <td>${row.count}</td>
        <td>${row.status}</td>
        <td><span class="text-${row.tone}">${row.short}</span></td>
      </tr>`
    )
    .join('');

  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">Coverage command</p>
          <h2 class="hero-panel__title">Shift fill remains strong, with the night roster still the only material staffing risk.</h2>
          <p class="hero-panel__text">Automation is handling most requests within SLA, allowing the operations team to concentrate on escalation windows and skill-sensitive placements.</p>
        </div>
        <aside class="hero-panel__aside">
          <p class="panel-label">Fill rate</p>
          <div class="metric-lead">
            <span class="metric-lead__value">98%</span>
            <span class="metric-lead__delta positive-text">Above 95% target</span>
          </div>
          <p class="metric-copy">Only four alerts need immediate intervention, and all are concentrated in overnight demand.</p>
        </aside>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Open requests</p><h3 class="kpi-card__value">24</h3><p class="kpi-card__meta">Up 12% this week</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Auto-matched</p><h3 class="kpi-card__value">86%</h3><p class="kpi-card__meta">Handled within SLA</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Average fill rate</p><h3 class="kpi-card__value">98%</h3><p class="kpi-card__meta">Above target service level</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Critical alerts</p><h3 class="kpi-card__value">4</h3><p class="kpi-card__meta">Needs immediate action</p></article></div>
    </section>

    <section class="shell-table">
      <div class="shell-table__header">
        <div>
          <p class="panel-label">Live operations</p>
          <h3 class="panel-title">Shift rosters</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-people"></i> Updated in real time</span>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Shift</th><th>Coverage</th><th>Status</th><th>Gap</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Capability planning</p>
          <h3 class="panel-title">Skill mapping</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-diagram-3"></i> Allocation ready</span>
      </div>
      <div class="chart-card">
        <div class="chart-card__canvas">
          <div class="chart-card__overlay">
            <span class="chart-card__tag">Tutor-to-student mapping quality (%) by day</span>
          </div>
          <canvas id="skillMappingChart" aria-label="Skill mapping chart"></canvas>
        </div>
      </div>
    </section>
  `;
}

export function initManpowerManagementCharts() {
  mountChart('skillMappingChart', {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [
        {
          label: 'Tutor-student mapping quality',
          data: [68, 71, 66, 69, 72],
          borderColor: chartPalette.accent,
          backgroundColor: chartPalette.accentSoft,
          pointBackgroundColor: chartPalette.accent,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          tension: 0.32,
          fill: false
        }
      ]
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        legend: {
          display: false
        }
      },
      scales: {
        x: { ...baseChartOptions.scales.x },
        y: {
          ...baseChartOptions.scales.y,
          min: 0,
          max: 90,
          ticks: {
            ...baseChartOptions.scales.y.ticks,
            callback: (value) => `${value}%`
          }
        }
      }
    }
  });
}
