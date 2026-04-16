import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { api } from '../api'

const GREETINGS = [
  'Good morning', 'Ready to focus?', 'Let\'s get to work',
  'Time to study', 'You\'ve got this'
]

function ProgressRing({ score, size = 100 }) {
  const r    = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const pct  = score != null ? score / 100 : 0
  const dash = pct * circ

  const color = score == null ? '#DDD5C8'
    : score >= 80 ? '#7C9E87'
    : score >= 65 ? '#D4A843'
    : '#C4714A'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EAE3D8" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

export default function Dashboard({ profile, onNavigate }) {
  const [statsData, setStats]   = useState(null)
  const [todaySlots, setToday]  = useState([])
  const [loading, setLoading]   = useState(true)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon'
    : 'Good evening'

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [stats, slots] = await Promise.all([
        api.sessions.stats(),
        api.slots.getByDate(today)
      ])
      setStats(stats)
      setToday(slots)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const todayDone    = todaySlots.filter(s => s.status === 'done').length
  const todayTotal   = todaySlots.filter(s => s.status !== 'rest').length
  const todayMissed  = todaySlots.filter(s => s.status === 'missed').length
  const lastWeekAvg  = statsData?.lastWeekAvg ?? null
  const weeksLeft    = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000*60*60*24*7)))
    : null

  // Next upcoming slot today
  const nextSlot = todaySlots.find(s => s.status === 'pending')

  const SLOT_TIMES = { S1:'08:30', S2:'10:45', S3:'13:30', S4:'14:45' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'var(--sage)', filter: 'blur(60px)', opacity: 0.12, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 200, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'var(--terra)', filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 100, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'var(--gold)', filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />

      <div style={{ padding: '56px 24px 100px', maxWidth: 440, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Greeting */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 6 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6 }}>
            {greeting} ✦
          </h1>
          {weeksLeft != null && (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {weeksLeft === 0 ? 'Exam time — good luck!' : `${weeksLeft} week${weeksLeft === 1 ? '' : 's'} until your exam`}
            </p>
          )}
        </div>

        {/* Last week efficiency card */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ProgressRing score={lastWeekAvg} size={90} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: lastWeekAvg ? 22 : 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                {lastWeekAvg ?? '—'}
              </span>
              {lastWeekAvg && <span style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>/100</span>}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Last week</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--ink)', lineHeight: 1.3 }}>
              {lastWeekAvg == null ? 'No sessions yet' :
               lastWeekAvg >= 80 ? 'Excellent work' :
               lastWeekAvg >= 65 ? 'Good progress' :
               'Room to grow'}
            </p>
            {statsData?.stats && (
              <p style={{ fontSize: 12, color: 'var(--ink-pale)', marginTop: 4 }}>
                {statsData.stats.reduce((s, m) => s + m.totalSessions, 0)} total sessions logged
              </p>
            )}
          </div>
        </div>

        {/* Today summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, color: 'var(--ink)' }}>Today</h2>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              {todayDone}/{todayTotal} slots done
            </span>
          </div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--ink-pale)', textAlign: 'center', padding: '12px 0' }}>Loading...</p>
          ) : todaySlots.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-pale)', textAlign: 'center', padding: '12px 0' }}>No slots scheduled today</p>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {todaySlots.filter(s => s.status !== 'rest').map(slot => (
                <div key={slot.id} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: slot.status === 'done' ? 'var(--sage)'
                    : slot.status === 'missed' ? 'var(--terra)'
                    : 'var(--border)'
                }} />
              ))}
            </div>
          )}

          {nextSlot && (
            <div style={{ background: 'var(--sage-dim)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Next up</p>
                <p style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                  {nextSlot.module?.name || 'Unassigned'} · {SLOT_TIMES[nextSlot.slot_key]}
                </p>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)' }} />
            </div>
          )}

          {todayMissed > 0 && (
            <div style={{ background: 'var(--miss-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--terra)' }}>
                ✕ {todayMissed} slot{todayMissed > 1 ? 's' : ''} missed today
              </p>
            </div>
          )}

          <button className="btn-primary" onClick={() => onNavigate('today')}>
            Open today's plan
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => onNavigate('plan')}>
            My modules
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => onNavigate('future')}>
            Future plan
          </button>
        </div>
      </div>
    </div>
  )
}
