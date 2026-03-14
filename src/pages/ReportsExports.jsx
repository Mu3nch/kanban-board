import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, BarChart, LineChart,
  Bar, Line, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'

// ─── Metric definitions ───────────────────────────────────────────────────────
const METRICS = [
  { key: 'occupancy_pct',         label: 'Occupancy Rate',       unit: '%'  },
  { key: 'ebitda',                label: 'EBITDA',               unit: '$'  },
  { key: 'ebitda_margin_pct',     label: 'EBITDA Margin',        unit: '%'  },
  { key: 'net_revenue',           label: 'Net Revenue',          unit: '$'  },
  { key: 'total_admissions',      label: 'Total Admissions',     unit: ''   },
  { key: 'avg_length_of_stay',    label: 'Avg Length of Stay',   unit: 'd'  },
  { key: 'completion_rate_pct',   label: 'Treatment Completion', unit: '%'  },
  { key: 'readmission_rate_pct',  label: 'Readmission Rate',     unit: '%'  },
  { key: 'turnover_rate_pct',     label: 'Staff Turnover',       unit: '%'  },
  { key: 'denial_rate_pct',       label: 'Claims Denial Rate',   unit: '%'  },
  { key: 'ar_days',               label: 'AR Days',              unit: 'd'  },
  { key: 'underperformance_flag', label: 'Underperformance Rate',unit: '%'  },
]

const X_OPTIONS_FACILITY  = [
  { key: 'metric_date',   label: 'Month (Time Series)' },
  { key: 'facility_name', label: 'Facility Name'       },
  { key: 'state',         label: 'State'               },
  { key: 'facility_type', label: 'Facility Type'       },
]
const X_OPTIONS_PORTFOLIO = [
  { key: 'metric_date', label: 'Month (Time Series)' },
]

const GROUP_OPTIONS = [
  { key: '',              label: 'None'          },
  { key: 'state',         label: 'State'         },
  { key: 'facility_type', label: 'Facility Type' },
]

const CHART_TYPES = ['Bar', 'Line', 'Scatter']

// Color palette for group series
const PALETTE = ['#b8932a','#34d399','#60a5fa','#f87171','#a78bfa','#fb923c','#e879f9','#2dd4bf','#fbbf24','#f472b6','#4ade80','#38bdf8']
const GOLD  = '#b8932a'
const SLATE = '#94a3b8'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mean = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0
const fmt  = (val, unit) => {
  if (unit === '$') return `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (unit === '%') return `${Number(val).toFixed(1)}%`
  return Number(val).toFixed(1)
}

export default function ReportsExports() {
  const navigate = useNavigate()

  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [states,  setStates]  = useState([])
  const [types,   setTypes]   = useState([])
  const [months,  setMonths]  = useState([])

  // controls
  const [dataLevel,  setDataLevel]  = useState('facility')
  const [chartType,  setChartType]  = useState('Bar')
  const [xKey,       setXKey]       = useState('metric_date')
  const [yKey,       setYKey]       = useState('occupancy_pct')
  const [y2Key,      setY2Key]      = useState('')          // '' = none
  const [groupBy,    setGroupBy]    = useState('')          // '' = none
  const [selStates,  setSelStates]  = useState([])
  const [selTypes,   setSelTypes]   = useState([])
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [exportMode, setExportMode] = useState('chart')    // 'chart' | 'both'

  // output
  const [chartData,  setChartData]  = useState(null)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data: raw, error: err } = await supabase
          .from('monthly_facility_metrics')
          .select('facility_id,metric_date,metric_year,metric_month,occupancy_rate,ebitda,ebitda_margin,ebitda_budget_monthly,underperformance_flag,claims_denied_rate,net_revenue,total_admissions,avg_length_of_stay,treatment_completion_rate,readmission_rate,staff_turnover_rate,ar_days,portfolio_facilities(facility_name,state,facility_type)')
          .order('metric_date', { ascending: false })
          .limit(1200)
        if (err) throw err

        // Flatten nested join + compute pct columns (mirrors what vw_kpi_simple did)
        const data = raw.reverse().map(r => ({
          ...r,
          facility_name:        r.portfolio_facilities?.facility_name,
          state:                r.portfolio_facilities?.state,
          facility_type:        r.portfolio_facilities?.facility_type,
          occupancy_pct:        (r.occupancy_rate || 0) * 100,
          ebitda_margin_pct:    (r.ebitda_margin   || 0) * 100,
          denial_rate_pct:      (r.claims_denied_rate || 0) * 100,
          completion_rate_pct:  (r.treatment_completion_rate || 0) * 100,
          readmission_rate_pct: (r.readmission_rate || 0) * 100,
          turnover_rate_pct:    (r.staff_turnover_rate || 0) * 100,
        }))

        setRawData(data)
        setStates([...new Set(data.map(r => r.state))].sort())
        setTypes([...new Set(data.map(r => r.facility_type))].sort())
        const ms = [...new Set(data.map(r => r.metric_date.slice(0, 7)))].sort()
        setMonths(ms)
        if (ms.length) { setDateFrom(ms[0]); setDateTo(ms[ms.length - 1]) }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Generate ────────────────────────────────────────────────────────────────
  function handleGenerate() {
    try {
    let rows = rawData
    if (selStates.length) rows = rows.filter(r => selStates.includes(r.state))
    if (selTypes.length)  rows = rows.filter(r => selTypes.includes(r.facility_type))
    if (dateFrom) rows = rows.filter(r => r.metric_date.slice(0, 7) >= dateFrom)
    if (dateTo)   rows = rows.filter(r => r.metric_date.slice(0, 7) <= dateTo)

    const yMeta  = METRICS.find(m => m.key === yKey)  || METRICS[0]
    const y2Meta = y2Key ? METRICS.find(m => m.key === y2Key) : null

    // ── Portfolio monthly (always no groupBy) ─────────────────────────────────
    if (dataLevel === 'portfolio') {
      const map = {}
      rows.forEach(r => {
        const m = r.metric_date.slice(0, 7)
        if (!map[m]) map[m] = { y: [], y2: [] }
        if (r[yKey]  != null) map[m].y.push(Number(r[yKey]))
        if (y2Key && r[y2Key] != null) map[m].y2.push(Number(r[y2Key]))
      })
      const result = Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, vals]) => ({
          x:  month,
          y:  +mean(vals.y).toFixed(2),
          ...(y2Meta ? { y2: +mean(vals.y2).toFixed(2) } : {}),
        }))
      setChartData({ rows: result, yMeta, y2Meta, groups: null })
      return
    }

    // ── By Facility — grouped ─────────────────────────────────────────────────
    if (groupBy) {
      // Collect unique group values
      const uniqueGroups = [...new Set(rows.map(r => r[groupBy]))].sort()
      // Build {x → {groupVal → [values]}}
      const map = {}
      rows.forEach(r => {
        const xVal = xKey === 'metric_date' ? r.metric_date.slice(0, 7) : r[xKey]
        if (xVal == null) return
        const gVal = r[groupBy]
        if (!map[xVal]) map[xVal] = {}
        if (!map[xVal][gVal]) map[xVal][gVal] = []
        const v = r[yKey]
        if (v != null) map[xVal][gVal].push(Number(v))
      })
      const result = Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([xVal, gMap]) => {
          const entry = { x: xKey === 'facility_name' ? xVal.replace('ACE ', '').slice(0, 16) : xVal }
          uniqueGroups.forEach(g => {
            entry[g] = gMap[g] ? +mean(gMap[g]).toFixed(2) : 0
          })
          return entry
        })
      setChartData({ rows: result, yMeta, y2Meta: null, groups: uniqueGroups })
      return
    }

    // ── By Facility — ungrouped ───────────────────────────────────────────────
    const map = {}
    rows.forEach(r => {
      const xVal = xKey === 'metric_date' ? r.metric_date.slice(0, 7) : r[xKey]
      if (xVal == null) return
      if (!map[xVal]) map[xVal] = { y: [], y2: [] }
      if (r[yKey]  != null) map[xVal].y.push(Number(r[yKey]))
      if (y2Key && r[y2Key] != null) map[xVal].y2.push(Number(r[y2Key]))
    })
    const result = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([xVal, vals]) => ({
        x:  xKey === 'facility_name' ? xVal.replace('ACE ', '').slice(0, 16) : xVal,
        y:  +mean(vals.y).toFixed(2),
        ...(y2Meta ? { y2: +mean(vals.y2).toFixed(2) } : {}),
      }))
    setChartData({ rows: result, yMeta, y2Meta, groups: null })
    } catch (e) {
      setError('Chart error: ' + e.message)
    }
  }

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  function toggleFilter(list, setList, val) {
    setList(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  // ── Chart rendering ─────────────────────────────────────────────────────────
  function renderChart() {
    if (!chartData) return (
      <div className="report-empty">
        <div className="report-empty-icon">≡</div>
        <p className="report-empty-title">No chart yet</p>
        <p className="report-empty-sub">Configure your axes and filters above, then click Generate Chart.</p>
      </div>
    )
    if (!chartData.rows.length) return (
      <div className="report-empty">
        <p className="report-empty-title">No data matched your filters</p>
        <p className="report-empty-sub">Try widening the date range or removing state/type filters.</p>
      </div>
    )

    const { rows, yMeta, y2Meta, groups } = chartData
    const hasY2   = !!y2Meta
    const isLarge = rows.length > 12

    const margin  = { top: 10, right: hasY2 ? 60 : 20, left: 10, bottom: isLarge ? 70 : 40 }

    const sharedAxisProps = {
      tick: { fill: SLATE, fontSize: 10 },
      tickLine: false,
    }
    const xAxis = (
      <XAxis
        dataKey="x"
        {...sharedAxisProps}
        angle={isLarge ? -45 : 0}
        textAnchor={isLarge ? 'end' : 'middle'}
        interval={rows.length > 30 ? Math.floor(rows.length / 12) : 0}
      />
    )
    const yAxis = (
      <YAxis
        {...sharedAxisProps}
        tickFormatter={v => fmt(v, yMeta.unit)}
        width={70}
      />
    )
    const grid    = <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
    const tooltip = (
      <Tooltip
        formatter={(v, name) => {
          const m = groups ? { unit: yMeta.unit } : name === y2Meta?.label ? y2Meta : yMeta
          return [fmt(v, m.unit), name]
        }}
        contentStyle={{ background: 'rgba(13,27,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.78rem' }}
        labelStyle={{ color: GOLD, fontWeight: 600 }}
        itemStyle={{ color: SLATE }}
      />
    )

    // ── Grouped: multiple Bar or Line series, native chart types ──────────
    if (groups) {
      if (chartType === 'Line') {
        return (
          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={rows} margin={margin}>
              {grid}{xAxis}{yAxis}{tooltip}
              <Legend wrapperStyle={{ fontSize: '0.72rem', color: SLATE }} />
              {groups.map((g, i) => (
                <Line key={g} type="monotone" dataKey={g} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )
      }
      return (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={rows} margin={margin}>
            {grid}{xAxis}{yAxis}{tooltip}
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: SLATE }} />
            {groups.map((g, i) => (
              <Bar key={g} dataKey={g} fill={PALETTE[i % PALETTE.length]} radius={[3,3,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // ── Y2 overlay: ComposedChart with dual axis ───────────────────────────
    if (hasY2) {
      return (
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={rows} margin={margin}>
            {grid}{xAxis}
            <YAxis yAxisId="left"  {...sharedAxisProps} tickFormatter={v => fmt(v, yMeta.unit)}  width={70} />
            <YAxis yAxisId="right" {...sharedAxisProps} orientation="right" tickFormatter={v => fmt(v, y2Meta.unit)} width={60} />
            <Tooltip
              formatter={(v, name) => [fmt(v, name === y2Meta.label ? y2Meta.unit : yMeta.unit), name]}
              contentStyle={{ background: 'rgba(13,27,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: '0.78rem' }}
              labelStyle={{ color: GOLD, fontWeight: 600 }}
              itemStyle={{ color: SLATE }}
            />
            <Legend wrapperStyle={{ fontSize: '0.72rem', color: SLATE }} />
            {chartType === 'Bar'
              ? <Bar  yAxisId="left" dataKey="y" name={yMeta.label} fill={GOLD} radius={[3,3,0,0]} />
              : <Line yAxisId="left" type="monotone" dataKey="y" name={yMeta.label} stroke={GOLD} strokeWidth={2} dot={false} />
            }
            <Line yAxisId="right" type="monotone" dataKey="y2" name={y2Meta.label} stroke="#60a5fa" strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </ComposedChart>
        </ResponsiveContainer>
      )
    }

    // ── Scatter ────────────────────────────────────────────────────────────
    if (chartType === 'Scatter') {
      return (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={rows} margin={margin}>
            {grid}{xAxis}{yAxis}{tooltip}
            <Bar dataKey="y" name={yMeta.label} fill={GOLD} radius={[3,3,0,0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // ── Simple Bar ─────────────────────────────────────────────────────────
    if (chartType === 'Bar') {
      return (
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={rows} margin={margin}>
            {grid}{xAxis}{yAxis}{tooltip}
            <Bar dataKey="y" name={yMeta.label} fill={GOLD} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // ── Simple Line ────────────────────────────────────────────────────────
    return (
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={rows} margin={margin}>
          {grid}{xAxis}{yAxis}{tooltip}
          <Line type="monotone" dataKey="y" name={yMeta.label} stroke={GOLD} strokeWidth={2} dot={rows.length < 30} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // ── Print data table ────────────────────────────────────────────────────────
  function renderPrintTable() {
    if (!chartData?.rows.length) return null
    const { rows, yMeta, y2Meta, groups } = chartData
    return (
      <table className="report-print-table">
        <thead>
          <tr>
            <th>Label</th>
            {groups
              ? groups.map(g => <th key={g}>{g}</th>)
              : <><th>{yMeta.label}</th>{y2Meta && <th>{y2Meta.label}</th>}</>
            }
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.x}</td>
              {groups
                ? groups.map(g => <td key={g}>{fmt(r[g], yMeta.unit)}</td>)
                : <><td>{fmt(r.y, yMeta.unit)}</td>{y2Meta && <td>{fmt(r.y2, y2Meta.unit)}</td>}</>
              }
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const yMeta  = METRICS.find(m => m.key === yKey)  || METRICS[0]
  const y2Meta = y2Key ? METRICS.find(m => m.key === y2Key) : null
  const xLabel = dataLevel === 'portfolio' ? 'Month' : (X_OPTIONS_FACILITY.find(o => o.key === xKey)?.label || xKey)
  const chartTitle = chartData
    ? `${chartData.yMeta.label}${chartData.y2Meta ? ` + ${chartData.y2Meta.label}` : ''}${chartData.groups ? ` by ${GROUP_OPTIONS.find(g => g.key === groupBy)?.label}` : ''} — ${xLabel}`
    : ''

  const filterSummary = [
    selStates.length ? selStates.join(', ') : 'All States',
    selTypes.length  ? selTypes.join(', ')  : 'All Types',
    dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : '',
  ].filter(Boolean).join(' · ')

  // ── Render ──────────────────────────────────────────────────────────────────
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
            <h2>Reports &amp; Exports</h2>
            <p>ACE Capital Behavioral Health Portfolio · Self-Service Analysis</p>
          </div>
        </div>

        {loading && <div className="dir-state">Loading data…</div>}
        {error   && <div className="dir-state dir-error">Error: {error}</div>}

        {!loading && !error && <>

          {/* ── Controls ──────────────────────────────────────────────────── */}
          <div className="report-controls">

            {/* Row 1: Data level + Chart type */}
            <div className="report-controls-row">
              <div className="report-control-group">
                <label className="report-label">Data Level</label>
                <div className="report-toggle">
                  {['facility', 'portfolio'].map(lvl => (
                    <button key={lvl}
                      className={`report-toggle-btn ${dataLevel === lvl ? 'active' : ''}`}
                      onClick={() => { setDataLevel(lvl); setXKey('metric_date'); setGroupBy('') }}
                    >
                      {lvl === 'facility' ? 'By Facility' : 'Portfolio Monthly'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="report-control-group">
                <label className="report-label">Chart Type</label>
                <div className="report-toggle">
                  {CHART_TYPES.map(ct => (
                    <button key={ct}
                      className={`report-toggle-btn ${chartType === ct ? 'active' : ''}`}
                      onClick={() => setChartType(ct)}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Axes + Group by */}
            <div className="report-controls-row">
              <div className="report-control-group">
                <label className="report-label">X Axis</label>
                <select className="report-select" value={xKey} onChange={e => setXKey(e.target.value)}>
                  {(dataLevel === 'facility' ? X_OPTIONS_FACILITY : X_OPTIONS_PORTFOLIO).map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="report-control-group">
                <label className="report-label">Y Axis (Primary)</label>
                <select className="report-select" value={yKey} onChange={e => setYKey(e.target.value)}>
                  {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <div className="report-control-group">
                <label className="report-label">Y2 Overlay <span className="report-label-hint">(optional)</span></label>
                <select className="report-select" value={y2Key}
                  onChange={e => { setY2Key(e.target.value); if (e.target.value) setGroupBy('') }}
                  disabled={!!groupBy}
                >
                  <option value="">None</option>
                  {METRICS.filter(m => m.key !== yKey).map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
              {dataLevel === 'facility' && chartType !== 'Scatter' && (
                <div className="report-control-group">
                  <label className="report-label">Group / Color by <span className="report-label-hint">(optional)</span></label>
                  <select className="report-select" value={groupBy}
                    onChange={e => { setGroupBy(e.target.value); if (e.target.value) setY2Key('') }}
                    disabled={!!y2Key}
                  >
                    {GROUP_OPTIONS.map(o => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Row 3: Filters */}
            <div className="report-controls-row report-filters-row">
              <div className="report-control-group report-filter-group">
                <label className="report-label">State Filter <span className="report-label-hint">(none = all)</span></label>
                <div className="report-chip-list">
                  {states.map(s => (
                    <button key={s}
                      className={`report-chip ${selStates.includes(s) ? 'active' : ''}`}
                      onClick={() => toggleFilter(selStates, setSelStates, s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="report-control-group report-filter-group">
                <label className="report-label">Facility Type Filter <span className="report-label-hint">(none = all)</span></label>
                <div className="report-chip-list">
                  {types.map(t => (
                    <button key={t}
                      className={`report-chip ${selTypes.includes(t) ? 'active' : ''}`}
                      onClick={() => toggleFilter(selTypes, setSelTypes, t)}
                    >{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Date + export mode + actions */}
            <div className="report-controls-row report-actions-row">
              <div className="report-control-group report-date-group">
                <label className="report-label">Date Range</label>
                <div className="report-date-inputs">
                  <select className="report-select report-select-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="report-date-sep">→</span>
                  <select className="report-select report-select-sm" value={dateTo} onChange={e => setDateTo(e.target.value)}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="report-control-group">
                <label className="report-label">Export Contents</label>
                <div className="report-toggle">
                  {[['chart','Chart Only'],['both','Chart + Table']].map(([val, lbl]) => (
                    <button key={val}
                      className={`report-toggle-btn ${exportMode === val ? 'active' : ''}`}
                      onClick={() => setExportMode(val)}
                    >{lbl}</button>
                  ))}
                </div>
              </div>
              <div className="report-action-btns">
                <button className="report-btn-generate" onClick={handleGenerate}>
                  Generate Chart
                </button>
                <button className="report-btn-export" onClick={() => window.print()} disabled={!chartData}>
                  Export PDF ↓
                </button>
              </div>
            </div>
          </div>

          {/* ── Chart card ────────────────────────────────────────────────── */}
          <div className="report-chart-card">
            {chartData && (
              <div className="report-chart-header">
                <div className="report-chart-title">{chartTitle}</div>
                <div className="report-chart-meta">{filterSummary}</div>
              </div>
            )}
            {renderChart()}
          </div>

          {/* ── Print data table (shown on page when exportMode = 'both' + chart exists) */}
          {exportMode === 'both' && chartData?.rows.length > 0 && (
            <div className="report-table-card">
              <div className="report-chart-header">
                <div className="report-chart-title" style={{ fontSize: '0.85rem' }}>Underlying Data</div>
              </div>
              {renderPrintTable()}
            </div>
          )}

        </>}

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
