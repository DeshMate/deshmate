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

Vite writes the production site to `dist/`. The `vercel.json` rewrite keeps React Router routes working when opened or refreshed directly.

## Deploy to Vercel

1. Import the existing `DeshMate/deshmate` GitHub repository in Vercel.
2. Select the Vite framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. No environment variables are required.

Vercel redeploys the site after each push to the connected production branch.
