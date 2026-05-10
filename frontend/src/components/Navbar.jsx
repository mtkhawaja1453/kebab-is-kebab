import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItems, setIsOpen } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (e, sectionId) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>Kebab Is Kebab</Link>

      <button className={styles.burger} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
        <li><a href="/#about" className={styles.link} onClick={e => handleNavClick(e, 'about')}>Our Story</a></li>
        <li><a href="/#menu-preview" className={styles.link} onClick={e => handleNavClick(e, 'menu-preview')}>Menu</a></li>
        <li><a href="/#reviews" className={styles.link} onClick={e => handleNavClick(e, 'reviews')}>Reviews</a></li>
        <li><a href="/#find-us" className={styles.link} onClick={e => handleNavClick(e, 'find-us')}>Find Us</a></li>
        <li>
          <Link
            to={user ? '/profile' : '/login'}
            className={styles.link}
          >
            {user ? '👤 Profile' : 'Sign In'}
          </Link>
        </li>
        <li>
          <button className={styles.cartBtn} onClick={() => setIsOpen(true)} aria-label="Open cart">
            🛒
            {totalItems > 0 && (
              <span className={styles.cartBadge}>{totalItems}</span>
            )}
          </button>
        </li>
      </ul>
    </nav>
  )
}
