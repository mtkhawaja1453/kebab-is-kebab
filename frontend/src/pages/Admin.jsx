import { useState, useEffect, useCallback } from 'react'
import styles from './Admin.module.css'

const API = import.meta.env.VITE_API_URL || '/api'
const ADMIN_API = API.replace('/api', '/api/admin')

const CATEGORIES = ['kebab', 'pizza', 'sides', 'drinks', "other"]
const EMOJIS     = ['🌯', '🥙', '🍕', '🍟', '🥖', '🥤', '💧', '🍗', '🥗', '🍖', '🧆', '🫔']

const EMPTY_FORM = { name: '', description: '', price: '', category: 'kebab', emoji: '🌯', tag: '', available: true }

// ── API helpers ───────────────────────────────────────────────────────────────
async function adminFetch(path, options = {}, token) {
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [token,  setToken]  = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await adminFetch('/auth', { method: 'POST' }, token)
      onLogin(token)
    } catch {
      setError('Incorrect password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>Kebab Is Kebab</div>
        <h1 className={styles.loginTitle}>Admin Access</h1>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter admin password"
            className={styles.loginInput}
            autoFocus
          />
          {error && <p className={styles.loginError}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Checking…' : 'Login →'}
          </button>
        </form>
      </div>
    </main>
  )
}

// ── Item form (add / edit) ────────────────────────────────────────────────────
function OptionGroupEditor({ groups, onChange }) {
  const addGroup = () => {
    onChange([...groups, {
      id: `group_${Date.now()}`,
      label: '',
      required: false,
      max_selections: 1,
      options: []
    }])
  }

  const updateGroup = (idx, field, value) => {
    const next = [...groups]
    next[idx] = { ...next[idx], [field]: value }
    onChange(next)
  }

  const removeGroup = idx => onChange(groups.filter((_, i) => i !== idx))

  const addOption = idx => {
    const next = [...groups]
    next[idx].options = [...next[idx].options, { id: `opt_${Date.now()}`, label: '', price_add: 0 }]
    onChange(next)
  }

  const updateOption = (gIdx, oIdx, field, value) => {
    const next = [...groups]
    next[gIdx].options[oIdx] = { ...next[gIdx].options[oIdx], [field]: value }
    onChange(next)
  }

  const removeOption = (gIdx, oIdx) => {
    const next = [...groups]
    next[gIdx].options = next[gIdx].options.filter((_, i) => i !== oIdx)
    onChange(next)
  }

  return (
    <div className={styles.optionGroupEditor}>
      <div className={styles.ogHeader}>
        <span className={styles.formSection} style={{ border: 'none', padding: 0, margin: 0 }}>Option Groups</span>
        <button type="button" className={styles.addGroupBtn} onClick={addGroup}>+ Add Group</button>
      </div>

      {groups.length === 0 && (
        <p className={styles.ogEmpty}>No option groups — item goes straight to cart on click.</p>
      )}

      {groups.map((group, gIdx) => (
        <div key={gIdx} className={styles.ogGroup}>
          <div className={styles.ogGroupHeader}>
            <div className={styles.formRow} style={{ flex: 1 }}>
              <div className={styles.field}>
                <label>Group Label</label>
                <input value={group.label} onChange={e => updateGroup(gIdx, 'label', e.target.value)} placeholder="e.g. Meat Option" required />
              </div>
              <div className={styles.field} style={{ maxWidth: 90 }}>
                <label>Max picks</label>
                <input type="number" min="1" max="20" value={group.max_selections} onChange={e => updateGroup(gIdx, 'max_selections', parseInt(e.target.value))} />
              </div>
            </div>
            <label className={styles.checkboxLabel} style={{ flexShrink: 0 }}>
              <input type="checkbox" checked={group.required} onChange={e => updateGroup(gIdx, 'required', e.target.checked)} />
              Required
            </label>
            <button type="button" className={styles.removeGroupBtn} onClick={() => removeGroup(gIdx)}>✕</button>
          </div>

          <div className={styles.ogOptions}>
            {group.options.map((opt, oIdx) => (
              <div key={oIdx} className={styles.ogOption}>
                <input
                  value={opt.label}
                  onChange={e => updateOption(gIdx, oIdx, 'label', e.target.value)}
                  placeholder="Option name"
                  className={styles.ogOptionInput}
                />
                <div className={styles.ogPriceWrap}>
                  <span>+$</span>
                  <input
                    type="number" min="0" step="0.50"
                    value={opt.price_add}
                    onChange={e => updateOption(gIdx, oIdx, 'price_add', parseFloat(e.target.value) || 0)}
                    className={styles.ogPriceInput}
                  />
                </div>
                <button type="button" className={styles.removeOptBtn} onClick={() => removeOption(gIdx, oIdx)}>✕</button>
              </div>
            ))}
            <button type="button" className={styles.addOptBtn} onClick={() => addOption(gIdx)}>+ Add Option</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ItemForm({ initial, onSave, onCancel, loading }) {
  const [form,   setForm]   = useState(initial || EMPTY_FORM)
  const [groups, setGroups] = useState(initial?.option_groups || [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    onSave({
      ...form,
      price:         parseFloat(form.price),
      tag:           form.tag.trim() || null,
      available:     form.available,
      option_groups: groups,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.itemForm}>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label>Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Item name" />
        </div>
        <div className={styles.field} style={{ maxWidth: 90 }}>
          <label>Emoji</label>
          <select value={form.emoji} onChange={e => set('emoji', e.target.value)}>
            {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} required rows={2} placeholder="Short description" />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label>Price ($)</label>
          <input type="number" step="0.50" min="0" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="0.00" />
        </div>
        <div className={styles.field}>
          <label>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Tag <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <input value={form.tag || ''} onChange={e => set('tag', e.target.value)} placeholder="e.g. Best Seller" />
        </div>
      </div>

      <div className={styles.formRow}>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} />
          Available for ordering
        </label>
      </div>

      <div className={styles.formSection} style={{ marginTop: '0.5rem' }}>Customisation</div>
      <OptionGroupEditor groups={groups} onChange={setGroups} />

      <div className={styles.formActions}>
        <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save Item'}
        </button>
      </div>
    </form>
  )
}

// ── Main admin panel ──────────────────────────────────────────────────────────
function AdminPanel({ token, onLogout }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [mode,    setMode]    = useState('list') // list | add | edit
  const [editing, setEditing] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('all')
  const [toast,   setToast]   = useState('')

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadMenu = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetch('/menu', {}, token)
      setItems(data.items)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadMenu() }, [loadMenu])

  const handleAdd = async payload => {
    setSaving(true)
    try {
      await adminFetch('/menu', { method: 'POST', body: JSON.stringify(payload) }, token)
      await loadMenu()
      setMode('list')
      showToast('✅ Item added successfully')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleEdit = async payload => {
    setSaving(true)
    try {
      await adminFetch(`/menu/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, token)
      await loadMenu()
      setMode('list')
      setEditing(null)
      showToast('✅ Item updated successfully')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleToggle = async item => {
    try {
      await adminFetch(`/menu/${item.id}/toggle`, { method: 'PATCH' }, token)
      await loadMenu()
      showToast(`${item.available ? '🔴 Hidden' : '🟢 Shown'}: ${item.name}`)
    } catch (e) { setError(e.message) }
  }

  const handleDelete = async item => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    try {
      await adminFetch(`/menu/${item.id}`, { method: 'DELETE' }, token)
      await loadMenu()
      showToast(`🗑️ Deleted: ${item.name}`)
    } catch (e) { setError(e.message) }
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)

  if (mode === 'add') return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Add New Item</h1>
      </div>
      <ItemForm onSave={handleAdd} onCancel={() => setMode('list')} loading={saving} />
    </main>
  )

  if (mode === 'edit' && editing) return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Edit: {editing.name}</h1>
      </div>
      <ItemForm
        initial={{ ...editing, price: editing.price.toString(), tag: editing.tag || '' }}
        onSave={handleEdit}
        onCancel={() => { setMode('list'); setEditing(null) }}
        loading={saving}
      />
    </main>
  )

  return (
    <main className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.pageHeader}>
        <div>
          <span className="section-tag">Kebab Is Kebab</span>
          <h1>Menu Admin</h1>
        </div>
        <div className={styles.headerActions}>
          <button className="btn-primary" onClick={() => setMode('add')}>+ Add Item</button>
          <button className="btn-outline" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Category filter */}
      <div className={styles.filters}>
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${filter === cat ? styles.filterActive : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading menu…</p>
        </div>
      ) : (
        <div className={styles.itemGrid}>
          {filtered.map(item => (
            <div key={item.id} className={`${styles.itemCard} ${!item.available ? styles.itemUnavailable : ''}`}>
              <div className={styles.itemCardTop}>
                <span className={styles.itemEmoji}>{item.emoji}</span>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemCategory}>{item.category}</span>
                    {item.tag && <span className={styles.itemTag}>{item.tag}</span>}
                    <span className={`${styles.itemStatus} ${item.available ? styles.statusOn : styles.statusOff}`}>
                      {item.available ? 'Available' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className={styles.itemPrice}>${item.price.toFixed(2)}</div>
              </div>
              <p className={styles.itemDesc}>{item.description}</p>
              <div className={styles.itemActions}>
                <button className={styles.actionBtn} onClick={() => { setEditing(item); setMode('edit') }}>
                  ✏️ Edit
                </button>
                <button className={styles.actionBtn} onClick={() => handleToggle(item)}>
                  {item.available ? '🔴 Hide' : '🟢 Show'}
                </button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        {items.length} items total · {items.filter(i => i.available).length} available · {items.filter(i => !i.available).length} hidden
      </div>
    </main>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '')

  const handleLogin = t => {
    sessionStorage.setItem('admin_token', t)
    setToken(t)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token')
    setToken('')
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />
  return <AdminPanel token={token} onLogout={handleLogout} />
}