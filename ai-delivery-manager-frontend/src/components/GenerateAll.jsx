import { useState } from 'react'
import api from '../services/api'

export default function GenerateAll(){
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function runAll(){
    setLoading(true)
    setError(null)
    try{
      const daily = await api.dailyStandup()
      const weekly = await api.weeklyClient()
      const risks = await api.riskAnalysis()
      setReport({ daily, weekly, risks })
    }catch(e){
      setError(e.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Generate All Reports</h2>
      <div className="controls"><button className="btn primary" onClick={runAll} disabled={loading}>{loading ? 'Running...' : 'Generate All'}</button></div>
      {error && <div className="card" style={{ backgroundColor: 'var(--danger-light)', borderLeft: '4px solid var(--danger)', color: 'var(--danger)' }}>{error}</div>}
      {report ? (
        <div style={{ marginTop: 12 }}>
          <div className="card">
            <h3 style={{ margin: 0, fontSize: 14 }}>Daily Standup</h3>
            <div className="field" style={{ marginTop: 8 }}>
              <div><strong>Yesterday:</strong> {report.daily?.summary?.yesterday}</div>
              <div><strong>Today:</strong></div>
              <div>
                {report.daily?.details?.today_items?.length ? (
                  report.daily.details.today_items.map(t => (
                    <div key={t.key} className="compact-row" style={{marginBottom:8}}>
                      <div className="ticket-key" style={{minWidth:72}}>{t.key}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{t.title}</div>
                        <div className="small-meta">{t.assignee ? <span className="assignee-initials">{(t.assignee||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</span> : <span style={{color:'var(--gray-500)'}}>Unassigned</span>}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>{report.daily?.summary?.today}</div>
                )}
              </div>
              <div style={{marginTop:8}}><strong>Blockers:</strong></div>
              <div>
                {report.daily?.details?.blockers?.length ? (
                  report.daily.details.blockers.map(b => (
                    <div key={b.key} className="compact-row" style={{marginBottom:8}}>
                      <div className="ticket-key" style={{minWidth:72}}>{b.key}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{b.title}</div>
                        <div className="small-meta">{b.assignee ? <span className="assignee-initials">{(b.assignee||'').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</span> : <span style={{color:'var(--gray-500)'}}>Unassigned</span>} {b.waiting_on && b.waiting_on.length ? <span style={{marginLeft:8, color:'var(--gray-600)'}}>waiting on {b.waiting_on.join(', ')}</span> : null}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>{report.daily?.summary?.blockers}</div>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ margin: 0, fontSize: 14 }}>Weekly</h3>
            <div className="field" style={{ marginTop: 8 }}>
              <div><strong>Overview:</strong> {report.weekly?.overview}</div>
              <div><strong>Progress:</strong> {report.weekly?.progress}</div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ margin: 0, fontSize: 14 }}>Risks</h3>
            <div className="field" style={{ marginTop: 8 }}>
              <ul>{(report.risks?.risks || []).map((r, i) => <li key={i}><strong>{r.type}:</strong> {r.description}</li>)}</ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 12, textAlign: 'center', padding: 32 }}>
          <div style={{ color: 'var(--gray-500)' }}>No combined report yet</div>
        </div>
      )}
    </div>
  )
}
