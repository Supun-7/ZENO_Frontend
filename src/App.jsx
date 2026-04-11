import { useState, useEffect } from 'react'
import useAuth from './store/auth'
import AuthPage from './pages/Auth'
import Onboarding from './pages/Onboarding'
import ModulesPage from './pages/Modules'
import TodayPage from './pages/Today'
import StatsPage from './pages/Stats'
import TabBar from './components/TabBar'
import { api } from './api'

export default function App() {
  const { user, profile, token, loading, init } = useAuth()
  const [tab, setTab]               = useState('today')
  const [hasModules, setHasModules] = useState(null)

  useEffect(() => { init() }, [])

  // Once logged in, check if user has set up modules
  useEffect(() => {
    if (user && profile !== undefined) {
      api.modules.list()
        .then(mods => setHasModules(mods.length > 0))
        .catch(() => setHasModules(false))
    }
  }, [user])

  if (loading || (user && hasModules === null)) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#333', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (!hasModules) return <Onboarding onDone={() => setHasModules(true)} />

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {tab === 'modules' && <ModulesPage />}
      {tab === 'today'   && <TodayPage />}
      {tab === 'stats'   && <StatsPage />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
