import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { api } from '../api'

const SLOT_META = {
  S1: { time: '08:30', label: 'Morning' },
  S2: { time: '10:45', label: 'Mid-morning' },
  S3: { time: '13:30', label: 'Afternoon' },
  S4: { time: '14:45', label: 'Late afternoon' },
}

export default function FuturePlan() {
  const [slots, setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays]     = useState(14)

  useEffect(() => { load() }, [days])

  async function load() {
    setLoading(true)
    try {
      const from = format(new Date(), 'yyyy-MM-dd')
      const data = await api.plan.future(from, days)
      setSlots(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Group by date
  const byDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = []
    acc[slot.date].push(slot)
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>
          UPCOMING SCHEDULE
        </p>
        <h2 style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 6 }}>Future plan</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          Your AI-generated study schedule ahead
        </p>
      </div>

      {/* Days toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[7, 14, 21].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            flex: 1, padding: '8px', borderRadius: 10,
            border: `1.5px solid ${days === d ? 'var(--sage)' : 'var(--border)'}`,
            background: days === d ? 'var(--sage-dim)' : 'transparent',
            color: days === d ? 'var(--sage)' : 'var(--ink-soft)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
          }}>{d} days</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'var(--ink-pale)', fontSize: 14 }}>Loading schedule...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--ink-soft)', marginBottom: 8 }}>No upcoming slots</p>
          <p style={{ fontSize: 14, color: 'var(--ink-pale)' }}>Your plan may not have been generated yet</p>
        </div>
      ) : (
        dates.map(date => {
          const daySlots  = byDate[date]
          const isToday   = date === format(new Date(), 'yyyy-MM-dd')
          const isTomorrow = date === format(addDays(new Date(), 1), 'yyyy-MM-dd')

          return (
            <div key={date} style={{ marginBottom: 20 }}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  background: isToday ? 'var(--sage)' : 'var(--cream-deep)',
                  color: isToday ? 'white' : 'var(--ink-mid)',
                  borderRadius: 10, padding: '4px 12px', fontSize: 12, fontWeight: 600
                }}>
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(new Date(date + 'T12:00:00'), 'EEEE')}
                </div>
                <span style={{ fontSize: 12, color: 'var(--ink-pale)' }}>
                  {format(new Date(date + 'T12:00:00'), 'MMM d')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
              </div>

              {/* Slots for this day */}
              {daySlots.map(slot => {
                const meta = SLOT_META[slot.slot_key]
                const mod  = slot.module
                return (
                  <div key={slot.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--white)', borderRadius: 10, padding: '10px 14px',
                    marginBottom: 6, border: '1.5px solid var(--border-soft)',
                    borderLeft: `3px solid ${mod?.color || 'var(--border)'}`,
                    opacity: slot.status === 'done' ? 0.6 : 1
                  }}>
                    <div style={{ flexShrink: 0, width: 44, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mid)' }}>{meta.time}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-pale)' }}>{slot.slot_key}</div>
                    </div>
                    <div style={{ width: 1, height: 28, background: 'var(--border-soft)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: mod?.color || 'var(--ink-pale)', fontFamily: 'Playfair Display, serif' }}>
                        {mod?.name || 'Unassigned'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-pale)' }}>{meta.label}</div>
                    </div>
                    {slot.status === 'done' && (
                      <span style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 600 }}>✓ Done</span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}
