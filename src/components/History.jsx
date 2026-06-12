// History.jsx — Prediction history log with clear + CSV export
import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { useToast, Toast } from './useToast.jsx'

function RiskPill({ level }) {
  const map = {
    'Low Risk': { bg: 'rgba(16,185,129,.12)', color: '#34d399', border: 'rgba(16,185,129,.3)' },
    'Medium Risk': { bg: 'rgba(245,158,11,.12)', color: '#fbbf24', border: 'rgba(245,158,11,.3)' },
    'High Risk': { bg: 'rgba(239,68,68,.12)', color: '#f87171', border: 'rgba(239,68,68,.3)' },
  }
  const s = map[level] || map['Low Risk']
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 99, fontSize: '.68rem', fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>
      {level}
    </span>
  )
}

export default function History() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')   // all | fraud | legit
  const { toast, show } = useToast()

  const load = () => {
    setLoading(true)
    api.getHistory()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const clearAll = async () => {
    try {
      await api.clearHistory()
      setRows([])
      show('History cleared', 'success')
    } catch {
      show('Failed to clear history', 'danger')
    }
  }

  const exportCSV = () => {
    if (!rows.length) { show('No data to export', 'warn'); return }
    const headers = ['#', 'Timestamp', 'Amount', 'Category', 'Hour', 'Fraud', 'Risk Level', 'Risk Score', 'Probability']
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.id, r.timestamp, r.amt, r.category, r.hour,
        r.fraud ? 'FRAUD' : 'LEGIT', r.risk_level, r.risk_score, r.probability
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fraudshield_history_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    show('CSV exported', 'success')
  }

  const filtered = rows.filter(r => {
    if (filter === 'fraud') return r.fraud === 1
    if (filter === 'legit') return r.fraud === 0
    return true
  })

  const fraudCount = rows.filter(r => r.fraud === 1).length
  const legitCount = rows.filter(r => r.fraud === 0).length
  const avgScore = rows.length
    ? (rows.reduce((s, r) => s + r.risk_score, 0) / rows.length).toFixed(1)
    : '—'

  const fmt = iso => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      }) + ' ' + d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return iso }
  }

  return (
    <div>
      <div className="ph fu">
        <h1 className="ph-title">
          Prediction <span className="grad">History</span>
        </h1>
        <p className="ph-sub">
          All transactions analyzed in this session — last 50 predictions
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid4 fu-1" style={{ marginBottom: 20 }}>
        {[
          { lbl: 'Total Analyzed', val: rows.length, color: '#4f8ef7' },
          { lbl: 'Fraud Detected', val: fraudCount, color: '#ef4444' },
          { lbl: 'Legitimate', val: legitCount, color: '#10b981' },
          { lbl: 'Avg Risk Score', val: avgScore, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={s.lbl} className="sc" style={{ animationDelay: `${i * .06}s` }}>
            <div className="sc-icon" style={{ background: `${s.color}1e` }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                background: s.color, opacity: .8
              }} />
            </div>
            <div>
              <div className="sc-val">{s.val}</div>
              <div className="sc-lbl">{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card card-p fu-2" style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}>
          {/* Filter tabs */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'var(--glass)', border: '1px solid var(--rim)',
            borderRadius: 10, padding: 3
          }}>
            {[['all', 'All'], ['fraud', 'Fraud Only'], ['legit', 'Legitimate']].map(([k, lbl]) => (
              <button key={k}
                style={{
                  background: filter === k ? 'var(--glass-hi)' : 'none',
                  border: 'none', borderRadius: 7, padding: '5px 14px',
                  fontSize: '.78rem', fontWeight: 500, cursor: 'pointer',
                  color: filter === k ? 'var(--t1)' : 'var(--t2)',
                  transition: 'all .2s'
                }}
                onClick={() => setFilter(k)}>
                {lbl}
                <span style={{
                  marginLeft: 6, padding: '1px 6px',
                  background: 'var(--glass)', borderRadius: 99,
                  fontSize: '.65rem', color: 'var(--t3)'
                }}>
                  {k === 'all' ? rows.length
                    : k === 'fraud' ? fraudCount : legitCount}
                </span>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
            <button className="btn btn-ghost" onClick={exportCSV}>
              ↓ Export CSV
            </button>
            <button className="btn btn-danger" onClick={clearAll}>
              ✕ Clear All
            </button>
          </div>
        </div>
      </div>

      {/* History list */}
      <div className="card card-shine fu-3" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--rim)',
              borderTop: '2px solid var(--blue)', animation: 'spin .8s linear infinite',
              margin: '0 auto 12px'
            }} />
            Loading history…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: 60, textAlign: 'center', color: 'var(--t3)', fontSize: '.86rem'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: .3 }}>📋</div>
            {rows.length === 0
              ? 'No predictions yet. Go to the Analyzer tab and analyze a transaction.'
              : 'No results match the current filter.'
            }
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  {['#', 'Time', 'Amount', 'Category', 'Hour', 'Verdict', 'Risk Level', 'Score', 'Probability'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--t3)' }}>{row.id}</td>
                    <td style={{ fontSize: '.72rem', whiteSpace: 'nowrap' }}>
                      {fmt(row.timestamp)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        ₹{parseFloat(row.amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: 'var(--glass)', border: '1px solid var(--rim)',
                        borderRadius: 5, padding: '2px 7px',
                        fontSize: '.71rem', color: 'var(--t2)'
                      }}>
                        {(row.category || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.hour}:00
                      {(row.hour >= 0 && row.hour <= 4) && (
                        <span style={{
                          marginLeft: 4, fontSize: '.62rem', color: 'var(--amber2)'
                        }}>⚠</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 9px', borderRadius: 99,
                        fontSize: '.69rem', fontWeight: 600,
                        background: row.fraud
                          ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
                        color: row.fraud ? '#f87171' : '#34d399',
                        border: `1px solid ${row.fraud
                          ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`
                      }}>
                        {row.fraud ? '⚠ FRAUD' : '✓ LEGIT'}
                      </span>
                    </td>
                    <td><RiskPill level={row.risk_level} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{
                          width: 40, height: 5, background: 'rgba(255,255,255,.06)',
                          borderRadius: 99, overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${row.risk_score}%`,
                            background: row.risk_score >= 70 ? '#ef4444'
                              : row.risk_score >= 30 ? '#f59e0b' : '#10b981'
                          }} />
                        </div>
                        <span style={{ color: 'var(--t2)', minWidth: 28 }}>
                          {row.risk_score}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      color: row.probability >= 0.7 ? 'var(--red2)'
                        : row.probability >= 0.3 ? 'var(--amber2)' : 'var(--green2)'
                    }}>
                      {(row.probability * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  )
}
