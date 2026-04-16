import { useState } from 'react'
import { api } from '../api'

const MODULE_COLORS = ['#5C8A6B','#C0604A','#C9943A','#5B7EC4','#9B6EC4']

// ── PRE-FILLED with Supun's data ────────────────────────────────────────────
const PREFILLED_MODULES = [
  {
    name: 'Operating Systems',
    credits: 3,
    midMark: 65,           // 13/20 → 65%
    midWeight: 20,         // 20 from mid (out of 100 total: 60 final + 20 mid + 20 lab)
    confidenceRating: 3,
    overviewText: '',
    color: MODULE_COLORS[0],
    note: 'Final: 60 marks. Mid: 20 marks (scored 13/20). Lab test: 20 marks (not yet done).'
  },
  {
    name: 'Programming Paradigms',
    credits: 4,
    midMark: 13.9,         // raw mark (out of what? treating as percentage-style entry)
    midWeight: 30,
    confidenceRating: 3,
    overviewText: '',
    color: MODULE_COLORS[4],
    note: 'Final paper: 60 marks. 4 credit module. Mid mark: 13.9.'
  },
  {
    name: 'Software Engineering',
    credits: 3,
    midMark: 75,           // 15/20 → 75%
    midWeight: 20,         // 20 mid + 30 assignment/project + 50 final
    confidenceRating: 3,
    overviewText: '',
    color: MODULE_COLORS[3],
    note: 'Final: 50 marks. Mid: 20 marks (scored 15/20). Assignment+Project: 30 marks (project pending).'
  },
  {
    name: 'Distributed Systems',
    credits: 3,
    midMark: 55,           // 11/20 → 55%
    midWeight: 20,
    confidenceRating: 3,
    overviewText: '',
    color: MODULE_COLORS[1],
    note: 'Final: 60 marks. Mid: 20 marks (scored 11/20). Labs+Project: 20 marks (not yet done).'
  },
  {
    name: 'Human Computer Interaction',
    credits: 3,
    midMark: null,
    midWeight: 40,
    confidenceRating: 3,
    overviewText: '',
    color: MODULE_COLORS[2],
    note: 'Final: 60 marks. No mid exam.'
  },
]

const SLOT_LABELS = {
  S1: '08:30 – 10:30',
  S2: '10:45 – 12:30',
  S3: '13:30 – 14:30',
  S4: '14:45 – 16:00',
}

export default function Setup({ onDone }) {
  const [step, setStep]         = useState(0)
  const [targetGrade, setGrade] = useState('A')
  const [examDate, setExam]     = useState('')
  const [modules, setModules]   = useState(
    PREFILLED_MODULES.map((m, i) => ({ ...m, color: MODULE_COLORS[i] }))
  )
  const [openMod, setOpenMod]   = useState(0)
  const [weekendSlots, setWeekend] = useState({
    sat_s1:true, sat_s2:true, sat_s3:false, sat_s4:false,
    sun_s1:false, sun_s2:false, sun_s3:false, sun_s4:false,
  })
  const [generating, setGenerating] = useState(false)
  const [genStatus, setGenStatus]   = useState('')
  const [error, setError]           = useState('')

  function updateMod(i, k, v) {
    setModules(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
  }

  async function handleGenerate() {
    if (!modules.every(m => m.name.trim())) {
      setError('Please fill in all 5 module names')
      return
    }
    setGenerating(true)
    setError('')
    try {
      setGenStatus('Saving your settings...')
      await api.profile.update({ targetGrade, examDate: examDate || null, ...weekendSlots })

      setGenStatus('Saving modules...')
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i]
        await api.modules.create({
          name: m.name, credits: m.credits,
          midMark: m.midMark !== '' && m.midMark != null ? m.midMark : null,
          midWeight: m.midWeight,
          confidenceRating: m.confidenceRating,
          overviewText: m.overviewText || null,
          color: m.color, displayOrder: i
        })
      }

      setGenStatus('AI is building your study plan...')
      await api.plan.generate()

      setGenStatus('Done!')
      onDone()
    } catch (err) {
      setError(err.message)
      setGenerating(false)
      setGenStatus('')
    }
  }

  const Blob = ({ color, size, top, left, opacity = 0.1 }) => (
    <div style={{ position:'absolute', top, left, width:size, height:size, borderRadius:'50%', background:color, filter:'blur(36px)', opacity, pointerEvents:'none', zIndex:0 }} />
  )

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', padding:'32px 20px 60px', maxWidth:440, margin:'0 auto', position:'relative', overflow:'hidden' }}>
      <Blob color="var(--sage)"  size={220} top={-80}  left={-70} />
      <Blob color="var(--terra)" size={170} top={350}  left={280} />
      <Blob color="var(--gold)"  size={150} top={650}  left={-50} opacity={0.08} />

      <div style={{ position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ marginBottom:32, textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'2px', textTransform:'uppercase', color:'var(--sage)', marginBottom:10 }}>ZENO</div>
          <h1 style={{ fontSize:30, fontWeight:700, color:'var(--ink)', marginBottom:8, lineHeight:1.2, letterSpacing:'-0.3px' }}>
            {step === 0 ? "Let's get you set up" : step === 1 ? 'Your modules' : 'Weekend schedule'}
          </h1>
          <p style={{ fontSize:14, color:'var(--ink-soft)', lineHeight:1.6 }}>
            {step === 0 && 'Your data is pre-filled. Review and set your exam date.'}
            {step === 1 && 'Modules pre-filled with your marks. Edit anything needed.'}
            {step === 2 && 'Choose which weekend slots you want to study in.'}
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:28 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === step ? 28 : 8, height:8, borderRadius:4,
              background: i === step ? 'var(--sage)' : i < step ? 'var(--sage-light)' : 'var(--border)',
              transition:'all 0.3s'
            }} />
          ))}
        </div>

        {/* ── Step 0: Basics ── */}
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="card">
              <span className="field-label">Target grade</span>
              <div style={{ display:'flex', gap:8 }}>
                {['A','B+','B'].map(g => (
                  <button key={g} onClick={() => setGrade(g)} style={{
                    flex:1, padding:'12px', borderRadius:12,
                    border:`2px solid ${targetGrade === g ? 'var(--sage)' : 'var(--border)'}`,
                    background: targetGrade === g ? 'var(--sage-dim)' : 'transparent',
                    color: targetGrade === g ? 'var(--sage)' : 'var(--ink-soft)',
                    fontWeight:800, fontSize:17, cursor:'pointer',
                    fontFamily:'Fraunces, serif', transition:'all 0.2s'
                  }}>{g}</button>
                ))}
              </div>
            </div>

            <div className="card">
              <span className="field-label">Exam start date</span>
              <input type="date" value={examDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setExam(e.target.value)} />
            </div>

            <div className="card">
              <span className="field-label">Daily study slots (fixed)</span>
              {Object.entries(SLOT_LABELS).map(([key, time]) => (
                <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border-soft)' }}>
                  <span style={{ fontSize:13, color:'var(--ink-mid)', fontWeight:600 }}>{key}</span>
                  <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{time}</span>
                  <span style={{ fontSize:12, color:'var(--sage)', fontWeight:700 }}>
                    {key==='S1'?'2h':key==='S2'?'1h 45m':key==='S3'?'1h':'1h 15m'}
                  </span>
                </div>
              ))}
              <p style={{ fontSize:11, color:'var(--ink-pale)', marginTop:10 }}>6 hours total per weekday</p>
            </div>

            <button className="btn-primary" onClick={() => setStep(1)}>Continue →</button>
          </div>
        )}

        {/* ── Step 1: Modules ── */}
        {step === 1 && (
          <div>
            {/* Info banner */}
            <div style={{ background:'var(--done-bg)', border:'1.5px solid var(--done-border)', borderRadius:12, padding:'11px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:16 }}>✓</span>
              <p style={{ fontSize:13, color:'var(--sage)', fontWeight:500, lineHeight:1.5 }}>
                Pre-filled with your marks. Mid % values are converted from raw scores. Tap each module to review or edit.
              </p>
            </div>

            {modules.map((mod, i) => (
              <div key={i} style={{
                background:'var(--white)', borderRadius:16, marginBottom:10, overflow:'hidden',
                border:`1.5px solid ${openMod === i ? mod.color + '88' : 'var(--border-soft)'}`,
                borderLeft:`5px solid ${mod.color}`,
                transition:'border-color 0.2s',
                boxShadow:'var(--card-shadow)',
              }}>
                <div onClick={() => setOpenMod(openMod === i ? -1 : i)}
                  style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                  <div style={{ width:30, height:30, borderRadius:10, background:mod.color+'20', border:`1.5px solid ${mod.color}55`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'Fraunces,serif', fontSize:14, fontWeight:700, color:mod.color }}>{i+1}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:mod.name ? 'var(--ink)' : 'var(--ink-pale)' }}>
                      {mod.name || `Module ${i+1}`}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-pale)', marginTop:2 }}>
                      {mod.credits} credits · Focus {mod.confidenceRating}/5
                      {mod.midMark != null && mod.midMark !== '' && ` · Mid ${mod.midMark}%`}
                    </div>
                  </div>
                  <span style={{ color:'var(--ink-pale)', fontSize:20, lineHeight:1, fontWeight:300 }}>
                    {openMod === i ? '−' : '+'}
                  </span>
                </div>

                {openMod === i && (
                  <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border-soft)' }}>
                    {/* Note banner */}
                    {mod.note && (
                      <div style={{ marginTop:14, marginBottom:14, background:'var(--cream)', borderRadius:10, padding:'10px 13px', fontSize:12, color:'var(--ink-soft)', lineHeight:1.5, fontStyle:'italic' }}>
                        ℹ️ {mod.note}
                      </div>
                    )}

                    <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                      <div style={{ flex:1 }}>
                        <span className="field-label">Module name</span>
                        <input placeholder="e.g. Operating Systems" value={mod.name}
                          onChange={e => updateMod(i, 'name', e.target.value)} />
                      </div>
                      <div style={{ width:80 }}>
                        <span className="field-label">Credits</span>
                        <input type="number" min="1" max="6" step="0.5" value={mod.credits}
                          onChange={e => updateMod(i, 'credits', e.target.value)}
                          style={{ textAlign:'center' }} />
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                      <div style={{ flex:1 }}>
                        <span className="field-label">Mid mark (%)</span>
                        <input type="number" min="0" max="100" placeholder="e.g. 65" value={mod.midMark ?? ''}
                          onChange={e => updateMod(i, 'midMark', e.target.value)} />
                      </div>
                      <div style={{ flex:1 }}>
                        <span className="field-label">Mid weight (%)</span>
                        <input type="number" min="0" max="60" placeholder="e.g. 30" value={mod.midWeight}
                          onChange={e => updateMod(i, 'midWeight', e.target.value)} />
                      </div>
                    </div>

                    <div style={{ marginBottom:12 }}>
                      <span className="field-label">Focus level (1 = needs most attention, 5 = comfortable)</span>
                      <div style={{ display:'flex', gap:6 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => updateMod(i, 'confidenceRating', n)} style={{
                            flex:1, padding:'10px 0', borderRadius:10,
                            border:`1.5px solid ${mod.confidenceRating === n ? mod.color : 'var(--border)'}`,
                            background: mod.confidenceRating === n ? mod.color+'18' : 'transparent',
                            color: mod.confidenceRating === n ? mod.color : 'var(--ink-soft)',
                            fontWeight:800, fontSize:15, cursor:'pointer',
                            fontFamily:'Outfit,sans-serif', transition:'all 0.15s'
                          }}>{n}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="field-label">Module overview (optional — AI reads this to plan hours)</span>
                      <textarea placeholder="Paste your syllabus or course description..." value={mod.overviewText}
                        onChange={e => updateMod(i, 'overviewText', e.target.value)}
                        style={{ minHeight:80, resize:'vertical', lineHeight:1.6 }} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button className="btn-secondary" onClick={() => setStep(0)} style={{ width:'auto', padding:'13px 20px' }}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(2)}
                disabled={!modules.every(m => m.name.trim())} style={{ flex:1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Weekends ── */}
        {step === 2 && (
          <div>
            {['sat','sun'].map(day => (
              <div key={day} className="card" style={{ marginBottom:14 }}>
                <div style={{ fontFamily:'Fraunces,serif', fontSize:18, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>
                  {day === 'sat' ? 'Saturday' : 'Sunday'}
                </div>
                {['S1','S2','S3','S4'].map(slot => {
                  const key = `${day}_${slot.toLowerCase()}`
                  return (
                    <div key={slot} onClick={() => setWeekend(p => ({ ...p, [key]: !p[key] }))}
                      style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border-soft)', cursor:'pointer' }}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-mid)' }}>{slot} </span>
                        <span style={{ fontSize:13, color:'var(--ink-soft)' }}>{SLOT_LABELS[slot]}</span>
                      </div>
                      <div style={{ width:44, height:24, borderRadius:12, background:weekendSlots[key] ? 'var(--sage)' : 'var(--border)', position:'relative', transition:'background 0.2s' }}>
                        <div style={{ position:'absolute', top:4, left:weekendSlots[key] ? 22 : 4, width:16, height:16, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {error && (
              <div style={{ background:'var(--miss-bg)', border:'1.5px solid var(--miss-border)', borderRadius:12, padding:'12px 14px', fontSize:13, color:'var(--terra)', marginBottom:14 }}>
                {error}
              </div>
            )}

            {generating && (
              <div style={{ textAlign:'center', padding:'20px 0', marginBottom:16 }}>
                <p style={{ fontSize:13, color:'var(--sage)', fontWeight:600, marginBottom:10 }}>{genStatus}</p>
                <div style={{ width:'100%', height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'var(--sage)', borderRadius:3, width:'60%', animation:'pulse 1.5s ease infinite' }} />
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ width:'auto', padding:'13px 20px' }} disabled={generating}>← Back</button>
              <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ flex:1 }}>
                {generating ? 'Building your plan...' : 'Generate my plan →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
