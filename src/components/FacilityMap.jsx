import { useState } from 'react'

// ── Projection ────────────────────────────────────────────────────────────────
const W = 560, H = 400
const LNG_W = -95, LNG_E = -74
const LAT_S = 24,  LAT_N = 41
const px = lng => (lng - LNG_W) / (LNG_E - LNG_W) * W
const py = lat => (1 - (lat - LAT_S) / (LAT_N - LAT_S)) * H

// ── Simplified SE state bounding boxes ───────────────────────────────────────
// [west, south, east, north, abbr, labelLng, labelLat]
const STATES = [
  [-87.6, 24.5, -80.0, 31.1, 'FL', -83.3, 27.5],
  [-85.6, 30.4, -80.9, 35.0, 'GA', -83.3, 32.5],
  [-88.5, 30.1, -84.9, 35.0, 'AL', -86.8, 32.5],
  [-91.7, 30.2, -88.1, 34.5, 'MS', -89.9, 32.3],
  [-90.3, 34.9, -81.6, 36.7, 'TN', -86.0, 35.8],
  [-83.4, 32.0, -78.5, 35.2, 'SC', -81.0, 33.6],
  [-84.3, 33.8, -75.5, 36.6, 'NC', -79.7, 35.2],
  [-83.7, 36.5, -75.2, 39.5, 'VA', -79.5, 37.8],
  [-94.1, 28.9, -88.8, 33.0, 'LA', -91.8, 30.9],
  [-94.6, 33.0, -89.6, 36.5, 'AR', -92.4, 34.8],
  [-89.6, 36.5, -81.9, 39.1, 'KY', -85.8, 37.8],
  [-82.6, 37.2, -77.7, 40.6, 'WV', -80.4, 38.9],
]

// ── City coordinates ──────────────────────────────────────────────────────────
const CITY_COORDS = {
  'Miami,FL': [-80.19, 25.76], 'Orlando,FL': [-81.38, 28.54], 'Tampa,FL': [-82.46, 27.95],
  'Jacksonville,FL': [-81.66, 30.33], 'Fort Lauderdale,FL': [-80.14, 26.12],
  'Gainesville,FL': [-82.33, 29.65], 'Tallahassee,FL': [-84.28, 30.44],
  'Atlanta,GA': [-84.39, 33.75], 'Savannah,GA': [-81.10, 32.08], 'Augusta,GA': [-81.97, 33.47],
  'Columbus,GA': [-84.99, 32.46], 'Macon,GA': [-83.63, 32.84],
  'Birmingham,AL': [-86.80, 33.52], 'Montgomery,AL': [-86.30, 32.37],
  'Huntsville,AL': [-86.59, 34.73], 'Mobile,AL': [-88.04, 30.69], 'Tuscaloosa,AL': [-87.57, 33.21],
  'Jackson,MS': [-90.18, 32.30], 'Gulfport,MS': [-89.09, 30.37], 'Hattiesburg,MS': [-89.29, 31.33],
  'Biloxi,MS': [-88.89, 30.40], 'Tupelo,MS': [-88.70, 34.26],
  'Nashville,TN': [-86.78, 36.16], 'Memphis,TN': [-90.05, 35.15], 'Knoxville,TN': [-83.92, 35.96],
  'Chattanooga,TN': [-85.31, 35.05], 'Clarksville,TN': [-87.36, 36.53],
  'Charleston,SC': [-79.93, 32.78], 'Columbia,SC': [-81.03, 34.00], 'Greenville,SC': [-82.39, 34.85],
  'Myrtle Beach,SC': [-78.89, 33.69], 'Rock Hill,SC': [-81.03, 34.92],
  'Charlotte,NC': [-80.84, 35.23], 'Raleigh,NC': [-78.64, 35.78], 'Greensboro,NC': [-79.79, 36.07],
  'Durham,NC': [-78.90, 35.99], 'Asheville,NC': [-82.55, 35.57],
  'Richmond,VA': [-77.46, 37.54], 'Virginia Beach,VA': [-75.98, 36.85],
  'Norfolk,VA': [-76.29, 36.85], 'Arlington,VA': [-77.11, 38.88], 'Roanoke,VA': [-79.94, 37.27],
  'New Orleans,LA': [-90.07, 29.95], 'Baton Rouge,LA': [-91.15, 30.45],
  'Shreveport,LA': [-93.75, 32.53], 'Lafayette,LA': [-92.02, 30.22], 'Lake Charles,LA': [-93.22, 30.23],
  'Little Rock,AR': [-92.29, 34.75], 'Fort Smith,AR': [-94.40, 35.39],
  'Fayetteville,AR': [-94.16, 36.07], 'Jonesboro,AR': [-90.70, 35.84], 'Conway,AR': [-92.44, 35.09],
  'Louisville,KY': [-85.76, 38.25], 'Lexington,KY': [-84.50, 38.04],
  'Bowling Green,KY': [-86.44, 36.99], 'Owensboro,KY': [-87.11, 37.77], 'Covington,KY': [-84.51, 39.08],
  'Charleston,WV': [-81.63, 38.35], 'Huntington,WV': [-82.44, 38.42],
  'Morgantown,WV': [-79.95, 39.63], 'Parkersburg,WV': [-81.56, 39.27], 'Wheeling,WV': [-80.72, 40.07],
}

const TYPE_COLORS = {
  'Residential': '#f59e0b', 'IOP': '#38bdf8', 'PHP': '#a78bfa',
  'Detox': '#f87171', 'Dual Diagnosis': '#34d399', 'Sober Living': '#fb923c',
}

export default function FacilityMap({ facilities }) {
  const [tooltip, setTooltip] = useState(null)

  const markers = facilities
    .map(f => {
      const coords = CITY_COORDS[`${f.city},${f.state}`]
      return coords ? { ...f, coords } : null
    })
    .filter(Boolean)

  return (
    <div className="map-wrap">
      <div className="map-header">
        <span className="map-title">Portfolio Map</span>
        <div className="map-legend">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="map-legend-item">
              <span className="map-legend-dot" style={{ background: color }} />
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="map-container" style={{ position: 'relative', height: 420 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* State backgrounds */}
          {STATES.map(([w, s, e, n, abbr, llng, llat]) => (
            <g key={abbr}>
              <rect
                x={px(w)} y={py(n)}
                width={px(e) - px(w)} height={py(s) - py(n)}
                fill="rgba(30,41,59,0.75)"
                stroke="rgba(148,163,184,0.2)"
                strokeWidth={0.5}
              />
              <text
                x={px(llng)} y={py(llat)}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(148,163,184,0.25)"
                fontSize={9} fontWeight="700" letterSpacing={1}
              >
                {abbr}
              </text>
            </g>
          ))}

          {/* Facility dots */}
          {markers.map(f => {
            const cx = px(f.coords[0])
            const cy = py(f.coords[1])
            const color = TYPE_COLORS[f.facility_type] || '#94a3b8'
            return (
              <circle
                key={f.facility_id}
                cx={cx} cy={cy} r={3.5}
                fill={color}
                fillOpacity={0.9}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={0.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTooltip({ ...f, cx, cy })}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}
        </svg>

        {/* Tooltip overlay */}
        {tooltip && (
          <div
            className="map-tooltip"
            style={{
              position: 'absolute',
              top: '1rem', right: '1rem',
              pointerEvents: 'none',
            }}
          >
            <div className="map-tooltip-name">{tooltip.facility_name}</div>
            <div className="map-tooltip-row">{tooltip.city}, {tooltip.state}</div>
            <div className="map-tooltip-row" style={{ color: TYPE_COLORS[tooltip.facility_type] }}>
              {tooltip.facility_type}
            </div>
            {tooltip.latest_occupancy_rate != null && (
              <div className="map-tooltip-row">
                Occupancy: {(tooltip.latest_occupancy_rate * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}
      </div>

      <div className="map-summary">{markers.length} of {facilities.length} facilities mapped</div>
    </div>
  )
}
