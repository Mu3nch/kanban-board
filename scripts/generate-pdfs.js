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
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY)
  return doc
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

function sectionTitle(doc, text) {
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
  sectionTitle(doc, 'Our Storied Origin')
  bodyText(doc, 'ACE Capital was founded in 1993 by identical twins Bryce and Bryce Westmore-Huntington III, who, after graduating from business school, decided to invest in "behavioral health" after misreading a textbook on behavioral economics. By the time anyone corrected them, they had already closed their first deal and declared it "close enough."')
  doc.moveDown(0.5)
  bodyText(doc, 'The firm name \u2014 ACE \u2014 stands for Acquisitions, Capital, and Excellence, though internally it has also stood for \u201CA Confusing Enterprise,\u201D \u201CAggressive Cost Extraction,\u201D and once, briefly, \u201CAlan\u2019s Coffee Expense\u201D during a particularly rough quarterly review.')

  // Investment thesis
  sectionTitle(doc, 'Investment Thesis')
  bodyText(doc, '"Feelings are assets. Specifically, other people\'s feelings."')
  doc.moveDown(0.4)
  bodyText(doc, 'More formally: ACE Capital targets operationally underperforming behavioral health facilities in the southeastern United States where our proprietary ML-driven value creation framework — lovingly nicknamed FEELINGS™ (Facility Efficiency Enhancement via Leveraged Intelligence, Normalized Growth & Synergies) — can unlock EBITDA improvement within a 3–5 year hold period.')
  doc.moveDown(0.4)
  bodyText(doc, 'We believe deeply in data-driven decision making, except on Fridays, which are vibes-only.')

  // Portfolio stats
  sectionTitle(doc, 'Portfolio at a Glance')

  const stats = [
    ['Portfolio Facilities',   '50'],
    ['Region',                 'Southeastern United States'],
    ['Focus',                  'D&A Treatment & Mental Health'],
    ['Assets Under Management','~$2.1 Billion (give or take a rounding error)'],
    ['Founded',                '1993 (or 1994, depending on which twin you ask)'],
    ['Headquarters',           'Nashville, TN (the good part)'],
  ]
  const colX = [60, 260]
  stats.forEach(([label, val]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(label, colX[0], y, { width: 180 })
    doc.font('Helvetica').fontSize(9).fillColor(WHITE).text(val, colX[1], y, { width: 290 })
    doc.moveDown(0.55)
  })

  // Core values
  sectionTitle(doc, 'Core Values')

  const values = [
    ['Synergy',         'We put this word in every deck. It means something different every time.'],
    ['Transparency',    'We are fully transparent about the things we choose to be transparent about.'],
    ['Empathy Pipeline','We have identified empathy as a bottleneck and are actively working to scale it.'],
    ['Operational Excellence', 'Our facilities consistently excel at operations, per the metrics we select.'],
    ['Return Maximization', 'MOIC ≥ 2.5x or we act slightly disappointed at the annual LP dinner.'],
  ]
  values.forEach(([name, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(WHITE).text(`• ${name}`, 60, y, { continued: true })
    doc.font('Helvetica').fillColor(MUTED).text(`  — ${desc}`, { lineGap: 2 })
    doc.moveDown(0.3)
  })

  // Leadership team
  doc.addPage()
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY)
  doc.rect(0, 0, doc.page.width, 6).fill(GOLD)
  doc.moveDown(0.5)

  sectionTitle(doc, 'Leadership Team')
  bodyText(doc, 'ACE Capital is led by a world-class team of professionals who have collectively attended more than 200 cocktail receptions and have opinions about airport lounges.')

  const team = [
    {
      name: 'Chad Acquisition',
      title: 'Chief Executive Officer',
      bio: 'Chad has over 25 years of experience acquiring things. Originally a philosophy major, Chad pivoted to finance after realizing Nietzsche had poor IRR. He enjoys golf, saying "circle back," and referring to all problems as "opportunities." His MBA thesis was titled: "Leverage: A Love Story."',
    },
    {
      name: 'Biff Returns',
      title: 'Chief Financial Officer',
      bio: 'Biff joined ACE after a decade at a bulge-bracket bank where he earned the nickname "The Denominator" for his creative approach to per-unit economics. He has never met a margin he couldn\'t compress. Favorite phrase: "Let\'s put a number on it." He has a spreadsheet for his feelings. It is color-coded.',
    },
    {
      name: 'Data McDataface',
      title: 'Chief Technology Officer',
      bio: 'Data (legal name: Gerald) joined ACE after winning a Kaggle competition and accidentally emailing the results to the wrong Chad. He built the FEELINGS™ ML framework in six weeks and has been asked to "just explain it simply" at every board meeting since. He communicates primarily in feature importances.',
    },
    {
      name: 'Portia Folio',
      title: 'Head of Portfolio Operations',
      bio: 'Portia oversees operational improvements across all 50 facilities, which she describes as "herding extremely well-meaning cats." She has implemented 14 value creation initiatives, 11 of which have been declared successes pending definition of success.',
    },
    {
      name: 'Compliance Colin',
      title: 'General Counsel & Chief Compliance Officer',
      bio: 'Colin joined ACE after a previous employer asked him to "be a little less thorough." He has since found his people. Colin\'s motto: "If in doubt, add another clause." He is currently on page 847 of drafting the Employee Handbook and considers it a first draft.',
    },
  ]

  team.forEach(person => {
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE).text(person.name)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(GOLD).text(person.title)
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(person.bio, { lineGap: 2 })
    doc.moveDown(0.3)
  })

  // Strategy section
  sectionTitle(doc, 'Value Creation Strategy')
  bodyText(doc, 'ACE Capital\'s proprietary value creation framework operates across four pillars:')
  doc.moveDown(0.3)

  const pillars = [
    ['1. Identify', 'Use ML models to flag facilities with EBITDA underperformance before it becomes a crisis (or a press release).'],
    ['2. Intervene', 'Deploy the Operations Strike Team™ (it\'s just Portia and two analysts) to implement improvement plans.'],
    ['3. Optimize', 'Compress costs along vectors that will not appear in the next JCAHO audit.'],
    ['4. Exit', 'Sell at an attractive multiple to a strategic buyer who will repeat this process.'],
  ]
  pillars.forEach(([step, desc]) => {
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GOLD2).text(step, 60, y, { width: 75 })
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(desc, 140, y, { width: 410, lineGap: 2 })
    doc.moveDown(0.55)
  })

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
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY)
  doc.rect(0, 0, doc.page.width, 6).fill(GOLD)
  doc.moveDown(0.5)

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
