import { useState } from 'react'
import { api } from '../api'

const COLORS = ['#00ff88','#ffaa00','#4488ff','#ff3b3b','#aa88ff']

const blank = (i) => ({
  name:'', credits:3, midMark:'', midWeight:30,
  confidenceRating:3, overviewText:'', color: COLORS[i]
})

export default function Setup({ onDone }) {
  const [step, setStep]         = useState(0) // 0=settings, 1=modules
  const [targetGrade, setGrade] = useState('A')
  const [examDate, setExam]     = useState('')
  const [wakeHour, setWake]     = useState(6)
  const [modules, setModules]   = useState([0,1,2,3,4].map(blank))
  const [open, setOpen]         = useState(0)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  function updateMod(i, k, v) {
    setModules(p => p.map((m, idx) => idx === i ? {...m, [k]: v} : m))
  }

  async function handleLaunch() {
    if (!modules.every(m => m.name.trim())) {
      setError('All 5 module names are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.profile.update({ wakeHour, targetGrade, examDate: examDate || null })
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i]
        const created = await api.modules.create({
          name: m.name, credits: m.credits,
          midMark: m.midMark !== '' ? m.midMark : null,
          midWeight: m.midWeight, confidenceRating: m.confidenceRating,
          overviewText: m.overviewText || null, color: m.color, displayOrder: i
        })
        if (m.overviewText?.trim()) {
          api.modules.analyze(created.id).catch(() => {})
        }
      }
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tag = { fontSize:10, color:'var(--text3)', fontWeight:600, letterSpacing:'1px', textTransform:'uppercase', marginBottom:6, display:'block', fontFamily:'JetBrains Mono, monospace' }
  const card = { background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:8, padding:'16px' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'24px 20px 48px', maxWidth:440, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--green)', letterSpacing:'2px', marginBottom:8 }}>STUDYOS // INIT</div>
        <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text)', marginBottom:6 }}>
          {step === 0 ? 'System setup' : 'Load modules'}
        </h1>
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
          {step === 0
            ? 'Set your target and schedule once. Cannot be changed after.'
            : 'Add all 5 modules. AI analyzes your overview and calculates study hours.'}
        </p>
      </div>

      {/* Step 0 — Settings */}
      {step === 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={card}>
            <span style={tag}>Target grade</span>
            <div style={{ display:'flex', gap:6 }}>
              {['A','B+','B'].map(g => (
                <button key={g} onClick={() => setGrade(g)} style={{
                  flex:1, padding:'10px', borderRadius:6, border:'1px solid',
                  borderColor: targetGrade===g ? 'var(--green)' : 'var(--border)',
                  background: targetGrade===g ? 'var(--green-dim)' : 'transparent',
                  color: targetGrade===g ? 'var(--green)' : 'var(--text3)',
                  fontWeight:700, fontSize:15, cursor:'pointer',
                  fontFamily:'JetBrains Mono, monospace'
                }}>{g}</button>
              ))}
            </div>
          </div>

          <div style={card}>
            <span style={tag}>Exam start date</span>
            <input type="date" value={examDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setExam(e.target.value)} />
          </div>

          <div style={card}>
            <span style={tag}>Morning study starts at</span>
            <select value={wakeHour} onChange={e => setWake(parseInt(e.target.value))}>
              {[4,5,6,7,8].map(h => (
                <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
            <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:4 }}>
              {[
                ['M1', `${String(wakeHour).padStart(2,'0')}:00 – ${String(wakeHour+2).padStart(2,'0')}:00`, '2h'],
                ['M2', `${String(wakeHour+2).padStart(2,'0')}:15 – ${String(wakeHour+4).padStart(2,'0')}:15`, '2h'],
                ['E1', '16:00 – 17:00', '1h'],
                ['E2', '17:15 – 18:15', '1h'],
                ['E3', '18:30 – 19:00', '30m'],
                ['N1', '20:30 – 23:00', '2.5h'],
              ].map(([k,t,d]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text3)', fontFamily:'JetBrains Mono, monospace' }}>{k}</span>
                  <span style={{ color:'var(--text2)' }}>{t}</span>
                  <span style={{ color:'var(--green)', fontFamily:'JetBrains Mono, monospace' }}>{d}</span>
                </div>
              ))}
              <div style={{ marginTop:4, fontSize:11, color:'var(--text3)', borderTop:'1px solid var(--border)', paddingTop:6 }}>
                Total: 9h study · 15min breaks between morning + evening slots
              </div>
            </div>
          </div>

          <button onClick={() => setStep(1)} style={{
            width:'100%', padding:'13px', borderRadius:8, border:'1px solid var(--green)',
            background:'var(--green-dim)', color:'var(--green)',
            fontSize:14, fontWeight:700, cursor:'pointer', letterSpacing:'1px'
          }}>CONTINUE →</button>
        </div>
      )}

      {/* Step 1 — Modules */}
      {step === 1 && (
        <div>
          {modules.map((mod, i) => (
            <div key={i} style={{
              background:'var(--bg1)', borderRadius:8, marginBottom:8,
              border:`1px solid ${open===i ? mod.color+'66' : 'var(--border)'}`,
              borderLeft:`3px solid ${mod.color}`, overflow:'hidden'
            }}>
              <div onClick={() => setOpen(open===i ? -1 : i)}
                style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:mod.color, width:20 }}>
                  {String(i+1).padStart(2,'0')}
                </span>
                <span style={{ flex:1, fontSize:14, fontWeight:600, color: mod.name ? 'var(--text)' : 'var(--text3)' }}>
                  {mod.name || `Module ${i+1}`}
                </span>
                {mod.name && (
                  <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'JetBrains Mono, monospace' }}>
                    {mod.credits}cr · C{mod.confidenceRating}
                  </span>
                )}
                <span style={{ color:'var(--text3)', fontSize:14 }}>{open===i ? '−' : '+'}</span>
              </div>

              {open === i && (
                <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--border)', paddingTop:14, display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <span style={tag}>Module name</span>
                      <input placeholder="e.g. Operating Systems" value={mod.name}
                        onChange={e => updateMod(i,'name',e.target.value)} />
                    </div>
                    <div style={{ width:68 }}>
                      <span style={tag}>Credits</span>
                      <input type="number" min="1" max="6" step="0.5" value={mod.credits}
                        onChange={e => updateMod(i,'credits',e.target.value)}
                        style={{ textAlign:'center' }} />
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <div style={{ flex:1 }}>
                      <span style={tag}>Mid mark (%)</span>
                      <input type="number" min="0" max="100" placeholder="e.g. 65" value={mod.midMark}
                        onChange={e => updateMod(i,'midMark',e.target.value)} />
                    </div>
                    <div style={{ flex:1 }}>
                      <span style={tag}>Mid weight (%)</span>
                      <input type="number" min="0" max="60" placeholder="e.g. 30" value={mod.midWeight}
                        onChange={e => updateMod(i,'midWeight',e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <span style={tag}>Focus level — 1 = needs most attention · 5 = comfortable</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => updateMod(i,'confidenceRating',n)} style={{
                          flex:1, padding:'8px 0', borderRadius:6,
                          border:`1px solid ${mod.confidenceRating===n ? mod.color : 'var(--border)'}`,
                          background: mod.confidenceRating===n ? mod.color+'22' : 'transparent',
                          color: mod.confidenceRating===n ? mod.color : 'var(--text3)',
                          fontWeight:700, fontSize:14, cursor:'pointer',
                          fontFamily:'JetBrains Mono, monospace'
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={tag}>Module overview (paste syllabus or course doc)</span>
                    <textarea placeholder="Paste your module outline here. AI will extract exam topics and calculate your recommended weekly hours based on your marks, focus level, and content density."
                      value={mod.overviewText}
                      onChange={e => updateMod(i,'overviewText',e.target.value)}
                      style={{ minHeight:90, resize:'vertical', lineHeight:1.6 }} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {error && (
            <div style={{ background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--red)', marginTop:8 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={() => setStep(0)} style={{
              padding:'13px 20px', borderRadius:8, border:'1px solid var(--border)',
              background:'transparent', color:'var(--text2)', fontSize:13, cursor:'pointer'
            }}>← Back</button>
            <button onClick={handleLaunch} disabled={saving} style={{
              flex:1, padding:'13px', borderRadius:8,
              border:`1px solid ${saving ? 'var(--border)' : 'var(--green)'}`,
              background: saving ? 'transparent' : 'var(--green-dim)',
              color: saving ? 'var(--text3)' : 'var(--green)',
              fontSize:14, fontWeight:700, cursor: saving ? 'default' : 'pointer', letterSpacing:'1px'
            }}>{saving ? 'INITIALIZING...' : 'LAUNCH STUDYOS →'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
