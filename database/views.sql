-- =============================================================================
-- ACE CAPITAL | BEHAVIORAL HEALTH PORTFOLIO
-- views.sql
-- PostgreSQL / Supabase Compatible
--
-- Views:
--   1. vw_facility_directory     → Facility Directory page
--   2. vw_monthly_kpi_dashboard  → Analytics Dashboard (KPIs)
--   3. vw_ml_training_dataset    → ML model feature set
--   4. vw_deal_performance       → Deal Performance / IRR tracker
-- =============================================================================


-- =============================================================================
-- 1. VW_FACILITY_DIRECTORY
--    Combines portfolio_facilities + facility_profiles + management lead.
--    Powers the Facility Directory page. One row per facility.
-- =============================================================================
CREATE OR REPLACE VIEW vw_facility_directory AS
SELECT
    -- Facility identifiers
    pf.facility_id,
    pf.facility_name,
    pf.city,
    pf.state,
    pf.region,
    pf.facility_type,
    pf.bed_capacity,
    pf.license_number,
    pf.status                           AS facility_status,
    pf.acquisition_date,

    -- Profile details
    fp.address,
    fp.zip_code,
    fp.phone,
    fp.email,
    fp.medical_director,
    fp.facility_size_sqft,
    fp.accreditation,
    fp.services_offered,
    fp.year_established,
    fp.ebitda_budget_annual,
    ROUND(fp.ebitda_budget_annual / 12, 2) AS ebitda_budget_monthly,

    -- Deal context
    d.deal_type,
    d.acquisition_date                  AS deal_close_date,
    d.entry_enterprise_value,
    d.entry_multiple,
    d.deal_status,

    -- Most recent CEO / lead executive (scalar subquery)
    (
        SELECT mt.full_name
        FROM   management_team mt
        WHERE  mt.facility_id = pf.facility_id
          AND  mt.title = 'CEO'
        LIMIT  1
    )                                   AS ceo_name,

    -- Most recent month's occupancy (quick performance snapshot)
    (
        SELECT m.occupancy_rate
        FROM   monthly_facility_metrics m
        WHERE  m.facility_id = pf.facility_id
        ORDER  BY m.metric_date DESC
        LIMIT  1
    )                                   AS latest_occupancy_rate,

    -- Count of active value creation initiatives
    (
        SELECT COUNT(*)
        FROM   value_creation_initiatives vci
        WHERE  vci.facility_id = pf.facility_id
          AND  vci.status = 'In Progress'
    )                                   AS active_initiatives

FROM  portfolio_facilities pf
LEFT  JOIN facility_profiles fp ON fp.facility_id = pf.facility_id
LEFT  JOIN deals             d  ON d.facility_id  = pf.facility_id
ORDER BY pf.state, pf.city, pf.facility_name;

COMMENT ON VIEW vw_facility_directory IS
  'One row per facility for the Facility Directory page. '
  'Combines identity, profile, deal context, and live KPI snapshot.';


-- =============================================================================
-- 2. VW_MONTHLY_KPI_DASHBOARD
--    Full monthly operational and financial KPIs with YoY comparison.
--    Powers the Analytics Dashboard. One row per facility per month.
-- =============================================================================
CREATE OR REPLACE VIEW vw_monthly_kpi_dashboard AS
WITH ranked_months AS (
    -- Attach prior-year value for YoY delta calculations
    SELECT
        m.*,
        LAG(m.ebitda,          12) OVER (PARTITION BY m.facility_id ORDER BY m.metric_date) AS ebitda_prior_year,
        LAG(m.net_revenue,     12) OVER (PARTITION BY m.facility_id ORDER BY m.metric_date) AS net_revenue_prior_year,
        LAG(m.occupancy_rate,  12) OVER (PARTITION BY m.facility_id ORDER BY m.metric_date) AS occupancy_prior_year,
        LAG(m.total_admissions,12) OVER (PARTITION BY m.facility_id ORDER BY m.metric_date) AS admissions_prior_year
    FROM monthly_facility_metrics m
)
SELECT
    -- Facility context
    pf.facility_id,
    pf.facility_name,
    pf.city,
    pf.state,
    pf.facility_type,
    pf.bed_capacity,
    pf.status                                   AS facility_status,

    -- Time dimensions
    rm.metric_date,
    rm.metric_year,
    rm.metric_month,
    TO_CHAR(rm.metric_date, 'Mon YYYY')         AS month_label,

    -- ── Census & Occupancy ────────────────────────────────────────────────
    rm.avg_daily_census,
    rm.occupancy_rate,
    ROUND(rm.occupancy_rate * 100, 1)           AS occupancy_pct,
    rm.bed_capacity                             AS licensed_beds,

    -- ── Admissions ────────────────────────────────────────────────────────
    rm.total_admissions,
    rm.total_discharges,
    rm.avg_length_of_stay,

    -- ── Clinical Outcomes ─────────────────────────────────────────────────
    ROUND(rm.treatment_completion_rate * 100, 1) AS completion_rate_pct,
    ROUND(rm.readmission_rate          * 100, 1) AS readmission_rate_pct,

    -- ── Referral Funnel ───────────────────────────────────────────────────
    rm.total_referrals,
    rm.converted_referrals,
    ROUND(rm.referral_conversion_rate * 100, 1) AS conversion_rate_pct,

    -- ── Payer Mix ─────────────────────────────────────────────────────────
    ROUND(rm.payer_commercial * 100, 1)         AS payer_commercial_pct,
    ROUND(rm.payer_medicaid   * 100, 1)         AS payer_medicaid_pct,
    ROUND(rm.payer_medicare   * 100, 1)         AS payer_medicare_pct,
    ROUND(rm.payer_self_pay   * 100, 1)         AS payer_self_pay_pct,

    -- ── Staffing ──────────────────────────────────────────────────────────
    rm.total_staff_count,
    rm.clinical_staff_count,
    ROUND(rm.staff_turnover_rate * 100, 1)      AS turnover_rate_pct,

    -- ── Financials ────────────────────────────────────────────────────────
    rm.gross_revenue,
    rm.net_revenue,
    rm.total_expenses,
    rm.ebitda,
    ROUND(rm.ebitda_margin * 100, 1)            AS ebitda_margin_pct,
    rm.ebitda_budget_monthly                    AS ebitda_budget,
    ROUND(
        CASE WHEN rm.ebitda_budget_monthly > 0
             THEN rm.ebitda / rm.ebitda_budget_monthly * 100
             ELSE NULL END,
    1)                                          AS ebitda_vs_budget_pct,

    -- ── Revenue Cycle ─────────────────────────────────────────────────────
    rm.claims_submitted,
    rm.claims_denied,
    ROUND(rm.claims_denied_rate  * 100, 1)      AS denial_rate_pct,
    ROUND(rm.collections_rate    * 100, 1)      AS collections_rate_pct,
    rm.ar_days,

    -- ── YoY Deltas ────────────────────────────────────────────────────────
    ROUND(
        CASE WHEN rm.ebitda_prior_year <> 0
             THEN (rm.ebitda - rm.ebitda_prior_year) / ABS(rm.ebitda_prior_year) * 100
             ELSE NULL END,
    1)                                          AS ebitda_yoy_pct,
    ROUND(
        CASE WHEN rm.net_revenue_prior_year > 0
             THEN (rm.net_revenue - rm.net_revenue_prior_year) / rm.net_revenue_prior_year * 100
             ELSE NULL END,
    1)                                          AS revenue_yoy_pct,
    ROUND(
        (rm.occupancy_rate - COALESCE(rm.occupancy_prior_year, rm.occupancy_rate)) * 100,
    2)                                          AS occupancy_yoy_pp,  -- percentage-point change
    (rm.total_admissions - COALESCE(rm.admissions_prior_year, rm.total_admissions))
                                                AS admissions_yoy_delta,

    -- ── ML Target ─────────────────────────────────────────────────────────
    rm.underperformance_flag

FROM ranked_months rm
JOIN portfolio_facilities pf ON pf.facility_id = rm.facility_id
ORDER BY pf.facility_id, rm.metric_date;

COMMENT ON VIEW vw_monthly_kpi_dashboard IS
  'Full monthly KPI view for the Analytics Dashboard. '
  'Includes YoY deltas and EBITDA vs budget tracking.';


-- =============================================================================
-- 3. VW_ML_TRAINING_DATASET
--    Flat feature table for training ML models.
--    Target: underperformance_flag (classification or regression).
--    Includes all causal features, facility context, and lagged features.
-- =============================================================================
CREATE OR REPLACE VIEW vw_ml_training_dataset AS
WITH lagged AS (
    SELECT
        m.*,
        -- 1-month lags (most predictive for short-term underperformance)
        LAG(m.occupancy_rate,         1) OVER w   AS lag1_occupancy,
        LAG(m.referral_conversion_rate,1) OVER w   AS lag1_referral_conv,
        LAG(m.staff_turnover_rate,    1) OVER w   AS lag1_turnover,
        LAG(m.claims_denied_rate,     1) OVER w   AS lag1_denial_rate,
        LAG(m.ebitda_margin,          1) OVER w   AS lag1_ebitda_margin,
        LAG(m.collections_rate,       1) OVER w   AS lag1_collections,

        -- 3-month rolling averages (trend features)
        AVG(m.occupancy_rate)          OVER (PARTITION BY m.facility_id ORDER BY m.metric_date ROWS 2 PRECEDING) AS roll3_occupancy,
        AVG(m.ebitda_margin)           OVER (PARTITION BY m.facility_id ORDER BY m.metric_date ROWS 2 PRECEDING) AS roll3_ebitda_margin,
        AVG(m.staff_turnover_rate)     OVER (PARTITION BY m.facility_id ORDER BY m.metric_date ROWS 2 PRECEDING) AS roll3_turnover,
        AVG(m.claims_denied_rate)      OVER (PARTITION BY m.facility_id ORDER BY m.metric_date ROWS 2 PRECEDING) AS roll3_denial_rate

    FROM monthly_facility_metrics m
    WINDOW w AS (PARTITION BY m.facility_id ORDER BY m.metric_date)
)
SELECT
    -- ── Identifiers ───────────────────────────────────────────────────────
    l.metric_id,
    l.facility_id,
    l.metric_year,
    l.metric_month,
    l.metric_date,

    -- ── Facility Static Features ──────────────────────────────────────────
    pf.state,
    pf.facility_type,
    pf.bed_capacity,
    fp.accreditation,
    fp.year_established,
    EXTRACT(YEAR FROM pf.acquisition_date)      AS acquisition_year,

    -- ── Operational Features ──────────────────────────────────────────────
    l.occupancy_rate,
    l.avg_daily_census,
    l.total_admissions,
    l.avg_length_of_stay,
    l.total_referrals,
    l.referral_conversion_rate,

    -- ── Clinical Features ─────────────────────────────────────────────────
    l.treatment_completion_rate,
    l.readmission_rate,

    -- ── Staffing Features ─────────────────────────────────────────────────
    l.staff_turnover_rate,
    l.total_staff_count,
    l.clinical_staff_count,
    ROUND(
        l.clinical_staff_count::NUMERIC / NULLIF(l.total_staff_count, 0),
    4)                                          AS clinical_staff_ratio,

    -- ── Payer Mix Features ────────────────────────────────────────────────
    l.payer_commercial,
    l.payer_medicaid,
    l.payer_medicare,
    l.payer_self_pay,

    -- ── Revenue Cycle Features ────────────────────────────────────────────
    l.claims_denied_rate,
    l.collections_rate,
    l.ar_days,

    -- ── Financial Features ────────────────────────────────────────────────
    l.gross_revenue,
    l.net_revenue,
    l.total_expenses,
    l.ebitda,
    l.ebitda_margin,
    l.ebitda_budget_monthly,
    ROUND(
        CASE WHEN l.ebitda_budget_monthly > 0
             THEN l.ebitda / l.ebitda_budget_monthly
             ELSE NULL END,
    4)                                          AS ebitda_budget_ratio,  -- 1.0 = on target

    -- ── Lagged Features (t-1) ─────────────────────────────────────────────
    l.lag1_occupancy,
    l.lag1_referral_conv,
    l.lag1_turnover,
    l.lag1_denial_rate,
    l.lag1_ebitda_margin,
    l.lag1_collections,

    -- ── Rolling Average Features (3-month) ───────────────────────────────
    ROUND(l.roll3_occupancy::NUMERIC,    4)     AS roll3_occupancy,
    ROUND(l.roll3_ebitda_margin::NUMERIC,4)     AS roll3_ebitda_margin,
    ROUND(l.roll3_turnover::NUMERIC,     4)     AS roll3_turnover,
    ROUND(l.roll3_denial_rate::NUMERIC,  4)     AS roll3_denial_rate,

    -- ── ML TARGET ─────────────────────────────────────────────────────────
    l.underperformance_flag                     -- 1 = EBITDA < 90% of budget

FROM lagged l
JOIN portfolio_facilities pf ON pf.facility_id = l.facility_id
LEFT JOIN facility_profiles fp           ON fp.facility_id  = l.facility_id
ORDER BY l.facility_id, l.metric_date;

COMMENT ON VIEW vw_ml_training_dataset IS
  'Flat ML feature table for underperformance prediction. '
  'Includes raw, lagged (t-1), and 3-month rolling features. '
  'Target column: underperformance_flag.';


-- =============================================================================
-- 4. VW_DEAL_PERFORMANCE
--    Portfolio-level deal tracking with return metrics.
--    Powers the Deal Performance section of the Analytics Dashboard.
--    Includes the high_return_flag ML target.
-- =============================================================================
CREATE OR REPLACE VIEW vw_deal_performance AS
SELECT
    -- Identifiers
    d.deal_id,
    d.facility_id,
    pf.facility_name,
    pf.city,
    pf.state,
    pf.facility_type,
    pf.bed_capacity,

    -- Deal structure
    d.deal_name,
    d.deal_type,
    d.deal_status,
    d.acquisition_date,
    d.exit_date,

    -- Holding period
    ROUND(
        CASE
            WHEN d.exit_date IS NOT NULL
            THEN (d.exit_date - d.acquisition_date)::NUMERIC / 365
            ELSE (CURRENT_DATE   - d.acquisition_date)::NUMERIC / 365
        END,
    2)                                          AS holding_period_years,

    -- Entry metrics
    d.entry_enterprise_value,
    d.entry_ebitda,
    d.entry_multiple,
    d.equity_invested,
    d.debt_financing,
    ROUND(d.debt_financing / NULLIF(d.entry_enterprise_value, 0) * 100, 1)
                                                AS leverage_pct,

    -- Return metrics
    d.projected_moic,
    d.actual_moic,
    d.exit_enterprise_value,
    ROUND(
        CASE WHEN d.actual_moic IS NOT NULL
             THEN d.actual_moic - d.projected_moic
             ELSE NULL END,
    2)                                          AS moic_vs_projection,

    -- Estimated IRR (approximation: MOIC ^ (1/years) - 1)
    CASE WHEN d.actual_moic IS NOT NULL AND (d.exit_date - d.acquisition_date) > 0
         THEN ROUND(
             (POWER(d.actual_moic::NUMERIC,
                    1.0 / ((d.exit_date - d.acquisition_date)::NUMERIC / 365)) - 1) * 100,
         1)
         ELSE NULL
    END                                         AS estimated_irr_pct,

    -- Current portfolio performance (average last 12 months EBITDA)
    (
        SELECT ROUND(AVG(m.ebitda), 0)
        FROM   monthly_facility_metrics m
        WHERE  m.facility_id = d.facility_id
          AND  m.metric_date >= (
              SELECT MAX(m2.metric_date) - INTERVAL '11 months'
              FROM   monthly_facility_metrics m2
              WHERE  m2.facility_id = d.facility_id
          )
    )                                           AS ltm_avg_monthly_ebitda,

    -- Underperformance rate over life of deal (% of months flagged)
    (
        SELECT ROUND(AVG(m.underperformance_flag::NUMERIC) * 100, 1)
        FROM   monthly_facility_metrics m
        WHERE  m.facility_id = d.facility_id
    )                                           AS underperformance_rate_pct,

    -- Active value creation initiatives
    (
        SELECT COUNT(*)
        FROM   value_creation_initiatives vci
        WHERE  vci.facility_id = d.facility_id
          AND  vci.status = 'In Progress'
    )                                           AS active_initiatives,

    -- Completed initiatives total realized value
    (
        SELECT ROUND(COALESCE(SUM(vci.actual_value_impact), 0), 0)
        FROM   value_creation_initiatives vci
        WHERE  vci.facility_id = d.facility_id
          AND  vci.status = 'Completed'
    )                                           AS realized_value_creation,

    -- ML TARGET ──────────────────────────────────────────────────────────
    d.high_return_flag                          -- 1 if actual_moic >= 2.5

FROM deals d
JOIN portfolio_facilities pf ON pf.facility_id = d.facility_id
ORDER BY d.deal_status DESC, d.actual_moic DESC NULLS LAST;

COMMENT ON VIEW vw_deal_performance IS
  'Deal-level return analytics for the Portfolio Dashboard. '
  'Includes MOIC, estimated IRR, holding period, and ML target high_return_flag. '
  'IRR is approximated as: MOIC^(1/years) - 1.';
