import { baseChartOptions, chartPalette, mountChart } from '/src/lib/charts.js';

export function createMarketingInsightsContent() {
  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">Growth snapshot</p>
          <h2 class="hero-panel__title">Lead quality is improving as referrals and messaging channels outperform paid campaigns.</h2>
          <p class="hero-panel__text">Marketing activity is producing fewer but stronger leads this week, with the highest efficiency coming from WhatsApp and referral touchpoints.</p>
          <div class="hero-badges">
            <span class="hero-badge"><i class="bi bi-graph-up-arrow"></i> Conversion up 2.1%</span>
            <span class="hero-badge"><i class="bi bi-megaphone"></i> Spend efficiency at 4.4x</span>
          </div>
        </div>
        <aside class="hero-panel__aside">
          <p class="panel-label">Acquisition signal</p>
          <div class="metric-lead">
            <span class="metric-lead__value">127</span>
            <span class="metric-lead__delta positive-text">Active leads</span>
          </div>
          <p class="metric-copy">Referral and community-led demand are driving the healthiest mix, while paid traffic is steady but less efficient.</p>
        </aside>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-lg-4 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Lead funnel</p><h3 class="kpi-card__value">127</h3><p class="kpi-card__meta">Active leads in motion</p></article></div>
      <div class="col-lg-4 col-md-6"><article class="shell-kpi h-100"><p class="kpi-card__label">Conversion</p><h3 class="kpi-card__value">9.1%</h3><p class="kpi-card__meta">Up 2.1% this month</p></article></div>
      <div class="col-lg-4 col-md-12"><article class="shell-kpi h-100"><p class="kpi-card__label">Spend efficiency</p><h3 class="kpi-card__value">4.4x</h3><p class="kpi-card__meta">Current blended ROI estimate</p></article></div>
    </section>

    <section class="row g-4">
      <div class="col-xl-7">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Channel composition</p>
              <h3 class="panel-title">Campaign mix</h3>
            </div>
            <span class="feature-pill"><i class="bi bi-broadcast"></i> Past 1 month</span>
          </div>
          <div class="chart-card">
            <div class="chart-card__canvas chart-card__canvas--tall">
              <div class="chart-card__overlay">
                <span class="chart-card__tag">Lead source share (% of active leads)</span>
              </div>
              <canvas id="campaignMixChart" aria-label="Campaign mix chart"></canvas>
            </div>
          </div>
        </section>
      </div>
      <div class="col-xl-5">
        <section class="shell-list h-100">
          <div class="shell-list__header">
            <div>
              <p class="panel-label">Source split</p>
              <h3 class="panel-title">Lead contribution</h3>
            </div>
          </div>
          <div class="shell-list__item">
            <div><p class="list-title">WhatsApp</p><p class="list-note">Fastest first-response channel</p></div>
            <span class="status-pill status-pill--positive">45%</span>
          </div>
          <div class="shell-list__item">
            <div><p class="list-title">Referral</p><p class="list-note">Highest conversion quality</p></div>
            <span class="status-pill status-pill--positive">32%</span>
          </div>
          <div class="shell-list__item">
            <div><p class="list-title">Partner</p><p class="list-note">Steady institutional pipeline</p></div>
            <span class="status-pill status-pill--warning">23%</span>
          </div>
        </section>
      </div>
    </section>

    <section class="shell-card">
      <div class="shell-card__header">
        <div>
          <p class="panel-label">Momentum</p>
          <h3 class="panel-title">Platform impressions</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-calendar3"></i> Seven-day view</span>
      </div>
      <div class="chart-card">
        <div class="chart-card__canvas">
          <div class="chart-card__overlay">
            <span class="chart-card__tag">Impressions by platform per day</span>
          </div>
          <canvas id="platformImpressionsChart" aria-label="Platform impressions chart"></canvas>
        </div>
      </div>
    </section>
  `;
}

export function initMarketingInsightsCharts() {
  mountChart('campaignMixChart', {
    type: 'doughnut',
    data: {
      labels: ['WhatsApp', 'Referral', 'Partner'],
      datasets: [
        {
          data: [45, 32, 23],
          backgroundColor: [chartPalette.accent, chartPalette.warm, chartPalette.softStrong],
          borderWidth: 0
        }
      ]
    },
    options: {
      ...baseChartOptions,
      cutout: '68%',
      plugins: {
        ...baseChartOptions.plugins,
        legend: {
          ...baseChartOptions.plugins.legend,
          position: 'bottom'
        }
      },
      scales: {}
    }
  });

  mountChart('platformImpressionsChart', {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        { label: 'Meta', data: [8.2, 9.8, 8.9, 11.2, 12.4, 7.1, 6.4], backgroundColor: chartPalette.accent },
        { label: 'Google', data: [5.1, 5.8, 5.4, 6.2, 6.6, 4.3, 3.9], backgroundColor: chartPalette.warm },
        { label: 'TikTok', data: [3.2, 3.9, 4.1, 4.4, 4.8, 2.8, 2.2], backgroundColor: chartPalette.softStrong }
      ]
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        legend: {
          ...baseChartOptions.plugins.legend,
          position: 'top'
        }
      },
      scales: {
        x: { ...baseChartOptions.scales.x, stacked: true },
        y: {
          ...baseChartOptions.scales.y,
          stacked: true,
          ticks: {
            ...baseChartOptions.scales.y.ticks,
            callback: (value) => `${value}k`
          }
        }
      }
    }
  });
}
