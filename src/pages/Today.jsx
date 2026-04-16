import { useState, useEffect } from 'react'
import { format, isPast } from 'date-fns'
import { api } from '../api'

const SLOT_META = {
  S1: { time: '08:30 – 10:30', dur: 120, label: 'Morning block' },
  S2: { time: '10:45 – 12:30', dur: 105, label: 'Mid-morning block' },
  S3: { time: '13:30 – 14:30', dur: 60,  label: 'Afternoon block' },
  S4: { time: '14:45 – 16:00', dur: 75,  label: 'Late afternoon block' },
}

function isPastSlot(slotKey) {
  const endTimes = { S1: [10,30], S2: [12,30], S3: [14,30], S4: [16,0] }
  const [h, m]   = endTimes[slotKey]
  const end      = new Date()
  end.setHours(h, m, 0, 0)
  return isPast(end)
}

function ScoreBadge({ score, label }) {
  const color = score >= 80 ? 'var(--sage)' : score >= 65 ? 'var(--gold)' : 'var(--terra)'
  const bg    = score >= 80 ? 'var(--done-bg)' : score >= 65 ? 'var(--gold-dim)' : 'var(--miss-bg)'
  return (
    <span style={{ background: bg, color, fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>
      {label} · {score}/100
    </span>
  )
}

function SlotCard({ slot, onComplete, onMiss }) {
  const [showComplete, setShowComplete] = useState(false)
  const [summary, setSummary]           = useState('')
  const [grading, setGrading]           = useState(false)

  const meta   = SLOT_META[slot.slot_key]
  const status = slot.status
  const mod    = slot.module
  const past   = isPastSlot(slot.slot_key)
  const sess   = slot.session

  async function handleComplete() {
    if (!summary.trim()) return
    setGrading(true)
    try {
      const result = await api.sessions.complete({ slotId: slot.id, summary })
      onComplete(result)
      setShowComplete(false)
      setSummary('')
    } catch (err) {
      alert(err.message)
    } finally {
      setGrading(false)
    }
  }

  async function handleMiss() {
    try {
      await api.slots.markMissed(slot.id)
      onMiss()
    } catch (err) {
      alert(err.message)
    }
  }

  const cardBg = status === 'done'   ? 'var(--done-bg)'
    : status === 'missed' ? 'var(--miss-bg)'
    : 'var(--white)'

  const borderColor = status === 'done'   ? 'var(--done-border)'
    : status === 'missed' ? 'var(--miss-border)'
    : mod ? mod.color + '88' : 'var(--border-soft)'

  const leftAccent = mod?.color || (status === 'done' ? 'var(--sage)' : status === 'missed' ? 'var(--terra)' : 'var(--border)')

  return (
    <div style={{ background: cardBg, border: `1.5px solid ${borderColor}`, borderLeft: `4px solid ${leftAccent}`, borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        {/* Slot header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--ink-pale)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 3 }}>
              {meta.label} · {meta.time}
            </p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: status === 'done' ? 'var(--sage)' : status === 'missed' ? 'var(--terra)' : mod ? 'var(--ink)' : 'var(--ink-pale)', fontWeight: 600 }}>
              {mod ? mod.name : status === 'missed' ? 'Missed' : 'Not assigned'}
            </p>
          </div>
          {status === 'done' && sess && (
            <ScoreBadge score={sess.efficiency_score} label={sess.efficiency_label} />
          )}
          {status === 'missed' && (
            <span style={{ fontSize: 12, color: 'var(--terra)', fontWeight: 600 }}>✕ Missed</span>
          )}
        </div>

        {/* Done — show feedback */}
        {status === 'done' && sess && (
          <div style={{ borderTop: '1px solid var(--done-border)', paddingTop: 10, marginTop: 4 }}>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic', marginBottom: 6, lineHeight: 1.5 }}>
              "{(sess.summary || '').slice(0, 130)}{(sess.summary || '').length > 130 ? '...' : ''}"
            </p>
            <p style={{ fontSize: 13, color: 'var(--sage)', lineHeight: 1.5 }}>{sess.feedback}</p>
            {sess.tip && (
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                → {sess.tip}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {status === 'pending' && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            {past ? (
              <>
                <button onClick={() => setShowComplete(!showComplete)} style={{
                  flex: 2, padding: '9px', borderRadius: 10, border: 'none',
                  background: 'var(--sage)', color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                }}>
                  Mark complete
                </button>
                <button onClick={handleMiss} style={{
                  flex: 1, padding: '9px', borderRadius: 10,
                  border: '1.5px solid var(--miss-border)', background: 'transparent',
                  color: 'var(--terra)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                }}>
                  Missed
                </button>
              </>
            ) : (
              <div style={{ padding: '8px 12px', background: 'var(--sage-dim)', borderRadius: 10, flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
                  Upcoming · starts at {meta.time.split(' – ')[0]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete panel */}
      {showComplete && status === 'pending' && (
        <div style={{ borderTop: '1px solid var(--border-soft)', padding: '14px 16px', background: 'var(--cream-dark)' }}>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10, lineHeight: 1.5 }}>
            What did you study? Be specific — AI will analyse your session and give feedback.
          </p>
          <textarea
            style={{ minHeight: 90, resize: 'vertical', lineHeight: 1.6, fontSize: 13, marginBottom: 10 }}
            placeholder="e.g. Covered process scheduling — FCFS, SJF, Round Robin. Understood preemption clearly. Still fuzzy on multilevel queue priorities..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
          <button
            onClick={handleComplete}
            disabled={!summary.trim() || grading}
            className={summary.trim() && !grading ? 'btn-primary' : ''}
            style={!summary.trim() || grading ? {
              width: '100%', padding: '11px', borderRadius: 10, border: 'none',
              background: 'var(--border)', color: 'var(--ink-pale)',
              fontSize: 14, fontWeight: 600, cursor: 'default', fontFamily: 'DM Sans, sans-serif'
            } : {}}>
            {grading ? 'Grading your session...' : 'Submit & get feedback →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function TodayPage() {
  const [slots, setSlots]   = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await api.slots.getByDate(today)
      setSlots(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const activeSlots = slots.filter(s => s.status !== 'rest')
  const doneCount   = activeSlots.filter(s => s.status === 'done').length
  const missedCount = activeSlots.filter(s => s.status === 'missed').length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ color: 'var(--ink-pale)', fontSize: 14 }}>Loading today...</p>
    </div>
  )

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 440, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h2 style={{ fontSize: 26, color: 'var(--ink)', marginBottom: 6 }}>Today's sessions</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {doneCount} of {activeSlots.length} done
          {missedCount > 0 && <span style={{ color: 'var(--terra)' }}> · {missedCount} missed</span>}
        </p>
      </div>

      {activeSlots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: 'var(--ink-soft)', marginBottom: 8 }}>Rest day</p>
          <p style={{ fontSize: 14, color: 'var(--ink-pale)' }}>No study slots scheduled today</p>
        </div>
      ) : (
        activeSlots.map(slot => (
          <SlotCard key={slot.id} slot={slot} onComplete={load} onMiss={load} />
        ))
      )}
    </div>
  )
}
