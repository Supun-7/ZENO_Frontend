import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { api } from '../api'

const SLOT_META = {
  S1: { time:'08:30', label:'Morning' },
  S2: { time:'10:45', label:'Mid-morning' },
  S3: { time:'13:30', label:'Afternoon' },
  S4: { time:'14:45', label:'Late afternoon' },
}

export default function FuturePlan() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState(14)

  useEffect(() => { load() }, [days])

  async function load() {
    setLoading(true)
    try {
      const from = format(new Date(), 'yyyy-MM-dd')
      const data = await api.plan.future(from, days)
      setSlots(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const byDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  return (
    <div style={{ padding:'28px 20px 100px', maxWidth:440, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--sage)', marginBottom:5 }}>
          UPCOMING SCHEDULE
        </p>
        <h2 style={{ fontFamily:'Fraunces,serif', fontSize:28, fontWeight:700, color:'var(--ink)', marginBottom:5, letterSpacing:'-0.3px' }}>
          Future plan
        </h2>
        <p style={{ fontSize:13, color:'var(--ink-soft)', fontWeight:400 }}>
          Your AI-generated study schedule ahead
        </p>
      </div>

      {/* Days toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:24, background:'var(--cream-dark)', borderRadius:14, padding:5 }}>
        {[7,14,21].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            flex:1, padding:'9px', borderRadius:10,
            border:'none',
            background: days === d ? 'var(--white)' : 'transparent',
            color: days === d ? 'var(--ink)' : 'var(--ink-soft)',
            fontSize:13, fontWeight:700, cursor:'pointer',
            fontFamily:'Outfit,sans-serif',
            boxShadow: days === d ? '0 1px 6px rgba(26,22,15,0.1)' : 'none',
            transition:'all 0.2s',
          }}>{d} days</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'44px 0' }}>
          <p style={{ color:'var(--ink-pale)', fontSize:14 }}>Loading schedule...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'44px 20px' }}>
          <p style={{ fontFamily:'Fraunces,serif', fontSize:20, color:'var(--ink-soft)', marginBottom:8 }}>No upcoming slots</p>
          <p style={{ fontSize:14, color:'var(--ink-pale)' }}>Your plan may not have been generated yet</p>
        </div>
      ) : dates.map(date => {
        const daySlots   = byDate[date]
        const isToday    = date === format(new Date(), 'yyyy-MM-dd')
        const isTomorrow = date === format(addDays(new Date(), 1), 'yyyy-MM-dd')
        const dayDone    = daySlots.filter(s => s.status === 'done').length

        return (
          <div key={date} style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{
                background: isToday ? 'var(--sage)' : 'var(--ink)',
                color: 'white', borderRadius:9, padding:'4px 13px',
                fontSize:12, fontWeight:800, letterSpacing:'0.2px',
              }}>
                {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(new Date(date+'T12:00:00'), 'EEEE')}
              </div>
              <span style={{ fontSize:12, color:'var(--ink-pale)', fontWeight:500 }}>
                {format(new Date(date+'T12:00:00'), 'MMM d')}
              </span>
              <div style={{ flex:1, height:1, background:'var(--border-soft)' }} />
              {dayDone > 0 && (
                <span style={{ fontSize:11, color:'var(--sage)', fontWeight:700 }}>{dayDone}/{daySlots.length} done</span>
              )}
            </div>

            {daySlots.map(slot => {
              const meta = SLOT_META[slot.slot_key]
              const mod  = slot.module
              return (
                <div key={slot.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  background:'var(--white)', borderRadius:13, padding:'11px 14px',
                  marginBottom:7, border:'1px solid var(--border-soft)',
                  borderLeft:`4px solid ${mod?.color || 'var(--border)'}`,
                  opacity: slot.status === 'done' ? 0.55 : 1,
                  boxShadow: slot.status === 'done' ? 'none' : 'var(--card-shadow)',
                }}>
                  <div style={{ flexShrink:0, width:48, textAlign:'center' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-mid)' }}>{meta.time}</div>
                    <div style={{ fontSize:10, color:'var(--ink-pale)', fontWeight:500 }}>{slot.slot_key}</div>
                  </div>
                  <div style={{ width:1, height:28, background:'var(--border-soft)' }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:mod?.color || 'var(--ink-pale)', fontFamily:'Fraunces,serif' }}>
                      {mod?.name || 'Unassigned'}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-pale)', fontWeight:400 }}>{meta.label}</div>
                  </div>
                  {slot.status === 'done' && (
                    <span style={{ fontSize:12, color:'var(--sage)', fontWeight:800 }}>✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
