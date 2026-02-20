import { useState } from 'react'

function initials(name){
  if(!name) return ''
  return name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
}

export default function CompactTicket({ t, isBlocker=false, onDetails }){
  const [open, setOpen] = useState(false)
  return (
    <div style={{marginBottom:12}}>
      <div className="compact-row" style={{display:'flex', alignItems:'center', gap:12}}>
        <div className="ticket-key" style={{minWidth:72}}>{t.key}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600}}>{t.title}</div>
          <div className="small-meta">
            {t.assignee ? <span className="assignee-initials">{initials(t.assignee)}</span> : <span style={{color:'var(--gray-500)'}}>Unassigned</span>}
            {isBlocker && t.waiting_on && t.waiting_on.length ? <span style={{marginLeft:8, color:'var(--gray-600)'}}>waiting on {t.waiting_on.join(', ')}</span> : null}
          </div>
        </div>
        <button className="btn" style={{padding:'6px 10px'}} onClick={()=>setOpen(s=>!s)}>{open? 'Hide' : 'Details'}</button>
      </div>
      {open ? (
        <div style={{marginTop:8}}>
          <div className="ticket-card">
            <div style={{display:'flex', gap:12}}>
              <div className="ticket-key">{t.key}</div>
              <div style={{flex:1}}>
                <div className="ticket-title">{t.title}</div>
                {t.assignee && <div className="assignee-badge">{t.assignee}</div>}
                {t.waiting_on && t.waiting_on.length ? (
                  <div style={{marginTop:8, display:'flex', gap:8}}>{t.waiting_on.map(w => <div key={w} style={{padding:'4px 8px', background:'var(--gray-100)', borderRadius:4, fontSize:12}}>{w}</div>)}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
