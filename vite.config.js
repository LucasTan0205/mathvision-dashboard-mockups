import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productionBase = env.VITE_BASE_PATH || '/mathvision-dashboard-mockups/';

  return {
    base: mode === 'production' ? productionBase : '/',
    server: {
      proxy: {
        '/analytics': 'http://localhost:8000',
        '/data': 'http://localhost:8000',
        '/files': 'http://localhost:8000',
        '/jobs': 'http://localhost:8000',
        '/results': 'http://localhost:8000',
        '/health': 'http://localhost:8000',
        '/matching': 'http://localhost:8000',
        '/demand': 'http://localhost:8000',
      }
    },
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
          csvUpload: resolve(__dirname, 'csv-upload.html'),
          studentPortal: 'student-portal.html',
          tutorPortal: 'tutor-portal.html'
        }
      }
    }
  };
});
