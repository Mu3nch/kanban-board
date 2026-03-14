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
          <div className="dir-table-wrap">
            <table className="dir-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Beds</th>
                  <th>Occupancy</th>
                  <th>Deal</th>
                  <th>Status</th>
                  <th>Initiatives</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.facility_id}>
                    <td>
                      <div className="dir-name">{f.facility_name}</div>
                      {f.ceo_name && <div className="dir-sub">CEO: {f.ceo_name}</div>}
                    </td>
                    <td>
                      <div>{f.city}, {f.state}</div>
                      {f.accreditation && f.accreditation !== 'None' && (
                        <div className="dir-sub">{f.accreditation}</div>
                      )}
                    </td>
                    <td>{f.facility_type}</td>
                    <td className="dir-center">{f.bed_capacity}</td>
                    <td className="dir-center">
                      {f.latest_occupancy_rate != null
                        ? `${(f.latest_occupancy_rate * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td>
                      <div>{f.deal_type}</div>
                      <div className="dir-sub">{f.deal_status}</div>
                    </td>
                    <td>
                      <span className={`portal-card-badge ${STATUS_COLORS[f.facility_status] || 'badge-soon'}`}>
                        {f.facility_status}
                      </span>
                    </td>
                    <td className="dir-center">{f.active_initiatives ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="dir-state">No facilities match your filters.</div>
            )}
          </div>
        )}

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
