import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>Kebab Is Kebab</div>
      <div className={styles.copy}>© {new Date().getFullYear()} Kebab Is Kebab · 91 Queen St, St Marys NSW 2760</div>
      <div className={styles.links}>
        <Link to="/contact">Contact Us</Link>
        <Link to="/menu">Menu</Link>
        <a href="/#reviews">Reviews</a>
        <a href="/#find-us">Find Us</a>
        <a href="https://share.google/oNPyOJQXFw2omHA4j" target="_blank" rel="noopener noreferrer">Google</a>
      </div>
    </footer>
  )
}
