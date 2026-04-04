import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import styles from './OrderConfirmation.module.css'
import { BASE } from '../api'

export default function OrderConfirmation() {
  const [searchParams]      = useSearchParams()
  const sessionId           = searchParams.get('session_id')
  const navigate            = useNavigate()
  const { clearCart }       = useCart()
  const cardRef             = useRef(null)

  const [status, setStatus] = useState('loading')
  const [order,  setOrder]  = useState(null)
  const [errMsg, setErrMsg] = useState('')

  // Manually trigger fade-in once — not tied to cart state
  useEffect(() => {
    if (status === 'success' && cardRef.current) {
      requestAnimationFrame(() => {
        cardRef.current?.classList.add('visible')
      })
    }
  }, [status])

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setErrMsg('No session ID found. Did you arrive here directly?')
      return
    }

    // If opened by Stripe redirect in a new tab, message the opener and let it handle navigation
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'STRIPE_COMPLETE', session_id: sessionId },
        window.location.origin
      )
      // This tab will be closed by the opener — just show a brief message
      return
    }

    fetch(`${BASE}/orders/verify/${sessionId}`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.detail || 'Could not verify payment.')
        }
        return res.json()
      })
      .then(data => {
        setOrder(data)
        setStatus('success')
        // Clear cart after a tick so it doesn't interfere with this render
        setTimeout(() => clearCart(), 100)
      })
      .catch(err => {
        setStatus('error')
        setErrMsg(err.message)
      })
  }, [sessionId])

  // ── Loading ──
  if (status === 'loading') {
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>Confirming your payment…</p>
        </div>
      </main>
    )
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <div className={styles.errorIcon}>✕</div>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '36ch', textAlign: 'center' }}>{errMsg}</p>
          <button className="btn-primary" onClick={() => navigate('/checkout')}>Back to Checkout</button>
        </div>
      </main>
    )
  }

  // ── Success ──
  return (
    <main className={styles.page}>
      <div ref={cardRef} className={`${styles.card} fade-up`}>
        <div className={styles.iconWrap}>✓</div>
        <span className="section-tag" style={{ textAlign: 'center', display: 'block' }}>
          Payment Confirmed
        </span>
        <h1 className={styles.heading}>Thanks for your order!</h1>
        <p className={styles.sub}>
          A confirmation has been sent to <strong>{order.customer_email}</strong>.
          Please show this order number when you pick up.
        </p>

        <div className={styles.orderNumber}>
          <div className={styles.orderNumberLabel}>Order Number</div>
          <div className={styles.orderNumberValue}>{order.order_number}</div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Pick Up</div>
            <div className={styles.detailValue}>{order.pickup_fmt}</div>
          </div>
          <div className={styles.detailItem}>
            <div className={styles.detailLabel}>Total Paid</div>
            <div className={styles.detailValue}>${order.total.toFixed(2)}</div>
          </div>
        </div>

        <div className={styles.pickupBox}>
          🏪 Pick up at: <strong>91 Queen St, St Marys NSW 2760</strong><br />
          <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
            Pick-up only — no delivery available through this website.
          </span>
        </div>

        <div className={styles.actions}>
          <button className="btn-primary" onClick={() => navigate('/menu')}>Order More</button>
          <button className="btn-outline" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    </main>
  )
}