import { mountPage } from '/src/app.js';
import { createPayrollAnalyticsContent, initPayrollAnalyticsCharts } from '/src/pages/payroll-analytics-page.js';

mountPage({
  route: '/payroll-analytics.html',
  title: 'Payroll Analytics',
  breadcrumb: 'Payroll Analytics',
  contentHtml: createPayrollAnalyticsContent(),
  init: initPayrollAnalyticsCharts
});
