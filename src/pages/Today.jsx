import { useState, useEffect } from 'react'
import { format, isPast } from 'date-fns'
import { api } from '../api'

const SLOT_DEFS = [
  { key:'M1', period:'MORNING', label:'Block 01', dur:120 },
  { key:'M2', period:'MORNING', label:'Block 02', dur:120 },
  { key:'E1', period:'EVENING', label:'Block 03', dur:60  },
  { key:'E2', period:'EVENING', label:'Block 04', dur:60  },
  { key:'E3', period:'EVENING', label:'Block 05', dur:30  },
  { key:'N1', period:'NIGHT',   label:'Block 06', dur:150 },
]

function getSlotTime(key, wakeHour) {
  const p = n => String(n).padStart(2,'0')
  const t = {
    M1:[wakeHour,0,wakeHour+2,0], M2:[wakeHour+2,15,wakeHour+4,15],
    E1:[16,0,17,0], E2:[17,15,18,15], E3:[18,30,19,0], N1:[20,30,23,0]
  }
  const [sh,sm,eh,em] = t[key]
  return `${p(sh)}:${p(sm)} — ${p(eh)}:${p(em)}`
}

function isPastSlot(key, wakeHour) {
  const endMap = {
    M1:[wakeHour+2,0], M2:[wakeHour+4,15],
    E1:[17,0], E2:[18,15], E3:[19,0], N1:[23,0]
  }
  const [eh,em] = endMap[key]
  const end = new Date()
  end.setHours(eh,em,0,0)
  return isPast(end)
}

function SlotCard({ def, slot, modules, wakeHour, onAssign, onComplete, onMiss }) {
  const [showAssign, setShowAssign]     = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [summary, setSummary]           = useState('')
  const [grading, setGrading]           = useState(false)

  const mod    = modules.find(m => m.id === slot?.module_id)
  const past   = isPastSlot(def.key, wakeHour)
  const status = slot?.status || 'empty'
  const accentColor = status==='done' ? '#00ff88' : status==='missed' ? '#ff3b3b' : mod?.color || '#2e2e2e'

  async function handleComplete() {
    if (!summary.trim()) return
    setGrading(true)
    try {
      const result = await api.sessions.complete({ slotId: slot.id, summary })
      onComplete(result)
      setShowComplete(false)
      setSummary('')
    } catch(err) { alert(err.message) }
    finally { setGrading(false) }
  }

  const scoreColor = s => s >= 80 ? '#00ff88' : s >= 65 ? '#ffaa00' : '#ff3b3b'

  return (
    <div style={{
      background:'var(--bg1)', borderRadius:6, marginBottom:6,
      border:`1px solid ${accentColor}33`,
      borderLeft:`2px solid ${accentColor}`,
      overflow:'hidden'
    }}>
      <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flexShrink:0 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)', marginBottom:1 }}>{def.key}</div>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)' }}>{def.dur}m</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2, fontFamily:'JetBrains Mono, monospace' }}>
            {getSlotTime(def.key, wakeHour)}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color: accentColor, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {mod ? mod.name : status==='missed' ? 'MISSED' : status==='empty' && past ? 'UNASSIGNED' : '— unassigned —'}
          </div>
          {status==='done' && slot.session && (
            <div style={{ fontSize:11, color:'var(--green)', marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>
              ✓ {slot.session.efficiency_label} [{slot.session.efficiency_score}]
            </div>
          )}
          {status==='missed' && (
            <div style={{ fontSize:11, color:'var(--red)', marginTop:2, fontFamily:'JetBrains Mono, monospace' }}>✕ LOGGED AS MISSED</div>
          )}
        </div>
        <div style={{ flexShrink:0, display:'flex', gap:6 }}>
          {status==='empty' && !past && (
            <button onClick={() => setShowAssign(!showAssign)} style={{ padding:'5px 10px', borderRadius:4, border:'1px solid var(--border2)', background:'transparent', color:'var(--text2)', fontSize:11, cursor:'pointer', fontFamily:'JetBrains Mono, monospace' }}>
              ASSIGN
            </button>
          )}
          {status==='pending' && !past && (
            <span style={{ fontSize:10, color:'var(--text3)', alignSelf:'center', fontFamily:'JetBrains Mono, monospace' }}>UPCOMING</span>
          )}
          {status==='pending' && past && (
            <>
              <button onClick={() => setShowComplete(true)} style={{ padding:'5px 10px', borderRadius:4, border:'1px solid var(--green)', background:'var(--green-dim)', color:'var(--green)', fontSize:11, cursor:'pointer', fontWeight:700, fontFamily:'JetBrains Mono, monospace' }}>
                DONE
              </button>
              <button onClick={async () => { await api.slots.markMissed(slot.id); onMiss() }} style={{ padding:'5px 8px', borderRadius:4, border:'1px solid var(--red)', background:'var(--red-dim)', color:'var(--red)', fontSize:11, cursor:'pointer', fontFamily:'JetBrains Mono, monospace' }}>
                MISS
              </button>
            </>
          )}
        </div>
      </div>

      {showAssign && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'JetBrains Mono, monospace', marginBottom:8 }}>SELECT MODULE:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {modules.map(m => (
              <button key={m.id} onClick={() => { onAssign(def.key, m.id); setShowAssign(false) }} style={{
                padding:'5px 10px', borderRadius:4, border:`1px solid ${m.color}55`,
                background: m.color+'11', color:m.color, fontSize:12, cursor:'pointer',
                fontWeight:600
              }}>{m.name}</button>
            ))}
          </div>
        </div>
      )}

      {showComplete && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'10px 12px' }}>
          <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'JetBrains Mono, monospace', marginBottom:6 }}>SESSION SUMMARY // AI WILL GRADE THIS:</div>
          <textarea
            style={{ minHeight:80, resize:'vertical', lineHeight:1.6, fontSize:13 }}
            placeholder="What exactly did you study? Topics covered, what you understood, what's still unclear..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
          <button onClick={handleComplete} disabled={!summary.trim() || grading} style={{
            marginTop:8, width:'100%', padding:'9px', borderRadius:4,
            border:`1px solid ${summary.trim() && !grading ? 'var(--green)' : 'var(--border)'}`,
            background: summary.trim() && !grading ? 'var(--green-dim)' : 'transparent',
            color: summary.trim() && !grading ? 'var(--green)' : 'var(--text3)',
            fontSize:12, fontWeight:700, cursor: summary.trim() ? 'pointer' : 'default',
            fontFamily:'JetBrains Mono, monospace', letterSpacing:'1px'
          }}>{grading ? 'GRADING...' : 'SUBMIT →'}</button>
        </div>
      )}

      {status==='done' && slot.session && (
        <div style={{ borderTop:'1px solid #00ff8822', padding:'8px 12px', background:'#00ff8808' }}>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4, lineHeight:1.5, fontStyle:'italic' }}>
            "{(slot.session.summary||'').slice(0,120)}{(slot.session.summary||'').length > 120 ? '...' : ''}"
          </div>
          <div style={{ fontSize:12, color:'var(--green)' }}>{slot.session.feedback}</div>
          {slot.session.tip && <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>→ {slot.session.tip}</div>}
        </div>
      )}
    </div>
  )
}

export default function TodayPage({ profile }) {
  const [slots, setSlots]     = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const today    = format(new Date(), 'yyyy-MM-dd')
  const wakeHour = profile?.wake_hour || 6

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [s, m] = await Promise.all([api.slots.getByDate(today), api.modules.list()])
      setSlots(s); setModules(m)
    } finally { setLoading(false) }
  }

  async function handleAssign(slotKey, moduleId) {
    try {
      const s = await api.slots.assign({ date:today, slotKey, moduleId })
      setSlots(p => {
        const exists = p.find(x => x.slot_key===slotKey)
        return exists ? p.map(x => x.slot_key===slotKey ? s : x) : [...p, s]
      })
    } catch(err) { alert(err.message) }
  }

  async function refresh() { setSlots(await api.slots.getByDate(today)) }

  const getSlot    = key => slots.find(s => s.slot_key===key)
  const doneCount   = slots.filter(s => s.status==='done').length
  const missedCount = slots.filter(s => s.status==='missed').length

  const periods = ['MORNING','EVENING','NIGHT']

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'var(--text3)' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--green)', letterSpacing:'2px', marginBottom:4 }}>
          {format(new Date(), 'yyyy.MM.dd')}
        </div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
          {format(new Date(), 'EEEE').toUpperCase()}
        </h2>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--text3)' }}>
          {doneCount > 0 && <span style={{ color:'var(--green)' }}>{doneCount} DONE  </span>}
          {missedCount > 0 && <span style={{ color:'var(--red)' }}>{missedCount} MISSED  </span>}
          {(6 - doneCount - missedCount) > 0 && <span>{6 - doneCount - missedCount} REMAINING</span>}
        </div>
      </div>

      {periods.map(period => (
        <div key={period} style={{ marginBottom:20 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)', letterSpacing:'2px', marginBottom:8, borderBottom:'1px solid var(--border)', paddingBottom:6 }}>
            // {period}
          </div>
          {SLOT_DEFS.filter(s => s.period===period).map(def => (
            <SlotCard key={def.key} def={def} slot={getSlot(def.key)}
              modules={modules} wakeHour={wakeHour}
              onAssign={handleAssign} onComplete={refresh} onMiss={refresh} />
          ))}
        </div>
      ))}
    </div>
  )
}
