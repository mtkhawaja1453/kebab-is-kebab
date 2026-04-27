import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import styles from './ItemModal.module.css'

export default function ItemModal({ item, onClose }) {
  const { addItem } = useCart()
  const [selections, setSelections] = useState({})
  const [quantity,   setQuantity]   = useState(1)
  const [errors,     setErrors]     = useState({})

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const groups = item.option_groups || []

  const toggleChoice = (groupId, choiceId, maxSelections) => {
    setSelections(prev => {
      const current = prev[groupId] || []
      if (current.includes(choiceId)) {
        return { ...prev, [groupId]: current.filter(id => id !== choiceId) }
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [choiceId] }
      }
      if (current.length >= maxSelections) return prev
      return { ...prev, [groupId]: [...current, choiceId] }
    })
    setErrors(prev => ({ ...prev, [groupId]: false }))
  }

  // Running unit price including selected add-ons
  const unitPrice = groups.reduce((total, group) => {
    const chosen = selections[group.id] || []
    return total + chosen.reduce((sum, choiceId) => {
      const choice = group.options.find(o => o.id === choiceId)
      return sum + (choice?.price_add || 0)
    }, 0)
  }, item.price)

  const handleAddToCart = () => {
    const newErrors = {}
    let hasError = false
    for (const group of groups) {
      if (group.required && (!selections[group.id] || selections[group.id].length === 0)) {
        newErrors[group.id] = true
        hasError = true
      }
    }
    if (hasError) { setErrors(newErrors); return }

    for (let i = 0; i < quantity; i++) {
      addItem(item, selections)
    }
    onClose()
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={item.name}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerEmoji}>{item.emoji}</span>
            <div>
              <h2 className={styles.title}>{item.name}</h2>
              <p className={styles.desc}>{item.description}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Option groups */}
        <div className={styles.body}>
          {groups.length === 0 ? (
            <p className={styles.noOptions}>No customisation options for this item.</p>
          ) : (
            groups.map(group => {
              const chosen   = selections[group.id] || []
              const isError  = errors[group.id]
              const isSingle = group.max_selections === 1

              return (
                <div key={group.id} className={`${styles.group} ${isError ? styles.groupError : ''}`}>
                  <div className={styles.groupHeader}>
                    <span className={styles.groupLabel}>{group.label}</span>
                    <span className={styles.groupMeta}>
                      {group.required ? 'Required' : 'Optional'}
                      {!isSingle && ` · Choose up to ${group.max_selections}`}
                    </span>
                  </div>
                  {isError && <p className={styles.errorMsg}>Please make a selection</p>}
                  <div className={styles.optionGrid}>
                    {group.options.map(opt => {
                      const selected = chosen.includes(opt.id)
                      const disabled = !selected && !isSingle && chosen.length >= group.max_selections
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`${styles.optionBtn} ${selected ? styles.optionSelected : ''} ${disabled ? styles.optionDisabled : ''}`}
                          onClick={() => !disabled && toggleChoice(group.id, opt.id, group.max_selections)}
                        >
                          <span className={styles.optionLabel}>{opt.label}</span>
                          {opt.price_add > 0 && (
                            <span className={styles.optionPrice}>+${opt.price_add.toFixed(2)}</span>
                          )}
                          {selected && <span className={styles.optionCheck}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.qtyControl}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="Decrease">−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} aria-label="Increase">+</button>
          </div>
          <button className={styles.addBtn} onClick={handleAddToCart}>
            Add to Cart · ${(unitPrice * quantity).toFixed(2)}
          </button>
        </div>

      </div>
    </>
  )
}