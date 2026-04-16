const TABS = [
  { id: 'dashboard', label: 'Home',
    icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill={a ? 'var(--sage)' : 'none'} stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  { id: 'today', label: 'Today',
    icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>{a && <line x1="8" y1="15" x2="16" y2="15" stroke="var(--sage)" strokeWidth="2"/>}</svg>
  },
  { id: 'plan', label: 'Modules',
    icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
  },
  { id: 'future', label: 'Plan',
    icon: (a) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h8M8 18h5"/></svg>
  },
]

export default function NavBar({ active, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(250,247,242,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border-soft)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
      maxWidth: 440,
      margin: '0 auto',
    }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 4, padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer',
          borderTop: `2px solid ${active === tab.id ? 'var(--sage)' : 'transparent'}`,
          transition: 'border-color 0.2s'
        }}>
          {tab.icon(active === tab.id)}
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', color: active === tab.id ? 'var(--sage)' : 'var(--ink-pale)' }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
