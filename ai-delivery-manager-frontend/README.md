# AI Delivery Manager — Frontend (Minimal)

Quick start (frontend):

1. Install dependencies

```bash
cd ai-delivery-manager-frontend
npm install
```

2. Run dev server

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default.

API base: the frontend posts to `http://127.0.0.1:8000/api/reports/` by default. You can override it by setting the `VITE_API_BASE` environment variable (e.g. in `.env`):

```
VITE_API_BASE=http://127.0.0.1:8000/api/reports
```

Start the Django backend (from `ai-delivery-manager-backend`) before using the frontend:

```bash
python manage.py migrate
python manage.py runserver
```

This frontend is intentionally minimal — wiring only — to demo calling the backend mock-driven report endpoints.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
