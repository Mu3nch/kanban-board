// scripts/generate-pdfs.js
// Run: node scripts/generate-pdfs.js
// Outputs PDFs to /public/documents/

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const OUT_DIR = path.join(__dirname, '..', 'public', 'documents')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hex(color) { return color }

const NAVY   = '#0b1424'
const NAVY2  = '#111e35'
const GOLD   = '#c9973a'
const GOLD2  = '#dba94d'
const WHITE  = '#f1f5f9'
const MUTED  = '#94a3b8'
const MUTED2 = '#64748b'
const BLUE   = '#38bdf8'
const GREEN  = '#34d399'
const RED    = '#f87171'

function makeDoc(title) {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 60, bottom: 60, left: 60, right: 60 }, info: { Title: title } })

  // Apply navy background + gold bar to EVERY page, including overflow pages
  function applyPageBg() {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY)
    doc.rect(0, 0, doc.page.width, 6).fill(GOLD)
  }
  doc.on('pageAdded', applyPageBg)
  applyPageBg()

  return doc
}

// Ensure there's at least `needed` pts of vertical space before continuing;
// if not, add a new page (background handled by pageAdded listener).
function ensureSpace(doc, needed = 140) {
  if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
    doc.addPage()
  }
}

function header(doc, title, subtitle) {
  // Gold bar at top
  doc.rect(0, 0, doc.page.width, 6).fill(GOLD)

  // Brand line
  doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text('ACE CAPITAL', 60, 22, { continued: true })
  doc.font('Helvetica').fillColor(MUTED2).text('  ·  Internal Use Only')

  // Title
  doc.moveDown(1.5)
  doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE).text(title, { lineGap: 4 })
  if (subtitle) {
    doc.font('Helvetica').fontSize(12).fillColor(MUTED).text(subtitle, { lineGap: 2 })
  }

  // Divider
  doc.moveDown(0.8)
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor(GOLD).lineWidth(1).stroke()
  doc.moveDown(1)
}

function sectionTitle(doc, text, spaceNeeded = 140) {
  ensureSpace(doc, spaceNeeded)
  doc.moveDown(0.6)
  doc.font('Helvetica-Bold').fontSize(13).fillColor(GOLD2).text(text.toUpperCase(), { characterSpacing: 0.5 })
  doc.moveDown(0.3)
}

function bodyText(doc, text) {
  doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(text, { lineGap: 3 })
}

function footer(doc, text) {
  const y = doc.page.height - 45
  doc.moveTo(60, y).lineTo(doc.page.width - 60, y).strokeColor(MUTED2).lineWidth(0.5).stroke()
  doc.font('Helvetica').fontSize(8).fillColor(MUTED2).text(text, 60, y + 8, { align: 'center', width: doc.page.width - 120 })
}

// ─── 1. Company Bio ────────────────────────────────────────────────────────────

function generateCompanyBio() {
  const doc = makeDoc('ACE Capital — Company Overview')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'company-bio.pdf'))
  doc.pipe(out)

  header(doc, 'ACE Capital', 'Behavioral Health Portfolio · Company Overview & History')

  // Origin story
  sectionTitle(doc, 'The Origin Story')
  bodyText(doc, 'Mark Hanna spent 14 years on Wall Street — enough time to accumulate a Hamptons timeshare, three Bloomberg terminals, and a front-row seat to the drug and alcohol crisis quietly hollowing out the finance industry from the inside. He watched colleagues disappear to "extended sabbaticals." He sat through HR presentations about "wellness resources" that no one used. He watched brilliant people — people who could price a derivative in their sleep — completely fall apart.')
  doc.moveDown(0.5)
  bodyText(doc, 'In 2008, after watching his third colleague in a single quarter vanish to what was described as "a long vacation in an undisclosed location," Hanna had what he later called "an epiphany, or possibly a panic attack — the Bloomberg terminal makes them hard to distinguish." He left Wall Street, founded ACE Capital, and pointed his deal-making machinery at the one industry he knew needed both more money and more business sense: behavioral health.')
  doc.moveDown(0.5)
  bodyText(doc, 'His thesis was simple: the D&A rehabilitation industry was full of distressed facilities doing genuinely important work with genuinely terrible unit economics. Most were running on goodwill, chaos, and Medicare reimbursements. Hanna could fix the economics. The goodwill, he figured, would take care of itself.')

  // Investment thesis
  sectionTitle(doc, 'Investment Thesis')
  bodyText(doc, '"We buy distressed rehab centers. For the returns. And also feelings."')
  doc.moveDown(0.4)
  bodyText(doc, 'ACE Capital targets operationally underperforming drug and alcohol rehabilitation facilities across the southeastern United States. Most targets share a familiar profile: solid mission, dedicated staff, and a back-office that appears to be running on Post-it notes and optimism. ACE acquires these facilities, applies Wall Street-grade business discipline, and scales what works across the portfolio.')
  doc.moveDown(0.4)
  bodyText(doc, 'The edge is not a secret: most rehab operators are clinicians first and businesspeople never. ACE brings economies of scale, centralized back-office functions, group purchasing power, and the kind of financial rigor that comes from spending 14 years structuring instruments that no one fully understood. Hold period is 3-5 years. Exit is via strategic sale, or, as Hanna puts it, "when the MOIC looks good enough to mention at the alumni dinner."')

  // Portfolio stats
  sectionTitle(doc, 'Portfolio at a Glance')

  const stats = [
    ['Founder',                'Mark Hanna'],
    ['Founded',                '2008 (worst year to start anything; turned out fine)'],
    ['Portfolio Facilities',   '50 rehabilitation centers'],
    ['Region',                 'Southeastern United States'],
    ['Focus',                  'Drug & Alcohol Treatment'],
    ['Assets Under Management','~$2.1 Billion'],
    ['Headquarters',           'Nashville, TN'],
  ]
  const colX = [60, 270]
  stats.forEach(([label, val]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(label, colX[0], y, { width: 200 })
    doc.font('Helvetica').fontSize(9).fillColor(WHITE).text(val, colX[1], y, { width: 280 })
    doc.moveDown(0.55)
  })

  // Value creation strategy
  sectionTitle(doc, 'Value Creation Strategy')
  bodyText(doc, 'ACE Capital operates across four pillars — the first three are classic PE playbook; the fourth is where it gets interesting:')
  doc.moveDown(0.4)

  const pillars = [
    ['1. Acquire Distressed',   'Target facilities where the business model is "strong mission, zero financial infrastructure." Buy at a discount that reflects the mess, not the potential.'],
    ['2. Stabilize Operations', 'Install basic business hygiene: real budgeting, occupancy management, billing optimization, staffing ratios that make sense. Revolutionary stuff, by industry standards.'],
    ['3. Scale Efficiencies',   'Centralize back-office functions, negotiate group purchasing across 50 facilities, implement standardized playbooks. Force multiply the things that work.'],
    ['4. Predict & Prevent',    'Use data to catch underperformers before they become crises. This pillar is the newest, the most sophisticated, and the reason Micheal Muench was hired.'],
  ]
  pillars.forEach(([step, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GOLD2).text(step, 60, y, { width: 140 })
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, 205, y, { width: 345, lineGap: 2 })
    doc.moveDown(0.65)
  })

  // ── Page 2: Leadership ────────────────────────────────────────────────────────
  doc.addPage()

  sectionTitle(doc, 'Leadership')

  const team = [
    {
      name:  'Mark Hanna',
      title: 'Founder & Managing Partner',
      bio:   'After 14 years structuring CDOs and watching the human cost of what Wall Street does to people, Hanna decided to redirect his capabilities toward something with better karma and, if he was being honest, still pretty good returns. He has since built ACE Capital into a 50-facility, $2.1B AUM platform. He still owns one of the Bloomberg terminals. He says it is sentimental. His investment committee decks always end with a slide that reads: "And also, we are helping people." No one has ever questioned this slide.',
    },
    {
      name:  'Micheal Muench',
      title: 'Partner, Business Analytics & Portfolio Intelligence',
      bio:   'Muench joined ACE as a recently hired Partner, bringing a background in business analytics and, crucially, additional capital. While most new partners arrive with opinions, Muench arrived with opinions and a plan. Within his first year, he designed and built ACE Capital\'s Portfolio Intelligence Initiative — a full-stack data and machine learning platform that consolidates disparate operational data across all 50 facilities, applies predictive analytics, and surfaces at-risk facilities before underperformance becomes a crisis. The initiative spans XGBoost classification models, an interactive analytics dashboard, a facility directory, and the internal portal currently hosting this document. His working philosophy: "If you cannot model it, you do not understand it. If you can model it, you still might not understand it, but at least you have a chart."',
    },
    {
      name:  'Portia Folio',
      title: 'Chief Operating Officer',
      bio:   'Folio oversees operational execution across the portfolio, which she describes as "herding extremely well-meaning cats, 50 at a time." She has implemented 17 value creation initiatives across the portfolio, 14 of which have been declared successes, and 3 of which are pending a mutually agreed-upon definition of success.',
    },
    {
      name:  'Biff Returns',
      title: 'Chief Financial Officer',
      bio:   'Returns joined ACE after a decade at a bulge-bracket bank where he earned the nickname "The Denominator" for his creative approach to per-unit economics. He has never met a margin he could not compress. He has a spreadsheet for his feelings. It is color-coded. The conditional formatting alone took three days.',
    },
    {
      name:  'Compliance Colin',
      title: 'General Counsel',
      bio:   'Colin joined ACE after a previous employer suggested he might be "a little too thorough." He has since found his people. He is currently on page 912 of the Employee Handbook and considers it a solid first draft.',
    },
  ]

  team.forEach(person => {
    ensureSpace(doc, 110)
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE).text(person.name)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(person.title)
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(person.bio, { lineGap: 2 })
    doc.moveDown(0.2)
  })

  // ── Page 3: Portfolio Intelligence Initiative ─────────────────────────────────
  doc.addPage()

  sectionTitle(doc, 'The Portfolio Intelligence Initiative')
  bodyText(doc, 'Designed and implemented by Partner Micheal Muench. This is ACE Capital\'s competitive edge in the next phase of portfolio management.')
  doc.moveDown(0.6)

  sectionTitle(doc, 'The Problem')
  bodyText(doc, 'Fifty facilities. Forty-eight months of operational history. Data spread across billing systems, EHR platforms, spreadsheets of varying quality, and at least one facility that was still tracking occupancy in a physical binder as recently as 2022.')
  doc.moveDown(0.4)
  bodyText(doc, 'ACE had the data. What it lacked was a unified view — any ability to identify which facilities were trending toward underperformance before they got there, and any systematic way to prioritize operational interventions across the portfolio. The result was a reactive posture: problems were identified when they showed up in the monthly financials, by which point the damage was already done.')

  sectionTitle(doc, 'The Solution')
  bodyText(doc, 'Muench designed and built a full-stack portfolio intelligence platform from the ground up. The initiative has three layers:')
  doc.moveDown(0.4)

  const layers = [
    ['Data Infrastructure', 'A unified PostgreSQL data model consolidating operational metrics, financial performance, facility profiles, and M&A deal data across all 50 facilities. 2,400+ facility-month observations. Integrated with Supabase for real-time access.'],
    ['Predictive ML Engine', 'An XGBoost classification model trained to predict facility-level EBITDA underperformance (defined as EBITDA < 90% of budget) one month in advance. AUC-ROC of 0.912. Evaluated against five competing algorithms; XGBoost selected for superior discrimination and class-imbalance handling. Full model selection rationale documented separately.'],
    ['Analytics Dashboard & Portal', 'An interactive internal portal — built in React — featuring a real-time analytics dashboard with KPI tracking, an ML risk ranking table, a facility directory with geographic mapping, a reports builder, and this document library. All accessible from a single internal command center.'],
  ]
  layers.forEach(([name, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GREEN).text(name, 60, y, { width: 150 })
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, 215, y, { width: 335, lineGap: 2 })
    doc.moveDown(0.7)
  })

  sectionTitle(doc, 'The Outcome')
  bodyText(doc, 'ACE Capital can now identify facilities at risk of underperformance before they miss their EBITDA targets — giving the operations team a lead time that did not previously exist. Risk scores are generated monthly for all 50 facilities. High-risk flags trigger early operational review. The model\'s recall of 79.8% means that roughly 4 in 5 underperformance events are caught in advance.')
  doc.moveDown(0.4)
  bodyText(doc, 'This is the difference between finding out a facility is in trouble when the monthly P&L lands, and finding out six weeks earlier when something can still be done about it.')
  doc.moveDown(0.4)
  bodyText(doc, 'It is, as Hanna put it at the last LP meeting, "the first time anyone has used machine learning to make me feel better about this business." He then added the slide to his investment committee deck. It was not questioned.')

  footer(doc, 'ACE Capital · Confidential & Proprietary · Internal Use Only · Past vibes are not indicative of future returns.')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 2. ML Model Comparison ────────────────────────────────────────────────────

function generateMLComparison() {
  const doc = makeDoc('ML Model Selection & Comparison')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'ml-model-comparison.pdf'))
  doc.pipe(out)

  header(doc, 'ML Model Selection & Comparison', 'Facility Underperformance Prediction · ACE Capital Behavioral Health Portfolio')

  // Executive summary
  sectionTitle(doc, 'Executive Summary')
  bodyText(doc, 'This report documents the evaluation and selection of machine learning models for predicting facility-level EBITDA underperformance (defined as EBITDA < 90% of budget). Five classification algorithms were trained and evaluated on 48 months of historical data across 50 portfolio facilities (n = 2,400 facility-month observations). XGBoost was selected as the production model based on superior AUC-ROC and F1 performance.')

  // Objective
  sectionTitle(doc, 'Objective')
  bodyText(doc, 'Binary classification task: predict whether a facility will underperform its EBITDA budget in the following month. Positive class = underperformance event (EBITDA < 90% of budget). Class imbalance: ~28% positive rate across the dataset.')

  // Features
  sectionTitle(doc, 'Feature Set (Top Predictors)')
  const features = [
    'Occupancy rate (trailing 3-month average)',
    'EBITDA margin deviation from prior period',
    'Claims denial rate (rolling 60-day)',
    'Staff turnover rate (annualized)',
    'Length of stay (average, trailing quarter)',
    'Days cash on hand',
    'Revenue per patient day vs. regional benchmark',
  ]
  features.forEach(f => {
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(`• ${f}`, { lineGap: 2 })
  })

  // Metrics table
  sectionTitle(doc, 'Model Evaluation Results')
  bodyText(doc, 'All models evaluated using 5-fold stratified cross-validation. Metrics reported as mean across folds.')
  doc.moveDown(0.6)

  // Table header
  const cols    = [60, 175, 255, 320, 385, 450, 510]
  const headers = ['Model', 'Accuracy', 'AUC-ROC', 'Precision', 'Recall', 'F1']
  const rowH    = 22
  let ty        = doc.y

  // Header row background
  doc.rect(55, ty - 4, doc.page.width - 110, rowH).fill('#0d1e38')
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GOLD2)
      .text(h, cols[i], ty, { width: cols[i + 1] ? cols[i + 1] - cols[i] - 5 : 60, align: i === 0 ? 'left' : 'center' })
  })
  ty += rowH

  const rows = [
    { model: 'Logistic Regression', acc: '0.741', auc: '0.803', prec: '0.680', rec: '0.620', f1: '0.649', winner: false },
    { model: 'Decision Tree',        acc: '0.712', auc: '0.761', prec: '0.630', rec: '0.710', f1: '0.668', winner: false },
    { model: 'Random Forest',        acc: '0.798', auc: '0.871', prec: '0.740', rec: '0.730', f1: '0.735', winner: false },
    { model: 'Gradient Boosting',    acc: '0.811', auc: '0.884', prec: '0.760', rec: '0.750', f1: '0.755', winner: false },
    { model: 'XGBoost ★',           acc: '0.834', auc: '0.912', prec: '0.790', rec: '0.780', f1: '0.785', winner: true  },
  ]

  rows.forEach((row, idx) => {
    const bg = row.winner ? 'rgba(201,151,58,0.08)' : (idx % 2 === 0 ? '#0b1424' : '#0d1e38')
    doc.rect(55, ty - 4, doc.page.width - 110, rowH).fill(row.winner ? '#1a2a10' : (idx % 2 === 0 ? '#0f1e35' : '#0b1830'))

    const vals = [row.model, row.acc, row.auc, row.prec, row.rec, row.f1]
    vals.forEach((v, i) => {
      const color = row.winner ? (i === 0 ? GREEN : WHITE) : (i === 0 ? WHITE : MUTED)
      const bold  = row.winner || i === 0
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(color)
        .text(v, cols[i], ty, { width: cols[i + 1] ? cols[i + 1] - cols[i] - 5 : 60, align: i === 0 ? 'left' : 'center' })
    })
    ty += rowH
  })

  doc.y = ty + 10

  // Selection rationale
  sectionTitle(doc, 'Selection Rationale: XGBoost')

  const reasons = [
    ['Highest AUC-ROC (0.912)', 'AUC measures discriminative ability across all classification thresholds. At 0.912, XGBoost significantly outperforms alternatives, indicating strong separation between underperforming and healthy facilities.'],
    ['Highest F1 Score (0.785)', 'F1 balances precision and recall — critical for this use case where both false positives (unnecessary interventions) and false negatives (missed underperformers) carry real costs.'],
    ['Native Imbalance Handling', 'XGBoost\'s scale_pos_weight parameter directly addresses the 28% positive class rate without requiring external resampling (SMOTE, etc.), reducing pipeline complexity.'],
    ['Feature Importance Stability', 'XGBoost feature importances were consistent across cross-validation folds (coefficient of variation < 12%), indicating a stable model that generalizes well across facility cohorts.'],
    ['Regulatory Auditability', 'Gradient boosted trees provide interpretable feature contributions (SHAP values) that satisfy investment committee requirements for explainability in capital allocation decisions.'],
  ]

  reasons.forEach(([title, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GREEN).text(`✓ ${title}`, 60, y)
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, 70, doc.y, { lineGap: 2, width: 490 })
    doc.moveDown(0.5)
  })

  // Feature importance
  doc.addPage()

  sectionTitle(doc, 'XGBoost: Top Feature Importances')
  bodyText(doc, 'Feature importance measured by mean SHAP value magnitude across the test fold. Higher = greater influence on model output.')
  doc.moveDown(0.8)

  const importances = [
    { feature: 'Occupancy Rate (3-mo avg)',         score: 0.312, bar: 0.312 },
    { feature: 'EBITDA Margin Deviation',           score: 0.271, bar: 0.271 },
    { feature: 'Claims Denial Rate (60-day)',        score: 0.198, bar: 0.198 },
    { feature: 'Staff Turnover Rate (annualized)',   score: 0.143, bar: 0.143 },
    { feature: 'Revenue/Patient Day vs. Benchmark', score: 0.076, bar: 0.076 },
  ]

  const barMaxW = 300
  const barMaxScore = 0.35

  importances.forEach((item, i) => {
    const y  = doc.y
    const bw = Math.round((item.bar / barMaxScore) * barMaxW)

    // Label
    doc.font('Helvetica').fontSize(9.5).fillColor(WHITE).text(`${i + 1}. ${item.feature}`, 60, y, { width: 290 })
    // Bar background
    doc.rect(360, y + 2, barMaxW, 12).fill('#0d1e38')
    // Bar fill
    doc.rect(360, y + 2, bw, 12).fill(GOLD)
    // Score
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(item.score.toFixed(3), 360 + barMaxW + 8, y + 2)
    doc.moveDown(1.1)
  })

  // Confusion matrix summary
  sectionTitle(doc, 'Confusion Matrix Summary (XGBoost, Test Set)')

  const cmRows = [
    ['',                    'Predicted: Healthy', 'Predicted: Underperform'],
    ['Actual: Healthy',     '1,218 (TN)',          '156 (FP)'],
    ['Actual: Underperform','126 (FN)',             '500 (TP)'],
  ]

  const cmCols = [60, 230, 390]
  let cmy = doc.y + 6

  cmRows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0 || ci === 0
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(isHeader ? GOLD2 : (cell.includes('TN') || cell.includes('TP') ? GREEN : RED))
        .text(cell, cmCols[ci], cmy, { width: ci === 0 ? 160 : 155, align: ci === 0 ? 'left' : 'center' })
    })
    cmy += 20
  })

  doc.y = cmy + 10

  // Conclusion
  sectionTitle(doc, 'Conclusion')
  bodyText(doc, 'XGBoost was selected as the production model for the ACE Capital facility underperformance prediction system. It achieves 0.912 AUC-ROC, 0.785 F1, and 83.4% accuracy on held-out test data, outperforming all evaluated alternatives across all primary metrics. The model is deployed via the ACE Capital Analytics Dashboard and generates monthly risk scores for all 50 portfolio facilities.')

  footer(doc, 'ACE Capital · ML Model Selection Report · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 3. ML Model Performance (stub for existing entry) ────────────────────────

function generateMLPerformance() {
  const doc = makeDoc('ML Model Performance Report')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'ml-model-performance.pdf'))
  doc.pipe(out)

  header(doc, 'ML Model Performance Report', 'XGBoost · Facility Underperformance Prediction · ACE Capital')

  sectionTitle(doc, 'Model Overview')
  bodyText(doc, 'This report presents the performance metrics, confusion matrix, and feature importance analysis for the production XGBoost model used to predict facility-level EBITDA underperformance within the ACE Capital behavioral health portfolio.')

  sectionTitle(doc, 'Performance Metrics')

  const metrics = [
    ['Accuracy',          '83.4%',  'Fraction of correct predictions overall'],
    ['AUC-ROC',           '0.912',  'Discriminative ability across all thresholds'],
    ['Precision',         '76.2%',  'Of flagged facilities, % that truly underperformed'],
    ['Recall',            '79.8%',  'Of underperforming facilities, % correctly flagged'],
    ['F1 Score',          '0.785',  'Harmonic mean of precision and recall'],
    ['Log Loss',          '0.341',  'Calibration quality of probability estimates'],
    ['Brier Score',       '0.142',  'Mean squared error of probability outputs'],
  ]

  const mCols = [60, 155, 225]
  metrics.forEach(([name, val, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(WHITE).text(name, mCols[0], y, { width: 90 })
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GREEN).text(val, mCols[1], y, { width: 65 })
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, mCols[2], y, { width: 350, lineGap: 2 })
    doc.moveDown(0.6)
  })

  sectionTitle(doc, 'Model Configuration')
  const config = [
    ['Algorithm',          'XGBoost (Extreme Gradient Boosting)'],
    ['n_estimators',       '300'],
    ['max_depth',          '6'],
    ['learning_rate',      '0.05'],
    ['subsample',          '0.8'],
    ['colsample_bytree',   '0.8'],
    ['scale_pos_weight',   '2.57 (adjusted for 28% positive class rate)'],
    ['Validation Strategy','5-fold stratified cross-validation'],
    ['Training data',      '48 months × 50 facilities = 2,400 observations'],
  ]
  config.forEach(([k, v]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(k, 60, y, { width: 160 })
    doc.font('Helvetica').fontSize(9).fillColor(WHITE).text(v, 225, y, { width: 390, lineGap: 2 })
    doc.moveDown(0.5)
  })

  sectionTitle(doc, 'Feature Importance (SHAP Values)')
  const shap = [
    ['Occupancy Rate (3-mo avg)',          '0.312'],
    ['EBITDA Margin Deviation',            '0.271'],
    ['Claims Denial Rate (60-day)',         '0.198'],
    ['Staff Turnover Rate (annualized)',    '0.143'],
    ['Revenue/Patient Day vs. Benchmark',  '0.076'],
  ]
  shap.forEach(([f, s]) => {
    const y = doc.y
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(`• ${f}`, 60, y, { continued: true, width: 340 })
    doc.font('Helvetica-Bold').fillColor(GOLD2).text(`  ${s}`)
    doc.moveDown(0.3)
  })

  footer(doc, 'ACE Capital · ML Model Performance Report · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 4. Data Dictionary ────────────────────────────────────────────────────────

function generateDataDictionary() {
  const doc = makeDoc('ACE Capital — Database Data Dictionary')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'data-dictionary.pdf'))
  doc.pipe(out)

  header(doc, 'Database Data Dictionary', 'ACE Capital Behavioral Health Portfolio · All Tables & Variables')

  // Intro
  bodyText(doc, 'This document describes every table and column in the ACE Capital portfolio database. The schema consists of 6 tables covering facility identity, operational profiles, M&A deal data, monthly financial and clinical metrics, management personnel, and value creation initiatives. The database contains approximately 2,400 monthly metric observations across 50 facilities over 48 months.')
  doc.moveDown(0.4)
  bodyText(doc, 'ML target variables are highlighted in green. Foreign keys are noted where applicable.')

  // ── Helper to render a column row ──────────────────────────────────────────
  function colRow(doc, name, type, description, isTarget = false) {
    ensureSpace(doc, 36)
    const y = doc.y
    // Name
    doc.font('Helvetica-Bold').fontSize(9).fillColor(isTarget ? GREEN : GOLD2)
      .text(name, 60, y, { width: 155 })
    // Type
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED2)
      .text(type, 220, y, { width: 90 })
    // Description (may wrap)
    doc.font('Helvetica').fontSize(9).fillColor(isTarget ? GREEN : MUTED)
      .text(description, 315, y, { width: 250, lineGap: 1 })
    // Move below the tallest of the three columns
    const descH = doc.heightOfString(description, { width: 250, lineGap: 1 })
    doc.y = y + Math.max(14, descH) + 4
  }

  // ── Helper for column group label ─────────────────────────────────────────
  function groupLabel(doc, text) {
    ensureSpace(doc, 40)
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED2)
      .text(text.toUpperCase(), 60, doc.y, { characterSpacing: 0.5 })
    doc.moveDown(0.2)
  }

  // ── Column header row ─────────────────────────────────────────────────────
  function colHeader(doc) {
    doc.moveDown(0.4)
    const y = doc.y
    doc.rect(55, y - 2, doc.page.width - 110, 16).fill('#0d1e38')
    doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD2)
      .text('COLUMN', 60, y, { width: 155 })
      .text('TYPE', 220, y, { width: 90 })
      .text('DESCRIPTION', 315, y, { width: 250 })
    doc.y = y + 18
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 1: portfolio_facilities
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '1. portfolio_facilities', 180)
  bodyText(doc, 'Master list of all 50 rehabilitation centers in the ACE Capital portfolio. Every other table references this table via facility_id. One row per facility.')
  colHeader(doc)
  colRow(doc, 'facility_id', 'SERIAL / PK', 'Auto-incrementing primary key. Unique integer identifier for each facility across all tables.')
  colRow(doc, 'facility_name', 'VARCHAR(150)', 'Full legal name of the facility.')
  colRow(doc, 'city', 'VARCHAR(100)', 'City where the facility is located.')
  colRow(doc, 'state', 'CHAR(2)', 'Two-letter state code. All facilities are in southeastern US states.')
  colRow(doc, 'region', 'VARCHAR(50)', 'Geographic region. Defaults to "Southeast".')
  colRow(doc, 'facility_type', 'VARCHAR(50)', 'Treatment modality: Residential, IOP (Intensive Outpatient), PHP (Partial Hospitalization), Detox, Dual Diagnosis, or Sober Living.')
  colRow(doc, 'bed_capacity', 'INTEGER', 'Total licensed bed count. Must be > 0. Used as denominator for occupancy_rate calculations.')
  colRow(doc, 'license_number', 'VARCHAR(50)', 'State regulatory license number. Nullable.')
  colRow(doc, 'status', 'VARCHAR(20)', 'Current portfolio status: Active, Inactive, or Sold. Defaults to Active.')
  colRow(doc, 'acquisition_date', 'DATE', 'Date ACE Capital completed acquisition of the facility.')
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp. Defaults to current time.')

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 2: facility_profiles
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '2. facility_profiles', 180)
  bodyText(doc, '1:1 child of portfolio_facilities. Stores operational details, contact information, accreditation status, and annual EBITDA budget targets. One row per facility.')
  colHeader(doc)
  colRow(doc, 'profile_id', 'SERIAL / PK', 'Auto-incrementing primary key.')
  colRow(doc, 'facility_id', 'INTEGER / FK', 'Foreign key to portfolio_facilities. Unique constraint enforces the 1:1 relationship.')
  colRow(doc, 'address', 'VARCHAR(200)', 'Street address of the facility.')
  colRow(doc, 'zip_code', 'CHAR(5)', '5-digit US postal code.')
  colRow(doc, 'phone', 'VARCHAR(25)', 'Primary facility phone number.')
  colRow(doc, 'email', 'VARCHAR(120)', 'Primary facility contact email.')
  colRow(doc, 'medical_director', 'VARCHAR(120)', 'Name and credentials of the facility\'s medical director (e.g., "Dr. Jane Smith, MD").')
  colRow(doc, 'facility_size_sqft', 'INTEGER', 'Total physical footprint of the facility in square feet.')
  colRow(doc, 'accreditation', 'VARCHAR(100)', 'Accrediting body or bodies. Common values: CARF, Joint Commission, BHQR.')
  colRow(doc, 'services_offered', 'TEXT', 'Comma-separated list of clinical programs and services offered at the facility.')
  colRow(doc, 'year_established', 'INTEGER', 'Year the facility was originally founded (pre-acquisition).')
  colRow(doc, 'ebitda_budget_annual', 'NUMERIC(14,2)', 'Annual EBITDA target in dollars. Divided by 12 to compute monthly budget used in underperformance_flag logic.', true)
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp.')

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 3: deals
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '3. deals', 180)
  bodyText(doc, '1:1 child of portfolio_facilities. Captures M&A transaction data for each facility acquisition. Contains high_return_flag, the ML classification target for deal performance. One row per facility.')
  colHeader(doc)
  colRow(doc, 'deal_id', 'SERIAL / PK', 'Auto-incrementing primary key.')
  colRow(doc, 'facility_id', 'INTEGER / FK', 'Foreign key to portfolio_facilities. Unique constraint enforces 1:1 relationship.')
  colRow(doc, 'deal_name', 'VARCHAR(200)', 'Internal deal name or codename used during the acquisition process.')
  colRow(doc, 'deal_type', 'VARCHAR(50)', 'Acquisition type: Platform (first facility in a market), Add-On (bolt-on to existing platform), or Recap (recapitalization).')
  colRow(doc, 'acquisition_date', 'DATE', 'Date the transaction closed.')
  colRow(doc, 'entry_enterprise_value', 'NUMERIC(16,2)', 'Total enterprise value paid at acquisition in dollars.')
  colRow(doc, 'entry_ebitda', 'NUMERIC(14,2)', 'Last-twelve-months (LTM) EBITDA at time of acquisition. Used to compute entry multiple.')
  colRow(doc, 'entry_multiple', 'NUMERIC(6,2)', 'Purchase price multiple: Entry Enterprise Value divided by Entry EBITDA.')
  colRow(doc, 'equity_invested', 'NUMERIC(14,2)', 'Dollar amount of equity contributed by ACE Capital.')
  colRow(doc, 'debt_financing', 'NUMERIC(14,2)', 'Dollar amount of debt used to fund the acquisition.')
  colRow(doc, 'projected_moic', 'NUMERIC(6,2)', 'Underwriting Multiple on Invested Capital (MOIC) target at time of acquisition.')
  colRow(doc, 'actual_moic', 'NUMERIC(6,2)', 'Realized MOIC at exit. NULL if the facility is still in the active portfolio.')
  colRow(doc, 'exit_date', 'DATE', 'Date the facility was sold or exited. NULL if still active.')
  colRow(doc, 'exit_enterprise_value', 'NUMERIC(16,2)', 'Enterprise value realized at exit. NULL if still active.')
  colRow(doc, 'deal_status', 'VARCHAR(20)', 'Current deal state: Active (still in portfolio) or Exited.')
  colRow(doc, 'high_return_flag', 'SMALLINT', 'ML TARGET: Set to 1 when actual_moic >= 2.5, indicating a high-return deal. Used as classification target for deal performance prediction.', true)
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp.')

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 4: monthly_facility_metrics
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '4. monthly_facility_metrics', 180)
  bodyText(doc, '1:many child of portfolio_facilities. Core operational, clinical, staffing, and financial data. 48 months × 50 facilities = 2,400 rows. underperformance_flag is the primary ML classification target used in the production XGBoost model.')
  colHeader(doc)

  groupLabel(doc, 'Identifiers & Period')
  colRow(doc, 'metric_id', 'SERIAL / PK', 'Auto-incrementing primary key.')
  colRow(doc, 'facility_id', 'INTEGER / FK', 'Foreign key to portfolio_facilities.')
  colRow(doc, 'metric_year', 'INTEGER', 'Calendar year of the reporting period (e.g., 2021).')
  colRow(doc, 'metric_month', 'INTEGER', 'Month number 1–12 of the reporting period.')
  colRow(doc, 'metric_date', 'DATE', 'First calendar day of the reporting month. Used for time-series ordering and date-range queries.')

  groupLabel(doc, 'Census & Occupancy')
  colRow(doc, 'bed_capacity', 'INTEGER', 'Licensed bed count for that specific month. May differ from facility-level capacity if beds are temporarily offline.')
  colRow(doc, 'avg_daily_census', 'NUMERIC(7,1)', 'Average number of patients in treatment per day during the month.')
  colRow(doc, 'occupancy_rate', 'NUMERIC(6,4)', 'Computed as avg_daily_census / bed_capacity. Key driver of revenue and the top ML feature by SHAP value.')

  groupLabel(doc, 'Admissions & Discharges')
  colRow(doc, 'total_admissions', 'INTEGER', 'Number of new patients entering treatment during the month.')
  colRow(doc, 'total_discharges', 'INTEGER', 'Number of patients completing or leaving treatment during the month.')
  colRow(doc, 'avg_length_of_stay', 'NUMERIC(6,1)', 'Average number of days per episode of care across all discharges in the month.')

  groupLabel(doc, 'Clinical Outcomes')
  colRow(doc, 'treatment_completion_rate', 'NUMERIC(6,4)', 'Proportion of discharged patients who completed their planned treatment program. Higher rates correlate with better clinical outcomes and payer contract compliance.')
  colRow(doc, 'readmission_rate', 'NUMERIC(6,4)', 'Proportion of patients readmitted within 30 days of discharge. High rates may indicate insufficient aftercare or case complexity.')

  groupLabel(doc, 'Referral Pipeline')
  colRow(doc, 'total_referrals', 'INTEGER', 'Total inbound referrals received during the month from all sources (physicians, insurance, self-referral).')
  colRow(doc, 'converted_referrals', 'INTEGER', 'Number of referrals that converted to an admission.')
  colRow(doc, 'referral_conversion_rate', 'NUMERIC(6,4)', 'Computed as converted_referrals / total_referrals. Strong predictor of upcoming occupancy trends.')

  groupLabel(doc, 'Payer Mix')
  colRow(doc, 'payer_commercial', 'NUMERIC(6,4)', 'Proportion of patients covered by commercial (private) insurance. Higher commercial mix typically yields higher net revenue per patient day.')
  colRow(doc, 'payer_medicaid', 'NUMERIC(6,4)', 'Proportion of patients covered by Medicaid.')
  colRow(doc, 'payer_medicare', 'NUMERIC(6,4)', 'Proportion of patients covered by Medicare.')
  colRow(doc, 'payer_self_pay', 'NUMERIC(6,4)', 'Proportion of patients paying out-of-pocket or uninsured.')

  groupLabel(doc, 'Staffing')
  colRow(doc, 'total_staff_count', 'INTEGER', 'Total headcount across all departments at month end.')
  colRow(doc, 'clinical_staff_count', 'INTEGER', 'Headcount of clinicians, therapists, counselors, and nurses.')
  colRow(doc, 'staff_turnover_rate', 'NUMERIC(6,4)', 'Annualized monthly staff turnover rate. High turnover reduces treatment completion rates and is a key causal ML feature.')

  groupLabel(doc, 'Revenue Cycle & Financials')
  colRow(doc, 'gross_revenue', 'NUMERIC(14,2)', 'Total billed charges before insurance adjustments, denials, or write-offs.')
  colRow(doc, 'net_revenue', 'NUMERIC(14,2)', 'Revenue actually collected after denials and contractual adjustments. Used as the revenue basis for EBITDA.')
  colRow(doc, 'total_expenses', 'NUMERIC(14,2)', 'Total operating expenses for the month including labor, facilities, and administrative costs.')
  colRow(doc, 'ebitda', 'NUMERIC(14,2)', 'Earnings Before Interest, Taxes, Depreciation & Amortization. Computed as net_revenue minus total_expenses.')
  colRow(doc, 'ebitda_margin', 'NUMERIC(6,4)', 'EBITDA as a proportion of net_revenue. Primary profitability KPI tracked at the portfolio level.')
  colRow(doc, 'ebitda_budget_monthly', 'NUMERIC(14,2)', 'Monthly EBITDA target derived from facility_profiles.ebitda_budget_annual / 12. Denominator for underperformance_flag.', true)

  groupLabel(doc, 'Claims & Collections')
  colRow(doc, 'claims_submitted', 'INTEGER', 'Total insurance claims filed during the month.')
  colRow(doc, 'claims_denied', 'INTEGER', 'Number of claims rejected by payers. High denial volumes indicate revenue cycle or documentation problems.')
  colRow(doc, 'claims_denied_rate', 'NUMERIC(6,4)', 'Computed as claims_denied / claims_submitted. Elevated rates are a leading indicator of financial stress.')
  colRow(doc, 'collections_rate', 'NUMERIC(6,4)', 'Net revenue collected as a proportion of gross billed. Reflects overall revenue cycle efficiency.')
  colRow(doc, 'ar_days', 'NUMERIC(6,1)', 'Average days outstanding in accounts receivable. Lower is better; high AR days indicate cash flow pressure.')

  groupLabel(doc, 'ML Target Variable')
  colRow(doc, 'underperformance_flag', 'SMALLINT', 'PRIMARY ML TARGET: Set to 1 when ebitda < 90% of ebitda_budget_monthly for that period. Positive class rate is approximately 28% across the dataset. This is the variable the production XGBoost model is trained to predict.', true)
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp.')

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 5: management_team
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '5. management_team', 180)
  bodyText(doc, '1:many child of portfolio_facilities. Key executives and clinical leaders at each facility. Typically 3–6 records per facility.')
  colHeader(doc)
  colRow(doc, 'member_id', 'SERIAL / PK', 'Auto-incrementing primary key.')
  colRow(doc, 'facility_id', 'INTEGER / FK', 'Foreign key to portfolio_facilities.')
  colRow(doc, 'full_name', 'VARCHAR(120)', 'Full name of the team member.')
  colRow(doc, 'title', 'VARCHAR(120)', 'Job title (e.g., CEO, CFO, Medical Director, Clinical Director).')
  colRow(doc, 'department', 'VARCHAR(60)', 'Functional department: Clinical, Finance, Operations, or Medical.')
  colRow(doc, 'hire_date', 'DATE', 'Date this person joined the facility.')
  colRow(doc, 'tenure_years', 'NUMERIC(5,1)', 'Years of service at this facility. Derived from hire_date but stored for query convenience.')
  colRow(doc, 'education', 'VARCHAR(150)', 'Highest academic degree(s) and field of study.')
  colRow(doc, 'prior_company', 'VARCHAR(150)', 'Most recent employer before joining this facility.')
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp.')

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLE 6: value_creation_initiatives
  // ═══════════════════════════════════════════════════════════════════════════
  sectionTitle(doc, '6. value_creation_initiatives', 180)
  bodyText(doc, '1:many child of portfolio_facilities. Strategic improvement projects tracked at the facility level and surfaced on the Operations Board. Typically 3–7 initiatives per facility.')
  colHeader(doc)
  colRow(doc, 'initiative_id', 'SERIAL / PK', 'Auto-incrementing primary key.')
  colRow(doc, 'facility_id', 'INTEGER / FK', 'Foreign key to portfolio_facilities.')
  colRow(doc, 'initiative_name', 'VARCHAR(200)', 'Short descriptive name of the improvement project.')
  colRow(doc, 'category', 'VARCHAR(60)', 'Workstream classification: Revenue, Operational, Clinical, Staffing, or Technology.')
  colRow(doc, 'status', 'VARCHAR(30)', 'Current state: Planning, In Progress, Completed, or On Hold. Defaults to Planning.')
  colRow(doc, 'priority', 'VARCHAR(10)', 'Urgency level: High, Medium, or Low.')
  colRow(doc, 'owner', 'VARCHAR(120)', 'Name of the ACE Capital or facility team member responsible for execution.')
  colRow(doc, 'start_date', 'DATE', 'Date the initiative was formally launched.')
  colRow(doc, 'target_completion_date', 'DATE', 'Planned completion date set at initiative launch.')
  colRow(doc, 'actual_completion_date', 'DATE', 'Date the initiative was completed. NULL if still in progress.')
  colRow(doc, 'estimated_value_impact', 'NUMERIC(14,2)', 'Projected dollar value creation (EBITDA or revenue improvement) from completing this initiative.')
  colRow(doc, 'actual_value_impact', 'NUMERIC(14,2)', 'Realized dollar impact post-completion. NULL if the initiative is not yet complete.')
  colRow(doc, 'description', 'TEXT', 'Detailed description of the initiative scope, approach, and success criteria.')
  colRow(doc, 'notes', 'TEXT', 'Free-form operational notes, blockers, or updates added over time.')
  colRow(doc, 'created_at', 'TIMESTAMPTZ', 'Record creation timestamp.')
  colRow(doc, 'updated_at', 'TIMESTAMPTZ', 'Timestamp of the most recent record update.')

  footer(doc, 'ACE Capital · Database Data Dictionary · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 5. Methodology & Technical Approach ──────────────────────────────────────

function generateMethodology() {
  const doc = makeDoc('ACE Capital — Analytics Methodology')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'methodology.pdf'))
  doc.pipe(out)

  header(doc, 'Analytics Methodology', 'Portfolio Intelligence Initiative · Technical Approach & Pipeline')

  bodyText(doc, 'This document describes the end-to-end technical methodology behind the ACE Capital Portfolio Intelligence Initiative, from problem framing through data engineering, model development, and operational deployment.')

  // ── 1. Problem Framing ──────────────────────────────────────────────────────
  sectionTitle(doc, '1. Problem Framing')
  bodyText(doc, 'The core business problem: ACE Capital operates 50 drug and alcohol rehabilitation facilities across the southeastern US with no unified mechanism to identify which facilities are trending toward financial underperformance before the monthly P&L confirms it. By the time a problem appears in the financials, intervention lag is typically 6–8 weeks.')
  doc.moveDown(0.4)
  bodyText(doc, 'The analytical objective was to build a binary classification model that predicts, one month in advance, whether a facility will miss its EBITDA budget by more than 10%. This translates to a monthly risk score for each of the 50 facilities that the operations team can act on proactively.')
  doc.moveDown(0.4)

  const framing = [
    ['Task type',        'Supervised binary classification'],
    ['Target variable',  'underperformance_flag: 1 if EBITDA < 90% of monthly budget'],
    ['Prediction horizon','One month ahead (t+1 prediction using features at time t)'],
    ['Unit of analysis', 'Facility-month (one observation per facility per month)'],
    ['Dataset size',     '2,400 observations: 50 facilities × 48 months'],
    ['Positive class rate','~28% (underperformance events)'],
  ]
  const fCols = [60, 220]
  framing.forEach(([k, v]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(k, fCols[0], y, { width: 155 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(v, fCols[1], y, { width: 350, lineGap: 1 })
    doc.moveDown(0.55)
  })

  // ── 2. Data Sources & Collection ────────────────────────────────────────────
  sectionTitle(doc, '2. Data Sources & Collection')
  bodyText(doc, 'All data was sourced from facility-level operational systems and consolidated into a unified PostgreSQL database (hosted on Supabase). Source systems varied by facility; data integration was a significant component of the project scope.')
  doc.moveDown(0.4)

  const sources = [
    ['Billing / EHR Systems',   'Monthly revenue, claims, denials, collections, and payer mix data extracted from each facility\'s billing and electronic health record platforms.'],
    ['Census Reporting',        'Daily patient census reports aggregated to monthly averages for occupancy, admissions, discharges, and length-of-stay calculations.'],
    ['HR / Payroll Systems',    'Staff headcount and turnover data by department, used to compute monthly staff_turnover_rate.'],
    ['ACE Capital Finance Team','Monthly EBITDA budget targets (ebitda_budget_annual from facility_profiles), used as the denominator for the underperformance_flag.'],
    ['Referral Tracking',       'Inbound referral volumes and conversion rates logged in facility CRM systems.'],
  ]
  sources.forEach(([src, desc]) => {
    ensureSpace(doc, 45)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(src, 60, y, { width: 160 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(desc, 225, y, { width: 335, lineGap: 1 })
    doc.moveDown(0.65)
  })

  // ── 3. Feature Engineering ──────────────────────────────────────────────────
  sectionTitle(doc, '3. Feature Engineering')
  bodyText(doc, 'Raw database columns were used directly as features in most cases, with several derived features added to capture trends and ratios not directly observable in point-in-time values.')
  doc.moveDown(0.4)

  const features = [
    ['occupancy_rate', 'Derived: avg_daily_census / bed_capacity. Top feature by SHAP value. Captures utilization efficiency.'],
    ['ebitda_margin', 'Derived: ebitda / net_revenue. Profitability signal independent of facility size.'],
    ['claims_denied_rate', 'Derived: claims_denied / claims_submitted. Leading indicator of revenue cycle stress.'],
    ['referral_conversion_rate', 'Derived: converted_referrals / total_referrals. Forward-looking occupancy signal.'],
    ['staff_turnover_rate', 'Direct from source. Annualized. High turnover precedes clinical outcome deterioration.'],
    ['payer_commercial', 'Direct from source. Commercial mix is a strong net revenue per patient day predictor.'],
    ['ar_days', 'Direct from source. Rising AR days signal cash flow pressure before it hits EBITDA.'],
    ['Lag features (t-1, t-2)', 'One- and two-month lags of occupancy_rate and ebitda_margin added to capture momentum effects.'],
  ]
  features.forEach(([name, desc]) => {
    ensureSpace(doc, 38)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(name, 60, y, { width: 155 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(desc, 220, y, { width: 340, lineGap: 1 })
    doc.moveDown(0.6)
  })

  // ── 4. Class Imbalance ──────────────────────────────────────────────────────
  sectionTitle(doc, '4. Handling Class Imbalance')
  bodyText(doc, 'The dataset exhibits a 72/28 class split (healthy vs. underperforming months). Imbalance was addressed via two mechanisms:')
  doc.moveDown(0.3)

  const imbalance = [
    ['scale_pos_weight (XGBoost)', 'Set to 2.57 (ratio of negative to positive class). Directly penalizes misclassification of the minority class during gradient computation without altering the training dataset.'],
    ['F1 Score optimization', 'Model selection prioritized F1 over accuracy. Accuracy is a misleading metric on imbalanced datasets; a model predicting "healthy" for every observation would achieve 72% accuracy while being useless operationally.'],
  ]
  imbalance.forEach(([name, desc]) => {
    ensureSpace(doc, 45)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GREEN).text(name, 60, y, { width: 160 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(desc, 225, y, { width: 335, lineGap: 1 })
    doc.moveDown(0.7)
  })
  bodyText(doc, 'SMOTE (Synthetic Minority Oversampling Technique) was evaluated but not used in production. Synthetic oversampling improved recall marginally (+1.2%) but degraded precision (-3.8%), resulting in a lower net F1. The scale_pos_weight approach was cleaner, more interpretable, and performed better.')

  // ── Page 2 ──────────────────────────────────────────────────────────────────
  doc.addPage()

  // ── 5. Train/Test Split & Validation ────────────────────────────────────────
  sectionTitle(doc, '5. Train/Test Split & Cross-Validation')
  bodyText(doc, 'Standard random train/test split (80/20) was used as the primary holdout evaluation. Model selection and hyperparameter tuning used 5-fold stratified cross-validation on the training set, with stratification preserving the 28% positive class rate in each fold.')
  doc.moveDown(0.4)

  const splits = [
    ['Training set',        '1,920 observations (80%)'],
    ['Test set',            '480 observations (20%)'],
    ['CV strategy',         '5-fold stratified cross-validation'],
    ['CV metric',           'F1 score (primary), AUC-ROC (secondary)'],
    ['Leakage prevention',  'ebitda_budget_monthly excluded from features (it is the denominator of the target). All lag features computed within training folds only.'],
  ]
  splits.forEach(([k, v]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(k, 60, y, { width: 160 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(v, 225, y, { width: 335, lineGap: 1 })
    doc.moveDown(0.6)
  })

  // ── 6. Model Selection ──────────────────────────────────────────────────────
  sectionTitle(doc, '6. Model Selection')
  bodyText(doc, 'Five algorithms were evaluated under identical conditions. XGBoost was selected as the production model. Full comparison metrics are documented in the ML Model Selection & Comparison report.')
  doc.moveDown(0.4)
  bodyText(doc, 'Selection criteria in priority order: (1) AUC-ROC — measures overall discriminative ability; (2) F1 Score — balances the cost of false positives and false negatives; (3) Feature importance stability across CV folds — a model with unstable importances may not generalize.')

  // ── 7. Hyperparameter Tuning ────────────────────────────────────────────────
  sectionTitle(doc, '7. Hyperparameter Tuning')
  bodyText(doc, 'Grid search with cross-validation was used to tune the following XGBoost parameters:')
  doc.moveDown(0.3)

  const params = [
    ['n_estimators',     '100, 200, 300',           '300',   'More trees improve performance up to diminishing returns.'],
    ['max_depth',        '3, 4, 5, 6',              '6',     'Deeper trees capture more interactions; 6 avoided overfitting.'],
    ['learning_rate',    '0.01, 0.05, 0.1',         '0.05',  'Slower learning with more trees outperformed fast learning.'],
    ['subsample',        '0.6, 0.8, 1.0',           '0.8',   'Row subsampling reduced variance without hurting recall.'],
    ['colsample_bytree', '0.6, 0.8, 1.0',           '0.8',   'Feature subsampling improved generalization.'],
  ]

  const pCols = [60, 165, 265, 315]
  const pH = 16
  let py = doc.y + 4
  doc.rect(55, py - 3, doc.page.width - 110, pH).fill('#0d1e38')
  doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD2)
    .text('PARAMETER', pCols[0], py, { width: 100 })
    .text('VALUES TESTED', pCols[1], py, { width: 95 })
    .text('SELECTED', pCols[2], py, { width: 45 })
    .text('RATIONALE', pCols[3], py, { width: 250 })
  py += pH

  params.forEach((row, i) => {
    ensureSpace(doc, 30)
    py = doc.y
    doc.rect(55, py - 2, doc.page.width - 110, 18).fill(i % 2 === 0 ? '#0f1e35' : '#0b1830')
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE).text(row[0], pCols[0], py, { width: 100 })
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(row[1], pCols[1], py, { width: 95 })
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GREEN).text(row[2], pCols[2], py, { width: 45 })
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(row[3], pCols[3], py, { width: 250 })
    doc.y = py + 20
  })

  // ── 8. Deployment ───────────────────────────────────────────────────────────
  sectionTitle(doc, '8. Deployment & Scoring')
  bodyText(doc, 'The trained XGBoost model generates a monthly risk score (probability of underperformance) for each of the 50 portfolio facilities. Scores are surfaced in two places within the ACE Capital internal portal:')
  doc.moveDown(0.3)

  const deploy = [
    ['Analytics Dashboard', 'The Underperformance Rate KPI card shows the current portfolio-wide flag rate. The ML Risk Rankings table displays each facility\'s current risk score, sortable by score, with high-risk facilities flagged for operational review.'],
    ['Facility Directory', 'Each facility detail panel shows current ML risk score alongside operational metrics, giving the operations team context at the facility level.'],
  ]
  deploy.forEach(([name, desc]) => {
    ensureSpace(doc, 50)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GOLD2).text(name, 60, y)
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, 70, doc.y, { width: 490, lineGap: 2 })
    doc.moveDown(0.5)
  })

  bodyText(doc, 'The scoring pipeline is currently run as a batch process against the Supabase database. A facility with a risk score above 0.60 is flagged as high-risk and surfaced prominently in the dashboard. The threshold was set at 0.60 (rather than 0.50) to optimize for precision at the cost of marginal recall — reducing false-positive intervention burden on the operations team.')

  footer(doc, 'ACE Capital · Analytics Methodology · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 6. KPI & Dashboard Definitions ───────────────────────────────────────────

function generateKPIDefinitions() {
  const doc = makeDoc('ACE Capital — KPI & Dashboard Definitions')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'kpi-definitions.pdf'))
  doc.pipe(out)

  header(doc, 'KPI & Dashboard Definitions', 'ACE Capital Analytics Dashboard · Metric Reference Guide')

  bodyText(doc, 'This document defines every metric displayed on the ACE Capital Analytics Dashboard and Facility Directory. For each KPI: the plain-English definition, the calculation formula, the data source, what "good" looks like, and its role in the ML model where applicable.')

  // ── Helper for KPI block ───────────────────────────────────────────────────
  function kpiBlock(doc, name, { definition, formula, source, benchmark, mlRole }) {
    ensureSpace(doc, 130)
    doc.moveDown(0.5)
    // Name bar
    const y = doc.y
    doc.rect(55, y - 2, doc.page.width - 110, 20).fill('#0d1e38')
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD2).text(name, 60, y + 1)
    doc.y = y + 24

    const rows = [
      ['Definition', definition],
      ['Formula',    formula],
      ['Source',     source],
      ['Benchmark',  benchmark],
    ]
    if (mlRole) rows.push(['ML Role', mlRole])

    rows.forEach(([label, val]) => {
      ensureSpace(doc, 20)
      const ry = doc.y
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED2).text(label, 60, ry, { width: 90 })
      doc.font('Helvetica').fontSize(9).fillColor(label === 'ML Role' ? GREEN : MUTED)
        .text(val, 155, ry, { width: 400, lineGap: 1 })
      const h = doc.heightOfString(val, { width: 400, lineGap: 1 })
      doc.y = ry + Math.max(14, h) + 3
    })
  }

  // ── SECTION: Portfolio-Level KPI Cards ─────────────────────────────────────
  sectionTitle(doc, 'Portfolio KPI Cards')
  bodyText(doc, 'The four headline KPI cards at the top of the Analytics Dashboard summarize current portfolio performance across the key dimensions monitored by the investment team.')

  kpiBlock(doc, 'Occupancy Rate', {
    definition: 'The average proportion of licensed beds filled with patients across all active portfolio facilities, averaged for the most recent reporting period.',
    formula:    'avg(avg_daily_census / bed_capacity) across all facilities, current month.',
    source:     'monthly_facility_metrics.occupancy_rate',
    benchmark:  'Target: ≥ 80%. Industry average for well-run D&A facilities: 75–85%. Below 70% triggers operational review.',
    mlRole:     'Top feature by SHAP value (0.312). Occupancy is the primary driver of revenue and the strongest leading indicator of EBITDA underperformance. A 3-month trailing average is used in the production model to smooth seasonal noise.',
  })

  kpiBlock(doc, 'EBITDA Margin', {
    definition: 'Net operating profitability as a percentage of net revenue, averaged across the portfolio for the current period.',
    formula:    'avg(ebitda / net_revenue) across all facilities, current month. EBITDA = net_revenue - total_expenses.',
    source:     'monthly_facility_metrics.ebitda_margin',
    benchmark:  'Target: ≥ 18%. Strong performers: 22–28%. Below 12% is a concern; below 8% triggers immediate review.',
    mlRole:     'Second feature by SHAP value (0.271) via the ebitda_margin deviation from prior period (month-over-month delta). Margin deterioration is a more actionable signal than absolute margin level.',
  })

  kpiBlock(doc, 'Underperformance Rate', {
    definition: 'The proportion of active facilities currently flagged as underperforming — i.e., EBITDA is below 90% of the monthly budget target.',
    formula:    'count(underperformance_flag = 1) / count(all active facilities), current month.',
    source:     'monthly_facility_metrics.underperformance_flag',
    benchmark:  'Target: < 20%. This is the direct business KPI that the ML model is trained to predict. Historical average: ~28%.',
    mlRole:     'This IS the ML target variable. The model predicts next month\'s value of this flag for each facility individually, enabling early intervention before the flag is set.',
  })

  kpiBlock(doc, 'Claims Denial Rate', {
    definition: 'The average proportion of insurance claims rejected by payers across the portfolio, for the current reporting period.',
    formula:    'avg(claims_denied / claims_submitted) across all facilities, current month.',
    source:     'monthly_facility_metrics.claims_denied_rate',
    benchmark:  'Target: < 8%. Industry average: 8–12%. Above 15% indicates systemic billing or documentation problems.',
    mlRole:     'Third feature by SHAP value (0.198). Elevated denial rates are a leading indicator of net revenue pressure 30–60 days before the EBITDA impact appears.',
  })

  // ── SECTION: Operational Metrics ───────────────────────────────────────────
  sectionTitle(doc, 'Operational Metrics')

  kpiBlock(doc, 'Average Length of Stay (ALOS)', {
    definition: 'The average number of days a patient spends in treatment per episode of care.',
    formula:    'avg(avg_length_of_stay) across facilities, current month.',
    source:     'monthly_facility_metrics.avg_length_of_stay',
    benchmark:  'Varies by facility type. Residential: 28–45 days. IOP: 10–21 days. Higher ALOS generally improves revenue per admission and clinical outcomes.',
    mlRole:     'Indirect predictor. Short ALOS can indicate patient dissatisfaction or payer pressure to discharge early; both precede occupancy decline.',
  })

  kpiBlock(doc, 'Referral Conversion Rate', {
    definition: 'The proportion of inbound referrals that convert into a patient admission.',
    formula:    'converted_referrals / total_referrals, per facility per month.',
    source:     'monthly_facility_metrics.referral_conversion_rate',
    benchmark:  'Target: ≥ 55%. Below 40% indicates intake process problems or payer authorization delays.',
    mlRole:     'Forward-looking occupancy signal. A drop in conversion rate in month t predicts lower admissions and occupancy in month t+1.',
  })

  kpiBlock(doc, 'Staff Turnover Rate', {
    definition: 'The annualized rate at which employees are leaving the facility.',
    formula:    'Annualized monthly turnover: (separations in month / average headcount) × 12.',
    source:     'monthly_facility_metrics.staff_turnover_rate',
    benchmark:  'Target: < 30% annualized. Industry average: 35–50%. Above 60% is a serious operational concern.',
    mlRole:     'Fourth feature by SHAP value (0.143). High turnover is causally linked to lower treatment completion rates and reduced patient capacity, both of which suppress revenue.',
  })

  kpiBlock(doc, 'Collections Rate', {
    definition: 'The proportion of gross billed charges actually collected as net revenue.',
    formula:    'net_revenue / gross_revenue, per facility per month.',
    source:     'monthly_facility_metrics.collections_rate',
    benchmark:  'Target: ≥ 65%. Below 55% indicates significant write-off pressure, often from payer contract issues or billing quality problems.',
    mlRole:     'Indirect. Collections rate decline precedes net revenue compression, which precedes EBITDA underperformance.',
  })

  kpiBlock(doc, 'AR Days (Days in Accounts Receivable)', {
    definition: 'The average number of days between service delivery and payment collection.',
    formula:    'ar_days stored directly. Conceptually: (accounts receivable balance / net_revenue) × 30.',
    source:     'monthly_facility_metrics.ar_days',
    benchmark:  'Target: < 45 days. Above 60 days indicates collections or denial management problems. Above 75 days is a cash flow risk.',
    mlRole:     'Rising AR days is an early warning of revenue cycle deterioration, typically appearing 4–6 weeks before the EBITDA impact.',
  })

  footer(doc, 'ACE Capital · KPI & Dashboard Definitions · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── 7. Portfolio Financial Summary ───────────────────────────────────────────

function generatePortfolioFinancial() {
  const doc = makeDoc('ACE Capital — Portfolio Financial Summary')
  const out = fs.createWriteStream(path.join(OUT_DIR, 'portfolio-financial-summary.pdf'))
  doc.pipe(out)

  header(doc, 'Portfolio Financial Summary', 'ACE Capital Behavioral Health Portfolio · Deal & Performance Overview')

  bodyText(doc, 'This document provides a financial overview of the ACE Capital behavioral health portfolio as of the current reporting period. All figures are illustrative, based on the simulated dataset underlying the Portfolio Intelligence Initiative.')

  // ── Portfolio Snapshot ─────────────────────────────────────────────────────
  sectionTitle(doc, 'Portfolio Snapshot')

  const snapshot = [
    ['Total Facilities',          '50 rehabilitation centers'],
    ['Active Holdings',           '43 facilities'],
    ['Exited Holdings',           '7 facilities'],
    ['Total AUM',                 '~$2.1 Billion'],
    ['Geographic Focus',          'Southeastern United States (AL, FL, GA, KY, MS, NC, SC, TN, VA, WV)'],
    ['Primary Treatment Focus',   'Drug & Alcohol Rehabilitation (Residential, IOP, PHP, Detox, Dual Diagnosis)'],
    ['Avg. Bed Capacity',         '62 beds per facility (range: 18–210)'],
    ['Total Licensed Beds',       '~3,100 across active portfolio'],
    ['Portfolio Occupancy',       '~79% average (trailing 12 months)'],
    ['Portfolio EBITDA Margin',   '~19.4% average (trailing 12 months)'],
  ]
  const sCols = [60, 270]
  snapshot.forEach(([k, v]) => {
    ensureSpace(doc, 18)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(k, sCols[0], y, { width: 200 })
    doc.font('Helvetica').fontSize(9).fillColor(WHITE).text(v, sCols[1], y, { width: 290 })
    doc.moveDown(0.55)
  })

  // ── Deal Structure ─────────────────────────────────────────────────────────
  sectionTitle(doc, 'Deal Structure & Entry Metrics')
  bodyText(doc, 'ACE Capital employs a platform-and-add-on acquisition strategy. Platform deals establish a geographic presence in a new market; add-ons expand the platform to capture economies of scale.')
  doc.moveDown(0.4)

  const dealTypes = [
    ['Platform Deals',  '12 deals', 'First entry in a new market. Higher entry multiples (avg. 7.8x EBITDA) justified by first-mover positioning and platform optionality.'],
    ['Add-On Deals',    '35 deals', 'Bolt-on acquisitions. Lower entry multiples (avg. 5.9x EBITDA) reflecting reduced standalone risk and known integration path.'],
    ['Recapitalizations','3 deals', 'Minority partner buyouts or balance sheet restructurings. Avg. entry multiple: 6.4x.'],
  ]
  const dtCols = [60, 155, 230]
  dealTypes.forEach(([type, count, desc]) => {
    ensureSpace(doc, 40)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(WHITE).text(type, dtCols[0], y, { width: 90 })
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GOLD).text(count, dtCols[1], y, { width: 70 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(desc, dtCols[2], y, { width: 330, lineGap: 1 })
    doc.moveDown(0.7)
  })

  // ── Entry Multiple Distribution ────────────────────────────────────────────
  sectionTitle(doc, 'Entry Multiple Distribution (EV / EBITDA)')
  bodyText(doc, 'Acquisition prices ranged from 3.8x to 10.2x EBITDA, reflecting deal-specific distress levels, market dynamics, and competitive processes.')
  doc.moveDown(0.6)

  const multiples = [
    { range: '< 5.0x',      count: 9,  pct: 0.18, note: 'Deep distress; operational turnaround required' },
    { range: '5.0x – 6.5x', count: 21, pct: 0.42, note: 'Core target range; operationally challenged but viable' },
    { range: '6.5x – 8.0x', count: 14, pct: 0.28, note: 'Above-average quality; strategic market position' },
    { range: '> 8.0x',      count: 6,  pct: 0.12, note: 'Premium assets; platform anchors in key markets' },
  ]
  const barMaxW = 220
  multiples.forEach(row => {
    ensureSpace(doc, 30)
    const y = doc.y
    const bw = Math.round(row.pct * barMaxW)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(row.range, 60, y, { width: 90 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`${row.count} deals`, 155, y, { width: 60 })
    doc.rect(220, y + 2, barMaxW, 11).fill('#0d1e38')
    doc.rect(220, y + 2, bw, 11).fill(GOLD)
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(`${Math.round(row.pct * 100)}%  ${row.note}`, 220 + barMaxW + 8, y, { width: 185 })
    doc.moveDown(0.9)
  })

  // ── Page 2 ──────────────────────────────────────────────────────────────────
  doc.addPage()

  // ── Return Performance ─────────────────────────────────────────────────────
  sectionTitle(doc, 'Return Performance (Exited Holdings)')
  bodyText(doc, '7 facilities have been fully exited. Realized returns are as follows:')
  doc.moveDown(0.5)

  const exits = [
    { moic: '3.4x', irr: '31%',  entry: '5.2x', exit: '7.8x',  type: 'Add-On',   status: 'Exited' },
    { moic: '2.9x', irr: '27%',  entry: '4.8x', exit: '7.1x',  type: 'Platform', status: 'Exited' },
    { moic: '2.7x', irr: '24%',  entry: '6.1x', exit: '8.4x',  type: 'Add-On',   status: 'Exited' },
    { moic: '2.5x', irr: '22%',  entry: '5.9x', exit: '7.6x',  type: 'Add-On',   status: 'Exited' },
    { moic: '2.1x', irr: '18%',  entry: '7.2x', exit: '8.9x',  type: 'Platform', status: 'Exited' },
    { moic: '1.8x', irr: '14%',  entry: '6.4x', exit: '7.2x',  type: 'Recap',    status: 'Exited' },
    { moic: '1.4x', irr: '9%',   entry: '8.1x', exit: '7.9x',  type: 'Platform', status: 'Exited' },
  ]

  const eCols  = [60, 130, 195, 265, 335, 410]
  const eHdrs  = ['MOIC', 'IRR', 'Entry Mult.', 'Exit Mult.', 'Deal Type', 'Status']
  let ey = doc.y
  doc.rect(55, ey - 3, doc.page.width - 110, 18).fill('#0d1e38')
  eHdrs.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GOLD2).text(h, eCols[i], ey, { width: 65, align: i === 0 ? 'left' : 'center' })
  })
  ey += 18

  exits.forEach((row, idx) => {
    doc.rect(55, ey - 2, doc.page.width - 110, 18).fill(idx % 2 === 0 ? '#0f1e35' : '#0b1830')
    const moicNum = parseFloat(row.moic)
    const moicColor = moicNum >= 2.5 ? GREEN : (moicNum >= 2.0 ? GOLD2 : MUTED)
    const vals = [row.moic, row.irr, row.entry, row.exit, row.type, row.status]
    vals.forEach((v, i) => {
      const color = i === 0 ? moicColor : (i === 1 ? moicColor : WHITE)
      doc.font(i <= 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(color)
        .text(v, eCols[i], ey, { width: 65, align: i === 0 ? 'left' : 'center' })
    })
    ey += 18
  })
  doc.y = ey + 8

  bodyText(doc, 'Average realized MOIC: 2.4x. 4 of 7 exits (57%) cleared the 2.5x high_return_flag threshold. Portfolio gross IRR on exited holdings: approximately 20.7%.')

  // ── Active Portfolio MOIC Projections ────────────────────────────────────
  sectionTitle(doc, 'Active Portfolio — Projected Returns')
  bodyText(doc, 'Projected MOIC for the 43 active holdings, based on current EBITDA trajectory and assumed exit multiples at end of hold period.')
  doc.moveDown(0.4)

  const projections = [
    { range: '≥ 3.0x projected',   count: 8,  pct: 0.186 },
    { range: '2.5x – 3.0x',        count: 14, pct: 0.326 },
    { range: '2.0x – 2.5x',        count: 13, pct: 0.302 },
    { range: '1.5x – 2.0x',        count: 6,  pct: 0.140 },
    { range: '< 1.5x (at risk)',    count: 2,  pct: 0.047 },
  ]

  projections.forEach(row => {
    ensureSpace(doc, 28)
    const y = doc.y
    const bw = Math.round(row.pct * barMaxW)
    const color = row.range.includes('at risk') ? RED : (row.range.includes('≥ 3.0') ? GREEN : GOLD2)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(row.range, 60, y, { width: 120 })
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(`${row.count} deals`, 185, y, { width: 55 })
    doc.rect(245, y + 2, barMaxW, 11).fill('#0d1e38')
    doc.rect(245, y + 2, bw, 11).fill(color)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(`${Math.round(row.pct * 100)}%`, 245 + barMaxW + 8, y)
    doc.moveDown(0.9)
  })

  bodyText(doc, 'Projected blended MOIC on active portfolio: ~2.6x. The 2 at-risk holdings are the primary focus of the Portfolio Intelligence Initiative\'s early warning system and current operational intervention workstreams.')

  // ── Value Creation by Category ─────────────────────────────────────────────
  sectionTitle(doc, 'Value Creation Initiatives — Impact Summary')
  bodyText(doc, 'Value creation initiatives track strategic improvement projects at each facility. As of the current period, across all 50 facilities:')
  doc.moveDown(0.4)

  const vci = [
    ['Total Initiatives Tracked',       '~275 (avg. 5.5 per facility)'],
    ['Completed',                        '~140 (51%)'],
    ['In Progress',                      '~85 (31%)'],
    ['Planning / On Hold',               '~50 (18%)'],
    ['Total Estimated Value Impact',     '~$340M (projected EBITDA & revenue improvement)'],
    ['Total Realized Value Impact',      '~$155M (from completed initiatives)'],
    ['Avg. Value per Completed Initiative', '~$1.1M'],
  ]
  vci.forEach(([k, v]) => {
    ensureSpace(doc, 18)
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD2).text(k, 60, y, { width: 250 })
    doc.font('Helvetica').fontSize(9).fillColor(WHITE).text(v, 315, y, { width: 250 })
    doc.moveDown(0.55)
  })

  footer(doc, 'ACE Capital · Portfolio Financial Summary · Confidential · Internal Use Only')
  doc.end()

  return new Promise(resolve => out.on('finish', resolve))
}

// ─── Run ───────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('Generating PDFs → public/documents/')
  await generateCompanyBio()
  console.log('  ✓ company-bio.pdf')
  await generateMLComparison()
  console.log('  ✓ ml-model-comparison.pdf')
  await generateMLPerformance()
  console.log('  ✓ ml-model-performance.pdf')
  await generateDataDictionary()
  console.log('  ✓ data-dictionary.pdf')
  await generateMethodology()
  console.log('  ✓ methodology.pdf')
  await generateKPIDefinitions()
  console.log('  ✓ kpi-definitions.pdf')
  await generatePortfolioFinancial()
  console.log('  ✓ portfolio-financial-summary.pdf')
  console.log('Done.')
})()
