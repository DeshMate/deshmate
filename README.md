# DeshMate

বাংলাদেশকে জানুন, জীবনের হিসাব করুন।

DeshMate is a Bengali-first travel and life-planning website built with React, Vite, and React Router. District information, travel estimates, and calculators run in the browser; the project does not require a backend or environment variables.

## Local development

```sh
npm ci
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

Vite writes the production site to `dist/`.

## Deploy to Cloudflare Pages

Connect the existing `DeshMate/deshmate` GitHub repository in Cloudflare Pages and use:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: none required

Cloudflare Pages serves this Vite single-page app through its standard SPA fallback, so React Router routes can be opened or refreshed directly. Once Git integration is enabled, pushes to `main` trigger production builds and deployments.
