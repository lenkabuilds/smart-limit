import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchStats, fetchHealth } from '../services/api'

export function useMetrics(ms = 1000) {
  const [stats,      setStats]      = useState(null)
  const [health,     setHealth]     = useState(null)
  const [history,    setHistory]    = useState([])
  const [connected,  setConnected]  = useState(false)
  const [trend,      setTrend]      = useState(null) // 'up'|'down'|'hold'
  const prev  = useRef(null)
  const timer = useRef(null)

  const poll = useCallback(async () => {
    const [s, h] = await Promise.all([fetchStats(), fetchHealth()])
    if (s) {
      if (prev.current !== null && s.current_limit !== prev.current) {
        const t = s.current_limit < prev.current ? 'down'
                : s.current_limit > prev.current ? 'up' : 'hold'
        setTrend(t)
        setTimeout(() => setTrend(null), 1800)
      }
      prev.current = s.current_limit
      setStats(s); setConnected(true)
      setHistory(p => {
        const pt = {
          t:       new Date().toLocaleTimeString('en-US', { hour12:false }),
          rate:    +(s.current_request_rate ?? 0).toFixed(0),
          limit:   s.current_limit        ?? 100,
          cpu:     +(s.current_cpu         ?? 0).toFixed(1),
          anomaly: s.anomaly_detected      ?? false,
          ok:      s.success_count         ?? 0,
          blocked: s.rejected_count        ?? 0,
        }
        const last = p[p.length-1]
        if (last?.t === pt.t) return [...p.slice(0,-1), pt]
        return [...p, pt].slice(-80)
      })
    } else { setConnected(false) }
    if (h) setHealth(h)
  }, [])

  useEffect(() => {
    poll()
    timer.current = setInterval(poll, ms)
    return () => clearInterval(timer.current)
  }, [poll, ms])

  return { stats, health, history, connected, trend }
}
