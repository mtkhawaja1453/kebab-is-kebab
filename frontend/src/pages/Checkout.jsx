import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, linePrice } from '../context/CartContext'
import { useFadeUp } from '../hooks/useFadeUp'
import styles from './Checkout.module.css'
import { BASE } from '../api'

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {}
  if (!form.name.trim())
    errors.name = 'Name is required.'
  if (!form.email.trim())
    errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'Please enter a valid email address.'
  if (!form.phone.trim())
    errors.phone = 'Phone number is required.'
  else if (!/^[\d\s\+\-\(\)]{8,15}$/.test(form.phone.trim()))
    errors.phone = 'Please enter a valid phone number.'
  if (!form.pickupTime)
    errors.pickupTime = 'Please select a pickup time preference.'
  return errors
}

// Generate time slots every 15 min from now+20min until 10pm
function getPickupSlots() {
  const slots = [{ value: 'asap', label: 'ASAP (as soon as possible)' }]
  const close = new Date()
  close.setHours(22, 0, 0, 0)
  const start = new Date(Date.now() + 20 * 60 * 1000)
  start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0)
  let cursor = new Date(start)
  while (cursor <= close) {
    const h   = cursor.getHours()
    const m   = cursor.getMinutes()
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    // Store as a simple local time string, not ISO/UTC
    const value = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
    const label = `${h12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'}`
    slots.push({ value, label })
    cursor = new Date(cursor.getTime() + 15 * 60 * 1000)
  }
  return slots
}

export default function Checkout() {
  const { items, totalPrice } = useCart()
  const navigate  = useNavigate()
  const headerRef = useFadeUp()
  const formRef   = useFadeUp(100)

  const cancelled = new URLSearchParams(window.location.search).get('cancelled')

  const [form,    setForm]    = useState({ name: '', email: '', phone: '', pickupTime: '', notes: '' })
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})
  const [status,  setStatus]  = useState('idle')
  const [serverError, setServerError] = useState('')

  const slots = getPickupSlots()

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items from the menu first.</p>
          <button className="btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
        </div>
      </main>
    )
  }

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (touched[name]) {
      const errs = validate({ ...form, [name]: value })
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
    setTouched({ name: true, email: true, phone: true, pickupTime: true })
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setStatus('loading')
    setServerError('')

    const payload = {
      items: items.map(({ item, quantity, selections }) => ({
        menu_item_id: item.id,
        quantity,
        selections: selections || {},
      })),
      customer_name:  form.name.trim(),
      customer_email: form.email.trim(),
      customer_phone: form.phone.trim(),
      pickup_time:    form.pickupTime,
      notes:          form.notes.trim() || null,
    }

    try {
      const res = await fetch(`${BASE}/orders/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to create payment session')
      }
      const { checkout_url } = await res.json()
      const stripeTab = window.open(checkout_url, '_blank')
      setStatus('idle')

      // Listen for a message back from the Stripe tab when payment completes
      const onMessage = (event) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type === 'STRIPE_COMPLETE') {
          window.removeEventListener('message', onMessage)
          stripeTab?.close()
          navigate(`/order-confirmation?session_id=${event.data.session_id}`)
        }
        if (event.data?.type === 'STRIPE_CANCELLED') {
          window.removeEventListener('message', onMessage)
          stripeTab?.close()
          setStatus('idle')
        }
      }
      window.addEventListener('message', onMessage)
    } catch (err) {
      setStatus('error')
      setServerError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <main className={styles.page}>
      <div ref={headerRef} className={`${styles.header} fade-up`}>
        <span className="section-tag">Almost there</span>
        <h1>Your Order</h1>
      </div>

      {/* Cancelled banner — shown when Stripe redirects back with ?cancelled=true */}
      {cancelled && (
        <div className={styles.cancelledBanner}>
          ⚠️ Payment was cancelled — your details are still here. Try again when you're ready.
        </div>
      )}

      <div className={styles.layout}>

        {/* ── Order summary ── */}
        <div className={styles.summary}>
          <div className={styles.summaryHeader}>Order Summary</div>
          <div className={styles.pickupBanner}>
            🏪 Pick-up only · 91 Queen St, St Marys<br />
            <span>We do not offer delivery through this website.</span>
          </div>
          {items.map((cartItem) => {
            const { item, quantity, selections, key } = cartItem
            const selLines = (item.option_groups || [])
              .map(group => {
                const chosen = (selections || {})[group.id] || []
                if (chosen.length === 0) return null
                const labels = chosen.map(id => {
                  const opt = group.options.find(o => o.id === id)
                  return opt ? (opt.price_add > 0 ? `${opt.label} (+$${opt.price_add.toFixed(2)})` : opt.label) : id
                })
                return { groupLabel: group.label, labels }
              })
              .filter(Boolean)
            return (
              <div key={key} className={styles.summaryItem}>
                <span className={styles.summaryEmoji}>{item.emoji}</span>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryName}>{item.name}</span>
                  {selLines.map((line, i) => (
                    <span key={i} className={styles.summarySels}>
                      <span className={styles.summarySelGroup}>{line.groupLabel}:</span> {line.labels.join(', ')}
                    </span>
                  ))}
                </div>
                <span className={styles.summaryQty}>×{quantity}</span>
                <span className={styles.summaryPrice}>${linePrice(cartItem).toFixed(2)}</span>
              </div>
            )
          })}
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.stripeBadge}>
            🔒 Secure payment via Stripe
          </div>
        </div>

        {/* ── Form ── */}
        <div ref={formRef} className={`${styles.formWrap} fade-up`}>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>

            <div className={styles.formSection}>Your Details</div>

            <div className={styles.field}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name" name="name" type="text"
                value={form.name} onChange={handleChange} onBlur={handleBlur}
                placeholder="Jane Smith"
                className={errors.name && touched.name ? styles.inputError : ''}
              />
              {errors.name && touched.name && <span className={styles.fieldError}>{errors.name}</span>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="jane@example.com"
                  className={errors.email && touched.email ? styles.inputError : ''}
                />
                {errors.email && touched.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone" name="phone" type="tel"
                  value={form.phone} onChange={handleChange} onBlur={handleBlur}
                  placeholder="04xx xxx xxx"
                  className={errors.phone && touched.phone ? styles.inputError : ''}
                />
                {errors.phone && touched.phone && <span className={styles.fieldError}>{errors.phone}</span>}
              </div>
            </div>

            <div className={styles.formSection}>Pickup Details</div>

            <div className={styles.field}>
              <label htmlFor="pickupTime">Preferred Pickup Time</label>
              <select
                id="pickupTime" name="pickupTime"
                value={form.pickupTime} onChange={handleChange} onBlur={handleBlur}
                className={errors.pickupTime && touched.pickupTime ? styles.inputError : ''}
              >
                <option value="">Select a time…</option>
                {slots.length > 0
                  ? slots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)
                  : <option disabled>Store is currently closed</option>
                }
              </select>
              {errors.pickupTime && touched.pickupTime && <span className={styles.fieldError}>{errors.pickupTime}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="notes">
                Special Instructions <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="notes" name="notes"
                value={form.notes} onChange={handleChange}
                placeholder="Allergies, sauce preferences, extra napkins…"
                rows={3}
              />
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
              {status === 'loading'
                ? 'Opening payment…'
                : `Pay $${totalPrice.toFixed(2)} with Stripe ↗`}
            </button>

            <p className={styles.submitNote}>
              🔒 You'll be taken to Stripe's secure payment page. Your card details never touch our server.
            </p>

          </form>
        </div>
      </div>
    </main>
  )
}