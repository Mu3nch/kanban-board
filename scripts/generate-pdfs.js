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

// ─── Run ───────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('Generating PDFs → public/documents/')
  await generateCompanyBio()
  console.log('  ✓ company-bio.pdf')
  await generateMLComparison()
  console.log('  ✓ ml-model-comparison.pdf')
  await generateMLPerformance()
  console.log('  ✓ ml-model-performance.pdf')
  console.log('Done.')
})()
