# Weekly Dashboard — setup

A one-screen weekly dashboard (desktop) + a frictionless phone capture view, on your usual stack:
React + Vite → Netlify, with Supabase for data and login.

Everything below is copy-paste. Run git commands in the **standalone Mac Terminal** (not the VS Code one).

---

## 1. Supabase — create the project + tables

1. Go to supabase.com → **New project**. Name it `weekly-dashboard`. Pick a region near Toronto (East US is fine). Save the database password somewhere.
2. Wait for it to finish provisioning.
3. Left sidebar → **SQL Editor** → **New query**. Paste the entire contents of `supabase_schema.sql` and click **Run**. You should see "Success."
4. Left sidebar → **Project Settings → API**. Copy two things:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (the long one under "Project API keys")
5. Left sidebar → **Authentication → Providers → Email**. Make sure **Email** is enabled. For a personal app you can turn **Confirm email** OFF (under Authentication → Settings) so your first sign-up logs you straight in. Your call.

> The schema turns on Row Level Security, so even though the anon key ships in the browser, no one can read or write your rows without being logged in as you.

---

## 2. Run it locally

```bash
cd ~/Documents          # or wherever you keep projects
# unzip the project here, then:
cd weekly-dashboard

cp .env.example .env
```

Open `.env` and paste your two values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Then:

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).
- Click **"First time? Create your account"**, enter an email + password. That's your one account.
- The dashboard seeds itself with default panels (Work / Personal / Reminders) and habits the first time.
- Visit http://localhost:5173/capture to see the phone view.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Weekly dashboard v1"
# create an empty repo on github.com first (e.g. weekly-dashboard), then:
git remote add origin https://github.com/jefferykushner/weekly-dashboard.git
git branch -M main
git push -u origin main
```

(`.env` and `node_modules` are already gitignored, so your keys do not get pushed.)

---

## 4. Deploy on Netlify

1. netlify.com → **Add new site → Import an existing project** → pick the GitHub repo.
2. Build settings (Netlify usually auto-detects Vite):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Before the first deploy, go to **Site settings → Environment variables** and add the same two vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. The `public/_redirects` file is already included so `/capture` and refreshes work.

---

## 5. Put capture on your phone home screen

1. On your phone, open `https://YOUR-SITE.netlify.app/capture` in Safari/Chrome.
2. Sign in once (the session sticks, so you stay logged in).
3. **Share → Add to Home Screen.** Now it opens full-screen straight into the capture box.
4. Captures work even with no signal — they queue and sync automatically when you are back online.

---

## How it's wired (so you can change things later)

- `src/components/Dashboard.jsx` — the full week view. Panels, day columns, habits, brain dump.
- `src/components/Capture.jsx` — the phone quick-add view, with the offline queue.
- `src/components/RolloverNudge.jsx` — the "still want these?" review for overdue day items.
- `src/lib/db.js` — every read/write to Supabase lives here. One file to look at when changing data behavior.
- `src/lib/dates.js` — week math.
- `supabase_schema.sql` — the database. Re-runnable.

### Editing your panels / habits later
For now, panels and habits are seeded once. To rename or add them, edit rows directly in the Supabase **Table editor** (`panels`, `habits` tables) — quick and safe. A proper in-app "manage panels" UI is a good v1.1 addition once you know which categories you actually use.

### A known gotcha (yours, from past projects)
Apostrophes inside single-quoted JS strings break the Vite parser. If you hand-edit a string with a contraction, use double quotes or escape it (`\'`). The code already follows this.
