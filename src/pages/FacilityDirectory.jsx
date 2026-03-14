import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FacilityMap from '../components/FacilityMap'

const STATE_LABELS = {
  FL: 'Florida', GA: 'Georgia', AL: 'Alabama', MS: 'Mississippi',
  TN: 'Tennessee', SC: 'South Carolina', NC: 'North Carolina',
  VA: 'Virginia', LA: 'Louisiana', AR: 'Arkansas', KY: 'Kentucky', WV: 'West Virginia',
}

const STATUS_COLORS = {
  Active: 'badge-live',
  Sold:   'badge-sold',
  Inactive: 'badge-soon',
}

export default function FacilityDirectory() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterState, setFilterState] = useState('All')
  const [filterType, setFilterType]   = useState('All')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('vw_facility_directory')
        .select('*')
        .order('state', { ascending: true })
        .order('facility_name', { ascending: true })

      if (error) setError(error.message)
      else setFacilities(data)
      setLoading(false)
    }
    load()
  }, [])

  // Derived filter options from data
  const states = ['All', ...Array.from(new Set(facilities.map(f => f.state))).sort()]
  const types  = ['All', ...Array.from(new Set(facilities.map(f => f.facility_type))).sort()]

  const filtered = facilities.filter(f => {
    const matchSearch = search === '' ||
      f.facility_name.toLowerCase().includes(search.toLowerCase()) ||
      f.city.toLowerCase().includes(search.toLowerCase())
    const matchState = filterState === 'All' || f.state === filterState
    const matchType  = filterType  === 'All' || f.facility_type === filterType
    return matchSearch && matchState && matchType
  })

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
            <h2>Facility Directory</h2>
            <p>ACE Capital Behavioral Health Portfolio · {facilities.length} Facilities · Southeast United States</p>
          </div>
        </div>

        {/* ── Map ── */}
        {!loading && !error && <FacilityMap facilities={facilities} />}

        {/* ── Filters ── */}
        <div className="dir-filters">
          <input
            className="dir-search"
            type="text"
            placeholder="Search by name or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="dir-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
            {states.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All States' : STATE_LABELS[s] || s}</option>
            ))}
          </select>
          <select className="dir-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
          <span className="dir-count">{filtered.length} facilities</span>
        </div>

        {/* ── Content ── */}
        {loading && <div className="dir-state">Loading facilities…</div>}
        {error   && <div className="dir-state dir-error">Error: {error}</div>}

        {!loading && !error && (
          filtered.length === 0
            ? <div className="dir-state">No facilities match your filters.</div>
            : <div className="fac-grid">
                {filtered.map(f => {
                  const occ = f.latest_occupancy_rate != null ? f.latest_occupancy_rate * 100 : null
                  const occColor = occ == null ? '#94a3b8' : occ >= 80 ? '#34d399' : occ >= 60 ? '#f59e0b' : '#f87171'
                  return (
                    <div key={f.facility_id} className={`fac-card fac-type-${(f.facility_type || '').toLowerCase().replace(/\s+/g, '-')}`}>
                      <div className="fac-card-top">
                        <div className="fac-card-name">{f.facility_name}</div>
                        <span className={`portal-card-badge ${STATUS_COLORS[f.facility_status] || 'badge-soon'}`}>
                          {f.facility_status}
                        </span>
                      </div>

                      <div className="fac-card-meta">
                        <span className="fac-type-pill">{f.facility_type}</span>
                        <span className="fac-location">{f.city}, {f.state}</span>
                      </div>

                      {occ != null && (
                        <div className="fac-occ-wrap">
                          <div className="fac-occ-label">
                            <span>Occupancy</span>
                            <span style={{ color: occColor, fontWeight: 600 }}>{occ.toFixed(1)}%</span>
                          </div>
                          <div className="fac-occ-track">
                            <div className="fac-occ-fill" style={{ width: `${occ}%`, background: occColor }} />
                          </div>
                        </div>
                      )}

                      <div className="fac-stats">
                        <div className="fac-stat">
                          <div className="fac-stat-val">{f.bed_capacity ?? '—'}</div>
                          <div className="fac-stat-label">Beds</div>
                        </div>
                        <div className="fac-stat">
                          <div className="fac-stat-val">{f.deal_type || '—'}</div>
                          <div className="fac-stat-label">Deal Type</div>
                        </div>
                        <div className="fac-stat">
                          <div className="fac-stat-val">{f.active_initiatives ?? '0'}</div>
                          <div className="fac-stat-label">Initiatives</div>
                        </div>
                      </div>

                      {(f.ceo_name || (f.accreditation && f.accreditation !== 'None')) && (
                        <div className="fac-card-footer">
                          {f.ceo_name && <span>CEO: {f.ceo_name}</span>}
                          {f.accreditation && f.accreditation !== 'None' && <span>{f.accreditation}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
        )}

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
