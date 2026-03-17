import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT REGISTRY
// To add a document:
//   1. Drop the PDF into /public/documents/
//   2. Add an entry to this array
// ─────────────────────────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    id: 1,
    title: 'ML Model Performance Report',
    description: 'Accuracy, AUC, precision/recall, feature importance, and configuration details for the production XGBoost facility underperformance prediction model.',
    category: 'Machine Learning',
    filename: 'ml-model-performance.pdf',
    size: '0.2 MB',
  },
  {
    id: 2,
    title: 'ML Model Selection & Comparison',
    description: 'Evaluation of five classification models (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, XGBoost) with full metrics table and rationale for selecting XGBoost.',
    category: 'Machine Learning',
    filename: 'ml-model-comparison.pdf',
    size: '0.3 MB',
  },
  {
    id: 3,
    title: 'ACE Capital — Company Overview',
    description: 'A completely serious and totally not fabricated history of ACE Capital, its visionary leadership team, and its deeply heartfelt commitment to returns.',
    category: 'Company',
    filename: 'company-bio.pdf',
    size: '0.3 MB',
  },
]

const CATEGORY_COLORS = {
  'Machine Learning':  { bg: 'rgba(56,189,248,0.1)',  text: '#38bdf8', border: 'rgba(56,189,248,0.25)'  },
  'Presentation':      { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', border: 'rgba(167,139,250,0.25)' },
  'Financial':         { bg: 'rgba(52,211,153,0.1)',  text: '#34d399', border: 'rgba(52,211,153,0.25)'  },
  'Operations':        { bg: 'rgba(251,146,60,0.1)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)'  },
  'Research':          { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
  'Company':           { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)'  },
}

const DEFAULT_COLOR = { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' }

export default function BusinessDocuments() {
  const navigate = useNavigate()

  return (
    <div className="portal-page">

      {/* ── Header ── */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <div className="portal-logo">AC</div>
            <div>
              <h1 className="portal-title">ACE <span>Capital</span></h1>
              <p className="portal-subtitle">Internal Operations Portal</p>
            </div>
          </div>
          <button className="back-btn" onClick={() => navigate('/')}>← Portal Home</button>
        </div>
        <div className="portal-header-rule" />
      </header>

      <main className="portal-main">
        <div className="portal-welcome">
          <div className="portal-welcome-text">
            <h2>Business Documents</h2>
            <p>ACE Capital Behavioral Health Portfolio · Reports, Models &amp; Presentations</p>
          </div>
          <div className="docs-count">{DOCUMENTS.length} document{DOCUMENTS.length !== 1 ? 's' : ''}</div>
        </div>

        {/* ── Document Grid ── */}
        <div className="docs-grid">
          {DOCUMENTS.map(doc => {
            const color = CATEGORY_COLORS[doc.category] || DEFAULT_COLOR
            const href  = `/documents/${doc.filename}`

            return (
              <div key={doc.id} className="doc-card">
                <div className="doc-card-top">
                  <span
                    className="doc-category-badge"
                    style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                  >
                    {doc.category}
                  </span>
                  <span className="doc-icon">⬡</span>
                </div>

                <h3 className="doc-title">{doc.title}</h3>
                <p className="doc-desc">{doc.description}</p>

                <div className="doc-footer">
                  {doc.size && <span className="doc-size">{doc.size}</span>}
                  <div className="doc-actions">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-view-btn"
                      onClick={e => {
                        fetch(href, { method: 'HEAD' })
                          .then(r => { if (!r.ok) { e.preventDefault(); alert(`"${doc.filename}" has not been uploaded to /public/documents/ yet.`) } })
                          .catch(() => { e.preventDefault(); alert(`"${doc.filename}" has not been uploaded to /public/documents/ yet.`) })
                      }}
                    >
                      ⤢ View
                    </a>
                    <a
                      href={href}
                      download={doc.filename}
                      className="doc-download-btn"
                      onClick={e => {
                        fetch(href, { method: 'HEAD' })
                          .then(r => { if (!r.ok) { e.preventDefault(); alert(`"${doc.filename}" has not been uploaded to /public/documents/ yet.`) } })
                          .catch(() => { e.preventDefault(); alert(`"${doc.filename}" has not been uploaded to /public/documents/ yet.`) })
                      }}
                    >
                      ↓ Download
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── How to add documents ── */}
        <details className="docs-add-guide">
          <summary>How to add a document</summary>
          <ol className="docs-add-steps">
            <li>Save your PDF to <code>/public/documents/your-file.pdf</code></li>
            <li>Open <code>src/pages/BusinessDocuments.jsx</code></li>
            <li>Add an entry to the <code>DOCUMENTS</code> array at the top of the file</li>
            <li>The card appears automatically on this page</li>
          </ol>
        </details>

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
