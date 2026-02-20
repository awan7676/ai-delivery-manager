const API_BASE = (import.meta.env.VITE_API_BASE) || 'http://127.0.0.1:8000/api/workboard'

async function post(path, body = {}){
  const res = await fetch(`${API_BASE}/${path}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || res.statusText)
  try { return JSON.parse(text) } catch(e){ return text }
}

async function get(path){
  const url = path.includes('?') ? `${API_BASE}/${path}` : `${API_BASE}/${path}/`
  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok) throw new Error(text || res.statusText)
  try { return JSON.parse(text) } catch(e){ return text }
}

export function listTickets(params = {}){
  const qs = new URLSearchParams()
  if (params.assignee) qs.set('assignee_id', params.assignee)
  if (params.status) qs.set('status', params.status)
  const path = `tickets${qs.toString() ? '?'+qs.toString() : ''}`
  return get(path)
}
export function createTicket(body){ return post('tickets', body) }
export function patchTicket(id, body){ return fetch(`${API_BASE}/tickets/${id}/`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(async r=>{ if(!r.ok) throw new Error(await r.text()); return r.json() }) }
export function deleteTicket(id){ return fetch(`${API_BASE}/tickets/${id}/`, { method: 'DELETE' }).then(r=>{ if(!r.ok) throw new Error('Delete failed'); return true }) }

export function listMembers(){ return get('members') }
export function createMember(body){ return post('members', body) }

export function listPRs(){ return get('prs') }
export function createPR(body){ return post('prs', body) }

export default { listTickets, createTicket, patchTicket, listMembers, createMember, listPRs, createPR }
