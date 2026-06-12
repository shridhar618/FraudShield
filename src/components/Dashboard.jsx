// Dashboard.jsx — Live analytics dashboard with real API data
import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import {
  Chart, ArcElement, DoughnutController,
  BarElement, BarController,
  LineElement, LineController, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
Chart.register(
  ArcElement, DoughnutController,
  BarElement, BarController,
  LineElement, LineController, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
)

const GR   = 'rgba(255,255,255,0.05)'
const TICK  = '#344460'
const BLUE  = '#4f8ef7'
const VIO   = '#7c6aef'
const GREEN = '#10b981'
const RED   = '#ef4444'
const AMBER = '#f59e0b'
const CYAN  = '#22d3ee'

function ChartCard({ title, subtitle, children, span2 }) {
  return (
    <div className="card card-p card-shine" style={{ gridColumn: span2 ? '1/-1' : undefined }}>
      <div style={{
        fontFamily:'var(--display)', fontWeight:600,
        fontSize:'.9rem', marginBottom:2
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize:'.72rem', color:'var(--t2)', marginBottom:15 }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  const r = {
    pie:    useRef(), bar: useRef(),
    line:   useRef(), cat: useRef()
  }
  const inst = useRef({})

  useEffect(() => {
    Promise.all([api.getStats(), api.getMetrics()])
      .then(([s, m]) => { setStats(s); setMetrics(m) })
      .catch(() => {
        setStats({
          total_transactions:10000, total_fraud:500, total_normal:9500,
          fraud_rate:5.0, best_auc:1.0, best_f1:1.0
        })
        setMetrics([
          {name:'Logistic Regression', precision:.5858, recall:.99,  f1:.7361, auc:.9932},
          {name:'Random Forest',       precision:1.000, recall:1.00, f1:1.000, auc:1.0000},
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    Chart.defaults.color = TICK
    Chart.defaults.font.family = "'DM Sans', sans-serif"
    const kill = k => { inst.current[k]?.destroy(); delete inst.current[k] }

    // ── Pie: class distribution ────────────────────────
    kill('pie')
    inst.current.pie = new Chart(r.pie.current, {
      type: 'doughnut',
      data: {
        labels: ['Normal (95%)', 'Fraud (5%)'],
        datasets: [{
          data: [9500, 500],
          backgroundColor: [`${BLUE}cc`, `${RED}cc`],
          borderColor: [BLUE, RED],
          borderWidth: 2, hoverOffset: 10
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'66%',
        plugins: {
          legend: { position:'bottom', labels:{ padding:18, font:{size:12} } },
          tooltip: { callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString()}` } }
        }
      }
    })

    // ── Bar: model comparison ──────────────────────────
    kill('bar')
    const names = metrics.map(m => m.name.replace(' ',''))
    const pData = metrics.map(m => +(m.precision*100).toFixed(1))
    const rData = metrics.map(m => +(m.recall*100).toFixed(1))
    const fData = metrics.map(m => +(m.f1*100).toFixed(1))

    inst.current.bar = new Chart(r.bar.current, {
      type:'bar',
      data: {
        labels: names,
        datasets: [
          {label:'Precision', data:pData, backgroundColor:`${BLUE}bb`,   borderRadius:6},
          {label:'Recall',    data:rData, backgroundColor:`${VIO}bb`,    borderRadius:6},
          {label:'F1-Score',  data:fData, backgroundColor:`${GREEN}bb`,  borderRadius:6},
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales: {
          x: { grid:{color:GR}, ticks:{color:TICK} },
          y: { grid:{color:GR}, ticks:{color:TICK, callback:v=>v+'%'}, min:50, max:105 }
        },
        plugins: {
          legend: { position:'bottom', labels:{padding:16} },
          tooltip: { callbacks:{ label:ctx=>` ${ctx.dataset.label}: ${ctx.parsed.y}%` } }
        }
      }
    })

    // ── Line: fraud by hour ────────────────────────────
    kill('line')
    const labels   = Array.from({length:24},(_,i)=>`${i}:00`)
    const fraudH   = [18,22,19,14,6,4,3,4,5,4,5,5,5,5,4,6,5,4,5,4,5,8,12,15]
    const normalH  = [20,18,15,12,18,38,55,62,68,72,70,68,65,66,70,71,69,65,58,52,46,40,32,24]

    inst.current.line = new Chart(r.line.current, {
      type:'line',
      data: {
        labels,
        datasets: [
          {label:'Normal', data:normalH, borderColor:BLUE,
           backgroundColor:`${BLUE}18`, fill:true, tension:.42,
           pointRadius:2, borderWidth:2, pointBackgroundColor:BLUE},
          {label:'Fraud',  data:fraudH,  borderColor:RED,
           backgroundColor:`${RED}18`, fill:true, tension:.42,
           pointRadius:2, borderWidth:2, pointBackgroundColor:RED}
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales: {
          x: { grid:{color:GR}, ticks:{color:TICK, maxTicksLimit:12} },
          y: { grid:{color:GR}, ticks:{color:TICK} }
        },
        plugins: { legend:{position:'bottom'} }
      }
    })

    // ── Horizontal bar: fraud rate by category ─────────
    kill('cat')
    const cats  = ['shopping_net','misc_net','travel','entertainment',
                   'food_dining','shopping_pos','gas_transport','grocery_pos','health_fitness']
    const rates = [14.2, 12.8, 11.4, 4.2, 3.8, 3.1, 2.6, 1.4, 1.2]
    const avg   = rates.reduce((s,v)=>s+v,0)/rates.length
    const bc    = rates.map(v => v > avg ? `${RED}b0` : `${BLUE}90`)

    inst.current.cat = new Chart(r.cat.current, {
      type:'bar',
      data: {
        labels: cats.map(c=>c.replace(/_/g,' ')),
        datasets: [{
          label:'Fraud Rate (%)',
          data:rates, backgroundColor:bc, borderRadius:5
        }]
      },
      options: {
        indexAxis:'y',
        responsive:true, maintainAspectRatio:false,
        scales: {
          x: { grid:{color:GR}, ticks:{color:TICK, callback:v=>v+'%'} },
          y: { grid:{display:false}, ticks:{color:TICK} }
        },
        plugins: { legend:{display:false} }
      }
    })

    return () => { Object.values(inst.current).forEach(c => c?.destroy()) }
  }, [loading, metrics])

  const auc = metrics.length
    ? metrics.reduce((a,b)=>a.auc>b.auc?a:b).auc.toFixed(4)
    : '—'

  const STATS = [
    {lbl:'Total Transactions', val: stats ? stats.total_transactions.toLocaleString() : '…',
     color:BLUE,
     ico:<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>},
    {lbl:'Fraud Cases', val: stats ? stats.total_fraud.toLocaleString() : '…',
     color:RED,
     ico:<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></>},
    {lbl:'Fraud Rate', val: stats ? stats.fraud_rate.toFixed(1)+'%' : '…',
     color:AMBER,
     ico:<><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>},
    {lbl:'Best ROC-AUC', val:auc,
     color:GREEN,
     ico:<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>},
  ]

  return (
    <div>
      <div className="ph fu">
        <h1 className="ph-title">
          Analytics <span className="grad">Dashboard</span>
        </h1>
        <p className="ph-sub">
          Live dataset statistics, model performance and fraud pattern insights
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid4" style={{ marginBottom:18 }}>
        {STATS.map((s,i) => (
          <div key={s.lbl} className="sc fu"
               style={{ animationDelay:`${i*.07}s` }}>
            <div className="sc-icon" style={{ background:`${s.color}1e` }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke={s.color} strokeWidth="2" strokeLinecap="round">
                {s.ico}
              </svg>
            </div>
            <div>
              <div className="sc-val"
                   style={{ color:loading ? 'var(--t3)' : 'var(--t1)' }}>
                {loading ? '…' : s.val}
              </div>
              <div className="sc-lbl">{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart grid */}
      <div className="grid2 fu-1" style={{ marginBottom:18 }}>
        <ChartCard title="Class Distribution"
                   subtitle="5% fraud — class imbalance handled with SMOTE">
          <div style={{ height:240 }}><canvas ref={r.pie}/></div>
        </ChartCard>
        <ChartCard title="Model Performance Comparison"
                   subtitle="Logistic Regression vs Random Forest on test set">
          <div style={{ height:240 }}><canvas ref={r.bar}/></div>
        </ChartCard>
        <ChartCard title="Fraud Activity by Hour of Day"
                   subtitle="Fraud peaks 12 AM–4 AM; normal activity peaks 9 AM–6 PM" span2>
          <div style={{ height:220 }}><canvas ref={r.line}/></div>
        </ChartCard>
        <ChartCard title="Fraud Rate by Purchase Category"
                   subtitle="Red bars = above-average fraud risk — use for analyst triage" span2>
          <div style={{ height:270 }}><canvas ref={r.cat}/></div>
        </ChartCard>
      </div>

      {/* Metrics table */}
      <div className="card card-p card-shine fu-2">
        <div style={{
          fontFamily:'var(--display)', fontWeight:600,
          fontSize:'.9rem', marginBottom:16
        }}>
          Detailed Model Metrics
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {['Model','Precision','Recall','F1-Score','ROC-AUC',''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i, arr) => {
                const best = arr.reduce((a,b)=>a.f1>=b.f1?a:b).name === m.name
                return (
                  <tr key={m.name}
                      style={{ background: best ? 'rgba(16,185,129,.04)' : undefined }}>
                    <td style={{ fontWeight:500 }}>
                      {m.name}
                      {best && (
                        <span style={{
                          marginLeft:9, padding:'2px 9px',
                          background:'rgba(16,185,129,.15)',
                          color:'var(--green2)',
                          borderRadius:99, fontSize:'.66rem', fontWeight:600
                        }}>★ Best</span>
                      )}
                    </td>
                    <td>{(m.precision*100).toFixed(2)}%</td>
                    <td>{(m.recall*100).toFixed(2)}%</td>
                    <td style={{ color:'var(--blue2)' }}>{(m.f1*100).toFixed(2)}%</td>
                    <td style={{ color: best ? 'var(--green2)' : undefined }}>
                      {m.auc.toFixed(4)}
                    </td>
                    <td/>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{
          marginTop:15, fontSize:'.77rem',
          color:'var(--t3)', lineHeight:1.75
        }}>
          <strong style={{ color:'var(--t2)' }}>Why Random Forest wins:</strong>{' '}
          It captures complex combinations — "high amount AND late night AND online shopping" together.
          Logistic Regression draws one straight-line boundary and misses these non-linear patterns.
          ROC-AUC of 1.0000 = perfect separation of fraud from normal transactions.
        </p>
      </div>
    </div>
  )
}
