import { useState } from "react"
import api from "../services/api"

const TONES = [
  { value: "client", label: "Client-Friendly", desc: "Professional, non-technical" },
  { value: "technical", label: "Technical", desc: "Detailed, developer-focused" },
  { value: "executive", label: "Executive", desc: "Concise, metrics-driven" },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(text) } catch(e) {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={copy}>{copied ? "Copied" : "Copy"}</button>
}

function ToneCard({ tone, content }) {
  const cfg = TONES.find(t => t.value === tone) || { label: tone }
  return (
    <div style={{ border: "1px solid var(--gray-200)", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
        <div><strong style={{ fontSize: 13 }}>{cfg.label}</strong><span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 8 }}>{cfg.desc}</span></div>
        {content && <CopyButton text={content} />}
      </div>
      <div style={{ padding: "14px 16px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 80 }}>
        {content || <span style={{ color: "var(--gray-400)" }}>Click Rewrite to generate</span>}
      </div>
    </div>
  )
}

export default function Rewriter() {
  const [tone, setTone] = useState("all")
  const [text, setText] = useState("")
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function rewrite() {
    setLoading(true); setError(null)
    try {
      const data = await api.rewriteSummary(tone, text)
      setResp(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function autofill() {
    try {
      const data = await api.weeklyClient()
      setText(data.overview || "")
    } catch (e) { alert("Could not load weekly report: " + e.message) }
  }

  return (
    <div>
      <h2>Audience Rewriter</h2>
      <p style={{ color: "var(--gray-500)", marginTop: -16, marginBottom: 20, fontSize: 13 }}>
        Transform the same update into different audience-appropriate tones.
      </p>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>Input Text</strong>
            <button className="btn" style={{ fontSize: 12, padding: "4px 10px" }} onClick={autofill}>Auto-fill from Weekly Report</button>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} style={{ width: "100%", minHeight: 110, resize: "vertical" }}
            placeholder="Paste your status update here, or click Auto-fill to load the latest weekly report..." />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Output Tone</strong>
            <select value={tone} onChange={e => setTone(e.target.value)} style={{ minWidth: 180 }}>
              <option value="all">All Three Tones</option>
              {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button className="btn primary" onClick={rewrite} disabled={loading}>{loading ? "Rewriting..." : "Rewrite"}</button>
        </div>
      </div>
      {error && <div className="card" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>{error}</div>}
      {resp && (
        <div>
          {resp.all_tones
            ? TONES.map(t => <ToneCard key={t.value} tone={t.value} content={resp.all_tones[t.value]?.rewritten_summary ?? resp.all_tones[t.value]} />)
            : <ToneCard tone={resp.tone} content={resp.rewritten_summary} />}
        </div>
      )}
    </div>
  )
}
