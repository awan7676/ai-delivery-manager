import { useEffect, useState } from 'react'
import workboard from '../services/workboard'

export default function TicketsPage(){
  const [tickets, setTickets] = useState([])
  const [members, setMembers] = useState([])
  const [filterAssignee, setFilterAssignee] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [assignee, setAssignee] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [loading, setLoading] = useState(false)

  async function load(){
    const [m] = await Promise.all([workboard.listMembers()])
    setMembers(m)
    const t = await workboard.listTickets({ assignee: filterAssignee })
    setTickets(t)
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{ load() }, [filterAssignee])

  async function create(){
    setLoading(true)
    try{
      // client-side validation
      if(!title || !title.trim()){
        throw new Error(JSON.stringify({ title: ['Title is required'] }))
      }
      await workboard.createTicket({ title: title.trim(), description: desc, assignee })
      setTitle(''); setDesc(''); setAssignee('')
      await load()
      window.dispatchEvent(new Event('reports:refresh'))
    }catch(e){
      // try to parse structured validation errors from server
      let msg = e.message || String(e)
      try{
        const parsed = JSON.parse(msg)
        const parts = []
        for(const k of Object.keys(parsed)){
          const v = parsed[k]
          if(Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
          else parts.push(`${k}: ${String(v)}`)
        }
        msg = parts.join('\n')
      }catch(err){ /* not JSON, keep message */ }
      alert(msg)
    }finally{ setLoading(false) }
  }

  function startEdit(t){
    setEditingId(t.id)
    setEditingData({ title: t.title || '', description: t.description || '', status: t.status || '', assignee: t.assignee?.id || '' })
  }

  async function saveEdit(){
    try{
      await workboard.patchTicket(editingId, editingData)
      setEditingId(null)
      setEditingData({})
      await load()
      window.dispatchEvent(new Event('reports:refresh'))
    }catch(e){ alert('Save error: '+e.message) }
  }

  async function removeTicket(id){
    if(!confirm('Delete this ticket?')) return
    try{
      await workboard.deleteTicket(id)
      await load()
      window.dispatchEvent(new Event('reports:refresh'))
    }catch(e){ alert('Delete error: '+e.message) }
  }

  return (
    <div>
      <h2>Tickets</h2>
      
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 600 }}>Create New Ticket</h3>
        <div>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} style={{ marginBottom: 12, display: 'block', width: '100%' }} />
          <textarea placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} style={{ marginBottom: 12, display: 'block', width: '100%', minHeight: 80 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <select value={assignee} onChange={e=>setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <button className="btn primary" onClick={create} disabled={loading}>{loading ? 'Creating...' : 'Create Ticket'}</button>
        </div>
      </div>
      
      <div className="filter-group">
        <strong>Filter by Member</strong>
        <select value={filterAssignee} onChange={e=>setFilterAssignee(e.target.value)}>
          <option value="">All members</option>
          {members.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      
      <div>
        {tickets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: 'var(--gray-500)', margin: 0 }}>No tickets found</p>
          </div>
        ) : (
          tickets.map(t => (
            <div key={t.id}>
              {editingId === t.id ? (
                <div className="ticket-card">
                  <div className="ticket-edit-form">
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>Title</strong>
                      <input placeholder="Title" value={editingData.title} onChange={e=>setEditingData({...editingData, title:e.target.value})} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4 }}>Description</strong>
                      <textarea placeholder="Description" value={editingData.description} onChange={e=>setEditingData({...editingData, description:e.target.value})} style={{ width: '100%', minHeight: 60 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 4 }}>Assignee</strong>
                        <select value={editingData.assignee} onChange={e=>setEditingData({...editingData, assignee:e.target.value})} style={{ width: '100%' }}>
                          <option value="">Unassigned</option>
                          {members.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: 4 }}>Status</strong>
                        <select value={editingData.status} onChange={e=>setEditingData({...editingData, status:e.target.value})} style={{ width: '100%' }}>
                          <option>TODO</option>
                          <option>IN_PROGRESS</option>
                          <option>DONE</option>
                          <option>BLOCKED</option>
                        </select>
                      </div>
                    </div>
                    <div className="ticket-actions">
                      <button className="btn" onClick={()=>setEditingId(null)}>Cancel</button>
                      <button className="btn primary" onClick={saveEdit}>Save Changes</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <div className="compact-row" style={{display:'flex', alignItems:'center', gap:12}}>
                    <div className="ticket-key" style={{minWidth:72}}>{t.key}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600}}>{t.title}</div>
                      <div className="small-meta">
                        {t.assignee ? <span className="assignee-initials">{(t.assignee.name || '').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</span> : <span style={{color:'var(--gray-500)'}}>Unassigned</span>}
                        {t.prs?.length > 0 && <span style={{marginLeft:8, color:'var(--gray-600)'}}>🔗 {t.prs.length} PR{t.prs.length !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8}}>
                      <button className="btn" onClick={()=>startEdit(t)}>✏️</button>
                      <button className="btn" onClick={()=>removeTicket(t.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
