import { useState } from 'react'

const CORRECT_USERNAME = 'Supun7'
const CORRECT_PASSWORD = '12345678'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)

  function handleSubmit(e) {
    e?.preventDefault?.()
    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    setError('')

    // Small deliberate delay for UX feel
    setTimeout(() => {
      if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
        localStorage.setItem('zeno_auth', '1')
        onLogin()
      } else {
        setLoading(false)
        setError('Incorrect username or password.')
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', top:-120, right:-80, width:320, height:320, borderRadius:'50%', background:'var(--sage)', filter:'blur(80px)', opacity:0.1, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, left:-60, width:260, height:260, borderRadius:'50%', background:'var(--terra)', filter:'blur(70px)', opacity:0.08, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'40%', left:-40, width:180, height:180, borderRadius:'50%', background:'var(--gold)', filter:'blur(60px)', opacity:0.08, pointerEvents:'none' }} />

      <div style={{
        width: '100%',
        maxWidth: 380,
        animation: shake ? 'shakeAnim 0.5s ease' : 'fadeUp 0.5s ease both',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign:'center', marginBottom: 48 }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--ink)',
            borderRadius: 20,
            display: 'flex', alignItems:'center', justifyContent:'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(26,22,15,0.2)',
          }}>
            <span style={{ fontFamily:'Fraunces, serif', fontSize: 28, fontWeight: 700, color:'var(--cream)', letterSpacing:'-1px' }}>Z</span>
          </div>
          <h1 style={{ fontFamily:'Fraunces, serif', fontSize: 32, fontWeight: 700, color:'var(--ink)', marginBottom: 6, letterSpacing:'-0.5px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color:'var(--ink-soft)', fontWeight: 400 }}>
            Sign in to your study planner
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '28px 24px',
          border: '1px solid var(--border-soft)',
          boxShadow: '0 4px 24px rgba(26,22,15,0.08), 0 1px 4px rgba(26,22,15,0.04)',
        }}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:8 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, opacity:0.4 }}>@</span>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="username"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:'var(--ink-soft)', marginBottom:8 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                onClick={() => setShowPw(p => !p)}
                style={{
                  position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', padding:4,
                  color:'var(--ink-pale)', fontSize:14, fontFamily:'Outfit, sans-serif',
                  fontWeight:600, letterSpacing:'0.3px'
                }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:'var(--miss-bg)', border:'1.5px solid var(--miss-border)',
              borderRadius:'var(--radius-xs)', padding:'11px 14px',
              fontSize:13, color:'var(--terra)', fontWeight:500, marginBottom:18,
              animation:'fadeUp 0.25s ease',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'var(--cream)', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                Signing in...
              </span>
            ) : 'Sign in →'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'var(--ink-pale)', fontWeight:400 }}>
          Zeno · Personal Study Planner
        </p>
      </div>

      <style>{`
        @keyframes shakeAnim {
          0%,100% { transform:translateX(0); }
          20%      { transform:translateX(-10px); }
          40%      { transform:translateX(10px); }
          60%      { transform:translateX(-7px); }
          80%      { transform:translateX(7px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}
