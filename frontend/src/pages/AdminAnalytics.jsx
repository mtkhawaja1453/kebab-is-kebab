import { useState, useEffect, useCallback } from 'react'
import styles from './AdminAnalytics.module.css'

function StatCard({ label, value, sub }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, color = 'var(--amber)', prefix = '', suffix = '', maxDecimals = 0 }) {
  if (!data?.length) return <p className={styles.empty}>No data yet.</p>
  const max = Math.max(...data.map(d => d[valueKey]))
  return (
    <div className={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.barRow}>
          <span className={styles.barLabel} title={d[labelKey]}>{d[labelKey]}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${max > 0 ? (d[valueKey] / max) * 100 : 0}%`, background: color }}
            />
          </div>
          <span className={styles.barValue}>
            {prefix}{typeof d[valueKey] === 'number' ? d[valueKey].toFixed(maxDecimals) : d[valueKey]}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }) {
  if (!data?.length) return <p className={styles.empty}>No data yet.</p>
  const total = data.reduce((s, d) => s + d.value, 0)
  const colors = ['var(--amber)', '#4caf7d', '#5b9cf6', '#e87070', '#b87af5', '#f5c842']

  let cumulative = 0
  const slices = data.map((d, i) => {
    const pct   = d.value / total
    const start = cumulative
    cumulative += pct
    return { ...d, pct, start, color: colors[i % colors.length] }
  })

  // SVG donut
  const size = 120, cx = 60, cy = 60, r = 45, stroke = 20
  const circumference = 2 * Math.PI * r

  return (
    <div className={styles.donut}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.pct * circumference} ${circumference}`}
            strokeDashoffset={-s.start * circumference}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--warm-white)" fontSize="11" fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--muted)" fontSize="8">
          orders
        </text>
      </svg>
      <div className={styles.donutLegend}>
        {slices.map((s, i) => (
          <div key={i} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendValue}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminAnalytics({ token }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [days,    setDays]    = useState(30)

  const API       = import.meta.env.VITE_API_URL || '/api'
  const ADMIN_API = API.replace('/api', '/api/admin')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${ADMIN_API}/analytics?days=${days}`, {
        headers: { 'X-Admin-Token': token }
      })
      if (!res.ok) throw new Error('Failed to load analytics')
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, days, ADMIN_API])

  useEffect(() => { load() }, [load])

  const hourLabel = h => {
    const suffix = h >= 12 ? 'pm' : 'am'
    const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${h12}${suffix}`
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>Last</span>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            className={`${styles.dayBtn} ${days === d ? styles.dayBtnActive : ''}`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>⚠️ {error}</p>}

      {loading ? (
        <div className={styles.center}><div className={styles.spinner} /></div>
      ) : data ? (
        <>
          {/* ── Summary stats ── */}
          <div className={styles.statsGrid}>
            <StatCard label="Total Revenue" value={`$${data.total_revenue.toFixed(2)}`} />
            <StatCard label="Total Orders"  value={data.total_orders} />
            <StatCard label="Average Order" value={`$${data.avg_order.toFixed(2)}`} />
          </div>

          {/* ── Repeat customer rate ── */}
          {data.repeat_rate && (
            <div className={styles.repeatCard}>
              <div className={styles.chartTitle}>👥 Customer Breakdown</div>
              <div className={styles.repeatGrid}>
                <div className={styles.repeatStat}>
                  <div className={styles.repeatValue}>{data.repeat_rate.orders_with_account}</div>
                  <div className={styles.repeatLabel}>Account orders</div>
                </div>
                <div className={styles.repeatStat}>
                  <div className={styles.repeatValue}>{data.repeat_rate.guest_orders}</div>
                  <div className={styles.repeatLabel}>Guest orders</div>
                </div>
                <div className={styles.repeatStat}>
                  <div className={styles.repeatValue}>{data.repeat_rate.unique_users}</div>
                  <div className={styles.repeatLabel}>Unique customers</div>
                </div>
                <div className={styles.repeatStat}>
                  <div className={styles.repeatValue} style={{ color: '#4caf7d' }}>{data.repeat_rate.repeat_users}</div>
                  <div className={styles.repeatLabel}>Repeat customers</div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.chartsGrid}>
            {/* Most ordered items */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>🏆 Most Ordered Items</div>
              <BarChart
                data={data.top_items}
                valueKey="quantity"
                labelKey="name"
              />
            </div>

            {/* Revenue by item */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>💰 Revenue by Item</div>
              <BarChart
                data={[...data.top_items].sort((a,b) => b.revenue - a.revenue)}
                valueKey="revenue"
                labelKey="name"
                color="#4caf7d"
                prefix="$"
                maxDecimals={2}
              />
            </div>

            {/* Day of week */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>📅 Busiest Days</div>
              <BarChart
                data={data.day_of_week}
                valueKey="orders"
                labelKey="day"
                color="#b87af5"
              />
            </div>

            {/* Peak hours with revenue */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>🕐 Peak Order Hours</div>
              <BarChart
                data={data.peak_hours.map(h => ({ ...h, hourLabel: hourLabel(h.hour) }))}
                valueKey="orders"
                labelKey="hourLabel"
                color="var(--amber)"
              />
            </div>

            {/* Average order value by day */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>📈 Average Order Value by Day</div>
              <BarChart
                data={data.avg_order_by_day}
                valueKey="avg"
                labelKey="date"
                color="#5b9cf6"
                prefix="$"
                maxDecimals={2}
              />
            </div>

            {/* Top customisation options */}
            <div className={styles.chartCard}>
              <div className={styles.chartTitle}>🎛️ Popular Customisations</div>
              <BarChart
                data={data.top_options}
                valueKey="count"
                labelKey="name"
                color="#f5c842"
              />
            </div>

            {/* Revenue by category */}
            {data.category_revenue?.length > 0 && (
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>🗂️ Revenue by Category</div>
                <BarChart
                  data={data.category_revenue}
                  valueKey="revenue"
                  labelKey="name"
                  color="#b87af5"
                  prefix="$"
                  maxDecimals={2}
                />
              </div>
            )}
          </div>

          {/* Daily revenue full width */}
          <div className={styles.chartCardWide}>
            <div className={styles.chartTitle}>📆 Daily Revenue</div>
            <BarChart
              data={data.daily_revenue}
              valueKey="revenue"
              labelKey="date"
              color="#5b9cf6"
              prefix="$"
              maxDecimals={2}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}