// Learn.jsx — Accordion explainer guide
import { useState } from 'react'

const S = [
  {
    e: '🗂️', c: '#4f8ef7', t: 'What is this project?', blocks: [
      {
        h: 'The Big Picture',
        b: `This is an AI-powered system that detects credit card fraud in real-time. Every transaction is analyzed by a trained machine learning model which returns a fraud probability and risk level — all within 50ms.\n\nBanks process millions of transactions daily. No human team can review every one. This system automates that check using patterns learned from 10,000 historical transactions.`
      },
      {
        h: 'Real-world example',
        b: `Paying ₹45 at a grocery store at 2 PM → Normal.\nBuying ₹2,300 of electronics online at 2 AM from a small city → Suspicious.\n\nThe model learns exactly these patterns and generalizes them to new unseen transactions.`
      },
    ]
  },
  {
    e: '📦', c: '#7c6aef', t: 'Dataset — Readable Columns', blocks: [
      {
        h: 'Why this dataset is better',
        b: `Old dataset: V1, V2 … V28 — PCA-transformed, impossible to explain.\n\nNew dataset (kartik2112/fraud-detection on Kaggle):\n• amt       → Transaction amount\n• category  → grocery_pos, shopping_net, travel…\n• hour      → 0–23 (2 AM is very different from 2 PM!)\n• age       → Customer age\n• city_pop  → Size of customer's city\n• job       → Customer occupation\n• is_fraud  → 0=Normal, 1=Fraud (our prediction target)`
      },
      {
        h: 'Class imbalance problem',
        b: `Dataset: 9,500 normal vs 500 fraud (5% fraud rate).\n\nIf a model says "Normal" for everything:\n  Accuracy = 95% ← looks great!\n  Frauds caught = 0 ← useless!\n\nThat's why we use SMOTE to balance classes and Recall/F1 to measure performance — not accuracy.`
      },
    ]
  },
  {
    e: '⚙️', c: '#10b981', t: 'Step 1 — Preprocessing', blocks: [
      {
        h: 'Label Encoding',
        b: `ML models only understand numbers. Text columns are encoded:\n  "entertainment" → 0\n  "grocery_pos"   → 3\n  "shopping_net"  → 10\n\nWe save the encoder — the same mapping MUST be used at prediction time!`
      },
      {
        h: 'StandardScaler',
        b: `Features have vastly different ranges:\n  amt      → 1 to 9,000\n  city_pop → 500 to 800,000\n  age      → 18 to 75\n\nWithout scaling, city_pop dominates just because of size.\nStandardScaler → mean=0, std=1 for all features equally.`
      },
      {
        h: 'Train-test split (80/20)',
        b: `80% of data → training (model learns from this)\n20% of data → testing (honest evaluation on unseen data)\n\nstratify=y preserves the 5% fraud ratio in both splits.`
      },
    ]
  },
  {
    e: '⚖️', c: '#f59e0b', t: 'Step 2 — SMOTE', blocks: [
      {
        h: 'The problem',
        b: `Training set: ~7,600 normal vs ~400 fraud.\nModel learns to ignore fraud entirely → 95% accuracy but 0 frauds caught.`
      },
      {
        h: 'The fix',
        b: `SMOTE creates synthetic fraud samples by interpolating between real ones:\n\nFraud A: amt=2300, hour=2, category=shopping_net\nFraud B: amt=1800, hour=3, category=misc_net\nSynthetic: amt=2050, hour=2, category=shopping_net\n\nAfter SMOTE: 7,600 vs 7,600 → perfectly balanced!\nRule: Apply ONLY on training data, never on test data.`
      },
    ]
  },
  {
    e: '🌳', c: '#10b981', t: 'Step 3 — Random Forest (Winner)', blocks: [
      {
        h: '100 detectives analogy',
        b: `100 fraud detectives, each sees random data subsets, builds own rules, then votes.\nFinal answer = majority vote.\n\nIf 73 of 100 say fraud → flag the transaction.`
      },
      {
        h: 'One decision tree looks like',
        b: `Is amount > 1500?\n├── YES: Is hour < 5?\n│         ├── YES: Is category=shopping_net? → FRAUD ⚠\n│         └── NO  → NORMAL ✅\n└── NO:  Is category=grocery_pos? → NORMAL ✅\n\nThe model learns these thresholds from data automatically.`
      },
      {
        h: 'Why it beats Logistic Regression',
        b: `LR draws ONE straight line through feature space.\nRF draws complex non-linear boundaries.\n\nResult: LR → F1=73.6%, AUC=0.9932\n        RF → F1=100%, AUC=1.0000`
      },
    ]
  },
  {
    e: '📊', c: '#ef4444', t: 'Step 4 — Evaluation Metrics', blocks: [
      {
        h: 'Precision, Recall, F1, AUC',
        b: `Precision = TP/(TP+FP)\n  "Of all I flagged fraud, how many were real?" → reduces false alarms\n\nRecall = TP/(TP+FN)\n  "Of all real fraud, how many caught?" ← MOST IMPORTANT!\n\nF1-Score = harmonic mean of Precision and Recall\n\nROC-AUC: Probability model ranks fraud above normal.\n  1.0 = Perfect | 0.5 = Random | Our RF = 1.0000`
      },
    ]
  },
  {
    e: '🎯', c: '#7c6aef', t: 'Step 5 — Risk Scoring', blocks: [
      {
        h: 'Three risk tiers',
        b: `Model output: probability 0.0 to 1.0\n\n< 0.30  → 🟢 Low Risk     → Auto-approve\n0.30-0.70 → 🟡 Medium Risk  → Request OTP\n> 0.70  → 🔴 High Risk    → Block + Alert customer\n\nThese thresholds balance false alarms vs missed frauds.`
      },
    ]
  },
  {
    e: '💾', c: '#4f8ef7', t: 'Step 6 — Save & Serve', blocks: [
      {
        h: '4 saved files',
        b: `fraud_model.pkl    → Trained Random Forest\nscaler.pkl         → StandardScaler (same mean/std required)\nencoders.pkl       → LabelEncoders (same mappings required)\nfeature_names.pkl  → Column order (must match exactly)`
      },
      {
        h: 'Flask API flow',
        b: `1. React sends JSON → POST /predict\n2. Flask encodes text fields using saved encoders\n3. Flask scales numbers using saved scaler\n4. model.predict_proba() → fraud probability\n5. get_risk_level() → Low/Medium/High\n6. Return JSON result → React renders gauges and bars\nTotal time: < 50ms per prediction`
      },
    ]
  },
]

export default function Learn() {
  const [open, setOpen] = useState(0)

  return (
    <div>
      <div className="ph fu">
        <h1 className="ph-title">
          Learn <span className="grad">Everything</span>
        </h1>
        <p className="ph-sub">
          Complete beginner's guide — every concept explained for your viva and presentation
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
        {S.map((s, i) => (
          <div key={i} className="acc-item fu"
            style={{
              borderColor: open === i ? `${s.c}44` : 'var(--rim)',
              boxShadow: open === i ? `0 0 30px ${s.c}10` : 'none',
              animationDelay: `${i * .04}s`
            }}>
            <button className="acc-btn" onClick={() => setOpen(open === i ? -1 : i)}>
              <div style={{
                width: 3.5, height: 20, borderRadius: 2,
                background: s.c, flexShrink: 0,
                boxShadow: `0 0 8px ${s.c}`
              }} />
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.e}</span>
              <span style={{
                fontFamily: 'var(--display)', fontWeight: 600,
                fontSize: '.9rem', flex: 1
              }}>{s.t}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--t3)" strokeWidth="2"
                style={{
                  transform: open === i ? 'rotate(180deg)' : 'none',
                  transition: 'transform .22s var(--ease)', flexShrink: 0
                }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {open === i && (
              <div className="acc-body">
                {s.blocks.map((b, j) => (
                  <div key={j} style={{ marginBottom: j < s.blocks.length - 1 ? 20 : 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      fontSize: '.75rem', fontWeight: 700, color: s.c,
                      textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 9
                    }}>
                      <div style={{ width: 3, height: 13, borderRadius: 2, background: s.c }} />
                      {b.h}
                    </div>
                    {b.b.split('\n').map((line, k) => (
                      line === '' ? <div key={k} style={{ height: 7 }} /> :
                        <p key={k} style={{
                          lineHeight: 1.8, marginBottom: 1,
                          color: line.startsWith('•') || line.startsWith('├') ||
                            line.startsWith('└') || line.startsWith('│')
                            ? 'var(--t1)' : 'var(--t2)',
                          fontFamily: (line.includes('→') && line.length < 55) ||
                            line.startsWith('  ') ? 'var(--mono)' : 'var(--body)',
                          fontSize: (line.includes('→') && line.length < 55) ||
                            line.startsWith('  ') ? '.77rem' : '.83rem',
                        }}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Viva cheat sheet */}
      <div className="card card-p card-shine fu-4" style={{
        background: 'rgba(79,142,247,.04)',
        borderColor: 'rgba(79,142,247,.2)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--display)', fontWeight: 600,
          fontSize: '.92rem', marginBottom: 18, color: 'var(--blue2)'
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Viva Cheat Sheet
        </div>
        <div className="grid2" style={{ gap: 11 }}>
          {[
            {
              q: '"Why this dataset?"',
              a: 'Readable columns — amt, category, hour, age. Old V1-V28 were PCA-transformed numbers impossible to explain. Anyone can understand why ₹2300 at 2 AM is suspicious.'
            },
            {
              q: '"What is SMOTE?"',
              a: 'Creates synthetic fraud samples to balance 9,500 normal vs 500 fraud. Without it, model says Normal every time → 95% accuracy but 0 frauds caught.'
            },
            {
              q: '"Why Random Forest?"',
              a: '100 decision trees each vote → majority wins. Captures non-linear patterns: "high amount AND late night AND online" together. LR can only draw one straight line.'
            },
            {
              q: '"Why not use accuracy?"',
              a: '95% accuracy by always predicting Normal — catches 0 fraud. Recall and F1 measure whether we actually catch real fraud cases.'
            },
            {
              q: '"What is ROC-AUC?"',
              a: 'Given 1 fraud + 1 normal, AUC = probability model ranks fraud higher. Our RF gets 1.0000 — perfect separation of fraud from legitimate transactions.'
            },
            {
              q: '"How does the API work?"',
              a: 'React sends JSON → Flask encodes text → scales numbers → model.predict_proba() → risk level → JSON response → React shows gauge and bars. Total: <50ms.'
            },
          ].map(tip => (
            <div key={tip.q} style={{
              background: 'rgba(255,255,255,.025)', border: '1px solid var(--rim)',
              borderRadius: 10, padding: '12px 14px'
            }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: '.74rem',
                color: 'var(--blue2)', fontWeight: 500, marginBottom: 7
              }}>{tip.q}</div>
              <div style={{ fontSize: '.79rem', color: 'var(--t2)', lineHeight: 1.72 }}>
                {tip.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
