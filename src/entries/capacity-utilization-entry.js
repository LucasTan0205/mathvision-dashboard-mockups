import { mountPage } from '/src/app.js';
import { createCapacityUtilizationContent, initCapacityUtilizationCharts } from '/src/pages/capacity-utilization-page.js';

mountPage({
  route: '/capacity-utilization.html',
  title: 'Tutor Capacity Utilization',
  breadcrumb: 'Tutor Capacity Utilization',
  contentHtml: createCapacityUtilizationContent(),
  init: initCapacityUtilizationCharts
});
