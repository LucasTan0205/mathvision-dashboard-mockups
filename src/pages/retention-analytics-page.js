import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';

export function createRetentionAnalyticsContent() {
  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">People health</p>
          <h2 class="hero-panel__title">Retention remains resilient, with scheduling consistency still the strongest predictor of long-term stability.</h2>
          <p class="hero-panel__text">Churn risk is trending downward, and engagement signals remain solid. The main opportunity is to intervene earlier on training and attendance patterns.</p>
        </div>
        <aside class="hero-panel__aside">
          <p class="panel-label">Quarter retention rate</p>
          <div class="metric-lead">
            <span class="metric-lead__value">84.2%</span>
            <span class="metric-lead__delta positive-text">Up 2.9% QoQ</span>
          </div>
          <p class="metric-copy">Manager-level coaching and predictable rosters continue to deliver the clearest stability gains.</p>
        </aside>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-md-4"><article class="shell-kpi h-100"><p class="kpi-card__label">Quarter retention</p><h3 class="kpi-card__value">84.2%</h3><p class="kpi-card__meta">Up 2.9% quarter over quarter</p></article></div>
      <div class="col-md-4"><article class="shell-kpi h-100"><p class="kpi-card__label">Churn risk</p><h3 class="kpi-card__value">5.8%</h3><p class="kpi-card__meta">Improved by 0.4% this cycle</p></article></div>
      <div class="col-md-4"><article class="shell-kpi h-100"><p class="kpi-card__label">Employee NPS</p><h3 class="kpi-card__value">72</h3><p class="kpi-card__meta">Healthy engagement baseline</p></article></div>
    </section>

    <section class="row g-4">
      <div class="col-xl-8">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Core drivers</p>
              <h3 class="panel-title">Retention drivers</h3>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card__canvas">
              <div class="chart-card__overlay">
                <span class="chart-card__tag">Weight of retention signals (%)</span>
              </div>
              <canvas id="retentionDriversChart" aria-label="Retention drivers chart"></canvas>
            </div>
          </div>
        </section>
      </div>
      <div class="col-xl-4">
        <section class="shell-list h-100">
          <div class="shell-list__header">
            <div>
              <p class="panel-label">Top signals</p>
              <h3 class="panel-title">What matters most</h3>
            </div>
          </div>
          <div class="status-list">
            <div class="status-list__item"><span><span class="status-circle available"></span><strong>Schedule consistency</strong></span><span>36%</span></div>
            <div class="status-list__item"><span><span class="status-circle available"></span><strong>On-time payroll</strong></span><span>24%</span></div>
            <div class="status-list__item"><span><span class="status-circle busy"></span><strong>Late check-ins</strong></span><span>15%</span></div>
            <div class="status-list__item"><span><span class="status-circle unavailable"></span><strong>Training gaps</strong></span><span>9%</span></div>
          </div>
        </section>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-xl-6">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Audience view</p>
              <h3 class="panel-title">Engagement by segment</h3>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card__canvas">
              <div class="chart-card__overlay">
                <span class="chart-card__tag">Engagement score by segment</span>
              </div>
              <canvas id="engagementSegmentChart" aria-label="Engagement by segment chart"></canvas>
            </div>
          </div>
        </section>
      </div>
      <div class="col-xl-6">
        <section class="shell-list h-100">
          <div class="shell-list__header">
            <div>
              <p class="panel-label">Action queue</p>
              <h3 class="panel-title">Recommended next steps</h3>
            </div>
          </div>
          <div class="shell-list__item"><div><p class="list-title">Supervisor outreach</p><p class="list-note">Schedule support for 3 at-risk supervisors</p></div><span class="status-pill status-pill--warning">Today</span></div>
          <div class="shell-list__item"><div><p class="list-title">Incentive update</p><p class="list-note">Publish revised team lead incentive guidance</p></div><span class="status-pill status-pill--positive">Ready</span></div>
          <div class="shell-list__item"><div><p class="list-title">Pulse survey</p><p class="list-note">Send engagement check-in next Friday morning</p></div><span class="status-pill">Queued</span></div>
        </section>
      </div>
    </section>
  `;
}

export function initRetentionAnalyticsCharts() {
  mountChart('retentionDriversChart', {
    type: 'bar',
    data: {
      labels: ['Schedule consistency', 'On-time payroll', 'Late check-ins', 'Training gaps'],
      datasets: [
        {
          label: 'Signal weight',
          data: [36, 24, 15, 9],
          backgroundColor: [
            chartPalette.accent,
            'rgba(31, 106, 82, 0.72)',
            'rgba(188, 108, 37, 0.78)',
            'rgba(184, 87, 67, 0.68)'
          ],
          borderRadius: 10
        }
      ]
    },
    options: {
      ...baseChartOptions,
      indexAxis: 'y',
      plugins: {
        ...baseChartOptions.plugins,
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ...baseChartOptions.scales.x,
          ticks: {
            ...baseChartOptions.scales.x.ticks,
            callback: (value) => `${value}%`
          }
        },
        y: {
          ...baseChartOptions.scales.y,
          grid: {
            display: false
          }
        }
      }
    }
  });

  mountChart('engagementSegmentChart', {
    type: 'bar',
    data: {
      labels: ['New', 'Core', 'Senior', 'Part-time'],
      datasets: [
        {
          label: 'Current',
          data: [64, 78, 83, 58],
          backgroundColor: chartPalette.accent,
          borderRadius: 10
        },
        {
          label: 'Previous',
          data: [58, 74, 79, 54],
          backgroundColor: chartPalette.warm,
          borderRadius: 10
        }
      ]
    },
    options: {
      ...baseChartOptions,
      scales: {
        x: { ...baseChartOptions.scales.x },
        y: {
          ...baseChartOptions.scales.y,
          suggestedMax: 100
        }
      }
    }
  });
}
