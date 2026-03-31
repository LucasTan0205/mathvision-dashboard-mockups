/* ═══════════════════════════════════════════════════════════
   Tutor Profile Database & Search – Page Module
   localStorage key: 'mathvision-tutors'
   ═══════════════════════════════════════════════════════════ */

const LS_KEY = 'mathvision-tutors';

const CURRICULA = ['PSLE', 'IGCSE', 'IB', 'A-Level'];
const TOPICS = ['Algebra', 'Calculus', 'Statistics', 'Trigonometry', 'Geometry', 'Number Theory', 'Probability', 'Fractions', 'Ratios', 'Percentages'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['AM', 'PM', 'Eve'];
const SORT_OPTIONS = [
  { value: 'experience-desc', label: 'Experience (high → low)' },
  { value: 'experience-asc',  label: 'Experience (low → high)' },
  { value: 'name-asc',        label: 'Name A → Z' },
  { value: 'name-desc',       label: 'Name Z → A' }
];

/* ── Persistence ───────────────────────────────────────── */

function loadTutors() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}

function saveTutors(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* ── Helpers ───────────────────────────────────────────── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function tagButtons(items, selectedSet, name) {
  return items.map(i => {
    const active = selectedSet.has(i);
    return `<button type="button" class="si-tag${active ? ' si-tag--active' : ''}" data-name="${name}" data-value="${esc(i)}">${esc(i)}</button>`;
  }).join('');
}

function availGrid(name, selectedSet) {
  let html = '<table class="tp-avail-grid"><thead><tr><th></th>';
  DAYS.forEach(d => { html += `<th>${d}</th>`; });
  html += '</tr></thead><tbody>';
  SLOTS.forEach(s => {
    html += `<tr><td class="tp-avail-grid__label">${s}</td>`;
    DAYS.forEach(d => {
      const key = `${d}-${s}`;
      const active = selectedSet.has(key);
      html += `<td><button type="button" class="tp-avail-cell${active ? ' tp-avail-cell--active' : ''}" data-name="${name}" data-value="${key}"></button></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function sortedTutors(tutors, sortKey) {
  const arr = [...tutors];
  switch (sortKey) {
    case 'experience-desc': return arr.sort((a, b) => b.experience - a.experience);
    case 'experience-asc':  return arr.sort((a, b) => a.experience - b.experience);
    case 'name-asc':        return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':       return arr.sort((a, b) => b.name.localeCompare(a.name));
    default: return arr;
  }
}

/* ── Content builder ───────────────────────────────────── */

export function createTutorProfilesContent() {
  const sortOpts = SORT_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');

  return `
    <!-- Form -->
    <section class="si-panel" id="tpFormPanel">
      <div class="si-panel__header">
        <div>
          <p class="panel-label">Administration</p>
          <h3 class="panel-title" id="tpFormTitle">Add tutor profile</h3>
        </div>
        <button class="btn mp-btn mp-btn--secondary si-toggle-form" type="button" id="tpToggleBtn"><i class="bi bi-chevron-up"></i> Collapse</button>
      </div>

      <form id="tpForm" class="si-form" novalidate>
        <input type="hidden" id="tpEditId" value="">

        <div class="si-form__row">
          <div class="si-field">
            <label class="si-field__label" for="tpName">Tutor name <span class="text-danger">*</span></label>
            <input class="si-field__input" id="tpName" type="text" required placeholder="e.g. James Lim" autocomplete="off">
            <p class="si-field__error" id="tpNameErr"></p>
          </div>
          <div class="si-field">
            <label class="si-field__label" for="tpExperience">Years of experience <span class="text-danger">*</span></label>
            <input class="si-field__input" id="tpExperience" type="number" min="0" max="50" required placeholder="e.g. 5" autocomplete="off">
            <p class="si-field__error" id="tpExpErr"></p>
          </div>
        </div>

        <div class="si-field">
          <label class="si-field__label">Curriculum familiarity</label>
          <div class="si-tags" id="tpCurricula">${tagButtons(CURRICULA, new Set(), 'tp-curr')}</div>
        </div>

        <div class="si-field">
          <label class="si-field__label">Topic speciality</label>
          <div class="si-tags" id="tpTopics">${tagButtons(TOPICS, new Set(), 'tp-topic')}</div>
        </div>

        <div class="si-field">
          <label class="si-field__label">Availability (click cells)</label>
          <div class="tp-avail-wrap" id="tpAvail">${availGrid('tp-avail', new Set())}</div>
        </div>

        <div class="si-field">
          <label class="si-field__label" for="tpHistory">Lesson history / notes</label>
          <textarea class="si-field__input si-field__textarea" id="tpHistory" rows="3" placeholder="Past students, session summaries, etc."></textarea>
        </div>

        <div class="si-form__actions">
          <button class="btn mp-btn mp-btn--primary" type="submit" id="tpSubmit"><i class="bi bi-plus-circle"></i> Add tutor</button>
          <button class="btn mp-btn mp-btn--secondary" type="button" id="tpCancel" style="display:none"><i class="bi bi-x-circle"></i> Cancel edit</button>
        </div>
      </form>
    </section>

    <!-- Directory -->
    <section class="si-panel">
      <div class="si-panel__header">
        <div>
          <p class="panel-label">Directory</p>
          <h3 class="panel-title">Tutor profiles</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-person-badge"></i> <span id="tpCount">0</span> tutors</span>
      </div>

      <div class="si-search-row">
        <div class="si-search">
          <i class="bi bi-search"></i>
          <input class="si-search__input" id="tpSearch" type="text" placeholder="Search by name, curriculum, topic…" autocomplete="off">
        </div>
        <select class="si-field__input si-sort-select" id="tpSort">${sortOpts}</select>
      </div>

      <div id="tpList" class="si-records"></div>
      <p class="si-empty" id="tpEmpty" style="display:none">No tutor profiles yet. Use the form above to add one.</p>
    </section>

    <!-- Full profile overlay -->
    <div class="tp-overlay" id="tpOverlay" style="display:none">
      <div class="tp-profile" id="tpProfile"></div>
    </div>
  `;
}

const API_KEY = window.MATHVISION_API_KEY ?? 'dev-key';

/* ── Init ──────────────────────────────────────────────── */

export function initTutorProfiles() {
  const form      = document.getElementById('tpForm');
  const listEl    = document.getElementById('tpList');
  const searchEl  = document.getElementById('tpSearch');
  const sortEl    = document.getElementById('tpSort');
  const countEl   = document.getElementById('tpCount');
  const emptyEl   = document.getElementById('tpEmpty');
  const editIdEl  = document.getElementById('tpEditId');
  const cancelBtn = document.getElementById('tpCancel');
  const submitBtn = document.getElementById('tpSubmit');
  const formTitle = document.getElementById('tpFormTitle');
  const toggleBtn = document.getElementById('tpToggleBtn');
  const formPanel = document.getElementById('tpFormPanel');
  const overlay   = document.getElementById('tpOverlay');
  const profileEl = document.getElementById('tpProfile');

  let tutors = loadTutors();

  /* Tag toggle (both forms share class) */
  const bindTagToggles = (root) => {
    root.querySelectorAll('.si-tag').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('si-tag--active'));
    });
  };
  bindTagToggles(form);

  /* Availability grid toggle */
  const bindAvailCells = (root) => {
    root.querySelectorAll('.tp-avail-cell').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('tp-avail-cell--active'));
    });
  };
  bindAvailCells(form);

  /* Toggle form */
  toggleBtn.addEventListener('click', () => {
    formPanel.classList.toggle('si-panel--collapsed');
    const collapsed = formPanel.classList.contains('si-panel--collapsed');
    toggleBtn.innerHTML = collapsed ? '<i class="bi bi-chevron-down"></i> Expand' : '<i class="bi bi-chevron-up"></i> Collapse';
  });

  /* Helpers */
  function getActiveTags(name) {
    return Array.from(form.querySelectorAll(`.si-tag--active[data-name="${name}"]`)).map(b => b.dataset.value);
  }

  function getActiveAvail() {
    return Array.from(form.querySelectorAll('.tp-avail-cell--active')).map(b => b.dataset.value);
  }

  function setActiveTags(name, values) {
    const set = new Set(values);
    form.querySelectorAll(`.si-tag[data-name="${name}"]`).forEach(b => {
      b.classList.toggle('si-tag--active', set.has(b.dataset.value));
    });
  }

  function setActiveAvail(values) {
    const set = new Set(values);
    form.querySelectorAll('.tp-avail-cell').forEach(b => {
      b.classList.toggle('tp-avail-cell--active', set.has(b.dataset.value));
    });
  }

  function clearForm() {
    form.reset();
    editIdEl.value = '';
    form.querySelectorAll('.si-tag--active').forEach(b => b.classList.remove('si-tag--active'));
    form.querySelectorAll('.tp-avail-cell--active').forEach(b => b.classList.remove('tp-avail-cell--active'));
    form.querySelectorAll('.si-field__error').forEach(e => { e.textContent = ''; });
    cancelBtn.style.display = 'none';
    submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add tutor';
    formTitle.textContent = 'Add tutor profile';
  }

  function validate() {
    let ok = true;
    const name = document.getElementById('tpName');
    const nameErr = document.getElementById('tpNameErr');
    const exp = document.getElementById('tpExperience');
    const expErr = document.getElementById('tpExpErr');
    if (!name.value.trim()) { nameErr.textContent = 'Name is required'; ok = false; } else { nameErr.textContent = ''; }
    if (!exp.value || Number(exp.value) < 0) { expErr.textContent = 'Valid experience required'; ok = false; } else { expErr.textContent = ''; }
    return ok;
  }

  /* Render availability read-only mini-grid */
  function readOnlyAvail(values) {
    const set = new Set(values);
    let html = '<table class="tp-avail-grid tp-avail-grid--readonly"><thead><tr><th></th>';
    DAYS.forEach(d => { html += `<th>${d}</th>`; });
    html += '</tr></thead><tbody>';
    SLOTS.forEach(s => {
      html += `<tr><td class="tp-avail-grid__label">${s}</td>`;
      DAYS.forEach(d => {
        const key = `${d}-${s}`;
        html += `<td><span class="tp-avail-cell tp-avail-cell--ro${set.has(key) ? ' tp-avail-cell--active' : ''}"></span></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  /* Render list */
  function render() {
    const lc = searchEl.value.toLowerCase();
    let filtered = tutors;
    if (lc) {
      filtered = tutors.filter(t =>
        t.name.toLowerCase().includes(lc) ||
        t.curricula.some(c => c.toLowerCase().includes(lc)) ||
        t.topics.some(tp => tp.toLowerCase().includes(lc))
      );
    }
    filtered = sortedTutors(filtered, sortEl.value);

    countEl.textContent = tutors.length;
    emptyEl.style.display = filtered.length ? 'none' : '';

    listEl.innerHTML = filtered.map(t => `
      <article class="tp-card" data-id="${esc(t.id)}">
        <div class="tp-card__head">
          <span class="mp-relief__avatar">${esc(t.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span>
          <div class="tp-card__info">
            <strong class="tp-card__name">${esc(t.name)}</strong>
            <span class="tp-card__exp">${t.experience} yr${t.experience !== 1 ? 's' : ''} experience</span>
          </div>
          <div class="tp-card__tags">
            ${t.curricula.map(c => `<span class="cu-status cu-status--green">${esc(c)}</span>`).join(' ')}
          </div>
          <div class="si-record__actions">
            <button class="btn mp-btn mp-btn--outline mp-btn--sm tp-view" type="button" data-id="${esc(t.id)}"><i class="bi bi-eye"></i> View</button>
            <button class="btn mp-btn mp-btn--outline mp-btn--sm tp-edit" type="button" data-id="${esc(t.id)}"><i class="bi bi-pencil"></i></button>
            <button class="btn mp-btn mp-btn--outline mp-btn--sm tp-delete" type="button" data-id="${esc(t.id)}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
        <div class="tp-card__topics">${t.topics.map(tp => `<span class="si-inline-tag">${esc(tp)}</span>`).join(' ')}</div>
      </article>
    `).join('');

    /* Bind view */
    listEl.querySelectorAll('.tp-view').forEach(btn => {
      btn.addEventListener('click', () => openProfile(btn.dataset.id));
    });

    /* Bind edit */
    listEl.querySelectorAll('.tp-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = tutors.find(x => x.id === btn.dataset.id);
        if (!t) return;
        editIdEl.value = t.id;
        document.getElementById('tpName').value = t.name;
        document.getElementById('tpExperience').value = t.experience;
        document.getElementById('tpHistory').value = t.history;
        setActiveTags('tp-curr', t.curricula);
        setActiveTags('tp-topic', t.topics);
        setActiveAvail(t.availability);
        cancelBtn.style.display = '';
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Update tutor';
        formTitle.textContent = 'Edit tutor profile';
        formPanel.classList.remove('si-panel--collapsed');
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* Bind delete */
    listEl.querySelectorAll('.tp-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        tutors = tutors.filter(x => x.id !== btn.dataset.id);
        saveTutors(tutors);
        render();
      });
    });
  }

  /* Full profile overlay */
  function openProfile(id) {
    const t = tutors.find(x => x.id === id);
    if (!t) return;
    profileEl.innerHTML = `
      <button class="btn mp-btn mp-btn--secondary tp-close" type="button"><i class="bi bi-x-lg"></i> Close</button>
      <div class="tp-profile__header">
        <span class="mp-relief__avatar tp-profile__avatar">${esc(t.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span>
        <div>
          <h3 class="tp-profile__name">${esc(t.name)}</h3>
          <p class="tp-profile__exp">${t.experience} year${t.experience !== 1 ? 's' : ''} teaching experience</p>
        </div>
      </div>
      <div class="tp-profile__section">
        <p class="panel-label">Curriculum familiarity</p>
        <div class="tp-card__tags">${t.curricula.map(c => `<span class="cu-status cu-status--green">${esc(c)}</span>`).join(' ')}</div>
      </div>
      <div class="tp-profile__section">
        <p class="panel-label">Topic specialities</p>
        <div>${t.topics.map(tp => `<span class="si-inline-tag">${esc(tp)}</span>`).join(' ')}</div>
      </div>
      <div class="tp-profile__section">
        <p class="panel-label">Availability</p>
        ${readOnlyAvail(t.availability)}
      </div>
      ${t.history ? `<div class="tp-profile__section"><p class="panel-label">Lesson history</p><p class="tp-profile__text">${esc(t.history)}</p></div>` : ''}
      <p class="si-record__date">Profile created ${new Date(t.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    `;
    overlay.style.display = '';
    profileEl.querySelector('.tp-close').addEventListener('click', () => { overlay.style.display = 'none'; });
  }

  /* Close overlay on backdrop click */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  /* Form submit */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const record = {
      id: editIdEl.value || uid(),
      name: document.getElementById('tpName').value.trim(),
      experience: Number(document.getElementById('tpExperience').value),
      curricula: getActiveTags('tp-curr'),
      topics: getActiveTags('tp-topic'),
      availability: getActiveAvail(),
      history: document.getElementById('tpHistory').value.trim(),
      createdAt: editIdEl.value ? (tutors.find(t => t.id === editIdEl.value)?.createdAt || Date.now()) : Date.now()
    };

    if (editIdEl.value) {
      tutors = tutors.map(t => t.id === editIdEl.value ? record : t);
    } else {
      tutors.unshift(record);
    }
    saveTutors(tutors);
    clearForm();
    render();
  });

  cancelBtn.addEventListener('click', () => clearForm());
  searchEl.addEventListener('input', () => render());
  sortEl.addEventListener('change', () => render());

  render();

  /* Seed from CSV if localStorage is empty */
  async function seedTutorsIfEmpty() {
    // Never overwrite existing records
    if (loadTutors().length > 0) return;
    try {
      const res = await fetch('/data/tutors', { headers: { 'X-API-Key': API_KEY } });
      if (!res.ok) return;
      const rows = await res.json();
      if (!rows.length) return;
      const mapped = rows.map(r => ({
        id: uid(),
        name: r.tutor_name ?? r.name ?? '',
        experience: parseInt(r.years_experience ?? r.experience ?? '0', 10) || 0,
        curricula: r.primary_curriculum ? [r.primary_curriculum] : [],
        topics: r.specialty_topic ? [r.specialty_topic] : [],
        availability: [],
        history: '',
        createdAt: Date.now()
      }));
      tutors = mapped;
      saveTutors(tutors);
      render();
    } catch { /* silent — empty state shown */ }
  }

  seedTutorsIfEmpty();
}
