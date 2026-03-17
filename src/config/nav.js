export const navLinks = [
  { label: 'Dashboard', path: '/dashboard.html', icon: 'speedometer2' },
  { label: 'Manpower Management', path: '/manpower-management.html', icon: 'people' },
  { label: 'Retention Analytics', path: '/retention-analytics.html', icon: 'graph-up' },
  { label: 'Tutor Capacity', path: '/capacity-utilization.html', icon: 'bar-chart-line' },
  { label: 'Marketing Insights', path: '/marketing-insights.html', icon: 'clipboard-data' },
  { label: 'Payroll Analytics', path: '/payroll-analytics.html', icon: 'wallet' },
  { label: 'Records', path: '/records.html', icon: 'folder2-open' }
];

export function normalizeRoute(pathname) {
  const file = pathname.split('/').pop() || 'dashboard.html';
  return file === 'index.html' ? '/dashboard.html' : `/${file}`;
}
