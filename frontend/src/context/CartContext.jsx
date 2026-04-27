import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'kik_cart'

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

// Calculate the total price of one cart line including option add-ons
export function linePrice(cartItem) {
  const base = cartItem.item.price
  let addons = 0
  if (cartItem.selections && cartItem.item.option_groups) {
    for (const group of cartItem.item.option_groups) {
      const chosen = cartItem.selections[group.id] || []
      for (const choiceId of chosen) {
        const choice = group.options.find(o => o.id === choiceId)
        if (choice) addons += choice.price_add
      }
    }
  }
  return (base + addons) * cartItem.quantity
}

// Unique cart key — same item with different selections = different cart lines
function cartKey(itemId, selections) {
  if (!selections || Object.keys(selections).length === 0) return `${itemId}`
  const sorted = Object.keys(selections).sort()
    .map(k => `${k}:${[...(selections[k])].sort().join(',')}`)
    .join('|')
  return `${itemId}__${sorted}`
}

export function CartProvider({ children }) {
  const [items,  setItems]  = useState(() => loadCart())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => { saveCart(items) }, [items])

  const addItem = useCallback((menuItem, selections = {}) => {
    const key = cartKey(menuItem.id, selections)
    setItems(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { key, item: menuItem, quantity: 1, selections }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((key) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }, [])

  const updateQuantity = useCallback((key, quantity) => {
    if (quantity < 1) {
      setItems(prev => prev.filter(i => i.key !== key))
    } else {
      setItems(prev => prev.map(i => i.key === key ? { ...i, quantity } : i))
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + linePrice(i), 0)

  return (
    <CartContext.Provider value={{
      items, isOpen, setIsOpen,
      addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}