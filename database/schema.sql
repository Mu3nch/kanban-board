-- =============================================================================
-- ACE CAPITAL | BEHAVIORAL HEALTH PORTFOLIO
-- schema.sql
-- PostgreSQL / Supabase Compatible
--
-- Description:
--   Defines the relational schema for ACE Capital's internal PE operations
--   portal, supporting a portfolio of 50 drug & alcohol rehabilitation centers
--   across the Southeastern United States.
--
-- Tables:
--   1. portfolio_facilities       (parent)
--   2. facility_profiles          (1:1 child)
--   3. deals                      (1:1 child — one deal per facility)
--   4. monthly_facility_metrics   (1:many child — 48 months per facility)
--   5. management_team            (1:many child)
--   6. value_creation_initiatives (1:many child)
--
-- ML Target Variables:
--   monthly_facility_metrics.underperformance_flag  → 1 if EBITDA < 90% of budget
--   deals.high_return_flag                          → 1 if actual_moic >= 2.5
-- =============================================================================


-- =============================================================================
-- 1. PORTFOLIO FACILITIES (Parent Table)
--    One row per facility. All other tables FK back to this.
-- =============================================================================
CREATE TABLE portfolio_facilities (
    facility_id      SERIAL        PRIMARY KEY,
    facility_name    VARCHAR(150)  NOT NULL,
    city             VARCHAR(100)  NOT NULL,
    state            CHAR(2)       NOT NULL,                          -- Two-letter state code (SE states only)
    region           VARCHAR(50)   DEFAULT 'Southeast',
    facility_type    VARCHAR(50)   NOT NULL,                          -- 'Residential','IOP','PHP','Detox','Dual Diagnosis','Sober Living'
    bed_capacity     INTEGER       NOT NULL CHECK (bed_capacity > 0),
    license_number   VARCHAR(50),
    status           VARCHAR(20)   DEFAULT 'Active',                  -- 'Active', 'Inactive', 'Sold'
    acquisition_date DATE          NOT NULL,
    created_at       TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE portfolio_facilities IS
  'Master list of all 50 rehabilitation centers in the ACE Capital portfolio.';


-- =============================================================================
-- 2. FACILITY PROFILES (1:1 child of portfolio_facilities)
--    Operational details, contact info, accreditation, and EBITDA budget.
-- =============================================================================
CREATE TABLE facility_profiles (
    profile_id            SERIAL        PRIMARY KEY,
    facility_id           INTEGER       NOT NULL
                            REFERENCES portfolio_facilities(facility_id)
                            ON DELETE CASCADE,
    address               VARCHAR(200),
    zip_code              CHAR(5),
    phone                 VARCHAR(25),
    email                 VARCHAR(120),
    medical_director      VARCHAR(120),                               -- Name and credentials
    facility_size_sqft    INTEGER,
    accreditation         VARCHAR(100),                              -- 'CARF','Joint Commission','BHQR', etc.
    services_offered      TEXT,                                      -- Comma-separated list
    year_established      INTEGER,
    ebitda_budget_annual  NUMERIC(14, 2),                            -- Annual EBITDA target (dollars)
    created_at            TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE (facility_id)                                             -- Enforces 1:1 relationship
);

COMMENT ON TABLE facility_profiles IS
  'Extended profile data for each facility including budget targets and accreditation.';
COMMENT ON COLUMN facility_profiles.ebitda_budget_annual IS
  'Annual EBITDA target used to calculate underperformance_flag in monthly metrics.';


-- =============================================================================
-- 3. DEALS (1:1 child of portfolio_facilities)
--    M&A transaction data. One deal per facility (initial acquisition).
--    high_return_flag is the ML classification target for deal performance.
-- =============================================================================
CREATE TABLE deals (
    deal_id                 SERIAL        PRIMARY KEY,
    facility_id             INTEGER       NOT NULL
                              REFERENCES portfolio_facilities(facility_id)
                              ON DELETE CASCADE,
    deal_name               VARCHAR(200),
    deal_type               VARCHAR(50),                             -- 'Platform','Add-On','Recap'
    acquisition_date        DATE          NOT NULL,
    entry_enterprise_value  NUMERIC(16, 2),                          -- Total EV at acquisition
    entry_ebitda            NUMERIC(14, 2),                          -- LTM EBITDA at entry
    entry_multiple          NUMERIC(6, 2),                           -- EV / EBITDA at entry
    equity_invested         NUMERIC(14, 2),                          -- Equity check written
    debt_financing          NUMERIC(14, 2),                          -- Debt used to fund deal
    projected_moic          NUMERIC(6, 2),                           -- Underwriting MOIC target
    actual_moic             NUMERIC(6, 2),                           -- Realized MOIC (NULL if active)
    exit_date               DATE,                                    -- NULL if still in portfolio
    exit_enterprise_value   NUMERIC(16, 2),                          -- EV at exit (NULL if active)
    deal_status             VARCHAR(20)   DEFAULT 'Active',          -- 'Active','Exited'
    high_return_flag        SMALLINT      DEFAULT 0,                 -- ML TARGET: 1 if actual_moic >= 2.5
    created_at              TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE (facility_id)                                             -- One deal record per facility
);

COMMENT ON TABLE deals IS
  'M&A deal data for each portfolio company acquisition.';
COMMENT ON COLUMN deals.high_return_flag IS
  'ML classification target. Set to 1 when actual_moic >= 2.5 (high-return deal).';
COMMENT ON COLUMN deals.entry_multiple IS
  'Purchase price multiple: Entry Enterprise Value / Entry EBITDA.';


-- =============================================================================
-- 4. MONTHLY FACILITY METRICS (1:many child of portfolio_facilities)
--    Core operational, clinical, staffing, and financial data.
--    48 months × 50 facilities = 2,400 rows.
--    underperformance_flag is the ML regression/classification target.
-- =============================================================================
CREATE TABLE monthly_facility_metrics (
    metric_id                   SERIAL        PRIMARY KEY,
    facility_id                 INTEGER       NOT NULL
                                  REFERENCES portfolio_facilities(facility_id)
                                  ON DELETE CASCADE,
    metric_year                 INTEGER       NOT NULL,
    metric_month                INTEGER       NOT NULL CHECK (metric_month BETWEEN 1 AND 12),
    metric_date                 DATE          NOT NULL,              -- First day of the reporting month

    -- -------------------------------------------------------------------------
    -- CENSUS & OCCUPANCY
    -- -------------------------------------------------------------------------
    bed_capacity                INTEGER       NOT NULL,              -- Licensed bed count that month
    avg_daily_census            NUMERIC(7, 1),                       -- Average patients in treatment per day
    occupancy_rate              NUMERIC(6, 4),                       -- avg_daily_census / bed_capacity

    -- -------------------------------------------------------------------------
    -- ADMISSIONS & DISCHARGES
    -- -------------------------------------------------------------------------
    total_admissions            INTEGER,                             -- New patients entering treatment
    total_discharges            INTEGER,                             -- Patients completing or leaving
    avg_length_of_stay          NUMERIC(6, 1),                       -- Average days per episode of care

    -- -------------------------------------------------------------------------
    -- CLINICAL OUTCOMES
    -- -------------------------------------------------------------------------
    treatment_completion_rate   NUMERIC(6, 4),                       -- % who completed planned treatment
    readmission_rate            NUMERIC(6, 4),                       -- % readmitted within 30 days

    -- -------------------------------------------------------------------------
    -- REFERRAL PIPELINE
    -- -------------------------------------------------------------------------
    total_referrals             INTEGER,                             -- Inbound referrals received
    converted_referrals         INTEGER,                             -- Referrals converted to admissions
    referral_conversion_rate    NUMERIC(6, 4),                       -- converted / total referrals

    -- -------------------------------------------------------------------------
    -- PAYER MIX (proportions must sum to ~1.0)
    -- -------------------------------------------------------------------------
    payer_commercial            NUMERIC(6, 4),                       -- % commercial insurance
    payer_medicaid              NUMERIC(6, 4),                       -- % Medicaid
    payer_medicare              NUMERIC(6, 4),                       -- % Medicare
    payer_self_pay              NUMERIC(6, 4),                       -- % self-pay / uninsured

    -- -------------------------------------------------------------------------
    -- STAFFING
    -- -------------------------------------------------------------------------
    total_staff_count           INTEGER,
    clinical_staff_count        INTEGER,                             -- Clinicians, therapists, nurses
    staff_turnover_rate         NUMERIC(6, 4),                       -- Annualized monthly turnover rate

    -- -------------------------------------------------------------------------
    -- REVENUE CYCLE & FINANCIALS
    -- -------------------------------------------------------------------------
    gross_revenue               NUMERIC(14, 2),                      -- Billed charges before adjustments
    net_revenue                 NUMERIC(14, 2),                      -- Collected revenue after denials/adjustments
    total_expenses              NUMERIC(14, 2),                      -- Operating expenses
    ebitda                      NUMERIC(14, 2),                      -- net_revenue - total_expenses
    ebitda_margin               NUMERIC(6, 4),                       -- ebitda / net_revenue
    ebitda_budget_monthly       NUMERIC(14, 2),                      -- Monthly EBITDA target (from facility profile)

    -- -------------------------------------------------------------------------
    -- CLAIMS & COLLECTIONS
    -- -------------------------------------------------------------------------
    claims_submitted            INTEGER,                             -- Insurance claims filed
    claims_denied               INTEGER,                             -- Claims rejected by payers
    claims_denied_rate          NUMERIC(6, 4),                       -- claims_denied / claims_submitted
    collections_rate            NUMERIC(6, 4),                       -- Net collected / gross billed
    ar_days                     NUMERIC(6, 1),                       -- Average days in accounts receivable

    -- -------------------------------------------------------------------------
    -- ML TARGET VARIABLE
    -- -------------------------------------------------------------------------
    underperformance_flag       SMALLINT      DEFAULT 0,             -- 1 if ebitda < 90% of ebitda_budget_monthly

    created_at                  TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE (facility_id, metric_year, metric_month)                  -- One row per facility per month
);

COMMENT ON TABLE monthly_facility_metrics IS
  'Monthly operational and financial data for all 50 facilities across 48 months (2,400 rows).';
COMMENT ON COLUMN monthly_facility_metrics.underperformance_flag IS
  'ML target variable. 1 when EBITDA falls below 90% of the monthly budget. Target rate: 20–35%.';
COMMENT ON COLUMN monthly_facility_metrics.staff_turnover_rate IS
  'High turnover reduces treatment_completion_rate; key causal feature for ML model.';
COMMENT ON COLUMN monthly_facility_metrics.referral_conversion_rate IS
  'Higher conversion drives more admissions, which increases occupancy and revenue.';


-- =============================================================================
-- 5. MANAGEMENT TEAM (1:many child of portfolio_facilities)
--    Key executives at each facility. 3–6 members per facility.
-- =============================================================================
CREATE TABLE management_team (
    member_id       SERIAL        PRIMARY KEY,
    facility_id     INTEGER       NOT NULL
                      REFERENCES portfolio_facilities(facility_id)
                      ON DELETE CASCADE,
    full_name       VARCHAR(120)  NOT NULL,
    title           VARCHAR(120),                                    -- e.g., 'CEO','CFO','Medical Director'
    department      VARCHAR(60),                                     -- 'Clinical','Finance','Operations','Medical'
    hire_date       DATE,
    tenure_years    NUMERIC(5, 1),                                   -- Years at this facility
    education       VARCHAR(150),                                    -- Highest degree(s)
    prior_company   VARCHAR(150),                                    -- Previous employer
    created_at      TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE management_team IS
  'Key management personnel at each portfolio facility (3–6 per facility).';


-- =============================================================================
-- 6. VALUE CREATION INITIATIVES (1:many child of portfolio_facilities)
--    Strategic improvement projects tracked at the portfolio company level.
--    Used by the Operations Board view.
-- =============================================================================
CREATE TABLE value_creation_initiatives (
    initiative_id            SERIAL        PRIMARY KEY,
    facility_id              INTEGER       NOT NULL
                               REFERENCES portfolio_facilities(facility_id)
                               ON DELETE CASCADE,
    initiative_name          VARCHAR(200)  NOT NULL,
    category                 VARCHAR(60),                            -- 'Revenue','Operational','Clinical','Staffing','Technology'
    status                   VARCHAR(30)   DEFAULT 'Planning',       -- 'Planning','In Progress','Completed','On Hold'
    priority                 VARCHAR(10),                            -- 'High','Medium','Low'
    owner                    VARCHAR(120),                           -- Responsible party
    start_date               DATE,
    target_completion_date   DATE,
    actual_completion_date   DATE,                                   -- NULL if not yet completed
    estimated_value_impact   NUMERIC(14, 2),                         -- Projected dollar value creation
    actual_value_impact      NUMERIC(14, 2),                         -- Realized value (NULL if incomplete)
    description              TEXT,
    notes                    TEXT,
    created_at               TIMESTAMPTZ   DEFAULT NOW(),
    updated_at               TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE value_creation_initiatives IS
  'Value creation projects tracked per facility for the Operations Board (3–7 initiatives per facility).';
COMMENT ON COLUMN value_creation_initiatives.estimated_value_impact IS
  'Projected EBITDA or revenue improvement in dollars from completing this initiative.';


-- =============================================================================
-- INDEXES — Optimized for dashboard queries and ML feature extraction
-- =============================================================================

-- Metrics: most queries filter by facility and date range
CREATE INDEX idx_metrics_facility_date      ON monthly_facility_metrics (facility_id, metric_date);
CREATE INDEX idx_metrics_underperformance   ON monthly_facility_metrics (underperformance_flag);
CREATE INDEX idx_metrics_year_month         ON monthly_facility_metrics (metric_year, metric_month);

-- Deals: filter by return flag for ML training
CREATE INDEX idx_deals_facility             ON deals (facility_id);
CREATE INDEX idx_deals_high_return          ON deals (high_return_flag);
CREATE INDEX idx_deals_status               ON deals (deal_status);

-- Initiatives: filter by status for Operations Board
CREATE INDEX idx_initiatives_facility       ON value_creation_initiatives (facility_id);
CREATE INDEX idx_initiatives_status         ON value_creation_initiatives (status);
CREATE INDEX idx_initiatives_category       ON value_creation_initiatives (category);

-- Management: join by facility
CREATE INDEX idx_management_facility        ON management_team (facility_id);
