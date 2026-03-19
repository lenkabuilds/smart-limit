import React, { useEffect, useState } from 'react'

export default function BigStat({ label, value, sub, icon:Icon, col='text-white', glow='', pulse }) {
  const [key, setKey] = useState(0)
  const [prev,setPrev] = useState(value)
  useEffect(()=>{ if(value!==prev){setKey(k=>k+1);setPrev(value)} },[value])
  return (
    <div className={`card p-5 transition-all duration-500 ${glow} ${pulse?'animate-pulse':''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] text-mist tracking-widest uppercase">{label}</span>
        {Icon && <Icon size={14} className={`${col} opacity-35`} strokeWidth={1.5}/>}
      </div>
      <div key={key} className={`font-sans text-3xl font-extrabold ${col} leading-none`}
        style={{animation:key>0?'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both':'none'}}>
        {value}
      </div>
      {sub && <div className="font-mono text-[11px] text-mist mt-2">{sub}</div>}
    </div>
  )
}
