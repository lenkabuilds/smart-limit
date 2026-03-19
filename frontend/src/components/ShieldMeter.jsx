import React, { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

/* Circular arc meter showing AI protection level */
function Arc({ pct, color, size=200 }) {
  const r    = 80
  const cx   = size/2
  const cy   = size/2
  const circ = 2 * Math.PI * r
  // Only use bottom 270° of circle (start at 135°, end at 405°)
  const arcLen = circ * 0.75
  const filled = arcLen * (pct/100)
  const gap    = arcLen - filled
  // rotation: start at 135deg
  return (
    <svg width={size} height={size} style={{overflow:'visible'}}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="#253047" strokeWidth={12}
        strokeDasharray={`${arcLen} ${circ - arcLen}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Fill */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
        style={{
          transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease',
          filter: `drop-shadow(0 0 8px ${color}88)`,
        }}
      />
    </svg>
  )
}

const LEVELS = [
  {min:0,   max:15,  label:'UNDER ATTACK', sub:'Emergency mode',    color:'#ef4444', pct:5,  ring:'#ef4444'},
  {min:15,  max:35,  label:'HIGH THREAT',  sub:'AI throttling hard',color:'#f97316', pct:20, ring:'#f97316'},
  {min:35,  max:65,  label:'ELEVATED',     sub:'Traffic anomaly',   color:'#f59e0b', pct:45, ring:'#f59e0b'},
  {min:65,  max:105, label:'PROTECTED',    sub:'Normal operations', color:'#22c55e', pct:75, ring:'#22c55e'},
  {min:105, max:200, label:'OPTIMAL',      sub:'Low load, scaling', color:'#00d4aa', pct:95, ring:'#00d4aa'},
]

export default function ShieldMeter({ limit, trend, rate, anomaly }) {
  const [animKey, setAnimKey] = useState(0)
  const [prev,    setPrev]    = useState(limit)
  useEffect(() => { if (limit!==prev){ setAnimKey(k=>k+1); setPrev(limit) } },[limit])

  const level = LEVELS.find(l => limit >= l.min && limit < l.max) ?? LEVELS[3]
  const pct   = Math.min(100, Math.max(2, (limit/150)*100))

  const TIcon = trend==='down'?TrendingDown:trend==='up'?TrendingUp:Minus
  const tcol  = trend==='down'?'text-threat':trend==='up'?'text-safe':'text-mist'

  return (
    <div className="flex flex-col items-center select-none">
      {/* Arc + number */}
      <div className="relative" style={{width:200,height:200}}>
        <Arc pct={pct} color={level.ring} size={200}/>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[10px] text-mist tracking-widest uppercase mb-1">
            AI LIMIT
          </div>
          <div
            key={animKey}
            className="font-sans font-extrabold leading-none"
            style={{
              fontSize: 52,
              color: level.color,
              animation: animKey>0
                ? (trend==='down'?'limitDrop':trend==='up'?'limitRise':'limitHold')+' 0.6s ease-out both'
                : 'none',
              textShadow: `0 0 30px ${level.color}60`,
              transition: 'color 0.5s ease',
            }}
          >{limit}</div>
          <div className="font-mono text-xs text-mist">req / min</div>
          {trend && (
            <TIcon size={18} className={`${tcol} mt-1`} strokeWidth={2.5}
              style={{animation:'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}/>
          )}
        </div>
      </div>

      {/* Status label */}
      <div className="mt-2 text-center">
        <div className={`pill ${
          anomaly||limit<=15   ? 'pill-threat' :
          limit<=35            ? 'pill-warn'   :
          limit<=65            ? 'pill-warn'   :
          limit<=105           ? 'pill-safe'   : 'pill-glow'
        } mb-1`}>
          <span className={`dot ${
            anomaly||limit<=15?'dot-threat':limit<=65?'dot-warn':'dot-safe'
          }`}/>
          {level.label}
        </div>
        <div className="font-sans text-xs text-mist">{level.sub}</div>
      </div>

      {/* Mini stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-full">
        {[
          {k:'Incoming', v:`${rate?.toFixed(0)??0}/min`, c:'text-info'},
          {k:'Status',   v:anomaly?'ANOMALY':'NORMAL',   c:anomaly?'text-threat':'text-safe'},
          {k:'Change',   v:trend==='down'?'▼ Drop':trend==='up'?'▲ Rise':'● Hold',
           c:trend==='down'?'text-threat':trend==='up'?'text-safe':'text-mist'},
        ].map(({k,v,c})=>(
          <div key={k} className="bg-deep rounded-xl p-2.5 border border-edge text-center">
            <div className="font-mono text-[9px] text-mist uppercase mb-1">{k}</div>
            <div className={`font-mono text-xs font-semibold ${c}`}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
