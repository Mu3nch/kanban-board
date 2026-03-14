import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../lib/supabase'

// ─── Colour constants ────────────────────────────────────────────────────────
const GOLD    = '#b8932a'
const SLATE   = '#94a3b8'
const GREEN   = '#34d399'
const AMBER   = '#f59e0b'
const RED     = '#f87171'
const NAVY    = '#0f1f3d'

const TIER_STYLE = {
  High:   { bg: 'rgba(248,113,113,0.12)', color: RED,   border: 'rgba(248,113,113,0.3)' },
  Medium: { bg: 'rgba(245,158,11,0.12)',  color: AMBER, border: 'rgba(245,158,11,0.3)'  },
  Low:    { bg: 'rgba(52,211,153,0.12)',  color: GREEN, border: 'rgba(52,211,153,0.3)'  },
}

// ─── Friendly labels for driver column names ─────────────────────────────────
const DRIVER_LABELS = {
  staff_turnover_rate:         'Staff Turnover',
  claims_denied_rate:          'Claims Denial Rate',
  occupancy_rate:              'Occupancy Rate',
  referral_conversion_rate:    'Referral Conversion',
  treatment_completion_rate:   'Completion Rate',
  ebitda_margin:               'EBITDA Margin',
  collections_rate:            'Collections Rate',
  ar_days:                     'AR Days',
  readmission_rate:            'Readmission Rate',
  lag1_turnover:               'Prior-Mo Turnover',
  lag1_denial_rate:            'Prior-Mo Denial Rate',
  lag1_ebitda_margin:          'Prior-Mo EBITDA Margin',
  roll3_turnover:              '3-Mo Avg Turnover',
  roll3_denial_rate:           '3-Mo Avg Denial Rate',
  roll3_ebitda_margin:         '3-Mo Avg EBITDA Margin',
}
const driverLabel = key => DRIVER_LABELS[key] || key.replace(/_/g, ' ')

export default function AnalyticsDashboard() {
  const navigate = useNavigate()

  const [kpis,       setKpis]       = useState(null)
  const [trends,     setTrends]     = useState([])
  const [byType,     setByType]     = useState([])
  const [riskScores, setRiskScores] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // ── 1. Pull facility lookup (50 rows, instant) ───────────────────────
        const { data: facilities, error: facErr } = await supabase
          .from('portfolio_facilities')
          .select('facility_id,facility_name,state,facility_type')
        if (facErr) throw facErr
        const facMap = Object.fromEntries(facilities.map(f => [f.facility_id, f]))

        // ── 2. Pull monthly metrics (no join, much faster) ───────────────────
        const { data: raw, error: kpiErr } = await supabase
          .from('monthly_facility_metrics')
          .select('facility_id,metric_date,metric_year,metric_month,occupancy_rate,ebitda,ebitda_margin,ebitda_budget_monthly,underperformance_flag,claims_denied_rate,net_revenue,total_admissions,avg_length_of_stay,treatment_completion_rate,readmission_rate,staff_turnover_rate,ar_days')
          .order('metric_date', { ascending: false })
          .limit(1200)

        if (kpiErr) throw kpiErr

        // Flatten client-side join + pre-compute pct columns
        const kpiData = raw.reverse().map(r => ({
          ...r,
          facility_name:       facMap[r.facility_id]?.facility_name,
          state:               facMap[r.facility_id]?.state,
          facility_type:       facMap[r.facility_id]?.facility_type,
          occupancy_pct:       (r.occupancy_rate || 0) * 100,
          ebitda_margin_pct:   (r.ebitda_margin   || 0) * 100,
          denial_rate_pct:     (r.claims_denied_rate || 0) * 100,
          completion_rate_pct: (r.treatment_completion_rate || 0) * 100,
          readmission_rate_pct:(r.readmission_rate || 0) * 100,
          turnover_rate_pct:   (r.staff_turnover_rate || 0) * 100,
        }))

        // ── 2. Latest month KPI cards ─────────────────────────────────────────
        const latestMonth = kpiData.reduce((a, b) =>
          a.metric_date > b.metric_date ? a : b
        ).metric_date

        const latestRows = kpiData.filter(r => r.metric_date === latestMonth)
        const avg = key => latestRows.reduce((s, r) => s + (r[key] || 0), 0) / latestRows.length

        setKpis({
          month:            latestMonth.slice(0, 7),
          occupancy:        (avg('occupancy_rate') * 100).toFixed(1),
          ebitdaMargin:     avg('ebitda_margin_pct').toFixed(1),
          underperf:        (avg('underperformance_flag') * 100).toFixed(1),
          denialRate:       avg('denial_rate_pct').toFixed(1),
          facilityCount:    latestRows.length,
        })

        // ── 3. Monthly trend data (portfolio averages) ────────────────────────
        const monthMap = {}
        kpiData.forEach(r => {
          const m = r.metric_date.slice(0, 7)
          if (!monthMap[m]) monthMap[m] = { month: m, occupancy: [], ebitda: [], budget: [], underperf: [] }
          monthMap[m].occupancy.push(r.occupancy_rate || 0)
          monthMap[m].ebitda.push(r.ebitda || 0)
          monthMap[m].budget.push(r.ebitda_budget_monthly || 0)
          monthMap[m].underperf.push(r.underperformance_flag || 0)
        })

        const trendRows = Object.values(monthMap)
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(m => ({
            month:      m.month,
            occupancy:  +( m.occupancy.reduce((s,v)=>s+v,0) / m.occupancy.length * 100 ).toFixed(1),
            ebitda:     +( m.ebitda.reduce((s,v)=>s+v,0) / m.ebitda.length / 1000 ).toFixed(0),
            budget:     +( m.budget.reduce((s,v)=>s+v,0) / m.budget.length / 1000 ).toFixed(0),
            underperf:  +( m.underperf.reduce((s,v)=>s+v,0) / m.underperf.length * 100 ).toFixed(1),
          }))
        setTrends(trendRows)

        // ── 4. Underperformance by facility type ──────────────────────────────
        const typeMap = {}
        kpiData.forEach(r => {
          const t = r.facility_type || 'Unknown'
          if (!typeMap[t]) typeMap[t] = { type: t, flags: [], total: 0 }
          typeMap[t].flags.push(r.underperformance_flag || 0)
          typeMap[t].total++
        })
        setByType(
          Object.values(typeMap).map(t => ({
            type:     t.type,
            underperf: +( t.flags.reduce((s,v)=>s+v,0) / t.flags.length * 100 ).toFixed(1),
          })).sort((a, b) => b.underperf - a.underperf)
        )

        // ── 5. ML Risk Scores ─────────────────────────────────────────────────
        const { data: scores, error: scErr } = await supabase
          .from('facility_risk_scores')
          .select(`
            facility_id, metric_year, metric_month,
            risk_score, risk_tier,
            top_driver_1, top_driver_2, top_driver_3,
            portfolio_facilities ( facility_name, city, state, facility_type )
          `)
          .order('risk_score', { ascending: false })

        if (scErr && scErr.code !== 'PGRST116') throw scErr
        setRiskScores(scores || [])

      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ─── Recharts custom tooltip ─────────────────────────────────────────────
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="dash-tooltip">
        <div className="dash-tooltip-label">{label}</div>
        {payload.map(p => (
          <div key={p.name} className="dash-tooltip-row" style={{ color: p.color }}>
            {p.name}: <strong>{p.value}{p.unit || ''}</strong>
          </div>
        ))}
      </div>
    )
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
            <h2>Analytics Dashboard</h2>
            <p>ACE Capital Behavioral Health Portfolio · KPIs &amp; ML Risk Intelligence</p>
          </div>
          {kpis && <div className="docs-count">As of {kpis.month}</div>}
        </div>

        {loading && <div className="dir-state">Loading dashboard…</div>}
        {error   && <div className="dir-state dir-error">Error: {error}</div>}

        {!loading && !error && <>

          {/* ════════════════════════════════════════════════════════
              A. KPI CARDS
          ════════════════════════════════════════════════════════ */}
          <div className="dash-kpi-grid">
            <div className="dash-kpi-card">
              <div className="dash-kpi-label">Avg Occupancy</div>
              <div className="dash-kpi-value" style={{ color: GREEN }}>{kpis.occupancy}%</div>
              <div className="dash-kpi-sub">{kpis.facilityCount} active facilities</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-label">Avg EBITDA Margin</div>
              <div className="dash-kpi-value" style={{ color: GOLD }}>{kpis.ebitdaMargin}%</div>
              <div className="dash-kpi-sub">Net revenue basis</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-label">Underperformance Rate</div>
              <div className="dash-kpi-value" style={{ color: parseFloat(kpis.underperf) > 30 ? RED : AMBER }}>
                {kpis.underperf}%
              </div>
              <div className="dash-kpi-sub">EBITDA &lt; 90% of budget</div>
            </div>
            <div className="dash-kpi-card">
              <div className="dash-kpi-label">Avg Claims Denial Rate</div>
              <div className="dash-kpi-value" style={{ color: parseFloat(kpis.denialRate) > 15 ? RED : SLATE }}>
                {kpis.denialRate}%
              </div>
              <div className="dash-kpi-sub">Revenue cycle risk</div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              B. ML RISK RANKINGS
          ════════════════════════════════════════════════════════ */}
          <div className="dash-section">
            <div className="hub-section-header">
              <span className="hub-section-icon">◈</span>
              <div>
                <h3 className="hub-section-title">ML Risk Rankings</h3>
                <p className="hub-section-sub">
                  Facilities ranked by predicted underperformance probability next month · XGBoost model
                </p>
              </div>
            </div>

            {riskScores.length === 0 ? (
              <div className="dash-empty-state">
                <div className="dash-empty-icon">◈</div>
                <p className="dash-empty-title">No risk scores yet</p>
                <p className="dash-empty-sub">
                  Run <code>database/analysis.ipynb</code> to train the ML models and generate facility risk scores.
                </p>
              </div>
            ) : (
              <div className="dir-table-wrap" style={{ margin: '0' }}>
                <table className="dir-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Facility</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Risk Score</th>
                      <th>Tier</th>
                      <th>Top Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskScores.map((r, i) => {
                      const tier  = TIER_STYLE[r.risk_tier] || TIER_STYLE.Low
                      const pct   = (r.risk_score * 100).toFixed(1)
                      const fac   = r.portfolio_facilities || {}
                      return (
                        <tr key={r.facility_id}>
                          <td className="dir-center" style={{ color: 'rgba(148,163,184,0.4)', fontSize: '0.72rem' }}>{i + 1}</td>
                          <td><div className="dir-name">{fac.facility_name || `Facility ${r.facility_id}`}</div></td>
                          <td>{fac.city}, {fac.state}</td>
                          <td>{fac.facility_type}</td>
                          <td>
                            <div className="dash-score-wrap">
                              <div className="dash-score-bar-bg">
                                <div
                                  className="dash-score-bar-fill"
                                  style={{ width: `${pct}%`, background: tier.color }}
                                />
                              </div>
                              <span className="dash-score-label" style={{ color: tier.color }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="doc-category-badge" style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                              {r.risk_tier}
                            </span>
                          </td>
                          <td className="dir-sub">{driverLabel(r.top_driver_1)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════
              C. TREND CHARTS
          ════════════════════════════════════════════════════════ */}
          <div className="dash-charts-grid">

            {/* Occupancy trend */}
            <div className="dash-chart-card">
              <div className="dash-chart-title">Portfolio Avg Occupancy Rate</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: SLATE, fontSize: 10 }} tickLine={false}
                    interval={Math.floor(trends.length / 6)} />
                  <YAxis tick={{ fill: SLATE, fontSize: 10 }} tickLine={false} domain={[0, 100]}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="occupancy" name="Occupancy" unit="%" stroke={GREEN}
                    dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* EBITDA vs Budget */}
            <div className="dash-chart-card">
              <div className="dash-chart-title">Portfolio Avg EBITDA vs Budget (K)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: SLATE, fontSize: 10 }} tickLine={false}
                    interval={Math.floor(trends.length / 6)} />
                  <YAxis tick={{ fill: SLATE, fontSize: 10 }} tickLine={false}
                    tickFormatter={v => `$${v}K`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="ebitda"  name="EBITDA"  unit="K" stroke={GOLD}   dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="budget"  name="Budget"  unit="K" stroke={SLATE}  dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Legend wrapperStyle={{ fontSize: '0.72rem', color: SLATE }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Underperformance rate over time */}
            <div className="dash-chart-card">
              <div className="dash-chart-title">% Facilities Underperforming Per Month</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: SLATE, fontSize: 10 }} tickLine={false}
                    interval={Math.floor(trends.length / 6)} />
                  <YAxis tick={{ fill: SLATE, fontSize: 10 }} tickLine={false} domain={[0, 100]}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="underperf" name="Underperforming" unit="%" stroke={RED}
                    fill="rgba(248,113,113,0.12)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Underperformance by facility type */}
            <div className="dash-chart-card">
              <div className="dash-chart-title">Underperformance Rate by Facility Type</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byType} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="type" tick={{ fill: SLATE, fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: SLATE, fontSize: 10 }} tickLine={false} domain={[0, 100]}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="underperf" name="Underperf Rate" unit="%" fill={GOLD} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

        </>}

        <div className="portal-footer-note">
          ACE Capital · Confidential &amp; Proprietary · Internal Use Only
        </div>
      </main>
    </div>
  )
}
