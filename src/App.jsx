import { useState, useEffect } from 'react'
import { api } from './api'
import Setup from './pages/Setup'
import TodayPage from './pages/Today'
import ModulesPage from './pages/Modules'
import StatsPage from './pages/Stats'
import TabBar from './components/TabBar'

export default function App() {
  const [profile, setProfile]       = useState(null)
  const [hasModules, setHasModules] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('today')

  useEffect(() => { init() }, [])

  async function init() {
    try {
      // This creates the profile row if it doesn't exist yet
      const p = await api.profile.get()
      setProfile(p)

      // Check if modules have been set up
      const mods = await api.modules.list()
      setHasModules(mods.length > 0)
    } catch (err) {
      console.error('Init error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#00ff88', letterSpacing: '3px' }}>
          STUDYOS
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#333', letterSpacing: '2px' }}>
          INITIALIZING...
        </div>
      </div>
    )
  }

  // First time — run setup
  if (!hasModules) {
    return <Setup onDone={() => { setHasModules(true); init() }} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      {tab === 'today'   && <TodayPage   profile={profile} />}
      {tab === 'modules' && <ModulesPage profile={profile} />}
      {tab === 'stats'   && <StatsPage />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
