import { useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'

// US states topojson (hosted on CDN — no download needed)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// FIPS codes for the 12 Southeast states we highlight
const SE_FIPS = new Set([
  '01', // Alabama
  '05', // Arkansas
  '12', // Florida
  '13', // Georgia
  '21', // Kentucky
  '22', // Louisiana
  '28', // Mississippi
  '37', // North Carolina
  '45', // South Carolina
  '47', // Tennessee
  '51', // Virginia
  '54', // West Virginia
])

// City-level coordinates for every city used in the seed data
const CITY_COORDS = {
  // Florida
  'Miami,FL':            [-80.19, 25.76],
  'Orlando,FL':          [-81.38, 28.54],
  'Tampa,FL':            [-82.46, 27.95],
  'Jacksonville,FL':     [-81.66, 30.33],
  'Fort Lauderdale,FL':  [-80.14, 26.12],
  'Gainesville,FL':      [-82.33, 29.65],
  'Tallahassee,FL':      [-84.28, 30.44],
  // Georgia
  'Atlanta,GA':          [-84.39, 33.75],
  'Savannah,GA':         [-81.10, 32.08],
  'Augusta,GA':          [-81.97, 33.47],
  'Columbus,GA':         [-84.99, 32.46],
  'Macon,GA':            [-83.63, 32.84],
  // Alabama
  'Birmingham,AL':       [-86.80, 33.52],
  'Montgomery,AL':       [-86.30, 32.37],
  'Huntsville,AL':       [-86.59, 34.73],
  'Mobile,AL':           [-88.04, 30.69],
  'Tuscaloosa,AL':       [-87.57, 33.21],
  // Mississippi
  'Jackson,MS':          [-90.18, 32.30],
  'Gulfport,MS':         [-89.09, 30.37],
  'Hattiesburg,MS':      [-89.29, 31.33],
  'Biloxi,MS':           [-88.89, 30.40],
  'Tupelo,MS':           [-88.70, 34.26],
  // Tennessee
  'Nashville,TN':        [-86.78, 36.16],
  'Memphis,TN':          [-90.05, 35.15],
  'Knoxville,TN':        [-83.92, 35.96],
  'Chattanooga,TN':      [-85.31, 35.05],
  'Clarksville,TN':      [-87.36, 36.53],
  // South Carolina
  'Charleston,SC':       [-79.93, 32.78],
  'Columbia,SC':         [-81.03, 34.00],
  'Greenville,SC':       [-82.39, 34.85],
  'Myrtle Beach,SC':     [-78.89, 33.69],
  'Rock Hill,SC':        [-81.03, 34.92],
  // North Carolina
  'Charlotte,NC':        [-80.84, 35.23],
  'Raleigh,NC':          [-78.64, 35.78],
  'Greensboro,NC':       [-79.79, 36.07],
  'Durham,NC':           [-78.90, 35.99],
  'Asheville,NC':        [-82.55, 35.57],
  // Virginia
  'Richmond,VA':         [-77.46, 37.54],
  'Virginia Beach,VA':   [-75.98, 36.85],
  'Norfolk,VA':          [-76.29, 36.85],
  'Arlington,VA':        [-77.11, 38.88],
  'Roanoke,VA':          [-79.94, 37.27],
  // Louisiana
  'New Orleans,LA':      [-90.07, 29.95],
  'Baton Rouge,LA':      [-91.15, 30.45],
  'Shreveport,LA':       [-93.75, 32.53],
  'Lafayette,LA':        [-92.02, 30.22],
  'Lake Charles,LA':     [-93.22, 30.23],
  // Arkansas
  'Little Rock,AR':      [-92.29, 34.75],
  'Fort Smith,AR':       [-94.40, 35.39],
  'Fayetteville,AR':     [-94.16, 36.07],
  'Jonesboro,AR':        [-90.70, 35.84],
  'Conway,AR':           [-92.44, 35.09],
  // Kentucky
  'Louisville,KY':       [-85.76, 38.25],
  'Lexington,KY':        [-84.50, 38.04],
  'Bowling Green,KY':    [-86.44, 36.99],
  'Owensboro,KY':        [-87.11, 37.77],
  'Covington,KY':        [-84.51, 39.08],
  // West Virginia
  'Charleston,WV':       [-81.63, 38.35],
  'Huntington,WV':       [-82.44, 38.42],
  'Morgantown,WV':       [-79.95, 39.63],
  'Parkersburg,WV':      [-81.56, 39.27],
  'Wheeling,WV':         [-80.72, 40.07],
}

const TYPE_COLORS = {
  'Residential':    '#f59e0b',
  'IOP':            '#38bdf8',
  'PHP':            '#a78bfa',
  'Detox':          '#f87171',
  'Dual Diagnosis': '#34d399',
  'Sober Living':   '#fb923c',
}

export default function FacilityMap({ facilities }) {
  const [tooltip, setTooltip] = useState(null)  // { name, type, city, state, occupancy, x, y }

  // Map facilities to coordinates
  const markers = facilities
    .map(f => {
      const key = `${f.city},${f.state}`
      const coords = CITY_COORDS[key]
      if (!coords) return null
      return { ...f, coords }
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

      <div className="map-container">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 900 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={[-84, 32]} zoom={3} minZoom={2} maxZoom={6}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const isSE = SE_FIPS.has(geo.id)
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSE ? 'rgba(30,41,59,0.9)' : 'rgba(15,23,42,0.4)'}
                      stroke={isSE ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.08)'}
                      strokeWidth={0.5}
                      style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                    />
                  )
                })
              }
            </Geographies>

            {markers.map(f => (
              <Marker
                key={f.facility_id}
                coordinates={f.coords}
                onMouseEnter={(e) => {
                  setTooltip({
                    name: f.facility_name,
                    type: f.facility_type,
                    city: f.city,
                    state: f.state,
                    occupancy: f.latest_occupancy_rate,
                    status: f.facility_status,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={2}
                  fill={TYPE_COLORS[f.facility_type] || '#94a3b8'}
                  fillOpacity={0.9}
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={0.4}
                  style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                  onMouseEnter={e => { e.target.setAttribute('r', 3) }}
                  onMouseLeave={e => { e.target.setAttribute('r', 2) }}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div className="map-tooltip">
            <div className="map-tooltip-name">{tooltip.name}</div>
            <div className="map-tooltip-row">{tooltip.city}, {tooltip.state}</div>
            <div className="map-tooltip-row" style={{ color: TYPE_COLORS[tooltip.type] }}>
              {tooltip.type}
            </div>
            {tooltip.occupancy != null && (
              <div className="map-tooltip-row">
                Occupancy: {(tooltip.occupancy * 100).toFixed(1)}%
              </div>
            )}
            <div className="map-tooltip-row" style={{ opacity: 0.6 }}>{tooltip.status}</div>
          </div>
        )}
      </div>

      <div className="map-summary">
        {markers.length} of {facilities.length} facilities mapped
      </div>
    </div>
  )
}
