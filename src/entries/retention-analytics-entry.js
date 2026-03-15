import { mountPage } from '/src/app.js';
import { createRetentionAnalyticsContent, initRetentionAnalyticsCharts } from '/src/pages/retention-analytics-page.js';

mountPage({
  route: '/retention-analytics.html',
  title: 'Retention Analytics',
  breadcrumb: 'Retention Analytics',
  contentHtml: createRetentionAnalyticsContent(),
  init: initRetentionAnalyticsCharts
});
