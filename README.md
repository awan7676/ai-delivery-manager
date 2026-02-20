# AI Delivery Manager

Stop spending hours writing project updates. Get a complete status report in one click.

**Features:** Daily Standups · Weekly Client Reports · Audience Rewriter · Risk Analysis · Live Dashboard

---

## Quick Start (Local)

### 1. Backend (Django — Python 3.11+)

```bash
cd ai-delivery-manager-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_workboard   # seeds demo tickets, PRs, team members
python manage.py augment_workboard # adds realistic statuses and dates
python manage.py runserver 8000
```

Backend will be live at **http://localhost:8000**

### 2. Frontend (React + Vite — Node 18+)

```bash
cd ai-delivery-manager-frontend
npm install
npm run dev
```

Frontend will be live at **http://localhost:5173**

> Note: The frontend is pre-configured to talk to `http://localhost:8000`. No extra config needed for local development.

---

## Will I see data?

**Yes** — the `seed_workboard` and `augment_workboard` commands create a full demo project:
- 10 tickets across different statuses (Done, In Progress, Blocked, Overdue)
- 4 team members
- 6 pull requests
- Realistic dates so Risk Analysis flags real overdue items

Once seeded, every report button on the frontend will return real results immediately.

---

## Project Structure

```
ai-delivery-manager-backend/   Django REST API
  workboard/                   Tickets, PRs, team members (models + seed commands)
  reports/                     Report engine — all 5 report types
  data_sources/                Mock data loaders
  ai_engine/                   AI integration layer (swap in GPT here)

ai-delivery-manager-frontend/  React + Vite
  src/pages/                   Dashboard, Tickets, PRs, Members
  src/components/              Standup, WeeklyReport, Rewriter, RiskAnalysis

presentation.html              Self-contained slide deck (open in any browser)
```

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/reports/dashboard/` | Project health, progress, stats |
| POST | `/api/reports/daily-standup/` | Generate standup |
| POST | `/api/reports/weekly-summary/` | Generate weekly client report |
| POST | `/api/reports/rewrite/` | Rewrite for 3 audiences |
| POST | `/api/reports/risk-analysis/` | Identify overdue + blocked risks |
| GET | `/api/workboard/tickets/` | List all tickets |
| GET | `/api/workboard/members/` | List team members |
| GET | `/api/workboard/prs/` | List pull requests |

---

## Deploying for Free (Always On)

The backend goes on **Render** (free), the frontend goes on **Vercel** (free). A free ping service keeps the backend awake 24/7 — no sleeping, no cold starts.

---

### Step 1 — Deploy the Backend on Render

1. Go to [render.com](https://render.com) → sign up with GitHub → click **New → Web Service**.
2. Connect your GitHub repo.
3. Fill in these fields exactly:

   | Field | Value |
   |-------|-------|
   | **Name** | `ai-delivery-manager-backend` (or anything you like) |
   | **Root Directory** | `ai-delivery-manager-backend` |
   | **Environment** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `bash start.sh` |
   | **Instance Type** | `Free` |

4. Click **Advanced → Add Environment Variable** and add these:

   | Key | Value |
   |-----|-------|
   | `DJANGO_DEBUG` | `False` |
   | `DJANGO_SECRET_KEY` | any long random string, e.g. `x8k2!mP9qLz3nT7wV1sR6uY4cJ0bA5` |
   | `DJANGO_ALLOWED_HOSTS` | `your-app-name.onrender.com` (you'll know this after first deploy) |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (fill in after Step 2) |

5. Click **Create Web Service**. Render will build and deploy automatically.

6. Once deployed, visit `https://your-app-name.onrender.com/api/reports/dashboard/` — you should see JSON with project data. ✅

> **About the data:** `start.sh` runs `seed_workboard` and `augment_workboard` every time the server starts, so demo data is always present — even after a restart or redeploy.

---

### Step 2 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub → click **Add New → Project**.
2. Import your GitHub repo.
3. Fill in:

   | Field | Value |
   |-------|-------|
   | **Root Directory** | `ai-delivery-manager-frontend` |
   | **Framework Preset** | `Vite` (auto-detected) |

4. Click **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE` | `https://your-app-name.onrender.com/api/reports` |

   *(Replace `your-app-name` with your actual Render URL from Step 1)*

5. Click **Deploy**. Vercel builds and gives you a URL like `https://your-app.vercel.app`. ✅

---

### Step 3 — Update CORS on Render (links the two together)

1. Go back to your Render service → **Environment** tab.
2. Update `CORS_ALLOWED_ORIGINS` to your actual Vercel URL: `https://your-app.vercel.app`.
3. Click **Save Changes** → Render redeploys automatically in ~1 minute.

---

### Step 4 — Keep the Backend Always Awake (Free)

Render's free tier pauses after 15 minutes of no traffic. Fix this with a free ping service:

1. Go to [cron-job.org](https://cron-job.org) → create a free account.
2. Click **Create Cronjob**:
   - **URL:** `https://your-app-name.onrender.com/api/reports/dashboard/`
   - **Schedule:** Every 14 minutes
3. Save. That's it — the backend will never sleep again. ✅

---

### Final Result

| | URL | Always On? | Data? |
|--|-----|-----------|-------|
| **Frontend** | `https://your-app.vercel.app` | ✅ Yes | ✅ Yes |
| **Backend** | `https://your-app-name.onrender.com` | ✅ Yes (via ping) | ✅ Yes (seeded on startup) |

Both are completely free. No credit card needed.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6 + Django REST Framework + Gunicorn |
| Database | SQLite (auto-seeded with demo data on every startup) |
| Frontend | React 19 + Vite 7 |
| Styling | Plain CSS |
| Deployment | Render (backend, free) + Vercel (frontend, free) + cron-job.org (keep-alive, free) |
