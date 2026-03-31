// Student Portal Page
// Standalone — sidebar nav + multi-page layout

const DAYS  = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIMES = [];
for (let h = 8; h < 20; h++) { TIMES.push(`${h}:00`); TIMES.push(`${h}:30`); }

// Base Monday for the demo (Mar 17 2026 = "current week")
const BASE_MONDAY = new Date(2026, 2, 17);
const TODAY       = new Date(2026, 2, 19); // Wed Mar 19
const TODAY_COL   = 2;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateStudentId() {
  let id = localStorage.getItem('mv_student_id');
  if (!id) { id = generateUUID(); localStorage.setItem('mv_student_id', id); }
  return id;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function slotToTime(s) {
  const h = Math.floor(s / 2) + 8, m = (s % 2) * 30;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function formatRange(s, n) { return `${slotToTime(s)} – ${slotToTime(s + n)}`; }

function getWeekDates(offset = 0) {
  return DAYS.map((_, i) => {
    const d = new Date(BASE_MONDAY);
    d.setDate(BASE_MONDAY.getDate() + offset * 7 + i);
    return d;
  });
}

function fmtDate(d) {
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
}

export function createStudentPortalContent() {
  return `
<div id="sp-root">
  <!-- SIDEBAR -->
  <aside class="sp-sidebar">
    <div class="sp-sb-header">
      <div class="sp-brand">
        <div class="sp-brand-icon">MV</div>
        <div>
          <div class="sp-brand-name">MathVision</div>
          <div class="sp-brand-sub">Student Portal</div>
        </div>
      </div>
      <div class="sp-user-pill">
        <div class="sp-avatar" id="sp-nav-avatar">?</div>
        <div>
          <div class="sp-user-name" id="sp-nav-name">—</div>
          <div class="sp-user-role" id="sp-nav-role">Student</div>
        </div>
      </div>
    </div>
    <nav class="sp-sb-nav">
      <div class="sp-nav-label">Menu</div>
      <div class="sp-nav-item active" id="nav-register" onclick="spShowPage('register',this)">
        <svg class="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
        My Profile
      </div>
      <div class="sp-nav-item" id="nav-timetable" onclick="spShowPage('timetable',this)">
        <svg class="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Timetable
      </div>
      <div class="sp-nav-item" id="nav-history" onclick="spShowPage('history',this)">
        <svg class="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Lesson History
      </div>
      <div class="sp-nav-label" style="margin-top:16px;">Account</div>
      <div class="sp-nav-item" id="nav-settings" onclick="spShowPage('settings',this)">
        <svg class="sp-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        Settings
      </div>
    </nav>
  </aside>

  <!-- MAIN -->
  <main class="sp-main">
    <div class="sp-topbar">
      <div class="sp-breadcrumb">MathVision <span style="color:var(--border);margin:0 6px;">/</span> <span id="sp-breadcrumb-page">Register</span></div>
      <div class="sp-topbar-right">
        <div class="sp-notif-btn" id="sp-notif-btn">🔔<span class="sp-notif-dot" id="sp-notif-dot">1</span></div>
      </div>
    </div>

    <!-- PROFILE / REGISTER PAGE -->
    <div class="sp-page sp-content" id="page-register">
      <div class="sp-cal-header">
        <div>
          <div class="sp-page-title">My Profile</div>
          <div class="sp-page-sub">Your personal information and weekly availability.</div>
        </div>
        <button class="sp-btn sp-btn--primary" id="sp-submit-btn" onclick="document.getElementById('sp-form').requestSubmit()">Save Profile</button>
      </div>

      <div id="sp-success-banner" class="sp-banner sp-banner--success" style="display:none;">✓ Profile saved successfully!</div>
      <div id="sp-error-banner" class="sp-banner sp-banner--error" style="display:none;"></div>

      <form id="sp-form" novalidate>
        <!-- Avatar card -->
        <div class="sp-profile-av-section" style="margin-bottom:24px;">
          <div class="sp-profile-av" id="sp-profile-av-initials">?</div>
          <div>
            <div class="sp-profile-av-name" id="sp-profile-av-name">—</div>
            <div class="sp-profile-av-role">Mathematics Student</div>
          </div>
        </div>

        <div class="sp-psection-title">Personal Details</div>
        <div class="sp-form-grid">
          <div class="sp-field-group sp-field-full">
            <label class="sp-label" for="sp-name">Full Name</label>
            <input class="sp-input" id="sp-name" type="text" placeholder="e.g. Sarah Amira" autocomplete="name"/>
            <div class="sp-field-error" id="err-name"></div>
          </div>
          <div class="sp-field-group">
            <label class="sp-label" for="sp-curriculum">Curriculum</label>
            <select class="sp-input" id="sp-curriculum">
              <option value="">Select curriculum…</option>
              <option value="Local">Local</option>
              <option value="IGCSE">IGCSE</option>
              <option value="IB">IB</option>
            </select>
            <div class="sp-field-error" id="err-curriculum"></div>
          </div>
          <div class="sp-field-group">
            <label class="sp-label" for="sp-grade">Grade Level (5–12)</label>
            <input class="sp-input" id="sp-grade" type="number" min="5" max="12" placeholder="e.g. 10"/>
            <div class="sp-field-error" id="err-grade"></div>
          </div>
          <div class="sp-field-group">
            <label class="sp-label" for="sp-topic">Weak Topic</label>
            <select class="sp-input" id="sp-topic">
              <option value="">Select topic…</option>
              <option value="Fractions">Fractions</option>
              <option value="Algebra">Algebra</option>
              <option value="Geometry">Geometry</option>
              <option value="Calculus">Calculus</option>
              <option value="Statistics">Statistics</option>
            </select>
            <div class="sp-field-error" id="err-topic"></div>
          </div>
          <div class="sp-field-group">
            <label class="sp-label" for="sp-branch">Branch</label>
            <select class="sp-input" id="sp-branch">
              <option value="">Select branch…</option>
              <option value="Central">Central</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
            <div class="sp-field-error" id="err-branch"></div>
          </div>
        </div>

        <div class="sp-avail-section">
          <div class="sp-psection-title">Weekly Availability</div>
          <p class="sp-avail-sub">Click or drag to mark your available slots. Each slot = 30 minutes.</p>
          <div class="sp-field-error" id="err-slots" style="margin-bottom:10px;"></div>
          <div class="sp-tt-outer"><div class="sp-tt-grid" id="sp-tt-grid"></div></div>
        </div>
      </form>
    </div>

    <!-- TIMETABLE PAGE -->
    <div class="sp-page sp-content" id="page-timetable" style="display:none;">
      <div class="sp-cal-header">
        <div>
          <div class="sp-page-title">My Timetable</div>
          <div class="sp-page-sub">Drag to select · 30 min per slot · Bookings require ≥ 1 week notice</div>
        </div>
        <div class="sp-header-right">
          <button class="sp-btn sp-btn--outline" onclick="spClearSelection()">Clear</button>
          <button class="sp-btn sp-btn--primary" id="sp-request-btn" disabled onclick="spOpenConfirmModal()">Request Slots</button>
        </div>
      </div>
      <div class="sp-rule-notice" id="sp-rule-notice">🔒 <span>This week is not bookable. Navigate <strong>at least 1 week ahead</strong> to request slots.</span></div>
      <div class="sp-sel-bar" id="sp-sel-bar">
        <span>📌</span>
        <div class="sp-sel-bar-text"><strong id="sp-sel-count">0</strong> slot(s) selected — <span id="sp-sel-time"></span></div>
        <button class="sp-btn sp-btn--primary" onclick="spOpenConfirmModal()">Request →</button>
      </div>
      <div class="sp-week-display" id="sp-week-display"></div>
      <div class="sp-legend">
        <div class="sp-leg-item"><div class="sp-leg-dot" style="background:rgba(44,74,62,.15);border:1.5px solid var(--green-dark);"></div> Selecting</div>
        <div class="sp-leg-item"><div class="sp-leg-dot" style="background:rgba(44,74,62,.14);border:1.5px dashed var(--green-dark);"></div> Pending</div>
        <div class="sp-leg-item"><div class="sp-leg-dot" style="background:var(--green-dark);"></div> Confirmed</div>
        <div class="sp-leg-item"><div class="sp-leg-dot" style="background:repeating-linear-gradient(45deg,#ddd,#ddd 2px,#eee 2px,#eee 5px);"></div> Not bookable</div>
      </div>
      <div class="sp-tt-nav-wrap">
        <div class="sp-tt-side-btn" onclick="spChangeWeek(-1)">‹</div>
        <div class="sp-tt-outer"><div class="sp-tt-grid" id="sp-tt-main-grid"></div></div>
        <div class="sp-tt-side-btn" onclick="spChangeWeek(1)">›</div>
      </div>
    </div>

    <!-- LESSON HISTORY PAGE -->
    <div class="sp-page sp-content" id="page-history" style="display:none;">
      <div class="sp-cal-header">
        <div>
          <div class="sp-page-title">Lesson History</div>
          <div class="sp-page-sub">All completed Mathematics sessions</div>
        </div>
      </div>
      <div id="sp-history-list"></div>
    </div>

    <!-- SETTINGS PAGE -->
    <div class="sp-page sp-content" id="page-settings" style="display:none;">
      <div class="sp-cal-header">
        <div>
          <div class="sp-page-title">Settings</div>
          <div class="sp-page-sub">Manage your preferences</div>
        </div>
      </div>
      <div class="sp-settings-wrap">
        <div class="sp-settings-title">Notifications</div>
        <div class="sp-setting-row"><div><div class="sp-setting-name">Session Reminders</div><div class="sp-setting-sub">Get reminded 24 hours before a session</div></div><div class="sp-toggle active" onclick="this.classList.toggle('active')"><div class="sp-toggle-knob"></div></div></div>
        <div class="sp-setting-row"><div><div class="sp-setting-name">Rating Reminders</div><div class="sp-setting-sub">Remind me to rate sessions after they end</div></div><div class="sp-toggle active" onclick="this.classList.toggle('active')"><div class="sp-toggle-knob"></div></div></div>
        <div class="sp-setting-row"><div><div class="sp-setting-name">Tutor Assignment Alerts</div><div class="sp-setting-sub">Notify when a tutor is assigned to my slot</div></div><div class="sp-toggle active" onclick="this.classList.toggle('active')"><div class="sp-toggle-knob"></div></div></div>
        <div class="sp-setting-row"><div><div class="sp-setting-name">Cancellation Alerts</div><div class="sp-setting-sub">Notify if a session is cancelled by the centre</div></div><div class="sp-toggle" onclick="this.classList.toggle('active')"><div class="sp-toggle-knob"></div></div></div>
        <div class="sp-settings-title">Account</div>
        <div class="sp-setting-row"><div><div class="sp-setting-name">Change Password</div><div class="sp-setting-sub">Update your login password</div></div><button class="sp-btn sp-btn--outline" style="font-size:11px;padding:6px 12px;" onclick="spShowToast('Password reset email sent.')">Reset</button></div>
        <div class="sp-setting-row"><div><div class="sp-setting-name" style="color:var(--red);">Log Out</div><div class="sp-setting-sub">Sign out of your account</div></div><button class="sp-btn" style="font-size:11px;padding:6px 12px;background:var(--red-light);color:var(--red);border:1px solid #E0A090;" onclick="['mv_student_id','mv_student_name','mv_student_profile'].forEach(k=>localStorage.removeItem(k));window.location.href='/';">Log Out</button></div>
      </div>
    </div>
  </main>

  <!-- SESSION POPUP -->
  <div class="sp-overlay" id="sp-sess-overlay" onclick="spCloseSessOverlay(event)">
    <div class="sp-popup" id="sp-sess-popup">
      <div class="sp-pop-head"><div id="sp-pop-head"></div><div class="sp-pop-close" onclick="spCloseSessDirect()">✕</div></div>
      <div class="sp-pop-body" id="sp-pop-body"></div>
    </div>
  </div>

  <!-- CONFIRM BOOKING MODAL -->
  <div class="sp-overlay" id="sp-confirm-overlay" onclick="spCloseConfirmOverlay(event)">
    <div class="sp-confirm-box">
      <div class="sp-cb-icon">📋</div>
      <div class="sp-cb-title">Confirm Request</div>
      <div class="sp-cb-sub">These slots will be submitted for review. A tutor will be assigned and you'll be notified once confirmed.</div>
      <div class="sp-cb-slots" id="sp-cb-slots"></div>
      <div class="sp-modal-actions">
        <button class="sp-btn sp-btn--outline" onclick="document.getElementById('sp-confirm-overlay').classList.remove('open')">Cancel</button>
        <button class="sp-btn sp-btn--primary" onclick="spConfirmSlots()">✓ Confirm</button>
      </div>
    </div>
  </div>

  <!-- CANCEL SESSION MODAL -->
  <div class="sp-overlay" id="sp-cancel-overlay" onclick="spCloseCancelOverlay(event)">
    <div class="sp-confirm-box">
      <div class="sp-cb-icon">🗑️</div>
      <div class="sp-cb-title">Cancel Session?</div>
      <div class="sp-cb-sub">Are you sure you want to cancel this session? This action cannot be undone.</div>
      <div class="sp-cb-slots" id="sp-cancel-slot-info" style="margin-bottom:18px;"></div>
      <div class="sp-modal-actions">
        <button class="sp-btn sp-btn--outline" onclick="document.getElementById('sp-cancel-overlay').classList.remove('open')">Keep it</button>
        <button class="sp-btn" style="flex:1;background:var(--red);color:#fff;" onclick="spDoCancelSession()">Cancel Session</button>
      </div>
    </div>
  </div>

  <!-- NOTIFICATIONS PANEL -->
  <div class="sp-notif-overlay" id="sp-notif-overlay" onclick="spCloseNotifOverlay(event)">
    <div class="sp-notif-popup">
      <div class="sp-notif-popup-head">
        <div><div class="sp-notif-popup-title">Notifications</div><div class="sp-notif-popup-sub">Reminders &amp; updates</div></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="sp-btn sp-btn--outline" style="font-size:11px;padding:5px 12px;" onclick="spMarkAllRead()">Mark all read</button>
          <div class="sp-pop-close" onclick="spCloseNotifDirect()">✕</div>
        </div>
      </div>
      <div class="sp-notif-popup-body" id="sp-notif-list"></div>
    </div>
  </div>

  <div class="sp-toast" id="sp-toast"></div>
</div>
`;
}

export function initStudentPortal() {
  const studentId = getOrCreateStudentId();

  // ── Pending slot requests (local, for future weeks) ───────────────────
  const SESSIONS = []; // populated when user submits slot requests

  const LESSON_HISTORY = [];

  const NOTIFS = [
    { id:'n1', icon:'⭐', iconClass:'sp-ni-amber', title:'Rate your session with Ms. Lena Chong', body:'Your Mathematics session on Tue, 10 Mar has ended. Share your feedback to help us improve.', time:'2 hours ago', unread:true, action:{ label:'Rate Now', fn:"spOpenRateFromNotif('s2')" } },
    { id:'n2', icon:'✅', iconClass:'sp-ni-green', title:'Tutor assigned for Wed 19 Mar', body:'Ms. Rania Yusof has been assigned to your 9:00–10:00 session this Wednesday.', time:'2 days ago', unread:false, action:null },
  ];

  // ── State ──────────────────────────────────────────────────────────────
  let weekOffset    = 0;
  let ttSelecting   = false;
  let ttSelStart    = null;
  let ttSelEnd      = null;
  let ttSelected    = new Set();
  let cancelTarget  = null;
  let feedbackStars = 0;

  // ── Registration availability grid state ───────────────────────────────
  const regSelectedSlots = new Set();
  let regDragging = false;
  let regDragAction = null;

  // ── Page switching ─────────────────────────────────────────────────────
  const PAGE_LABELS = { register:'My Profile', timetable:'Timetable', history:'Lesson History', settings:'Settings' };

  window.spShowPage = function(page, el) {
    document.querySelectorAll('.sp-page').forEach(p => p.style.display = 'none');
    const pg = document.getElementById('page-' + page);
    if (pg) pg.style.display = '';
    document.querySelectorAll('.sp-nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('sp-breadcrumb-page').textContent = PAGE_LABELS[page] || page;
    if (page === 'history') spRenderHistory();
    if (page === 'timetable') spBuildMainGrid();
    if (page === 'profile') spPopulateProfile();
  };

  // ── Registration form availability grid ───────────────────────────────
  function applyRegSlot(cell, key) {
    if (regDragAction === 'add') { regSelectedSlots.add(key); cell.classList.add('sp-slot--selected'); }
    else { regSelectedSlots.delete(key); cell.classList.remove('sp-slot--selected'); }
    clearFieldError('slots');
  }

  function buildAvailGrid() {
    const grid = document.getElementById('sp-tt-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const corner = document.createElement('div');
    corner.className = 'sp-tcell sp-tcell--corner';
    grid.appendChild(corner);
    DAYS.forEach(d => {
      const h = document.createElement('div');
      h.className = 'sp-hcell'; h.textContent = d; grid.appendChild(h);
    });
    TIMES.forEach(t => {
      const isHalf = t.endsWith(':30');
      const tc = document.createElement('div');
      tc.className = 'sp-tcell' + (isHalf ? ' sp-tcell--half' : '');
      tc.textContent = isHalf ? '' : t; grid.appendChild(tc);
      DAYS.forEach(d => {
        const key = `${d}_${t}`;
        const cell = document.createElement('div');
        cell.className = 'sp-slot' + (isHalf ? ' sp-slot--half' : '');
        cell.dataset.key = key;
        if (regSelectedSlots.has(key)) cell.classList.add('sp-slot--selected');
        cell.addEventListener('mousedown', e => {
          e.preventDefault(); regDragging = true;
          regDragAction = regSelectedSlots.has(key) ? 'remove' : 'add';
          applyRegSlot(cell, key);
        });
        cell.addEventListener('mouseenter', () => { if (regDragging) applyRegSlot(cell, key); });
        grid.appendChild(cell);
      });
    });
  }

  document.addEventListener('mouseup', () => { regDragging = false; regDragAction = null; ttSelecting = false; ttSelStart = null; ttSelEnd = null; spRenderTtSelection(); spUpdateSelBar(); });

  buildAvailGrid();

  // Pre-fill form from localStorage
  (function prefillForm() {
    const raw = localStorage.getItem('mv_student_profile');
    const p = raw ? JSON.parse(raw) : {};
    const name = p.name || '';
    if (name) document.getElementById('sp-name').value = name;
    if (p.curriculum)  document.getElementById('sp-curriculum').value = p.curriculum;
    if (p.grade_level) document.getElementById('sp-grade').value      = p.grade_level;
    if (p.weak_topic)  document.getElementById('sp-topic').value      = p.weak_topic;
    if (p.branch)      document.getElementById('sp-branch').value     = p.branch;
    if (Array.isArray(p.availability_slots)) {
      p.availability_slots.forEach(k => regSelectedSlots.add(k));
      buildAvailGrid();
    }
    spUpdateProfileAvatar(name);
  })();

  document.getElementById('sp-name').addEventListener('input', e => spUpdateProfileAvatar(e.target.value));

  function spUpdateProfileAvatar(name) {
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const av = document.getElementById('sp-profile-av-initials');
    const nm = document.getElementById('sp-profile-av-name');
    if (av) av.textContent = initials;
    if (nm) nm.textContent = name.trim() || '—';
  }

  // ── Validation ─────────────────────────────────────────────────────────
  function setFieldError(field, msg) {
    const el = document.getElementById(`err-${field}`);
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
    const input = document.getElementById(`sp-${field}`);
    if (input) input.classList.toggle('sp-input--error', !!msg);
  }
  function clearFieldError(field) { setFieldError(field, ''); }

  function validateForm() {
    let valid = true;
    const name = document.getElementById('sp-name').value.trim();
    if (!name) { setFieldError('name', 'Full name is required.'); valid = false; } else clearFieldError('name');
    const curriculum = document.getElementById('sp-curriculum').value;
    if (!curriculum) { setFieldError('curriculum', 'Please select a curriculum.'); valid = false; } else clearFieldError('curriculum');
    const gradeRaw = document.getElementById('sp-grade').value;
    const grade = parseInt(gradeRaw, 10);
    if (!gradeRaw || isNaN(grade) || grade < 5 || grade > 12) { setFieldError('grade', 'Grade level must be between 5 and 12.'); valid = false; } else clearFieldError('grade');
    const topic = document.getElementById('sp-topic').value;
    if (!topic) { setFieldError('topic', 'Please select a weak topic.'); valid = false; } else clearFieldError('topic');
    const branch = document.getElementById('sp-branch').value;
    if (!branch) { setFieldError('branch', 'Please select a branch.'); valid = false; } else clearFieldError('branch');
    if (regSelectedSlots.size === 0) { setFieldError('slots', 'Please select at least one availability slot.'); valid = false; } else clearFieldError('slots');
    return valid;
  }

  // ── Form submission ────────────────────────────────────────────────────
  const form = document.getElementById('sp-form');
  const successBanner = document.getElementById('sp-success-banner');
  const errorBanner   = document.getElementById('sp-error-banner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successBanner.style.display = 'none'; errorBanner.style.display = 'none';
    if (!validateForm()) return;
    const payload = {
      student_id: studentId,
      name: document.getElementById('sp-name').value.trim(),
      curriculum: document.getElementById('sp-curriculum').value,
      grade_level: parseInt(document.getElementById('sp-grade').value, 10),
      weak_topic: document.getElementById('sp-topic').value,
      branch: document.getElementById('sp-branch').value,
      availability_slots: Array.from(regSelectedSlots),
    };
    const submitBtn = document.getElementById('sp-submit-btn');
    submitBtn.disabled = true; submitBtn.textContent = 'Saving…';

    // Persist locally regardless of API availability
    localStorage.setItem('mv_student_name', payload.name);
    localStorage.setItem('mv_student_profile', JSON.stringify(payload));
    spUpdateNavUser(); spUpdateProfileAvatar(payload.name);

    try {
      const res = await fetch('/matching/students', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      if (res.ok) {
        successBanner.style.display = 'block';
        spShowToast('✓ Profile saved!');
        pairingsLoaded = false; pairingsError = false; // force timetable refresh on next visit
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail;
        errorBanner.textContent = typeof detail === 'string' ? detail : `Validation error (${res.status}). Please check your inputs.`;
        errorBanner.style.display = 'block';
      }
    } catch {
      successBanner.style.display = 'block';
      spShowToast('✓ Profile saved locally!');
    } finally { submitBtn.disabled = false; submitBtn.textContent = 'Save Profile'; }
  });

  // ── Nav user pill ──────────────────────────────────────────────────────
  function spUpdateNavUser() {
    const name = localStorage.getItem('mv_student_name') || '—';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const navName = document.getElementById('sp-nav-name');
    const navAv   = document.getElementById('sp-nav-avatar');
    if (navName) navName.textContent = name;
    if (navAv)   navAv.textContent   = initials;
  }
  spUpdateNavUser();

  // ── Profile page ───────────────────────────────────────────────────────
  function spPopulateProfile() {
    const raw = localStorage.getItem('mv_student_profile');
    const p = raw ? JSON.parse(raw) : {};
    const name = p.name || localStorage.getItem('mv_student_name') || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const el = id => document.getElementById(id);
    if (el('sp-profile-av-initials')) el('sp-profile-av-initials').textContent = initials;
    if (el('sp-profile-av-name'))     el('sp-profile-av-name').textContent     = name || '—';
    if (el('pf-name'))       el('pf-name').value       = name;
    if (el('pf-curriculum')) el('pf-curriculum').value = p.curriculum || '';
    if (el('pf-grade'))      el('pf-grade').value      = p.grade_level || '';
    if (el('pf-topic'))      el('pf-topic').value      = p.weak_topic || '';
    if (el('pf-branch'))     el('pf-branch').value     = p.branch || '';
  }

  // ── Main timetable grid ────────────────────────────────────────────────
  // Live pairings fetched from API (keyed by slotKey "DAY_HH:MM")
  let livePairings = {}; // { "MON_09:00": PairingRecord, ... }
  let pairingsLoaded = false;
  let pairingsError = false;

  async function spLoadPairings() {
    try {
      const res = await fetch(`/matching/students/${studentId}/pairings`);
      if (!res.ok) { pairingsError = true; return; }
      const records = await res.json();

      // Fetch tutor names for all unique tutor IDs
      const tutorIds = [...new Set(records.map(p => p.tutor_id))];
      const tutorNames = {};
      await Promise.all(tutorIds.map(async id => {
        try {
          const r = await fetch(`/matching/tutors/${id}`);
          if (r.ok) { const t = await r.json(); tutorNames[id] = t.name; }
        } catch {}
      }));

      livePairings = {};
      records.forEach(p => {
        const [day, time] = p.time_slot.split('_');
        const key = `${day.toUpperCase().slice(0,3)}_${time}`;
        livePairings[key] = { ...p, tutor_name: tutorNames[p.tutor_id] || p.tutor_id };
      });
      pairingsLoaded = true;
    } catch (err) {
      console.error('Failed to load pairings:', err);
      pairingsError = true;
    }
  }

  function spBuildMainGrid() {
    const grid = document.getElementById('sp-tt-main-grid');
    if (!grid) return;

    if (!pairingsLoaded && !pairingsError) {
      spLoadPairings().then(() => spBuildMainGrid());
      // Show loading state while fetching
      grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Loading sessions…</div>';
      return;
    }

    if (pairingsError) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Unable to load sessions. Please ensure the server is running and refresh the page.</div>';
      return;
    }
    grid.innerHTML = '';
    const isBookable = weekOffset >= 1;
    const dates = getWeekDates(weekOffset);

    const s = dates[0], e = dates[6];
    document.getElementById('sp-week-display').textContent =
      s.getMonth() === e.getMonth()
        ? `${s.toLocaleString('default',{month:'long'})} ${s.getFullYear()}`
        : `${s.toLocaleString('default',{month:'long'})} – ${e.toLocaleString('default',{month:'long'})} ${e.getFullYear()}`;

    document.getElementById('sp-rule-notice').classList.toggle('sp-visible', !isBookable);

    // Header
    const emptyH = document.createElement('div');
    emptyH.className = 'sp-tcell'; emptyH.style.cssText = 'border-bottom:1px solid var(--border);height:auto;padding:10px 0;';
    grid.appendChild(emptyH);
    DAYS.forEach((d, i) => {
      const isToday = weekOffset === 0 && i === TODAY_COL;
      const h = document.createElement('div');
      h.className = 'sp-hcell' + (isToday ? ' sp-hcell--today' : '');
      h.innerHTML = `${d}<span class="sp-day-num">${dates[i].getDate()}${isToday ? '<span class="sp-today-pip"></span>' : ''}</span>`;
      grid.appendChild(h);
    });

    // Rows — on week 0 show real pairings, on future weeks show booking UI
    TIMES.forEach((t, row) => {
      const isHalf = t.includes(':30');
      const tc = document.createElement('div');
      tc.className = 'sp-tcell' + (isHalf ? ' sp-tcell--half' : '');
      tc.textContent = isHalf ? '' : t; grid.appendChild(tc);

      DAYS.forEach((d, col) => {
        const cell = document.createElement('div');
        cell.className = 'sp-slot' + (isHalf ? ' sp-slot--half' : '');
        cell.dataset.col = col; cell.dataset.row = row;

        if (weekOffset === 0) {
          // Show real matched sessions
          const key = `${d}_${t}`;
          const pairing = livePairings[key];
          if (pairing && !isHalf) {
            cell.classList.add('sp-slot--confirmed');
            const block = document.createElement('div');
            block.className = 'sp-sess-block';
            block.style.height = '28px';
            block.innerHTML = `<div class="sp-sess-time">${escapeHtml(t)}</div><div class="sp-sess-tutor">${escapeHtml(pairing.tutor_name)}</div>`;
            block.addEventListener('click', ev => { ev.stopPropagation(); spOpenPairingPopup(pairing, t); });
            cell.appendChild(block);
          }
        } else {
          // Future weeks — booking UI
          const pending = SESSIONS.find(s => s.weekOffset === weekOffset && s.col === col && row >= s.startSlot && row < s.startSlot + s.spanSlots);
          if (pending) {
            if (row === pending.startSlot) {
              const block = document.createElement('div');
              block.className = 'sp-sess-block sp-sess-pending';
              block.style.height = `${pending.spanSlots * 32 - 4}px`;
              block.innerHTML = `<div class="sp-sess-time">${formatRange(pending.startSlot, pending.spanSlots)}</div>`;
              block.addEventListener('click', ev => { ev.stopPropagation(); spOpenSessPopup(pending); });
              cell.appendChild(block);
            }
          } else if (isBookable) {
            cell.classList.add('sp-slot--bookable');
            cell.addEventListener('mousedown', ev => { ev.preventDefault(); spStartSelect(col, row); });
            cell.addEventListener('mouseenter', () => { if (ttSelecting) spUpdateSelect(col, row); });
          } else {
            cell.classList.add('sp-slot--locked');
          }
        }
        grid.appendChild(cell);
      });
    });
    spRenderTtSelection();
  }

  // Popup for a real API pairing
  function spOpenPairingPopup(pairing, timeSlot) {
    const matchedAt = pairing.matched_at
      ? new Date(pairing.matched_at).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
      : '—';
    document.getElementById('sp-pop-head').innerHTML = `<div class="sp-pop-label">Confirmed Session</div><div class="sp-pop-date">${escapeHtml(timeSlot)}</div>`;
    document.getElementById('sp-pop-body').innerHTML = `
      <span class="sp-status-pill sp-sp-confirmed">✓ Confirmed</span>
      <div class="sp-time-card"><div class="sp-time-icon">🕐</div><div><div class="sp-time-val">${escapeHtml(timeSlot)}</div><div class="sp-time-sub">Matched ${escapeHtml(matchedAt)}</div></div></div>
      <div class="sp-pop-label">Your Tutor</div>
      <div class="sp-tutor-card">
        <div class="sp-tutor-av">${escapeHtml(pairing.tutor_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())}</div>
        <div><div class="sp-tutor-name">${escapeHtml(pairing.tutor_name)}</div><div class="sp-tutor-badge">✓ Assigned</div></div>
      </div>`;
    document.getElementById('sp-sess-overlay').classList.add('open');
  }

  // ── Timetable drag-select ──────────────────────────────────────────────
  function spStartSelect(col, row) {
    if (SESSIONS.find(s => s.weekOffset === weekOffset && s.col === col && row >= s.startSlot && row < s.startSlot + s.spanSlots)) return;
    ttSelecting = true; ttSelStart = {col, row}; ttSelEnd = {col, row};
    spRenderTtSelection();
  }
  function spUpdateSelect(col, row) {
    if (!ttSelecting || col !== ttSelStart.col) return;
    ttSelEnd = {col, row}; spRenderTtSelection();
  }

  window.spChangeWeek = function(dir) {
    weekOffset = Math.max(0, weekOffset + dir);
    spClearSelection(); spBuildMainGrid(); spUpdateSelBar();
  };

  window.spClearSelection = function() {
    [...ttSelected].forEach(k => { if (k.startsWith(`${weekOffset}-`)) ttSelected.delete(k); });
    spRenderTtSelection(); spUpdateSelBar();
  };

  function spRenderTtSelection() {
    document.querySelectorAll('#sp-tt-main-grid .sp-slot').forEach(el => el.classList.remove('sp-slot--selecting'));
    ttSelected.forEach(key => {
      const [wo, c, r] = key.split('-').map(Number);
      if (wo !== weekOffset) return;
      const el = document.querySelector(`#sp-tt-main-grid .sp-slot[data-col="${c}"][data-row="${r}"]`);
      if (el) el.classList.add('sp-slot--selecting');
    });
    if (ttSelecting && ttSelStart && ttSelEnd && ttSelStart.col === ttSelEnd.col) {
      const col = ttSelStart.col;
      const r1 = Math.min(ttSelStart.row, ttSelEnd.row), r2 = Math.max(ttSelStart.row, ttSelEnd.row);
      for (let r = r1; r <= r2; r++) {
        const el = document.querySelector(`#sp-tt-main-grid .sp-slot[data-col="${col}"][data-row="${r}"]`);
        if (el) el.classList.add('sp-slot--selecting');
      }
    }
  }

  document.addEventListener('mouseup', () => {
    if (!ttSelecting) return;
    ttSelecting = false;
    if (ttSelStart && ttSelEnd) {
      const col = ttSelStart.col;
      const r1 = Math.min(ttSelStart.row, ttSelEnd.row), r2 = Math.max(ttSelStart.row, ttSelEnd.row);
      for (let r = r1; r <= r2; r++) {
        if (!SESSIONS.find(s => s.weekOffset === weekOffset && s.col === col && r >= s.startSlot && r < s.startSlot + s.spanSlots))
          ttSelected.add(`${weekOffset}-${col}-${r}`);
      }
    }
    ttSelStart = null; ttSelEnd = null;
    spRenderTtSelection(); spUpdateSelBar();
  }, { capture: false });

  function spUpdateSelBar() {
    const bar = document.getElementById('sp-sel-bar');
    const btn = document.getElementById('sp-request-btn');
    if (!bar || !btn) return;
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    if (!keys.length) { bar.classList.remove('sp-visible'); btn.disabled = true; return; }
    bar.classList.add('sp-visible'); btn.disabled = false;
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    const parts = Object.entries(byCols).map(([c, rows]) => {
      rows.sort((a,b) => a-b);
      return `${DAYS[c]} ${slotToTime(rows[0])}–${slotToTime(rows[rows.length-1]+1)}`;
    });
    document.getElementById('sp-sel-count').textContent = keys.length;
    document.getElementById('sp-sel-time').textContent  = parts.join(', ');
  }

  // ── Confirm booking modal ──────────────────────────────────────────────
  window.spOpenConfirmModal = function() {
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    if (!keys.length) return;
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    const dates = getWeekDates(weekOffset);
    let html = '';
    Object.entries(byCols).forEach(([c, rows]) => {
      rows.sort((a,b) => a-b);
      const s = rows[0], e = rows[rows.length-1]+1;
      html += `<div class="sp-cb-row"><div class="sp-cb-dot"></div><span><strong>${DAYS[c]}, ${fmtDate(dates[c])}</strong> &nbsp;${slotToTime(s)} – ${slotToTime(e)}</span></div>`;
    });
    document.getElementById('sp-cb-slots').innerHTML = html;
    document.getElementById('sp-confirm-overlay').classList.add('open');
  };

  window.spCloseConfirmOverlay = function(e) { if (e.target === document.getElementById('sp-confirm-overlay')) document.getElementById('sp-confirm-overlay').classList.remove('open'); };

  window.spConfirmSlots = function() {
    document.getElementById('sp-confirm-overlay').classList.remove('open');
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    Object.entries(byCols).forEach(([c, rows]) => {
      rows.sort((a,b) => a-b);
      SESSIONS.push({ col:parseInt(c), startSlot:rows[0], spanSlots:rows.length, tutor:null, done:false, tutorAssigned:false, id:'p'+Date.now()+c, weekOffset, type:'pending' });
    });
    keys.forEach(k => ttSelected.delete(k));
    spBuildMainGrid(); spUpdateSelBar();
    spShowToast('✓ Slots submitted — a tutor will be assigned soon.');
  };

  // ── Session popup ──────────────────────────────────────────────────────
  function spOpenSessPopup(sess) {
    feedbackStars = 0;
    const dates = getWeekDates(sess.weekOffset);
    const dayStr  = `${DAYS[sess.col]}, ${fmtDate(dates[sess.col])}`;
    const timeStr = formatRange(sess.startSlot, sess.spanSlots);
    const dur     = sess.spanSlots * 30;
    const cancellable = !sess.done && ((dates[sess.col] - TODAY) / (1000*60*60*24)) > 5;

    let pill = '';
    if (sess.type === 'pending')  pill = `<span class="sp-status-pill sp-sp-pending">⏳ Awaiting Tutor</span>`;
    else if (sess.done)           pill = `<span class="sp-status-pill sp-sp-done">✓ Completed</span>`;
    else                          pill = `<span class="sp-status-pill sp-sp-confirmed">✓ Confirmed</span>`;

    let tutorHtml = '';
    if (sess.tutorAssigned && sess.tutor) {
      tutorHtml = `<div class="sp-pop-label">Your Tutor</div><div class="sp-tutor-card"><div class="sp-tutor-av">${escapeHtml(sess.tutorInitials||'?')}</div><div><div class="sp-tutor-name">${escapeHtml(sess.tutor)}</div><div class="sp-tutor-badge">✓ Assigned</div></div></div>`;
    } else if (sess.type !== 'pending') {
      tutorHtml = `<div class="sp-pop-label">Your Tutor</div><div class="sp-info-box" style="margin-bottom:14px;">🕐 Tutor profile will appear 5 days before your session.</div>`;
    } else {
      tutorHtml = `<div class="sp-pop-label">Your Tutor</div><div class="sp-info-box" style="margin-bottom:14px;">⏳ Awaiting tutor assignment after admin review.</div>`;
    }

    let cancelHtml = '';
    if (cancellable) {
      cancelHtml = `<button class="sp-cancel-btn" onclick="spPromptCancel('${sess.id}')">Cancel this session</button>`;
    } else if (!sess.done && sess.type !== 'pending') {
      cancelHtml = `<div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:4px;">Cancellations are only allowed more than 5 days before the session.</div>`;
    }

    let feedbackHtml = '';
    if (sess.done) {
      feedbackHtml = sess.feedbackGiven
        ? `<div class="sp-fb-done">⭐ Your feedback has been submitted — thank you!</div>`
        : `<div class="sp-pop-label">Rate This Session</div>
           <div class="sp-fb-section">
             <div class="sp-fb-title">How was your session?</div>
             <div class="sp-fb-sub">Your rating helps us match you with the best tutors.</div>
             <div class="sp-stars-row" id="sp-stars-row">
               ${[1,2,3,4,5].map(i => `<span class="sp-star-btn" data-val="${i}" onmouseenter="spHoverStars(${i})" onmouseleave="spUnhoverStars()" onclick="spSetStars(${i})">★</span>`).join('')}
             </div>
             <textarea class="sp-fb-textarea" id="sp-fb-text" placeholder="Leave a comment (optional)..."></textarea>
             <button class="sp-btn sp-btn--primary" style="width:100%;" onclick="spSubmitFeedback('${sess.id}')">Submit Rating</button>
           </div>`;
    }

    document.getElementById('sp-pop-head').innerHTML = `<div class="sp-pop-label">Session Details</div><div class="sp-pop-date">${escapeHtml(dayStr)}</div>`;
    document.getElementById('sp-pop-body').innerHTML = `
      ${pill}
      <div class="sp-time-card"><div class="sp-time-icon">🕐</div><div><div class="sp-time-val">${escapeHtml(timeStr)}</div><div class="sp-time-sub">${dur} min · ${sess.spanSlots} slot${sess.spanSlots>1?'s':''}</div></div></div>
      ${tutorHtml}${feedbackHtml}${cancelHtml}`;
    document.getElementById('sp-sess-overlay').classList.add('open');
  }

  window.spCloseSessOverlay = function(e) { if (e.target === document.getElementById('sp-sess-overlay')) spCloseSessDirect(); };
  window.spCloseSessDirect  = function() { document.getElementById('sp-sess-overlay').classList.remove('open'); };

  window.spPromptCancel = function(sessId) {
    cancelTarget = SESSIONS.find(s => s.id === sessId);
    if (!cancelTarget) return;
    const dates  = getWeekDates(cancelTarget.weekOffset);
    const dayStr = `${DAYS[cancelTarget.col]}, ${fmtDate(dates[cancelTarget.col])}`;
    document.getElementById('sp-cancel-slot-info').innerHTML = `<div class="sp-cb-row"><div class="sp-cb-dot" style="background:var(--red);"></div><span><strong>${escapeHtml(dayStr)}</strong> &nbsp; ${escapeHtml(formatRange(cancelTarget.startSlot, cancelTarget.spanSlots))}</span></div>`;
    document.getElementById('sp-sess-overlay').classList.remove('open');
    document.getElementById('sp-cancel-overlay').classList.add('open');
  };

  window.spCloseCancelOverlay = function(e) { if (e.target === document.getElementById('sp-cancel-overlay')) document.getElementById('sp-cancel-overlay').classList.remove('open'); };

  window.spDoCancelSession = function() {
    if (!cancelTarget) return;
    const idx = SESSIONS.indexOf(cancelTarget);
    if (idx > -1) SESSIONS.splice(idx, 1);
    document.getElementById('sp-cancel-overlay').classList.remove('open');
    cancelTarget = null; spBuildMainGrid(); spShowToast('Session cancelled.');
  };

  // ── Stars ──────────────────────────────────────────────────────────────
  window.spHoverStars   = function(val) { document.querySelectorAll('.sp-star-btn').forEach(s => { s.style.color = parseInt(s.dataset.val) <= val ? '#C8841A' : '#D4C8B0'; }); };
  window.spUnhoverStars = function()    { document.querySelectorAll('.sp-star-btn').forEach(s => { s.style.color = parseInt(s.dataset.val) <= feedbackStars ? '#C8841A' : '#D4C8B0'; }); };
  window.spSetStars     = function(val) { feedbackStars = val; spUnhoverStars(); };
  window.spSubmitFeedback = function(sessId) {
    if (!feedbackStars) { spShowToast('⭐ Please select a star rating first.'); return; }
    const sess = SESSIONS.find(s => s.id === sessId);
    if (sess) sess.feedbackGiven = true;
    spShowToast('✓ Rating submitted — thank you!'); spOpenSessPopup(sess);
  };
  window.spOpenRateFromNotif = function(sessId) {
    spCloseNotifDirect();
    const sess = SESSIONS.find(s => s.id === sessId);
    if (sess) { spShowPage('timetable', document.getElementById('nav-timetable')); setTimeout(() => spOpenSessPopup(sess), 150); }
  };

  // ── Lesson history ─────────────────────────────────────────────────────
  function spRenderHistory() {
    const container = document.getElementById('sp-history-list');
    if (!container) return;
    if (!LESSON_HISTORY.length) {
      container.innerHTML = `<div class="sp-empty-state"><div class="sp-empty-icon">📖</div><div>No lessons recorded yet.</div></div>`;
      return;
    }
    const byMonth = {};
    LESSON_HISTORY.forEach(l => { if (!byMonth[l.mon]) byMonth[l.mon] = []; byMonth[l.mon].push(l); });
    let html = '';
    Object.entries(byMonth).forEach(([mon, lessons]) => {
      html += `<div class="sp-history-month">${mon} 2026</div>`;
      lessons.forEach(l => {
        const stars = [1,2,3,4,5].map(i => `<span class="sp-star${i <= l.rating ? '' : ' sp-star-empty'}">★</span>`).join('');
        const tags  = l.topics.map(t => `<span class="sp-lc-tag">${escapeHtml(t)}</span>`).join('');
        html += `
          <div class="sp-lesson-card">
            <div class="sp-lc-top">
              <div class="sp-lc-date-block">
                <div class="sp-lc-date-box"><div class="sp-lc-day">${l.day}</div><div class="sp-lc-mon">${l.mon}</div></div>
                <div class="sp-lc-info">
                  <div class="sp-lc-title">Mathematics Session</div>
                  <div class="sp-lc-meta">${escapeHtml(l.date)}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:4px;">Your Review</div>
                <div class="sp-lc-rating">${stars}<span class="sp-rating-num">${l.rating}.0</span></div>
              </div>
            </div>
            <div class="sp-lc-topics"><div class="sp-lc-topics-label">Topics Covered</div><div class="sp-lc-tags">${tags}</div></div>
            <div class="sp-lc-notes"><div class="sp-lc-notes-label">Tutor's Notes</div><div class="sp-lc-notes-text">${escapeHtml(l.notes)}</div></div>
            <div class="sp-lc-tutor-row">
              <div class="sp-lc-tutor-av">${escapeHtml(l.initials)}</div>
              <div class="sp-lc-tutor-name">${escapeHtml(l.tutor)}</div>
              <div class="sp-lc-dur">⏱ ${escapeHtml(l.duration)}</div>
            </div>
          </div>`;
      });
    });
    container.innerHTML = html;
  }

  // ── Notifications ──────────────────────────────────────────────────────
  function spRenderNotifications() {
    const el = document.getElementById('sp-notif-list');
    if (!el) return;
    const unread = NOTIFS.filter(n => n.unread).length;
    const dot = document.getElementById('sp-notif-dot');
    if (dot) { dot.textContent = unread || ''; dot.style.display = unread ? '' : 'none'; }
    el.innerHTML = NOTIFS.map(n => `
      <div class="sp-notif-item${n.unread ? ' sp-notif-unread' : ''}">
        <div class="sp-notif-icon-wrap ${n.iconClass}">${n.icon}</div>
        <div class="sp-notif-content">
          <div class="sp-notif-title">${escapeHtml(n.title)}</div>
          <div class="sp-notif-body">${escapeHtml(n.body)}</div>
          <div class="sp-notif-time">${n.time}</div>
          ${n.action ? `<div class="sp-notif-action"><button class="sp-btn sp-btn--primary" style="font-size:11px;padding:5px 12px;" onclick="${n.action.fn}">${n.action.label}</button></div>` : ''}
        </div>
        ${n.unread ? '<div class="sp-unread-pip"></div>' : ''}
      </div>`).join('');
  }

  window.spMarkAllRead = function() { NOTIFS.forEach(n => n.unread = false); spRenderNotifications(); spShowToast('All notifications marked as read.'); };

  document.getElementById('sp-notif-btn').addEventListener('click', () => {
    spRenderNotifications();
    document.getElementById('sp-notif-overlay').classList.add('open');
  });

  window.spCloseNotifOverlay = function(e) { if (e.target === document.getElementById('sp-notif-overlay')) spCloseNotifDirect(); };
  window.spCloseNotifDirect  = function() { document.getElementById('sp-notif-overlay').classList.remove('open'); };

  // ── Toast ──────────────────────────────────────────────────────────────
  window.spShowToast = function(msg) {
    const t = document.getElementById('sp-toast');
    t.textContent = msg; t.classList.add('sp-toast--show');
    setTimeout(() => t.classList.remove('sp-toast--show'), 3000);
  };

  // ── Escape key ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('sp-sess-overlay').classList.remove('open');
      document.getElementById('sp-confirm-overlay').classList.remove('open');
      document.getElementById('sp-cancel-overlay').classList.remove('open');
      document.getElementById('sp-notif-overlay').classList.remove('open');
    }
  });

  // Initial notification dot
  spRenderNotifications();
}
