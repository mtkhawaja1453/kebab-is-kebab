import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'

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
import Login from './pages/Login'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Redirect to home if already logged in
function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

// Redirect to login if not logged in  
function AuthOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Navbar />
        <CartDrawer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/payment-cancelled" element={<CancelRedirect />} />
          <Route path="/login"         element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/reset-password" element={<ResetPassword />} />  {/* no guard — needs to work from email */}
          <Route path="/profile"       element={<AuthOnly><Profile /></AuthOnly>} />
          <Route path="/checkout"      element={<Checkout />} />  {/* no guard — guests can checkout */}
          <Route path="/admin"         element={<Admin />} />  {/* has own password guard */}
        </Routes>
        <Footer />
      </BrowserRouter>
    </CartProvider>
    </AuthProvider>
  )
}