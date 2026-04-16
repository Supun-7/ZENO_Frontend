import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { api } from '../api'

function ProgressRing({ score, size = 96 }) {
  const r    = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const pct  = score != null ? Math.min(score / 100, 1) : 0
  const dash = pct * circ
  const color = score == null ? '#DDD5C8'
    : score >= 80 ? 'var(--sage)'
    : score >= 65 ? 'var(--gold)'
    : 'var(--terra)'
  const trackColor = score == null ? '#EAE3D8'
    : score >= 80 ? 'rgba(92,138,107,0.12)'
    : score >= 65 ? 'rgba(201,148,58,0.12)'
    : 'rgba(192,96,74,0.1)'
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

const MODULE_COLORS = ['#5C8A6B','#C0604A','#C9943A','#5B7EC4','#9B6EC4']

const MODULE_DATA = [
  { abbr:'OS',  name:'Operating Systems',      color:'#5C8A6B', midRaw:13,   midMax:20, credits:3 },
  { abbr:'PP',  name:'Programming Paradigms',  color:'#9B6EC4', midRaw:13.9, midMax:null, credits:4 },
  { abbr:'SE',  name:'Software Engineering',   color:'#5B7EC4', midRaw:15,   midMax:20, credits:3 },
  { abbr:'DS',  name:'Distributed Systems',    color:'#C0604A', midRaw:11,   midMax:20, credits:3 },
  { abbr:'HCI', name:'Human Computer Interaction', color:'#C9943A', midRaw:null, midMax:null, credits:3 },
]

function ModulePill({ mod, idx }) {
  const hasMid = mod.midRaw != null && mod.midMax != null
  const midPct = hasMid ? Math.round((mod.midRaw / mod.midMax) * 100) : null
  const pillColor = midPct == null ? 'var(--ink-pale)'
    : midPct >= 70 ? 'var(--sage)'
    : midPct >= 55 ? 'var(--gold)'
    : 'var(--terra)'

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'13px 16px',
      background:'var(--cream)',
      borderRadius:14,
      border:`1px solid var(--border-soft)`,
      animation:`fadeUp 0.4s ease both`,
      animationDelay:`${idx * 0.06}s`,
    }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:mod.color, flexShrink:0, boxShadow:`0 0 0 3px ${mod.color}22` }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mod.abbr}</div>
        <div style={{ fontSize:11, color:'var(--ink-pale)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mod.credits} cr</div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {hasMid ? (
          <>
            <div style={{ fontSize:13, fontWeight:800, color:pillColor }}>{midPct}%</div>
            <div style={{ fontSize:10, color:'var(--ink-pale)' }}>mid</div>
          </>
        ) : (
          <div style={{ fontSize:11, color:'var(--ink-pale)', fontWeight:500 }}>no mid</div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({ profile, onNavigate }) {
  const [statsData, setStats]  = useState(null)
  const [todaySlots, setToday] = useState([])
  const [loading, setLoading]  = useState(true)

  const hour     = new Date().getHours()
  const greeting = hour < 5 ? 'Late night grind' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [stats, slots] = await Promise.all([api.sessions.stats(), api.slots.getByDate(today)])
      setStats(stats)
      setToday(slots)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const todayDone   = todaySlots.filter(s => s.status === 'done').length
  const todayTotal  = todaySlots.filter(s => s.status !== 'rest').length
  const todayMissed = todaySlots.filter(s => s.status === 'missed').length
  const lastWeekAvg = statsData?.lastWeekAvg ?? null
  const weeksLeft   = profile?.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000*60*60*24*7)))
    : null
  const nextSlot    = todaySlots.find(s => s.status === 'pending')
  const SLOT_TIMES  = { S1:'08:30', S2:'10:45', S3:'13:30', S4:'14:45' }

  const avgMidPct = (() => {
    const withMid = MODULE_DATA.filter(m => m.midRaw != null && m.midMax != null)
    if (!withMid.length) return null
    return Math.round(withMid.reduce((sum, m) => sum + (m.midRaw / m.midMax * 100), 0) / withMid.length)
  })()

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', position:'relative', overflow:'hidden' }}>
      {/* Ambient background */}
      <div style={{ position:'absolute', top:-100, right:-80, width:300, height:300, borderRadius:'50%', background:'var(--sage)', filter:'blur(80px)', opacity:0.09, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:260, left:-70, width:220, height:220, borderRadius:'50%', background:'var(--terra)', filter:'blur(70px)', opacity:0.07, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:160, right:-50, width:200, height:200, borderRadius:'50%', background:'var(--gold)', filter:'blur(60px)', opacity:0.08, pointerEvents:'none' }} />

      <div style={{ padding:'52px 20px 110px', maxWidth:440, margin:'0 auto', position:'relative', zIndex:1 }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:32, animation:'fadeUp 0.4s ease both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontSize:12, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--sage)', marginBottom:6 }}>
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
              <h1 style={{ fontSize:34, fontWeight:700, color:'var(--ink)', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:5 }}>
                {greeting} ✦
              </h1>
              {weeksLeft != null && (
                <p style={{ fontSize:14, color:'var(--ink-soft)', fontWeight:400 }}>
                  {weeksLeft === 0 ? '🎯 Exam time — good luck!' : `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} until exams`}
                </p>
              )}
            </div>
            {/* Avatar */}
            <div style={{
              width:44, height:44, borderRadius:14, background:'var(--ink)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(26,22,15,0.2)', flexShrink:0
            }}>
              <span style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:700, color:'var(--cream)' }}>S</span>
            </div>
          </div>
        </div>

        {/* ── Score hero card ── */}
        <div className="card" style={{ marginBottom:14, display:'flex', alignItems:'center', gap:18, animation:'fadeUp 0.4s 0.05s ease both' }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <ProgressRing score={lastWeekAvg} size={92} />
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'Fraunces,serif', fontSize:lastWeekAvg ? 21 : 15, fontWeight:700, color:'var(--ink)', lineHeight:1 }}>
                {lastWeekAvg ?? '—'}
              </span>
              {lastWeekAvg && <span style={{ fontSize:10, color:'var(--ink-pale)', marginTop:2 }}>/100</span>}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--ink-pale)', marginBottom:5 }}>Last Week</p>
            <p style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:600, color:'var(--ink)', lineHeight:1.3, marginBottom:4 }}>
              {lastWeekAvg == null ? 'No sessions yet'
                : lastWeekAvg >= 80 ? 'Excellent work 🔥'
                : lastWeekAvg >= 65 ? 'Good progress'
                : 'Keep pushing'}
            </p>
            <p style={{ fontSize:12, color:'var(--ink-pale)', fontWeight:400 }}>
              {statsData?.stats
                ? `${statsData.stats.reduce((s, m) => s + m.totalSessions, 0)} sessions logged`
                : 'No data yet'}
            </p>
          </div>
        </div>

        {/* ── Mid marks summary card ── */}
        <div className="card" style={{ marginBottom:14, animation:'fadeUp 0.4s 0.08s ease both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.7px', textTransform:'uppercase', color:'var(--ink-pale)', marginBottom:4 }}>Mid Exam Avg</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontFamily:'Fraunces,serif', fontSize:28, fontWeight:700, color:'var(--ink)', lineHeight:1 }}>
                  {avgMidPct != null ? `${avgMidPct}%` : '—'}
                </span>
                {avgMidPct != null && (
                  <span style={{
                    fontSize:12, fontWeight:700, padding:'2px 9px', borderRadius:20,
                    background: avgMidPct >= 70 ? 'var(--done-bg)' : avgMidPct >= 55 ? 'var(--gold-dim)' : 'var(--miss-bg)',
                    color: avgMidPct >= 70 ? 'var(--sage)' : avgMidPct >= 55 ? 'var(--gold)' : 'var(--terra)',
                  }}>
                    {avgMidPct >= 70 ? 'Strong' : avgMidPct >= 55 ? 'Decent' : 'Needs work'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigate('plan')}
              style={{ background:'var(--sage-dim)', border:'none', borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, color:'var(--sage)', cursor:'pointer', fontFamily:'Outfit,sans-serif' }}>
              View all →
            </button>
          </div>

          {/* Module mini grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {MODULE_DATA.map((mod, i) => <ModulePill key={mod.abbr} mod={mod} idx={i} />)}
          </div>
        </div>

        {/* ── Today card ── */}
        <div className="card" style={{ marginBottom:14, animation:'fadeUp 0.4s 0.12s ease both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:20, fontWeight:600, color:'var(--ink)' }}>Today</h2>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--ink-soft)', background:'var(--cream)', borderRadius:8, padding:'4px 10px' }}>
              {loading ? '...' : `${todayDone}/${todayTotal} done`}
            </span>
          </div>

          {/* Slot progress bar */}
          {!loading && todaySlots.length > 0 && (() => {
            const active = todaySlots.filter(s => s.status !== 'rest')
            return (
              <div style={{ display:'flex', gap:5, marginBottom:14 }}>
                {active.map(slot => (
                  <div key={slot.id} style={{
                    flex:1, height:7, borderRadius:4,
                    background: slot.status === 'done' ? 'var(--sage)'
                      : slot.status === 'missed' ? 'var(--terra)'
                      : 'var(--border)',
                    transition:'background 0.3s'
                  }} />
                ))}
              </div>
            )
          })()}

          {loading ? (
            <div style={{ textAlign:'center', padding:'14px 0', color:'var(--ink-pale)', fontSize:13 }}>Loading...</div>
          ) : todaySlots.length === 0 ? (
            <div style={{ textAlign:'center', padding:'14px 0', color:'var(--ink-pale)', fontSize:13 }}>No slots scheduled today</div>
          ) : null}

          {nextSlot && !loading && (
            <div style={{
              background:'linear-gradient(135deg, rgba(92,138,107,0.12), rgba(92,138,107,0.06))',
              border:'1.5px solid rgba(92,138,107,0.2)',
              borderRadius:12, padding:'12px 14px', marginBottom:14,
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.7px', color:'var(--sage)', marginBottom:3 }}>Up next</p>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>
                  {nextSlot.module?.name || 'Unassigned'} · {SLOT_TIMES[nextSlot.slot_key]}
                </p>
              </div>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--sage)', boxShadow:'0 0 0 4px var(--sage-glow)', animation:'pulse 2s ease infinite' }} />
            </div>
          )}

          {todayMissed > 0 && (
            <div style={{ background:'var(--miss-bg)', border:'1.5px solid var(--miss-border)', borderRadius:12, padding:'10px 14px', marginBottom:14 }}>
              <p style={{ fontSize:13, color:'var(--terra)', fontWeight:500 }}>
                ✕ {todayMissed} slot{todayMissed > 1 ? 's' : ''} missed
              </p>
            </div>
          )}

          <button className="btn-primary" onClick={() => onNavigate('today')}>
            Open today's plan
          </button>
        </div>

        {/* ── Action row ── */}
        <div style={{ display:'flex', gap:10, animation:'fadeUp 0.4s 0.16s ease both' }}>
          <button className="btn-secondary" style={{ flex:1 }} onClick={() => onNavigate('plan')}>
            📚 Modules
          </button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={() => onNavigate('future')}>
            📅 Schedule
          </button>
        </div>

      </div>
    </div>
  )
}
