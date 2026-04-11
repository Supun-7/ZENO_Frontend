import { useState, useEffect } from 'react'
import { format, startOfWeek } from 'date-fns'
import { api } from '../api'

export default function StatsPage() {
  const [stats, setStats]       = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      const [st, an] = await Promise.all([
        api.sessions.stats(),
        api.sessions.weeklyAnalysis(weekStart).catch(() => null)
      ])
      setStats(st)
      setAnalysis(an)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalHours    = stats.reduce((s, m) => s + m.totalHours, 0)
  const totalSessions = stats.reduce((s, m) => s + m.totalSessions, 0)
  const allScores     = stats.flatMap(m => m.trend || []).filter(Boolean)
  const avgEff        = allScores.length ? Math.round(allScores.reduce((a,b) => a+b,0) / allScores.length) : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading stats...</div>
    </div>
  )

  return (
    <div style={{ padding: '16px 16px 100px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Stats</h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Total hours', value: totalHours.toFixed(1) + 'h', color: '#fff' },
          { label: 'Sessions',    value: totalSessions,               color: '#2ECC9A' },
          { label: 'Avg score',   value: avgEff ? avgEff + '/100' : '—', color: '#7C6FE0' },
        ].map((c, i) => (
          <div key={i} style={{ background: '#111', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* AI Weekly Analysis */}
      {analysis && (
        <div style={{ background: '#0d1020', border: '1px solid #7C6FE033', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#7C6FE0', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8 }}>AI WEEKLY ANALYSIS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: analysis.overallScore >= 75 ? '#2ECC9A' : analysis.overallScore >= 60 ? '#7C6FE0' : '#E8526A' }}>
              {analysis.overallScore}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e0e0e0' }}>{analysis.weekLabel}</div>
              <div style={{ fontSize: 12, color: '#555' }}>this week</div>
            </div>
          </div>
          {analysis.highlights?.map((h, i) => (
            <div key={i} style={{ fontSize: 13, color: '#2ECC9A', marginBottom: 4 }}>✓ {h}</div>
          ))}
          {analysis.concerns?.map((c, i) => (
            <div key={i} style={{ fontSize: 13, color: '#F5A623', marginBottom: 4 }}>⚠ {c}</div>
          ))}
          {analysis.nextWeekFocus && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#111', borderRadius: 8, fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>
              💡 Next week: {analysis.nextWeekFocus}
            </div>
          )}
        </div>
      )}

      {/* Per module breakdown */}
      <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 10 }}>PER MODULE</div>
      {stats.map(mod => (
        <div key={mod.moduleId} style={{ background: '#111', borderRadius: 10, padding: '12px 14px', marginBottom: 8, borderLeft: `3px solid ${mod.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: mod.color }}>{mod.moduleName}</span>
            <span style={{ fontSize: 13, color: '#888' }}>
              {mod.avgEfficiency ? `avg ${mod.avgEfficiency}/100` : 'no sessions yet'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: mod.trend?.length > 1 ? 10 : 0 }}>
            <span style={{ fontSize: 12, color: '#555' }}>{mod.totalHours}h studied</span>
            <span style={{ fontSize: 12, color: '#555' }}>{mod.totalSessions} sessions</span>
            {mod.recommendedHours && (
              <span style={{ fontSize: 12, color: mod.color }}>{mod.recommendedHours}h/wk target</span>
            )}
          </div>

          {mod.trend?.length > 1 && (
            <div>
              <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>Efficiency trend</div>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28 }}>
                {mod.trend.map((score, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    height: `${Math.round((score / 100) * 28)}px`,
                    background: score >= 80 ? '#2ECC9A' : score >= 65 ? '#7C6FE0' : '#E8526A'
                  }}/>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {totalSessions === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#333' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 14 }}>Complete sessions to see your stats</div>
        </div>
      )}
    </div>
  )
}
