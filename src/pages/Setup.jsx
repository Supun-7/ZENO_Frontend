import { useState } from 'react'
import { api } from '../api'

const MODULE_COLORS = ['#7C9E87','#C4714A','#D4A843','#7B9EC4','#B07CC4']

const blankModule = (i) => ({
  name: '', credits: 3, midMark: '', midWeight: 30,
  confidenceRating: 3, overviewText: '', color: MODULE_COLORS[i]
})

const SLOT_LABELS = {
  S1: '08:30 – 10:30',
  S2: '10:45 – 12:30',
  S3: '13:30 – 14:30',
  S4: '14:45 – 16:00',
}

export default function Setup({ onDone }) {
  const [step, setStep]           = useState(0) // 0=basics, 1=modules, 2=weekends
  const [targetGrade, setGrade]   = useState('A')
  const [examDate, setExam]       = useState('')
  const [modules, setModules]     = useState([0,1,2,3,4].map(blankModule))
  const [openMod, setOpenMod]     = useState(0)
  const [weekendSlots, setWeekend] = useState({
    sat_s1: true,  sat_s2: true,  sat_s3: false, sat_s4: false,
    sun_s1: false, sun_s2: false, sun_s3: false, sun_s4: false,
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
      // Save profile
      setGenStatus('Saving your settings...')
      await api.profile.update({ targetGrade, examDate: examDate || null, ...weekendSlots })

      // Save modules
      setGenStatus('Saving modules...')
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i]
        await api.modules.create({
          name: m.name, credits: m.credits,
          midMark: m.midMark !== '' ? m.midMark : null,
          midWeight: m.midWeight, confidenceRating: m.confidenceRating,
          overviewText: m.overviewText || null,
          color: m.color, displayOrder: i
        })
      }

      // Generate plan (AI heavy — takes time)
      setGenStatus('AI is analyzing your modules and building your study plan...')
      await api.plan.generate()

      setGenStatus('Done!')
      onDone()
    } catch (err) {
      setError(err.message)
      setGenerating(false)
      setGenStatus('')
    }
  }

  // ── Decorative watercolour circle ──────────────────────────────────────────
  const WaterCircle = ({ color, size, top, left, opacity = 0.12 }) => (
    <div style={{
      position: 'absolute', top, left,
      width: size, height: size, borderRadius: '50%',
      background: color, filter: 'blur(32px)',
      opacity, pointerEvents: 'none', zIndex: 0
    }} />
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '32px 20px 60px', maxWidth: 440, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      <WaterCircle color="var(--sage)"  size={200} top={-60}  left={-60} />
      <WaterCircle color="var(--terra)" size={160} top={300}  left={260} />
      <WaterCircle color="var(--gold)"  size={140} top={600}  left={-40} opacity={0.1} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 600, letterSpacing: '1px', marginBottom: 8 }}>
            ZENO
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}>
            {step === 0 ? 'Let\'s get you set up' : step === 1 ? 'Your modules' : 'Weekend schedule'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            {step === 0 && 'Set your target grade and exam date to begin.'}
            {step === 1 && 'Add all 5 modules. Paste your course overview — AI will read it and plan your hours.'}
            {step === 2 && 'Choose which slots you want on weekends. Weekdays always have all 4 slots.'}
          </p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? 'var(--sage)' : i < step ? 'var(--sage-light)' : 'var(--border)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {/* ── Step 0: Basics ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <span className="field-label">Target grade</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['A', 'B+', 'B'].map(g => (
                  <button key={g} onClick={() => setGrade(g)} style={{
                    flex: 1, padding: '11px', borderRadius: 10,
                    border: `2px solid ${targetGrade === g ? 'var(--sage)' : 'var(--border)'}`,
                    background: targetGrade === g ? 'var(--sage-dim)' : 'transparent',
                    color: targetGrade === g ? 'var(--sage)' : 'var(--ink-soft)',
                    fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    fontFamily: 'Playfair Display, serif',
                    transition: 'all 0.2s'
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
              <span className="field-label">Your daily study slots</span>
              {Object.entries(SLOT_LABELS).map(([key, time]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink-mid)', fontWeight: 500 }}>{key}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{time}</span>
                  <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                    {key === 'S1' ? '2h' : key === 'S2' ? '1h 45m' : key === 'S3' ? '1h' : '1h 15m'}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--ink-pale)', marginTop: 10 }}>6 hours total per weekday</p>
            </div>

            <button className="btn-primary" onClick={() => setStep(1)}>
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 1: Modules ── */}
        {step === 1 && (
          <div>
            {modules.map((mod, i) => (
              <div key={i} style={{
                background: 'var(--white)', borderRadius: 14,
                marginBottom: 10, overflow: 'hidden',
                border: `1.5px solid ${openMod === i ? mod.color + '88' : 'var(--border-soft)'}`,
                borderLeft: `4px solid ${mod.color}`,
                transition: 'border-color 0.2s'
              }}>
                <div onClick={() => setOpenMod(openMod === i ? -1 : i)}
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: mod.color + '22', border: `1.5px solid ${mod.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: mod.color }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: mod.name ? 'var(--ink)' : 'var(--ink-pale)' }}>
                      {mod.name || `Module ${i + 1}`}
                    </div>
                    {mod.name && (
                      <div style={{ fontSize: 11, color: 'var(--ink-pale)', marginTop: 2 }}>
                        {mod.credits} credits · Focus {mod.confidenceRating}/5
                        {mod.midMark !== '' && ` · Mid ${mod.midMark}%`}
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'var(--ink-pale)', fontSize: 18, lineHeight: 1 }}>
                    {openMod === i ? '−' : '+'}
                  </span>
                </div>

                {openMod === i && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-soft)' }}>
                    <div style={{ height: 16 }} />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <span className="field-label">Module name</span>
                        <input placeholder="e.g. Operating Systems" value={mod.name}
                          onChange={e => updateMod(i, 'name', e.target.value)} />
                      </div>
                      <div style={{ width: 72 }}>
                        <span className="field-label">Credits</span>
                        <input type="number" min="1" max="6" step="0.5" value={mod.credits}
                          onChange={e => updateMod(i, 'credits', e.target.value)}
                          style={{ textAlign: 'center' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <span className="field-label">Mid exam mark (%)</span>
                        <input type="number" min="0" max="100" placeholder="e.g. 65" value={mod.midMark}
                          onChange={e => updateMod(i, 'midMark', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="field-label">Mid weight (%)</span>
                        <input type="number" min="0" max="60" placeholder="e.g. 30" value={mod.midWeight}
                          onChange={e => updateMod(i, 'midWeight', e.target.value)} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <span className="field-label">Focus level — 1 needs most attention · 5 you're comfortable</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => updateMod(i, 'confidenceRating', n)} style={{
                            flex: 1, padding: '9px 0', borderRadius: 8,
                            border: `1.5px solid ${mod.confidenceRating === n ? mod.color : 'var(--border)'}`,
                            background: mod.confidenceRating === n ? mod.color + '18' : 'transparent',
                            color: mod.confidenceRating === n ? mod.color : 'var(--ink-soft)',
                            fontWeight: 700, fontSize: 15, cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s'
                          }}>{n}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="field-label">Module overview (paste your course syllabus)</span>
                      <textarea
                        placeholder="Paste your module outline, syllabus, or course description. AI will extract exam topics and calculate how many hours per week you need."
                        value={mod.overviewText}
                        onChange={e => updateMod(i, 'overviewText', e.target.value)}
                        style={{ minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setStep(0)} style={{ width: 'auto', padding: '12px 20px' }}>
                ← Back
              </button>
              <button className="btn-primary" onClick={() => setStep(2)}
                disabled={!modules.every(m => m.name.trim())}
                style={{ flex: 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Weekends ── */}
        {step === 2 && (
          <div>
            {['sat', 'sun'].map(day => (
              <div key={day} className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>
                  {day === 'sat' ? 'Saturday' : 'Sunday'}
                </div>
                {['S1','S2','S3','S4'].map(slot => {
                  const key = `${day}_${slot.toLowerCase()}`
                  return (
                    <div key={slot} onClick={() => setWeekend(p => ({ ...p, [key]: !p[key] }))}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)' }}>{slot} </span>
                        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{SLOT_LABELS[slot]}</span>
                      </div>
                      <div style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: weekendSlots[key] ? 'var(--sage)' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s'
                      }}>
                        <div style={{
                          position: 'absolute', top: 3, left: weekendSlots[key] ? 20 : 3,
                          width: 16, height: 16, borderRadius: '50%', background: 'white',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

            {error && (
              <div style={{ background: 'var(--miss-bg)', border: '1.5px solid var(--miss-border)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 14 }}>
                {error}
              </div>
            )}

            {generating && (
              <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--sage)', fontWeight: 500, marginBottom: 8 }}>
                  {genStatus}
                </div>
                <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--sage)', borderRadius: 2, width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ width: 'auto', padding: '12px 20px' }} disabled={generating}>
                ← Back
              </button>
              <button className="btn-primary" onClick={handleGenerate} disabled={generating} style={{ flex: 1 }}>
                {generating ? 'Building your plan...' : 'Generate my plan →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
