import { useState } from "react"
import api from "../services/api"

const SEV_STYLES = {
  critical: { color: "#ae2a19", bg: "#ffeceb", border: "#ae2a19" },
  high:     { color: "#c25700", bg: "#fff7d6", border: "#c25700" },
  medium:   { color: "#974f0c", bg: "#fff7d6", border: "#974f0c" },
  low:      { color: "#44546f", bg: "#f1f2f4", border: "#c5cace" },
  none:     { color: "#216e4e", bg: "#dffcf0", border: "#216e4e" },
}

const TYPE_LABEL = {
  overdue: "OVERDUE",
  blocker: "BLOCKED",
  dependency: "DEPENDENCY",
  unassigned: "UNASSIGNED",
  stale_prs: "STALE PRs",
  none: "OK",
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch(e) {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={copy}>{copied ? "Copied" : "Copy Report"}</button>
}

export default function RiskAnalysis() {
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function analyze() {
    setLoading(true); setError(null)
    try { const data = await api.riskAnalysis(); setResp(data) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function exportText() {
    if (!resp) return ""
    const lines = ["# Risk Analysis Report", "", resp.summary, "", "## Risks", ""]
    resp.risks.forEach((r, i) => {
      lines.push(`${i + 1}. [${(r.severity || "").toUpperCase()}] ${r.type?.toUpperCase()} — ${r.description}`)
    })
    return lines.join("\n")
  }

  const grouped = resp ? resp.risks.reduce((acc, r) => {
    const s = r.severity || "none"
    if (!acc[s]) acc[s] = []
    acc[s].push(r)
    return acc
  }, {}) : {}

  const sevOrder = ["critical","high","medium","low","none"]

  return (
    <div>
      <h2>Risk Analysis</h2>
      <div className="controls" style={{ justifyContent: "space-between" }}>
        <button className="btn primary" onClick={analyze} disabled={loading}>{loading ? "Analyzing..." : "Run Analysis"}</button>
        {resp && <CopyButton text={exportText()} />}
      </div>
      {error && <div className="card" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>{error}</div>}
      {resp ? (
        <div>
          <div className="card" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{resp.summary?.total ?? resp.risks?.length ?? 0} risks detected</div>
            <div style={{ display: "flex", gap: 8 }}>
              {sevOrder.map(s => {
                const count = (grouped[s] || []).length
                if (!count) return null
                const st = SEV_STYLES[s]
                return (
                  <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, color: st.color, background: st.bg, border: `1px solid ${st.border}30` }}>
                    {s.toUpperCase()}: {count}
                  </span>
                )
              })}
            </div>
          </div>
          {sevOrder.map(s => {
            const items = grouped[s] || []
            if (!items.length) return null
            const st = SEV_STYLES[s]
            return (
              <div key={s} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: st.color, letterSpacing: 1, marginBottom: 8 }}>{s} ({items.length})</div>
                {items.map((r, i) => (
                  <div key={i} style={{ padding: "10px 14px", marginBottom: 8, borderRadius: 6, background: st.bg, borderLeft: `3px solid ${st.color}` }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: st.color, color: "white" }}>
                        {TYPE_LABEL[r.type] || r.type}
                      </span>
                      {r.ticket && <span style={{ fontSize: 11, fontFamily: "monospace", color: st.color }}>{r.ticket}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--gray-800)", lineHeight: 1.5 }}>{r.description}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", color: "var(--gray-500)", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: 0 }}>Click "Run Analysis" to identify risks, blockers, and overdue items</p>
        </div>
      )}
    </div>
  )
}
