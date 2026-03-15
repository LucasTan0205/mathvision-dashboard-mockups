import baseTemplate from './layout/base.html?raw';
import { navLinks, normalizeRoute } from './config/nav.js';

const SIDEBAR_COLLAPSED_KEY = 'mathvision-sidebar-collapsed';

function renderNav(activeRoute) {
  return navLinks
    .map((link) => {
      const isActive = link.path === activeRoute ? ' active' : '';
      const href = link.path.startsWith('/') ? link.path.substring(1) : link.path;
      return `<li class="nav-item">
          <a class="nav-link${isActive}" href="${href}">
              <span class="nav-link-icon"><i class="bi bi-${link.icon}"></i></span>
              <span class="nav-link-label">${link.label}</span>
            </a>
        </li>`;
    })
    .join('\n');
}

function attachSharedBindings() {
  const shell = document.querySelector('.app-shell');
  const branchLabel = document.getElementById('currentBranchLabel');
  const branchLinks = document.querySelectorAll('.branch-option');
  const sidebarToggles = document.querySelectorAll('[data-sidebar-toggle]');
  const mobileBreakpoint = window.matchMedia('(max-width: 991.98px)');

  branchLinks.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      const next = item.dataset.branch;
      if (branchLabel && next) {
        branchLabel.textContent = next;
      }
    });
  });

  const nav = document.getElementById('sidebar-nav');
  const activeRoute = normalizeRoute(window.location.pathname);
  const links = nav?.querySelectorAll('.nav-link') || [];

  links.forEach((link) => {
    const href = link.getAttribute('href');
    const match = normalizeRoute(href || '');
    link.classList.toggle('active', match === activeRoute);
  });

  const syncSidebarState = () => {
    if (!shell) {
      return;
    }

    if (mobileBreakpoint.matches) {
      shell.classList.remove('sidebar-collapsed');
    } else {
      const isCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
      shell.classList.toggle('sidebar-collapsed', isCollapsed);
      shell.classList.remove('sidebar-open');
    }
  };

  sidebarToggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      if (!shell) {
        return;
      }

      if (mobileBreakpoint.matches) {
        shell.classList.toggle('sidebar-open');
        return;
      }

      const nextCollapsed = !shell.classList.contains('sidebar-collapsed');
      shell.classList.toggle('sidebar-collapsed', nextCollapsed);
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextCollapsed));
    });
  });

  syncSidebarState();
  mobileBreakpoint.addEventListener('change', syncSidebarState);
}

function preparePageEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-animate-in]').forEach((element) => {
      element.classList.add('is-entered');
    });
    return [];
  }

  const animatedSections = document.querySelectorAll(
    '.topbar-panel, .page-meta, .page-content > *, .tutor-heatmap-card'
  );

  const visibleSections = Array.from(animatedSections).filter((element) => !element.querySelector('canvas'));

  visibleSections.forEach((element, index) => {
    element.setAttribute('data-animate-in', '');
    element.classList.remove('is-entered');
    element.style.setProperty('--enter-delay', `${Math.min(index * 55, 360)}ms`);
  });

  return visibleSections;
}

function animatePageEntrance(animatedSections) {
  if (!animatedSections.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  animatedSections.forEach((element) => {
    void element.offsetWidth;
  });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      animatedSections.forEach((element) => {
        element.classList.add('is-entered');
      });
    });
  });
}

function runAfterNextPaint(callback) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      callback();
    });
  });
}

export function mountPage({ route, title, breadcrumb, contentHtml, init }) {
  const activeRoute = normalizeRoute(route);
  const html = baseTemplate
    .replace('__TITLE__', title)
    .replace('__BREADCRUMB__', breadcrumb || title)
    .replace('<!--NAV_LINKS-->', renderNav(activeRoute));

  document.body.innerHTML = html;
  document.getElementById('page-content').innerHTML = contentHtml;
  attachSharedBindings();
  const animatedSections = preparePageEntrance();

  if (typeof init === 'function') {
    runAfterNextPaint(() => {
      init();
    });
  }

  animatePageEntrance(animatedSections);
}

window.MathVision = {
  setBranch: (name) => {
    const label = document.getElementById('currentBranchLabel');
    if (label) {
      label.textContent = name;
    }
  }
};
