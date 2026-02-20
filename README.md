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

## Deploying for Free

### Backend → [Render](https://render.com)

1. Push this repo to GitHub.
2. Go to Render → **New Web Service** → connect your repo.
3. Set **Root Directory** to `ai-delivery-manager-backend`.
4. Build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py seed_workboard && python manage.py augment_workboard`
5. Start command: `python manage.py runserver 0.0.0.0:$PORT`
6. Add environment variable: `DJANGO_ALLOWED_HOSTS=your-app.onrender.com`
7. Free tier — sleeps after 15 min of inactivity (first request after sleep takes ~30s).

### Frontend → [Vercel](https://vercel.com)

1. Go to Vercel → **New Project** → import your GitHub repo.
2. Set **Root Directory** to `ai-delivery-manager-frontend`.
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
4. Update `src/services/api.js` to use `import.meta.env.VITE_API_URL` as the base URL.
5. Deploy — Vercel handles the rest. Free forever for personal projects.

### Update Django ALLOWED_HOSTS for production

In `ai-delivery-manager-backend/config/settings.py`, change:
```python
ALLOWED_HOSTS = ['*']   # already set this way — Render will work
```

And update CORS to allow your Vercel domain:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-app.vercel.app",
]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6 + Django REST Framework |
| Database | SQLite (local) |
| Frontend | React 19 + Vite 7 |
| Styling | Plain CSS |
| Deployment | Render (backend) + Vercel (frontend) |
