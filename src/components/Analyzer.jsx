// ================================================================
//  Analyzer.jsx — Full professional transaction risk analyzer
//  Features: real API calls, form validation, animated gauge,
//  probability bar, feature importance, recommendation engine
// ================================================================
import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import { useToast, Toast } from './useToast.jsx'
import {
  Chart, ArcElement, DoughnutController, Tooltip
} from 'chart.js'
Chart.register(ArcElement, DoughnutController, Tooltip)

// ── Valid values (must match encoders.pkl) ────────────────────
const CATEGORIES = [
  'entertainment', 'food_dining', 'gas_transport', 'grocery_pos',
  'health_fitness', 'home', 'kids_pets', 'misc_net', 'misc_pos',
  'personal_care', 'shopping_net', 'shopping_pos', 'travel'
]
const JOBS = [
  'Analyst', 'Artist', 'Chef', 'Clerk', 'Doctor', 'Driver',
  'Engineer', 'Farmer', 'Lawyer', 'Manager', 'Nurse', 'Teacher'
]
const MONTHS_LBL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_LBL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const FRAUD_SAMPLE = {
  merchant: 'merchant_5', category: 'shopping_net', amt: '2300.00',
  gender: 'M', city_pop: '8500', age: '28', job: 'Driver',
  hour: '2', month: '11', day_of_week: '6'
}
const NORMAL_SAMPLE = {
  merchant: 'merchant_120', category: 'grocery_pos', amt: '45.50',
  gender: 'F', city_pop: '350000', age: '42', job: 'Teacher',
  hour: '14', month: '6', day_of_week: '2'
}
const EMPTY = {
  merchant: '', category: '', amt: '', gender: '',
  city_pop: '', age: '', job: '', hour: '', month: '', day_of_week: ''
}

// ── Category risk labels for UI hints ──────────────────────────
const CAT_RISK = {
  shopping_net: '🔴 High Risk', misc_net: '🔴 High Risk', travel: '🔴 High Risk',
  entertainment: '🟡 Medium', food_dining: '🟡 Medium', shopping_pos: '🟡 Medium',
  gas_transport: '🟢 Low', grocery_pos: '🟢 Low', health_fitness: '🟢 Low',
  home: '🟢 Low', kids_pets: '🟢 Low', misc_pos: '🟡 Medium', personal_care: '🟢 Low'
}

// ── Animated gauge via Chart.js doughnut ──────────────────────
function GaugeChart({ score, color }) {
  const canvasRef = useRef(null)
  const instRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    instRef.current?.destroy()
    instRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [color, 'rgba(255,255,255,0.04)'],
          borderWidth: 0,
          borderRadius: [4, 0],
          circumference: 210,
          rotation: -105,
        }]
      },
      options: {
        responsive: false,
        cutout: '76%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 1100, easing: 'easeOutQuart' }
      }
    })
    return () => instRef.current?.destroy()
  }, [score, color])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas ref={canvasRef} width={180} height={105} />
      <div style={{
        position: 'absolute', bottom: 6, left: '50%',
        transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none'
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 500,
          color, lineHeight: 1, animation: 'countUp .5s var(--ease) both',
          textShadow: `0 0 24px ${color}99`
        }}>
          {Math.round(score)}
        </div>
        <div style={{ fontSize: '.58rem', color: 'var(--t3)' }}>/ 100</div>
      </div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────
function F({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="lbl">{label}</label>
      {children}
      {error && (
        <span style={{ fontSize: '.67rem', color: 'var(--red2)', marginTop: 3 }}>
          {error}
        </span>
      )}
    </div>
  )
}

// ── Result panel ──────────────────────────────────────────────
function ResultPanel({ result }) {
  const {
    fraud_prediction, fraud_label, probability,
    risk_score, risk_level, risk_color, top_features, model_used
  } = result
  const pct = Math.round(probability * 100)
  const isFraud = fraud_prediction === 1

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'fadeUp .42s var(--ease) both'
    }}>

      {/* ── Verdict ── */}
      <div className="card card-shine" style={{
        padding: '20px 22px',
        background: isFraud ? 'rgba(239,68,68,.07)' : 'rgba(16,185,129,.07)',
        borderColor: isFraud ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)',
        boxShadow: isFraud
          ? '0 0 50px rgba(239,68,68,.12),0 8px 36px rgba(0,0,0,.4)'
          : '0 0 50px rgba(16,185,129,.1),0 8px 36px rgba(0,0,0,.4)',
        display: 'flex', alignItems: 'center', gap: 18
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: isFraud ? 'rgba(239,68,68,.18)' : 'rgba(16,185,129,.18)',
          border: `1px solid ${isFraud ? 'rgba(239,68,68,.35)' : 'rgba(16,185,129,.35)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn .35s ease both'
        }}>
          {isFraud
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--red2)" strokeWidth="2.2" strokeLinecap="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="var(--green2)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: '1.12rem', fontWeight: 600,
            color: risk_color, textShadow: `0 0 28px ${risk_color}66`,
            animation: 'countUp .4s .05s var(--ease) both'
          }}>
            {fraud_label}
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--t2)', marginTop: 3 }}>
            {risk_level} · Confidence: <strong style={{ color: 'var(--t1)' }}>{pct}%</strong>
          </div>
          <div style={{
            fontSize: '.68rem', color: 'var(--t3)', marginTop: 2,
            fontFamily: 'var(--mono)'
          }}>
            {model_used}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--mono)', fontSize: '2.2rem', fontWeight: 500,
          color: risk_color, textShadow: `0 0 32px ${risk_color}99`,
          animation: 'countUp .5s var(--spring) both'
        }}>
          {pct}%
        </div>
      </div>

      {/* ── Gauge + Features ── */}
      <div className="grid2">
        {/* Gauge */}
        <div className="card card-p" style={{ textAlign: 'center' }}>
          <div className="lbl" style={{ marginBottom: 10 }}>Risk Score</div>
          <GaugeChart score={risk_score} color={risk_color} />
          <div className="risk-badge" style={{
            marginTop: 10, color: risk_color,
            borderColor: `${risk_color}44`, background: `${risk_color}10`,
            boxShadow: `0 0 18px ${risk_color}20`
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: risk_color, animation: 'ring 2s infinite', flexShrink: 0
            }} />
            {risk_level}
          </div>
        </div>

        {/* Top 5 feature importances */}
        <div className="card card-p">
          <div className="lbl" style={{ marginBottom: 13 }}>Top Risk Signals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(top_features || []).map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                animation: `fadeUp .32s ${i * .06}s var(--ease) both`
              }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '.66rem',
                  color: 'var(--t3)', width: 68, flexShrink: 0
                }}>{f.name}</span>
                <div className="feat-track">
                  <div className="feat-fill" style={{
                    width: `${Math.min(100, (f.importance / (top_features[0]?.importance || 1)) * 100)}%`
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '.62rem',
                  color: 'var(--t3)', width: 34, textAlign: 'right'
                }}>{f.importance?.toFixed?.(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Probability bar ── */}
      <div className="card card-p">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 10
        }}>
          <span className="lbl" style={{ marginBottom: 0 }}>Fraud Probability</span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '.82rem',
            color: risk_color, fontWeight: 500,
            textShadow: `0 0 14px ${risk_color}88`
          }}>
            {(probability * 100).toFixed(2)}%
          </span>
        </div>
        <div className="prob-track">
          {[30, 70].map(p => (
            <div key={p} style={{
              position: 'absolute', left: `${p}%`, top: 0, bottom: 0,
              width: 1, background: 'rgba(255,255,255,.14)', zIndex: 1
            }} />
          ))}
          <div className="prob-fill" style={{
            width: `${pct}%`,
            backgroundPositionX: `${100 - pct}%`
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 7, fontSize: '.62rem', color: 'var(--t3)',
          fontFamily: 'var(--mono)'
        }}>
          <span>0%</span>
          <span style={{ color: 'var(--green2)' }}>◂ Low · 30%</span>
          <span style={{ color: 'var(--amber2)' }}>Medium · 70% ▸</span>
          <span style={{ color: 'var(--red2)' }}>High</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── Recommendation ── */}
      <div className="card card-p" style={{
        background: 'rgba(79,142,247,.04)',
        borderColor: 'rgba(79,142,247,.2)'
      }}>
        <div style={{
          display: 'flex', gap: 11, alignItems: 'flex-start'
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="var(--blue2)" strokeWidth="2" strokeLinecap="round"
            style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            <div style={{
              fontSize: '.74rem', fontWeight: 600,
              color: 'var(--blue2)', marginBottom: 5
            }}>
              AI Recommendation
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--t2)', lineHeight: 1.72 }}>
              {isFraud
                ? 'Block this transaction immediately. Flag the account for manual review. Contact the cardholder via registered mobile to verify recent activity before re-enabling card access.'
                : 'Transaction appears legitimate based on amount, timing, purchase category and customer profile. Proceed with standard authorization flow.'
              }
            </div>
          </div>
        </div>

        {/* Risk level reference strip */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 14,
          padding: '10px 12px', background: 'var(--glass)',
          borderRadius: 8, border: '1px solid var(--rim)'
        }}>
          {[
            ['🟢', 'Low Risk', '< 30%', 'Auto-approve'],
            ['🟡', 'Medium Risk', '30–70%', 'Request OTP'],
            ['🔴', 'High Risk', '> 70%', 'Block + Alert'],
          ].map(([ico, lvl, rng, act]) => (
            <div key={lvl} style={{
              flex: 1, textAlign: 'center', fontSize: '.68rem',
              borderRight: lvl !== 'High Risk' ? '1px solid var(--rim)' : 'none',
              paddingRight: lvl !== 'High Risk' ? 8 : 0
            }}>
              <div style={{ fontSize: '.9rem', marginBottom: 2 }}>{ico}</div>
              <div style={{ color: 'var(--t1)', fontWeight: 500 }}>{lvl}</div>
              <div style={{ color: 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '.64rem' }}>{rng}</div>
              <div style={{ color: 'var(--t2)', marginTop: 1 }}>{act}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Analyzer component ────────────────────────────────────
export default function Analyzer({ options, apiOnline, onApiStatusChange }) {
  const [fields, setFields] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const { toast, show } = useToast()

  // Build merchant list from options or fallback
  const merchants = options?.merchant ||
    Array.from({ length: 50 }, (_, i) => `merchant_${i + 1}`)

  const set = (k, v) => {
    setFields(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const fill = (sample) => {
    setFields({ ...sample })
    setErrors({})
    setResult(null)
    show('Sample transaction loaded', 'info')
  }

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!fields.amt || isNaN(parseFloat(fields.amt)) || parseFloat(fields.amt) <= 0)
      e.amt = 'Enter a valid positive amount'
    if (!fields.category) e.category = 'Select a category'
    if (!fields.hour && fields.hour !== '0' && fields.hour !== 0)
      e.hour = 'Enter hour (0–23)'
    else if (parseInt(fields.hour) < 0 || parseInt(fields.hour) > 23)
      e.hour = 'Hour must be 0–23'
    if (!fields.age || parseInt(fields.age) < 1)
      e.age = 'Enter a valid age'
    if (!fields.city_pop || parseInt(fields.city_pop) < 1)
      e.city_pop = 'Enter city population'
    return e
  }

  // ── Submit ─────────────────────────────────────────────────
  const analyze = async () => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      show('Please fix the highlighted fields', 'warn')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      if (!apiOnline) {
        show('Checking Flask API...', 'info')
        const health = await api.getHealth()
        const online = !!health.model_loaded
        onApiStatusChange?.(online)

        if (!online) {
          throw new Error('Flask is running, but the ML model is not loaded. Check backend/model files.')
        }
      }

      const payload = {
        merchant: fields.merchant || 'merchant_1',
        category: fields.category,
        amt: parseFloat(fields.amt),
        gender: fields.gender || 'M',
        city_pop: parseInt(fields.city_pop) || 50000,
        age: parseInt(fields.age) || 30,
        job: fields.job || 'Engineer',
        hour: parseInt(fields.hour),
        month: parseInt(fields.month) || 6,
        day_of_week: parseInt(fields.day_of_week) ?? 2,
      }

      const data = await api.predict(payload)
      onApiStatusChange?.(true)
      setResult(data)
      show(
        data.fraud_prediction === 1
          ? '⚠ Fraud risk detected — review immediately'
          : '✓ Transaction appears legitimate',
        data.fraud_prediction === 1 ? 'danger' : 'success'
      )
    } catch (err) {
      const message = err?.message || 'Unknown API error'
      const isConnectionError =
        /Failed to fetch|NetworkError|Load failed|Cannot reach Flask|Start Flask|Make sure Flask is running/i.test(message)

      if (isConnectionError) onApiStatusChange?.(false)

      show(
        isConnectionError
          ? 'Prediction failed: start Flask with python3 backend/app.py, then try again.'
          : 'Prediction failed: ' + message,
        'danger'
      )
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setFields(EMPTY)
    setErrors({})
    setResult(null)
    show('Form cleared', 'info')
  }

  // ── Derived UI hints ───────────────────────────────────────
  const hourNum = parseInt(fields.hour)
  const hourHint = !isNaN(hourNum)
    ? (hourNum >= 0 && hourNum <= 4) ? '⚠ Late night — high risk window'
      : (hourNum >= 5 && hourNum <= 8) ? '🟡 Early morning'
        : (hourNum >= 9 && hourNum <= 17) ? '🟢 Business hours — lower risk'
          : (hourNum >= 18 && hourNum <= 21) ? '🟡 Evening'
            : '⚠ Night — elevated risk'
    : ''

  const amtNum = parseFloat(fields.amt)
  const amtHint = !isNaN(amtNum)
    ? amtNum >= 2000 ? '⚠ Very high amount'
      : amtNum >= 1000 ? '🟡 High amount'
        : amtNum >= 100 ? '🟢 Moderate amount'
          : '🟢 Low amount'
    : ''

  return (
    <div>
      <div className="ph fu">
        <h1 className="ph-title">
          Transaction <span className="grad">Risk Analyzer</span>
        </h1>
        <p className="ph-sub">
          Enter real, understandable transaction details — the Random Forest model
          predicts fraud probability and risk level in real-time.
        </p>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>

        {/* ── LEFT: Form ──────────────────────────────────── */}
        <div className="card card-shine fu-1" style={{ padding: 26 }}>

          {/* Form header */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 22
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--display)', fontWeight: 600, fontSize: '.96rem'
              }}>Transaction Details</div>
              <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 2 }}>
                All fields validated before sending to API
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => fill(FRAUD_SAMPLE)}
                style={{
                  color: 'var(--red2)', borderColor: 'rgba(239,68,68,.35)',
                  background: 'rgba(239,68,68,.07)'
                }}>
                ⚠ Fraud Sample
              </button>
              <button className="btn btn-ghost" onClick={() => fill(NORMAL_SAMPLE)}
                style={{
                  color: 'var(--green2)', borderColor: 'rgba(16,185,129,.35)',
                  background: 'rgba(16,185,129,.07)'
                }}>
                ✓ Normal Sample
              </button>
            </div>
          </div>

          {/* Amount — full width */}
          <div style={{ marginBottom: 13 }}>
            <F label="Transaction Amount (₹)" error={errors.amt}>
              <input className={`inp${errors.amt ? ' inp-err' : ''}`}
                value={fields.amt}
                onChange={e => set('amt', e.target.value)}
                placeholder="e.g. 2300.00"
                type="number" step="0.01" min="0" />
            </F>
            {amtHint && !errors.amt && (
              <div style={{ fontSize: '.67rem', color: 'var(--t3)', marginTop: 3 }}>
                {amtHint}
              </div>
            )}
          </div>

          {/* Category + Hour */}
          <div className="grid2" style={{ gap: 12, marginBottom: 13 }}>
            <F label="Purchase Category" error={errors.category}>
              <select className={`inp${errors.category ? ' inp-err' : ''}`}
                value={fields.category}
                onChange={e => set('category', e.target.value)}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                    {CAT_RISK[c] ? `  ${CAT_RISK[c]}` : ''}
                  </option>
                ))}
              </select>
            </F>
            <F label="Hour of Day (0–23)" error={errors.hour}>
              <input className={`inp${errors.hour ? ' inp-err' : ''}`}
                value={fields.hour}
                onChange={e => set('hour', e.target.value)}
                placeholder="e.g. 2 = 2 AM"
                type="number" min="0" max="23" />
              {hourHint && !errors.hour && (
                <div style={{ fontSize: '.67rem', color: 'var(--t3)', marginTop: 3 }}>
                  {hourHint}
                </div>
              )}
            </F>
          </div>

          {/* Month + Day of week */}
          <div className="grid2" style={{ gap: 12, marginBottom: 13 }}>
            <F label="Month">
              <select className="inp" value={fields.month}
                onChange={e => set('month', e.target.value)}>
                <option value="">— Select —</option>
                {MONTHS_LBL.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </F>
            <F label="Day of Week">
              <select className="inp" value={fields.day_of_week}
                onChange={e => set('day_of_week', e.target.value)}>
                <option value="">— Select —</option>
                {DAYS_LBL.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </F>
          </div>

          {/* Gender + Age */}
          <div className="grid2" style={{ gap: 12, marginBottom: 13 }}>
            <F label="Gender">
              <select className="inp" value={fields.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="">— Select —</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </F>
            <F label="Age" error={errors.age}>
              <input className={`inp${errors.age ? ' inp-err' : ''}`}
                value={fields.age}
                onChange={e => set('age', e.target.value)}
                placeholder="e.g. 28"
                type="number" min="1" max="110" />
            </F>
          </div>

          {/* Job + City pop */}
          <div className="grid2" style={{ gap: 12, marginBottom: 13 }}>
            <F label="Occupation">
              <select className="inp" value={fields.job}
                onChange={e => set('job', e.target.value)}>
                <option value="">— Select —</option>
                {JOBS.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </F>
            <F label="City Population" error={errors.city_pop}>
              <input className={`inp${errors.city_pop ? ' inp-err' : ''}`}
                value={fields.city_pop}
                onChange={e => set('city_pop', e.target.value)}
                placeholder="e.g. 25000"
                type="number" min="1" />
              {fields.city_pop && !errors.city_pop && (
                <div style={{ fontSize: '.67rem', color: 'var(--t3)', marginTop: 3 }}>
                  {parseInt(fields.city_pop) < 20000
                    ? '⚠ Small city — slightly elevated risk'
                    : '🟢 Large city'}
                </div>
              )}
            </F>
          </div>

          {/* Merchant ID */}
          <div style={{ marginBottom: 22 }}>
            <F label="Merchant ID">
              <select className="inp" value={fields.merchant}
                onChange={e => set('merchant', e.target.value)}>
                <option value="">— Select or leave blank —</option>
                {merchants.slice(0, 50).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </F>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '13px' }}
              onClick={analyze}
              disabled={loading}>
              {loading ? (
                <>
                  <svg className="spin" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  Analyze Transaction
                </>
              )}
            </button>
            <button className="btn btn-sec" onClick={clear}>Clear</button>
          </div>

          {/* API status warning */}
          {!apiOnline && (
            <div style={{
              marginTop: 14, padding: '10px 13px',
              background: 'rgba(245,158,11,.07)',
              border: '1px solid rgba(245,158,11,.3)',
              borderRadius: 9, fontSize: '.75rem',
              color: 'var(--amber2)', lineHeight: 1.6
            }}>
              ⚠ Flask API is offline. Start it with:
              <code style={{
                display: 'block', marginTop: 4,
                fontFamily: 'var(--mono)', color: 'var(--t1)',
                background: 'var(--glass)', padding: '3px 7px',
                borderRadius: 5, fontSize: '.72rem'
              }}>
                python backend/app.py
              </code>
              Then click Analyze Transaction again. The app also rechecks automatically.
            </div>
          )}

          {/* Fraud pattern guide */}
          <div style={{
            marginTop: 16, background: 'var(--glass)',
            border: '1px solid var(--rim)', borderRadius: 10, padding: '12px 14px'
          }}>
            <div className="lbl" style={{ marginBottom: 9 }}>🔍 Fraud Pattern Guide</div>
            {[
              ['High amount (₹1500+)', 'var(--red2)'],
              ['Late night transaction (0–4 AM)', 'var(--red2)'],
              ['shopping_net / misc_net category', 'var(--amber2)'],
              ['Small city (< 20,000 people)', 'var(--amber2)'],
              ['Grocery / business hours', 'var(--green2)'],
            ].map(([hint, color]) => (
              <div key={hint} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 5, fontSize: '.74rem'
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: color, flexShrink: 0,
                  boxShadow: `0 0 6px ${color}`
                }} />
                <span style={{ color: 'var(--t2)' }}>{hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Result / idle ─────────────────────────── */}
        <div>
          {!result && !loading && (
            <div className="empty fu-2">
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none"
                stroke="var(--blue)" strokeWidth="1.1" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p>
                Load a sample or fill in the form,
                then click <strong style={{ color: 'var(--t2)' }}>Analyze Transaction</strong>
                to get an AI risk assessment.
              </p>
            </div>
          )}

          {loading && (
            <div className="card card-p fu" style={{ textAlign: 'center' }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                border: '2px solid var(--rim)', borderTop: '2px solid var(--blue)',
                animation: 'spin .85s linear infinite', margin: '0 auto 18px',
                boxShadow: '0 0 24px rgba(79,142,247,.3)'
              }} />
              <div style={{ color: 'var(--t2)', fontSize: '.88rem' }}>
                Running Random Forest model…
              </div>
              <div style={{
                color: 'var(--t3)', fontSize: '.72rem',
                marginTop: 6, fontFamily: 'var(--mono)'
              }}>
                100 decision trees voting
              </div>
            </div>
          )}

          {result && !loading && <ResultPanel result={result} />}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
