import { useState } from 'react'
import { api } from '../api'
import useAuth from '../store/auth'

const COLORS = ['#7C6FE0', '#2ECC9A', '#F5A623', '#E8526A', '#4A90D9']

const emptyModule = (i) => ({
  name: '', credits: 3, midMark: '', midWeight: 30,
  confidenceRating: 3, overviewText: '', color: COLORS[i]
})

export default function Onboarding({ onDone }) {
  const { user } = useAuth()
  const [modules, setModules] = useState([0,1,2,3,4].map(emptyModule))
  const [saving, setSaving]   = useState(false)
  const [step, setStep]       = useState(0) // which module is expanded
  const [error, setError]     = useState('')

  function update(idx, field, value) {
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  async function handleSave() {
    if (!modules.every(m => m.name.trim())) {
      setError('Please fill in all 5 module names')
      return
    }
    setSaving(true)
    setError('')
    try {
      for (let i = 0; i < modules.length; i++) {
        const m = modules[i]
        const created = await api.modules.create({
          name:             m.name,
          credits:          parseFloat(m.credits) || 3,
          midMark:          m.midMark !== '' ? parseFloat(m.midMark) : null,
          midWeight:        parseFloat(m.midWeight) || 30,
          confidenceRating: m.confidenceRating,
          overviewText:     m.overviewText || null,
          color:            m.color,
          displayOrder:     i
        })
        // Trigger AI analysis in background if overview was provided
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

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" }
  const input = {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '10px 12px', color: '#e0e0e0', fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
  }
  const label = {
    display: 'block', fontSize: 11, color: '#666', marginBottom: 5,
    fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase'
  }

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#0a0a0a', padding: '24px 20px 40px' }}>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Add your modules</h2>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
            Fill in all 5. Paste your module overview — AI will read it and decide how many hours you need per week based on your mid mark, credits, and confidence.
          </p>
        </div>

        {modules.map((mod, idx) => (
          <div key={idx} style={{
            background: '#111', borderRadius: 12, marginBottom: 10,
            borderLeft: `3px solid ${mod.color}`, overflow: 'hidden'
          }}>
            {/* Module header - tap to expand */}
            <div
              onClick={() => setStep(step === idx ? -1 : idx)}
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: mod.color + '22', border: `1px solid ${mod.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: mod.color, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: mod.name ? '#e0e0e0' : '#444' }}>
                  {mod.name || `Module ${idx + 1}`}
                </div>
                {mod.name && (
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    {mod.credits} credits · Confidence {mod.confidenceRating}/5
                    {mod.midMark !== '' && ` · Mid ${mod.midMark}%`}
                  </div>
                )}
              </div>
              <span style={{ color: '#444', fontSize: 18 }}>{step === idx ? '−' : '+'}</span>
            </div>

            {step === idx && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #1e1e1e' }}>
                <div style={{ height: 16 }} />

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Module name</label>
                    <input style={input} placeholder="e.g. Operating Systems"
                      value={mod.name} onChange={e => update(idx, 'name', e.target.value)} />
                  </div>
                  <div style={{ width: 72 }}>
                    <label style={label}>Credits</label>
                    <input style={{ ...input, textAlign: 'center' }} type="number" min="1" max="6" step="0.5"
                      value={mod.credits} onChange={e => update(idx, 'credits', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Mid exam mark (%)</label>
                    <input style={input} type="number" min="0" max="100" placeholder="e.g. 65"
                      value={mod.midMark} onChange={e => update(idx, 'midMark', e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Mid exam weight (%)</label>
                    <input style={input} type="number" min="0" max="60" placeholder="e.g. 30"
                      value={mod.midWeight} onChange={e => update(idx, 'midWeight', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Confidence (1 = need most focus · 5 = comfortable)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => update(idx, 'confidenceRating', n)} style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid',
                        borderColor: mod.confidenceRating === n ? mod.color : '#2a2a2a',
                        background: mod.confidenceRating === n ? mod.color + '22' : 'transparent',
                        color: mod.confidenceRating === n ? mod.color : '#555',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                      }}>{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={label}>Module overview (paste from your course document)</label>
                  <textarea
                    style={{ ...input, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
                    placeholder="Paste your syllabus, course outline, or module description here. AI will extract topics and calculate your recommended study hours."
                    value={mod.overviewText}
                    onChange={e => update(idx, 'overviewText', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {error && (
          <div style={{ background: '#1f0d0d', border: '1px solid #3d1a1a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff8080', marginTop: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, border: 'none',
            background: saving ? '#3a3a5a' : '#7C6FE0', color: 'white',
            fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            fontFamily: 'inherit'
          }}>
          {saving ? 'Saving modules...' : 'Launch StudyOS →'}
        </button>
      </div>
    </div>
  )
}
