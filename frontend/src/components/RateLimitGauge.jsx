import React, { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus, Brain } from 'lucide-react'

export default function RateLimitGauge({ limit, anomaly, limitTrend, rate }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k+1) }, [limit])

  const pct = Math.min(100,(limit/200)*100)

  const col =
    limit <= 10  ? {text:'text-red',    bar:'#f85149', badge:'badge-red',    label:'EMERGENCY'} :
    limit <= 30  ? {text:'text-orange',  bar:'#f0883e', badge:'badge-red',    label:'CRITICAL'}  :
    limit <= 70  ? {text:'text-amber',   bar:'#d29922', badge:'badge-amber',  label:'REDUCED'}   :
    limit <= 100 ? {text:'text-cyan',    bar:'#58a6ff', badge:'badge-cyan',   label:'NORMAL'}    :
                   {text:'text-green',   bar:'#39d353', badge:'badge-green',  label:'ELEVATED'}

  const reason =
    anomaly       ? '⚠  ML anomaly fired — emergency protection mode'  :
    limit <= 10   ? '🔴 DDoS detected — rate floor engaged'             :
    limit <= 30   ? '🟠 Critical load — AI throttling hard'             :
    limit <  100  ? '🟡 High traffic — AI reducing limit'               :
    limit >  100  ? '🟢 Low load — AI scaling capacity up'              :
                    '✓  Nominal — IsolationForest monitoring...'

  const TrendIcon = limitTrend==='down' ? TrendingDown : limitTrend==='up' ? TrendingUp : Minus
  const trendCol  = limitTrend==='down' ? 'text-red' : limitTrend==='up' ? 'text-green' : 'text-ghost'

  return (
    <div className="space-y-5">
      {/* Big number */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={13} className="text-purple" strokeWidth={1.5}/>
            <span className="font-mono text-[10px] text-ghost tracking-widest">AI RATE LIMIT</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              key={key}
              className={`font-mono text-6xl font-bold ${col.text} leading-none`}
              style={{
                animation: limitTrend
                  ? `${limitTrend==='down'?'limitDrop':'limitRise'} 0.55s ease-out both`
                  : 'none',
                textShadow: limit<=30
                  ? '0 0 24px rgba(248,81,73,0.6)'
                  : limit>100
                  ? '0 0 24px rgba(57,211,83,0.4)'
                  : 'none',
              }}
            >{limit}</span>
            <div>
              <div className="font-mono text-sm text-ghost">req</div>
              <div className="font-mono text-sm text-ghost">/ min</div>
            </div>
            {limitTrend && (
              <TrendIcon size={22} className={`${trendCol} mb-1`} strokeWidth={2.5}
                style={{animation:'numPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'}}/>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`badge ${col.badge} text-xs`}>
            <span className={`dot ${anomaly?'dot-red':limit<=70?'dot-amber':'dot-green'}`}
              style={{width:6,height:6}}/>
            {col.label}
          </span>
          <div className="font-mono text-[10px] text-ghost mt-2">
            {rate?.toFixed(0)??0} req/min incoming
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between font-mono text-[10px] text-ghost mb-1.5">
          <span>MIN 5</span><span>BASE 100</span><span>MAX 200</span>
        </div>
        <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width:`${pct}%`,
              background: col.bar,
              boxShadow:`0 0 10px ${col.bar}80`,
            }}
          />
        </div>
        <div className="relative mt-1 h-2">
          <div className="absolute" style={{left:'2.5%'}}><div className="w-px h-2 bg-muted"/></div>
          <div className="absolute" style={{left:'50%'}}><div className="w-px h-2 bg-muted"/></div>
          <div className="absolute right-0"><div className="w-px h-2 bg-muted"/></div>
        </div>
      </div>

      {/* Reason */}
      <div className={`rounded-lg px-3 py-2.5 font-mono text-xs border leading-5 ${
        anomaly        ? 'bg-red/6    border-red/25    text-red'    :
        limit <  100   ? 'bg-amber/5  border-amber/20  text-amber'  :
                         'bg-green/5  border-green/20  text-green'
      }`}>
        {reason}
      </div>

      {/* Mini legend */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
        {[
          {label:'ANOMALY',  val: anomaly ? 'YES ⚠' : 'NO ✓', col: anomaly ? 'text-red' : 'text-green'},
          {label:'INCOMING', val: `${rate?.toFixed(0)??0}/min`, col:'text-silver'},
          {label:'CHANGE',   val: limitTrend==='down'?'▼ DROP':limitTrend==='up'?'▲ RISE':'— HOLD',
           col: limitTrend==='down'?'text-red':limitTrend==='up'?'text-green':'text-ghost'},
        ].map(({label,val,col})=>(
          <div key={label} className="bg-surface rounded-lg p-2 border border-border text-center">
            <div className="text-ghost mb-1">{label}</div>
            <div className={`font-medium ${col}`}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
