import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/'

  const [mode,   setMode]   = useState('login')  // login | signup
  const [form,   setForm]   = useState({ name: '', email: '', password: '' })
  const [error,  setError]  = useState('')
  const [status, setStatus] = useState('idle')   // idle | loading | success

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
          emailRedirectTo: `${window.location.origin}/profile`,
        },
      })
      if (error) { setError(error.message); setStatus('idle'); return }
      setStatus('success')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })
      if (error) { setError(error.message); setStatus('idle'); return }
      navigate(from, { replace: true })
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    })
  }

  if (status === 'success') {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.title}>Check your email</h2>
          <p className={styles.sub}>
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          <button className="btn-outline" onClick={() => setMode('login') || setStatus('idle')}>
            Back to Login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Kebab Is Kebab</div>
        <h1 className={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className={styles.sub}>
          {mode === 'login'
            ? 'Sign in to pre-fill your details and view order history.'
            : 'Save your details for faster ordering next time.'}
        </p>

        {/* Google button */}
        <button className={styles.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className={styles.divider}><span>or</span></div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label>Full Name</label>
              <input
                type="text" value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Jane Smith" required
              />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="jane@example.com" required
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password" value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="········" required minLength={6}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={status === 'loading'} style={{ width: '100%' }}>
            {status === 'loading'
              ? 'Please wait…'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  )
}