import { useEffect } from 'react'

export default function CancelRedirect() {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'STRIPE_CANCELLED' },
        window.location.origin
      )
    }
  }, [])

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: 'var(--muted)' }}>Closing…</p>
    </main>
  )
}