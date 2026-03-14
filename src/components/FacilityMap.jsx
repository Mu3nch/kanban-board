const TYPE_COLORS = {
  'Residential':    '#f59e0b',
  'IOP':            '#38bdf8',
  'PHP':            '#a78bfa',
  'Detox':          '#f87171',
  'Dual Diagnosis': '#34d399',
  'Sober Living':   '#fb923c',
}

export default function FacilityMap({ facilities }) {
  // Group by state
  const byState = facilities.reduce((acc, f) => {
    const s = f.state || 'Unknown'
    if (!acc[s]) acc[s] = []
    acc[s].push(f)
    return acc
  }, {})

  const states = Object.keys(byState).sort()

  return (
    <div className="map-wrap">
      <div className="map-header">
        <span className="map-title">Portfolio by State</span>
        <div className="map-legend">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="map-legend-item">
              <span className="map-legend-dot" style={{ background: color }} />
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="state-grid">
        {states.map(state => (
          <div key={state} className="state-card">
            <div className="state-card-header">{state} <span className="state-card-count">{byState[state].length}</span></div>
            <div className="state-facility-list">
              {byState[state].map(f => (
                <div key={f.facility_id} className="state-facility-row">
                  <span
                    className="state-facility-dot"
                    style={{ background: TYPE_COLORS[f.facility_type] || '#94a3b8' }}
                  />
                  <span className="state-facility-name">{f.facility_name}</span>
                  {f.latest_occupancy_rate != null && (
                    <span className="state-facility-occ">
                      {(f.latest_occupancy_rate * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="map-summary">{facilities.length} facilities across {states.length} states</div>
    </div>
  )
}
