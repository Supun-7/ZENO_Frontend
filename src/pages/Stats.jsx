import { useState, useEffect } from 'react'
import { format, startOfWeek } from 'date-fns'
import { api } from '../api'

export default function StatsPage() {
  const [stats, setStats]     = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn:1 }), 'yyyy-MM-dd')
      const [st, an] = await Promise.all([
        api.sessions.stats(),
        api.sessions.weeklyAnalysis(weekStart).catch(() => null)
      ])
      setStats(st); setAnalysis(an)
    } finally { setLoading(false) }
  }

  const totalHours    = stats.reduce((s,m) => s+m.totalHours, 0)
  const totalSessions = stats.reduce((s,m) => s+m.totalSessions, 0)
  const allScores     = stats.flatMap(m => m.trend||[]).filter(Boolean)
  const avgEff        = allScores.length ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length) : null

  const tag = { fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)', letterSpacing:'1px', display:'block', marginBottom:8 }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'var(--text3)' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--green)', letterSpacing:'2px', marginBottom:4 }}>STUDYOS // STATS</div>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--text)' }}>Performance</h2>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:16 }}>
        {[
          { l:'TOTAL HRS', v:totalHours.toFixed(1)+'h', c:'var(--text)' },
          { l:'SESSIONS',  v:totalSessions,              c:'var(--green)' },
          { l:'AVG SCORE', v:avgEff ? avgEff+'/100' : '—', c: avgEff ? (avgEff>=80?'var(--green)':avgEff>=65?'var(--amber)':'var(--red)') : 'var(--text3)' },
        ].map((c,i) => (
          <div key={i} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:6, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'var(--text3)', marginBottom:6 }}>{c.l}</div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:18, fontWeight:700, color:c.c }}>{c.v}</div>
          </div>
        ))}
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div style={{ background:'var(--bg1)', border:'1px solid var(--green-dim)', borderRadius:6, padding:14, marginBottom:16 }}>
          <span style={tag}>// AI WEEKLY ANALYSIS</span>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:36, fontWeight:700,
              color: analysis.overallScore>=75 ? 'var(--green)' : analysis.overallScore>=60 ? 'var(--amber)' : 'var(--red)' }}>
              {analysis.overallScore}
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{analysis.weekLabel}</div>
              <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'var(--text3)' }}>THIS WEEK</div>
            </div>
          </div>
          {analysis.highlights?.map((h,i) => (
            <div key={i} style={{ fontSize:13, color:'var(--green)', marginBottom:4 }}>✓ {h}</div>
          ))}
          {analysis.concerns?.map((c,i) => (
            <div key={i} style={{ fontSize:13, color:'var(--amber)', marginBottom:4 }}>⚠ {c}</div>
          ))}
          {analysis.nextWeekFocus && (
            <div style={{ marginTop:10, padding:'10px 12px', background:'var(--bg2)', borderRadius:4, fontSize:13, color:'var(--text2)', lineHeight:1.5, borderLeft:'2px solid var(--green)' }}>
              → {analysis.nextWeekFocus}
            </div>
          )}
        </div>
      )}

      {/* Per module */}
      <span style={tag}>// PER MODULE</span>
      {stats.map(mod => (
        <div key={mod.moduleId} style={{ background:'var(--bg1)', borderRadius:6, marginBottom:6, padding:'12px 14px', borderLeft:`2px solid ${mod.color}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:14, fontWeight:700, color:mod.color }}>{mod.moduleName}</span>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11,
              color: mod.avgEfficiency ? (mod.avgEfficiency>=80?'var(--green)':mod.avgEfficiency>=65?'var(--amber)':'var(--red)') : 'var(--text3)' }}>
              {mod.avgEfficiency ? mod.avgEfficiency+'/100' : 'NO DATA'}
            </span>
          </div>
          <div style={{ display:'flex', gap:16, fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--text3)', marginBottom: mod.trend?.length>1 ? 10 : 0 }}>
            <span>{mod.totalHours}h</span>
            <span>{mod.totalSessions} sessions</span>
            {mod.recommendedHours && <span style={{ color:mod.color }}>{mod.recommendedHours}h/wk target</span>}
          </div>
          {mod.trend?.length > 1 && (
            <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:24 }}>
              {mod.trend.map((s,i) => (
                <div key={i} style={{ flex:1, borderRadius:2, height:`${Math.round((s/100)*24)}px`,
                  background: s>=80?'var(--green)':s>=65?'var(--amber)':'var(--red)' }}/>
              ))}
            </div>
          )}
        </div>
      ))}

      {totalSessions === 0 && (
        <div style={{ textAlign:'center', padding:'40px 0' }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'var(--text3)' }}>// NO SESSION DATA YET</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginTop:8 }}>Complete study sessions to see performance stats</div>
        </div>
      )}
    </div>
  )
}
