import { mountPage } from '/src/app.js';
import { createDashboardContent } from '/src/pages/dashboard-page.js';

mountPage({
  route: '/dashboard.html',
  title: 'Dashboard',
  breadcrumb: 'Dashboard',
  contentHtml: createDashboardContent()
});
