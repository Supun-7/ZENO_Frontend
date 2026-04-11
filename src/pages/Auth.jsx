import { useState } from 'react'
import useAuth from '../store/auth'

export default function AuthPage() {
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup }     = useAuth()

  // Signup extras
  const [targetGrade, setTargetGrade] = useState('A')
  const [examDate, setExamDate]       = useState('')
  const [wakeHour, setWakeHour]       = useState(6)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signup(email, password, { targetGrade, examDate, wakeHour })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const s = { fontFamily: "'DM Sans', system-ui, sans-serif" }
  const input = {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '11px 14px', color: '#e0e0e0', fontSize: 15,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
  }
  const label = {
    display: 'block', fontSize: 11, color: '#666', marginBottom: 5,
    fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase'
  }
  const btn = {
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: loading ? '#3a3a5a' : '#7C6FE0', color: 'white',
    fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
    fontFamily: 'inherit', marginTop: 8
  }

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>StudyOS</h1>
          <p style={{ color: '#555', fontSize: 14, marginTop: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Set up your study system'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#111', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? '#7C6FE0' : 'transparent',
              color: mode === m ? 'white' : '#666',
              fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              textTransform: 'capitalize'
            }}>{m}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={label}>Email</label>
            <input style={input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={label}>Password</label>
            <input style={input} type="password" placeholder="min 6 characters"
              value={password} onChange={e => setPass(e.target.value)} />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label style={label}>Target grade</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['A', 'B+', 'B'].map(g => (
                    <button key={g} onClick={() => setTargetGrade(g)} style={{
                      flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                      borderColor: targetGrade === g ? '#7C6FE0' : '#2a2a2a',
                      background: targetGrade === g ? '#7C6FE0' : 'transparent',
                      color: targetGrade === g ? 'white' : '#666',
                      cursor: 'pointer', fontWeight: 700, fontSize: 15, fontFamily: 'inherit'
                    }}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={label}>Exam start date</label>
                <input style={input} type="date" value={examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setExamDate(e.target.value)} />
              </div>

              <div>
                <label style={label}>Morning study start time</label>
                <select style={input} value={wakeHour} onChange={e => setWakeHour(parseInt(e.target.value))}>
                  {[4, 5, 6, 7, 8].map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && (
            <div style={{ background: '#1f0d0d', border: '1px solid #3d1a1a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff8080' }}>
              {error}
            </div>
          )}

          <button style={btn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
