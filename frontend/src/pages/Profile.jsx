import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useFadeUp } from '../hooks/useFadeUp'
import styles from './Profile.module.css'
import { BASE } from '../api'

// ── Order history ─────────────────────────────────────────────────────────────
function OrderCard({ order, onReorder }) {
  const [expanded, setExpanded] = useState(false)
  const items = order.items || []

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderHeader} onClick={() => setExpanded(e => !e)}>
        <div className={styles.orderMeta}>
          <span className={styles.orderNumber}>{order.order_number}</span>
          <span className={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-AU', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
        <div className={styles.orderRight}>
          <span className={styles.orderTotal}>${Number(order.total).toFixed(2)}</span>
          <span className={styles.orderChevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.orderBody}>
          {items.map((item, i) => (
            <div key={i} className={styles.orderItem}>
              <span className={styles.orderItemEmoji}>{item.emoji}</span>
              <div className={styles.orderItemInfo}>
                <span className={styles.orderItemName}>{item.name}</span>
                {item.sel_labels?.length > 0 && (
                  <span className={styles.orderItemSels}>{item.sel_labels.join(' · ')}</span>
                )}
              </div>
              <span className={styles.orderItemQty}>×{item.quantity}</span>
              <span className={styles.orderItemPrice}>${Number(item.line_total).toFixed(2)}</span>
            </div>
          ))}
          <button className={styles.reorderBtn} onClick={() => onReorder(order)}>
            🔄 Reorder
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main profile page ─────────────────────────────────────────────────────────
export default function Profile() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const { addItem } = useCart()
  const navigate    = useNavigate()
  const headerRef   = useFadeUp()

  const [form,    setForm]    = useState({ full_name: '', phone: '' })
  const [orders,  setOrders]  = useState([])
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [tab,     setTab]     = useState('details') // details | history

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true })
  }, [user, loading, navigate])

  // Pre-fill form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone:     profile.phone     || '',
      })
    }
  }, [profile])

  // Load order history
  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setOrdersLoading(false)
      })
  }, [user])

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReorder = (order) => {
    fetch(`${BASE}/menu`)
      .then(r => r.json())
      .then(data => {
        const menuMap = Object.fromEntries(data.items.map(i => [i.id, i]))
        for (const orderItem of order.items) {
          const menuItem = menuMap[orderItem.menu_item_id]
          if (!menuItem) continue
          const selections = orderItem.selections || {}
          // Add once per quantity
          for (let q = 0; q < orderItem.quantity; q++) {
            addItem(menuItem, selections)
          }
        }
        navigate('/checkout')
      })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.center}>
          <div className={styles.spinner} />
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div ref={headerRef} className={`${styles.header} fade-up`}>
        <div>
          <span className="section-tag">My Account</span>
          <h1>
            {profile?.full_name
              ? `Hey, ${profile.full_name.split(' ')[0]}!`
              : 'My Profile'}
          </h1>
        </div>
        <button className="btn-outline" onClick={handleSignOut}>Sign Out</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'details' ? styles.tabActive : ''}`} onClick={() => setTab('details')}>
          My Details
        </button>
        <button className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => setTab('history')}>
          Order History {orders.length > 0 && <span className={styles.tabBadge}>{orders.length}</span>}
        </button>
      </div>

      {/* Details tab */}
      {tab === 'details' && (
        <div className={styles.section}>
          <p className={styles.sectionDesc}>
            These details will be pre-filled at checkout to save you time.
          </p>
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input
                type="text" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Jane Smith"
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled className={styles.disabledInput} />
              <span className={styles.fieldHint}>Email can't be changed here</span>
            </div>
            <div className={styles.field}>
              <label>Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="04xx xxx xxx"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Details'}
            </button>
          </form>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className={styles.section}>
          {ordersLoading ? (
            <div className={styles.center}><div className={styles.spinner} /></div>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>
              <p>No orders yet.</p>
              <button className="btn-primary" onClick={() => navigate('/menu')}>Order Now</button>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map(order => (
                <OrderCard key={order.id} order={order} onReorder={handleReorder} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}