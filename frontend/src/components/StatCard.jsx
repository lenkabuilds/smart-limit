import React, { useEffect, useState } from 'react'

export default function StatCard({ label, value, sub, icon: Icon, col='text-bright', glow='', pulse }) {
  const [key, setKey]   = useState(0)
  const [prev, setPrev] = useState(value)
  useEffect(()=>{
    if (value!==prev){ setKey(k=>k+1); setPrev(value) }
  },[value])
  return (
    <div className={`card p-4 transition-all duration-500 ${glow} ${pulse?'animate-pulse':''}`}>
      <div className="flex items-start justify-between mb-2.5">
        <span className="font-mono text-[10px] text-ghost tracking-widest uppercase">{label}</span>
        {Icon && <Icon size={13} className={`${col} opacity-40`} strokeWidth={1.5}/>}
      </div>
      <div key={key} className={`font-mono text-2xl font-bold ${col} leading-none`}
        style={{animation:key>0?'numPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both':'none'}}>
        {value}
      </div>
      {sub && <div className="font-mono text-[10px] text-ghost mt-1.5">{sub}</div>}
    </div>
  )
}
