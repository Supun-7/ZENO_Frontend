import { useState, useEffect } from 'react'
import { format, isPast } from 'date-fns'
import { api } from '../api'
import useAuth from '../store/auth'

// Fixed slot definitions - matches backend SLOT_DURATIONS
const SLOT_DEFINITIONS = [
  { key: 'M1', period: 'Morning', label: 'Slot 1', durationMin: 120 },
  { key: 'M2', period: 'Morning', label: 'Slot 2', durationMin: 120 },
  { key: 'E1', period: 'Evening', label: 'Slot 1', durationMin: 60  },
  { key: 'E2', period: 'Evening', label: 'Slot 2', durationMin: 60  },
  { key: 'E3', period: 'Evening', label: 'Slot 3', durationMin: 30  },
  { key: 'N1', period: 'Night',   label: 'Slot',   durationMin: 150 },
]

function getSlotTimes(wakeHour, key) {
  const pad = n => String(n).padStart(2, '0')
  const fmt = (h, m) => `${pad(h)}:${pad(m)}`
  const times = {
    M1: [wakeHour, 0,  wakeHour + 2, 0],
    M2: [wakeHour + 2, 15, wakeHour + 4, 15],
    E1: [16, 0,  17, 0],
    E2: [17, 15, 18, 15],
    E3: [18, 30, 19, 0],
    N1: [20, 30, 23, 0],
  }
  const [sh, sm, eh, em] = times[key]
  return `${fmt(sh, sm)} – ${fmt(eh, em)}`
}

function isSlotPast(key, wakeHour) {
  const now = new Date()
  const endTimes = {
    M1: [wakeHour + 2, 0],
    M2: [wakeHour + 4, 15],
    E1: [17, 0],
    E2: [18, 15],
    E3: [19, 0],
    N1: [23, 0],
  }
  const [eh, em] = endTimes[key]
  const end = new Date()
  end.setHours(eh, em, 0, 0)
  return isPast(end)
}

function SlotCard({ slotDef, slot, modules, wakeHour, onAssign, onComplete, onMiss }) {
  const [showAssign, setShowAssign]   = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [summary, setSummary]         = useState('')
  const [grading, setGrading]         = useState(false)

  const mod = modules.find(m => m.id === slot?.module_id)
  const past = isSlotPast(slotDef.key, wakeHour)
  const status = slot?.status || 'empty'

  const borderColor = status === 'done' ? '#2ECC9A' : status === 'missed' ? '#E8526A' : mod ? mod.color : '#2a2a2a'
  const bg = status === 'done' ? '#0d1f1a' : status === 'missed' ? '#1f0d0d' : '#111'

  async function handleComplete() {
    if (!summary.trim()) return
    setGrading(true)
    try {
      const result = await api.sessions.complete({ slotId: slot.id, summary })
      onComplete(result)
      setShowComplete(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setGrading(false)
    }
  }

  async function handleMiss() {
    if (!slot?.id) return
    try {
      await api.slots.markMissed(slot.id)
      onMiss()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ background: bg, border: `1px solid ${borderColor}33`, borderLeft: `3px solid ${borderColor}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>
            {getSlotTimes(wakeHour, slotDef.key)} · {slotDef.durationMin}min
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: status === 'done' ? '#2ECC9A' : status === 'missed' ? '#E8526A' : mod ? mod.color : '#444' }}>
            {mod ? mod.name : status === 'missed' ? 'Missed' : 'Not assigned'}
          </div>
          {status === 'done' && slot.session && (
            <div style={{ fontSize: 11, color: '#2ECC9A', marginTop: 2 }}>
              ✓ {slot.session.efficiency_label} · {slot.session.efficiency_score}/100
            </div>
          )}
          {status === 'missed' && (
            <div style={{ fontSize: 11, color: '#E8526A', marginTop: 2 }}>✕ Missed — permanently logged</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {status === 'empty' && !past && (
            <button onClick={() => setShowAssign(!showAssign)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #2a2a2a', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Assign
            </button>
          )}
          {status === 'pending' && !past && (
            <span style={{ fontSize: 11, color: '#555', alignSelf: 'center' }}>Upcoming</span>
          )}
          {status === 'pending' && past && (
            <>
              <button onClick={() => setShowComplete(true)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#7C6FE0', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Complete
              </button>
              <button onClick={handleMiss} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #3d1a1a', background: 'transparent', color: '#E8526A', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Miss
              </button>
            </>
          )}
          {status === 'empty' && past && (
            <span style={{ fontSize: 11, color: '#333', alignSelf: 'center' }}>Unassigned</span>
          )}
        </div>
      </div>

      {/* Assign panel */}
      {showAssign && (
        <div style={{ marginTop: 12, borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Choose module:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {modules.map(m => (
              <button key={m.id} onClick={() => { onAssign(slotDef.key, m.id); setShowAssign(false) }} style={{
                padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${m.color}44`, background: m.color + '11',
                color: m.color, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
              }}>{m.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Complete panel */}
      {showComplete && (
        <div style={{ marginTop: 12, borderTop: '1px solid #1e1e1e', paddingTop: 12 }}>
          <div style={{ fontSize: 12, color: '#777', marginBottom: 8, lineHeight: 1.5 }}>
            What did you study? Be specific — AI will grade your session based on your module topics.
          </div>
          <textarea
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e0e0e0', fontSize: 13, minHeight: 90, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
            placeholder="e.g. Covered process scheduling — FCFS, SJF, Round Robin. Understood preemption. Still unclear on multilevel queue priorities..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
          <button
            onClick={handleComplete}
            disabled={!summary.trim() || grading}
            style={{ marginTop: 8, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: summary.trim() && !grading ? '#2ECC9A' : '#1a1a1a', color: summary.trim() && !grading ? '#0a0a0a' : '#555', fontSize: 13, fontWeight: 600, cursor: summary.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {grading ? '⟳ Grading your session...' : 'Mark Complete →'}
          </button>
        </div>
      )}

      {/* Show efficiency after done */}
      {status === 'done' && slot.session && (
        <div style={{ marginTop: 10, borderTop: '1px solid #1e2e1e', paddingTop: 10 }}>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 4, fontStyle: 'italic' }}>"{slot.session.summary?.slice(0, 120)}{slot.session.summary?.length > 120 ? '...' : ''}"</div>
          <div style={{ fontSize: 12, color: '#2ECC9A' }}>{slot.session.feedback}</div>
          {slot.session.tip && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>💡 {slot.session.tip}</div>}
        </div>
      )}
    </div>
  )
}

export default function TodayPage() {
  const { profile } = useAuth()
  const [slots, setSlots]     = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')
  const wakeHour = profile?.wake_hour || 6

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [s, m] = await Promise.all([api.slots.getByDate(today), api.modules.list()])
      setSlots(s)
      setModules(m)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(slotKey, moduleId) {
    try {
      const newSlot = await api.slots.assign({ date: today, slotKey, moduleId })
      setSlots(prev => {
        const exists = prev.find(s => s.slot_key === slotKey)
        if (exists) return prev.map(s => s.slot_key === slotKey ? newSlot : s)
        return [...prev, newSlot]
      })
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleComplete(result) {
    // Refresh slots to get updated status and session data
    const updated = await api.slots.getByDate(today)
    setSlots(updated)
  }

  async function handleMiss() {
    const updated = await api.slots.getByDate(today)
    setSlots(updated)
  }

  const getSlot = (key) => slots.find(s => s.slot_key === key)
  const doneCount = slots.filter(s => s.status === 'done').length
  const missedCount = slots.filter(s => s.status === 'missed').length

  const periods = ['Morning', 'Evening', 'Night']
  const byPeriod = (p) => SLOT_DEFINITIONS.filter(s => s.period === p)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading today...</div>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          {format(new Date(), 'EEEE')}
        </h2>
        <p style={{ fontSize: 13, color: '#555' }}>
          {format(new Date(), 'MMM d')}
          {doneCount > 0 && <span style={{ color: '#2ECC9A' }}> · {doneCount} done</span>}
          {missedCount > 0 && <span style={{ color: '#E8526A' }}> · {missedCount} missed</span>}
        </p>
      </div>

      {periods.map(period => (
        <div key={period} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#444', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 10 }}>
            {period === 'Morning' ? '☀️' : period === 'Evening' ? '🌤' : '🌙'} {period.toUpperCase()}
          </div>
          {byPeriod(period).map(slotDef => (
            <SlotCard
              key={slotDef.key}
              slotDef={slotDef}
              slot={getSlot(slotDef.key)}
              modules={modules}
              wakeHour={wakeHour}
              onAssign={handleAssign}
              onComplete={handleComplete}
              onMiss={handleMiss}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
