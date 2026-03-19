import React from 'react'
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react'

export default function AnomalyFeed({ history }) {
  const events = []
  let pA=false, pL=null
  history.forEach((p,i)=>{
    if  (p.anomaly&&!pA) events.unshift({id:`a${i}`,type:'anomaly', title:'⚠ Anomaly Detected',
      detail:`Rate: ${p.rate} req/min · CPU: ${p.cpu}%`, time:p.t,
      col:'text-red', bg:'bg-red/5 border-red/20'})
    if (!p.anomaly&&pA) events.unshift({id:`r${i}`,type:'ok', title:'✓ Threat Resolved',
      detail:'System normalizing · Limit recovering', time:p.t,
      col:'text-green', bg:'bg-green/5 border-green/20'})
    if (pL!==null&&p.limit!==pL) {
      const d=p.limit<pL?'dropped':'rose'
      events.unshift({id:`l${i}`,type:'limit',
        title:`AI: limit ${d} ${pL} → ${p.limit} req/min`,
        detail:`${p.rate} req/min · CPU ${p.cpu}%`, time:p.t,
        col:d==='dropped'?'text-amber':'text-cyan',
        bg:d==='dropped'?'bg-amber/5 border-amber/20':'bg-cyan/5 border-cyan/20'})
    }
    pA=p.anomaly; pL=p.limit
  })
  const show = events.slice(0,12)
  if (!show.length) return (
    <div className="flex flex-col items-center justify-center h-36 text-ghost font-mono text-xs gap-2">
      <Activity size={18} className="opacity-30"/>
      No events yet — start a simulation
    </div>
  )
  return (
    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
      {show.map(ev=>(
        <div key={ev.id} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border font-mono text-[11px] ${ev.bg}`}>
          <div className={`mt-0.5 shrink-0 ${ev.col}`}>
            {ev.type==='anomaly'&&<AlertTriangle size={11}/>}
            {ev.type==='ok'     &&<CheckCircle   size={11}/>}
            {ev.type==='limit'  &&<Activity      size={11}/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`${ev.col} font-medium leading-4`}>{ev.title}</div>
            <div className="text-ghost text-[10px] mt-0.5">{ev.detail}</div>
          </div>
          <div className="text-ghost text-[10px] shrink-0">{ev.time}</div>
        </div>
      ))}
    </div>
  )
}
