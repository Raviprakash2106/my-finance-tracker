# Personal Finance Tracker

A ledger-style personal finance tracker built with React, Tailwind, and
Recharts. Tracks income/expense entries in INR, with a category breakdown
chart and a monthly income-vs-expense trend chart. Data is saved to the
browser's `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173).

## Push to GitHub

```bash
git init
git add .
git commit -m "Personal finance tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Deploy so a link actually opens the working app

GitHub alone only shows source code — it doesn't run it. Deploy to a static
host so clicking a link opens a live, working app:

### Vercel (recommended, easiest)
1. Go to vercel.com, sign in with GitHub.
2. "Add New Project" → select this repo.
3. Framework preset: Vite (auto-detected). Leave build settings as default
   (`npm run build`, output dir `dist`).
4. Click Deploy. You'll get a live URL like `finance-tracker.vercel.app`
   within a minute, and it auto-redeploys every time you push to GitHub.

### Netlify (just as easy)
1. Go to netlify.com, sign in with GitHub.
2. "Add new site" → "Import an existing project" → select this repo.
3. Build command: `npm run build`, publish directory: `dist`.
4. Deploy — you get a live URL immediately.

### GitHub Pages (free, no third-party account needed)
1. `npm install --save-dev gh-pages`
2. In `package.json`, add `"homepage": "https://<username>.github.io/<repo-name>"`
   and a script: `"deploy": "vite build && gh-pages -d dist"`.
3. In `vite.config.js`, set `base: "/<repo-name>/"`.
4. Run `npm run deploy`. Your site goes live at the homepage URL above.

Put the live URL (not the GitHub repo URL) in your resume/portfolio —
that's the link that should "just work" when someone clicks it.
