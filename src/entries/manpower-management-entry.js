import { mountPage } from '/src/app.js';
import { createManpowerManagementContent, initManpowerManagementCharts } from '/src/pages/manpower-management-page.js';

mountPage({
  route: '/manpower-management.html',
  title: 'Manpower Management',
  breadcrumb: 'Manpower Management',
  contentHtml: createManpowerManagementContent(),
  init: initManpowerManagementCharts
});
