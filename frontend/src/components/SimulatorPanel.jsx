import React, { useState, useEffect, useRef } from 'react'
import { Users, TrendingUp, Zap, Bomb, Square, Terminal, CheckCircle2, AlertCircle } from 'lucide-react'
import { triggerSim } from '../services/api'

const MODES = [
  {id:'normal',    label:'Normal Traffic', icon:Users,       cls:'sim-btn-green',
   desc:'5 req/s · 3 threads · 60s',  dur:60,  threads:3,
   expect:'limit ~100', detail:'Steady load. AI holds baseline.',           color:'#39d353'},
  {id:'rush_hour', label:'Rush Hour',      icon:TrendingUp,  cls:'sim-btn-cyan',
   desc:'20 req/s · 6 threads · 45s', dur:45,  threads:6,
   expect:'limit 70–100', detail:'High volume. AI may reduce slightly.',    color:'#58a6ff'},
  {id:'spike',     label:'Traffic Spike',  icon:Zap,         cls:'sim-btn-amber',
   desc:'50 req/s · 10 threads · 30s',dur:30,  threads:10,
   expect:'limit 20–50',  detail:'Sudden burst. AI cuts aggressively.',     color:'#d29922'},
  {id:'ddos',      label:'DDoS Attack',    icon:Bomb,        cls:'sim-btn-red',
   desc:'100 req/s · 20 threads · 20s',dur:20, threads:20,
   expect:'limit 5–10',   detail:'ML anomaly fires. Emergency mode.',       color:'#f85149'},
]

export default function SimulatorPanel() {
  const [active,    setActive]    = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [apiOk,     setApiOk]     = useState(null)
  const [log,       setLog]       = useState([{t:'--:--:--',m:'Ready. Select attack mode.',c:'#6e7681'}])
  const cdRef  = useRef(null)
  const logRef = useRef(null)

  const addLog = (m, c='#6e7681') => {
    const t = new Date().toLocaleTimeString('en-US',{hour12:false})
    setLog(prev => [...prev.slice(-25),{t,m,c}])
    setTimeout(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight },40)
  }

  async function start(mode) {
    if (active) return
    setActive(mode.id); setCountdown(mode.dur); setApiOk(null)
    addLog(`▶ Launching ${mode.label}…`, mode.color)
    addLog(`  ${mode.desc}`, '#6e7681')
    addLog(`  Expected: ${mode.expect}`, '#6e7681')

    const res = await triggerSim(mode.id,'start')
    if (res?.status==='started') {
      setApiOk(true)
      addLog(`✓ Simulator running via API (${res.threads} threads)`, '#39d353')
      addLog(`  Watch the rate limit gauge →`, '#a371f7')
    } else {
      setApiOk(false)
      addLog(`⚠ API failed. Run manually:`, '#d29922')
      addLog(`  python simulator.py --mode ${mode.id} --duration ${mode.dur} --threads ${mode.threads}`, '#58a6ff')
    }

    let rem = mode.dur
    cdRef.current = setInterval(()=>{
      rem--; setCountdown(rem)
      if (rem<=0) {
        clearInterval(cdRef.current)
        setActive(null); setCountdown(0)
        addLog(`■ ${mode.label} ended. Limit recovering…`, mode.color)
      }
    },1000)
  }

  function stop() {
    if (cdRef.current) clearInterval(cdRef.current)
    const m = MODES.find(m=>m.id===active)
    if (m) { triggerSim(m.id,'stop'); addLog(`■ Stopped.`,'#6e7681') }
    setActive(null); setCountdown(0)
  }

  useEffect(()=>()=>clearInterval(cdRef.current),[])
  const am = MODES.find(m=>m.id===active)

  return (
    <div className="space-y-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-amber" strokeWidth={1.5}/>
          <span className="font-display font-semibold text-bright text-sm">Attack Simulator</span>
        </div>
        {active && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="dot dot-red" style={{width:6,height:6}}/>
            <span className="text-red">LIVE</span>
            <span className="text-ghost">{countdown}s</span>
          </div>
        )}
      </div>

      {/* Countdown bar */}
      {active && am && (
        <div className="space-y-1">
          <div className="h-1 bg-surface rounded-full overflow-hidden border border-border">
            <div className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{width:`${(countdown/am.dur)*100}%`,background:am.color,boxShadow:`0 0 6px ${am.color}`}}/>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-ghost">
            <span>{am.label}</span><span>{countdown}s left</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(m=>{
          const Icon = m.icon
          const isActive = active===m.id
          return (
            <button key={m.id}
              onClick={()=>isActive?stop():start(m)}
              disabled={!!active && !isActive}
              className={`sim-btn ${m.cls} ${isActive?'sim-btn-active':''}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={13} strokeWidth={1.5}/>
                <span className="font-semibold text-sm">{m.label}</span>
                {isActive && <span className="ml-auto font-mono text-[10px] opacity-70">●</span>}
              </div>
              <div className="font-mono text-[10px] opacity-60 leading-4">{m.desc}</div>
              <div className="font-mono text-[10px] opacity-45 leading-4">{m.detail}</div>
            </button>
          )
        })}
      </div>

      {/* Stop button */}
      {active && (
        <button onClick={stop}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
            font-display font-medium text-sm text-red
            bg-red/8 border border-red/30 hover:bg-red/16 transition-colors">
          <Square size={12} strokeWidth={2}/> Stop Simulation
        </button>
      )}

      {/* API status */}
      {apiOk !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs border ${
          apiOk ? 'bg-green/5 border-green/20 text-green' : 'bg-amber/5 border-amber/20 text-amber'
        }`}>
          {apiOk
            ? <><CheckCircle2 size={12}/> Traffic hitting rate limiter live</>
            : <><AlertCircle  size={12}/> Use terminal command in log below</>
          }
        </div>
      )}

      {/* Terminal log */}
      <div ref={logRef}
        className="bg-base rounded-lg border border-border p-3 h-28 overflow-y-auto font-mono text-[10px] space-y-0.5">
        {log.map((e,i)=>(
          <div key={i} className="flex gap-2 leading-4">
            <span className="text-muted shrink-0">{e.t}</span>
            <span style={{color:e.c}}>{e.m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
