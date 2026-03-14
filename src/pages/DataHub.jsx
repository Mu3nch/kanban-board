import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mermaid from 'mermaid'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'

// Initialize once at module level — avoids re-init on every render
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    background:       '#080f1e',
    primaryColor:     '#1e293b',
    primaryTextColor: '#f1f5f9',
    lineColor:        '#b8932a',
    edgeLabelBackground: '#080f1e',
    attributeBackgroundColorEven: '#0f1f3d',
    attributeBackgroundColorOdd:  '#0a1628',
    nodeBorder:       '#b8932a',
    titleColor:       '#f59e0b',
    fontFamily:       'DM Sans, sans-serif',
  },
})

// ─── Mermaid ERD definition ──────────────────────────────────────────────────
const ERD = `erDiagram
  portfolio_facilities {
    int facility_id PK
    varchar facility_name
    varchar city
    char state
    varchar facility_type
    int bed_capacity
    varchar status
    date acquisition_date
  }
  facility_profiles {
    int profile_id PK
    int facility_id FK
    varchar address
    varchar medical_director
    varchar accreditation
    numeric ebitda_budget_annual
  }
  deals {
    int deal_id PK
    int facility_id FK
    varchar deal_type
    date acquisition_date
    numeric entry_enterprise_value
    numeric entry_multiple
    numeric actual_moic
    smallint high_return_flag
    varchar deal_status
  }
  monthly_facility_metrics {
    int metric_id PK
    int facility_id FK
    int metric_year
    int metric_month
    numeric occupancy_rate
    int total_admissions
    numeric avg_length_of_stay
    numeric treatment_completion_rate
    numeric staff_turnover_rate
    numeric ebitda
    numeric ebitda_budget_monthly
    numeric claims_denied_rate
    numeric collections_rate
    smallint underperformance_flag
  }
  management_team {
    int member_id PK
    int facility_id FK
    varchar full_name
    varchar title
    varchar department
    numeric tenure_years
  }
  value_creation_initiatives {
    int initiative_id PK
    int facility_id FK
    varchar initiative_name
    varchar category
    varchar status
    varchar priority
    numeric estimated_value_impact
    numeric actual_value_impact
  }

  portfolio_facilities ||--|| facility_profiles          : "has profile"
  portfolio_facilities ||--|| deals                      : "has deal"
  portfolio_facilities ||--o{ monthly_facility_metrics   : "has metrics"
  portfolio_facilities ||--o{ management_team            : "has team"
  portfolio_facilities ||--o{ value_creation_initiatives : "has initiatives"
`

// ─── Required CSV columns ────────────────────────────────────────────────────
const REQUIRED_COLS = [
  'facility_id','metric_year','metric_month','metric_date','bed_capacity',
  'avg_daily_census','occupancy_rate','total_admissions','total_discharges',
  'avg_length_of_stay','treatment_completion_rate','readmission_rate',
  'total_referrals','converted_referrals','referral_conversion_rate',
  'payer_commercial','payer_medicaid','payer_medicare','payer_self_pay',
  'total_staff_count','clinical_staff_count','staff_turnover_rate',
  'gross_revenue','net_revenue','total_expenses','ebitda','ebitda_margin',
  'ebitda_budget_monthly','claims_submitted','claims_denied','claims_denied_rate',
  'collections_rate','ar_days',
]

const PREVIEW_COLS = [
  'facility_id','metric_year','metric_month','occupancy_rate',
  'total_admissions','ebitda','ebitda_budget_monthly',
]

const BATCH_SIZE = 100

export default function DataHub() {
  const navigate = useNavigate()
  const erdRef   = useRef(null)

  // Upload state
  const [file,       setFile]       = useState(null)
  const [rows,       setRows]       = useState([])        // parsed rows
  const [parseError, setParseError] = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [result,     setResult]     = useState(null)      // { inserted, errors }
  const [dragOver,   setDragOver]   = useState(false)

  // ── Render ERD on mount ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const id = 'erd-' + Math.random().toString(36).slice(2)

    mermaid.render(id, ERD)
      .then(({ svg }) => {
        if (!cancelled && erdRef.current) {
          erdRef.current.innerHTML = svg
        }
      })
      .catch(console.error)

    return () => { cancelled = true }
  }, [])

  // ── CSV parsing ────────────────────────────────────────────────────────────
  function handleFile(f) {
    if (!f) return
    setFile(f)
    setRows([])
    setParseError(null)
    setResult(null)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete(res) {
        const cols = res.meta.fields || []
        const missing = REQUIRED_COLS.filter(c => !cols.includes(c))
        if (missing.length) {
          setParseError(`Missing columns: ${missing.join(', ')}`)
          return
        }
        // Coerce numeric fields and compute underperformance_flag
        const cleaned = res.data.map(row => {
          const r = {}
          for (const key of REQUIRED_COLS) {
            const val = row[key]
            // metric_date stays as string (ISO date); others become numbers where applicable
            if (key === 'metric_date') {
              r[key] = val
            } else {
              const n = Number(val)
              r[key] = isNaN(n) ? val : n
            }
          }
          // Derive underperformance_flag
          r.underperformance_flag =
            r.ebitda < r.ebitda_budget_monthly * 0.9 ? 1 : 0
          return r
        })
        setRows(cleaned)
      },
      error(err) {
        setParseError(err.message)
      },
    })
  }

  // ── Upload to Supabase ─────────────────────────────────────────────────────
  async function handleUpload() {
    if (!rows.length) return
    setUploading(true)
    setResult(null)

    let inserted = 0
    const errors = []

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const { error } = await supabase
        .from('monthly_facility_metrics')
        .upsert(batch, { onConflict: 'facility_id,metric_year,metric_month' })

      if (error) {
        errors.push(`Rows ${i + 1}–${i + batch.length}: ${error.message}`)
      } else {
        inserted += batch.length
      }
    }

    setUploading(false)
    setResult({ inserted, errors })
    if (!errors.length) {
      setRows([])
      setFile(null)
    }
  }

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f?.name.endsWith('.csv')) handleFile(f)
  }

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
            <h2>Data Hub</h2>
            <p>ACE Capital Behavioral Health Portfolio · Schema Reference &amp; Data Upload</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SECTION 1 — ERD
        ════════════════════════════════════════════════════════ */}
        <div className="hub-section">
          <div className="hub-section-header">
            <span className="hub-section-icon">◈</span>
            <div>
              <h3 className="hub-section-title">Database Schema</h3>
              <p className="hub-section-sub">Entity Relationship Diagram · 6 tables · PostgreSQL / Supabase</p>
            </div>
          </div>
          <div className="hub-erd-wrap">
            <div className="hub-erd-container" ref={erdRef} />
          </div>
          <div className="hub-erd-legend">
            <span className="hub-erd-legend-item"><strong>PK</strong> Primary Key</span>
            <span className="hub-erd-legend-item"><strong>FK</strong> Foreign Key</span>
            <span className="hub-erd-legend-item">All child tables reference <code>portfolio_facilities.facility_id</code></span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SECTION 2 — CSV UPLOAD
        ════════════════════════════════════════════════════════ */}
        <div className="hub-section">
          <div className="hub-section-header">
            <span className="hub-section-icon">↑</span>
            <div>
              <h3 className="hub-section-title">Upload Facility Metrics</h3>
              <p className="hub-section-sub">
                Upload a CSV to add or update rows in <code>monthly_facility_metrics</code>.
                Existing rows are updated by <code>(facility_id, metric_year, metric_month)</code>.
              </p>
            </div>
          </div>

          {/* Drop zone */}
          {!rows.length && !result && (
            <div
              className={`hub-dropzone ${dragOver ? 'hub-dropzone-active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="hub-drop-icon">⬆</div>
              <p className="hub-drop-label">Drag &amp; drop a CSV file here</p>
              <p className="hub-drop-sub">or</p>
              <label className="hub-file-btn">
                Browse File
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files?.[0])}
                />
              </label>
              <p className="hub-drop-hint">
                Requires {REQUIRED_COLS.length} columns including <code>facility_id</code>,
                <code> metric_year</code>, <code>metric_month</code>, and all operational metrics.
              </p>
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="hub-alert hub-alert-error">
              <strong>Validation Error</strong>
              <p>{parseError}</p>
              <button className="hub-reset-btn" onClick={() => { setParseError(null); setFile(null) }}>
                Try another file
              </button>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !result && (
            <div className="hub-preview">
              <div className="hub-preview-header">
                <span className="hub-preview-label">
                  Preview · {file?.name} · <strong>{rows.length}</strong> rows
                </span>
                <button className="hub-reset-btn" onClick={() => { setRows([]); setFile(null) }}>
                  ✕ Clear
                </button>
              </div>
              <div className="dir-table-wrap">
                <table className="dir-table">
                  <thead>
                    <tr>
                      {PREVIEW_COLS.map(c => <th key={c}>{c}</th>)}
                      <th>flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {PREVIEW_COLS.map(c => (
                          <td key={c}>{row[c] ?? '—'}</td>
                        ))}
                        <td>{row.underperformance_flag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 5 && (
                <p className="hub-preview-more">… and {rows.length - 5} more rows</p>
              )}
              <button
                className="hub-upload-btn"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : `Upload ${rows.length} rows to Supabase`}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`hub-alert ${result.errors.length ? 'hub-alert-error' : 'hub-alert-success'}`}>
              {result.errors.length === 0 ? (
                <>
                  <strong>Upload complete</strong>
                  <p>{result.inserted} rows upserted successfully.</p>
                </>
              ) : (
                <>
                  <strong>Partial upload</strong>
                  <p>{result.inserted} rows upserted · {result.errors.length} batch error(s)</p>
                  <ul className="hub-error-list">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </>
              )}
              <button className="hub-reset-btn" onClick={() => { setResult(null); setFile(null); setRows([]) }}>
                Upload another file
              </button>
            </div>
          )}

          {/* Required columns reference */}
          <details className="hub-cols-detail">
            <summary>Required CSV columns ({REQUIRED_COLS.length})</summary>
            <div className="hub-cols-grid">
              {REQUIRED_COLS.map(c => <code key={c}>{c}</code>)}
            </div>
          </details>
        </div>

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
