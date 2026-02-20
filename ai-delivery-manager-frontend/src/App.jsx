import { useState } from 'react'
import Standup from './components/Standup'
import WeeklyReport from './components/WeeklyReport'
import Rewriter from './components/Rewriter'
import RiskAnalysis from './components/RiskAnalysis'
import GenerateAll from './components/GenerateAll'
import TicketsPage from './pages/TicketsPage'
import MembersPage from './pages/MembersPage'
import PRsPage from './pages/PRsPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const NAV = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'divider1', label: '─── AI Reports ───', divider: true },
  { id: 'standup', label: '📋 Daily Standup' },
  { id: 'weekly', label: '📊 Weekly Report' },
  { id: 'rewrite', label: '✍️ Rewriter' },
  { id: 'risk', label: '⚠️ Risk Analysis' },
  { id: 'all', label: '⚡ Generate All' },
  { id: 'divider2', label: '─── Workboard ───', divider: true },
  { id: 'tickets', label: '🎫 Tickets' },
  { id: 'members', label: '👥 Members' },
  { id: 'prs', label: '🔀 Pull Requests' },
]

function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div style={{width:40,height:40,background:'#eef2ff',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <strong style={{color:'var(--accent,var(--primary))'}}>AI</strong>
          </div>
          <h1>AI Delivery Manager</h1>
        </div>

        {NAV.map(item =>
          item.divider ? (
            <div key={item.id} style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--gray-400)', letterSpacing: 1,
              padding: '12px 12px 4px', userSelect: 'none'
            }}>{item.label.replace(/─/g, '').trim()}</div>
          ) : (
            <button key={item.id}
              className={`nav-btn ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}>
              {item.label}
            </button>
          )
        )}
      </aside>

      <main className="main">
        {view === 'dashboard' && <DashboardPage />}
        {view === 'standup'   && <div className="card"><Standup /></div>}
        {view === 'weekly'    && <div className="card"><WeeklyReport /></div>}
        {view === 'rewrite'   && <div className="card"><Rewriter /></div>}
        {view === 'risk'      && <div className="card"><RiskAnalysis /></div>}
        {view === 'all'       && <div className="card"><GenerateAll /></div>}
        {view === 'tickets'   && <div className="card"><TicketsPage /></div>}
        {view === 'members'   && <div className="card"><MembersPage /></div>}
        {view === 'prs'       && <div className="card"><PRsPage /></div>}
      </main>
    </div>
  )
}

export default App
