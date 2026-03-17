/* ═══════════════════════════════════════════════════════════
   Records – Tabbed container for Student & Tutor Profiles
   ═══════════════════════════════════════════════════════════ */

import { createStudentIntakeContent, initStudentIntake } from './student-intake-page.js';
import { createTutorProfilesContent, initTutorProfiles } from './tutor-profiles-page.js';

export function createRecordsContent() {
  return `
    <!-- Sub-tab navigation -->
    <div class="rc-tabs" id="rcTabs">
      <button class="rc-tab rc-tab--active" data-tab="students" type="button">
        <i class="bi bi-person-plus"></i> Student Profiles
      </button>
      <button class="rc-tab" data-tab="tutors" type="button">
        <i class="bi bi-person-badge"></i> Tutor Profiles
      </button>
    </div>

    <!-- Student Profiles pane -->
    <div class="rc-pane rc-pane--active" id="rcStudents">
      ${createStudentIntakeContent()}
    </div>

    <!-- Tutor Profiles pane -->
    <div class="rc-pane" id="rcTutors" style="display:none">
      ${createTutorProfilesContent()}
    </div>
  `;
}

export function initRecords() {
  /* Initialise both modules (all DOM elements exist) */
  initStudentIntake();
  initTutorProfiles();

  /* Tab switching */
  const tabs = document.querySelectorAll('#rcTabs .rc-tab');
  const panes = {
    students: document.getElementById('rcStudents'),
    tutors: document.getElementById('rcTutors')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('rc-tab--active'));
      tab.classList.add('rc-tab--active');

      Object.entries(panes).forEach(([key, pane]) => {
        const isActive = key === target;
        pane.style.display = isActive ? '' : 'none';
        pane.classList.toggle('rc-pane--active', isActive);
      });
    });
  });
}
