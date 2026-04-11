import { useState, useEffect } from 'react'
import { api } from '../api'
import useAuth from '../store/auth'

function CircleProgress({ pct, color, size = 54 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e1e" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  )
}

export default function ModulesPage() {
  const { profile } = useAuth()
  const [modules, setModules]   = useState([])
  const [stats, setStats]       = useState([])
  const [expanded, setExpanded] = useState(null)
  const [analyzing, setAnalyzing] = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [mods, st] = await Promise.all([api.modules.list(), api.sessions.stats()])
      setModules(mods)
      setStats(st)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function triggerAnalysis(moduleId) {
    setAnalyzing(p => ({ ...p, [moduleId]: true }))
    try {
      const updated = await api.modules.analyze(moduleId)
      setModules(prev => prev.map(m => m.id === moduleId ? updated : m))
    } catch (err) {
      alert('AI analysis failed: ' + err.message)
    } finally {
      setAnalyzing(p => ({ ...p, [moduleId]: false }))
    }
  }

  const GRADE_TARGETS = { 'A': 75, 'B+': 70, 'B': 65 }
  const targetPct = GRADE_TARGETS[profile?.target_grade] || 75

  const weeksLeft = profile?.exam_date
    ? Math.max(1, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24 * 7)))
    : 5

  function getRequiredFinal(mod) {
    if (!mod.mid_weight || !mod.mid_mark) return targetPct
    const needed = (targetPct - (mod.mid_weight / 100) * mod.mid_mark) / ((100 - mod.mid_weight) / 100)
    return Math.round(Math.max(0, Math.min(100, needed)))
  }

  function getStatForModule(moduleId) {
    return stats.find(s => s.moduleId === moduleId)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading modules...</div>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Modules</h2>
        <p style={{ fontSize: 13, color: '#555' }}>
          Target {profile?.target_grade} · {weeksLeft} weeks left
        </p>
      </div>

      {modules.map(mod => {
        const stat = getStatForModule(mod.id)
        const requiredFinal = getRequiredFinal(mod)
        const isFeasible = requiredFinal <= 100
        const recommendedHours = mod.recommended_hours?.perWeek
        const hoursThisWeek = stat?.totalHours || 0
        const weeklyTarget = recommendedHours || 0
        const pct = weeklyTarget > 0 ? Math.min(100, Math.round((hoursThisWeek / weeklyTarget) * 100)) : 0

        return (
          <div key={mod.id} style={{
            background: '#111', borderRadius: 12, marginBottom: 10,
            border: '1px solid #1e1e1e', borderLeft: `3px solid ${mod.color}`, overflow: 'hidden'
          }}>
            <div onClick={() => setExpanded(expanded === mod.id ? null : mod.id)}
              style={{ padding: '14px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <CircleProgress pct={pct} color={mod.color} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: mod.color }}>
                    {pct}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0', marginBottom: 4 }}>{mod.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{mod.credits} cr</span>
                    {mod.mid_mark && <span style={{ fontSize: 11, color: '#555' }}>Mid: {mod.mid_mark}%</span>}
                    <span style={{ fontSize: 11, fontWeight: 600, color: isFeasible ? mod.color : '#E8526A' }}>
                      Need {requiredFinal}% final
                    </span>
                    <span style={{ fontSize: 11, color: '#444' }}>Confidence: {mod.confidence_rating}/5</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {recommendedHours ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{recommendedHours}h</div>
                      <div style={{ fontSize: 11, color: '#555' }}>per week</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: '#555' }}>No AI yet</div>
                  )}
                </div>
              </div>

              {recommendedHours && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginBottom: 4 }}>
                    <span>This week: {hoursThisWeek.toFixed(1)}h</span>
                    <span>{Math.max(0, weeklyTarget - hoursThisWeek).toFixed(1)}h remaining</span>
                  </div>
                  <div style={{ height: 4, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: mod.color, borderRadius: 2, transition: 'width 0.4s' }}/>
                  </div>
                </div>
              )}
            </div>

            {expanded === mod.id && (
              <div style={{ borderTop: '1px solid #1e1e1e', padding: 14 }}>

                {!isFeasible && (
                  <div style={{ background: '#1f0d0d', border: '1px solid #3d1a1a', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: '#E8526A', fontWeight: 600, marginBottom: 2 }}>⚠ Target may not be achievable</div>
                    <div style={{ fontSize: 12, color: '#c88' }}>You need {requiredFinal}% in finals. Consider adjusting your target grade.</div>
                  </div>
                )}

                {/* AI Recommendation */}
                {mod.recommended_hours ? (
                  <div style={{ background: '#0d1020', borderRadius: 8, padding: '12px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#7C6FE0', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 6 }}>AI RECOMMENDATION</div>
                    <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, marginBottom: 10 }}>
                      {mod.recommended_hours.reasoning}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: '#111', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: mod.color }}>{mod.recommended_hours.perWeek}h</div>
                        <div style={{ fontSize: 10, color: '#555' }}>per week</div>
                      </div>
                      <div style={{ flex: 1, background: '#111', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: mod.color }}>{mod.recommended_hours.totalNeeded}h</div>
                        <div style={{ fontSize: 10, color: '#555' }}>total needed</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerAnalysis(mod.id)}
                    disabled={analyzing[mod.id] || !mod.overview_text}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #7C6FE044',
                      background: '#0d0d1a', color: analyzing[mod.id] ? '#555' : '#7C6FE0',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14
                    }}>
                    {analyzing[mod.id] ? '⟳ Analyzing with AI...' : mod.overview_text ? '✦ Run AI Analysis' : 'Add overview text to enable AI analysis'}
                  </button>
                )}

                {/* Topics */}
                {mod.topics?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 10 }}>EXAM TOPICS</div>
                    {mod.topics.map((t, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>{t.topic}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                            background: t.weight === 'high' ? '#1f1a0d' : t.weight === 'medium' ? '#0d1020' : '#0f1a0f',
                            color: t.weight === 'high' ? '#F5A623' : t.weight === 'medium' ? '#7C6FE0' : '#2ECC9A'
                          }}>{t.weight}</span>
                        </div>
                        {t.subtopics?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {t.subtopics.map((st, j) => (
                              <span key={j} style={{ fontSize: 11, color: '#666', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>{st}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* Session stats */}
                {stat && stat.totalSessions > 0 && (
                  <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8 }}>YOUR STATS</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{stat.totalHours}h</div>
                        <div style={{ fontSize: 10, color: '#555' }}>studied</div>
                      </div>
                      <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: mod.color }}>{stat.avgEfficiency || '—'}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>avg score</div>
                      </div>
                      <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{stat.totalSessions}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>sessions</div>
                      </div>
                    </div>
                    {stat.trend?.length > 1 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Efficiency trend (last 5)</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 36 }}>
                          {stat.trend.map((score, i) => (
                            <div key={i} style={{
                              flex: 1, borderRadius: 3,
                              height: `${Math.round((score / 100) * 36)}px`,
                              background: score >= 80 ? '#2ECC9A' : score >= 65 ? '#7C6FE0' : '#E8526A'
                            }}/>
                          ))}
                        </div>
                      </div>
                    )}
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
