const API_BASE = (import.meta.env.VITE_API_BASE) || 'http://127.0.0.1:8000/api/reports';

async function post(path, body = {}) {
  const res = await fetch(`${API_BASE}/${path}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let err = text || res.statusText || 'Request failed'
    throw new Error(err)
  }
  try { return JSON.parse(text) } catch (e) { return text }
}

async function get(path) {
  const res = await fetch(`${API_BASE}/${path}/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText || 'Request failed')
  try { return JSON.parse(text) } catch (e) { return text }
}

export function dailyStandup() {
  return post('daily-standup');
}

export function weeklyClient() {
  return post('weekly-client');
}

export function rewriteSummary(tone = 'client', text = '') {
  return post('rewrite', { tone, text });
}

export function riskAnalysis() {
  return post('risk-analysis');
}

export function dashboardStats() {
  return get('dashboard');
}

export default { dailyStandup, weeklyClient, rewriteSummary, riskAnalysis, dashboardStats };
