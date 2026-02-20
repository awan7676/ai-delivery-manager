import { useState, useEffect } from "react"
import api from "../services/api"

const HEALTH_CONFIG = {
  on_track:        { label: "On Track",        color: "var(--success)", bg: "var(--success-light)",  icon: "✅" },
  needs_attention: { label: "Needs Attention",  color: "var(--warning)", bg: "var(--warning-light)",  icon: "⚠️" },
  at_risk:         { label: "At Risk",          color: "var(--danger)",  bg: "var(--danger-light)",   icon: "🚨" },
  unknown:         { label: "Unknown",          color: "var(--gray-500)", bg: "var(--gray-100)",      icon: "❓" },
}

const SEV_COLOR = {
  critical: "#ae2a19",
  high:     "#c25700",
  medium:   "#974f0c",
  low:      "#44546f",
}

function ProgressBar({ pct }) {
  const color = pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--primary)" : "var(--warning)"
  return (
    <div style={{ background: "var(--gray-200)", borderRadius: 999, height: 14, overflow: "hidden", margin: "10px 0 4px" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 1s ease" }} />
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "var(--primary)" }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gray-900)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{sub}</div>}
    </div>
  )
}

function StatusBar({ data }) {
  if (!data) return null
  const total = data.total_tickets || 1
  const segments = [
    { key: "done",        label: "Done",        val: data.done,        color: "var(--success)" },
    { key: "in_progress", label: "In Progress",  val: data.in_progress, color: "var(--primary)" },
    { key: "blocked",     label: "Blocked",      val: data.blocked,     color: "var(--danger)" },
    { key: "todo",        label: "To Do",        val: data.todo,        color: "var(--gray-400)" },
  ]
  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, margin: "12px 0 8px" }}>
        {segments.map(s => s.val > 0 && (
          <div key={s.key} style={{ flex: s.val, background: s.color, borderRadius: 999, minWidth: 4 }} title={`${s.label}: ${s.val}`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {segments.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            <strong>{s.val}</strong>&nbsp;{s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try { setData(await api.dashboardStats()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ textAlign: "center", padding: 80, color: "var(--gray-500)" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <p>Loading dashboard…</p>
    </div>
  )

  if (error) return (
    <div className="card" style={{ backgroundColor: "var(--danger-light)", borderLeft: "4px solid var(--danger)", color: "var(--danger)" }}>
      <strong>Failed to load dashboard:</strong> {error}
      <button className="btn" style={{ marginLeft: 16 }} onClick={load}>Retry</button>
    </div>
  )

  if (!data) return null

  const health = HEALTH_CONFIG[data.health] || HEALTH_CONFIG.unknown

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Project Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>Alpha Squad — live snapshot from workboard</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "8px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13,
            color: health.color, background: health.bg, border: `1px solid ${health.color}30`
          }}>{health.icon} {health.label}</span>
          <button className="btn" onClick={load} style={{ fontSize: 12 }}>↻ Refresh</button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: 15 }}>Overall Progress</strong>
          <span style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)" }}>{data.progress_percent}%</span>
        </div>
        <ProgressBar pct={data.progress_percent} />
        <StatusBar data={data} />
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16, marginBottom: 20 }}>
        <StatCard label="Total Tickets"   value={data.total_tickets}  sub={`${data.done} done`} />
        <StatCard label="Overdue"         value={data.overdue_tickets} color="var(--danger)" sub="need immediate action" />
        <StatCard label="Blocked"         value={data.blocked}         color={data.blocked > 0 ? "var(--danger)" : "var(--success)"} sub="tickets blocked" />
        <StatCard label="Open PRs"        value={data.open_prs}        sub={`${data.merged_prs} merged`} />
        <StatCard label="Team Members"    value={data.total_members}   color="var(--gray-600)" sub="active contributors" />
        <StatCard label="In Progress"     value={data.in_progress}     color="var(--primary)" sub="being worked on" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Top Risks */}
        <div className="card">
          <strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>⚠️ Top Risks</strong>
          {data.top_risks?.length === 0 ? (
            <div style={{ color: "var(--success)", fontSize: 13 }}>No risks detected — looking good!</div>
          ) : (
            data.top_risks?.map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0",
                borderBottom: i < data.top_risks.length - 1 ? "1px solid var(--gray-100)" : "none"
              }}>
                <div style={{
                  minWidth: 6, height: 6, borderRadius: "50%", marginTop: 5,
                  background: SEV_COLOR[r.severity] || "var(--gray-400)", flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                      background: SEV_COLOR[r.severity] || "#ccc", color: "white"
                    }}>{r.type?.toUpperCase()}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--primary)" }}>{r.key}</span>
                    <span style={{ fontSize: 11, color: "var(--gray-500)", marginLeft: "auto" }}>{r.detail}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                  {r.assignee && <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 1 }}>{r.assignee}</div>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>🔀 Recent Pull Requests</strong>
          {data.recent_activity?.length === 0 ? (
            <div style={{ color: "var(--gray-500)", fontSize: 13 }}>No recent activity</div>
          ) : (
            data.recent_activity?.map((a, i) => {
              const statusColor = a.status === "Merged" ? "var(--success)" : a.status === "Open" ? "var(--primary)" : "var(--gray-400)"
              return (
                <div key={i} style={{
                  padding: "8px 0",
                  borderBottom: i < data.recent_activity.length - 1 ? "1px solid var(--gray-100)" : "none"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>{a.author} · {a.date}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                      color: statusColor, border: `1px solid ${statusColor}50`, flexShrink: 0
                    }}>{a.status}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
