const TABS = [
  { id:'dashboard', label:'Home',
    icon:(a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'var(--sage)' : 'none'} stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  { id:'today', label:'Today',
    icon:(a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        {a && <polyline points="8 15 11 18 16 13" stroke="var(--sage)" strokeWidth="2"/>}
      </svg>
    )
  },
  { id:'plan', label:'Modules',
    icon:(a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        {a && <line x1="9" y1="9" x2="15" y2="9" stroke="var(--sage)" strokeWidth="2"/>}
        {a && <line x1="9" y1="13" x2="13" y2="13" stroke="var(--sage)" strokeWidth="2"/>}
      </svg>
    )
  },
  { id:'future', label:'Plan',
    icon:(a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? 'var(--sage)' : 'var(--ink-pale)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h8M8 18h5"/>
      </svg>
    )
  },
]

export default function NavBar({ active, onChange }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0,
      background:'rgba(250,248,244,0.96)',
      backdropFilter:'blur(16px)',
      WebkitBackdropFilter:'blur(16px)',
      borderTop:'1px solid var(--border-soft)',
      display:'flex',
      paddingBottom:'env(safe-area-inset-bottom)',
      zIndex:100,
      maxWidth:440,
      margin:'0 auto',
      boxShadow:'0 -4px 20px rgba(26,22,15,0.06)',
    }}>
      {TABS.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center',
          gap:4, padding:'10px 0 9px', background:'none', border:'none', cursor:'pointer',
          position:'relative', transition:'all 0.2s',
        }}>
          {/* Active indicator */}
          <div style={{
            position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
            width:active === tab.id ? 28 : 0, height:2,
            background:'var(--sage)', borderRadius:'0 0 3px 3px',
            transition:'width 0.25s cubic-bezier(.4,0,.2,1)',
          }} />
          <div style={{ transform: active === tab.id ? 'translateY(-1px)' : 'translateY(0)', transition:'transform 0.2s' }}>
            {tab.icon(active === tab.id)}
          </div>
          <span style={{
            fontSize:10, fontWeight:700, letterSpacing:'0.3px',
            color: active === tab.id ? 'var(--sage)' : 'var(--ink-pale)',
            transition:'color 0.2s',
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
