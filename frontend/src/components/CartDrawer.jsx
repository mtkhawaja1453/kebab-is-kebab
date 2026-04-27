import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, linePrice } from '../context/CartContext'
import styles from './CartDrawer.module.css'

function selectionSummary(item, selections) {
  if (!selections || !item.option_groups) return []
  const lines = []
  for (const group of item.option_groups) {
    const chosen = selections[group.id] || []
    if (chosen.length === 0) continue
    const labels = chosen.map(id => {
      const opt = group.options.find(o => o.id === id)
      return opt ? opt.label : id
    })
    lines.push(labels.join(', '))
  }
  return lines
}

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, totalItems } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setIsOpen])

  const handleCheckout = () => {
    setIsOpen(false)
    navigate('/checkout')
  }

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} role="dialog" aria-label="Your cart">
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span>Your Order</span>
            {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close cart">✕</button>
        </div>

        <div className={styles.pickupNotice}>
          🏪 Pick-up only · 91 Queen St, St Marys
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🛒</div>
            <p>Your cart is empty</p>
            <button className="btn-outline" onClick={() => setIsOpen(false)}>Browse Menu</button>
          </div>
        ) : (
          <>
            <div className={styles.itemList}>
              {items.map(cartItem => {
                const selLines = selectionSummary(cartItem.item, cartItem.selections)
                const price    = linePrice(cartItem)
                return (
                  <div key={cartItem.key} className={styles.cartItem}>
                    <div className={styles.itemEmoji}>{cartItem.item.emoji}</div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{cartItem.item.name}</div>
                      {selLines.map((line, i) => (
                        <div key={i} className={styles.itemSel}>{line}</div>
                      ))}
                      <div className={styles.itemPrice}>${price.toFixed(2)}</div>
                    </div>
                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQuantity(cartItem.key, cartItem.quantity - 1)} aria-label="Decrease">−</button>
                      <span>{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(cartItem.key, cartItem.quantity + 1)} aria-label="Increase">+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeItem(cartItem.key)} aria-label="Remove item">✕</button>
                  </div>
                )
              })}
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
              </div>
              <p className={styles.footerNote}>Payment on pick-up · No delivery available</p>
              <button className="btn-primary" onClick={handleCheckout} style={{ width: '100%' }}>
                Place Order →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}