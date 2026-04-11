const TABS = [
  {
    id: 'modules', label: 'MODULES',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#00ff88' : '#444'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    id: 'today', label: 'TODAY',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#00ff88' : '#444'} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="1"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    id: 'stats', label: 'STATS',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#00ff88' : '#444'} strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
]

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#000000',
      borderTop: '1px solid #1a1a1a',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
      maxWidth: 480,
      margin: '0 auto',
    }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4,
          padding: '10px 0 8px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderTop: `2px solid ${active === tab.id ? '#00ff88' : 'transparent'}`,
        }}>
          {tab.icon(active === tab.id)}
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '1px',
            color: active === tab.id ? '#00ff88' : '#444'
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
