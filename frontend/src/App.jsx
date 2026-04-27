import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Contact from './pages/Contact'
import CartDrawer from './components/CartDrawer'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import CancelRedirect from './pages/CancelRedirect'
import Admin from './pages/Admin'

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/payment-cancelled" element={<CancelRedirect />} />
          <Route path="/admin" element={<Admin />} />
          {/* Future routes: /order, /admin */}
        </Routes>
        <Footer />
      </BrowserRouter>
    </CartProvider>
  )
}