import { useState, useEffect } from 'react'
import { api } from '../api'

export default function PlanPage({ profile }) {
  const [modules, setModules]   = useState([])
  const [stats, setStats]       = useState([])
  const [expanded, setExpanded] = useState(null)
  const [analyzing, setAnalyzing] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [m, s] = await Promise.all([api.modules.list(), api.sessions.stats()])
      setModules(m)
      setStats(s.stats || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function reAnalyze(id) {
    setAnalyzing(p => ({ ...p, [id]: true }))
    try {
      const updated = await api.modules.analyze(id)
      setModules(p => p.map(m => m.id === id ? updated : m))
    } catch (err) {
      alert('Analysis failed: ' + err.message)
    } finally {
      setAnalyzing(p => ({ ...p, [id]: false }))
    }
  }

  const GRADE_MIN = { 'A': 75, 'B+': 70, 'B': 65 }
  const targetPct = GRADE_MIN[profile?.target_grade] || 75

  const weeksLeft = profile?.exam_date
    ? Math.max(1, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24 * 7)))
    : 5

  function neededFinal(mod) {
    if (!mod.mid_weight || mod.mid_mark == null) return targetPct
    const n = (targetPct - (mod.mid_weight / 100) * mod.mid_mark) / ((100 - mod.mid_weight) / 100)
    return Math.round(Math.max(0, Math.min(110, n)))
  }

  function getStatFor(id) {
    return stats.find(s => s.moduleId === id)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <p style={{ color: 'var(--ink-pale)', fontSize: 14 }}>Loading modules...</p>
    </div>
  )

  return (
    <div style={{ padding: '24px 20px 100px', maxWidth: 440, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 4 }}>
          TARGET {profile?.target_grade} · {weeksLeft} WEEKS LEFT
        </p>
        <h2 style={{ fontSize: 26, color: 'var(--ink)' }}>Your modules</h2>
      </div>

      {modules.map(mod => {
        const needed  = neededFinal(mod)
        const feasible = needed <= 100
        const recH    = mod.recommended_hours?.perWeek
        const stat    = getStatFor(mod.id)
        const doneH   = stat?.totalHours || 0
        const pct     = recH ? Math.min(100, Math.round((doneH / recH) * 100)) : 0

        return (
          <div key={mod.id} style={{
            background: 'var(--white)', borderRadius: 16, marginBottom: 12,
            border: `1.5px solid ${expanded === mod.id ? mod.color + '55' : 'var(--border-soft)'}`,
            borderLeft: `4px solid ${mod.color}`,
            overflow: 'hidden', transition: 'border-color 0.2s'
          }}>
            {/* Module header */}
            <div onClick={() => setExpanded(expanded === mod.id ? null : mod.id)}
              style={{ padding: '14px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--ink)', fontWeight: 600 }}>
                      {mod.name}
                    </h3>
                    {!feasible && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--terra)', background: 'var(--miss-bg)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.3px' }}>
                        AT RISK
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-soft)', flexWrap: 'wrap' }}>
                    <span>{mod.credits} credits</span>
                    {mod.mid_mark != null && <span>Mid: {mod.mid_mark}%</span>}
                    <span style={{ color: feasible ? 'var(--sage)' : 'var(--terra)', fontWeight: 600 }}>
                      Need {needed}% final
                    </span>
                    <span>Focus {mod.confidence_rating}/5</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  {recH ? (
                    <>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: mod.color }}>{recH}h</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>per week</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--ink-pale)' }}>No AI yet</div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {recH && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-pale)', marginBottom: 4 }}>
                    <span>{doneH.toFixed(1)}h studied</span>
                    <span>{Math.max(0, recH - doneH).toFixed(1)}h remaining this week</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--cream-deep)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: mod.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Expanded details */}
            {expanded === mod.id && (
              <div style={{ borderTop: '1px solid var(--border-soft)', padding: '16px' }}>

                {/* AI recommendation */}
                {mod.recommended_hours ? (
                  <div style={{ background: 'var(--sage-dim)', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                      AI Recommendation
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1, background: 'var(--white)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: mod.color }}>{mod.recommended_hours.perWeek}h</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase' }}>per week</div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--white)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: mod.color }}>{mod.recommended_hours.totalNeeded}h</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase' }}>total</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.6 }}>{mod.recommended_hours.reasoning}</p>
                    <button onClick={() => reAnalyze(mod.id)} disabled={analyzing[mod.id]}
                      style={{ marginTop: 10, padding: '5px 14px', borderRadius: 8, border: '1.5px solid var(--sage)', background: 'transparent', color: 'var(--sage)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      {analyzing[mod.id] ? 'Analysing...' : '↺ Re-analyse'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => reAnalyze(mod.id)} disabled={analyzing[mod.id] || !mod.overview_text}
                    className="btn-primary" style={{ marginBottom: 16, fontSize: 14 }}>
                    {analyzing[mod.id] ? 'Analysing with AI...'
                      : mod.overview_text ? '✦ Run AI Analysis'
                      : 'Add overview text to enable AI'}
                  </button>
                )}

                {/* Topics */}
                {mod.topics?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>Exam topics</p>
                    {mod.topics.map((t, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{t.topic}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: t.weight === 'high' ? 'var(--terra-dim)' : t.weight === 'medium' ? 'var(--gold-dim)' : 'var(--sage-dim)',
                            color: t.weight === 'high' ? 'var(--terra)' : t.weight === 'medium' ? 'var(--gold)' : 'var(--sage)'
                          }}>{t.weight}</span>
                        </div>
                        {t.subtopics?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {t.subtopics.map((st, j) => (
                              <span key={j} style={{ fontSize: 11, color: 'var(--ink-soft)', background: 'var(--cream-dark)', padding: '2px 8px', borderRadius: 6 }}>{st}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {stat?.totalSessions > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10 }}>Your performance</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { l: 'Hours', v: stat.totalHours + 'h' },
                        { l: 'Sessions', v: stat.totalSessions },
                        { l: 'Avg score', v: stat.avgEfficiency ? stat.avgEfficiency + '/100' : '—' }
                      ].map((c, i) => (
                        <div key={i} style={{ flex: 1, background: 'var(--cream-dark)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{c.v}</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 2 }}>{c.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
