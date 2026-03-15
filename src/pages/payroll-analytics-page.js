import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';

export function createPayrollAnalyticsContent() {
  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">Payroll control</p>
          <h2 class="hero-panel__title">Payroll is moving cleanly through approvals, with only a small exception queue requiring manual review.</h2>
          <p class="hero-panel__text">Core compliance checks remain stable and weekly disbursement flow is healthy. Attention should stay on the review and hold batches to prevent cycle drag.</p>
        </div>
        <aside class="hero-panel__aside">
          <p class="panel-label">Compliance checks</p>
          <div class="metric-lead">
            <span class="metric-lead__value">99.1%</span>
            <span class="metric-lead__delta positive-text">Within policy threshold</span>
          </div>
          <p class="metric-copy">Nine pending exceptions remain, but the main payroll run is ready to proceed without delay.</p>
        </aside>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Disbursements</p><h3 class="kpi-card__value">2.4M</h3><p class="kpi-card__meta">Total scheduled payout value</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Paid this week</p><h3 class="kpi-card__value">184</h3><p class="kpi-card__meta">Employees already processed</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Pending exceptions</p><h3 class="kpi-card__value">9</h3><p class="kpi-card__meta">Requires manual review</p></article></div>
      <div class="col-lg-3 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Compliance</p><h3 class="kpi-card__value">99.1%</h3><p class="kpi-card__meta">Checks passing automatically</p></article></div>
    </section>

    <section class="shell-table">
      <div class="shell-table__header">
        <div>
          <p class="panel-label">Queue health</p>
          <h3 class="panel-title">Payroll queue</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-shield-check"></i> Audit trail active</span>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Batch</th><th>Employees</th><th>Status</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>PV-041</td><td>42</td><td><span class="text-success">Approved</span></td><td>$184,200</td></tr>
            <tr><td>PV-042</td><td>56</td><td><span class="text-warning">Review</span></td><td>$255,400</td></tr>
            <tr><td>PV-043</td><td>31</td><td><span class="text-danger">Hold</span></td><td>$129,800</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-xl-6">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Trendline</p>
              <h3 class="panel-title">Payout trends</h3>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card__canvas">
              <div class="chart-card__overlay">
                <span class="chart-card__tag">Payroll value by week ($000)</span>
              </div>
              <canvas id="payoutTrendsChart" aria-label="Payout trends chart"></canvas>
            </div>
          </div>
        </section>
      </div>
      <div class="col-xl-6">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Execution</p>
              <h3 class="panel-title">Controls</h3>
            </div>
          </div>
          <div class="action-row">
            <button class="btn btn-primary">Run payroll</button>
            <button class="btn btn-success">Export report</button>
            <button class="btn btn-outline-primary">Open discrepancy board</button>
          </div>
        </section>
      </div>
    </section>
  `;
}

export function initPayrollAnalyticsCharts() {
  mountChart('payoutTrendsChart', {
    type: 'line',
    data: {
      labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'],
      datasets: [
        {
          label: 'Actual',
          data: [112, 138, 126, 184, 212],
          borderColor: chartPalette.accent,
          backgroundColor: chartPalette.accentSoft,
          pointBackgroundColor: chartPalette.accent,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          tension: 0.3
        },
        {
          label: 'Variance',
          data: [96, 104, 102, 124, 136],
          borderColor: chartPalette.warm,
          pointBackgroundColor: chartPalette.warm,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          tension: 0.25,
          borderDash: [6, 6]
        }
      ]
    },
    options: {
      ...baseChartOptions,
      scales: {
        x: { ...baseChartOptions.scales.x },
        y: {
          ...baseChartOptions.scales.y,
          ticks: {
            ...baseChartOptions.scales.y.ticks,
            callback: (value) => `$${value}k`
          }
        }
      }
    }
  });
}
