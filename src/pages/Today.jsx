import { useState, useEffect } from 'react'
import { format, isPast } from 'date-fns'
import { api } from '../api'

const SLOT_META = {
  S1: { time:'08:30 – 10:30', dur:120, label:'Morning block' },
  S2: { time:'10:45 – 12:30', dur:105, label:'Mid-morning block' },
  S3: { time:'13:30 – 14:30', dur:60,  label:'Afternoon block' },
  S4: { time:'14:45 – 16:00', dur:75,  label:'Late afternoon block' },
}

function isPastSlot(slotKey) {
  const endTimes = { S1:[10,30], S2:[12,30], S3:[14,30], S4:[16,0] }
  const [h, m] = endTimes[slotKey]
  const end = new Date(); end.setHours(h, m, 0, 0)
  return isPast(end)
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'var(--sage)' : score >= 65 ? 'var(--gold)' : 'var(--terra)'
  const bg    = score >= 80 ? 'var(--done-bg)' : score >= 65 ? 'var(--gold-dim)' : 'var(--miss-bg)'
  const label = score >= 80 ? 'Great' : score >= 65 ? 'Good' : 'Fair'
  return (
    <span style={{ background:bg, color, fontWeight:800, fontSize:12, padding:'4px 11px', borderRadius:20, letterSpacing:'0.2px' }}>
      {label} · {score}/100
    </span>
  )
}

function SlotCard({ slot, onComplete, onMiss }) {
  const [showComplete, setShowComplete] = useState(false)
  const [summary, setSummary]           = useState('')
  const [grading, setGrading]           = useState(false)

  const meta   = SLOT_META[slot.slot_key]
  const status = slot.status
  const mod    = slot.module
  const past   = isPastSlot(slot.slot_key)
  const sess   = slot.session

  async function handleComplete() {
    if (!summary.trim()) return
    setGrading(true)
    try {
      const result = await api.sessions.complete({ slotId: slot.id, summary })
      onComplete(result)
      setShowComplete(false)
      setSummary('')
    } catch (err) {
      alert(err.message)
    } finally {
      setGrading(false)
    }
  }

  async function handleMiss() {
    try {
      await api.slots.markMissed(slot.id)
      onMiss()
    } catch (err) { alert(err.message) }
  }

  const cardBg = status === 'done' ? 'var(--done-bg)' : status === 'missed' ? 'var(--miss-bg)' : 'var(--white)'
  const borderColor = status === 'done' ? 'var(--done-border)' : status === 'missed' ? 'var(--miss-border)' : mod ? mod.color + '55' : 'var(--border-soft)'
  const leftAccent = mod?.color || (status === 'done' ? 'var(--sage)' : status === 'missed' ? 'var(--terra)' : 'var(--border)')

  return (
    <div style={{ background:cardBg, border:`1.5px solid ${borderColor}`, borderLeft:`5px solid ${leftAccent}`, borderRadius:16, marginBottom:12, overflow:'hidden', boxShadow:'var(--card-shadow)' }}>
      <div style={{ padding:'15px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
          <div>
            <p style={{ fontSize:11, color:'var(--ink-pale)', fontWeight:700, letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>
              {meta.label} · {meta.time}
            </p>
            <p style={{ fontFamily:'Fraunces,serif', fontSize:19, fontWeight:600, lineHeight:1.2,
              color: status==='done' ? 'var(--sage)' : status==='missed' ? 'var(--terra)' : mod ? 'var(--ink)' : 'var(--ink-pale)' }}>
              {mod ? mod.name : status==='missed' ? 'Missed' : 'Not assigned'}
            </p>
          </div>
          {status === 'done' && sess && <ScoreBadge score={sess.efficiency_score} />}
          {status === 'missed' && <span style={{ fontSize:12, color:'var(--terra)', fontWeight:700, marginTop:2 }}>✕ Missed</span>}
        </div>

        {status === 'done' && sess && (
          <div style={{ borderTop:'1px solid var(--done-border)', paddingTop:10, marginTop:6 }}>
            <p style={{ fontSize:12, color:'var(--ink-soft)', fontStyle:'italic', marginBottom:6, lineHeight:1.6 }}>
              "{(sess.summary || '').slice(0,130)}{(sess.summary||'').length > 130 ? '...' : ''}"
            </p>
            <p style={{ fontSize:13, color:'var(--sage)', lineHeight:1.6 }}>{sess.feedback}</p>
            {sess.tip && <p style={{ fontSize:12, color:'var(--ink-soft)', marginTop:6, lineHeight:1.5 }}>→ {sess.tip}</p>}
          </div>
        )}

        {status === 'pending' && (
          <div style={{ marginTop:12, display:'flex', gap:8 }}>
            {past ? (
              <>
                <button onClick={() => setShowComplete(!showComplete)} style={{
                  flex:2, padding:'11px', borderRadius:11, border:'none',
                  background:'var(--sage)', color:'white', fontSize:13, fontWeight:700,
                  cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:'0 3px 10px rgba(92,138,107,0.3)'
                }}>
                  Mark complete
                </button>
                <button onClick={handleMiss} style={{
                  flex:1, padding:'11px', borderRadius:11,
                  border:'1.5px solid var(--miss-border)', background:'transparent',
                  color:'var(--terra)', fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', fontWeight:600
                }}>
                  Missed
                </button>
              </>
            ) : (
              <div style={{ flex:1, padding:'10px 14px', background:'var(--sage-dim)', borderRadius:11, textAlign:'center' }}>
                <p style={{ fontSize:12, color:'var(--sage)', fontWeight:600 }}>
                  Upcoming · starts {meta.time.split(' – ')[0]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showComplete && status === 'pending' && (
        <div style={{ borderTop:'1px solid var(--border-soft)', padding:'15px 16px', background:'var(--cream-dark)' }}>
          <p style={{ fontSize:12, color:'var(--ink-soft)', marginBottom:10, lineHeight:1.6 }}>
            What did you study? Be specific — AI will analyse and give feedback.
          </p>
          <textarea style={{ minHeight:88, resize:'vertical', lineHeight:1.6, fontSize:13, marginBottom:10 }}
            placeholder="e.g. Covered process scheduling — FCFS, SJF, Round Robin. Understood preemption. Still fuzzy on multilevel queues..."
            value={summary} onChange={e => setSummary(e.target.value)} />
          <button onClick={handleComplete} disabled={!summary.trim() || grading} className="btn-primary"
            style={{ opacity: (!summary.trim() || grading) ? 0.5 : 1 }}>
            {grading ? 'Grading your session...' : 'Submit & get feedback →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function TodayPage() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { const data = await api.slots.getByDate(today); setSlots(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const activeSlots = slots.filter(s => s.status !== 'rest')
  const doneCount   = activeSlots.filter(s => s.status === 'done').length
  const missedCount = activeSlots.filter(s => s.status === 'missed').length

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <p style={{ color:'var(--ink-pale)', fontSize:14 }}>Loading today...</p>
    </div>
  )

  return (
    <div style={{ padding:'28px 20px 100px', maxWidth:440, margin:'0 auto' }}>
      <div style={{ marginBottom:26 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--sage)', marginBottom:5 }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <h2 style={{ fontFamily:'Fraunces,serif', fontSize:28, fontWeight:700, color:'var(--ink)', marginBottom:6, letterSpacing:'-0.3px' }}>
          Today's sessions
        </h2>
        <p style={{ fontSize:13, color:'var(--ink-soft)', fontWeight:400 }}>
          {doneCount} of {activeSlots.length} done
          {missedCount > 0 && <span style={{ color:'var(--terra)', fontWeight:600 }}> · {missedCount} missed</span>}
        </p>
      </div>

      {activeSlots.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'44px 20px' }}>
          <p style={{ fontFamily:'Fraunces,serif', fontSize:20, color:'var(--ink-soft)', marginBottom:8 }}>Rest day</p>
          <p style={{ fontSize:14, color:'var(--ink-pale)' }}>No study slots scheduled today</p>
        </div>
      ) : (
        activeSlots.map(slot => <SlotCard key={slot.id} slot={slot} onComplete={load} onMiss={load} />)
      )}
    </div>
  )
}
