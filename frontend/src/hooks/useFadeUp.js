import { useEffect, useRef } from 'react'

/**
 * Attach this ref to any element you want to fade in on scroll.
 * Usage:  const ref = useFadeUp()
 *         <div ref={ref} className="fade-up"> ... </div>
 */
export function useFadeUp(delay = 0) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (delay) el.style.transitionDelay = `${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return ref
}
