const LS_KEY = 'mathvision-analytics-metrics';

function formatAccuracy(accuracy) {
  return (parseFloat(accuracy) * 100).toFixed(1) + '%';
}

export { formatAccuracy };

function isStale(runTimestamp) {
  return Date.now() - new Date(runTimestamp).getTime() > 24 * 3600 * 1000;
}

export { isStale };

function renderLastUpdated(card, runTimestamp) {
  // Remove any existing last-updated label
  const existing = card.querySelector('.kpi-last-updated');
  if (existing) existing.remove();

  const label = document.createElement('p');
  label.className = 'kpi-last-updated';

  if (runTimestamp) {
    label.textContent = 'Last updated: ' + new Date(runTimestamp).toLocaleString();
    if (isStale(runTimestamp)) {
      label.classList.add('mp-badge--amber');
    }
  } else {
    label.textContent = 'Data freshness unknown';
  }

  card.appendChild(label);
}

function findMatchScoreCard() {
  const labels = document.querySelectorAll('.kpi-card__label');
  for (const label of labels) {
    if (label.textContent.trim() === 'Match score') {
      return label.closest('article');
    }
  }
  return null;
}

function applyFromCache(cache) {
  const card = findMatchScoreCard();
  if (!card) return;
  const valueEl = card.querySelector('.kpi-card__value');
  if (valueEl) valueEl.textContent = cache ? cache.matchScore : '—';
  renderLastUpdated(card, cache ? cache.runTimestamp : null);
}

export async function initDashboard() {
  const API_KEY = window.MATHVISION_API_KEY ?? 'dev-key';

  try {
    const [metricsRes, rankingsRes] = await Promise.all([
      fetch('/analytics/model-metrics', { headers: { 'X-API-Key': API_KEY } }),
      fetch('/analytics/scenario-rankings', { headers: { 'X-API-Key': API_KEY } })
    ]);

    const metricsRows = metricsRes.ok ? await metricsRes.json() : [];
    const rankingsRows = rankingsRes.ok ? await rankingsRes.json() : [];

    if (!metricsRows.length && !rankingsRows.length) {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      applyFromCache(cached);
      return;
    }

    const matchScore = metricsRows.length ? formatAccuracy(metricsRows[0].accuracy) : '—';
    const studentCount = new Set(rankingsRows.map(r => r.student_id)).size;
    const runTimestamp = metricsRows.length ? (metricsRows[0].run_timestamp ?? null) : null;

    const cache = { matchScore, studentCount, fetchedAt: new Date().toISOString(), runTimestamp };
    try { localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch { /* silent */ }

    const card = findMatchScoreCard();
    if (card) {
      const valueEl = card.querySelector('.kpi-card__value');
      if (valueEl) valueEl.textContent = matchScore;
      renderLastUpdated(card, runTimestamp);
    }
  } catch {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    applyFromCache(cached);
  }
}

export function createDashboardContent() {
  const kpis = [
    { title: 'Overall retention', value: '84.2%', delta: 'Up 3.7% vs last quarter' },
    { title: 'Part-time utilization', value: '68%', delta: '12% above network average' },
    { title: 'Match score', value: '91.4%', delta: 'Stable quality across open shifts' },
    { title: 'Payroll status', value: '100%', delta: 'All batches cleared with zero errors' }
  ];

  const kpiCards = kpis
    .map(
      (card) => `
        <div class="col-lg-3 col-md-6">
          <article class="shell-kpi h-100">
            <p class="kpi-card__label">${card.title}</p>
            <h3 class="kpi-card__value">${card.value}</h3>
            <p class="kpi-card__meta">${card.delta}</p>
          </article>
        </div>`
    )
    .join('');

  return `
    <section class="hero-panel">
      <div class="hero-panel__grid">
        <div class="hero-panel__copy">
          <p class="page-eyebrow">Daily operating brief</p>
          <h2 class="hero-panel__title">Staffing pressure is easing, but two demand windows still need intervention.</h2>
          <p class="hero-panel__text">
            Match quality remains high across the network and payroll is fully on track. The most important work today is covering the late afternoon teaching peak and redistributing underutilized tutor hours in the early-morning blocks.
          </p>
          <div class="hero-badges">
            <span class="hero-badge"><i class="bi bi-arrow-up-right"></i> Coverage up 8.2%</span>
            <span class="hero-badge"><i class="bi bi-clock-history"></i> Next allocation at 4:30 PM</span>
            <span class="hero-badge"><i class="bi bi-check2-circle"></i> Payroll cleared</span>
          </div>
        </div>
        <aside class="hero-panel__aside">
          <div>
            <p class="panel-label">Priority signal</p>
            <div class="metric-lead">
              <span class="metric-lead__value">92.4%</span>
              <span class="metric-lead__delta positive-text">Coverage confidence</span>
            </div>
            <p class="metric-copy">Forecasted supply remains healthy, but 1.7 FTEs are still missing in the Tuesday late block.</p>
          </div>
          <div class="detail-grid">
            <div class="detail-card">
              <strong>17</strong>
              <span class="text-muted">Overstaffed teams available for rebalancing</span>
            </div>
            <div class="detail-card">
              <strong>9</strong>
              <span class="text-muted">Understaffed shifts still open</span>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="row g-4">${kpiCards}</section>

    <section class="row g-4">
      <div class="col-xl-6">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Allocation intelligence</p>
              <h3 class="panel-title">Manpower predictive allocation</h3>
            </div>
            <span class="feature-pill"><i class="bi bi-lightning-charge"></i> Real-time forecast</span>
          </div>

          <div class="metric-grid mb-4">
            <div class="metric-card">
              <p class="panel-label">Match accuracy</p>
              <p class="metric-card__value">98%</p>
              <p class="metric-note positive-text">Best result in six weeks</p>
            </div>
            <div class="metric-card">
              <p class="panel-label">Predicted demand</p>
              <p class="metric-card__value">82%</p>
              <p class="metric-note neutral-text">Core weekday load</p>
            </div>
            <div class="metric-card">
              <p class="panel-label">Current gap</p>
              <p class="metric-card__value">1.7 FTE</p>
              <p class="metric-note negative-text">Late block coverage short</p>
            </div>
          </div>

          <div class="detail-grid mb-4">
            <div class="detail-card">
              <span class="panel-label">Coverage progress</span>
              <strong>92.4%</strong>
              <div class="progress mt-3"><div class="progress-bar" style="width: 92.4%"></div></div>
            </div>
            <div class="detail-card">
              <span class="panel-label">Next allocation</span>
              <strong>Tue, 22 May</strong>
              <span class="text-muted">Recommended rebalance release at 4:30 PM</span>
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <p class="table-copy mb-0">Last refreshed 17 minutes ago with updated staffing availability.</p>
            <button class="btn btn-primary"><i class="bi bi-calendar-check me-2"></i>View schedule</button>
          </div>
        </section>
      </div>
      <div class="col-xl-6">
        <section class="shell-card h-100">
          <div class="shell-card__header">
            <div>
              <p class="panel-label">Utilization watch</p>
              <h3 class="panel-title">Tutor capacity utilization</h3>
            </div>
            <span class="feature-pill"><i class="bi bi-exclamation-triangle"></i> Two critical windows</span>
          </div>

          <div class="split-stat-grid mb-4">
            <div class="split-stat">
              <strong>73%</strong>
              <span class="text-muted">Overall tutor utilization</span>
            </div>
            <div class="split-stat">
              <strong class="text-primary">82%</strong>
              <span class="text-muted">Peak tutoring hours</span>
            </div>
            <div class="split-stat">
              <strong class="text-danger">68%</strong>
              <span class="text-muted">Off-peak tutor load</span>
            </div>
          </div>

          <div class="detail-grid mb-4">
            <div class="detail-card">
              <span class="panel-label">Tutor load</span>
              <strong>73%</strong>
              <div class="progress mt-3"><div class="progress-bar" style="width: 73%"></div></div>
            </div>
            <div class="detail-card">
              <span class="panel-label">Recommended move</span>
              <strong>Reassign 5 float staff</strong>
              <span class="text-muted">Shift available tutor hours from early blocks into the evening teaching peak.</span>
            </div>
          </div>

          <div class="signal-list">
            <div class="signal-list__item">
              <span><span class="status-circle available"></span><strong>17 overstaffed teams</strong></span>
              <span class="neutral-text">Ready for rebalance</span>
            </div>
            <div class="signal-list__item">
              <span><span class="status-circle busy"></span><strong>9 understaffed shifts</strong></span>
              <span class="negative-text">Needs action today</span>
            </div>
          </div>

          <div class="action-row mt-4">
            <button class="btn btn-outline-primary"><i class="bi bi-people-fill me-2"></i>Reassign staff</button>
            <button class="btn btn-success"><i class="bi bi-magic me-2"></i>Optimize schedule</button>
          </div>
        </section>
      </div>
    </section>
  `;
}
