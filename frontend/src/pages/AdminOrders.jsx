import { useState, useEffect, useCallback, useRef } from 'react'
import { useOrderNotifications } from '../hooks/useOrderNotifications'
import styles from './AdminOrders.module.css'

const STATUS_LABELS = {
  confirmed:    { label: 'New',          color: '#e87070' },
  acknowledged: { label: 'Acknowledged', color: '#f5c842' },
  ready:        { label: 'Ready',        color: '#4caf7d' },
  completed:    { label: 'Completed',    color: '#8a8278' },
}

function OrderCard({ order, onAcknowledge, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const isNew      = !order.acknowledged
  const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.confirmed

  return (
    <div className={`${styles.orderCard} ${isNew ? styles.orderCardNew : ''}`}>
      <div className={styles.orderHeader} onClick={() => setExpanded(e => !e)}>
        <div className={styles.orderHeaderLeft}>
          {isNew && <span className={styles.newDot} />}
          <div>
            <div className={styles.orderNumber}>{order.order_number}</div>
            <div className={styles.orderTime}>
              {new Date(order.created_at).toLocaleString('en-AU', {
                day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit'
              })}
              {order.pickup_fmt && <span className={styles.pickupTime}> · Pickup: {order.pickup_fmt}</span>}
            </div>
          </div>
        </div>
        <div className={styles.orderHeaderRight}>
          <span className={styles.statusBadge} style={{ background: statusInfo.color + '22', color: statusInfo.color }}>
            {statusInfo.label}
          </span>
          <span className={styles.orderTotal}>${Number(order.total).toFixed(2)}</span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.orderBody}>
          <div className={styles.customerInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Name</span>
              <span>{order.customer_name || '—'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <a href={`mailto:${order.customer_email}`} className={styles.infoLink}>{order.customer_email || '—'}</a>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Phone</span>
              <a href={`tel:${order.customer_phone}`} className={styles.infoLink}>{order.customer_phone || '—'}</a>
            </div>
            {order.notes && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Notes</span>
                <span className={styles.notesText}>{order.notes}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Account</span>
              <span>{order.user_id ? '👤 Registered' : '👤 Guest'}</span>
            </div>
          </div>

          <div className={styles.itemList}>
            {(order.items || []).map((item, i) => (
              <div key={i} className={styles.orderItem}>
                <span className={styles.itemEmoji}>{item.emoji}</span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.sel_labels?.length > 0 && (
                    <div className={styles.itemSels}>
                      {item.sel_labels.map((s, j) => <span key={j}>{s}</span>)}
                    </div>
                  )}
                </div>
                <span className={styles.itemQty}>×{item.quantity}</span>
                <span className={styles.itemPrice}>${Number(item.line_total).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className={styles.orderActions}>
            {!order.acknowledged && (
              <button className={styles.acknowledgeBtn} onClick={() => onAcknowledge(order.id)}>
                ✓ Acknowledge Order
              </button>
            )}
            <select
              className={styles.statusSelect}
              value={order.status}
              onChange={e => onStatusChange(order.id, e.target.value)}
            >
              <option value="confirmed">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="ready">Ready for Pickup</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrders({ token }) {
  const [orders,        setOrders]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const [unackOrders,   setUnackOrders]   = useState([])
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const audioRef      = useRef(null)
  const searchTimeout = useRef(null)

  // Initialise audio element
  useEffect(() => {
    audioRef.current = new Audio('/notification.wav')
    audioRef.current.loop = true
  }, [])

  // Unlock audio with a single user interaction
  const unlockAudio = () => {
    audioRef.current?.play().then(() => {
      audioRef.current?.pause()
      if (audioRef.current) audioRef.current.currentTime = 0
      setAudioUnlocked(true)
      // If there are already unacknowledged orders, start the sound now
      if (unackOrders.length > 0) {
        audioRef.current?.play().catch(() => {})
      }
    }).catch((err) => {
      console.warn('Audio unlock failed:', err)
      setAudioUnlocked(true)
    })
  }

  const API       = import.meta.env.VITE_API_URL || '/api'
  const ADMIN_API = API.replace('/api', '/api/admin')

  const adminFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`${ADMIN_API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token, ...options.headers }
    })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return res.json()
  }, [token, ADMIN_API])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search)   params.set('search', search)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo)   params.set('date_to', dateTo)
      params.set('limit', '200')
      const data = await adminFetch(`/orders?${params}`)
      setOrders(data.orders || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [adminFetch, statusFilter, search, dateFrom, dateTo])

  const loadOrdersRef = useRef(loadOrders)
  useEffect(() => { loadOrdersRef.current = loadOrders }, [loadOrders])
  useEffect(() => { loadOrders() }, [loadOrders])

  const handleSearch = e => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(loadOrders, 400)
  }

  const handleAcknowledge = async (orderId) => {
    try {
      await adminFetch(`/orders/${orderId}/acknowledge`, { method: 'PATCH' })
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, acknowledged: true, status: 'acknowledged' } : o
      ))
      setUnackOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleStatusChange = async (orderId, status) => {
    try {
      await adminFetch(`/orders/${orderId}/status?status=${status}`, { method: 'PATCH' })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch (e) {
      setError(e.message)
    }
  }

  // Pass shared audioRef so hook uses the same unlocked audio instance
  const handleNotification = useCallback((newUnackOrders) => {
    setUnackOrders(newUnackOrders)
    loadOrdersRef.current() // always reload, regardless of unack count
  }, [])

  useOrderNotifications(token, handleNotification, true, audioRef)

  const unackCount = orders.filter(o => !o.acknowledged).length

  return (
    <div className={styles.page}>
      {/* Audio unlock banner — must click once at start of shift */}
      {!audioUnlocked && (
        <div className={styles.unlockBanner} onClick={unlockAudio}>
          🔔 Click here to enable order notification sounds
        </div>
      )}

      {/* Unacknowledged alert */}
      {unackOrders.length > 0 && (
        <div className={styles.alertBanner}>
          🔔 {unackOrders.length} new order{unackOrders.length > 1 ? 's' : ''} waiting — scroll down to acknowledge
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by order number…"
          className={styles.searchInput}
          onChange={handleSearch}
        />
        <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="confirmed">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
        </select>
        <input type="date" className={styles.filterSelect} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className={styles.dateSep}>to</span>
        <input type="date" className={styles.filterSelect} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className={styles.clearBtn} onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setStatusFilter('all') }}>
          Clear
        </button>
      </div>

      <div className={styles.summary}>
        {orders.length} orders{unackCount > 0 ? ` · ${unackCount} unacknowledged` : ''}
      </div>

      {error && <p className={styles.error}>⚠️ {error}</p>}

      {loading ? (
        <div className={styles.center}><div className={styles.spinner} /></div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>No orders found.</div>
      ) : (
        <div className={styles.orderList}>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAcknowledge={handleAcknowledge}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}