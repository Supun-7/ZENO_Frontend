import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const PALETTE = ['#5C8A6B','#C0604A','#C9943A','#5B7EC4','#9B6EC4','#3E9E9E','#B06040']

const lbl = {
  display: 'block', fontSize: 11, fontWeight: 700,
  letterSpacing: '0.7px', textTransform: 'uppercase',
  color: 'var(--ink-soft)', marginBottom: 7,
}

/* ─── Grade calculation ───────────────────────────────────────────────────── */
// Returns { needed, feasible, finalWeight, breakdown }
function calcNeededFinal(mod, targetPct) {
  const midW  = parseFloat(mod.mid_weight)  || 0
  const projW = mod.assessments?.weight != null ? parseFloat(mod.assessments.weight) : 0
  const finalW = Math.max(0, 100 - midW - projW)

  if (finalW === 0) return { needed: null, feasible: true, finalWeight: 0, breakdown: [] }

  // Mid contribution (already as %)
  const midContrib = mod.mid_mark != null
    ? (midW / 100) * mod.mid_mark
    : 0

  // Project contribution — convert scored/outOf to %
  const proj = mod.assessments
  let projContrib = 0
  if (proj?.scored != null && proj?.outOf != null && proj.outOf > 0) {
    const projPct = (proj.scored / proj.outOf) * 100
    projContrib = (projW / 100) * projPct
  }

  const needed = Math.round((targetPct - midContrib - projContrib) / (finalW / 100))

  return {
    needed: Math.max(0, Math.min(110, needed)),
    feasible: needed <= 100,
    finalWeight: finalW,
    breakdown: [
      mod.mid_mark != null && midW > 0
        ? { label: 'Mid', contribution: midContrib.toFixed(1), weight: midW }
        : null,
      proj?.scored != null && projW > 0
        ? { label: proj.type || 'Project / Assignment', contribution: projContrib.toFixed(1), weight: projW }
        : null,
    ].filter(Boolean),
  }
}

/* ─── Confidence picker ───────────────────────────────────────────────────── */
function ConfidencePicker({ value, onChange }) {
  const labels = ['', 'Struggling', 'Shaky', 'Okay', 'Solid', 'Confident']
  return (
    <div>
      <label style={lbl}>
        Confidence&nbsp;
        <span style={{ color: 'var(--ink-pale)', fontWeight: 400, textTransform: 'none' }}>
          — {labels[value]}
        </span>
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3,4,5].map(n => {
          const active = value === n
          const c = n <= 2 ? 'var(--terra)' : n === 3 ? 'var(--gold)' : 'var(--sage)'
          return (
            <button key={n} onClick={() => onChange(n)} style={{
              flex: 1, padding: '11px 0', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 800,
              transition: 'all 0.15s ease',
              background: active ? c : 'var(--white)',
              color:      active ? '#fff' : 'var(--ink-soft)',
              border:     active ? `2px solid ${c}` : '1.5px solid var(--border)',
              boxShadow:  active ? `0 3px 10px ${c}33` : 'none',
              transform:  active ? 'translateY(-1px)' : 'none',
            }}>{n}</button>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink-pale)', marginTop: 6 }}>
        1 = needs most focus · 5 = very comfortable
      </p>
    </div>
  )
}

/* ─── Assessment section inside edit modal ────────────────────────────────── */
function AssessmentEditor({ value, onChange }) {
  // value = { scored, outOf, weight, type } | null
  const has = value != null
  const v   = value || { scored: '', outOf: '', weight: '', type: 'Project / Assignment' }

  function set(k, val) {
    onChange({ ...v, [k]: val })
  }

  function clear() { onChange(null) }

  const scoredPct = v.scored !== '' && v.outOf !== '' && parseFloat(v.outOf) > 0
    ? Math.round((parseFloat(v.scored) / parseFloat(v.outOf)) * 100)
    : null

  const pctColor = scoredPct == null ? 'var(--ink-pale)'
    : scoredPct >= 70 ? 'var(--sage)'
    : scoredPct >= 55 ? 'var(--gold)'
    : 'var(--terra)'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label style={lbl}>Project / Assignment</label>
        {has && (
          <button onClick={clear} style={{
            fontSize: 11, fontWeight: 700, color: 'var(--terra)', background: 'var(--miss-bg)',
            border: 'none', borderRadius: 8, padding: '3px 10px', cursor: 'pointer',
            fontFamily: 'Outfit,sans-serif',
          }}>
            Remove
          </button>
        )}
      </div>

      {/* Weight — always visible (needed to factor into grade) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ ...lbl, marginBottom: 5 }}>
          Assessment weight %
          <span style={{ color: 'var(--ink-pale)', fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>
            (portion of final grade)
          </span>
        </label>
        <input
          type="number" min="0" max="60" step="5"
          value={v.weight}
          onChange={e => set('weight', e.target.value)}
          placeholder="e.g. 20"
        />
      </div>

      {/* Marks — x out of Y */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ ...lbl, marginBottom: 5 }}>
          Marks scored
          <span style={{ color: 'var(--ink-pale)', fontWeight: 400, textTransform: 'none', marginLeft: 4 }}>
            (leave blank if not returned yet)
          </span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number" min="0" step="0.5"
            value={v.scored}
            onChange={e => set('scored', e.target.value)}
            placeholder="e.g. 18"
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-pale)', flexShrink: 0 }}>out of</span>
          <input
            type="number" min="1" step="1"
            value={v.outOf}
            onChange={e => set('outOf', e.target.value)}
            placeholder="e.g. 30"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Live percentage preview */}
      {scoredPct != null && (
        <div style={{
          marginTop: 10, background: scoredPct >= 70 ? 'var(--done-bg)' : scoredPct >= 55 ? 'var(--gold-dim)' : 'var(--miss-bg)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>
            {v.scored} / {v.outOf} marks
          </span>
          <span style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 700, color: pctColor }}>
            {scoredPct}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Edit Sheet (bottom modal) ───────────────────────────────────────────── */
function EditSheet({ mod, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:             mod.name || '',
    credits:          mod.credits ?? 3,
    midMark:          mod.mid_mark ?? '',
    midWeight:        mod.mid_weight ?? 30,
    confidenceRating: mod.confidence_rating ?? 3,
    overviewText:     mod.overview_text || '',
    color:            mod.color || '#5C8A6B',
    assessments:      mod.assessments || null,
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [section, setSection] = useState('info') // 'info' | 'marks' | 'overview'
  const overlayRef = useRef()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (!form.name.trim()) { setError('Module name is required'); return }
    setSaving(true); setError('')
    try {
      const updated = await api.modules.update(mod.id, {
        name:             form.name.trim(),
        credits:          parseFloat(form.credits) || 3,
        midMark:          form.midMark !== '' ? parseFloat(form.midMark) : null,
        midWeight:        parseFloat(form.midWeight) || 30,
        confidenceRating: parseInt(form.confidenceRating) || 3,
        overviewText:     form.overviewText.trim() || null,
        color:            form.color,
        assessments:      form.assessments,
      })
      onSaved(updated)
      onClose()
    } catch (e) { setError(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'info',     label: 'Module info' },
    { id: 'marks',    label: 'Marks' },
    { id: 'overview', label: 'AI overview' },
  ]

  const hasAssessment = form.assessments?.weight != null && form.assessments.weight !== ''
  const hasMidMark    = form.midMark !== '' && form.midMark != null
  const hasOverview   = !!form.overviewText

  return (
    <div ref={overlayRef}
      onClick={e => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(26,22,15,0.5)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'sheetFadeIn 0.2s ease both',
      }}>
      <div style={{
        width: '100%', maxWidth: 440, background: 'var(--cream)',
        borderRadius: '26px 26px 0 0', maxHeight: '93vh', overflowY: 'auto',
        animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both',
        boxShadow: '0 -12px 48px rgba(26,22,15,0.22)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.color, boxShadow: `0 0 0 3px ${form.color}33`, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 2 }}>Edit module</p>
              <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                {form.name || mod.name}
              </h3>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 11, border: '1.5px solid var(--border)',
            background: 'var(--white)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-soft)', fontSize: 19, lineHeight: 1, fontFamily: 'Outfit,sans-serif', flexShrink: 0,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '16px 22px 0' }}>
          {TABS.map(({ id, label }) => {
            const active = section === id
            // Dot indicators
            const dot = (id === 'marks' && !hasMidMark && !hasAssessment)
              || (id === 'overview' && !hasOverview)
            return (
              <button key={id} onClick={() => setSection(id)} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                fontFamily: 'Outfit,sans-serif', fontSize: 11, fontWeight: 700,
                transition: 'all 0.18s ease',
                background: active ? 'var(--ink)' : 'var(--white)',
                color:      active ? 'var(--cream)' : 'var(--ink-soft)',
                border:     active ? '1.5px solid var(--ink)' : '1.5px solid var(--border)',
                position: 'relative',
              }}>
                {label}
                {dot && !active && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6,
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gold)',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        <div style={{ padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Module info tab ── */}
          {section === 'info' && (
            <>
              <div>
                <label style={lbl}>Module name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Operating Systems" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Credits</label>
                  <input type="number" min="1" max="6" step="0.5" value={form.credits} onChange={e => set('credits', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Confidence</label>
                  <div style={{ paddingTop: 4 }}>
                    <ConfidencePicker value={form.confidenceRating} onChange={v => set('confidenceRating', v)} />
                  </div>
                </div>
              </div>

              <div>
                <label style={lbl}>Colour</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => set('color', c)} style={{
                      width: 30, height: 30, borderRadius: '50%', background: c,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: form.color === c ? '3px solid var(--ink)' : '2px solid transparent',
                      outline: form.color === c ? '2px solid var(--cream)' : 'none',
                      outlineOffset: '-4px',
                      transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                    }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Marks tab ── */}
          {section === 'marks' && (
            <>
              {/* Mid exam */}
              <div style={{ background: 'var(--white)', borderRadius: 16, padding: '16px', border: '1px solid var(--border-soft)' }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 14 }}>
                  Mid exam
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Weight %</label>
                    <input type="number" min="0" max="70" step="5"
                      value={form.midWeight} onChange={e => set('midWeight', e.target.value)} />
                  </div>
                  <div>
                    <label style={lbl}>Score %<span style={{ color: 'var(--ink-pale)', fontWeight: 400, textTransform: 'none' }}> (out of 100)</span></label>
                    <input type="number" min="0" max="100" step="0.5"
                      value={form.midMark} onChange={e => set('midMark', e.target.value)}
                      placeholder="e.g. 72" />
                  </div>
                </div>
                {form.midMark !== '' && form.midMark != null && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--cream)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Contributes to final grade</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                      {((parseFloat(form.midWeight) || 0) / 100 * parseFloat(form.midMark)).toFixed(1)} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Project / Assignment */}
              <div style={{ background: 'var(--white)', borderRadius: 16, padding: '16px', border: '1px solid var(--border-soft)' }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 14 }}>
                  Project / Assignment
                </p>
                <AssessmentEditor
                  value={form.assessments}
                  onChange={v => set('assessments', v)}
                />
              </div>

              {/* Final weight display */}
              {(() => {
                const midW  = parseFloat(form.midWeight) || 0
                const projW = parseFloat(form.assessments?.weight) || 0
                const finalW = Math.max(0, 100 - midW - projW)
                const total  = midW + projW + finalW
                const ok     = Math.abs(total - 100) < 0.1
                return (
                  <div style={{
                    background: ok ? 'var(--sage-dim)' : 'var(--miss-bg)',
                    border: `1.5px solid ${ok ? 'rgba(92,138,107,0.2)' : 'var(--miss-border)'}`,
                    borderRadius: 14, padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                      color: ok ? 'var(--sage)' : 'var(--terra)', marginBottom: 10 }}>
                      {ok ? '✓ Grade breakdown' : `⚠ Weights add up to ${total}% (should be 100%)`}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { label: 'Mid',     pct: midW,  color: 'var(--sage)' },
                        { label: 'Project', pct: projW, color: 'var(--gold)' },
                        { label: 'Final',   pct: finalW, color: 'var(--ink-soft)' },
                      ].map((c, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', background: 'var(--white)', borderRadius: 10, padding: '10px 6px' }}>
                          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.pct}%</div>
                          <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 3 }}>{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {/* ── AI overview tab ── */}
          {section === 'overview' && (
            <>
              <div style={{
                background: hasOverview ? 'var(--sage-dim)' : 'var(--gold-dim)',
                borderRadius: 14, padding: '14px 16px',
                border: `1.5px solid ${hasOverview ? 'rgba(92,138,107,0.2)' : 'rgba(201,148,58,0.2)'}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase',
                  color: hasOverview ? 'var(--sage)' : 'var(--gold)', marginBottom: 6 }}>
                  {hasOverview ? '✦ AI ready' : '⚠ Required for AI analysis'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                  {hasOverview
                    ? 'Overview text is set. You can re-run AI analysis from the module card.'
                    : 'Paste your course syllabus, lecture topics, or exam outline. The AI uses this to recommend how many hours to study each week.'}
                </p>
              </div>
              <div>
                <label style={lbl}>Course overview / syllabus</label>
                <textarea
                  value={form.overviewText}
                  onChange={e => set('overviewText', e.target.value)}
                  placeholder="Paste your module syllabus, topic list, lecture summaries, or exam guide here..."
                  style={{ minHeight: 180, resize: 'vertical', lineHeight: 1.65, fontSize: 13 }}
                />
                {form.overviewText && (
                  <p style={{ fontSize: 11, color: 'var(--ink-pale)', marginTop: 6 }}>
                    {form.overviewText.length} characters
                  </p>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'var(--miss-bg)', border: '1.5px solid var(--miss-border)', borderRadius: 12, padding: '11px 14px' }}>
              <p style={{ fontSize: 13, color: 'var(--terra)', fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary"
            style={{ opacity: saving ? 0.65 : 1, marginBottom: 8 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes sheetFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetSlideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}

/* ─── Assessment pill for collapsed card ──────────────────────────────────── */
function AssessmentPill({ assessment }) {
  if (!assessment?.weight) return null
  const hasMarks = assessment.scored != null && assessment.outOf != null && assessment.outOf > 0
  const pct      = hasMarks ? Math.round((assessment.scored / assessment.outOf) * 100) : null
  const color    = pct == null ? 'var(--ink-pale)'
    : pct >= 70 ? 'var(--sage)'
    : pct >= 55 ? 'var(--gold)'
    : 'var(--terra)'
  const bg       = pct == null ? 'var(--cream-dark)'
    : pct >= 70 ? 'var(--done-bg)'
    : pct >= 55 ? 'var(--gold-dim)'
    : 'var(--miss-bg)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: bg, borderRadius: 10, padding: '6px 10px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {assessment.type || 'Project'}
      </span>
      {hasMarks ? (
        <>
          <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'Fraunces,serif' }}>
            {assessment.scored}/{assessment.outOf}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color, opacity: 0.8 }}>
            ({pct}%)
          </span>
        </>
      ) : (
        <span style={{ fontSize: 10, color, fontWeight: 500 }}>
          {assessment.weight}% weight · no mark yet
        </span>
      )}
    </div>
  )
}

/* ─── Stat badge ──────────────────────────────────────────────────────────── */
function StatBadge({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--cream-dark)', borderRadius: 12, padding: '11px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Fraunces,serif', fontSize: 19, fontWeight: 700, color: color || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: 3 }}>{label}</div>
    </div>
  )
}

/* ─── Module Card ─────────────────────────────────────────────────────────── */
function ModuleCard({ mod, idx, isOpen, onToggle, onEdit, onReAnalyze, analyzing, stat, targetPct }) {
  const { needed, feasible, finalWeight, breakdown } = calcNeededFinal(mod, targetPct)
  const recH     = mod.recommended_hours?.perWeek
  const doneH    = stat?.totalHours || 0
  const progress = recH ? Math.min(100, Math.round((doneH / recH) * 100)) : 0
  const hasOverview = !!mod.overview_text
  const conf = mod.confidence_rating || 3
  const confColor = conf <= 2 ? 'var(--terra)' : conf === 3 ? 'var(--gold)' : 'var(--sage)'

  // Mid mark percentage
  const midPct = mod.mid_mark != null ? mod.mid_mark : null
  const midColor = midPct == null ? 'var(--ink-pale)'
    : midPct >= 70 ? 'var(--sage)'
    : midPct >= 55 ? 'var(--gold)'
    : 'var(--terra)'

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 18, marginBottom: 10,
      border: `1.5px solid ${isOpen ? mod.color + '55' : 'var(--border-soft)'}`,
      borderLeft: `5px solid ${mod.color}`,
      overflow: 'hidden',
      boxShadow: isOpen ? `0 8px 32px ${mod.color}20, 0 2px 8px rgba(26,22,15,0.06)` : 'var(--card-shadow)',
      transition: 'border-color 0.25s, box-shadow 0.3s',
      animation: `fadeUp 0.4s ${idx * 0.06}s ease both`,
    }}>

      {/* ── Header ── */}
      <div onClick={() => onToggle(mod.id)}
        style={{ padding: '15px 14px 13px', cursor: 'pointer', userSelect: 'none' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'Fraunces,serif', fontSize: 16, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.2 }}>
                {mod.name}
              </h3>
              {!feasible && needed != null && (
                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--terra)', background: 'var(--miss-bg)', padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  AT RISK
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{mod.credits} cr</span>
              {needed != null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                  color: feasible ? 'var(--sage)' : 'var(--terra)',
                  background: feasible ? 'var(--done-bg)' : 'var(--miss-bg)',
                }}>
                  Need {needed}% final ({finalWeight}% weight)
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {recH ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: mod.color, lineHeight: 1 }}>{recH}h</div>
                <div style={{ fontSize: 9, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>/week</div>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'var(--ink-pale)', fontStyle: 'italic', maxWidth: 48, textAlign: 'right', lineHeight: 1.3 }}>
                {hasOverview ? 'Run AI' : 'No AI'}
              </div>
            )}

            {/* Edit */}
            <button onClick={e => { e.stopPropagation(); onEdit(mod) }} title="Edit module" style={{
              width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--border)',
              background: 'var(--cream-dark)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s ease', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--ink)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--cream-dark)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: 'var(--ink-soft)', pointerEvents: 'none' }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>

            {/* Chevron */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-pale)" strokeWidth="2.2" strokeLinecap="round"
              style={{ transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* ── Marks row (always visible on collapsed card) ── */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Mid mark */}
          {midPct != null ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: midPct >= 70 ? 'var(--done-bg)' : midPct >= 55 ? 'var(--gold-dim)' : 'var(--miss-bg)',
              borderRadius: 10, padding: '6px 10px',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: midColor, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Mid</span>
              <span style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 800, color: midColor }}>{midPct}%</span>
            </div>
          ) : (
            <div style={{ background: 'var(--cream-dark)', borderRadius: 10, padding: '6px 10px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-pale)' }}>Mid: —</span>
            </div>
          )}

          {/* Project / Assignment */}
          <AssessmentPill assessment={mod.assessments} />

          {/* AI status */}
          {!isOpen && (
            hasOverview ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '6px 10px', borderRadius: 10, background: 'var(--sage-dim)', color: 'var(--sage)' }}>
                ✦ AI ready
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '6px 10px', borderRadius: 10, background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                ⚠ Add overview
              </span>
            )
          )}
        </div>

        {/* Progress bar */}
        {recH && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-pale)', fontWeight: 600, marginBottom: 4 }}>
              <span>{doneH.toFixed(1)}h studied this week</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--cream-deep)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: `linear-gradient(90deg, ${mod.color}cc, ${mod.color})`,
                borderRadius: 3, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded ── */}
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border-soft)', animation: 'expandIn 0.22s ease both' }}>

          {/* Grade breakdown detail */}
          {breakdown.length > 0 && (
            <div style={{ padding: '14px 14px 0' }}>
              <div style={{ background: 'var(--cream-dark)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 10 }}>
                  Grade breakdown
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {breakdown.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500 }}>
                        {b.label} ({b.weight}% weight)
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                        +{b.contribution} pts
                      </span>
                    </div>
                  ))}
                  {needed != null && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                        Final exam ({finalWeight}% weight)
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: feasible ? 'var(--sage)' : 'var(--terra)' }}>
                        Need {needed}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI block */}
          <div style={{ padding: '14px 14px' }}>
            {mod.recommended_hours ? (
              <div style={{
                background: `linear-gradient(135deg, ${mod.color}14, ${mod.color}08)`,
                border: `1.5px solid ${mod.color}30`, borderRadius: 14, padding: '14px',
              }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', color: mod.color, marginBottom: 12 }}>
                  ✦ AI Study Plan
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { l: 'Per week',     v: `${mod.recommended_hours.perWeek}h` },
                    { l: 'Total needed', v: `${mod.recommended_hours.totalNeeded}h` },
                  ].map((c, i) => (
                    <div key={i} style={{ background: 'var(--white)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Fraunces,serif', fontSize: 22, fontWeight: 700, color: mod.color, lineHeight: 1 }}>{c.v}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 3 }}>{c.l}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-mid)', lineHeight: 1.7, marginBottom: 12 }}>{mod.recommended_hours.reasoning}</p>
                <button onClick={() => onReAnalyze(mod.id)} disabled={analyzing[mod.id]} style={{
                  padding: '7px 16px', borderRadius: 9, border: `1.5px solid ${mod.color}`,
                  background: 'transparent', color: mod.color, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontWeight: 700,
                  opacity: analyzing[mod.id] ? 0.5 : 1,
                }}>
                  {analyzing[mod.id] ? '↺ Re-analysing…' : '↺ Re-analyse'}
                </button>
              </div>
            ) : hasOverview ? (
              <div style={{ background: 'var(--sage-dim)', borderRadius: 14, padding: '16px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>✦</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Ready to analyse</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 10 }}>
                    Your course overview is set — run the AI to get a personalised study plan.
                  </p>
                  <button onClick={() => onReAnalyze(mod.id)} disabled={analyzing[mod.id]} className="btn-sage" style={{ width: 'auto', padding: '8px 20px', fontSize: 13 }}>
                    {analyzing[mod.id] ? 'Analysing…' : '✦ Run AI Analysis'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--cream-dark)', borderRadius: 14, padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>📋</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Add a course overview to unlock AI</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 12 }}>
                    Paste your syllabus — the AI will build a personalised weekly study plan for this module.
                  </p>
                  <button onClick={e => { e.stopPropagation(); onEdit(mod) }} style={{
                    padding: '8px 18px', borderRadius: 9, border: 'none',
                    background: 'var(--ink)', color: 'var(--cream)',
                    fontSize: 12, fontFamily: 'Outfit,sans-serif', fontWeight: 700, cursor: 'pointer',
                  }}>✎ Open editor</button>
                </div>
              </div>
            )}
          </div>

          {/* Topics */}
          {mod.topics?.length > 0 && (
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 12 }}>Exam topics</p>
              {mod.topics.map((t, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
                      background: t.weight === 'high' ? 'var(--terra)' : t.weight === 'medium' ? 'var(--gold)' : 'var(--sage)' }} />
                    <span style={{ fontFamily: 'Fraunces,serif', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{t.topic}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, marginLeft: 'auto',
                      background: t.weight === 'high' ? 'var(--terra-dim)' : t.weight === 'medium' ? 'var(--gold-dim)' : 'var(--sage-dim)',
                      color:      t.weight === 'high' ? 'var(--terra)' : t.weight === 'medium' ? 'var(--gold)' : 'var(--sage)',
                    }}>{t.weight}</span>
                  </div>
                  {t.subtopics?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 15 }}>
                      {t.subtopics.map((st, j) => (
                        <span key={j} style={{ fontSize: 11, color: 'var(--ink-soft)', background: 'var(--cream-dark)', padding: '3px 9px', borderRadius: 7 }}>{st}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Performance */}
          {stat?.totalSessions > 0 && (
            <div style={{ padding: '0 14px 16px', borderTop: '1px solid var(--border-soft)', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--ink-pale)', marginBottom: 10 }}>Your performance</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatBadge label="Hours"     value={stat.totalHours + 'h'} color={mod.color} />
                <StatBadge label="Sessions"  value={stat.totalSessions} />
                <StatBadge label="Avg score" value={stat.avgEfficiency ? stat.avgEfficiency + '/100' : '—'} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function PlanPage({ profile }) {
  const [modules,   setModules]   = useState([])
  const [stats,     setStats]     = useState([])
  const [expanded,  setExpanded]  = useState(null)
  const [analyzing, setAnalyzing] = useState({})
  const [loading,   setLoading]   = useState(true)
  const [editMod,   setEditMod]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [m, s] = await Promise.all([api.modules.list(), api.sessions.stats()])
      setModules(m)
      setStats(s.stats || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function reAnalyze(id) {
    setAnalyzing(p => ({ ...p, [id]: true }))
    try {
      const updated = await api.modules.analyze(id)
      setModules(p => p.map(m => m.id === id ? updated : m))
    } catch (err) { alert('Analysis failed: ' + err.message) }
    finally { setAnalyzing(p => ({ ...p, [id]: false })) }
  }

  const GRADE_MIN = { A: 75, 'B+': 70, B: 65 }
  const targetPct = GRADE_MIN[profile?.target_grade] || 75
  const weeksLeft = profile?.exam_date
    ? Math.max(1, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000*60*60*24*7))) : 5

  const totalH    = modules.reduce((s, m) => s + (m.recommended_hours?.perWeek || 0), 0)
  const withAI    = modules.filter(m => m.recommended_hours).length
  const needsAttn = modules.filter(m => !m.overview_text).length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--sage)', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--ink-pale)', fontSize: 13 }}>Loading modules…</p>
    </div>
  )

  return (
    <div style={{ padding: '28px 20px 110px', maxWidth: 440, margin: '0 auto' }}>

      <div style={{ marginBottom: 20, animation: 'fadeUp 0.35s ease both' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.9px', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: 5 }}>
          Target {profile?.target_grade || 'A'} · {weeksLeft} weeks left
        </p>
        <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: 27, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.3px', marginBottom: 3 }}>
          Your modules
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {modules.length} module{modules.length !== 1 ? 's' : ''}
          {withAI > 0 && <span style={{ color: 'var(--sage)', fontWeight: 600 }}> · {withAI} with AI plan</span>}
          {needsAttn > 0 && <span style={{ color: 'var(--gold)', fontWeight: 600 }}> · {needsAttn} need overview</span>}
        </p>
      </div>

      {modules.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'var(--white)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border-soft)', boxShadow: 'var(--card-shadow)',
          marginBottom: 16, animation: 'fadeUp 0.35s 0.05s ease both',
        }}>
          {[
            { label: 'Weekly target', value: totalH > 0 ? `${totalH}h` : '—' },
            { label: 'Modules',       value: modules.length },
            { label: 'Weeks left',    value: weeksLeft },
          ].map((c, i) => (
            <div key={i} style={{ padding: '14px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border-soft)' : 'none' }}>
              <div style={{ fontFamily: 'Fraunces,serif', fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-pale)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {needsAttn > 0 && modules.length > 0 && (
        <div style={{
          background: 'var(--gold-dim)', border: '1.5px solid rgba(201,148,58,0.25)',
          borderRadius: 14, padding: '12px 14px', marginBottom: 14,
          display: 'flex', gap: 10, alignItems: 'center',
          animation: 'fadeUp 0.35s 0.08s ease both',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, lineHeight: 1.5 }}>
            {needsAttn} module{needsAttn > 1 ? 's' : ''} missing a course overview —
            tap <strong>✎</strong> to add one and unlock AI analysis.
          </p>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, color: 'var(--ink-soft)', marginBottom: 8 }}>No modules yet</p>
          <p style={{ fontSize: 14, color: 'var(--ink-pale)' }}>Add modules during setup to get started.</p>
        </div>
      ) : (
        modules.map((mod, idx) => (
          <ModuleCard
            key={mod.id} mod={mod} idx={idx}
            isOpen={expanded === mod.id}
            onToggle={id => setExpanded(p => p === id ? null : id)}
            onEdit={setEditMod}
            onReAnalyze={reAnalyze}
            analyzing={analyzing}
            stat={stats.find(s => s.moduleId === mod.id)}
            targetPct={targetPct}
          />
        ))
      )}

      {editMod && (
        <EditSheet
          mod={editMod}
          onClose={() => setEditMod(null)}
          onSaved={updated => {
            setModules(p => p.map(m => m.id === updated.id ? updated : m))
            setEditMod(null)
          }}
        />
      )}

      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes expandIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
