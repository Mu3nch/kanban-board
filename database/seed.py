"""
=============================================================================
ACE CAPITAL | BEHAVIORAL HEALTH PORTFOLIO
seed.py

Description:
    Generates synthetic but structurally realistic data for 50 rehabilitation
    facilities across 48 months. Data relationships are modeled causally so
    that ML models can learn meaningful patterns:

    Causal Chain:
        referral_conversion_rate
            → admissions
            → avg_daily_census / occupancy_rate
            → gross_revenue / net_revenue
            → ebitda → underperformance_flag

        staff_turnover_rate
            → treatment_completion_rate (negative)
            → readmission_rate (positive)

        claims_denied_rate
            → collections_rate (negative)
            → net_revenue (negative)
            → ebitda → underperformance_flag

ML Targets:
    underperformance_flag  → 1 if EBITDA < 90% of budget  (target: 20–35%)
    high_return_flag       → 1 if actual_moic >= 2.5       (target: 25–40%)

Output:
    Prints SQL INSERT statements to stdout.
    Redirect to a file: python seed.py > seed_data.sql

Requirements:
    pip install faker numpy pandas
=============================================================================
"""

import random
import math
import sys
from datetime import date, timedelta

import numpy as np
import pandas as pd
from faker import Faker

# ── Reproducibility ──────────────────────────────────────────────────────────
fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)


# =============================================================================
# CONSTANTS
# =============================================================================

N_FACILITIES = 50
N_MONTHS     = 48                          # 4 years of monthly data
START_MONTH  = date(2022, 1, 1)            # Jan 2022 → Dec 2025

SE_STATES = ['FL', 'GA', 'AL', 'MS', 'TN', 'SC', 'NC', 'VA', 'LA', 'AR', 'KY', 'WV']

SE_CITIES = {
    'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Gainesville'],
    'GA': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
    'AL': ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
    'MS': ['Jackson', 'Gulfport', 'Hattiesburg', 'Biloxi', 'Tupelo'],
    'TN': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
    'SC': ['Charleston', 'Columbia', 'Greenville', 'Myrtle Beach', 'Rock Hill'],
    'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Asheville'],
    'VA': ['Richmond', 'Virginia Beach', 'Norfolk', 'Arlington', 'Roanoke'],
    'LA': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
    'AR': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Jonesboro', 'Conway'],
    'KY': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
    'WV': ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
}

FACILITY_NAME_WORDS = ['Recovery', 'Wellness', 'Behavioral Health', 'Treatment', 'Healing', 'Renewal', 'Hope']
FACILITY_TYPES      = ['Residential', 'IOP', 'PHP', 'Detox', 'Dual Diagnosis', 'Sober Living']
ACCREDITATIONS      = ['CARF', 'Joint Commission', 'BHQR', 'CARF + Joint Commission', 'None']
DEAL_TYPES          = ['Platform', 'Add-On', 'Recap']

MANAGEMENT_TITLES = [
    ('CEO',                          'Operations'),
    ('CFO',                          'Finance'),
    ('Medical Director',             'Medical'),
    ('Clinical Director',            'Clinical'),
    ('COO',                          'Operations'),
    ('Director of Nursing',          'Clinical'),
    ('Business Development Director','Operations'),
    ('Compliance Officer',           'Operations'),
    ('VP of Revenue Cycle',          'Finance'),
    ('Director of Admissions',       'Operations'),
]

INITIATIVE_TEMPLATES = [
    ('EMR System Implementation',          'Technology'),
    ('Staff Retention Program',            'Staffing'),
    ('Revenue Cycle Optimization',         'Revenue'),
    ('Referral Network Expansion',         'Revenue'),
    ('Clinical Protocol Standardization',  'Clinical'),
    ('Bed Capacity Expansion',             'Operational'),
    ('Telehealth Integration',             'Technology'),
    ('Payer Contract Renegotiation',       'Revenue'),
    ('Staff Training & Certification',     'Staffing'),
    ('Utilization Review Process',         'Operational'),
    ('Alumni Aftercare Program',           'Clinical'),
    ('Quality Assurance Program',          'Clinical'),
    ('Marketing & Brand Development',      'Revenue'),
    ('Billing Department Restructure',     'Revenue'),
    ('Facility Renovation',                'Operational'),
]

DEGREES       = ['MBA', 'MSW', 'MD', 'PhD', 'DNP', 'LCSW', 'MBA/MPH', 'MHA', 'RN, BSN']
INIT_STATUSES = ['Planning', 'In Progress', 'Completed', 'On Hold']
PRIORITIES    = ['High', 'Medium', 'Low']


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def clamp(value, lo, hi):
    """Keep a value within [lo, hi]."""
    return max(lo, min(hi, value))


def jitter(sigma):
    """Return a normal random draw with mean 0 and given sigma."""
    return float(np.random.normal(0, sigma))


def sql_val(v):
    """
    Convert a Python value to a SQL literal string.
    Handles None→NULL, bool, date, int, float, str.
    """
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int,)):
        return str(v)
    if isinstance(v, float):
        return f"{v:.4f}"
    if isinstance(v, date):
        return f"'{v.isoformat()}'"
    # String — escape single quotes
    return "'" + str(v).replace("'", "''") + "'"


def make_months(start: date, n: int):
    """Return a list of n monthly date objects (1st of each month)."""
    months = []
    y, m = start.year, start.month
    for _ in range(n):
        months.append(date(y, m, 1))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return months


def random_acq_date():
    """Acquisition date between Jan 2018 and Dec 2022."""
    start = date(2018, 1, 1)
    end   = date(2022, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))


# =============================================================================
# SQL WRITER
# =============================================================================

def insert_rows(table: str, rows: list[dict]):
    """Print INSERT statements for a list of row dicts."""
    if not rows:
        return
    cols = list(rows[0].keys())
    col_str = ', '.join(cols)
    print(f"\n-- {table} ({len(rows)} rows)")
    print(f"INSERT INTO {table} ({col_str}) VALUES")
    lines = []
    for row in rows:
        vals = ', '.join(sql_val(row[c]) for c in cols)
        lines.append(f"  ({vals})")
    print(',\n'.join(lines) + ';')


# =============================================================================
# 1. GENERATE PORTFOLIO FACILITIES
# =============================================================================

def gen_facilities():
    rows = []
    for fid in range(1, N_FACILITIES + 1):
        state = random.choice(SE_STATES)
        city  = random.choice(SE_CITIES[state])
        ftype = random.choice(FACILITY_TYPES)

        # Bed capacity depends on facility type
        if ftype in ('Residential', 'Dual Diagnosis'):
            beds = random.randint(30, 120)
        elif ftype == 'Detox':
            beds = random.randint(20, 60)
        elif ftype in ('IOP', 'PHP'):
            beds = random.randint(20, 80)
        else:
            beds = random.randint(15, 50)

        rows.append({
            'facility_id':      fid,
            'facility_name':    f"{city} {random.choice(FACILITY_NAME_WORDS)} Center",
            'city':             city,
            'state':            state,
            'region':           'Southeast',
            'facility_type':    ftype,
            'bed_capacity':     beds,
            'license_number':   f"BH-{state}-{random.randint(10000, 99999)}",
            'status':           'Sold' if fid > 45 else 'Active',
            'acquisition_date': random_acq_date(),
        })
    return rows


# =============================================================================
# 2. GENERATE FACILITY PROFILES
# =============================================================================

def gen_profiles(facilities):
    rows = []
    for f in facilities:
        # Annual EBITDA budget: $12k–$40k per bed per year
        ebitda_annual = round(f['bed_capacity'] * random.uniform(12_000, 40_000), 2)
        rows.append({
            'facility_id':           f['facility_id'],
            'address':               fake.street_address(),
            'zip_code':              fake.zipcode()[:5],
            'phone':                 fake.numerify('(###) ###-####'),
            'email':                 f"admin@ace-{f['facility_id']}.com",
            'medical_director':      f"Dr. {fake.last_name()}, MD",
            'facility_size_sqft':    f['bed_capacity'] * random.randint(400, 800),
            'accreditation':         random.choice(ACCREDITATIONS),
            'services_offered':      ', '.join(random.sample([
                'Medically Supervised Detox', 'Residential Treatment',
                'Intensive Outpatient', 'Partial Hospitalization', 'MAT',
                'Individual Therapy', 'Group Therapy', 'Family Counseling',
                'Aftercare Planning', 'Alumni Services',
            ], k=random.randint(3, 7))),
            'year_established':      random.randint(1995, 2020),
            'ebitda_budget_annual':  ebitda_annual,
        })
    return rows


# =============================================================================
# 3. GENERATE DEALS
#    ~35% of facilities are exited. Among exited, ~32% hit MOIC >= 2.5.
#    Final high_return_flag distribution target: 25–40% of ALL deals.
# =============================================================================

def gen_deals(facilities):
    rows = []
    for f in facilities:
        # Entry EBITDA based on bed count
        entry_ebitda = round(f['bed_capacity'] * random.uniform(10_000, 35_000), 2)
        entry_mult   = round(random.uniform(6.0, 12.0), 2)
        entry_ev     = round(entry_ebitda * entry_mult, 2)

        equity_pct   = random.uniform(0.40, 0.60)
        equity       = round(entry_ev * equity_pct, 2)
        debt         = round(entry_ev - equity, 2)
        proj_moic    = round(random.uniform(2.0, 4.5), 2)

        # Determine if deal is exited
        is_sold      = f['status'] == 'Sold'
        is_exited    = is_sold or (random.random() < 0.25)

        actual_moic = exit_date = exit_ev = None
        high_return  = 0
        deal_status  = 'Active'

        if is_exited:
            # Exit occurs 2–5 years after acquisition
            candidate_exit = f['acquisition_date'] + timedelta(days=random.randint(730, 1825))
            if candidate_exit <= date(2026, 3, 1):
                exit_date   = candidate_exit
                deal_status = 'Exited'
                # ~32% of exited deals are high-return
                if random.random() < 0.32:
                    actual_moic = round(random.uniform(2.5, 5.0), 2)
                    high_return = 1
                else:
                    actual_moic = round(random.uniform(1.2, 2.49), 2)
                    high_return = 0
                exit_ev = round(equity * actual_moic + debt, 2)

        rows.append({
            'facility_id':              f['facility_id'],
            'deal_name':                f"ACE Capital – {f['facility_name']}",
            'deal_type':                random.choice(DEAL_TYPES),
            'acquisition_date':         f['acquisition_date'],
            'entry_enterprise_value':   entry_ev,
            'entry_ebitda':             entry_ebitda,
            'entry_multiple':           entry_mult,
            'equity_invested':          equity,
            'debt_financing':           debt,
            'projected_moic':           proj_moic,
            'actual_moic':              actual_moic,
            'exit_date':                exit_date,
            'exit_enterprise_value':    exit_ev,
            'deal_status':              deal_status,
            'high_return_flag':         high_return,
        })
    return rows


# =============================================================================
# 4. GENERATE MONTHLY FACILITY METRICS
#    Core data generation with causal structure:
#
#    referral_conversion → admissions → census → occupancy
#    occupancy           → gross_revenue
#    staff_turnover      → completion_rate (negative)
#    claims_denied       → collections_rate (negative)
#    collections_rate    → net_revenue → ebitda → underperformance_flag
#
#    Trend: slight improvement over 48 months to simulate value creation.
#    Underperformance target: ~20–35% of rows.
# =============================================================================

def gen_metrics(facilities, profiles):
    """
    Build facility-level baseline parameters, then generate one row
    per facility per month. Uses causal relationships between variables.
    """
    # Index profiles by facility_id for easy lookup
    profile_by_fid = {p['facility_id']: p for p in profiles}

    # ── Per-facility stable characteristics ──────────────────────────────────
    baselines = {}
    for f in facilities:
        fid = f['facility_id']

        # Payer mix must sum to 1.0
        commercial = random.uniform(0.20, 0.50)
        medicaid   = random.uniform(0.20, 0.45)
        medicare   = random.uniform(0.05, 0.20)
        self_pay   = 1.0 - commercial - medicaid - medicare
        # Safety: clamp self_pay and renormalize if needed
        if self_pay < 0.02:
            scale = 1.0 / (commercial + medicaid + medicare + 0.02)
            commercial *= scale; medicaid *= scale; medicare *= scale
            self_pay = 0.02

        baselines[fid] = {
            'base_referral_conv':   random.uniform(0.25, 0.65),
            'base_occupancy':       random.uniform(0.60, 0.88),
            'base_los':             random.uniform(18, 48),       # Days
            'base_staff_turnover':  random.uniform(0.15, 0.50),
            'base_claims_denied':   random.uniform(0.05, 0.28),
            'revenue_per_pt_day':   random.uniform(450, 1200),    # Gross rate
            'expense_ratio':        random.uniform(0.68, 0.85),   # Expenses / net revenue
            'payer_commercial':     commercial,
            'payer_medicaid':       medicaid,
            'payer_medicare':       medicare,
            'payer_self_pay':       self_pay,
        }

    months = make_months(START_MONTH, N_MONTHS)
    rows   = []

    for f in facilities:
        fid  = f['facility_id']
        bl   = baselines[fid]
        prof = profile_by_fid[fid]
        ebitda_budget_monthly = prof['ebitda_budget_annual'] / 12

        for idx, mdate in enumerate(months):
            # Trend scalar: up to +8% improvement over 48 months
            t = idx / (N_MONTHS - 1)   # 0.0 → 1.0

            # ── REFERRAL CONVERSION ─────────────────────────────────────────
            # Improves slightly with value creation initiatives over time
            ref_conv = clamp(
                bl['base_referral_conv'] + t * 0.08 + jitter(0.04),
                0.10, 0.82
            )
            total_referrals     = random.randint(30, 130)
            converted_referrals = int(total_referrals * ref_conv)

            # ── ADMISSIONS (driven by referral conversion) ──────────────────
            total_admissions = max(1, converted_referrals + random.randint(-3, 4))

            # ── LENGTH OF STAY ──────────────────────────────────────────────
            avg_los = clamp(bl['base_los'] + jitter(3), 12, 65)

            # ── CENSUS & OCCUPANCY ──────────────────────────────────────────
            # Approximate average daily census from admissions × LOS / days
            days_in_month = 30
            theoretical_adc = (total_admissions * avg_los) / days_in_month
            avg_census      = clamp(theoretical_adc + jitter(2.0), 1.0, float(f['bed_capacity']))
            occupancy       = clamp(avg_census / f['bed_capacity'], 0.10, 1.00)

            total_discharges = max(1, int(total_admissions * random.uniform(0.85, 1.08)))

            # ── STAFF TURNOVER (decreases slightly with staffing initiatives) ─
            turnover = clamp(
                bl['base_staff_turnover'] - t * 0.06 + jitter(0.03),
                0.05, 0.70
            )

            # ── CLINICAL OUTCOMES ───────────────────────────────────────────
            # Completion rate: hurt by high turnover, helped by time/improvement
            completion = clamp(
                0.68 - (turnover - 0.25) * 0.55 + t * 0.06 + jitter(0.04),
                0.25, 0.93
            )
            # Readmission: inversely related to completion
            readmission = clamp(
                0.22 - completion * 0.18 + jitter(0.02),
                0.04, 0.45
            )

            total_staff    = max(5, int(f['bed_capacity'] * random.uniform(0.8, 1.2)))
            clinical_staff = max(2, int(total_staff * random.uniform(0.48, 0.65)))

            # ── REVENUE ─────────────────────────────────────────────────────
            # Weighted payer rate: commercial pays most, self-pay least
            payer_weight = (
                bl['payer_commercial'] * 1.00 +
                bl['payer_medicare']   * 0.85 +
                bl['payer_medicaid']   * 0.70 +
                bl['payer_self_pay']   * 0.50
            )
            patient_days  = avg_census * days_in_month
            gross_revenue = patient_days * bl['revenue_per_pt_day'] * payer_weight

            # ── CLAIMS ──────────────────────────────────────────────────────
            claims_submitted = total_admissions * random.randint(3, 8)
            denied_rate      = clamp(
                bl['base_claims_denied'] - t * 0.04 + jitter(0.03),
                0.02, 0.42
            )
            claims_denied = int(claims_submitted * denied_rate)

            # ── COLLECTIONS ─────────────────────────────────────────────────
            # Higher denial rate → lower collections
            coll_rate   = clamp(1.0 - denied_rate * 0.65 + jitter(0.02), 0.50, 0.98)
            net_revenue = gross_revenue * coll_rate
            ar_days     = clamp(28 + denied_rate * 65 + jitter(5), 18, 125)

            # ── EXPENSES & EBITDA ────────────────────────────────────────────
            # Expense ratio falls when occupancy is high (fixed cost leverage)
            expense_ratio  = clamp(
                bl['expense_ratio'] - (occupancy - 0.75) * 0.10 + jitter(0.03),
                0.52, 0.96
            )
            total_expenses = net_revenue * expense_ratio
            ebitda         = net_revenue - total_expenses
            ebitda_margin  = ebitda / net_revenue if net_revenue > 0 else 0.0

            # ── ML TARGET: UNDERPERFORMANCE FLAG ────────────────────────────
            # Flag = 1 when EBITDA is more than 10% below the monthly budget
            under_flag = 1 if ebitda < (ebitda_budget_monthly * 0.90) else 0

            rows.append({
                'facility_id':               fid,
                'metric_year':               mdate.year,
                'metric_month':              mdate.month,
                'metric_date':               mdate,
                'bed_capacity':              f['bed_capacity'],
                'avg_daily_census':          round(avg_census, 1),
                'occupancy_rate':            round(occupancy, 4),
                'total_admissions':          total_admissions,
                'total_discharges':          total_discharges,
                'avg_length_of_stay':        round(avg_los, 1),
                'treatment_completion_rate': round(completion, 4),
                'readmission_rate':          round(readmission, 4),
                'total_referrals':           total_referrals,
                'converted_referrals':       converted_referrals,
                'referral_conversion_rate':  round(ref_conv, 4),
                'payer_commercial':          round(bl['payer_commercial'], 4),
                'payer_medicaid':            round(bl['payer_medicaid'], 4),
                'payer_medicare':            round(bl['payer_medicare'], 4),
                'payer_self_pay':            round(bl['payer_self_pay'], 4),
                'total_staff_count':         total_staff,
                'clinical_staff_count':      clinical_staff,
                'staff_turnover_rate':       round(turnover, 4),
                'gross_revenue':             round(gross_revenue, 2),
                'net_revenue':               round(net_revenue, 2),
                'total_expenses':            round(total_expenses, 2),
                'ebitda':                    round(ebitda, 2),
                'ebitda_margin':             round(ebitda_margin, 4),
                'ebitda_budget_monthly':     round(ebitda_budget_monthly, 2),
                'claims_submitted':          claims_submitted,
                'claims_denied':             claims_denied,
                'claims_denied_rate':        round(denied_rate, 4),
                'collections_rate':          round(coll_rate, 4),
                'ar_days':                   round(ar_days, 1),
                'underperformance_flag':     under_flag,
            })

    return rows


# =============================================================================
# 5. GENERATE MANAGEMENT TEAM (3–6 per facility)
# =============================================================================

def gen_management(facilities):
    rows = []
    for f in facilities:
        fid       = f['facility_id']
        team_size = random.randint(3, 6)
        titles    = random.sample(MANAGEMENT_TITLES, team_size)

        for title, dept in titles:
            hire_date  = f['acquisition_date'] + timedelta(days=random.randint(-365, 365))
            tenure_yrs = round((date(2026, 3, 1) - hire_date).days / 365, 1)
            rows.append({
                'facility_id':  fid,
                'full_name':    fake.name(),
                'title':        title,
                'department':   dept,
                'hire_date':    hire_date,
                'tenure_years': max(0.1, tenure_yrs),
                'education':    random.choice(DEGREES),
                'prior_company':fake.company(),
            })
    return rows


# =============================================================================
# 6. GENERATE VALUE CREATION INITIATIVES (3–7 per facility)
# =============================================================================

def gen_initiatives(facilities):
    rows = []
    for f in facilities:
        fid          = f['facility_id']
        n_init       = random.randint(3, 7)
        chosen       = random.sample(INITIATIVE_TEMPLATES, n_init)

        for name, category in chosen:
            # Status weighted toward In Progress and Completed
            status = random.choices(
                INIT_STATUSES,
                weights=[0.15, 0.40, 0.35, 0.10]
            )[0]

            start_dt   = f['acquisition_date'] + timedelta(days=random.randint(30, 400))
            target_end = start_dt + timedelta(days=random.randint(90, 540))

            actual_end   = None
            actual_value = None
            est_value    = round(random.uniform(50_000, 800_000), 2)

            if status == 'Completed':
                actual_end   = target_end + timedelta(days=random.randint(-30, 60))
                actual_value = round(est_value * random.uniform(0.65, 1.35), 2)

            rows.append({
                'facility_id':             fid,
                'initiative_name':         name,
                'category':                category,
                'status':                  status,
                'priority':                random.choices(PRIORITIES, weights=[0.40, 0.45, 0.15])[0],
                'owner':                   fake.name(),
                'start_date':              start_dt,
                'target_completion_date':  target_end,
                'actual_completion_date':  actual_end,
                'estimated_value_impact':  est_value,
                'actual_value_impact':     actual_value,
                'description':             f"{name} — {category} improvement initiative.",
                'notes':                   None,
            })
    return rows


# =============================================================================
# MAIN — Generate all data and print SQL INSERT statements
# =============================================================================

def main():
    print("-- =================================================================")
    print("-- ACE Capital | Behavioral Health Portfolio — Seed Data")
    print("-- Generated by seed.py")
    print("-- =================================================================")
    print("\nBEGIN;")

    # Generate all data
    facilities = gen_facilities()
    profiles   = gen_profiles(facilities)
    deals      = gen_deals(facilities)
    metrics    = gen_metrics(facilities, profiles)
    management = gen_management(facilities)
    initiatives= gen_initiatives(facilities)

    # ── Diagnostic stats (printed to stderr so they don't corrupt SQL output) ─
    under_rate = sum(r['underperformance_flag'] for r in metrics) / len(metrics)
    hr_deals   = [d for d in deals if d['high_return_flag'] == 1]
    exited     = [d for d in deals if d['deal_status'] == 'Exited']
    print(f"-- Underperformance rate : {under_rate:.1%}  (target 20–35%)", file=sys.stderr)
    print(f"-- High-return deals     : {len(hr_deals)}/{len(deals)} = {len(hr_deals)/len(deals):.1%}  (target 25–40%)", file=sys.stderr)
    print(f"-- Exited deals          : {len(exited)}/{len(deals)}", file=sys.stderr)
    print(f"-- Total metric rows     : {len(metrics)}", file=sys.stderr)

    # Write SQL inserts
    insert_rows('portfolio_facilities',       facilities)
    insert_rows('facility_profiles',          profiles)
    insert_rows('deals',                      deals)
    insert_rows('monthly_facility_metrics',   metrics)
    insert_rows('management_team',            management)
    insert_rows('value_creation_initiatives', initiatives)

    print("\nCOMMIT;")
    print("\n-- Seed complete.")


if __name__ == '__main__':
    main()
