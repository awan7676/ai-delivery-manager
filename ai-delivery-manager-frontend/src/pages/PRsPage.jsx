import { useEffect, useState } from 'react'
import workboard from '../services/workboard'

export default function PRsPage(){
  const [prs, setPRs] = useState([])
  const [title, setTitle] = useState('')
  const [repo, setRepo] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    const [p, m] = await Promise.all([workboard.listPRs(), workboard.listMembers()])
    setPRs(p); setMembers(m)
  }

  useEffect(()=>{ load() }, [])

  async function create(){
    setLoading(true)
    try{
      // client-side validation
      if(!title || !title.trim()){
        throw new Error(JSON.stringify({ title: ['Title is required'] }))
      }
      await workboard.createPR({ title: title.trim(), repo, author: authorId })
      setTitle(''); setRepo(''); setAuthorId('')
      await load()
    }catch(e){
      let msg = e.message || String(e)
      try{ const parsed = JSON.parse(msg); const parts = []; for(const k of Object.keys(parsed)){ const v = parsed[k]; parts.push(Array.isArray(v)? `${k}: ${v.join(', ')}` : `${k}: ${String(v)}`) } msg = parts.join('\n') }catch(err){}
      alert(msg)
    }finally{ setLoading(false) }
  }

  return (
    <div>
      <h2>Pull Requests</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Create Pull Request</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input placeholder="Repo" value={repo} onChange={e=>setRepo(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <select value={authorId} onChange={e=>setAuthorId(e.target.value)}>
            <option value="">Author</option>
            {members.map(m=> <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button className="btn primary" onClick={create} disabled={loading}>{loading? 'Creating...' : 'Create PR'}</button>
        </div>
      </div>

      <div>
        {prs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: 'var(--gray-500)', margin: 0 }}>No pull requests yet</p>
          </div>
        ) : (
          prs.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <div className="compact-row" style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{minWidth:72}}>{p.repo}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600}}>{p.title}</div>
                  <div className="small-meta">
                    <span className={`status-badge ${p.status}`}>{p.status}</span>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  {p.author ? <div className="assignee-initials">{(p.author.name||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div> : <div style={{color:'var(--gray-500)'}}>—</div>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
