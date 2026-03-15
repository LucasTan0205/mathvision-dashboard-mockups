import { mountPage } from '/src/app.js';
import { createMarketingInsightsContent, initMarketingInsightsCharts } from '/src/pages/marketing-insights-page.js';

mountPage({
  route: '/marketing-insights.html',
  title: 'Marketing Insights',
  breadcrumb: 'Marketing Insights',
  contentHtml: createMarketingInsightsContent(),
  init: initMarketingInsightsCharts
});
