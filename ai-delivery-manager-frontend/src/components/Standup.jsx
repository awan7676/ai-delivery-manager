import { useState, useEffect } from "react"
import api from "../services/api"

function initials(name){
  if(!name) return ""
  return name.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase()
}

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(getText()) } catch(e) {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className="btn" style={{ padding: "4px 12px", fontSize: 12 }} onClick={copy}>
      {copied ? "Copied!" : "Copy as Markdown"}
    </button>
  )
}

export default function Standup() {
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  async function generate() {
    setLoading(true); setError(null)
    try { const data = await api.dailyStandup(); setResp(data) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(()=>{
    const handler = () => generate()
    window.addEventListener("reports:refresh", handler)
    return ()=> window.removeEventListener("reports:refresh", handler)
  }, [])

  function toggle(key){ setExpanded(prev => ({...prev, [key]: !prev[key]})) }

  function exportMarkdown() {
    if (!resp) return ""
    const s = resp.summary || {}
    const todayLines = resp.details?.today_items?.length
      ? resp.details.today_items.map(t => `- ${t.key}: ${t.title}${t.assignee ? ` (${t.assignee})` : ""}`).join("\n")
      : (s.today || "None")
    const blockerLines = resp.details?.blockers?.length
      ? resp.details.blockers.map(b => `- ${b.key}: ${b.title}${b.waiting_on?.length ? ` [waiting on ${b.waiting_on.join(", ")}]` : ""}`).join("\n")
      : (s.blockers || "None")
    return `# Daily Standup\n\n**Yesterday:** ${s.yesterday || "N/A"}\n\n**Today:**\n${todayLines}\n\n**Blockers:**\n${blockerLines}`
  }

  return (
    <div>
      <h2>Daily Standup</h2>
      <div className="controls">
        <button className="btn primary" onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate Report"}
        </button>
        {resp && <CopyButton getText={exportMarkdown} />}
      </div>

      {error && <div className="card" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>{error}</div>}

      {resp ? (
        <div>
          <div className="card">
            <div className="field">
              <strong>Yesterday</strong>
              <div className="compact-row">{resp.summary?.yesterday}</div>
            </div>

            <div className="field">
              <strong>Today</strong>
              <div>
                {resp.details?.today_items?.length ? (
                  resp.details.today_items.map((t) => (
                    <div key={t.key} style={{marginBottom:8}}>
                      <div className="compact-row" style={{display: "flex", alignItems: "center", gap:12}}>
                        <div className="ticket-key" style={{minWidth:72}}>{t.key}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600}}>{t.title}</div>
                          <div className="small-meta">
                            {t.assignee ? <span className="assignee-initials">{initials(t.assignee)}</span> : <span style={{color:"var(--gray-500)"}}>Unassigned</span>}
                            {t.priority && <span style={{marginLeft:8,fontSize:10,color:"var(--gray-500)"}}>{t.priority}</span>}
                          </div>
                        </div>
                        <button className="btn" style={{padding:"6px 10px"}} onClick={()=>toggle(t.key)}>{expanded[t.key]? "Hide" : "Details"}</button>
                      </div>
                      {expanded[t.key] && (
                        <div style={{marginTop:8}}>
                          <div className="ticket-card">
                            <div className="ticket-key">{t.key}</div>
                            <div className="ticket-title" style={{marginTop:4}}>{t.title}</div>
                            {t.assignee && <div className="assignee-badge" style={{marginTop:6}}>{t.assignee}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : <div className="compact-row">{resp.summary?.today}</div>}
              </div>
            </div>

            <div className="field">
              <strong>Blockers</strong>
              <div>
                {resp.details?.blockers?.length ? (
                  resp.details.blockers.map((b) => (
                    <div key={b.key} style={{marginBottom:8}}>
                      <div className="compact-row" style={{display:"flex", alignItems:"center", gap:12}}>
                        <div className="ticket-key" style={{minWidth:72, background:"var(--danger)", color:"white"}}>{b.key}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600}}>{b.title}</div>
                          <div className="small-meta">
                            {b.assignee ? <span className="assignee-initials">{initials(b.assignee)}</span> : <span style={{color:"var(--gray-500)"}}>Unassigned</span>}
                            {b.waiting_on?.length ? <span style={{marginLeft:8, color:"var(--danger)", fontSize:11}}>waiting on {b.waiting_on.join(", ")}</span> : null}
                          </div>
                        </div>
                        <button className="btn" style={{padding:"6px 10px"}} onClick={()=>toggle(b.key)}>{expanded[b.key]? "Hide" : "Details"}</button>
                      </div>
                      {expanded[b.key] && (
                        <div style={{marginTop:8}}>
                          <div className="ticket-card" style={{borderLeft:"3px solid var(--danger)"}}>
                            <div className="ticket-key">{b.key}</div>
                            <div className="ticket-title" style={{marginTop:4}}>{b.title}</div>
                            {b.assignee && <div className="assignee-badge" style={{marginTop:6}}>{b.assignee}</div>}
                            {b.waiting_on?.length ? (
                              <div style={{marginTop:8, display:"flex", gap:8}}>
                                {b.waiting_on.map(w => <span key={w} style={{padding:"3px 8px", background:"var(--gray-100)", borderRadius:4, fontSize:11}}>{w}</span>)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="compact-row" style={{color: resp.summary?.blockers === "None" ? "var(--success)" : "inherit"}}>
                    {resp.summary?.blockers}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", color: "var(--gray-500)", padding: 40 }}>
          <div style={{fontSize:32, marginBottom:12}}>📋</div>
          <p style={{margin:0}}>Click "Generate Report" to see today's standup</p>
        </div>
      )}
    </div>
  )
}
