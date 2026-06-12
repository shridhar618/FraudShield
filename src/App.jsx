import { useState, useEffect } from 'react'
import { api } from './api.js'
import NavBar    from './components/NavBar.jsx'
import Analyzer  from './components/Analyzer.jsx'
import Dashboard from './components/Dashboard.jsx'
import History   from './components/History.jsx'
import Learn     from './components/Learn.jsx'
import UseCases  from './components/UseCases.jsx'

export default function App() {
  const [tab,      setTab]      = useState('Analyzer')
  const [apiOnline, setOnline]  = useState(false)
  const [options,   setOptions] = useState(null)   // loaded once, passed down

  // Check API status on mount
  useEffect(() => {
    let active = true

    const checkHealth = () => {
      api.getHealth()
        .then(d  => active && setOnline(!!d.model_loaded))
        .catch(() => active && setOnline(false))
    }

    checkHealth()
    const id = setInterval(checkHealth, 5000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  // Load dropdown options once
  useEffect(() => {
    api.getOptions()
      .then(setOptions)
      .catch(() => {})
  }, [])

  return (
    <div className="app">
      {/* Animated background layers */}
      <div className="bg-mesh"><div className="bg-orb3"/></div>
      <div className="bg-grid"/>

      <NavBar tab={tab} setTab={setTab} apiOnline={apiOnline}/>

      <div className="page">
        {tab === 'Analyzer'   && <Analyzer  options={options} apiOnline={apiOnline} onApiStatusChange={setOnline}/>}
        {tab === 'Dashboard'  && <Dashboard />}
        {tab === 'History'    && <History   />}
        {tab === 'Learn'      && <Learn     />}
        {tab === 'Use Cases'  && <UseCases  />}
      </div>
    </div>
  )
}
