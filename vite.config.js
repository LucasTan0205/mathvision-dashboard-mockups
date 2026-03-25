import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productionBase = env.VITE_BASE_PATH || '/mathvision-dashboard-mockups/';

  return {
    base: mode === 'production' ? productionBase : '/',
    build: {
      rollupOptions: {
        input: {
          index: 'index.html',
          dashboard: 'dashboard.html',
          manpowerManagement: 'manpower-management.html',
          retentionAnalytics: 'retention-analytics.html',
          capacityUtilization: 'capacity-utilization.html',
          marketingInsights: 'marketing-insights.html',
          payrollAnalytics: 'payroll-analytics.html',
          records: 'records.html',
          csvUpload: resolve(__dirname, 'csv-upload.html')
        }
      }
    }
  };
});
