import { Link } from 'react-router-dom'
import { useFadeUp } from '../hooks/useFadeUp'
import styles from './Home.module.css'

/* ── Individual sections ─────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <div className={styles.heroTag}>St Marys, Sydney</div>
        <h1 className={styles.heroHeading}>
          The <em>Best</em><br />Kebab in<br />the West.
        </h1>
        <p className={styles.heroSub}>
          Juicy, generous, and made with care. Kebab Is Kebab has been St Mary's
          favourite takeaway — legendary flavours, every single time.
        </p>
        <div className={styles.heroActions}>
          <Link to="/menu" className="btn-primary">View Our Menu</Link>
          <a href="#find-us" className="btn-outline">Find Us</a>
        </div>
        <div className={styles.heroStars}>
          <span className={styles.starsIcon}>★★★★★</span>
          <span>4.3 rating · 150+ happy customers on Google</span>
        </div>
      </div>
      <div className={styles.heroRight}>
        <div className={styles.heroImgGrid}>
          <div className={`${styles.imgSlot} ${styles.imgSlotLarge}`}>
            <img
              src="https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80"
              alt="Freshly made kebab wrap"
              className={styles.foodImg}
            />
          </div>
          <div className={styles.imgSlot}>
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=75"
              alt="Turkish pide pizza"
              className={styles.foodImg}
            />
          </div>
          <div className={styles.imgSlot}>
            <img
              src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80"
              alt="Hot crispy chips"
              className={styles.foodImg}
            />
          </div>
          <div className={`${styles.imgSlot} ${styles.imgSlotLarge}`}>
            <img
              src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=75"
              alt="Burger"
              className={styles.foodImg}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function Marquee() {
  const items = [
    'Kebab Is Kebab', 'St Marys, Sydney', 'Best in the West',
    'Takeaway & Delivery', 'Fresh Every Day', 'Generous Servings',
  ]
  const repeated = [...items, ...items]
  return (
    <div className={styles.marqueeWrap} aria-hidden="true">
      <div className={styles.marqueeInner}>
        {repeated.map((t, i) => (
          <span key={i} className={i % items.length === 0 ? styles.marqueeDot : undefined}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function About() {
  const textRef = useFadeUp()
  const imgRef = useFadeUp(150)
  return (
    <section id="about" className={styles.about}>
      <div ref={textRef} className={`${styles.aboutText} fade-up`}>
        <span className="section-tag">Our Story</span>
        <h2>More Than a Kebab —<br />It's a St Marys Institution.</h2>
        <p>
          Nestled in the heart of St Marys, Kebab Is Kebab has become the go-to spot
          for locals craving something truly satisfying. We keep it simple: quality
          ingredients, proper seasoning, and a commitment to getting every kebab right.
        </p>
        <p>
          Whether you're after a classic lamb wrap, a loaded pide, or a box of golden
          chips — we've got you covered. Friendly service, fair prices, and food that
          never disappoints.
        </p>
        <div className={styles.stats}>
          {[
            { num: '150+', label: 'Google Reviews' },
            { num: '4.3', label: 'Star Rating' },
            { num: '177+', label: 'Photos Shared' },
            { num: '★ #1', label: 'St Marys Kebab' },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statNum}>{s.num}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div ref={imgRef} className={`${styles.aboutVisual} fade-up`}>
        {/* <div className={styles.aboutCard}>🥙</div> */}
         <div className={`${styles.imgSlot} ${styles.imgSlotLarge}`}>
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
              alt="Freshly made kebab wrap"
              className={styles.foodImg}
            />
          </div>
        <div className={styles.aboutBadge}>
          <small>Locals</small>
          Love Us
          <small>Since Day 1</small>
        </div>
      </div>
    </section>
  )
}

function MenuPreview() {
  const headerRef = useFadeUp()
  const highlights = [
    { emoji: '🌯', name: 'Classic Lamb Wrap', price: 'From $12', tag: 'Best Seller' },
    { emoji: '🍕', name: 'Pide Pizza', price: 'From $14', tag: 'Fan Fave' },
    { emoji: '🍟', name: 'Loaded Chips', price: 'From $6', tag: 'Crowd Pleaser' },
  ]
  return (
    <section id="menu-preview" className={styles.menuPreview}>
      <div ref={headerRef} className={`${styles.sectionHeader} fade-up`}>
        <span className="section-tag">What We Serve</span>
        <h2>Menu Highlights</h2>
      </div>
      <div className={styles.menuGrid}>
        {highlights.map((item, i) => {
          const ref = useFadeUp(i * 100)
          return (
            <div key={item.name} ref={ref} className={`${styles.menuCard} fade-up`}>
              <div className={styles.menuCardImg}>{item.emoji}</div>
              <div className={styles.menuCardBody}>
                <div className={styles.menuCardName}>{item.name}</div>
                <div className={styles.menuCardFooter}>
                  <span className={styles.menuCardPrice}>{item.price}</span>
                  <span className={styles.menuCardTag}>{item.tag}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className={styles.menuCta}>
        <Link to="/menu" className="btn-primary">See Full Menu</Link>
      </div>
    </section>
  )
}

function Reviews() {
  const headerRef = useFadeUp()
  const reviews = [
    { initial: 'N', text: 'Always crunchy, seasoned and never mouldy. Kebab is excellent with great size-to-price value. With the friendly and clear service, it is a great store.', stars: 5 },
    { initial: 'A', text: "We love Kebab! It's truly the best in the St Mary's area. We've had so many great memories here, and the food never disappoints. Delicious kebabs, generous servings!", stars: 5 },
    { initial: 'G', text: 'Juicy and tasty kebabs. The only bad thing about this place is the location — but honestly the food speaks for itself.', stars: 5 },
  ]
  return (
    <section id="reviews" className={styles.reviews}>
      <div ref={headerRef} className={`${styles.sectionHeader} fade-up`}>
        <span className="section-tag">What People Say</span>
        <h2>Loved by the Community</h2>
      </div>

      <div className={styles.ratingSummary}>
        <div className={styles.ratingBig}>4.3</div>
        <div className={styles.ratingMeta}>
          <div className={styles.ratingStars}>★★★★★</div>
          <div className={styles.ratingCount}>Based on 150 Google Reviews</div>
        </div>
        <div className={styles.ratingBars}>
          {[['5', '68%'], ['4', '15%'], ['3', '8%'], ['2', '4%'], ['1', '5%']].map(([label, width]) => (
            <div key={label} className={styles.barRow}>
              <span>{label}</span>
              <div className={styles.barBg}><div className={styles.barFill} style={{ width }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reviewsGrid}>
        {reviews.map((r, i) => {
          const ref = useFadeUp(i * 100)
          return (
            <div key={r.initial + i} ref={ref} className={`${styles.reviewCard} fade-up`}>
              <div className={styles.reviewQuote}>"</div>
              <div className={styles.reviewStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
              <p className={styles.reviewText}>{r.text}</p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar}>{r.initial}</div>
                <div>
                  <div className={styles.authorName}>{r.initial}.</div>
                  <div className={styles.authorVia}>via Google</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <a
          href="https://share.google/oNPyOJQXFw2omHA4j"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          Read All Reviews on Google
        </a>
      </div>
    </section>
  )
}

function FindUs() {
  const headerRef = useFadeUp()
  const infoRef = useFadeUp()
  const mapRef = useFadeUp(150)
  return (
    <section id="find-us" className={styles.findUs}>
      <div ref={headerRef} className={`${styles.sectionHeader} fade-up`}>
        <span className="section-tag">Visit Us</span>
        <h2>Come Say Hello</h2>
      </div>
      <div className={styles.findGrid}>
        <div ref={infoRef} className="fade-up">
          {[
            { label: 'Address', value: '91 Queen St\nSt Marys NSW 2760' },
            { label: 'Hours', value: 'Sun - Thur: 11am - 12am\nFri - Sat: 11am - 2:30pm' },
            { label: 'Order Options', value: 'Walk-in · Collection\nDelivery Available via UberEats & DoorDash' },
          ].map(({ label, value }) => (
            <div key={label} className={styles.infoBlock}>
              <div className={styles.infoLabel}>{label}</div>
              <div className={styles.infoValue}>{value.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}</div>
            </div>
          ))}
          <a
            href="https://maps.google.com/?q=91+Queen+St+St+Marys+NSW+2760"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsBtn}
          >
            ↗ Get Directions
          </a>
        </div>
        <div ref={mapRef} className={`${styles.mapEmbed} fade-up`}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d831.28!2d150.7756!3d-33.7759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b1292d6fa80e3b7%3A0x4c3b8e1c4f3a1234!2s91%20Queen%20St%2C%20St%20Marys%20NSW%202760!5e0!3m2!1sen!2sau!4v1"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Kebab Is Kebab location"
          />
        </div>
      </div>
    </section>
  )
}

/* ── Page export ─────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <About />
      <MenuPreview />
      <Reviews />
      <FindUs />
    </>
  )
}
