import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        dashboard: 'dashboard.html',
        manpowerManagement: 'manpower-management.html',
        retentionAnalytics: 'retention-analytics.html',
        capacityUtilization: 'capacity-utilization.html',
        marketingInsights: 'marketing-insights.html',
        payrollAnalytics: 'payroll-analytics.html'
      }
    }
  }
});
