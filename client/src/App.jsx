import { useState, useEffect } from 'react'

// Allow runtime override via VITE_API_URL or fallback to relative /api
const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    online: false,
    db: 'unknown',
  })
  const [filter, setFilter] = useState('all') // 'all' | 'active' | 'completed'
  const [showDockerInfo, setShowDockerInfo] = useState(false)

  // Check backend health
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`, {
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) throw new Error('Health check non-200')
      const data = await res.json()
      setBackendStatus({
        checked: true,
        online: true,
        db: data.database || 'disconnected',
      })
    } catch {
      setBackendStatus({
        checked: true,
        online: false,
        db: 'disconnected',
      })
    }
  }

  // Load items from API
  const fetchItems = async () => {
    try {
      setFetching(true)
      const res = await fetch(`${API_BASE}/api/items`)
      if (!res.ok) throw new Error('Failed to fetch items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching items:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    checkHealth()
    fetchItems()

    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [])

  // Create item
  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      })

      if (res.ok) {
        const newItem = await res.json()
        setItems((prev) => [newItem, ...prev])
        setTitle('')
        setDescription('')
        checkHealth()
      } else {
        alert('Failed to save item. Make sure backend and MongoDB are running.')
      }
    } catch (err) {
      console.error('Error adding item:', err)
      alert('Network error: Could not reach backend server.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle item completed
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/items/${id}/toggle`, {
        method: 'PATCH',
      })
      if (res.ok) {
        const updated = await res.json()
        setItems((prev) =>
          prev.map((item) => (item._id === id ? updated : item))
        )
      }
    } catch (err) {
      console.error('Error toggling item:', err)
    }
  }

  // Delete item
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item._id !== id))
      }
    } catch (err) {
      console.error('Error deleting item:', err)
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.completed
    if (filter === 'completed') return item.completed
    return true
  })

  const completedCount = items.filter((i) => i.completed).length
  const activeCount = items.length - completedCount

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
          </div>
          <h1 className="brand-title">CloudTasks</h1>
        </div>
        <p className="brand-subtitle">
          Full-Stack Containerized Application with React, Express &amp; MongoDB
        </p>
      </header>

      {/* Topology & Status Bar */}
      <section className="topology-card" aria-label="Container Architecture Status">
        <div className="topology-nodes">
          <span className="topology-node">
            <span style={{ color: 'var(--accent-cyan)' }}>⚛</span> Client :3000
          </span>
          <span className="topology-arrow">➔</span>
          <span className="topology-node">
            <span style={{ color: 'var(--accent-blue)' }}>⚡</span> Express :5000
          </span>
          <span className="topology-arrow">➔</span>
          <span className="topology-node">
            <span style={{ color: 'var(--accent-emerald)' }}>🍃</span> Mongo :27017
          </span>
        </div>

        <div>
          {!backendStatus.checked ? (
            <span className="status-badge loading">
              <span className="status-pulse"></span>
              Checking Containers...
            </span>
          ) : backendStatus.online ? (
            <span
              className={`status-badge ${
                backendStatus.db === 'connected' ? 'connected' : 'loading'
              }`}
            >
              <span className="status-pulse"></span>
              Backend Live &bull; Mongo:{' '}
              {backendStatus.db === 'connected' ? 'Connected' : 'Connecting...'}
            </span>
          ) : (
            <span className="status-badge disconnected">
              <span className="status-pulse"></span>
              Backend Offline (Port 5000)
            </span>
          )}
        </div>
      </section>

      {/* Task Creation Form */}
      <section className="form-card">
        <h2 className="form-title">
          <span>+</span> Add New Cloud Task
        </h2>
        <form onSubmit={handleAddItem} className="form-group">
          <input
            id="item-title-input"
            type="text"
            className="input-field"
            placeholder="Task Title (e.g., Configure GitHub Actions CI/CD workflow)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            id="item-desc-input"
            type="text"
            className="input-field"
            placeholder="Description or notes (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            id="add-item-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading || !title.trim()}
          >
            {loading ? 'Saving...' : 'Deploy Task'}
          </button>
        </form>
      </section>

      {/* Control & Filter Bar */}
      <section className="control-bar">
        <div className="stats-badges">
          <span className="stat-chip">
            Total: <strong>{items.length}</strong>
          </span>
          <span className="stat-chip">
            Pending: <strong>{activeCount}</strong>
          </span>
          <span className="stat-chip">
            Done: <strong>{completedCount}</strong>
          </span>
        </div>

        <div className="filter-tabs" role="tablist">
          <button
            type="button"
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </section>

      {/* Items List */}
      <main className="items-list">
        {fetching && items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-desc">Connecting to database and loading tasks...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M9 12h6m-3-3v6" />
              </svg>
            </div>
            <h3 className="empty-title">
              {filter === 'all'
                ? 'No tasks created yet'
                : `No ${filter} tasks found`}
            </h3>
            <p className="empty-desc">
              Create your first task above to test full-stack persistence with Docker and MongoDB!
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item._id}
              className={`item-card ${item.completed ? 'completed' : ''}`}
            >
              <div className="item-content">
                <button
                  type="button"
                  className={`checkbox-btn ${item.completed ? 'checked' : ''}`}
                  onClick={() => handleToggle(item._id)}
                  aria-label={item.completed ? 'Mark incomplete' : 'Mark completed'}
                >
                  {item.completed && (
                    <svg viewBox="0 0 24 24">
                      <polyline
                        points="20 6 9 17 4 12"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>
                <div className="item-details">
                  <h4 className="item-title">{item.title}</h4>
                  {item.description && (
                    <p className="item-desc">{item.description}</p>
                  )}
                  <span className="item-date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently created'}
                  </span>
                </div>
              </div>

              <div className="item-actions">
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleDelete(item._id)}
                  title="Delete Task"
                  aria-label="Delete Task"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Docker Architecture & Commands Guide */}
      <section className="info-accordion">
        <div
          className="info-accordion-summary"
          onClick={() => setShowDockerInfo(!showDockerInfo)}
        >
          <span>🐳 Docker Architecture &amp; Cheatsheet</span>
          <span>{showDockerInfo ? '▲' : '▼'}</span>
        </div>

        {showDockerInfo && (
          <div className="info-content">
            <p>
              This application runs as 3 isolated, interconnected Docker containers defined in <code>docker-compose.yml</code>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
              <li>
                <strong>client</strong> (React + Nginx on port <code>3000</code>): Reverse-proxies <code>/api</code> requests to backend.
              </li>
              <li>
                <strong>server</strong> (Node Express on port <code>5000</code>): REST API connecting to MongoDB via container DNS <code>mongo:27017</code>.
              </li>
              <li>
                <strong>mongo</strong> (MongoDB container on port <code>27017</code>): Persistent data volume mounted at <code>/data/db</code>.
              </li>
            </ul>
            <p><strong>Common Docker Commands:</strong></p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
              <li><code>docker compose up --build</code> - Build and start all services</li>
              <li><code>docker compose down</code> - Stop and remove containers and networks</li>
              <li><code>docker compose down -v</code> - Stop and wipe database volume</li>
              <li><code>docker compose logs -f</code> - Follow container logs in real time</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
