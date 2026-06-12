export default function NavBar({ tab, setTab, apiOnline }) {
  const TABS = ['Analyzer','Dashboard','History','Learn','Use Cases']
  return (
    <nav className="navbar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.3" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <span className="brand-name">FraudShield<em>AI</em></span>
        <span className="nav-badge">kartik2112</span>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab${tab===t?' on':''}`} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:'.72rem',color:apiOnline?'var(--green2)':'var(--t3)'}}>
          {apiOnline?'API Online':'API Offline'}
        </span>
        <div className={`dot${apiOnline?' on':''}`}
             title={apiOnline?'Model loaded — ready':'Run: python backend/app.py'}/>
      </div>
    </nav>
  )
}
