import { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'
import { api } from '../api'

/* ─── Mini bar chart ──────────────────────────────────────────────────────── */
function BarChart({ bars, height = 80, colorFn }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {bars.map((b, i) => {
        const pct = (b.value / max) * 100
        const color = colorFn ? colorFn(b, i) : 'var(--sage)'
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%', borderRadius: '4px 4px 2px 2px',
              background: b.value ? color : 'var(--cream-deep)',
              height: `${Math.max(pct, b.value ? 8 : 4)}%`,
              transition: 'height 0.6s cubic-bezier(.4,0,.2,1)',
              opacity: b.value ? 1 : 0.4,
            }} />
            {b.label && (
              <span style={{ fontSize: 9, color: 'var(--ink-pale)', fontWeight: 600, letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                {b.label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Score sparkline (tiny line chart via SVG) ───────────────────────────── */
function Sparkline({ points, color, height = 40, width = '100%' }) {
  if (!points || points.length < 2) return null
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = max - min || 1
  const W = 200
  const H = height
  const xs = points.map((_, i) => (i / (points.length - 1)) * W)
  const ys = points.map(v => H - ((v - min) / range) * (H - 6) - 3)
  const d  = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  const fill = `${d} L ${W} ${H} L 0 ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width, height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#grad-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Donut ring ──────────────────────────────────────────────────────────── */
function DonutRing({ pct, color, size = 64, strokeWidth = 8 }) {
  const r    = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--cream-deep)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

/* ─── Section header ──────────────────────────────────────────────────────── */
function SectionHead({ label, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{sub}</p>}
    </div>
  )
}

/* ─── Score colour helper ─────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s == null) return 'var(--ink-pale)'
  if (s >= 80) return 'var(--sage)'
  if (s >= 65) return 'var(--gold)'
  return 'var(--terra)'
}
function scoreBg(s) {
  if (s == null) return 'var(--cream-dark)'
  if (s >= 80) return 'var(--done-bg)'
  if (s >= 65) return 'var(--gold-dim)'
  return 'var(--miss-bg)'
}

/* ─── Main Stats Page ─────────────────────────────────────────────────────── */
export default function StatsPage({ profile, onBack }) {
  const [statsData,  setStats]   = useState(null)
  const [modules,    setModules] = useState([])
  const [slots7,     setSlots7]  = useState([])   // last 7 days of slot data
  const [loading,    setLoading] = useState(true)
  const [range,      setRange]   = useState('7d') // '7d' | '4w'

  const GRADE_MIN = { A: 75, 'B+': 70, B: 65 }
  const targetPct = GRADE_MIN[profile?.target_grade] || 75

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [stats, mods] = await Promise.all([
        api.sessions.stats(),
        api.modules.list(),
      ])
      setStats(stats)
      setModules(mods)

      // Fetch last 7 individual days for consistency heatmap
      const today = new Date()
      const days  = Array.from({ length: 7 }, (_, i) => format(subDays(today, 6 - i), 'yyyy-MM-dd'))
      const slotResults = await Promise.all(days.map(d => api.slots.getByDate(d).catch(() => [])))
      setSlots7(days.map((date, i) => ({ date, slots: slotResults[i] || [] })))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12, background: 'var(--cream)' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--sage)', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--ink-pale)', fontSize: 13 }}>Crunching your data…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const allStats      = statsData?.stats || []
  const totalSessions = allStats.reduce((s, m) => s + m.totalSessions, 0)
  const totalHours    = allStats.reduce((s, m) => s + m.totalHours, 0)
  const overallAvg    = (() => {
    const valid = allStats.filter(m => m.avgEfficiency != null)
    if (!valid.length) return null
    return Math.round(valid.reduce((s, m) => s + m.avgEfficiency, 0) / valid.length)
  })()

  // Last 7 days consistency
  const consistencyBars = slots7.map(({ date, slots }) => {
    const active  = slots.filter(s => s.status !== 'rest')
    const done    = slots.filter(s => s.status === 'done').length
    const missed  = slots.filter(s => s.status === 'missed').length
    const total   = active.length
    return { date, done, missed, total, label: format(new Date(date + 'T12:00:00'), 'EEE') }
  })
  const doneDays   = consistencyBars.filter(d => d.done > 0).length
  const missedDays = consistencyBars.filter(d => d.missed > 0).length
  const totalDone  = consistencyBars.reduce((s, d) => s + d.done, 0)
  const totalSlots = consistencyBars.reduce((s, d) => s + d.total, 0)
  const consistency = totalSlots > 0 ? Math.round((totalDone / totalSlots) * 100) : null

  // Score trend — last 8 sessions per module, flatten into timeline
  const trendPoints = allStats
    .filter(m => m.trend?.length > 0)
    .flatMap(m => m.trend)
    .filter(Boolean)
    .slice(-14)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ padding: '52px 20px 110px', maxWidth: 440, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 26, animation: 'fadeUp 0.35s ease both' }}>
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'var(--ink-soft)', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dashboard
          </button>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 5 }}>
            Your progress
          </p>
          <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 27, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            Analytics
          </h2>
        </div>

        {/* ── Headline KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14, animation: 'fadeUp 0.35s 0.04s ease both' }}>
          {[
            { label: 'Sessions',   value: totalSessions || '—' },
            { label: 'Hours',      value: totalHours > 0 ? `${totalHours.toFixed(1)}h` : '—' },
            { label: 'Avg score',  value: overallAvg != null ? `${overallAvg}` : '—', color: scoreColor(overallAvg) },
          ].map((k, i) => (
            <div key={i} style={{
              background: 'var(--white)', borderRadius: 16, padding: '14px 10px', textAlign: 'center',
              border: '1px solid var(--border-soft)', boxShadow: 'var(--card-shadow)',
            }}>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 22, fontWeight: 700, color: k.color || 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Weekly consistency ── */}
        <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.35s 0.07s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionHead
              label="Weekly consistency"
              sub={consistency != null ? `${totalDone} of ${totalSlots} slots completed` : 'No slots this week'}
            />
            {consistency != null && (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <DonutRing pct={consistency} color={consistency >= 70 ? 'var(--sage)' : consistency >= 45 ? 'var(--gold)' : 'var(--terra)'} size={56} strokeWidth={7} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Fraunces,serif', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{consistency}%</span>
                </div>
              </div>
            )}
          </div>

          {/* 7-day bar chart */}
          <BarChart
            height={72}
            bars={consistencyBars.map(d => ({
              value: d.total > 0 ? d.done : 0,
              label: d.label,
              done:  d.done,
              missed: d.missed,
              total: d.total,
            }))}
            colorFn={(b) =>
              b.total === 0     ? 'var(--cream-deep)'
              : b.done === b.total ? 'var(--sage)'
              : b.missed > 0    ? 'var(--terra)'
              : 'var(--gold)'
            }
          />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
            {[
              { color: 'var(--sage)',  label: 'All done' },
              { color: 'var(--gold)',  label: 'Partial' },
              { color: 'var(--terra)', label: 'Missed' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--ink-pale)', fontWeight: 600 }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Streak chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--done-bg)', borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sage)' }}>
                {doneDays} active day{doneDays !== 1 ? 's' : ''} this week
              </span>
            </div>
            {missedDays > 0 && (
              <div style={{ background: 'var(--miss-bg)', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--terra)' }}>
                  {missedDays} day{missedDays !== 1 ? 's' : ''} with misses
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Session score trend ── */}
        {trendPoints.length >= 2 && (
          <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.35s 0.10s ease both' }}>
            <SectionHead label="Score trend" sub={`Last ${trendPoints.length} sessions across all modules`} />
            <div style={{ position: 'relative' }}>
              <Sparkline
                points={trendPoints}
                color={overallAvg != null ? (overallAvg >= 75 ? '#5C8A6B' : overallAvg >= 60 ? '#C9943A' : '#C0604A') : '#5C8A6B'}
                height={72}
              />
              {/* Score markers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {[0, Math.floor(trendPoints.length/2), trendPoints.length-1].map(i => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, color: scoreColor(trendPoints[i]) }}>
                    {trendPoints[i]}
                  </span>
                ))}
              </div>
            </div>

            {/* Score band reference */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { range: '80–100', label: 'Deep Work',    color: 'var(--sage)',  bg: 'var(--done-bg)' },
                { range: '65–79',  label: 'Solid Focus',  color: 'var(--gold)',  bg: 'var(--gold-dim)' },
                { range: '0–64',   label: 'Needs Depth',  color: 'var(--terra)', bg: 'var(--miss-bg)' },
              ].map((b, i) => (
                <div key={i} style={{ background: b.bg, borderRadius: 20, padding: '4px 11px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: b.color }}>{b.range} · {b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Hours per module ── */}
        {allStats.some(m => m.totalSessions > 0) && (
          <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.35s 0.13s ease both' }}>
            <SectionHead label="Hours by module" sub="Total study time logged" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allStats
                .filter(m => m.totalSessions > 0)
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((mod) => {
                  const target = mod.recommendedHours
                  const pct    = target ? Math.min(100, Math.round((mod.totalHours / target) * 100)) : null
                  return (
                    <div key={mod.moduleId}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: mod.color || 'var(--sage)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{mod.moduleName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {mod.avgEfficiency != null && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                              background: scoreBg(mod.avgEfficiency), color: scoreColor(mod.avgEfficiency),
                            }}>
                              avg {mod.avgEfficiency}
                            </span>
                          )}
                          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 700, color: mod.color || 'var(--ink)' }}>
                            {mod.totalHours}h
                          </span>
                          {target && (
                            <span style={{ fontSize: 11, color: 'var(--ink-pale)', fontWeight: 500 }}>
                              / {target}h
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, background: 'var(--cream-deep)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct ?? Math.min(100, (mod.totalHours / (allStats.reduce((s,m2) => s + m2.totalHours, 0) || 1)) * 100)}%`,
                          background: mod.color || 'var(--sage)',
                          borderRadius: 3,
                          transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                        }} />
                      </div>
                      {pct != null && (
                        <p style={{ fontSize: 10, color: 'var(--ink-pale)', marginTop: 4, fontWeight: 600 }}>
                          {pct}% of weekly target · {mod.totalSessions} session{mod.totalSessions !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* ── Marks vs target (mid + project) ── */}
        {modules.some(m => m.mid_mark != null || m.assessments?.weight) && (
          <div className="card" style={{ marginBottom: 12, animation: 'fadeUp 0.35s 0.16s ease both' }}>
            <SectionHead
              label="Marks vs target"
              sub={`Target: ${profile?.target_grade || 'A'} (need ${targetPct}%+ overall)`}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modules.filter(m => m.mid_mark != null || m.assessments?.weight).map(mod => {
                const midW   = parseFloat(mod.mid_weight) || 0
                const projW  = mod.assessments?.weight != null ? parseFloat(mod.assessments.weight) : 0
                const finalW = Math.max(0, 100 - midW - projW)

                const midContrib = mod.mid_mark != null ? (midW / 100) * mod.mid_mark : 0
                const proj = mod.assessments
                const projPct = proj?.scored != null && proj?.outOf > 0
                  ? Math.round((proj.scored / proj.outOf) * 100) : null
                const projContrib = projPct != null ? (projW / 100) * projPct : 0

                const needed   = finalW > 0
                  ? Math.round((targetPct - midContrib - projContrib) / (finalW / 100))
                  : null
                const feasible = needed == null || needed <= 100

                return (
                  <div key={mod.id}>
                    {/* Module name row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: mod.color || 'var(--sage)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{mod.name}</span>
                      </div>
                      {needed != null && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 20,
                          color: feasible ? 'var(--sage)' : 'var(--terra)',
                          background: feasible ? 'var(--done-bg)' : 'var(--miss-bg)',
                        }}>
                          {feasible ? `need ${needed}% final` : 'AT RISK'}
                        </span>
                      )}
                    </div>

                    {/* Component pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {/* Mid */}
                      {midW > 0 && (
                        <div style={{
                          flex: 1, minWidth: 80, background: mod.mid_mark != null ? 'var(--done-bg)' : 'var(--cream-dark)',
                          borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ink-pale)', marginBottom: 3 }}>Mid · {midW}%</div>
                          {mod.mid_mark != null ? (
                            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 16, fontWeight: 700, color: scoreColor(mod.mid_mark) }}>
                              {mod.mid_mark}%
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--ink-pale)' }}>—</div>
                          )}
                        </div>
                      )}

                      {/* Project / Assignment */}
                      {projW > 0 && (
                        <div style={{
                          flex: 1, minWidth: 80,
                          background: projPct != null ? (projPct >= 70 ? 'var(--done-bg)' : projPct >= 55 ? 'var(--gold-dim)' : 'var(--miss-bg)') : 'var(--cream-dark)',
                          borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ink-pale)', marginBottom: 3 }}>
                            {proj?.type || 'Project'} · {projW}%
                          </div>
                          {proj?.scored != null && proj?.outOf != null ? (
                            <>
                              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 15, fontWeight: 700, color: scoreColor(projPct), lineHeight: 1 }}>
                                {proj.scored}/{proj.outOf}
                              </div>
                              <div style={{ fontSize: 10, color: scoreColor(projPct), fontWeight: 700, marginTop: 1 }}>{projPct}%</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--ink-pale)' }}>—</div>
                          )}
                        </div>
                      )}

                      {/* Final */}
                      {finalW > 0 && (
                        <div style={{
                          flex: 1, minWidth: 80,
                          background: needed != null && !feasible ? 'var(--miss-bg)' : 'var(--cream-dark)',
                          borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                          border: needed != null && !feasible ? '1.5px solid var(--miss-border)' : 'none',
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--ink-pale)', marginBottom: 3 }}>Final · {finalW}%</div>
                          {needed != null ? (
                            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 16, fontWeight: 700, color: feasible ? 'var(--sage)' : 'var(--terra)' }}>
                              {needed}%
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: 'var(--ink-pale)' }}>—</div>
                          )}
                          <div style={{ fontSize: 9, color: 'var(--ink-pale)', marginTop: 1 }}>needed</div>
                        </div>
                      )}
                    </div>

                    {/* Stacked weight bar */}
                    <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', gap: 2 }}>
                      {midW > 0 && <div style={{ width: `${midW}%`, height: '100%', background: mod.color || 'var(--sage)', borderRadius: 3 }} />}
                      {projW > 0 && <div style={{ width: `${projW}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />}
                      {finalW > 0 && <div style={{ width: `${finalW}%`, height: '100%', background: feasible ? 'var(--border)' : 'var(--terra)', opacity: 0.5, borderRadius: 3 }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                      {midW > 0 && <span style={{ fontSize: 9, color: 'var(--ink-pale)', fontWeight: 600 }}>■ Mid {midW}%</span>}
                      {projW > 0 && <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>■ Project {projW}%</span>}
                      {finalW > 0 && <span style={{ fontSize: 9, color: 'var(--ink-pale)', fontWeight: 600 }}>■ Final {finalW}%</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {totalSessions === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', animation: 'fadeUp 0.35s 0.1s ease both' }}>
            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 22, color: 'var(--ink-soft)', marginBottom: 8 }}>Nothing yet</p>
            <p style={{ fontSize: 14, color: 'var(--ink-pale)', lineHeight: 1.6 }}>
              Complete your first study session and your analytics will appear here.
            </p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
