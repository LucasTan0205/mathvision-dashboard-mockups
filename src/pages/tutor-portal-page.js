// Tutor Portal Page
// Standalone — sidebar nav + multi-page layout

const DAYS  = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const TIMES = [];
for (let h = 8; h < 20; h++) { TIMES.push(`${h}:00`); TIMES.push(`${h}:30`); }

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateTutorId() {
  let id = localStorage.getItem('mv_tutor_id');
  if (!id) { id = generateUUID(); localStorage.setItem('mv_tutor_id', id); }
  return id;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getWeekDates(off = 0) {
  const today = new Date(), dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + off * 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}

export function createTutorPortalContent() {
  return `
<div id="tp-root">
  <!-- SIDEBAR -->
  <aside class="tp-sidebar">
    <div class="tp-sb-header">
      <div class="tp-brand">
        <div class="tp-brand-icon">MV</div>
        <div>
          <div class="tp-brand-name">MathVision</div>
          <div class="tp-brand-sub">Tutor Portal</div>
        </div>
      </div>
      <div class="tp-user-pill">
        <div class="tp-avatar" id="tp-nav-avatar">?</div>
        <div>
          <div class="tp-user-name" id="tp-nav-name">—</div>
          <div class="tp-user-role">Mathematics Tutor</div>
        </div>
      </div>
    </div>
    <nav class="tp-sb-nav">
      <div class="tp-nav-label">Main</div>
      <div class="tp-nav-item active" id="nav-register" onclick="tpShowPage('register',this)">
        <svg class="tp-nav-icon" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="3.5"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6H2z"/></svg>
        My Profile
      </div>
      <div class="tp-nav-item" id="nav-timetable" onclick="tpShowPage('timetable',this)">
        <svg class="tp-nav-icon" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
        Timetable
      </div>
      <div class="tp-nav-item" id="nav-history" onclick="tpShowPage('history',this)">
        <svg class="tp-nav-icon" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6" width="14" height="3" rx="1"/><rect x="1" y="11" width="9" height="3" rx="1"/></svg>
        Lesson Reports
      </div>
      <div class="tp-nav-item" id="nav-hours" onclick="tpShowPage('hours',this)">
        <svg class="tp-nav-icon" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>
        Hours &amp; Pay
      </div>
      <div class="tp-nav-label" style="margin-top:16px;">Account</div>
      <div class="tp-nav-item" id="nav-settings" onclick="tpShowPage('settings',this)">
        <svg class="tp-nav-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 10a2 2 0 100-4 2 2 0 000 4zm5.66-1.5a5.9 5.9 0 000-1l1.3-1-.96-1.66-1.55.52a5.8 5.8 0 00-.87-.5L11.3 3.5H9.7l-.28 1.36a5.8 5.8 0 00-.87.5L7 4.84 6.04 6.5l1.3 1a5.9 5.9 0 000 1l-1.3 1 .96 1.66 1.55-.52c.27.19.56.36.87.5L9.7 12.5h1.6l.28-1.36c.31-.14.6-.31.87-.5l1.55.52.96-1.66-1.3-1z"/></svg>
        Settings
      </div>
    </nav>
  </aside>

  <!-- MAIN -->
  <main class="tp-main">
    <div class="tp-topbar">
      <div class="tp-breadcrumb" id="tp-breadcrumb">Portal · <span>Register</span></div>
      <div class="tp-topbar-right">
        <div class="tp-notif-btn" id="tp-notif-btn">🔔<div class="tp-notif-dot" id="tp-notif-dot">2</div></div>
      </div>
    </div>

    <!-- PROFILE / REGISTER PAGE -->
    <div class="tp-page tp-content" id="page-register">
      <div class="tp-cal-header">
        <div>
          <div class="tp-page-title">My Profile</div>
          <div class="tp-page-sub">Your tutor information and weekly availability.</div>
        </div>
        <button class="tp-btn tp-btn--primary" id="tp-submit-btn" onclick="document.getElementById('tp-form').requestSubmit()">Save Profile</button>
      </div>

      <div id="tp-success-banner" class="tp-banner tp-banner--success" style="display:none;">✓ Profile saved successfully!</div>
      <div id="tp-error-banner" class="tp-banner tp-banner--error" style="display:none;"></div>

      <form id="tp-form" novalidate>
        <!-- Avatar card -->
        <div class="tp-profile-av-section" style="margin-bottom:24px;">
          <div class="tp-profile-av" id="tp-profile-av-initials">?</div>
          <div>
            <div class="tp-profile-av-name" id="tp-profile-av-name">—</div>
            <div class="tp-profile-av-role">Mathematics Tutor</div>
          </div>
        </div>

        <div class="tp-psection-title">Personal Details</div>
        <div class="tp-form-grid">
          <div class="tp-field-group tp-field-full"><label class="tp-label" for="tp-name">Full Name</label><input class="tp-input" id="tp-name" type="text" placeholder="e.g. Ahmad Razif" autocomplete="name"/><div class="tp-field-error" id="err-name"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-tutor-type">Tutor Type</label><select class="tp-input" id="tp-tutor-type"><option value="">Select type…</option><option value="part-time">Part-time</option><option value="full-time">Full-time</option><option value="instructor">Instructor</option></select><div class="tp-field-error" id="err-tutor-type"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-curriculum">Primary Curriculum</label><select class="tp-input" id="tp-curriculum"><option value="">Select curriculum…</option><option value="Local">Local</option><option value="IGCSE">IGCSE</option><option value="IB">IB</option></select><div class="tp-field-error" id="err-curriculum"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-specialty">Specialty Topic</label><select class="tp-input" id="tp-specialty"><option value="">Select topic…</option><option value="Fractions">Fractions</option><option value="Algebra">Algebra</option><option value="Geometry">Geometry</option><option value="Calculus">Calculus</option><option value="Statistics">Statistics</option></select><div class="tp-field-error" id="err-specialty"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-experience">Years of Experience</label><input class="tp-input" id="tp-experience" type="number" min="0" placeholder="e.g. 3"/><div class="tp-field-error" id="err-experience"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-min-grade">Preferred Min Grade (5–12)</label><input class="tp-input" id="tp-min-grade" type="number" min="5" max="12" placeholder="e.g. 7"/><div class="tp-field-error" id="err-min-grade"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-max-grade">Preferred Max Grade (5–12)</label><input class="tp-input" id="tp-max-grade" type="number" min="5" max="12" placeholder="e.g. 11"/><div class="tp-field-error" id="err-max-grade"></div></div>
          <div class="tp-field-group"><label class="tp-label" for="tp-branch">Branch</label><select class="tp-input" id="tp-branch"><option value="">Select branch…</option><option value="Central">Central</option><option value="East">East</option><option value="West">West</option></select><div class="tp-field-error" id="err-branch"></div></div>
        </div>

        <div class="tp-avail-section">
          <div class="tp-psection-title">Weekly Availability</div>
          <p class="tp-avail-sub">Click or drag to mark your available slots. Each slot = 30 minutes.</p>
          <div class="tp-field-error" id="err-slots" style="margin-bottom:10px;"></div>
          <div class="tp-tt-outer"><div class="tp-tt-grid" id="tp-tt-grid"></div></div>
        </div>
      </form>
    </div>

    <!-- TIMETABLE PAGE -->
    <div class="tp-page tp-content" id="page-timetable" style="display:none;">
      <div class="tp-cal-header">
        <div>
          <div class="tp-page-title">Timetable</div>
          <div class="tp-page-sub" id="tp-week-range-sub"></div>
        </div>
        <div class="tp-header-right" id="tp-tt-header-btns">
          <button class="tp-btn tp-btn--outline" id="tp-set-avail-btn" onclick="tpEnterAvailMode()">Set Availability</button>
          <button class="tp-btn tp-btn--purple" id="tp-submit-avail-btn" style="display:none;" onclick="tpOpenSubmitModal()">Submit →</button>
          <button class="tp-btn tp-btn--outline" id="tp-cancel-avail-btn" style="display:none;" onclick="tpCancelAvailMode()">Cancel</button>
        </div>
      </div>
      <div class="tp-info-banner" id="tp-avail-banner" style="display:none;">
        <span class="tp-info-banner-icon">🟣</span>
        <span>Availability mode — drag to select slots <strong>at least 7 days ahead</strong>. Columns within 7 days are locked.</span>
      </div>
      <div class="tp-sel-bar" id="tp-sel-bar">
        <span>🟣</span>
        <div class="tp-sel-bar-text"><strong id="tp-avail-count">0</strong> slot(s) selected — <span id="tp-sel-time"></span></div>
        <button class="tp-btn tp-btn--purple" onclick="tpOpenSubmitModal()">Submit →</button>
      </div>
      <div class="tp-week-display" id="tp-week-display"></div>
      <div class="tp-legend">
        <div class="tp-leg-item"><div class="tp-leg-dot" style="background:var(--purple-pale);border:1.5px dashed var(--purple-mid);"></div> Availability</div>
        <div class="tp-leg-item"><div class="tp-leg-dot" style="background:var(--green-dark);"></div> Confirmed</div>
        <div class="tp-leg-item"><div class="tp-leg-dot" style="background:#5A6880;"></div> Standby</div>
        <div class="tp-leg-item"><div class="tp-leg-dot" style="background:repeating-linear-gradient(45deg,#ddd,#ddd 2px,#eee 2px,#eee 5px);"></div> Locked</div>
      </div>
      <div class="tp-tt-nav-wrap">
        <div class="tp-tt-side-btn" onclick="tpShiftWeek(-1)">‹</div>
        <div class="tp-tt-outer"><div class="tp-tt-grid" id="tp-tt-main-grid"></div></div>
        <div class="tp-tt-side-btn" onclick="tpShiftWeek(1)">›</div>
      </div>
    </div>

    <!-- LESSON REPORTS PAGE -->
    <div class="tp-page tp-content" id="page-history" style="display:none;">
      <div class="tp-cal-header"><div><div class="tp-page-title">Lesson Reports</div><div class="tp-page-sub">All submitted session reports</div></div></div>
      <div id="tp-history-list"></div>
    </div>

    <!-- HOURS & PAY PAGE -->
    <div class="tp-page tp-content" id="page-hours" style="display:none;">
      <div class="tp-cal-header"><div><div class="tp-page-title">Hours &amp; Pay</div><div class="tp-page-sub">Your logged sessions and payment history</div></div></div>
      <div class="tp-hours-bar">
        <div class="tp-hours-card"><div class="tp-hours-val">18.5</div><div class="tp-hours-lbl">Hours This Month</div><div class="tp-hours-sub">Mar 2026</div></div>
        <div class="tp-hours-card"><div class="tp-hours-val">$740</div><div class="tp-hours-lbl">Earnings This Month</div><div class="tp-hours-sub">At $40/hr</div></div>
        <div class="tp-hours-card"><div class="tp-hours-val">$240</div><div class="tp-hours-lbl">Last Payment</div><div class="tp-hours-sub">1 Mar 2026</div></div>
      </div>
      <div class="tp-psection-title">Session Log — March 2026</div>
      <div class="tp-hours-table">
        <div class="tp-ht-head"><div class="tp-ht-col">Student</div><div class="tp-ht-col">Date &amp; Time</div><div class="tp-ht-col">Duration</div><div class="tp-ht-col">Rate</div><div class="tp-ht-col">Status</div></div>
        <div class="tp-ht-row"><div class="tp-ht-cell tp-ht-bold">Sarah Amira</div><div class="tp-ht-cell">19 Mar · 9:00 AM</div><div class="tp-ht-cell">1.5 hrs</div><div class="tp-ht-cell">$60</div><div class="tp-ht-cell"><span class="tp-pay-badge tp-pay-pending">Pending</span></div></div>
        <div class="tp-ht-row"><div class="tp-ht-cell tp-ht-bold">Darren Lim</div><div class="tp-ht-cell">21 Mar · 10:00 AM</div><div class="tp-ht-cell">1 hr</div><div class="tp-ht-cell">$40</div><div class="tp-ht-cell"><span class="tp-pay-badge tp-pay-pending">Pending</span></div></div>
        <div class="tp-ht-row"><div class="tp-ht-cell tp-ht-bold">Sarah Amira</div><div class="tp-ht-cell">12 Mar · 9:00 AM</div><div class="tp-ht-cell">1.5 hrs</div><div class="tp-ht-cell">$60</div><div class="tp-ht-cell"><span class="tp-pay-badge tp-pay-paid">Paid</span></div></div>
        <div class="tp-ht-row"><div class="tp-ht-cell tp-ht-bold">Wei Jie Tan</div><div class="tp-ht-cell">10 Mar · 2:00 PM</div><div class="tp-ht-cell">1.5 hrs</div><div class="tp-ht-cell">$60</div><div class="tp-ht-cell"><span class="tp-pay-badge tp-pay-paid">Paid</span></div></div>
        <div class="tp-ht-row"><div class="tp-ht-cell tp-ht-bold">Priya Nair</div><div class="tp-ht-cell">9 Mar · 11:00 AM</div><div class="tp-ht-cell">1 hr</div><div class="tp-ht-cell">$40</div><div class="tp-ht-cell"><span class="tp-pay-badge tp-pay-paid">Paid</span></div></div>
      </div>
    </div>

    <!-- PROFILE PAGE -->
    <div class="tp-page tp-content" id="page-profile" style="display:none;">
      <div class="tp-cal-header"><div><div class="tp-page-title">Profile</div><div class="tp-page-sub">Your tutor information and credentials</div></div><button class="tp-btn tp-btn--primary" onclick="tpShowToast('Changes saved!')">Save Changes</button></div>
      <div class="tp-profile-wrap">
        <div class="tp-profile-av-section">
          <div class="tp-profile-av" id="tp-profile-av-initials">?</div>
          <div>
            <div class="tp-profile-av-name" id="tp-profile-av-name">—</div>
            <div class="tp-profile-av-role">Mathematics Tutor</div>
          </div>
        </div>
        <div class="tp-profile-grid">
          <div class="tp-pfield-group"><div class="tp-pfield-label">Full Name</div><input class="tp-pfield-input" id="tpf-name" value=""/></div>
          <div class="tp-pfield-group"><div class="tp-pfield-label">Tutor Type</div><input class="tp-pfield-input" id="tpf-type" value=""/></div>
          <div class="tp-pfield-group"><div class="tp-pfield-label">Curriculum</div><input class="tp-pfield-input" id="tpf-curriculum" value=""/></div>
          <div class="tp-pfield-group"><div class="tp-pfield-label">Specialty</div><input class="tp-pfield-input" id="tpf-specialty" value=""/></div>
          <div class="tp-pfield-group"><div class="tp-pfield-label">Branch</div><input class="tp-pfield-input" id="tpf-branch" value=""/></div>
          <div class="tp-pfield-group"><div class="tp-pfield-label">Years Experience</div><input class="tp-pfield-input" id="tpf-exp" value=""/></div>
        </div>
        <div class="tp-psection-title">Academic Credentials</div>
        <div class="tp-qual-card"><div class="tp-qual-icon">🎓</div><div class="tp-qual-content"><div class="tp-qual-title">B.Sc. Mathematics (First Class Honours)</div><div class="tp-qual-meta">National University of Singapore · 2019</div><div class="tp-qual-status tp-qs-verified">✓ Verified</div></div><button class="tp-btn tp-btn--outline" style="font-size:11px;padding:5px 12px;">View Doc</button></div>
        <div class="tp-qual-card"><div class="tp-qual-icon">📜</div><div class="tp-qual-content"><div class="tp-qual-title">Postgraduate Diploma in Education (PGDE)</div><div class="tp-qual-meta">National Institute of Education · 2020</div><div class="tp-qual-status tp-qs-verified">✓ Verified</div></div><button class="tp-btn tp-btn--outline" style="font-size:11px;padding:5px 12px;">View Doc</button></div>
        <div class="tp-qual-card"><div class="tp-qual-icon">📄</div><div class="tp-qual-content"><div class="tp-qual-title">A-Level Further Mathematics (A)</div><div class="tp-qual-meta">Result Certificate · 2015</div><div class="tp-qual-status tp-qs-pending">⏳ Pending Review</div></div><button class="tp-btn tp-btn--outline" style="font-size:11px;padding:5px 12px;">Replace</button></div>
        <div class="tp-psection-title" style="margin-top:20px;">Approved Teaching Subjects</div>
        <div class="tp-subj-tags">
          <div class="tp-subj-tag active" onclick="this.classList.toggle('active')">E-Maths (O Level)</div>
          <div class="tp-subj-tag active" onclick="this.classList.toggle('active')">A-Maths (O Level)</div>
          <div class="tp-subj-tag active" onclick="this.classList.toggle('active')">H2 Maths (A Level)</div>
          <div class="tp-subj-tag" onclick="this.classList.toggle('active')">H1 Maths (A Level)</div>
          <div class="tp-subj-tag" onclick="this.classList.toggle('active')">IP Mathematics</div>
        </div>
      </div>
    </div>

    <!-- SETTINGS PAGE -->
    <div class="tp-page tp-content" id="page-settings" style="display:none;">
      <div class="tp-cal-header"><div><div class="tp-page-title">Settings</div><div class="tp-page-sub">Manage your preferences</div></div></div>
      <div class="tp-settings-wrap">
        <div class="tp-settings-title">Notifications</div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Availability Reminder</div><div class="tp-setting-sub">Remind me to submit availability 7 days before the week</div></div><div class="tp-toggle active" onclick="this.classList.toggle('active')"><div class="tp-toggle-knob"></div></div></div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Slot Confirmed</div><div class="tp-setting-sub">Notify when a slot is confirmed with a student assigned</div></div><div class="tp-toggle active" onclick="this.classList.toggle('active')"><div class="tp-toggle-knob"></div></div></div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Lesson Report Reminder</div><div class="tp-setting-sub">Prompt me to submit a report after each session ends</div></div><div class="tp-toggle active" onclick="this.classList.toggle('active')"><div class="tp-toggle-knob"></div></div></div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Session Reminders</div><div class="tp-setting-sub">Get reminded 2 hours before a session</div></div><div class="tp-toggle active" onclick="this.classList.toggle('active')"><div class="tp-toggle-knob"></div></div></div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Cancellation Alerts</div><div class="tp-setting-sub">Notify if a session is cancelled by the centre</div></div><div class="tp-toggle" onclick="this.classList.toggle('active')"><div class="tp-toggle-knob"></div></div></div>
        <div class="tp-settings-title">Account</div>
        <div class="tp-setting-row"><div><div class="tp-setting-name">Change Password</div><div class="tp-setting-sub">Update your login password</div></div><button class="tp-btn tp-btn--outline" style="font-size:11px;padding:6px 12px;" onclick="tpShowToast('Password reset email sent.')">Reset</button></div>
        <div class="tp-setting-row"><div><div class="tp-setting-name" style="color:var(--red);">Log Out</div><div class="tp-setting-sub">Sign out of your account</div></div><button class="tp-btn" style="font-size:11px;padding:6px 12px;background:var(--red-light);color:var(--red);border:1px solid #E0A090;" onclick="['mv_tutor_id','mv_tutor_name','mv_tutor_profile'].forEach(k=>localStorage.removeItem(k));window.location.href='/';">Log Out</button></div>
      </div>
    </div>
  </main>

  <!-- SESSION POPUP -->
  <div class="tp-overlay" id="tp-sess-overlay" onclick="tpCloseSessOverlay(event)">
    <div class="tp-popup" id="tp-sess-popup">
      <div class="tp-pop-head"><div id="tp-pop-head"></div><div class="tp-pop-close" onclick="tpCloseSessDirect()">✕</div></div>
      <div class="tp-pop-body" id="tp-pop-body"></div>
    </div>
  </div>

  <!-- STUDENT PROFILE POPUP -->
  <div class="tp-overlay" id="tp-stu-overlay" onclick="tpCloseStuOverlay(event)">
    <div class="tp-stu-modal">
      <div class="tp-stu-head" id="tp-stu-head"></div>
      <div class="tp-stu-body" id="tp-stu-body"></div>
    </div>
  </div>

  <!-- SUBMIT AVAILABILITY MODAL -->
  <div class="tp-overlay" id="tp-submit-overlay" onclick="tpCloseSubmitOverlay(event)">
    <div class="tp-avail-modal">
      <div class="tp-am-icon">🟣</div>
      <div class="tp-am-title">Submit Availability</div>
      <div class="tp-am-sub">These slots will be sent to the centre. You'll be notified of confirmed sessions 5 days before each date.</div>
      <div class="tp-am-slots" id="tp-am-slots"></div>
      <div class="tp-modal-actions">
        <button class="tp-btn tp-btn--outline" onclick="tpCloseSubmitDirect()">Cancel</button>
        <button class="tp-btn tp-btn--purple" onclick="tpConfirmSubmitAvail()">Submit</button>
      </div>
    </div>
  </div>

  <!-- NOTIFICATIONS PANEL -->
  <div class="tp-notif-overlay" id="tp-notif-overlay" onclick="tpCloseNotifOverlay(event)">
    <div class="tp-notif-popup">
      <div class="tp-notif-popup-head">
        <div><div class="tp-notif-popup-title">Notifications</div><div class="tp-notif-popup-sub">Your latest updates</div></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="tp-btn tp-btn--outline" style="font-size:11px;padding:5px 12px;" onclick="tpMarkAllRead()">Mark all read</button>
          <div class="tp-pop-close" onclick="tpCloseNotifDirect()">✕</div>
        </div>
      </div>
      <div class="tp-notif-popup-body" id="tp-notif-list"></div>
    </div>
  </div>

  <div class="tp-toast" id="tp-toast"></div>
</div>
`;
}

export function initTutorPortal() {
  const tutorId = getOrCreateTutorId();

  // ── Demo data (lesson history only — timetable uses live API) ──────────
  const SESSIONS = []; // populated dynamically via availability submissions

  const LESSON_HISTORY = [];

  const NOTIFS = [
    { id:'n-report-s4', unread:true,  iconClass:'tp-ni-amber', icon:'📋', title:'Lesson Report Due — Wei Jie Tan', body:'Your session with Wei Jie Tan has ended. Please submit a lesson report.', time:'Today, 5:00 PM', action:{ label:'Submit Report', fn:"tpOpenReportFromNotif('s4')" } },
    { id:'n-confirm',   unread:true,  iconClass:'tp-ni-green',  icon:'✅', title:'Slot Confirmed — next Monday', body:'Your Monday 3:00 PM slot has been confirmed. Student: Sarah Amira (Sec 4 E-Maths).', time:'Today, 10:02 AM', action:null },
    { id:'n-pay',       unread:false, iconClass:'tp-ni-blue',   icon:'💳', title:'Payment Processed', body:'$240 transferred to your bank account for sessions on 14–28 Feb.', time:'1 Mar, 9:00 AM', action:null },
  ];

  const sessionTopics = {};

  // ── State ──────────────────────────────────────────────────────────────
  let weekOffset   = 0;
  let availMode    = false;
  let ttSelecting  = false;
  let ttSelStart   = null;
  let ttSelEnd     = null;
  let ttSelected   = new Set();

  // ── Registration availability grid state ───────────────────────────────
  const regSelectedSlots = new Set();
  let regDragging = false;
  let regDragAction = null;

  // ── Page switching ─────────────────────────────────────────────────────
  const PAGE_LABELS = { register:'My Profile', timetable:'Timetable', history:'Lesson Reports', hours:'Hours & Pay', settings:'Settings' };

  window.tpShowPage = function(page, el) {
    document.querySelectorAll('.tp-page').forEach(p => p.style.display = 'none');
    const pg = document.getElementById('page-' + page);
    if (pg) pg.style.display = '';
    document.querySelectorAll('.tp-nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('tp-breadcrumb').innerHTML = `Portal · <span>${PAGE_LABELS[page] || page}</span>`;
    if (page === 'history')   tpRenderHistory();
    if (page === 'timetable') { pairingsLoaded = false; pairingsError = false; tpBuildGrid(); }
    if (page === 'profile')   tpPopulateProfile();
  };

  // ── Nav user pill ──────────────────────────────────────────────────────
  function tpUpdateNavUser() {
    const name = localStorage.getItem('mv_tutor_name') || '—';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const navName = document.getElementById('tp-nav-name');
    const navAv   = document.getElementById('tp-nav-avatar');
    if (navName) navName.textContent = name;
    if (navAv)   navAv.textContent   = initials;
  }
  tpUpdateNavUser();

  // ── Profile page ───────────────────────────────────────────────────────
  function tpPopulateProfile() {
    const raw = localStorage.getItem('mv_tutor_profile');
    const p = raw ? JSON.parse(raw) : {};
    const name = p.name || localStorage.getItem('mv_tutor_name') || '';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const el = id => document.getElementById(id);
    if (el('tp-profile-av-initials')) el('tp-profile-av-initials').textContent = initials;
    if (el('tp-profile-av-name'))     el('tp-profile-av-name').textContent     = name || '—';
    if (el('tpf-name'))       el('tpf-name').value       = name;
    if (el('tpf-type'))       el('tpf-type').value       = p.tutor_type || '';
    if (el('tpf-curriculum')) el('tpf-curriculum').value = p.primary_curriculum || '';
    if (el('tpf-specialty'))  el('tpf-specialty').value  = p.specialty_topic || '';
    if (el('tpf-branch'))     el('tpf-branch').value     = p.branch || '';
    if (el('tpf-exp'))        el('tpf-exp').value        = p.years_experience != null ? p.years_experience : '';
  }

  // ── Registration availability grid ─────────────────────────────────────
  function applyRegSlot(cell, key) {
    if (regDragAction === 'add') { regSelectedSlots.add(key); cell.classList.add('tp-slot--selected'); }
    else { regSelectedSlots.delete(key); cell.classList.remove('tp-slot--selected'); }
    clearFieldError('slots');
  }

  function buildAvailGrid() {
    const grid = document.getElementById('tp-tt-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const corner = document.createElement('div');
    corner.className = 'tp-tcell tp-tcell--corner'; grid.appendChild(corner);
    DAYS.forEach(d => {
      const h = document.createElement('div');
      h.className = 'tp-hcell'; h.textContent = d; grid.appendChild(h);
    });
    TIMES.forEach(t => {
      const isHalf = t.endsWith(':30');
      const tc = document.createElement('div');
      tc.className = 'tp-tcell' + (isHalf ? ' tp-tcell--half' : '');
      tc.textContent = isHalf ? '' : t; grid.appendChild(tc);
      DAYS.forEach(d => {
        const key = `${d}_${t}`;
        const cell = document.createElement('div');
        cell.className = 'tp-slot' + (isHalf ? ' tp-slot--half' : '');
        cell.dataset.key = key;
        if (regSelectedSlots.has(key)) cell.classList.add('tp-slot--selected');
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

  document.addEventListener('mouseup', () => {
    regDragging = false; regDragAction = null;
    if (!ttSelecting) return;
    ttSelecting = false;
    if (ttSelStart && ttSelEnd) {
      const col = ttSelStart.col;
      const today = new Date(); today.setHours(0,0,0,0);
      const cutoff = new Date(today); cutoff.setDate(today.getDate() + 7);
      const d = new Date(getWeekDates(weekOffset)[col]); d.setHours(0,0,0,0);
      if (d >= cutoff) {
        const r1 = Math.min(ttSelStart.row, ttSelEnd.row), r2 = Math.max(ttSelStart.row, ttSelEnd.row);
        for (let r = r1; r <= r2; r++) {
          if (!SESSIONS.find(s => s.weekOffset === weekOffset && s.day === col + 1 && s.startRow === r))
            ttSelected.add(`${weekOffset}-${col}-${r}`);
        }
      }
    }
    ttSelStart = null; ttSelEnd = null;
    tpRenderTtSelection(); tpUpdateSelBar();
  });

  buildAvailGrid();

  // Pre-fill form from localStorage
  (function prefillForm() {
    const raw = localStorage.getItem('mv_tutor_profile');
    const p = raw ? JSON.parse(raw) : {};
    const name = p.name || '';
    if (name) document.getElementById('tp-name').value = name;
    if (p.tutor_type)          document.getElementById('tp-tutor-type').value  = p.tutor_type;
    if (p.primary_curriculum)  document.getElementById('tp-curriculum').value  = p.primary_curriculum;
    if (p.specialty_topic)     document.getElementById('tp-specialty').value   = p.specialty_topic;
    if (p.years_experience != null) document.getElementById('tp-experience').value = p.years_experience;
    if (p.preferred_min_grade) document.getElementById('tp-min-grade').value   = p.preferred_min_grade;
    if (p.preferred_max_grade) document.getElementById('tp-max-grade').value   = p.preferred_max_grade;
    if (p.branch)              document.getElementById('tp-branch').value      = p.branch;
    if (Array.isArray(p.availability_slots)) {
      p.availability_slots.forEach(k => regSelectedSlots.add(k));
      buildAvailGrid();
    }
    tpUpdateProfileAvatar(name);
  })();

  document.getElementById('tp-name').addEventListener('input', e => tpUpdateProfileAvatar(e.target.value));

  function tpUpdateProfileAvatar(name) {
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
    const av = document.getElementById('tp-profile-av-initials');
    const nm = document.getElementById('tp-profile-av-name');
    if (av) av.textContent = initials;
    if (nm) nm.textContent = name.trim() || '—';
  }

  // ── Validation ─────────────────────────────────────────────────────────
  function setFieldError(field, msg) {
    const el = document.getElementById(`err-${field}`);
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
    const map = { name:'tp-name','tutor-type':'tp-tutor-type',curriculum:'tp-curriculum',specialty:'tp-specialty',experience:'tp-experience',rating:'tp-rating','min-grade':'tp-min-grade','max-grade':'tp-max-grade','success-rate':'tp-success-rate',branch:'tp-branch' };
    const input = document.getElementById(map[field] || `tp-${field}`);
    if (input) input.classList.toggle('tp-input--error', !!msg);
  }
  function clearFieldError(field) { setFieldError(field, ''); }

  function validateForm() {
    let valid = true;
    const name = document.getElementById('tp-name').value.trim();
    if (!name) { setFieldError('name','Full name is required.'); valid=false; } else clearFieldError('name');
    const tutorType = document.getElementById('tp-tutor-type').value;
    if (!tutorType) { setFieldError('tutor-type','Please select a tutor type.'); valid=false; } else clearFieldError('tutor-type');
    const curriculum = document.getElementById('tp-curriculum').value;
    if (!curriculum) { setFieldError('curriculum','Please select a curriculum.'); valid=false; } else clearFieldError('curriculum');
    const specialty = document.getElementById('tp-specialty').value;
    if (!specialty) { setFieldError('specialty','Please select a specialty topic.'); valid=false; } else clearFieldError('specialty');
    const expRaw = document.getElementById('tp-experience').value;
    const exp = parseInt(expRaw, 10);
    if (expRaw===''||isNaN(exp)||exp<0) { setFieldError('experience','Years of experience must be 0 or more.'); valid=false; } else clearFieldError('experience');
    const minGradeRaw = document.getElementById('tp-min-grade').value;
    const minGrade = parseInt(minGradeRaw, 10);
    if (!minGradeRaw||isNaN(minGrade)||minGrade<5||minGrade>12) { setFieldError('min-grade','Min grade must be between 5 and 12.'); valid=false; } else clearFieldError('min-grade');
    const maxGradeRaw = document.getElementById('tp-max-grade').value;
    const maxGrade = parseInt(maxGradeRaw, 10);
    if (!maxGradeRaw||isNaN(maxGrade)||maxGrade<5||maxGrade>12) { setFieldError('max-grade','Max grade must be between 5 and 12.'); valid=false; } else clearFieldError('max-grade');
    if (!isNaN(minGrade)&&!isNaN(maxGrade)&&minGrade>=5&&maxGrade>=5&&minGrade>maxGrade) { setFieldError('max-grade','Max grade must be ≥ min grade.'); valid=false; }
    const branch = document.getElementById('tp-branch').value;
    if (!branch) { setFieldError('branch','Please select a branch.'); valid=false; } else clearFieldError('branch');
    if (regSelectedSlots.size===0) { setFieldError('slots','Please select at least one availability slot.'); valid=false; } else clearFieldError('slots');
    return valid;
  }

  // ── Form submission ────────────────────────────────────────────────────
  const form = document.getElementById('tp-form');
  const successBanner = document.getElementById('tp-success-banner');
  const errorBanner   = document.getElementById('tp-error-banner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successBanner.style.display = 'none'; errorBanner.style.display = 'none';
    if (!validateForm()) return;
    const payload = {
      tutor_id: tutorId,
      name: document.getElementById('tp-name').value.trim(),
      tutor_type: document.getElementById('tp-tutor-type').value,
      primary_curriculum: document.getElementById('tp-curriculum').value,
      specialty_topic: document.getElementById('tp-specialty').value,
      years_experience: parseInt(document.getElementById('tp-experience').value, 10),
      preferred_min_grade: parseInt(document.getElementById('tp-min-grade').value, 10),
      preferred_max_grade: parseInt(document.getElementById('tp-max-grade').value, 10),
      branch: document.getElementById('tp-branch').value,
      availability_slots: Array.from(regSelectedSlots),
    };
    const submitBtn = document.getElementById('tp-submit-btn');
    submitBtn.disabled = true; submitBtn.textContent = 'Saving…';
    try {
      const res = await fetch('/matching/tutors', { method:'POST', headers:{'Content-Type':'application/json','X-API-Key':''}, body:JSON.stringify(payload) });
      if (res.ok) {
        successBanner.style.display = 'block';
        localStorage.setItem('mv_tutor_name', payload.name);
        localStorage.setItem('mv_tutor_profile', JSON.stringify(payload));
        tpUpdateNavUser(); tpUpdateProfileAvatar(payload.name); tpShowToast('✓ Profile saved!');
        pairingsLoaded = false; pairingsError = false; // force timetable refresh on next visit
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail;
        errorBanner.textContent = typeof detail === 'string' ? detail : `Validation error (${res.status}). Please check your inputs.`;
        errorBanner.style.display = 'block';
      }
    } catch {
      errorBanner.textContent = 'Network error. Please check your connection and try again.';
      errorBanner.style.display = 'block';
    } finally { submitBtn.disabled = false; submitBtn.textContent = 'Save Profile'; }
  });

  // ── Main timetable grid ────────────────────────────────────────────────
  // ── Live pairings from API ─────────────────────────────────────────────
  let livePairings = {}; // { "MON_09:00": PairingRecord }
  let pairingsLoaded = false;
  let pairingsError = false;

  async function tpLoadPairings() {
    try {
      const res = await fetch(`/matching/tutors/${tutorId}/pairings`);
      if (!res.ok) { pairingsError = true; return; }
      const records = await res.json();

      // Fetch student names for all unique student IDs
      const studentIds = [...new Set(records.map(p => p.student_id))];
      const studentNames = {};
      await Promise.all(studentIds.map(async id => {
        try {
          const r = await fetch(`/matching/students/${id}`);
          if (r.ok) { const s = await r.json(); studentNames[id] = s.name; }
        } catch {}
      }));

      livePairings = {};
      records.forEach(p => {
        const [day, time] = p.time_slot.split('_');
        const key = `${day.toUpperCase().slice(0,3)}_${time}`;
        livePairings[key] = { ...p, student_name: studentNames[p.student_id] || p.student_id };
      });
      pairingsLoaded = true;
    } catch (err) {
      console.error('Failed to load pairings:', err);
      pairingsError = true;
    }
  }

  function tpBuildGrid() {
    const grid = document.getElementById('tp-tt-main-grid');
    if (!grid) return;

    if (!pairingsLoaded && !pairingsError) {
      tpLoadPairings().then(() => tpBuildGrid());
      grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Loading sessions…</div>';
      return;
    }

    if (pairingsError) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Unable to load sessions. Please ensure the server is running and refresh the page.</div>';
      return;
    }

    grid.innerHTML = '';
    const dates = getWeekDates(weekOffset);
    const todayStr = new Date().toDateString();
    const today = new Date(); today.setHours(0,0,0,0);
    const cutoff = new Date(today); cutoff.setDate(today.getDate() + 7);

    const s = dates[0], e = dates[6];
    const weekRangeSub = document.getElementById('tp-week-range-sub');
    if (weekRangeSub) weekRangeSub.textContent = `${s.getDate()} ${s.toLocaleString('default',{month:'short'})} – ${e.getDate()} ${e.toLocaleString('default',{month:'short'})} ${e.getFullYear()}`;
    document.getElementById('tp-week-display').textContent =
      s.getMonth() === e.getMonth()
        ? `${s.toLocaleString('default',{month:'long'})} ${s.getFullYear()}`
        : `${s.toLocaleString('default',{month:'long'})} – ${e.toLocaleString('default',{month:'long'})} ${e.getFullYear()}`;

    // Header
    const blank = document.createElement('div'); blank.className = 'tp-hcell'; grid.appendChild(blank);
    dates.forEach((d, i) => {
      const isTd = d.toDateString() === todayStr;
      const dClean = new Date(d); dClean.setHours(0,0,0,0);
      const isLocked = availMode && dClean < cutoff;
      const hc = document.createElement('div');
      hc.className = 'tp-hcell' + (isTd ? ' tp-hcell--today' : '') + (isLocked ? ' tp-hcell--locked' : '');
      hc.innerHTML = `<span class="tp-day-num">${d.getDate()}${isTd ? '<span class="tp-today-pip"></span>' : ''}</span>${DAYS[i]}${isLocked ? '<span class="tp-locked-badge">Too soon</span>' : ''}`;
      grid.appendChild(hc);
    });

    // Rows
    TIMES.forEach((t, rowIdx) => {
      const isHalf = t.endsWith(':30');
      const tc = document.createElement('div');
      tc.className = 'tp-tcell' + (isHalf ? ' tp-tcell--half' : '');
      if (!isHalf) tc.textContent = t; grid.appendChild(tc);

      for (let col = 1; col <= 7; col++) {
        const sl = document.createElement('div');
        const dClean = new Date(dates[col-1]); dClean.setHours(0,0,0,0);
        const colLocked = availMode && dClean < cutoff;
        sl.className = 'tp-slot' + (isHalf ? ' tp-slot--half' : '') + (colLocked ? ' tp-slot--locked' : '');
        sl.dataset.col = col; sl.dataset.row = rowIdx;

        // Real pairings on current week (offset 0), availability slots on future weeks
        const key = `${DAYS[col-1]}_${t}`;
        const pairing = weekOffset === 0 && !isHalf ? livePairings[key] : null;

        if (pairing) {
          const isConfirmed = pairing.status === 'confirmed';
          sl.classList.add(isConfirmed ? 'tp-slot--confirmed' : 'tp-slot--pending');
          const blk = document.createElement('div');
          blk.className = isConfirmed ? 'tp-sess-block tp-sess-confirmed' : 'tp-sess-block tp-sess-pending';
          blk.style.height = '28px';
          blk.innerHTML = `<div class="tp-sb-label">${escapeHtml(pairing.student_name)}</div><div class="tp-sb-sub">${escapeHtml(t)}</div>`;
          blk.onclick = () => tpOpenPairingPopup(pairing, t);
          sl.appendChild(blk);
        } else {
          // Submitted availability / standby from local SESSIONS array
          const sessHere = SESSIONS.filter(s => s.weekOffset === weekOffset && s.day === col && s.startRow === rowIdx);
          if (sessHere.length) {
            sessHere.forEach(sess => {
              const blk = document.createElement('div');
              blk.className = 'tp-sess-block tp-sess-' + sess.type;
              blk.style.height = (sess.span * 32 - 4) + 'px';
              if (sess.type === 'standby') {
                blk.innerHTML = `<div class="tp-sb-label">Standby</div><div class="tp-sb-sub">${TIMES[sess.startRow]}</div>`;
              } else {
                blk.innerHTML = `<div class="tp-sb-label">Available</div><div class="tp-sb-sub">${TIMES[sess.startRow]}</div>`;
              }
              blk.onclick = () => tpOpenSessPopup(sess, dates[col-1], sess.startRow);
              sl.appendChild(blk);
            });
          } else if (availMode && !isHalf && !colLocked) {
            sl.addEventListener('mousedown', ev => {
              ev.preventDefault();
              ttSelecting = true; ttSelStart = {col:col-1, row:rowIdx}; ttSelEnd = {col:col-1, row:rowIdx};
              tpRenderTtSelection();
            });
            sl.addEventListener('mouseenter', () => {
              if (ttSelecting && ttSelStart.col === col-1) { ttSelEnd = {col:col-1, row:rowIdx}; tpRenderTtSelection(); }
            });
          }
        }
        grid.appendChild(sl);
      }
    });
    tpRenderTtSelection();
  }

  // Popup for a real API pairing (tutor view)
  function tpOpenPairingPopup(pairing, timeSlot) {
    const matchedAt = pairing.matched_at
      ? new Date(pairing.matched_at).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })
      : '—';
    const _isConfirmed = pairing.status === 'confirmed';
    document.getElementById('tp-pop-head').innerHTML = `<div class="tp-pop-label">${_isConfirmed ? 'Confirmed Session' : 'Pending Session'}</div><div class="tp-pop-date">${escapeHtml(timeSlot)}</div><div class="tp-status-pill ${_isConfirmed ? 'tp-sp-confirmed' : 'tp-sp-pending'}">${_isConfirmed ? '✓ Confirmed' : '⏳ Pending Confirmation'}</div>`;
    document.getElementById('tp-pop-body').innerHTML = `
      <div class="tp-detail-row"><div class="tp-detail-icon">🕐</div><div class="tp-detail-text"><strong>${escapeHtml(timeSlot)}</strong></div></div>
      <div class="tp-detail-row"><div class="tp-detail-icon">📅</div><div class="tp-detail-text">Matched ${escapeHtml(matchedAt)}</div></div>
      <div class="tp-stu-card-pop">
        <div class="tp-stu-card-top">
          <div class="tp-stu-av">${escapeHtml(pairing.student_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())}</div>
          <div><div class="tp-stu-name">${escapeHtml(pairing.student_name)}</div><div class="tp-stu-meta">Student</div></div>
        </div>
      </div>`;
    document.getElementById('tp-sess-overlay').classList.add('open');
  }

  function tpRenderTtSelection() {
    document.querySelectorAll('#tp-tt-main-grid .tp-slot').forEach(el => el.classList.remove('tp-slot--selecting'));
    ttSelected.forEach(key => {
      const [wo, c, r] = key.split('-').map(Number);
      if (wo !== weekOffset) return;
      const el = document.querySelector(`#tp-tt-main-grid .tp-slot[data-col="${c+1}"][data-row="${r}"]`);
      if (el) el.classList.add('tp-slot--selecting');
    });
    if (ttSelecting && ttSelStart && ttSelEnd && ttSelStart.col === ttSelEnd.col) {
      const col = ttSelStart.col;
      const r1 = Math.min(ttSelStart.row, ttSelEnd.row), r2 = Math.max(ttSelStart.row, ttSelEnd.row);
      for (let r = r1; r <= r2; r++) {
        const el = document.querySelector(`#tp-tt-main-grid .tp-slot[data-col="${col+1}"][data-row="${r}"]`);
        if (el) el.classList.add('tp-slot--selecting');
      }
    }
  }

  window.tpShiftWeek = function(dir) { weekOffset += dir; if (weekOffset < 0) weekOffset = 0; tpClearSelection(); tpBuildGrid(); };

  function tpClearSelection() {
    [...ttSelected].forEach(k => { if (k.startsWith(`${weekOffset}-`)) ttSelected.delete(k); });
    tpRenderTtSelection(); tpUpdateSelBar();
  }

  function tpUpdateSelBar() {
    const bar = document.getElementById('tp-sel-bar');
    if (!bar) return;
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    document.getElementById('tp-avail-count').textContent = keys.length;
    if (!keys.length) { bar.classList.remove('tp-visible'); return; }
    bar.classList.add('tp-visible');
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    const dates = getWeekDates(weekOffset);
    const parts = Object.entries(byCols).map(([c, rows]) => {
      rows.sort((a,b) => a-b);
      return `${DAYS[c]} ${dates[c].getDate()} ${dates[c].toLocaleString('default',{month:'short'})} · ${TIMES[rows[0]]}–${TIMES[rows[rows.length-1]]}`;
    });
    document.getElementById('tp-sel-time').textContent = parts.join(', ');
  }

  // ── Availability mode ──────────────────────────────────────────────────
  window.tpEnterAvailMode = function() {
    availMode = true;
    document.getElementById('tp-set-avail-btn').style.display    = 'none';
    document.getElementById('tp-submit-avail-btn').style.display = 'inline-flex';
    document.getElementById('tp-cancel-avail-btn').style.display = 'inline-flex';
    document.getElementById('tp-avail-banner').style.display     = 'flex';
    tpBuildGrid();
  };

  window.tpCancelAvailMode = function() {
    availMode = false; tpClearSelection();
    document.getElementById('tp-set-avail-btn').style.display    = 'inline-flex';
    document.getElementById('tp-submit-avail-btn').style.display = 'none';
    document.getElementById('tp-cancel-avail-btn').style.display = 'none';
    document.getElementById('tp-avail-banner').style.display     = 'none';
    tpBuildGrid();
  };

  window.tpOpenSubmitModal = function() {
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    if (!keys.length) { tpShowToast('No slots selected yet.'); return; }
    const dates = getWeekDates(weekOffset);
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    const html = Object.entries(byCols).map(([c, rows]) => {
      rows.sort((a,b) => a-b);
      const d = dates[c];
      return `<div class="tp-am-row"><div class="tp-am-dot"></div>${DAYS[c]} ${d.getDate()} ${d.toLocaleString('default',{month:'short'})} · ${TIMES[rows[0]]} – ${TIMES[rows[rows.length-1]]}</div>`;
    }).join('');
    document.getElementById('tp-am-slots').innerHTML = html;
    document.getElementById('tp-submit-overlay').classList.add('open');
  };

  window.tpCloseSubmitOverlay = function(e) { if (e.target === document.getElementById('tp-submit-overlay')) tpCloseSubmitDirect(); };
  window.tpCloseSubmitDirect  = function() { document.getElementById('tp-submit-overlay').classList.remove('open'); };

  window.tpConfirmSubmitAvail = function() {
    const keys = [...ttSelected].filter(k => k.startsWith(`${weekOffset}-`));
    const byCols = {};
    keys.forEach(k => { const [,c,r] = k.split('-').map(Number); if (!byCols[c]) byCols[c] = []; byCols[c].push(r); });
    Object.entries(byCols).forEach(([c, rows]) => {
      rows.sort((a,b) => a-b);
      SESSIONS.push({ id:'sa'+Date.now()+Math.random(), type:'availability', stuKey:null, day:parseInt(c)+1, startRow:rows[0], span:rows.length, weekOffset, reportDone:false });
    });
    keys.forEach(k => ttSelected.delete(k));
    tpCloseSubmitDirect(); tpCancelAvailMode();
    tpShowToast("Availability submitted. You'll be notified 5 days before each session.");
    tpBuildGrid();
  };

  // ── Session popup ──────────────────────────────────────────────────────
  function tpOpenSessPopup(sess, date, rowIdx) {
    const dateStr = `${date.getDate()} ${date.toLocaleString('default',{month:'long'})} ${date.getFullYear()}`;
    const timeStr = TIMES[rowIdx] || '';
    const durStr  = `${sess.span / 2} hr${sess.span > 2 ? 's' : ''}`;
    const stu = sess.stuKey ? STUDENTS[sess.stuKey] : null;
    const stMap = { confirmed:{label:'Confirmed',cls:'tp-sp-confirmed'}, standby:{label:'Standby',cls:'tp-sp-standby'}, availability:{label:'Availability Submitted',cls:'tp-sp-availability'} };
    const st = stMap[sess.type] || stMap.confirmed;

    document.getElementById('tp-pop-head').innerHTML = `
      <div class="tp-pop-label">${sess.type === 'availability' ? 'Availability Slot' : 'Session Details'}</div>
      <div class="tp-pop-date">${escapeHtml(dateStr)}</div>
      <div class="tp-status-pill ${st.cls}">${st.label}</div>`;

    let body = `<div class="tp-detail-row"><div class="tp-detail-icon">🕐</div><div class="tp-detail-text"><strong>${escapeHtml(timeStr)}</strong> · ${escapeHtml(durStr)}</div></div>`;

    if (sess.type === 'confirmed' && stu) {
      body += `
        <div class="tp-stu-card-pop">
          <div class="tp-stu-card-top">
            <div class="tp-stu-av">${escapeHtml(stu.initials)}</div>
            <div><div class="tp-stu-name">${escapeHtml(stu.name)}</div><div class="tp-stu-meta">${escapeHtml(stu.school)} · ${escapeHtml(stu.level)} · ${escapeHtml(stu.subject)}</div></div>
          </div>
          <div class="tp-stu-card-actions">
            <button class="tp-stu-action-btn tp-stu-action-primary" onclick="tpOpenStuProfile('${sess.stuKey}')">👤 View Profile &amp; History</button>
          </div>
        </div>
        <div class="tp-divider"></div>
        ${sess.reportDone
          ? `<div class="tp-report-done">✅ Lesson report submitted for this session.</div>`
          : tpBuildReportForm(sess.id)}`;
    } else if (sess.type === 'standby') {
      body += `<div class="tp-standby-box"><div class="tp-standby-title">🔵 Standby Slot</div><div class="tp-standby-body">You've been assigned as additional manpower for this slot. No specific student is assigned — you may be directed to support any session or cover an absence on the day.</div></div>`;
    } else if (sess.type === 'availability') {
      body += `<div class="tp-avail-info-box"><div class="tp-avail-info-title">⏳ Awaiting Confirmation</div><div class="tp-avail-info-body">You've marked yourself available. The centre will confirm and assign a student up to 5 days before the date.</div></div><button class="tp-remove-avail-btn" onclick="tpRemoveAvailSlot('${sess.id}')">Remove this availability slot</button>`;
    }

    document.getElementById('tp-pop-body').innerHTML = body;
    if (sess.type === 'confirmed' && !sess.reportDone) {
      if (!sessionTopics[sess.id]) sessionTopics[sess.id] = [];
      tpRenderTagInput(sess.id);
    }
    document.getElementById('tp-sess-overlay').classList.add('open');
  }

  function tpBuildReportForm(sessId) {
    return `<div class="tp-report-section">
      <div class="tp-report-title">Lesson Report</div>
      <div class="tp-report-sub">Submit your notes after this session.</div>
      <div class="tp-pfield-label" style="margin-bottom:5px;">Topics Covered</div>
      <div class="tp-tag-input-wrap" id="tp-tag-wrap-${sessId}" onclick="tpFocusTagInput('${sessId}')">
        <input class="tp-tag-real-input" id="tp-tag-input-${sessId}" placeholder="Type topic and press Enter…"
          onkeydown="tpHandleTagKey(event,'${sessId}')" />
      </div>
      <div class="tp-pfield-label" style="margin-bottom:5px;">Session Notes</div>
      <textarea class="tp-report-textarea" id="tp-r-notes-${sessId}" placeholder="Summarise progress, areas to improve, homework set…"></textarea>
      <button class="tp-btn tp-btn--primary" style="width:100%;" onclick="tpSubmitReport('${sessId}')">Submit Report</button>
    </div>`;
  }

  function tpRenderTagInput(sessId) {
    const wrap = document.getElementById('tp-tag-wrap-' + sessId);
    if (!wrap) return;
    const tags = (sessionTopics[sessId] || []).map(t => `<span class="tp-topic-tag">${escapeHtml(t)}<span class="tp-topic-tag-x" onclick="tpRemoveTag('${sessId}','${t}')">×</span></span>`).join('');
    wrap.innerHTML = tags + `<input class="tp-tag-real-input" id="tp-tag-input-${sessId}" placeholder="${(sessionTopics[sessId]||[]).length?'':'Type topic and press Enter…'}" onkeydown="tpHandleTagKey(event,'${sessId}')"/>`;
  }

  window.tpHandleTagKey = function(e, sessId) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().replace(/,$/, '');
      if (val) { if (!sessionTopics[sessId]) sessionTopics[sessId] = []; const clean = val.trim(); if (clean && !sessionTopics[sessId].includes(clean)) { sessionTopics[sessId].push(clean); tpRenderTagInput(sessId); } e.target.value = ''; }
    } else if (e.key === 'Backspace' && e.target.value === '') {
      const tags = sessionTopics[sessId] || [];
      if (tags.length) { tags.pop(); tpRenderTagInput(sessId); }
    }
  };
  window.tpFocusTagInput = function(sessId) { const el = document.getElementById('tp-tag-input-' + sessId); if (el) el.focus(); };
  window.tpRemoveTag = function(sessId, tag) { if (sessionTopics[sessId]) sessionTopics[sessId] = sessionTopics[sessId].filter(t => t !== tag); tpRenderTagInput(sessId); };

  window.tpSubmitReport = function(sessId) {
    const sess = SESSIONS.find(s => s.id === sessId);
    const notes  = document.getElementById('tp-r-notes-' + sessId)?.value || '';
    const topics = sessionTopics[sessId] || [];
    if (sess) {
      sess.reportDone = true;
      const today = new Date();
      LESSON_HISTORY.unshift({ id:'h'+Date.now(), stuKey:sess.stuKey, date:`${today.getDate()} ${today.toLocaleString('default',{month:'short'})} ${today.getFullYear()}`, day:today.getDate(), mon:today.toLocaleString('default',{month:'short'}), duration:`${sess.span/2} hr${sess.span>2?'s':''}`, rating:0, topics, notes });
      const nIdx = NOTIFS.findIndex(n => n.id === 'n-report-' + sessId);
      if (nIdx > -1) NOTIFS.splice(nIdx, 1);
      tpRenderNotifications();
    }
    tpCloseSessDirect(); tpShowToast('Lesson report submitted.');
  };

  window.tpRemoveAvailSlot = function(sessId) {
    const idx = SESSIONS.findIndex(s => s.id === sessId);
    if (idx > -1) SESSIONS.splice(idx, 1);
    tpCloseSessDirect(); tpBuildGrid(); tpShowToast('Availability slot removed.');
  };

  window.tpCloseSessOverlay = function(e) { if (e.target === document.getElementById('tp-sess-overlay')) tpCloseSessDirect(); };
  window.tpCloseSessDirect  = function() { document.getElementById('tp-sess-overlay').classList.remove('open'); };

  // ── Student profile popup ──────────────────────────────────────────────
  window.tpOpenStuProfile = function(stuKey) {
    const stu = STUDENTS[stuKey];
    const history = LESSON_HISTORY.filter(h => h.stuKey === stuKey);
    document.getElementById('tp-stu-head').innerHTML = `
      <div class="tp-stu-profile-av">${escapeHtml(stu.initials)}</div>
      <div><div class="tp-stu-profile-name">${escapeHtml(stu.name)}</div><div class="tp-stu-profile-sub">${escapeHtml(stu.school)} · ${escapeHtml(stu.level)}</div></div>
      <div class="tp-spu-close" onclick="tpCloseStuDirect()">✕</div>`;
    const byMonth = {};
    history.forEach(l => { if (!byMonth[l.mon]) byMonth[l.mon] = []; byMonth[l.mon].push(l); });
    let histHtml = '';
    if (!history.length) {
      histHtml = `<div class="tp-empty-state"><div class="tp-empty-icon">📖</div><div>No reports yet.</div></div>`;
    } else {
      Object.entries(byMonth).forEach(([mon, lessons]) => {
        histHtml += `<div class="tp-history-month">${mon} ${lessons[0].date.split(' ').pop()}</div>`;
        lessons.forEach(l => {
          const tags = l.topics.map(t => `<span class="tp-lc-tag">${escapeHtml(t)}</span>`).join('');
          histHtml += `<div class="tp-lesson-card"><div class="tp-lc-top"><div class="tp-lc-date-block"><div class="tp-lc-date-box"><div class="tp-lc-day">${l.day}</div><div class="tp-lc-mon">${l.mon}</div></div><div class="tp-lc-info"><div class="tp-lc-title">${escapeHtml(STUDENTS[l.stuKey]?.subject||'Session')}</div><div class="tp-lc-meta">${escapeHtml(l.date)} · ${escapeHtml(l.duration)}</div></div></div></div>${tags?`<div class="tp-lc-topics"><div class="tp-lc-topics-label">Topics Covered</div><div class="tp-lc-tags">${tags}</div></div>`:''}${l.notes?`<div class="tp-lc-notes"><div class="tp-lc-notes-label">Your Notes</div><div class="tp-lc-notes-text">${escapeHtml(l.notes)}</div></div>`:''}</div>`;
        });
      });
    }
    document.getElementById('tp-stu-body').innerHTML = `
      <div class="tp-stu-stat-row">
        <div class="tp-stu-stat"><div class="tp-stu-stat-val">${stu.sessions}</div><div class="tp-stu-stat-lbl">Sessions</div></div>
        <div class="tp-stu-stat"><div class="tp-stu-stat-val">${history.length}</div><div class="tp-stu-stat-lbl">Reports</div></div>
      </div>
      <div class="tp-section-head">Student Details</div>
      <div class="tp-field-pair">
        <div class="tp-field-item"><div class="tp-field-lbl">Subject</div><div class="tp-field-val">${escapeHtml(stu.subject)}</div></div>
        <div class="tp-field-item"><div class="tp-field-lbl">Level</div><div class="tp-field-val">${escapeHtml(stu.level)}</div></div>
        <div class="tp-field-item"><div class="tp-field-lbl">Email</div><div class="tp-field-val">${escapeHtml(stu.email)}</div></div>
        <div class="tp-field-item"><div class="tp-field-lbl">Phone</div><div class="tp-field-val">${escapeHtml(stu.phone)}</div></div>
      </div>
      <div class="tp-section-head">Parent / Guardian</div>
      <div class="tp-field-pair">
        <div class="tp-field-item"><div class="tp-field-lbl">Name</div><div class="tp-field-val">${escapeHtml(stu.parentName)}</div></div>
        <div class="tp-field-item"><div class="tp-field-lbl">Phone</div><div class="tp-field-val">${escapeHtml(stu.parentPhone)}</div></div>
      </div>
      <div class="tp-section-head">Lesson History</div>
      ${histHtml}`;
    document.getElementById('tp-stu-overlay').classList.add('open');
  };

  window.tpCloseStuOverlay = function(e) { if (e.target === document.getElementById('tp-stu-overlay')) tpCloseStuDirect(); };
  window.tpCloseStuDirect  = function() { document.getElementById('tp-stu-overlay').classList.remove('open'); };

  // ── Lesson history page ────────────────────────────────────────────────
  function tpRenderHistory() {
    const container = document.getElementById('tp-history-list');
    if (!container) return;
    if (!LESSON_HISTORY.length) { container.innerHTML = `<div class="tp-empty-state"><div class="tp-empty-icon">📖</div><div>No lesson reports yet.</div></div>`; return; }
    const byMonth = {};
    LESSON_HISTORY.forEach(l => { if (!byMonth[l.mon]) byMonth[l.mon] = []; byMonth[l.mon].push(l); });
    let html = '';
    Object.entries(byMonth).forEach(([mon, lessons]) => {
      html += `<div class="tp-history-month">${mon} ${lessons[0].date.split(' ').pop()}</div>`;
      lessons.forEach(l => {
        const stu = STUDENTS[l.stuKey];
        const tags = l.topics.map(t => `<span class="tp-lc-tag">${escapeHtml(t)}</span>`).join('');
        html += `<div class="tp-lesson-card"><div class="tp-lc-top"><div class="tp-lc-date-block"><div class="tp-lc-date-box"><div class="tp-lc-day">${l.day}</div><div class="tp-lc-mon">${l.mon}</div></div><div class="tp-lc-info"><div class="tp-lc-title">${escapeHtml(stu?.name||'Session')}</div><div class="tp-lc-meta">${escapeHtml(l.date)} · ${escapeHtml(l.duration)} · ${escapeHtml(stu?.subject||'')}</div></div></div></div>${tags?`<div class="tp-lc-topics"><div class="tp-lc-topics-label">Topics Covered</div><div class="tp-lc-tags">${tags}</div></div>`:''}${l.notes?`<div class="tp-lc-notes"><div class="tp-lc-notes-label">Your Notes</div><div class="tp-lc-notes-text">${escapeHtml(l.notes)}</div></div>`:''}</div>`;
      });
    });
    container.innerHTML = html;
  }

  // ── Notifications ──────────────────────────────────────────────────────
  function tpRenderNotifications() {
    const el = document.getElementById('tp-notif-list');
    if (!el) return;
    const unread = NOTIFS.filter(n => n.unread).length;
    const dot = document.getElementById('tp-notif-dot');
    if (dot) { dot.textContent = unread || ''; dot.style.display = unread ? '' : 'none'; }
    el.innerHTML = NOTIFS.map(n => `
      <div class="tp-notif-item${n.unread ? ' tp-notif-unread' : ''}">
        <div class="tp-notif-icon-wrap ${n.iconClass}">${n.icon}</div>
        <div class="tp-notif-content">
          <div class="tp-notif-title">${escapeHtml(n.title)}</div>
          <div class="tp-notif-body">${escapeHtml(n.body)}</div>
          <div class="tp-notif-time">${n.time}</div>
          ${n.action ? `<div class="tp-notif-action-row"><button class="tp-btn tp-btn--primary" style="font-size:11px;padding:5px 12px;" onclick="${n.action.fn}">${n.action.label}</button></div>` : ''}
        </div>
        ${n.unread ? '<div class="tp-unread-pip"></div>' : ''}
      </div>`).join('');
  }

  window.tpMarkAllRead = function() { NOTIFS.forEach(n => n.unread = false); tpRenderNotifications(); tpShowToast('All notifications marked as read.'); };

  document.getElementById('tp-notif-btn').addEventListener('click', () => {
    tpRenderNotifications();
    document.getElementById('tp-notif-overlay').classList.add('open');
  });

  window.tpCloseNotifOverlay = function(e) { if (e.target === document.getElementById('tp-notif-overlay')) tpCloseNotifDirect(); };
  window.tpCloseNotifDirect  = function() { document.getElementById('tp-notif-overlay').classList.remove('open'); };

  window.tpOpenReportFromNotif = function(sessId) {
    tpCloseNotifDirect();
    const sess = SESSIONS.find(s => s.id === sessId);
    if (!sess) return;
    tpShowPage('timetable', document.getElementById('nav-timetable'));
    weekOffset = sess.weekOffset; tpBuildGrid();
    setTimeout(() => { const dates = getWeekDates(sess.weekOffset); tpOpenSessPopup(sess, dates[sess.day-1], sess.startRow); }, 100);
  };

  // ── Toast ──────────────────────────────────────────────────────────────
  window.tpShowToast = function(msg) {
    const t = document.getElementById('tp-toast');
    t.textContent = msg; t.classList.add('tp-toast--show');
    setTimeout(() => t.classList.remove('tp-toast--show'), 2800);
  };

  // ── Escape key ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['tp-sess-overlay','tp-stu-overlay','tp-submit-overlay','tp-notif-overlay'].forEach(id => document.getElementById(id).classList.remove('open'));
    }
  });

  tpRenderNotifications();
}
