import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FacilityMap, { TYPE_COLORS } from '../components/FacilityMap'

const STATE_LABELS = {
  FL: 'Florida', GA: 'Georgia', AL: 'Alabama', MS: 'Mississippi',
  TN: 'Tennessee', SC: 'South Carolina', NC: 'North Carolina',
  VA: 'Virginia', LA: 'Louisiana', AR: 'Arkansas', KY: 'Kentucky', WV: 'West Virginia',
}

const STATUS_COLORS = { Active: 'badge-live', Sold: 'badge-sold', Inactive: 'badge-soon' }

const OCC_COLOR = occ => occ == null ? '#94a3b8' : occ >= 80 ? '#34d399' : occ >= 60 ? '#f59e0b' : '#f87171'

export default function FacilityDirectory() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterState, setFilterState] = useState('All')
  const [filterType, setFilterType]   = useState('All')
  const [sortKey, setSortKey]         = useState('facility_name')
  const [selectedId, setSelectedId]   = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('vw_facility_directory')
        .select('*')
        .order('state').order('facility_name')
      if (error) setError(error.message)
      else { setFacilities(data); if (data.length) setSelectedId(data[0].facility_id) }
      setLoading(false)
    }
    load()
  }, [])

  const states = ['All', ...Array.from(new Set(facilities.map(f => f.state))).sort()]
  const types  = ['All', ...Array.from(new Set(facilities.map(f => f.facility_type))).sort()]

  const filtered = useMemo(() => {
    let rows = facilities
    if (search)                rows = rows.filter(f => f.facility_name.toLowerCase().includes(search.toLowerCase()) || f.city.toLowerCase().includes(search.toLowerCase()))
    if (filterState !== 'All') rows = rows.filter(f => f.state === filterState)
    if (filterType  !== 'All') rows = rows.filter(f => f.facility_type === filterType)
    return [...rows].sort((a, b) => {
      if (sortKey === 'occupancy') return (b.latest_occupancy_rate || 0) - (a.latest_occupancy_rate || 0)
      if (sortKey === 'beds')      return (b.bed_capacity || 0) - (a.bed_capacity || 0)
      return (a[sortKey] || '').toString().localeCompare((b[sortKey] || '').toString())
    })
  }, [facilities, search, filterState, filterType, sortKey])

  const selected = facilities.find(f => f.facility_id === selectedId) || null

  // Portfolio summary stats
  const stats = useMemo(() => {
    const active = facilities.filter(f => f.facility_status === 'Active')
    const avgOcc = active.length
      ? active.reduce((s, f) => s + (f.latest_occupancy_rate || 0), 0) / active.length * 100
      : 0
    return {
      total:    facilities.length,
      active:   active.length,
      states:   new Set(facilities.map(f => f.state)).size,
      beds:     facilities.reduce((s, f) => s + (f.bed_capacity || 0), 0),
      avgOcc:   avgOcc.toFixed(1),
    }
  }, [facilities])

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
          <button className="back-btn" onClick={() => navigate('/')}>← Portal Home</button>
        </div>
        <div className="portal-header-rule" />
      </header>

      <main className="portal-main">
        <div className="portal-welcome">
          <div className="portal-welcome-text">
            <h2>Facility Directory</h2>
            <p>ACE Capital Behavioral Health Portfolio · Southeast United States</p>
          </div>
        </div>

        {/* ── Portfolio Stats Bar ── */}
        {!loading && !error && (
          <div className="dir-stats-bar">
            <div className="dir-stat-pill">
              <span className="dir-stat-num">{stats.total}</span>
              <span className="dir-stat-lbl">Facilities</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat-pill">
              <span className="dir-stat-num">{stats.active}</span>
              <span className="dir-stat-lbl">Active</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat-pill">
              <span className="dir-stat-num">{stats.states}</span>
              <span className="dir-stat-lbl">States</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat-pill">
              <span className="dir-stat-num">{stats.beds.toLocaleString()}</span>
              <span className="dir-stat-lbl">Total Beds</span>
            </div>
            <div className="dir-stat-divider" />
            <div className="dir-stat-pill">
              <span className="dir-stat-num" style={{ color: OCC_COLOR(parseFloat(stats.avgOcc)) }}>{stats.avgOcc}%</span>
              <span className="dir-stat-lbl">Avg Occupancy</span>
            </div>
          </div>
        )}

        {loading && <div className="dir-state">Loading facilities…</div>}
        {error   && <div className="dir-state dir-error">Error: {error}</div>}

        {!loading && !error && (
          <div className="dir-command">

            {/* ── LEFT: Facility List ── */}
            <div className="dir-sidebar">
              <div className="dir-sidebar-controls">
                <input
                  className="dir-search"
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="dir-select" value={filterState} onChange={e => setFilterState(e.target.value)}>
                  {states.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                </select>
                <select className="dir-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  {types.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                </select>
                <select className="dir-select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="facility_name">Sort: Name</option>
                  <option value="state">Sort: State</option>
                  <option value="occupancy">Sort: Occupancy</option>
                  <option value="beds">Sort: Beds</option>
                </select>
              </div>

              <div className="dir-list-count">{filtered.length} facilities</div>

              <div className="dir-list">
                {filtered.map(f => {
                  const occ = f.latest_occupancy_rate != null ? f.latest_occupancy_rate * 100 : null
                  const color = TYPE_COLORS[f.facility_type] || '#94a3b8'
                  const isActive = f.facility_id === selectedId
                  return (
                    <div
                      key={f.facility_id}
                      className={`dir-list-item${isActive ? ' dir-list-item-active' : ''}`}
                      onClick={() => setSelectedId(f.facility_id)}
                    >
                      <div className="dir-list-dot" style={{ background: color }} />
                      <div className="dir-list-info">
                        <div className="dir-list-name">{f.facility_name}</div>
                        <div className="dir-list-sub">{f.city}, {f.state} · {f.facility_type}</div>
                      </div>
                      {occ != null && (
                        <div className="dir-list-occ" style={{ color: OCC_COLOR(occ) }}>
                          {occ.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  )
                })}
                {filtered.length === 0 && <div className="dir-state" style={{ padding: '2rem 1rem' }}>No matches</div>}
              </div>
            </div>

            {/* ── RIGHT: Map + Detail ── */}
            <div className="dir-panel">
              {/* Map */}
              <div className="dir-map-area">
                <FacilityMap
                  facilities={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>

              {/* Detail Card */}
              {selected && (() => {
                const occ = selected.latest_occupancy_rate != null ? selected.latest_occupancy_rate * 100 : null
                const color = TYPE_COLORS[selected.facility_type] || '#94a3b8'
                return (
                  <div className="dir-detail" style={{ borderTopColor: color }}>
                    <div className="dir-detail-head">
                      <div>
                        <div className="dir-detail-name">{selected.facility_name}</div>
                        <div className="dir-detail-loc">{selected.city}, {STATE_LABELS[selected.state] || selected.state}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <span className={`portal-card-badge ${STATUS_COLORS[selected.facility_status] || 'badge-soon'}`}>
                          {selected.facility_status}
                        </span>
                        <span className="fac-type-pill" style={{ color, borderColor: color, background: `${color}15` }}>{selected.facility_type}</span>
                      </div>
                    </div>

                    {occ != null && (
                      <div className="fac-occ-wrap">
                        <div className="fac-occ-label">
                          <span>Occupancy</span>
                          <span style={{ color: OCC_COLOR(occ), fontWeight: 700, fontSize: '0.9rem' }}>{occ.toFixed(1)}%</span>
                        </div>
                        <div className="fac-occ-track" style={{ height: 6 }}>
                          <div className="fac-occ-fill" style={{ width: `${occ}%`, background: OCC_COLOR(occ) }} />
                        </div>
                      </div>
                    )}

                    <div className="dir-detail-grid">
                      <div className="dir-detail-cell">
                        <div className="dir-detail-val">{selected.bed_capacity ?? '—'}</div>
                        <div className="dir-detail-lbl">Beds</div>
                      </div>
                      <div className="dir-detail-cell">
                        <div className="dir-detail-val">{selected.deal_type || '—'}</div>
                        <div className="dir-detail-lbl">Deal Type</div>
                      </div>
                      <div className="dir-detail-cell">
                        <div className="dir-detail-val">{selected.deal_status || '—'}</div>
                        <div className="dir-detail-lbl">Deal Status</div>
                      </div>
                      <div className="dir-detail-cell">
                        <div className="dir-detail-val">{selected.active_initiatives ?? '0'}</div>
                        <div className="dir-detail-lbl">Initiatives</div>
                      </div>
                    </div>

                    <div className="dir-detail-rows">
                      {selected.ceo_name && (
                        <div className="dir-detail-row">
                          <span className="dir-detail-row-lbl">CEO</span>
                          <span className="dir-detail-row-val">{selected.ceo_name}</span>
                        </div>
                      )}
                      {selected.accreditation && selected.accreditation !== 'None' && (
                        <div className="dir-detail-row">
                          <span className="dir-detail-row-lbl">Accreditation</span>
                          <span className="dir-detail-row-val">{selected.accreditation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

          </div>
        )}

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
