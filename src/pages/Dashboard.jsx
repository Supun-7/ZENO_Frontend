import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { api } from '../api'

/* ─── Progress ring ───────────────────────────────────────────────────────── */
function ProgressRing({ score, size = 88 }) {
  const r    = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const pct  = score != null ? Math.min(score / 100, 1) : 0
  const dash = pct * circ
  const color = score == null ? '#DDD5C8'
    : score >= 80 ? 'var(--sage)'
    : score >= 65 ? 'var(--gold)'
    : 'var(--terra)'
  const track = score == null ? '#EAE3D8'
    : score >= 80 ? 'rgba(92,138,107,0.12)'
    : score >= 65 ? 'rgba(201,148,58,0.12)'
    : 'rgba(192,96,74,0.1)'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

/* ─── Auto-abbreviate module name ─────────────────────────────────────────── */
function abbreviate(name = '') {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
}

/* ─── Module mini pill ────────────────────────────────────────────────────── */
function ModulePill({ mod, idx }) {
  const hasMid = mod.mid_mark != null
  const pct    = hasMid ? mod.mid_mark : null
  const pillColor = pct == null ? 'var(--ink-pale)'
    : pct >= 70 ? 'var(--sage)'
    : pct >= 55 ? 'var(--gold)'
    : 'var(--terra)'
  const pillBg = pct == null ? 'var(--cream-dark)'
    : pct >= 70 ? 'var(--done-bg)'
    : pct >= 55 ? 'var(--gold-dim)'
    : 'var(--miss-bg)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '11px 13px',
      background: 'var(--cream)',
      borderRadius: 13,
      border: '1px solid var(--border-soft)',
      animation: 'fadeUp 0.4s ease both',
      animationDelay: `${0.1 + idx * 0.05}s`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: mod.color || 'var(--sage)', flexShrink: 0,
        boxShadow: `0 0 0 2.5px ${(mod.color || '#5C8A6B')}28`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.2px' }}>
          {abbreviate(mod.name)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-pale)', marginTop: 1 }}>{mod.credits} cr</div>
      </div>
      {hasMid ? (
        <div style={{ background: pillBg, borderRadius: 8, padding: '3px 8px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: pillColor, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 9, color: 'var(--ink-pale)', letterSpacing: '0.2px' }}>mid</div>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--ink-pale)', fontStyle: 'italic' }}>—</div>
      )}
    </div>
  )
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
export default function Dashboard({ profile, onNavigate }) {
  const [statsData,  setStats]   = useState(null)
  const [modules,    setMods]    = useState([])
  const [todaySlots, setToday]   = useState([])
  const [loading,    setLoading] = useState(true)

  const hour     = new Date().getHours()
  const greeting = hour < 5  ? 'Late night grind'
    : hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon'
    : 'Good evening'

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [stats, slots, mods] = await Promise.all([
        api.sessions.stats(),
        api.slots.getByDate(today),
        api.modules.list(),
      ])
      setStats(stats)
      setToday(slots)
      setMods(mods)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const activeSlots  = todaySlots.filter(s => s.status !== 'rest')
  const todayDone    = activeSlots.filter(s => s.status === 'done').length
  const todayTotal   = activeSlots.length
  const todayMissed  = activeSlots.filter(s => s.status === 'missed').length
  const lastWeekAvg  = statsData?.lastWeekAvg ?? null
  const weeksLeft    = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000*60*60*24*7)))
    : null
  const nextSlot     = todaySlots.find(s => s.status === 'pending')
  const SLOT_TIMES   = { S1: '08:30', S2: '10:45', S3: '13:30', S4: '14:45' }
  const totalSessions = statsData?.stats?.reduce((s, m) => s + m.totalSessions, 0) || 0

  const avgMidPct = (() => {
    const withMid = modules.filter(m => m.mid_mark != null)
    if (!withMid.length) return null
    return Math.round(withMid.reduce((sum, m) => sum + m.mid_mark, 0) / withMid.length)
  })()

  const scoreLabel = lastWeekAvg == null ? 'No sessions yet'
    : lastWeekAvg >= 80 ? 'Excellent week 🔥'
    : lastWeekAvg >= 65 ? 'Good progress'
    : 'Keep pushing'

  const scoreColor = lastWeekAvg == null ? 'var(--ink-pale)'
    : lastWeekAvg >= 80 ? 'var(--sage)'
    : lastWeekAvg >= 65 ? 'var(--gold)'
    : 'var(--terra)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'var(--sage)', filter: 'blur(90px)', opacity: 0.08, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 280, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'var(--terra)', filter: 'blur(75px)', opacity: 0.06, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 200, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'var(--gold)', filter: 'blur(65px)', opacity: 0.07, pointerEvents: 'none' }} />

      <div style={{ padding: '52px 20px 110px', maxWidth: 440, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 26, animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 6 }}>
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.4px', marginBottom: 5 }}>
                {greeting} ✦
              </h1>
              {weeksLeft != null && (
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  {weeksLeft === 0 ? '🎯 Exam time — good luck!' : `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} until exams`}
                </p>
              )}
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(26,22,15,0.22)', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 700, color: 'var(--cream)' }}>
                {profile?.name?.[0]?.toUpperCase() || 'S'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Score card — tappable, opens stats ── */}
        <div
          className="card"
          onClick={() => onNavigate('stats')}
          style={{
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', animation: 'fadeUp 0.4s 0.05s ease both',
            transition: 'box-shadow 0.2s, transform 0.15s',
            userSelect: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--card-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
        >
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ProgressRing score={lastWeekAvg} size={88} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces,serif', fontSize: lastWeekAvg ? 20 : 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                {loading ? '…' : lastWeekAvg ?? '—'}
              </span>
              {lastWeekAvg && <span style={{ fontSize: 9, color: 'var(--ink-pale)', marginTop: 2 }}>/100</span>}
            </div>
          </div>

          {/* Score info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 5 }}>
              Last week
            </p>
            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 4 }}>
              {scoreLabel}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-pale)' }}>
              {totalSessions > 0 ? `${totalSessions} sessions logged` : 'No data yet'}
            </p>
          </div>

          {/* Tap hint */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{
              background: 'var(--sage-dim)', borderRadius: 8, padding: '6px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sage)', whiteSpace: 'nowrap' }}>Analytics</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-pale)" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        {/* ── Today card ── */}
        <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.4s 0.08s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Today</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', background: 'var(--cream)', borderRadius: 8, padding: '4px 10px' }}>
                {loading ? '…' : `${todayDone}/${todayTotal} done`}
              </span>
            </div>
          </div>

          {/* Slot progress bar */}
          {!loading && activeSlots.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {activeSlots.map(slot => (
                <div key={slot.id} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: slot.status === 'done' ? 'var(--sage)'
                    : slot.status === 'missed' ? 'var(--terra)'
                    : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--ink-pale)', fontSize: 13 }}>Loading…</p>
          ) : todaySlots.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--ink-pale)', fontSize: 13 }}>No slots scheduled today</p>
          ) : null}

          {/* Up next */}
          {nextSlot && !loading && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(92,138,107,0.12), rgba(92,138,107,0.06))',
              border: '1.5px solid rgba(92,138,107,0.2)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--sage)', marginBottom: 3 }}>Up next</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  {nextSlot.module?.name || 'Unassigned'} · {SLOT_TIMES[nextSlot.slot_key]}
                </p>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)', boxShadow: '0 0 0 4px var(--sage-glow)', animation: 'livePulse 2s ease infinite' }} />
            </div>
          )}

          {todayMissed > 0 && (
            <div style={{ background: 'var(--miss-bg)', border: '1.5px solid var(--miss-border)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--terra)', fontWeight: 600 }}>
                ✕ {todayMissed} slot{todayMissed > 1 ? 's' : ''} missed today
              </p>
            </div>
          )}

          <button className="btn-primary" onClick={() => onNavigate('today')}>
            Open today's plan
          </button>
        </div>

        {/* ── Mid marks card (dynamic) ── */}
        <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.4s 0.11s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 4 }}>
                Mid Exam Average
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'Fraunces,serif', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                  {loading ? '…' : avgMidPct != null ? `${avgMidPct}%` : '—'}
                </span>
                {avgMidPct != null && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: avgMidPct >= 70 ? 'var(--done-bg)' : avgMidPct >= 55 ? 'var(--gold-dim)' : 'var(--miss-bg)',
                    color:      avgMidPct >= 70 ? 'var(--sage)' : avgMidPct >= 55 ? 'var(--gold)' : 'var(--terra)',
                  }}>
                    {avgMidPct >= 70 ? 'Strong' : avgMidPct >= 55 ? 'Decent' : 'Needs work'}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => onNavigate('plan')} style={{
              background: 'var(--sage-dim)', border: 'none', borderRadius: 10,
              padding: '8px 14px', fontSize: 12, fontWeight: 700,
              color: 'var(--sage)', cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
            }}>
              Manage →
            </button>
          </div>

          {loading ? (
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--ink-pale)' }}>Loading…</p>
            </div>
          ) : modules.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {modules.map((mod, i) => <ModulePill key={mod.id} mod={mod} idx={i} />)}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ink-pale)', textAlign: 'center', padding: '16px 0' }}>
              No modules yet
            </p>
          )}
        </div>

        {/* ── Quick nav ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, animation: 'fadeUp 0.4s 0.14s ease both' }}>
          <button className="btn-secondary" onClick={() => onNavigate('plan')}>📚 Modules</button>
          <button className="btn-secondary" onClick={() => onNavigate('future')}>📅 Schedule</button>
        </div>

      </div>

      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes livePulse { 0%,100% { box-shadow:0 0 0 4px var(--sage-glow) } 50% { box-shadow:0 0 0 8px rgba(92,138,107,0.08) } }
      `}</style>
    </div>
  )
}
