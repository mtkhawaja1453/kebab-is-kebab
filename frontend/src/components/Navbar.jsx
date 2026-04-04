import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItems, setIsOpen } = useCart()
  const location = useLocation()

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
        <li><a href="/#about" className={styles.link}>Our Story</a></li>
        <li><a href="/#menu-preview" className={styles.link}>Menu</a></li>
        {/* <li><Link to="/menu" className={styles.link}>Menu</Link></li> */}
        <li><a href="/#reviews" className={styles.link}>Reviews</a></li>
        <li><a href="/#find-us" className={styles.link}>Find Us</a></li>
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
