import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'kik_cart'

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage unavailable (private browsing quota etc.) — fail silently
  }
}

export function CartProvider({ children }) {
  const [items,  setItems]  = useState(() => loadCart())  // initialise from localStorage
  const [isOpen, setIsOpen] = useState(false)

  // Sync to localStorage whenever items change
  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = useCallback((menuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.item.id === menuItem.id)
      if (existing) {
        return prev.map(i =>
          i.item.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { item: menuItem, quantity: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems(prev => prev.filter(i => i.item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity < 1) {
      setItems(prev => prev.filter(i => i.item.id !== itemId))
    } else {
      setItems(prev =>
        prev.map(i => i.item.id === itemId ? { ...i, quantity } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0)

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