// All API calls go through here.
// Because Vite proxies /api → http://localhost:8000, these work in dev with no CORS issues.

// const BASE = import.meta.env.VITE_API_URL || '/api'
export const BASE = import.meta.env.VITE_API_URL || '/api'

export async function fetchMenu(category = null) {
  const url = category ? `${BASE}/menu?category=${category}` : `${BASE}/menu`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load menu')
  return res.json()
}

export async function submitOrder(order) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Order failed')
  }
  return res.json()
}

export async function submitContact(form) {
  const res = await fetch(`${BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}
