import { useState } from 'react'
import { submitContact } from '../api'
import { useFadeUp } from '../hooks/useFadeUp'
import styles from './Contact.module.css'

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.name.trim())
    errors.name = 'Name is required.'
  if (!form.email.trim())
    errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Please enter a valid email address.'
  if (!form.message.trim())
    errors.message = 'Message is required.'
  else if (form.message.trim().length < 10)
    errors.message = 'Message must be at least 10 characters.'
  return errors
}

export default function Contact() {
  const headerRef = useFadeUp()
  const formRef   = useFadeUp(100)

  const [form,    setForm]    = useState({ name: '', email: '', message: '' })
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})
  const [status,  setStatus]  = useState('idle') // idle | loading | success | error
  const [serverError, setServerError] = useState('')

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (touched[name]) {
      const next = { ...form, [name]: value }
      const errs = validate(next)
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  const handleBlur = e => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const errs = validate(form)
    setErrors(prev => ({ ...prev, [name]: errs[name] }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setTouched({ name: true, email: true, message: true })
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setStatus('loading')
    setServerError('')
    try {
      await submitContact({
        name:    form.name.trim(),
        email:   form.email.trim(),
        message: form.message.trim(),
      })
      setStatus('success')
      setForm({ name: '', email: '', message: '' })
      setTouched({})
    } catch (err) {
      setStatus('error')
      setServerError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const reset = () => {
    setStatus('idle')
    setErrors({})
    setTouched({})
    setServerError('')
  }

  return (
    <main className={styles.page}>
      <div ref={headerRef} className={`${styles.header} fade-up`}>
        <span className="section-tag">Get In Touch</span>
        <h1>Contact Us</h1>
        <p className={styles.headerSub}>
          Have a question, feedback, or a catering enquiry? Drop us a message and we'll get back to you.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.info}>
          {[
            { label: 'Visit Us',     value: '91 Queen St\nSt Marys NSW 2760' },
            { label: 'Hours',        value: 'Sun - Thur: 11am - 12am\nFri - Sat: 11am - 2:30pm' },
            { label: 'Order Online', value: 'UberEats · DoorDash' },
          ].map(({ label, value }) => (
            <div key={label} className={styles.infoBlock}>
              <div className={styles.infoLabel}>{label}</div>
              <div className={styles.infoValue}>
                {value.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
              </div>
            </div>
          ))}
          <a
            href="https://maps.google.com/?q=91+Queen+St+St+Marys+NSW+2760"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsBtn}
          >
            ↗ Get Directions
          </a>
        </div>

        <div ref={formRef} className={`${styles.formWrap} fade-up`}>
          {status === 'success' ? (
            <div className={styles.successMsg}>
              <div className={styles.successIcon}>✓</div>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We'll get back to you soon.</p>
              <button className="btn-outline" onClick={reset}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              <div className={styles.field}>
                <label htmlFor="name">Your Name</label>
                <input
                  id="name" name="name" type="text"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Jane Smith"
                  className={errors.name && touched.name ? styles.inputError : ''}
                />
                {errors.name && touched.name && (
                  <span className={styles.fieldError}>{errors.name}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email" name="email" type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="jane@example.com"
                  className={errors.email && touched.email ? styles.inputError : ''}
                />
                {errors.email && touched.email && (
                  <span className={styles.fieldError}>{errors.email}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="message">Message</label>
                <textarea
                  id="message" name="message"
                  value={form.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Your message…"
                  rows={5}
                  className={errors.message && touched.message ? styles.inputError : ''}
                />
                {errors.message && touched.message && (
                  <span className={styles.fieldError}>{errors.message}</span>
                )}
              </div>

              {status === 'error' && (
                <p className={styles.serverError}>⚠️ {serverError}</p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'loading'}
                style={{ width: '100%' }}
              >
                {status === 'loading' ? 'Sending…' : 'Send Message'}
              </button>

            </form>
          )}
        </div>
      </div>
    </main>
  )
}