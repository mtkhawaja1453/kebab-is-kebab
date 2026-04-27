import { useState, useEffect, useCallback } from 'react'
import { fetchMenu } from '../api'
import { useFadeUp } from '../hooks/useFadeUp'
import { useCart } from '../context/CartContext'
import ItemModal from '../components/ItemModal'
import styles from './Menu.module.css'

const CATEGORIES = [
  { value: null,      label: 'All' },
  { value: 'kebab',  label: 'Kebabs' },
  { value: 'pizza',  label: 'Pide Pizza' },
  { value: 'sides',  label: 'Sides' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'other',  label: 'Other' },
]

function MenuCard({ item, index, onOpen }) {
  const ref = useFadeUp(index * 60)

  return (
    <div ref={ref} className={`${styles.card} fade-up`} onClick={() => item.available && onOpen(item)} style={{ cursor: item.available ? 'pointer' : 'default' }}>
      <div className={styles.cardEmoji}>{item.emoji}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <h3 className={styles.cardName}>{item.name}</h3>
          {item.tag && <span className={styles.cardTag}>{item.tag}</span>}
        </div>
        <p className={styles.cardDesc}>{item.description}</p>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>${item.price.toFixed(2)}</span>
          {item.available ? (
            <button
              className={styles.addBtn}
              onClick={e => { e.stopPropagation(); onOpen(item) }}
              aria-label={`Customise ${item.name}`}
            >
              + Add
            </button>
          ) : (
            <span className={styles.unavailable}>Unavailable</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Menu() {
  const [items,          setItems]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [modalItem,      setModalItem]      = useState(null)
  const headerRef = useFadeUp()

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchMenu(activeCategory)
      .then(data => setItems(data.items))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [activeCategory])

  const handleOpen  = useCallback(item => setModalItem(item), [])
  const handleClose = useCallback(() => setModalItem(null), [])

  return (
    <main className={styles.page}>
      <div ref={headerRef} className={`${styles.header} fade-up`}>
        <span className="section-tag">91 Queen St, St Marys · Pick-up Only</span>
        <h1>Our Menu</h1>
        <p className={styles.headerSub}>
          Everything made fresh. Click any item to customise and add to your cart.
        </p>
      </div>

      <div className={styles.filters}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.filterActive : ''}`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className={styles.state}>
          <div className={styles.spinner} />
          <p>Loading menu…</p>
        </div>
      )}

      {error && (
        <div className={styles.state}>
          <p className={styles.errorMsg}>
            ⚠️ Couldn't load the menu right now.<br />
            <span>Make sure the backend is running: <code>uvicorn main:app --reload</code></span>
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.grid}>
          {items.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} onOpen={handleOpen} />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <p>Pick-up only — we do not offer delivery through this website.</p>
      </div>

      {/* Item customisation modal */}
      {modalItem && <ItemModal item={modalItem} onClose={handleClose} />}
    </main>
  )
}