import React from 'react'
import { ShieldAlert, ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function EventLog({ history }) {
  const events = []
  let pA=false, pL=null
  history.forEach((p,i) => {
    if (p.anomaly && !pA)
      events.unshift({id:`a${i}`, icon:ShieldAlert, col:'text-threat', bg:'bg-threat/8 border-threat/25',
        title:'🚨 Attack Detected', sub:`${p.rate} req/min — AI activating protection`, t:p.t})
    if (!p.anomaly && pA)
      events.unshift({id:`r${i}`, icon:ShieldCheck, col:'text-safe',  bg:'bg-safe/8 border-safe/20',
        title:'✅ Threat Cleared', sub:'System returning to normal', t:p.t})
    if (pL!==null && p.limit!==pL) {
      const down = p.limit < pL
      events.unshift({id:`l${i}`,
        icon: down ? ArrowDownRight : ArrowUpRight,
        col:  down ? 'text-warn' : 'text-safe',
        bg:   down ? 'bg-warn/6 border-warn/20' : 'bg-safe/6 border-safe/20',
        title: down
          ? `⬇ AI reduced limit: ${pL} → ${p.limit} req/min`
          : `⬆ AI restored limit: ${pL} → ${p.limit} req/min`,
        sub: `${p.rate} req/min incoming · CPU ${p.cpu}%`,
        t: p.t,
      })
    }
    pA=p.anomaly; pL=p.limit
  })

  const show = events.slice(0,10)
  if (!show.length) return (
    <div className="flex flex-col items-center justify-center h-28 text-mist font-mono text-xs gap-2">
      <ShieldCheck size={20} className="opacity-30"/>
      All quiet — no events yet
    </div>
  )
  return (
    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
      {show.map(ev => {
        const Icon = ev.icon
        return (
          <div key={ev.id} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-sm ${ev.bg}`}>
            <Icon size={14} className={`${ev.col} shrink-0 mt-0.5`} strokeWidth={1.8}/>
            <div className="flex-1 min-w-0">
              <div className={`${ev.col} font-semibold leading-5`}>{ev.title}</div>
              <div className="text-mist font-mono text-[11px] mt-0.5">{ev.sub}</div>
            </div>
            <div className="text-dim font-mono text-[10px] shrink-0">{ev.t}</div>
          </div>
        )
      })}
    </div>
  )
}
