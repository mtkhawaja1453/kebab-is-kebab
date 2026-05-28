import { useState, useEffect, useCallback } from 'react'
import styles from './AdminHours.module.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AdminHours({ token }) {
  const [hours,   setHours]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const API       = import.meta.env.VITE_API_URL || '/api'
  const ADMIN_API = API.replace('/api', '/api/admin')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${ADMIN_API}/hours`, {
        headers: { 'X-Admin-Token': token }
      })
      const data = await res.json()
      setHours(data.hours)
    } catch (e) {
      setError('Failed to load hours')
    } finally {
      setLoading(false)
    }
  }, [token, ADMIN_API])

  useEffect(() => { load() }, [load])

  const updateDay = (index, field, value) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${ADMIN_API}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: JSON.stringify(hours),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Quick presets
  const applyPreset = (preset) => {
    setHours(prev => prev.map((h, i) => {
      if (preset === 'allSame') return { ...h, open: '10:00', close: '22:00', closed: false }
      if (preset === 'closeAll') return { ...h, closed: true }
      if (preset === 'weekends') return { ...h, closed: i < 5 } // Mon-Fri closed
      return h
    }))
  }

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  return (
    <div className={styles.page}>
      <p className={styles.desc}>
        Set your opening hours for each day. These control when customers can place online orders and what pickup times are shown.
      </p>

      {/* Quick presets */}
      <div className={styles.presets}>
        <span className={styles.presetsLabel}>Quick set:</span>
        <button className={styles.presetBtn} onClick={() => applyPreset('allSame')}>All days 10am–10pm</button>
        <button className={styles.presetBtn} onClick={() => applyPreset('closeAll')}>Close all days</button>
      </div>

      <div className={styles.dayList}>
        {hours.map((h, i) => (
          <div key={h.day} className={`${styles.dayRow} ${h.closed ? styles.dayRowClosed : ''}`}>
            <div className={styles.dayName}>{h.day}</div>

            <label className={styles.closedToggle}>
              <input
                type="checkbox"
                checked={!h.closed}
                onChange={e => updateDay(i, 'closed', !e.target.checked)}
              />
              <span className={h.closed ? styles.toggleOff : styles.toggleOn}>
                {h.closed ? 'Closed' : 'Open'}
              </span>
            </label>

            {!h.closed && (
              <div className={styles.timePickers}>
                <div className={styles.timeField}>
                  <label>Opens</label>
                  <input
                    type="time"
                    value={h.open}
                    onChange={e => updateDay(i, 'open', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
                <span className={styles.timeSep}>–</span>
                <div className={styles.timeField}>
                  <label>Closes</label>
                  <input
                    type="time"
                    value={h.close}
                    onChange={e => updateDay(i, 'close', e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className={styles.error}>⚠️ {error}</p>}

      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Hours'}
      </button>
    </div>
  )
}