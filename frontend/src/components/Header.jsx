import React, { useState, useEffect } from 'react'
import { Shield, Wifi, WifiOff, AlertOctagon } from 'lucide-react'

export default function Header({ connected, anomaly, stats }) {
  const [time, setTime] = useState(new Date())
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t) },[])
  const ts = time.toLocaleTimeString('en-US',{hour12:false})

  const limit   = stats?.current_limit       ?? 100
  const cpu     = stats?.current_cpu         ?? 0
  const blocked = stats?.rejected_count      ?? 0
  const total   = stats?.total_requests      ?? 0

  return (
    <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-700 ${
      anomaly ? 'border-red/30 bg-base/92' : 'border-border bg-base/80'
    }`}>
      {anomaly && (
        <div className="bg-red/10 border-b border-red/25 px-6 py-1.5 flex items-center justify-center gap-3">
          <AlertOctagon size={12} className="text-red animate-pulse"/>
          <span className="font-mono text-xs text-red tracking-widest font-semibold">
            ANOMALY DETECTED — AI PROTECTION MODE ACTIVE — RATE LIMIT REDUCED TO MINIMUM
          </span>
          <AlertOctagon size={12} className="text-red animate-pulse"/>
        </div>
      )}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border ${anomaly?'border-red/40 bg-red/10':'border-green/30 bg-green/8'}`}>
            <Shield size={20} className={anomaly?'text-red':'text-green'} strokeWidth={1.5}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-display font-bold text-lg ${anomaly?'text-red':'text-bright'}`}>
                SMART-LIMIT
              </span>
              <span className="font-mono text-[10px] text-ghost border border-border bg-surface px-1.5 py-0.5 rounded">v2.0</span>
            </div>
            <div className="font-mono text-[10px] text-ghost">AI-Driven Adaptive Rate Control</div>
          </div>
        </div>

        {stats && (
          <div className="hidden lg:flex items-center gap-5 font-mono text-xs">
            {[
              {label:'REQUESTS', val:total.toLocaleString(),  col:'text-bright'},
              {label:'BLOCKED',  val:blocked.toLocaleString(),col:blocked>0?'text-red':'text-ghost'},
              {label:'AI LIMIT', val:`${limit} req/min`,      col:limit<=20?'text-red':limit<=70?'text-amber':'text-green'},
              {label:'CPU',      val:`${cpu.toFixed(1)}%`,    col:cpu>=90?'text-red':cpu>=70?'text-amber':'text-cyan'},
            ].map(({label,val,col},i,arr)=>(
              <React.Fragment key={label}>
                <div className="text-center">
                  <div className="text-ghost text-[9px] mb-0.5 tracking-wider">{label}</div>
                  <div className={`font-medium ${col}`}>{val}</div>
                </div>
                {i<arr.length-1&&<div className="w-px h-7 bg-border"/>}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            connected?'border-green/30 bg-green/8 text-green':'border-red/30 bg-red/8 text-red'
          }`}>
            {connected
              ? <><Wifi size={11}/><span>LIVE</span></>
              : <><WifiOff size={11} className="animate-pulse"/><span>OFFLINE</span></>
            }
          </div>
          <div className="text-ghost hidden md:block text-right">
            <div className="text-bright">{ts}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
