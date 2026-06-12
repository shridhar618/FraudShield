// UseCases.jsx — Real-world applications showcase
const CASES = [
  { e:'💳', c:'#ef4444', t:'Credit & Debit Card Fraud',
    who:'SBI, HDFC, ICICI, Axis, Visa, Mastercard',
    impact:'$32 billion lost to card fraud globally in 2023',
    how:'Every swipe triggers a real-time ML check. Risk above threshold → block or send OTP.',
    ex:'"Your card was blocked for a suspicious transaction at 3 AM in London" — this system.' },
  { e:'📱', c:'#4f8ef7', t:'UPI & Mobile Payments',
    who:'NPCI, Google Pay, PhonePe, Paytm, Amazon Pay',
    impact:'India processes 10 billion+ UPI transactions monthly',
    how:'Real-time scoring on every transfer. Phishing links and social-engineering patterns caught.',
    ex:'"KBC lottery" scam — victim told to send ₹500 to claim prize — flagged instantly.' },
  { e:'🛍️', c:'#7c6aef', t:'E-Commerce Fraud',
    who:'Amazon, Flipkart, Meesho, Shopify merchants',
    impact:'Reduces chargebacks and fake "item not received" claims',
    how:'New account + luxury item + unverified address → auto-flagged before dispatch.',
    ex:'Brand-new account ordering 10 iPhones for delivery to an unverified address.' },
  { e:'🏦', c:'#10b981', t:'Net Banking & Wire Transfers',
    who:'All scheduled banks, NEFT / RTGS / IMPS networks',
    impact:'Prevents unauthorized fund transfers and account takeovers',
    how:'New beneficiary + large amount + midnight = multiple risk flags → hold for review.',
    ex:'Adding a payee at 2 AM and immediately wiring ₹2 lakhs — blocked pending call-back.' },
  { e:'🏥', c:'#f59e0b', t:'Health Insurance Fraud',
    who:'Star Health, HDFC ERGO, Bajaj Allianz, United Health',
    impact:'India loses ₹45,000 crore per year to insurance fraud',
    how:'Duplicate claims, inflated amounts, impossible multi-hospital claims on same day.',
    ex:'Claiming surgery was performed in 3 hospitals simultaneously — caught by anomaly detection.' },
  { e:'🏛️', c:'#22d3ee', t:'GST & Tax Fraud',
    who:'GSTN, Income Tax Dept, ED, EPFO',
    impact:'Fake GST invoices cost thousands of crores in revenue loss annually',
    how:'Circular money flows through shell companies detected via transaction network analysis.',
    ex:'₹50 cr of fake invoices cycling through 12 shell firms — flagged by graph pattern.' },
]

const STATS = [
  { v:'$32B',  d:'Lost to card fraud globally per year',      c:'#ef4444' },
  { v:'10B+',  d:'Monthly UPI transactions in India',          c:'#4f8ef7' },
  { v:'<50ms', d:'API response time per prediction',           c:'#10b981' },
  { v:'1.000', d:'ROC-AUC achieved by Random Forest',          c:'#7c6aef' },
  { v:'100%',  d:'F1-Score on test set (this dataset)',        c:'#f59e0b' },
  { v:'$38B',  d:'Global fraud-detection AI market by 2026',   c:'#22d3ee' },
]

export default function UseCases() {
  return (
    <div>
      <div className="ph fu">
        <h1 className="ph-title">
          Real-World <span className="grad">Use Cases</span>
        </h1>
        <p className="ph-sub">
          Where this exact technology is deployed today — use these examples in your viva!
        </p>
      </div>

      {/* Case cards */}
      <div className="grid2 fu-1" style={{ marginBottom:22 }}>
        {CASES.map((c,i) => (
          <div key={i} className="card card-shine"
            style={{
              padding:22,
              borderTop:`2px solid ${c.c}`,
              transition:'transform .24s var(--spring),box-shadow .24s',
              animationDelay:`${i*.06}s`
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform='translateY(-4px)'
              e.currentTarget.style.boxShadow=`0 18px 44px rgba(0,0,0,.38),0 0 44px ${c.c}14`
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform=''
              e.currentTarget.style.boxShadow=''
            }}>

            {/* Title row */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:`${c.c}18`, border:`1px solid ${c.c}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.2rem'
              }}>{c.e}</div>
              <div style={{
                fontFamily:'var(--display)', fontWeight:600,
                fontSize:'.94rem', letterSpacing:'-.01em'
              }}>{c.t}</div>
            </div>

            {/* Detail rows */}
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {[
                ['Who',    c.who,    'var(--t2)'],
                ['Impact', c.impact,  c.c       ],
                ['How',    c.how,    'var(--t2)'],
              ].map(([lbl,val,col])=>(
                <div key={lbl} style={{ display:'flex', gap:10 }}>
                  <span style={{
                    fontSize:'.65rem', fontWeight:600, color:'var(--t3)',
                    textTransform:'uppercase', letterSpacing:'.07em',
                    width:44, flexShrink:0, paddingTop:2
                  }}>{lbl}</span>
                  <span style={{ fontSize:'.79rem', color:col, lineHeight:1.65 }}>{val}</span>
                </div>
              ))}
              {/* Example quote */}
              <div style={{
                background:`${c.c}0a`, border:`1px solid ${c.c}28`,
                borderLeft:`3px solid ${c.c}`,
                borderRadius:'0 8px 8px 0', padding:'8px 12px', marginTop:4
              }}>
                <span style={{ fontSize:'.74rem', color:'var(--t2)', fontStyle:'italic', lineHeight:1.65 }}>
                  💬 {c.ex}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature → fraud indicator mapping */}
      <div className="card card-p card-shine fu-2" style={{ marginBottom:20 }}>
        <div style={{
          fontFamily:'var(--display)', fontWeight:600,
          fontSize:'.9rem', marginBottom:16
        }}>
          🔗 How Dataset Features Map to Real Fraud Signals
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            {f:'amt (high)',        m:'Large purchase → higher fraud risk',           c:'var(--red2)'   },
            {f:'hour 0–4',          m:'Late-night transaction → very suspicious',      c:'var(--red2)'   },
            {f:'shopping_net',      m:'Online shopping → highest fraud category',     c:'var(--red2)'   },
            {f:'city_pop (low)',     m:'Small town + large online order → flag',       c:'var(--amber2)' },
            {f:'day_of_week 5–6',   m:'Weekend transactions see more fraud',          c:'var(--amber2)' },
            {f:'month 11–12',       m:'Holiday season → fraud spike',                 c:'var(--amber2)' },
            {f:'amt (low)',          m:'Small amounts → typically safe',              c:'var(--green2)' },
            {f:'grocery_pos',       m:'Grocery store → lowest fraud rate',            c:'var(--green2)' },
            {f:'hour 9–17',         m:'Business hours → lowest risk window',         c:'var(--green2)' },
          ].map(item => (
            <div key={item.f} style={{
              background:'rgba(255,255,255,.025)', border:'1px solid var(--rim)',
              borderRadius:9, padding:'10px 12px', transition:'all .2s'
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.background='rgba(255,255,255,.04)'
              e.currentTarget.style.borderColor='var(--rim2)'
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.background='rgba(255,255,255,.025)'
              e.currentTarget.style.borderColor='var(--rim)'
            }}>
              <div style={{
                fontFamily:'var(--mono)', fontSize:'.72rem',
                color:item.c, fontWeight:500, marginBottom:5,
                display:'flex', alignItems:'center', gap:5
              }}>
                <div style={{
                  width:5, height:5, borderRadius:'50%',
                  background:item.c, flexShrink:0
                }}/>
                {item.f}
              </div>
              <div style={{ fontSize:'.76rem', color:'var(--t2)', lineHeight:1.62 }}>
                {item.m}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market context */}
      <div className="card card-p card-shine fu-3" style={{
        background:'rgba(79,142,247,.04)',
        borderColor:'rgba(79,142,247,.18)'
      }}>
        <div style={{
          fontFamily:'var(--display)', fontWeight:600,
          fontSize:'.9rem', marginBottom:16, color:'var(--blue2)'
        }}>
          📈 Market Context — Why This Matters
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:13 }}>
          {STATS.map(s=>(
            <div key={s.v} style={{
              textAlign:'center', padding:'18px 12px',
              background:'rgba(255,255,255,.022)',
              border:'1px solid var(--rim)', borderRadius:11,
              transition:'transform .22s var(--spring),box-shadow .22s'
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform='translateY(-3px)'
              e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,.3),0 0 22px ${s.c}22`
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform=''
              e.currentTarget.style.boxShadow=''
            }}>
              <div style={{
                fontFamily:'var(--display)', fontSize:'1.55rem',
                fontWeight:600, color:s.c, marginBottom:7,
                textShadow:`0 0 24px ${s.c}66`, letterSpacing:'-.02em'
              }}>{s.v}</div>
              <div style={{ fontSize:'.75rem', color:'var(--t2)', lineHeight:1.62 }}>
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
