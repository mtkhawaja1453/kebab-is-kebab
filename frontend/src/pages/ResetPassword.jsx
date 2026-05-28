import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [status,    setStatus]    = useState('idle')
  const [error,     setError]     = useState('')
  const [ready,     setReady]     = useState(false)


  useEffect(() => {
    console.log('=== RESET PASSWORD DEBUG ===')
    console.log('Full URL:', window.location.href)
    console.log('Search params:', window.location.search)
    console.log('Hash:', window.location.hash)
    console.log('Code param:', new URLSearchParams(window.location.search).get('code'))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session?.user?.email)
      
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      } else if (event === 'INITIAL_SESSION' && session) {
        // Supabase auto-processed the reset token and created a session
        // This IS the valid recovery flow — let them set a new password
        setReady(true)
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session, no recovery token — invalid
        setReady('invalid')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })
    await supabase.auth.signOut()

    if (error) {
      setError(error.message)
      setStatus('idle')
      return
    }

    setStatus('success')
    setTimeout(() => navigate('/login'), 2000)
  }

  if (ready === 'invalid') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>Kebab Is Kebab</div>
          <h1 className={styles.title}>Invalid link</h1>
          <p className={styles.sub}>This reset link has expired or is invalid. Please request a new one.</p>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', marginTop: '1rem' }}>
            Back to Login
          </button>
        </div>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>Kebab Is Kebab</div>
          <h1 className={styles.title}>Checking link…</h1>
          <p className={styles.sub}>Please wait while we verify your reset link.</p>
        </div>
      </main>
    )
  }

  if (status === 'success') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Password updated!</h2>
          <p className={styles.sub}>Taking you to login…</p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Kebab Is Kebab</div>
        <h1 className={styles.title}>Set new password</h1>
        <p className={styles.sub}>Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label>New Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="········" required minLength={8}
            />
            <span className={styles.fieldHint}>At least 8 characters</span>
          </div>
          <div className={styles.field}>
            <label>Confirm Password</label>
            <input
              type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="········" required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={status === 'loading'} style={{ width: '100%' }}>
            {status === 'loading' ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  )
}