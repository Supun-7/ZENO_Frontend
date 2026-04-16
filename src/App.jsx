import { useState, useEffect } from 'react'
import { api } from './api'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import TodayPage from './pages/Today'
import PlanPage from './pages/Plan'
import FuturePlan from './pages/FuturePlan'
import NavBar from './components/NavBar'

function Spinner({ label = 'Loading Zeno...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--sage)',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <p style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 16,
        color: 'var(--ink-soft)',
        fontWeight: 400
      }}>
        {label}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('zeno_auth') === '1')
  const [profile, setProfile] = useState(null)
  const [hasSetup, setHasSetup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (authed) {
      init()
    } else {
      setLoading(false)
    }
  }, [authed])

  async function init() {
    setLoading(true)
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

  function handleLogin() {
    setAuthed(true)
  }

  function handleSetupDone() {
    setHasSetup(true)
    init()
  }

  if (!authed) return <Login onLogin={handleLogin} />
  if (loading) return <Spinner />

  if (!hasSetup) {
    return <Setup onDone={handleSetupDone} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      maxWidth: 440,
      margin: '0 auto',
      position: 'relative'
    }}>
      {tab === 'dashboard' && <Dashboard profile={profile} onNavigate={setTab} />}
      {tab === 'today' && <TodayPage />}
      {tab === 'plan' && <PlanPage profile={profile} />}
      {tab === 'future' && <FuturePlan />}
      <NavBar active={tab} onChange={setTab} />
    </div>
  )
}