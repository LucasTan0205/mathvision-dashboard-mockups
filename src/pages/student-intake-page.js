/* ═══════════════════════════════════════════════════════════
   Student Intake – Page Module
   localStorage key: 'mathvision-students'
   ═══════════════════════════════════════════════════════════ */

const LS_KEY = 'mathvision-students';

const CURRICULA = ['PSLE', 'IGCSE', 'IB', 'A-Level', 'Other'];
const GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'J1', 'J2'];
const TOPICS = ['Algebra', 'Fractions', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry', 'Number Theory', 'Probability', 'Ratios', 'Percentages'];
const SLOTS = ['Mon AM', 'Mon PM', 'Mon Eve', 'Tue AM', 'Tue PM', 'Tue Eve', 'Wed AM', 'Wed PM', 'Wed Eve', 'Thu AM', 'Thu PM', 'Thu Eve', 'Fri AM', 'Fri PM', 'Fri Eve', 'Sat AM', 'Sat PM', 'Sun AM'];

/* ── Persistence ───────────────────────────────────────── */

function loadStudents() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}

function saveStudents(list) {
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

function optionsHtml(items, selected) {
  return items.map(i => `<option value="${esc(i)}"${selected === i ? ' selected' : ''}>${esc(i)}</option>`).join('');
}

function tagButtons(items, selectedSet, name) {
  return items.map(i => {
    const active = selectedSet.has(i);
    return `<button type="button" class="si-tag${active ? ' si-tag--active' : ''}" data-name="${name}" data-value="${esc(i)}">${esc(i)}</button>`;
  }).join('');
}

/* ── Content builder ───────────────────────────────────── */

export function createStudentIntakeContent() {
  return `
    <!-- Form -->
    <section class="si-panel" id="siFormPanel">
      <div class="si-panel__header">
        <div>
          <p class="panel-label">New record</p>
          <h3 class="panel-title" id="siFormTitle">Add student</h3>
        </div>
        <button class="btn mp-btn mp-btn--secondary si-toggle-form" type="button" id="siToggleBtn"><i class="bi bi-chevron-up"></i> Collapse</button>
      </div>

      <form id="siForm" class="si-form" novalidate>
        <input type="hidden" id="siEditId" value="">

        <div class="si-form__row">
          <div class="si-field">
            <label class="si-field__label" for="siName">Student name <span class="text-danger">*</span></label>
            <input class="si-field__input" id="siName" type="text" required placeholder="e.g. Aiden Lim" autocomplete="off">
            <p class="si-field__error" id="siNameErr"></p>
          </div>
          <div class="si-field">
            <label class="si-field__label" for="siStudentId">Student ID <span class="text-danger">*</span></label>
            <input class="si-field__input" id="siStudentId" type="text" required placeholder="e.g. MV-20260301" autocomplete="off">
            <p class="si-field__error" id="siStudentIdErr"></p>
          </div>
        </div>

        <div class="si-form__row">
          <div class="si-field">
            <label class="si-field__label" for="siCurriculum">Curriculum <span class="text-danger">*</span></label>
            <select class="si-field__input" id="siCurriculum" required>
              <option value="">Select curriculum</option>
              ${optionsHtml(CURRICULA)}
            </select>
          </div>
          <div class="si-field">
            <label class="si-field__label" for="siGrade">Grade / Year level <span class="text-danger">*</span></label>
            <select class="si-field__input" id="siGrade" required>
              <option value="">Select level</option>
              ${optionsHtml(GRADES)}
            </select>
          </div>
        </div>

        <div class="si-field">
          <label class="si-field__label">Weak topics</label>
          <div class="si-tags" id="siTopics">${tagButtons(TOPICS, new Set(), 'topics')}</div>
        </div>

        <div class="si-field">
          <label class="si-field__label">Requested lesson slot</label>
          <div class="si-tags" id="siSlots">${tagButtons(SLOTS, new Set(), 'slots')}</div>
        </div>

        <div class="si-form__row">
          <div class="si-field">
            <label class="si-field__label" for="siNotes">Learning needs / Notes</label>
            <textarea class="si-field__input si-field__textarea" id="siNotes" rows="3" placeholder="Any special learning requirements..."></textarea>
          </div>
          <div class="si-field">
            <label class="si-field__label" for="siParent">Parent preferences (optional)</label>
            <textarea class="si-field__input si-field__textarea" id="siParent" rows="3" placeholder="Preferred tutor, schedule flexibility, etc."></textarea>
          </div>
        </div>

        <div class="si-form__actions">
          <button class="btn mp-btn mp-btn--primary" type="submit" id="siSubmit"><i class="bi bi-plus-circle"></i> Add student</button>
          <button class="btn mp-btn mp-btn--secondary" type="button" id="siCancel" style="display:none"><i class="bi bi-x-circle"></i> Cancel edit</button>
        </div>
      </form>
    </section>

    <!-- Records list -->
    <section class="si-panel">
      <div class="si-panel__header">
        <div>
          <p class="panel-label">Records</p>
          <h3 class="panel-title">Student directory</h3>
        </div>
        <span class="feature-pill"><i class="bi bi-people"></i> <span id="siCount">0</span> students</span>
      </div>

      <div class="si-search-row">
        <div class="si-search">
          <i class="bi bi-search"></i>
          <input class="si-search__input" id="siSearch" type="text" placeholder="Search by name, ID, curriculum, topic…" autocomplete="off">
        </div>
      </div>

      <div id="siList" class="si-records"></div>
      <p class="si-empty" id="siEmpty" style="display:none">No student records yet. Use the form above to add one.</p>
    </section>
  `;
}

/* ── Init (wired after DOM mount) ──────────────────────── */

export function initStudentIntake() {
  const form     = document.getElementById('siForm');
  const list     = document.getElementById('siList');
  const search   = document.getElementById('siSearch');
  const countEl  = document.getElementById('siCount');
  const emptyEl  = document.getElementById('siEmpty');
  const editIdEl = document.getElementById('siEditId');
  const cancelBtn = document.getElementById('siCancel');
  const submitBtn = document.getElementById('siSubmit');
  const formTitle = document.getElementById('siFormTitle');
  const toggleBtn = document.getElementById('siToggleBtn');
  const formPanel = document.getElementById('siFormPanel');

  let students = loadStudents();

  /* Tag toggle */
  document.querySelectorAll('.si-tag').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('si-tag--active'));
  });

  /* Toggle form visibility */
  toggleBtn.addEventListener('click', () => {
    formPanel.classList.toggle('si-panel--collapsed');
    const collapsed = formPanel.classList.contains('si-panel--collapsed');
    toggleBtn.innerHTML = collapsed ? '<i class="bi bi-chevron-down"></i> Expand' : '<i class="bi bi-chevron-up"></i> Collapse';
  });

  /* Helpers */
  function getActiveTags(name) {
    return Array.from(document.querySelectorAll(`.si-tag--active[data-name="${name}"]`)).map(b => b.dataset.value);
  }

  function setActiveTags(name, values) {
    const set = new Set(values);
    document.querySelectorAll(`.si-tag[data-name="${name}"]`).forEach(b => {
      b.classList.toggle('si-tag--active', set.has(b.dataset.value));
    });
  }

  function clearForm() {
    form.reset();
    editIdEl.value = '';
    document.querySelectorAll('.si-tag--active').forEach(b => b.classList.remove('si-tag--active'));
    document.querySelectorAll('.si-field__error').forEach(e => { e.textContent = ''; });
    cancelBtn.style.display = 'none';
    submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Add student';
    formTitle.textContent = 'Add student';
  }

  function validate() {
    let ok = true;
    const fields = [
      { id: 'siName',       errId: 'siNameErr',      msg: 'Name is required' },
      { id: 'siStudentId',  errId: 'siStudentIdErr',  msg: 'Student ID is required' }
    ];
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const err = document.getElementById(f.errId);
      if (!el.value.trim()) { err.textContent = f.msg; ok = false; } else { err.textContent = ''; }
    });
    if (!document.getElementById('siCurriculum').value) ok = false;
    if (!document.getElementById('siGrade').value) ok = false;
    return ok;
  }

  /* Render list */
  function render(filter = '') {
    const lc = filter.toLowerCase();
    const filtered = lc
      ? students.filter(s =>
          s.name.toLowerCase().includes(lc) ||
          s.studentId.toLowerCase().includes(lc) ||
          s.curriculum.toLowerCase().includes(lc) ||
          s.grade.toLowerCase().includes(lc) ||
          s.topics.some(t => t.toLowerCase().includes(lc))
        )
      : students;

    countEl.textContent = students.length;
    emptyEl.style.display = filtered.length ? 'none' : '';

    list.innerHTML = filtered.map(s => `
      <article class="si-record" data-id="${esc(s.id)}">
        <div class="si-record__head">
          <div class="si-record__summary">
            <strong class="si-record__name">${esc(s.name)}</strong>
            <span class="si-record__id">${esc(s.studentId)}</span>
            <span class="cu-status cu-status--green">${esc(s.curriculum)}</span>
            <span class="cu-status cu-status--amber">${esc(s.grade)}</span>
          </div>
          <div class="si-record__actions">
            <button class="btn mp-btn mp-btn--outline mp-btn--sm si-edit" type="button" data-id="${esc(s.id)}"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn mp-btn mp-btn--outline mp-btn--sm si-delete" type="button" data-id="${esc(s.id)}"><i class="bi bi-trash"></i></button>
            <button class="btn mp-btn mp-btn--outline mp-btn--sm si-expand" type="button"><i class="bi bi-chevron-down"></i></button>
          </div>
        </div>
        <div class="si-record__body">
          ${s.topics.length ? `<p><strong>Weak topics:</strong> ${s.topics.map(t => `<span class="si-inline-tag">${esc(t)}</span>`).join(' ')}</p>` : ''}
          ${s.slots.length ? `<p><strong>Lesson slots:</strong> ${s.slots.map(t => `<span class="si-inline-tag si-inline-tag--slot">${esc(t)}</span>`).join(' ')}</p>` : ''}
          ${s.notes ? `<p><strong>Learning needs:</strong> ${esc(s.notes)}</p>` : ''}
          ${s.parent ? `<p><strong>Parent preferences:</strong> ${esc(s.parent)}</p>` : ''}
          <p class="si-record__date">Added ${new Date(s.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </article>
    `).join('');

    /* Bind expand */
    list.querySelectorAll('.si-expand').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.si-record');
        card.classList.toggle('si-record--open');
        btn.innerHTML = card.classList.contains('si-record--open') ? '<i class="bi bi-chevron-up"></i>' : '<i class="bi bi-chevron-down"></i>';
      });
    });

    /* Bind edit */
    list.querySelectorAll('.si-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = students.find(x => x.id === btn.dataset.id);
        if (!s) return;
        editIdEl.value = s.id;
        document.getElementById('siName').value = s.name;
        document.getElementById('siStudentId').value = s.studentId;
        document.getElementById('siCurriculum').value = s.curriculum;
        document.getElementById('siGrade').value = s.grade;
        document.getElementById('siNotes').value = s.notes;
        document.getElementById('siParent').value = s.parent;
        setActiveTags('topics', s.topics);
        setActiveTags('slots', s.slots);
        cancelBtn.style.display = '';
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Update student';
        formTitle.textContent = 'Edit student';
        formPanel.classList.remove('si-panel--collapsed');
        formPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    /* Bind delete */
    list.querySelectorAll('.si-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        students = students.filter(x => x.id !== btn.dataset.id);
        saveStudents(students);
        render(search.value);
      });
    });
  }

  /* Form submit */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const record = {
      id: editIdEl.value || uid(),
      name: document.getElementById('siName').value.trim(),
      studentId: document.getElementById('siStudentId').value.trim(),
      curriculum: document.getElementById('siCurriculum').value,
      grade: document.getElementById('siGrade').value,
      topics: getActiveTags('topics'),
      slots: getActiveTags('slots'),
      notes: document.getElementById('siNotes').value.trim(),
      parent: document.getElementById('siParent').value.trim(),
      createdAt: editIdEl.value ? (students.find(s => s.id === editIdEl.value)?.createdAt || Date.now()) : Date.now()
    };

    if (editIdEl.value) {
      students = students.map(s => s.id === editIdEl.value ? record : s);
    } else {
      students.unshift(record);
    }
    saveStudents(students);
    clearForm();
    render(search.value);
  });

  /* Cancel edit */
  cancelBtn.addEventListener('click', () => clearForm());

  /* Search */
  search.addEventListener('input', () => render(search.value));

  /* Initial render */
  render();
}
