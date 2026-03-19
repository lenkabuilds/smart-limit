import React, { useState, useEffect, useRef } from 'react'
import { Waves, Wind, Zap, FlameKindling, StopCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { triggerSim } from '../services/api'

const MODES = [
  {
    id:'normal', label:'Normal Day',
    icon: Waves, cls:'atk-safe',
    desc:'Calm traffic · 5 req/s',
    effect:'Limit stays ~100. System relaxed.',
    dur:60, threads:3, color:'#22c55e',
    emoji:'🟢',
  },
  {
    id:'rush_hour', label:'Rush Hour',
    icon: Wind, cls:'atk-info',
    desc:'Busy traffic · 20 req/s',
    effect:'Limit drops to ~60–80. AI adapting.',
    dur:45, threads:6, color:'#3b82f6',
    emoji:'🔵',
  },
  {
    id:'spike', label:'Traffic Spike',
    icon: Zap, cls:'atk-warn',
    desc:'Sudden burst · 50 req/s',
    effect:'Limit crashes to ~20–40. Watch graph.',
    dur:30, threads:10, color:'#f59e0b',
    emoji:'🟡',
  },
  {
    id:'ddos', label:'DDoS Attack',
    icon: FlameKindling, cls:'atk-threat',
    desc:'Full attack · 100 req/s',
    effect:'ML fires. Limit hits 5–15. Page goes red.',
    dur:20, threads:20, color:'#ef4444',
    emoji:'🔴',
  },
]

export default function Simulator() {
  const [active,    setActive]    = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [apiOk,     setApiOk]     = useState(null)
  const cdRef  = useRef(null)

  async function launch(m) {
    if (active) return
    setActive(m.id); setCountdown(m.dur); setApiOk(null)
    const res = await triggerSim(m.id, 'start')
    setApiOk(!!(res?.status==='started'))
    let rem = m.dur
    cdRef.current = setInterval(() => {
      rem--; setCountdown(rem)
      if (rem <= 0) { clearInterval(cdRef.current); setActive(null); setCountdown(0) }
    }, 1000)
  }

  function stop() {
    clearInterval(cdRef.current)
    const m = MODES.find(x=>x.id===active)
    if (m) triggerSim(m.id,'stop')
    setActive(null); setCountdown(0)
  }

  useEffect(()=>()=>clearInterval(cdRef.current),[])
  const am = MODES.find(x=>x.id===active)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-sans font-bold text-white text-base">Attack Simulator</h3>
        <p className="font-mono text-xs text-mist mt-0.5">
          Press a button — watch the AI rate limit react in real-time
        </p>
      </div>

      {/* Countdown */}
      {active && am && (
        <div className="rounded-xl border p-3 space-y-2"
          style={{borderColor:`${am.color}50`, background:`${am.color}08`}}>
          <div className="flex items-center justify-between font-mono text-xs">
            <span style={{color:am.color}} className="font-semibold">{am.emoji} {am.label} running…</span>
            <span className="text-mist">{countdown}s left</span>
          </div>
          <div className="h-1.5 bg-deep rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{width:`${(countdown/am.dur)*100}%`, background:am.color,
                      boxShadow:`0 0 8px ${am.color}`}}/>
          </div>
          <div className="font-sans text-xs text-mist">{am.effect}</div>
        </div>
      )}

      {/* 2×2 grid of buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {MODES.map(m => {
          const Icon = m.icon
          const isActive = active===m.id
          return (
            <button key={m.id}
              onClick={()=>isActive ? stop() : launch(m)}
              disabled={!!active && !isActive}
              className={`atk-btn ${m.cls} ${isActive?'atk-active':''}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} strokeWidth={1.8}/>
                <span className="text-sm">{m.label}</span>
                {isActive && <span className="ml-auto font-mono text-[10px] opacity-70">LIVE ●</span>}
              </div>
              <div className="font-mono text-[11px] opacity-60 leading-4">{m.desc}</div>
              <div className="font-sans text-[11px] opacity-45 mt-1 leading-4">{m.effect}</div>
            </button>
          )
        })}
      </div>

      {active && (
        <button onClick={stop}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            font-sans font-semibold text-sm text-threat
            bg-threat/8 border border-threat/30 hover:bg-threat/15 transition-colors">
          <StopCircle size={15} strokeWidth={2}/> Stop Simulation
        </button>
      )}

      {apiOk !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs border ${
          apiOk ? 'bg-safe/6 border-safe/20 text-safe' : 'bg-warn/6 border-warn/20 text-warn'
        }`}>
          {apiOk
            ? <><CheckCircle size={12}/> Traffic hitting backend — watch limit change!</>
            : <><AlertCircle  size={12}/> Run manually: python simulator.py --mode {active} --threads 10</>
          }
        </div>
      )}
    </div>
  )
}
