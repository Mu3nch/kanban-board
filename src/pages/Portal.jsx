import { useNavigate } from 'react-router-dom'

const TOOLS = [
  {
    title: 'Operations Board',
    description: 'Track project tasks, milestones, and deliverables across the capstone timeline.',
    icon: '▦',
    route: '/board',
    status: 'live',
    tag: 'Project Management',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Predictive revenue risk scores and KPI trends across all 50 portfolio facilities.',
    icon: '◈',
    route: '/analytics',
    status: 'live',
    tag: 'Business Intelligence',
  },
  {
    title: 'Facility Directory',
    description: 'Full roster of ACE Capital portfolio facilities with location and capacity data.',
    icon: '⊞',
    route: '/facilities',
    status: 'live',
    tag: 'Portfolio Data',
  },
  {
    title: 'Reports & Exports',
    description: 'Download performance summaries, model outputs, and board-ready executive reports.',
    icon: '≡',
    route: '/reports',
    status: 'live',
    tag: 'Reporting',
  },
  {
    title: 'Data Hub',
    description: 'Schema reference and weekly data upload for portfolio facility metrics.',
    icon: '⬡',
    route: '/data-hub',
    status: 'live',
    tag: 'Data Management',
  },
  {
    title: 'Business Documents',
    description: 'Model performance reports, financial summaries, and capstone presentation materials.',
    icon: '⊟',
    route: '/documents',
    status: 'live',
    tag: 'Reports & Research',
  },
]

const STATS = [
  { value: '50', label: 'Portfolio Facilities' },
  { value: 'SW', label: 'Region' },
  { value: 'D&A', label: 'Treatment Focus' },
  { value: 'PE', label: 'Firm Type' },
]

export default function Portal() {
  const navigate = useNavigate()

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <div className="portal-logo">AC</div>
            <div>
              <h1 className="portal-title">ACE <span>Capital</span></h1>
              <p className="portal-subtitle">Internal Operations Portal</p>
            </div>
          </div>
          <div className="portal-header-stats">
            {STATS.map(s => (
              <div key={s.label} className="portal-stat">
                <span className="portal-stat-value">{s.value}</span>
                <span className="portal-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="portal-header-rule" />
      </header>

      <main className="portal-main">
        <div className="portal-welcome">
          <div className="portal-welcome-text">
            <h2>Welcome back</h2>
            <p>Behavioral Health Portfolio · Operations & Analytics Command Center</p>
          </div>
          <div className="portal-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="portal-divider">
          <span>Available Tools</span>
        </div>

        <div className="portal-grid">
          {TOOLS.map(tool => (
            <button
              key={tool.title}
              className={`portal-card ${tool.status === 'coming' ? 'portal-card-disabled' : ''}`}
              onClick={() => tool.status === 'live' && navigate(tool.route)}
              disabled={tool.status === 'coming'}
            >
              <div className="portal-card-top">
                <span className="portal-card-icon">{tool.icon}</span>
                {tool.status === 'coming' && (
                  <span className="portal-card-badge badge-soon">Coming Soon</span>
                )}
              </div>
              <div className="portal-card-tag">{tool.tag}</div>
              <h3 className="portal-card-title">{tool.title}</h3>
              <p className="portal-card-desc">{tool.description}</p>
              {tool.status === 'live' && (
                <div className="portal-card-arrow">Open →</div>
              )}
            </button>
          ))}
        </div>

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
