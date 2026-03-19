import React from 'react'
import {
  AreaChart, Area, LineChart, Line, ComposedChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

const TT = {
  backgroundColor:'#1c2333', border:'1px solid #253047', borderRadius:'10px',
  fontFamily:'"IBM Plex Mono",monospace', fontSize:'12px', color:'#9aaac4', padding:'10px 14px',
}
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TT}>
      <div style={{color:'#6b7fa3',marginBottom:6,fontSize:10}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color,display:'flex',gap:10,marginBottom:2}}>
          <span>{p.name}:</span>
          <span style={{color:'#f0f4ff',fontWeight:600}}>
            {typeof p.value==='number' ? p.value.toFixed(p.name==='CPU'?1:0) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
const AX = { fill:'#3d4f6b', fontSize:10, fontFamily:'"IBM Plex Mono",monospace' }

/* Big combo chart: traffic bars + limit line */
export function MainChart({ data, anomaly }) {
  const limitColor = anomaly ? '#ef4444' : '#00d4aa'
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{top:8,right:8,left:-8,bottom:0}}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={anomaly?'#ef4444':'#3b82f6'} stopOpacity={0.5}/>
            <stop offset="100%" stopColor={anomaly?'#ef4444':'#3b82f6'} stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#253047" strokeDasharray="4 4" vertical={false}/>
        <XAxis dataKey="t" tick={AX} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
        <YAxis yAxisId="rate" tick={AX} axisLine={false} tickLine={false} width={32}/>
        <YAxis yAxisId="limit" orientation="right" tick={AX} axisLine={false} tickLine={false} width={36} domain={[0,160]}/>
        <Tooltip content={<Tip/>}/>
        {/* Anomaly zones */}
        {data.filter(d=>d.anomaly).map((d,i)=>(
          <ReferenceLine key={i} yAxisId="rate" x={d.t} stroke="rgba(239,68,68,0.4)" strokeWidth={1.5} strokeDasharray="3 2"/>
        ))}
        {/* Traffic as area */}
        <Area yAxisId="rate" type="monotone" dataKey="rate" name="Traffic"
          stroke={anomaly?'#ef4444':'#3b82f6'} strokeWidth={0}
          fill="url(#rateGrad)" dot={false}/>
        {/* Limit as bold line — THE STAR */}
        <Line yAxisId="limit" type="monotone" dataKey="limit" name="AI Limit"
          stroke={limitColor} strokeWidth={3} dot={false}
          activeDot={{r:5, fill:limitColor, stroke:'#0f1117', strokeWidth:2}}/>
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* Small CPU sparkline */
export function CpuSparkline({ data }) {
  const last = data[data.length-1]?.cpu ?? 0
  const color = last>=90?'#ef4444':last>=70?'#f59e0b':'#22c55e'
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{top:4,right:0,left:0,bottom:0}}>
        <defs>
          <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.4}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="cpu" stroke={color} strokeWidth={2}
          fill="url(#cpuGrad)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* Donut */
export function DonutChart({ ok, blocked }) {
  const total = ok + blocked
  if (!total) return (
    <div className="h-36 flex items-center justify-center font-mono text-xs text-mist">
      Waiting for traffic…
    </div>
  )
  const pct = ((ok/total)*100).toFixed(1)
  const d = [{name:'Allowed',value:ok,color:'#22c55e'},{name:'Blocked',value:blocked,color:'#ef4444'}]
  return (
    <div className="relative h-36">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={d} cx="50%" cy="50%" innerRadius={44} outerRadius={62}
            paddingAngle={3} startAngle={90} endAngle={450} dataKey="value" stroke="none">
            {d.map((e,i)=><Cell key={i} fill={e.color} opacity={0.9}/>)}
          </Pie>
          <Tooltip formatter={(v,n)=>[v.toLocaleString(),n]} contentStyle={TT}/>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-sans text-2xl font-bold text-safe">{pct}%</div>
        <div className="font-mono text-[10px] text-mist">success</div>
      </div>
    </div>
  )
}
