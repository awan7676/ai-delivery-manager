import { useEffect, useState } from 'react'
import workboard from '../services/workboard'

export default function MembersPage(){
  const [members, setMembers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(){
    const m = await workboard.listMembers()
    setMembers(m)
  }

  useEffect(()=>{ load() }, [])

  async function create(){
    setLoading(true)
    try{
      await workboard.createMember({ name, email, role })
      setName(''); setEmail(''); setRole('')
      await load()
    }catch(e){ alert('Error: '+e.message) }
    finally{ setLoading(false) }
  }

  return (
    <div>
      <h2>Members</h2>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Add Member</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Role" value={role} onChange={e=>setRole(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={create} disabled={loading}>{loading? 'Adding...' : 'Add Member'}</button>
        </div>
      </div>

      <div>
        {members.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: 'var(--gray-500)', margin: 0 }}>No members yet</p>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <div className="compact-row" style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{minWidth:72}}>
                  <div className="assignee-initials">{(m.name||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{m.name}</div>
                  <div style={{color:'var(--gray-500)'}}>{m.email}</div>
                </div>
                <div className="assignee-badge">{m.role || 'Member'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
