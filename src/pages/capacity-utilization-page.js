export function createCapacityUtilizationContent() {
  const tutors = [
    { name: 'Alicia Tan', hours: 112, tone: 'high', badge: 'High load', badgeTone: 'high' },
    { name: 'Marcus Lee', hours: 96, tone: 'strong', badge: 'High load', badgeTone: 'high' },
    { name: 'Nur Aisyah', hours: 88, tone: 'strong', badge: 'High load', badgeTone: 'high' },
    { name: 'Ethan Ong', hours: 76, tone: 'balanced', badge: 'Balanced', badgeTone: 'balanced' },
    { name: 'Priya Nair', hours: 72, tone: 'balanced', badge: 'Balanced', badgeTone: 'balanced' },
    { name: 'Daniel Ho', hours: 64, tone: 'balanced', badge: 'Balanced', badgeTone: 'balanced' },
    { name: 'Grace Lim', hours: 53, tone: 'low', badge: 'Balanced', badgeTone: 'balanced' },
    { name: 'Hannah Teo', hours: 47, tone: 'low', badge: 'Underutilized', badgeTone: 'risk' },
    { name: 'Jason Koh', hours: 39, tone: 'risk', badge: 'Underutilized', badgeTone: 'risk' },
    { name: 'Mei Chen', hours: 34, tone: 'risk', badge: 'Underutilized', badgeTone: 'risk' }
  ];

  const tutorHeatmap = tutors
    .map(
      (tutor) => `
        <article class="tutor-heatmap-card tutor-heatmap-card--${tutor.tone}">
          <div>
            <p class="tutor-heatmap-card__name">${tutor.name}</p>
            <p class="tutor-heatmap-card__meta">Teaching hours this month</p>
          </div>
          <div class="tutor-heatmap-card__summary">
            <span class="tutor-load-badge tutor-load-badge--${tutor.badgeTone}">${tutor.badge}</span>
            <strong class="tutor-heatmap-card__hours">${tutor.hours}h</strong>
          </div>
        </article>`
    )
    .join('');

  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">Tutor capacity pulse</p>
          <h2 class="hero-panel__title">This month, tutors are 74% utilized on average, with a small group clearly underused.</h2>
          <p class="hero-panel__text">Use this view to compare how many hours each tutor has taught this month and quickly spot tutors who still have spare capacity for reassignment.</p>
        </div>
        <aside class="hero-panel__aside">
          <p class="panel-label">Average tutor hours this month</p>
          <div class="metric-lead">
            <span class="metric-lead__value">68h</span>
            <span class="metric-lead__delta positive-text">Per tutor</span>
          </div>
          <p class="metric-copy">34 of 46 tutors are above 60 hours taught this month, while 5 tutors are below 45 hours and should be reviewed for reallocation.</p>
        </aside>
      </div>
    </section>

    <section class="row g-4">
      <div class="col-xl-4">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Monthly summary</p>
              <h3 class="panel-title">Tutor utilization overview</h3>
            </div>
          </div>
          <div class="split-stat-grid">
            <div class="split-stat">
              <strong>74%</strong>
              <span class="text-muted">Tutors utilized</span>
            </div>
            <div class="split-stat">
              <strong>68h</strong>
              <span class="text-muted">Average tutor hours</span>
            </div>
            <div class="split-stat">
              <strong class="text-danger">5</strong>
              <span class="text-muted">Underutilized tutors</span>
            </div>
          </div>
          <div class="surface-soft mt-4">
            <p class="panel-label">How to read</p>
            <p class="panel-copy">Green means a tutor is heavily utilized this month. Amber is balanced. Red highlights tutors teaching fewer hours so admins can spot spare capacity immediately.</p>
            <div class="tutor-heatmap-legend mt-3">
              <span class="status-pill tutor-heatmap-legend__pill tutor-heatmap-legend__pill--high">High load</span>
              <span class="status-pill tutor-heatmap-legend__pill tutor-heatmap-legend__pill--balanced">Balanced</span>
              <span class="status-pill tutor-heatmap-legend__pill tutor-heatmap-legend__pill--risk">Underutilized</span>
            </div>
          </div>
        </section>
      </div>

      <div class="col-xl-8">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Tutor heatmap</p>
              <h3 class="panel-title">Teaching hours by tutor</h3>
            </div>
            <span class="feature-pill"><i class="bi bi-thermometer-half"></i> Green to red by hours taught</span>
          </div>
          <div class="tutor-heatmap-grid">
            ${tutorHeatmap}
          </div>
        </section>
      </div>
    </section>
  `;
}
