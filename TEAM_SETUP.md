# Team Setup (CareFlow Exchange / MediMatch)

This repo is a Vite + React front-end scaffold with Tailwind and shadcn-style UI components.

## Prerequisites
- Node.js `20.19+` or `22.12+`
- npm `9+` (or `pnpm`/`yarn`, but this repo uses npm lockfile)

## Install
```bash
npm install
```

## Run Dev Server
```bash
npm run dev
```

Default local URL:
- http://localhost:5173

## Required Dependencies (auto-installed by `npm install`)
Runtime:
- `react`
- `react-dom`
- `react-router-dom`
- `lucide-react`

Dev:
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `vite`

## Tailwind Notes
- Config: `tailwind.config.js`
- Directives: `src/index.css`

## Firebase (for teammate)
No Firebase is configured yet. To add Firebase later:
1. Install SDK:
   ```bash
   npm install firebase
   ```
2. Create `.env.local` with your Firebase config keys (never commit this file).
3. Initialize Firebase in a new module (e.g. `src/lib/firebase.js`) and import where needed.

## Common Issues
- If `npm run dev` fails with Node version errors, upgrade Node.
- If port `5173` is busy, Vite will pick a new port and print it in the console.
