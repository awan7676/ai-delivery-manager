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

function ProgressBar({ pct }) {
  const color = pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--primary)" : "var(--warning)"
  return (
    <div style={{ background: "var(--gray-200)", borderRadius: 999, height: 12, overflow: "hidden", margin: "8px 0" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.8s" }} />
    </div>
  )
}

const STATUS_DOT = { DONE:"var(--success)", IN_PROGRESS:"var(--primary)", BLOCKED:"var(--danger)", TODO:"var(--gray-400)", IN_REVIEW:"var(--warning)" }

export default function WeeklyReport(){
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate(){
    setLoading(true); setError(null)
    try { const data = await api.weeklyClient(); setResp(data) }
    catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{
    const handler = () => generate()
    window.addEventListener("reports:refresh", handler)
    return ()=> window.removeEventListener("reports:refresh", handler)
  }, [])

  function exportMarkdown() {
    if (!resp) return ""
    const lines = ["# Weekly Client Report", "", resp.overview || "", "", `**Progress:** ${resp.progress}`, "", "## Milestones Completed"]
    ;(resp.milestones || []).forEach(m => lines.push("- " + m))
    lines.push("", "## Risks & Blockers")
    if (resp.risks?.length) resp.risks.forEach(r => lines.push("- " + r))
    else lines.push("No risks detected")
    return lines.join("\n")
  }

  return (
    <div>
      <h2>Weekly Client Report</h2>
      <div className="controls">
        <button className="btn primary" onClick={generate} disabled={loading}>{loading? "Generating..." : "Generate Report"}</button>
        {resp && <CopyButton getText={exportMarkdown} />}
      </div>

      {error && <div className="card" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>{error}</div>}

      {resp ? (
        <div>
          <div className="card">
            <div className="field"><strong>Overview</strong><div style={{marginTop:4, lineHeight:1.6}}>{resp.overview}</div></div>
            <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid var(--gray-200)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <strong>Overall Progress</strong>
                <span style={{fontSize:22, fontWeight:800, color:"var(--primary)"}}>{resp.progress}</span>
              </div>
              <ProgressBar pct={resp.progress_pct || parseInt(resp.progress) || 0} />
              {resp.stats && (
                <div style={{display:"flex", gap:16, marginTop:8, flexWrap:"wrap"}}>
                  {[["Done",resp.stats.done,"var(--success)"],["In Progress",resp.stats.in_progress,"var(--primary)"],["Blocked",resp.stats.blocked,"var(--danger)"],["To Do",resp.stats.todo,"var(--gray-400)"]].map(([l,v,c])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
                      <strong>{v}</strong> {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {resp.milestones?.length > 0 && (
            <div className="card">
              <div className="field"><strong>Milestones Completed</strong>
                <ul style={{margin:"8px 0 0", paddingLeft:20}}>
                  {resp.milestones.map((m, i) => <li key={i} style={{marginBottom:4, color:"var(--success)"}}>{m}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="card">
            <div className="field"><strong>Risks & Blockers</strong>
              {(resp.risks || []).length === 0 ? (
                <div style={{color:"var(--success)", marginTop:6}}>No risks detected — project is on track</div>
              ) : (
                <ul style={{margin:"8px 0 0", paddingLeft:20}}>
                  {resp.risks.map((r,i)=><li key={i} style={{color:"var(--danger)",marginBottom:4}}>{r}</li>)}
                </ul>
              )}
            </div>
          </div>

          {resp.details?.tickets?.length > 0 && (
            <div className="card">
              <div className="field"><strong>All Tickets</strong>
                <div style={{marginTop:8}}>
                  {resp.details.tickets.map(t=>(
                    <div key={t.key} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid var(--gray-100)"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:STATUS_DOT[t.status]||"var(--gray-300)",flexShrink:0}}/>
                      <span className="ticket-key" style={{minWidth:72,fontSize:11}}>{t.key}</span>
                      <span style={{flex:1,fontSize:12,fontWeight:500}}>{t.title}</span>
                      <span style={{fontSize:11,color:"var(--gray-500)"}}>{t.status?.replace("_"," ")}</span>
                      <span style={{fontSize:11,color:"var(--gray-400)"}}>{t.assignee || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", color: "var(--gray-500)", padding: 40 }}>
          <div style={{fontSize:32,marginBottom:12}}>📊</div>
          <p style={{margin:0}}>Click "Generate Report" to see this week's summary</p>
        </div>
      )}
    </div>
  )
}
