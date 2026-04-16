import { useState, useEffect } from 'react'
import { api } from './api'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import TodayPage from './pages/Today'
import PlanPage from './pages/Plan'
import FuturePlan from './pages/FuturePlan'
import NavBar from './components/NavBar'

export default function App() {
  const [profile, setProfile]     = useState(null)
  const [hasSetup, setHasSetup]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('dashboard')

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const p = await api.profile.get()
      setProfile(p)
      setHasSetup(p.setup_complete === true)
    } catch (err) {
      console.error('Init error:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSetupDone() {
    setHasSetup(true)
    init()
  }

  function handleNavigate(page) {
    setTab(page)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--sage)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--ink-soft)' }}>
          Loading Zeno...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!hasSetup) {
    return <Setup onDone={handleSetupDone} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', maxWidth: 440, margin: '0 auto', position: 'relative' }}>
      {tab === 'dashboard' && <Dashboard profile={profile} onNavigate={handleNavigate} />}
      {tab === 'today'     && <TodayPage />}
      {tab === 'plan'      && <PlanPage profile={profile} />}
      {tab === 'future'    && <FuturePlan />}
      <NavBar active={tab} onChange={setTab} />
    </div>
  )
}
