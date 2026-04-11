const tabs = [
  { id: 'modules', label: 'Modules', path: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'today',   label: 'Today',   path: 'M3 4h18v2H3zM3 10h18v2H3zM3 16h18v2H3z' },
  { id: 'stats',   label: 'Stats',   path: 'M18 20V10M12 20V4M6 20v-6' },
]

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#0a0a0a', borderTop: '1px solid #1a1a1a',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
      maxWidth: 480, margin: '0 auto'
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={active === tab.id ? '#7C6FE0' : '#444'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={tab.path}/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', color: active === tab.id ? '#7C6FE0' : '#444' }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
