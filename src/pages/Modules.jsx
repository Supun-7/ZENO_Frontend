import { useState, useEffect } from 'react'
import { api } from '../api'

export default function ModulesPage({ profile }) {
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
      setModules(m); setStats(s)
    } finally { setLoading(false) }
  }

  async function runAnalysis(id) {
    setAnalyzing(p => ({...p, [id]:true}))
    try {
      const updated = await api.modules.analyze(id)
      setModules(p => p.map(m => m.id===id ? updated : m))
    } catch(err) { alert('Analysis failed: ' + err.message) }
    finally { setAnalyzing(p => ({...p, [id]:false})) }
  }

  const GRADE_MIN = { 'A':75, 'B+':70, 'B':65 }
  const targetPct = GRADE_MIN[profile?.target_grade] || 75

  const weeksLeft = profile?.exam_date
    ? Math.max(1, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000*60*60*24*7)))
    : 5

  function requiredFinal(mod) {
    if (!mod.mid_weight || mod.mid_mark == null) return targetPct
    const needed = (targetPct - (mod.mid_weight/100) * mod.mid_mark) / ((100-mod.mid_weight)/100)
    return Math.round(Math.max(0, Math.min(100, needed)))
  }

  const tag = { fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)', letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:4 }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'var(--text3)' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--green)', letterSpacing:'2px', marginBottom:4 }}>STUDYOS // MODULES</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Module targets</h2>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--text3)' }}>
          TARGET: {profile?.target_grade}  ·  WEEKS LEFT: {weeksLeft}
        </div>
      </div>

      {modules.map(mod => {
        const stat     = stats.find(s => s.moduleId===mod.id)
        const needed   = requiredFinal(mod)
        const feasible = needed <= 100
        const recHours = mod.recommended_hours?.perWeek
        const doneH    = stat?.totalHours || 0
        const pct      = recHours ? Math.min(100, Math.round((doneH/recHours)*100)) : 0

        return (
          <div key={mod.id} style={{
            background:'var(--bg1)', borderRadius:6, marginBottom:8,
            border:`1px solid ${expanded===mod.id ? mod.color+'44' : 'var(--border)'}`,
            borderLeft:`2px solid ${mod.color}`, overflow:'hidden'
          }}>
            <div onClick={() => setExpanded(expanded===mod.id ? null : mod.id)}
              style={{ padding:'12px 14px', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:15, fontWeight:700, color:mod.color }}>{mod.name}</span>
                    {!feasible && <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--red)', background:'var(--red-dim)', padding:'2px 6px', borderRadius:3 }}>AT RISK</span>}
                  </div>
                  <div style={{ display:'flex', gap:12, fontFamily:'JetBrains Mono, monospace', fontSize:11, flexWrap:'wrap' }}>
                    <span style={{ color:'var(--text3)' }}>{mod.credits}CR</span>
                    {mod.mid_mark != null && <span style={{ color:'var(--text3)' }}>MID:{mod.mid_mark}%</span>}
                    <span style={{ color: feasible ? mod.color : 'var(--red)' }}>NEED:{needed}%</span>
                    <span style={{ color:'var(--text3)' }}>C{mod.confidence_rating}/5</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {recHours ? (
                    <>
                      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:20, fontWeight:700, color:'var(--text)' }}>{recHours}h</div>
                      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)' }}>PER WEEK</div>
                    </>
                  ) : (
                    <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)' }}>NO AI YET</div>
                  )}
                </div>
              </div>

              {recHours && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)', marginBottom:4 }}>
                    <span>{doneH.toFixed(1)}h done this week</span>
                    <span>{Math.max(0, recHours-doneH).toFixed(1)}h remaining</span>
                  </div>
                  <div style={{ height:3, background:'var(--bg3)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:mod.color, borderRadius:2, transition:'width 0.4s' }}/>
                  </div>
                </div>
              )}
            </div>

            {expanded===mod.id && (
              <div style={{ borderTop:'1px solid var(--border)', padding:14 }}>

                {!mod.recommended_hours ? (
                  <button onClick={() => runAnalysis(mod.id)} disabled={analyzing[mod.id] || !mod.overview_text}
                    style={{
                      width:'100%', padding:'10px', borderRadius:4, marginBottom:14,
                      border:`1px solid ${mod.overview_text && !analyzing[mod.id] ? mod.color : 'var(--border)'}`,
                      background: mod.overview_text && !analyzing[mod.id] ? mod.color+'11' : 'transparent',
                      color: mod.overview_text && !analyzing[mod.id] ? mod.color : 'var(--text3)',
                      fontSize:11, fontWeight:700, cursor: mod.overview_text ? 'pointer' : 'default',
                      fontFamily:'JetBrains Mono, monospace', letterSpacing:'1px'
                    }}>
                    {analyzing[mod.id] ? '⟳ ANALYZING...' : mod.overview_text ? '✦ RUN AI ANALYSIS' : 'ADD OVERVIEW TO ENABLE AI'}
                  </button>
                ) : (
                  <div style={{ background:'#00ff8808', border:'1px solid var(--green-dim)', borderRadius:6, padding:12, marginBottom:14 }}>
                    <span style={tag}>AI RECOMMENDATION</span>
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      <div style={{ flex:1, background:'var(--bg2)', borderRadius:4, padding:'8px', textAlign:'center' }}>
                        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:700, color:mod.color }}>{mod.recommended_hours.perWeek}h</div>
                        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)' }}>PER WEEK</div>
                      </div>
                      <div style={{ flex:1, background:'var(--bg2)', borderRadius:4, padding:'8px', textAlign:'center' }}>
                        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:700, color:mod.color }}>{mod.recommended_hours.totalNeeded}h</div>
                        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)' }}>TOTAL</div>
                      </div>
                    </div>
                    <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{mod.recommended_hours.reasoning}</p>
                    <button onClick={() => runAnalysis(mod.id)} disabled={analyzing[mod.id]}
                      style={{ marginTop:10, padding:'4px 10px', borderRadius:4, border:'1px solid var(--border)', background:'transparent', color:'var(--text3)', fontSize:10, cursor:'pointer', fontFamily:'JetBrains Mono, monospace' }}>
                      {analyzing[mod.id] ? '⟳ RUNNING...' : '↺ RE-ANALYZE'}
                    </button>
                  </div>
                )}

                {mod.topics?.length > 0 && (
                  <>
                    <span style={tag}>EXAM TOPICS</span>
                    {mod.topics.map((t, i) => (
                      <div key={i} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{t.topic}</span>
                          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, padding:'2px 6px', borderRadius:3, fontWeight:700,
                            background: t.weight==='high' ? 'var(--amber-dim)' : t.weight==='medium' ? 'var(--blue-dim)' : 'var(--green-dim)',
                            color: t.weight==='high' ? 'var(--amber)' : t.weight==='medium' ? 'var(--blue)' : 'var(--green)'
                          }}>{t.weight.toUpperCase()}</span>
                        </div>
                        {t.subtopics?.length > 0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                            {t.subtopics.map((st, j) => (
                              <span key={j} style={{ fontSize:11, color:'var(--text3)', background:'var(--bg2)', padding:'2px 8px', borderRadius:3, fontFamily:'JetBrains Mono, monospace' }}>{st}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {stat?.totalSessions > 0 && (
                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginTop:12 }}>
                    <span style={tag}>PERFORMANCE</span>
                    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                      {[
                        { l:'HOURS', v: stat.totalHours+'h' },
                        { l:'SESSIONS', v: stat.totalSessions },
                        { l:'AVG SCORE', v: stat.avgEfficiency ? stat.avgEfficiency+'/100' : '—' },
                      ].map((c,i) => (
                        <div key={i} style={{ flex:1, background:'var(--bg2)', borderRadius:4, padding:'8px', textAlign:'center' }}>
                          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:16, fontWeight:700, color: i===2 && stat.avgEfficiency ? (stat.avgEfficiency>=80?'var(--green)':stat.avgEfficiency>=65?'var(--amber)':'var(--red)') : 'var(--text)' }}>{c.v}</div>
                          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)' }}>{c.l}</div>
                        </div>
                      ))}
                    </div>
                    {stat.trend?.length > 1 && (
                      <div>
                        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)', marginBottom:4 }}>EFFICIENCY TREND</div>
                        <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:28 }}>
                          {stat.trend.map((s,i) => (
                            <div key={i} style={{ flex:1, borderRadius:2, height:`${Math.round((s/100)*28)}px`,
                              background: s>=80 ? 'var(--green)' : s>=65 ? 'var(--amber)' : 'var(--red)' }}/>
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
