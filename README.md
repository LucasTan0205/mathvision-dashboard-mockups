# MathVision Dashboard Mockups

Static multi-page MathVision dashboard built with Vite, Bootstrap CDN, and modular JS/CSS.

## Structure
- `src/layout/base.html` – shared shell (top navbar, sidebar, breadcrumbs).
- `src/styles.css` – tokenized design system for every page.
- `src/app.js` – app bootstrapping and active-route/nav behavior.
- `src/config/nav.js` – canonical navigation map.
- `src/pages/*.js` – page-specific mock content payloads.
- `src/entries/*.js` – page bootstrap entrypoints.
- Route pages: `index.html`, `dashboard.html`, `manpower-management.html`, `retention-analytics.html`, `capacity-utilization.html`, `marketing-insights.html`, `payroll-analytics.html`.

## Local URLs
- `index.html` and `dashboard.html` both open to the dashboard route.
- `/manpower-management.html`
- `/retention-analytics.html`
- `/capacity-utilization.html`
- `/marketing-insights.html`
- `/payroll-analytics.html`

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## GitHub Pages
- Production builds use `base: '/mathvision-dashboard-mockups/'` by default so assets resolve correctly on GitHub Pages.
- If your GitHub repo name is different, set `VITE_BASE_PATH` before building.
- This repo now includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that builds and deploys `dist/` on pushes to `main`.
- In GitHub repository settings, Pages should be set to `GitHub Actions` as the source.

Example:
```bash
$env:VITE_BASE_PATH='/your-repo-name/'
npm run build
```

## Notes
- Shared shell + styles + branch selector remain consistent across all pages.
- Side navigation links now point to concrete routes.
- Symbols in text are rendered with Unicode-safe HTML entities.
