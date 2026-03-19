#!/bin/bash
# =============================================================
# SMART-LIMIT v3 — One-Shot Installer for Fedora Linux
# =============================================================
# Copy this file + app.py into your project folder, then run:
#   chmod +x install.sh && ./install.sh
# =============================================================

set -e
G='\033[0;32m'; C='\033[0;36m'; Y='\033[1;33m'; B='\033[1m'; N='\033[0m'
ok()   { echo -e "${G}[✓]${N} $1"; }
info() { echo -e "${C}[→]${N} $1"; }

echo ""
echo -e "${B}================================================${N}"
echo -e "${B}  SMART-LIMIT v3 Installer${N}"
echo -e "${B}================================================${N}"
echo ""

[ ! -f "app.py" ] && echo "Run from your project folder (where app.py lives)" && exit 1
ok "Project folder found"

# ── System packages ──────────────────────────────────────────
info "Installing system packages..."
sudo dnf install -y python3 python3-pip nodejs npm gcc python3-devel 2>/dev/null | grep -E "^(Install|Already)" | tail -3 || true
ok "System packages ready"

# ── Python venv ──────────────────────────────────────────────
[ ! -d "venv" ] && python3 -m venv venv && ok "Virtual environment created" || ok "Virtual environment exists"
source venv/bin/activate
info "Installing Python packages..."
pip install --quiet --upgrade pip
pip install --quiet flask flask-cors scikit-learn numpy pandas psutil requests werkzeug
ok "Python packages installed"

# ── Backup original app.py ───────────────────────────────────
[ ! -f "app_backup.py" ] && cp app.py app_backup.py && ok "Backed up app.py → app_backup.py"

# ── Frontend scaffold ─────────────────────────────────────────
info "Building frontend..."
mkdir -p frontend/src/components frontend/src/hooks frontend/src/services frontend/public

# package.json
cat > frontend/package.json << 'ENDOFFILE'
{
  "name": "smart-limit-dashboard",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
ENDOFFILE

# vite.config.js
cat > frontend/vite.config.js << 'ENDOFFILE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/stats':    { target: 'http://localhost:5000', changeOrigin: true },
      '/health':   { target: 'http://localhost:5000', changeOrigin: true },
      '/api':      { target: 'http://localhost:5000', changeOrigin: true },
      '/simulate': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
ENDOFFILE

# postcss
cat > frontend/postcss.config.js << 'ENDOFFILE'
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
ENDOFFILE

# tailwind
cat > frontend/tailwind.config.js << 'ENDOFFILE'
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        ink:    '#0f1117',
        deep:   '#151921',
        panel:  '#1c2333',
        edge:   '#253047',
        dim:    '#3d4f6b',
        mist:   '#6b7fa3',
        smoke:  '#9aaac4',
        cloud:  '#c8d4e8',
        white:  '#f0f4ff',
        safe:   '#22c55e',
        warn:   '#f59e0b',
        threat: '#ef4444',
        info:   '#3b82f6',
        glow:   '#00d4aa',
      },
      boxShadow: {
        safe:   '0 0 30px rgba(34,197,94,0.2)',
        threat: '0 0 40px rgba(239,68,68,0.25)',
        glow:   '0 0 30px rgba(0,212,170,0.2)',
        card:   '0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
ENDOFFILE

# index.html
cat > frontend/index.html << 'ENDOFFILE'
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SMART-LIMIT — AI Shield</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0f1117;min-height:100%}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#151921}
    ::-webkit-scrollbar-thumb{background:#253047;border-radius:4px}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
ENDOFFILE

# main.jsx
cat > frontend/src/main.jsx << 'ENDOFFILE'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App/></React.StrictMode>
)
ENDOFFILE

# index.css
cat > frontend/src/index.css << 'ENDOFFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background: #0f1117;
    color: #c8d4e8;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}

@layer components {
  .card {
    background: #1c2333;
    border: 1px solid #253047;
    border-radius: 16px;
  }
  .card-safe   { border-color: rgba(34,197,94,0.4);  box-shadow: 0 0 30px rgba(34,197,94,0.08);  }
  .card-threat { border-color: rgba(239,68,68,0.5);  box-shadow: 0 0 40px rgba(239,68,68,0.15);  animation: threatPulse 1.8s ease-in-out infinite; }
  .card-warn   { border-color: rgba(245,158,11,0.4); box-shadow: 0 0 30px rgba(245,158,11,0.08); }
  .card-glow   { border-color: rgba(0,212,170,0.4);  box-shadow: 0 0 30px rgba(0,212,170,0.1);  }

  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 999px;
    font-size: 11px; font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    letter-spacing: 0.05em; text-transform: uppercase;
    border: 1px solid transparent;
  }
  .pill-safe   { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.3); }
  .pill-warn   { background: rgba(245,158,11,0.12); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
  .pill-threat { background: rgba(239,68,68,0.14);  color: #f87171; border-color: rgba(239,68,68,0.35); }
  .pill-info   { background: rgba(59,130,246,0.12); color: #60a5fa; border-color: rgba(59,130,246,0.3); }
  .pill-glow   { background: rgba(0,212,170,0.12);  color: #2dd4bf; border-color: rgba(0,212,170,0.3); }

  .dot { width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0;position:relative; }
  .dot::after { content:'';position:absolute;inset:0;border-radius:50%;animation:pingDot 1.4s cubic-bezier(0,0,0.2,1) infinite; }
  .dot-safe   { background:#22c55e; }  .dot-safe::after   { background:rgba(34,197,94,0.5); }
  .dot-warn   { background:#f59e0b; }  .dot-warn::after   { background:rgba(245,158,11,0.5); animation-duration:1s !important; }
  .dot-threat { background:#ef4444; }  .dot-threat::after { background:rgba(239,68,68,0.5);  animation-duration:0.7s !important; }

  /* Attack buttons */
  .atk-btn {
    border-radius: 12px; padding: 14px 16px; cursor: pointer;
    transition: all 0.18s ease; border: 1px solid; text-align: left;
    position: relative; overflow: hidden; width: 100%;
    font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;
  }
  .atk-btn::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .atk-btn:disabled { opacity: 0.28; cursor: not-allowed; }
  .atk-btn:active:not(:disabled) { transform: scale(0.98); }

  .atk-safe   { background: rgba(34,197,94,0.08);  border-color: rgba(34,197,94,0.3);  color: #4ade80; }
  .atk-safe:hover:not(:disabled)   { background: rgba(34,197,94,0.15);  box-shadow: 0 4px 20px rgba(34,197,94,0.2);  transform: translateY(-2px); }
  .atk-info   { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.3); color: #60a5fa; }
  .atk-info:hover:not(:disabled)   { background: rgba(59,130,246,0.15); box-shadow: 0 4px 20px rgba(59,130,246,0.2); transform: translateY(-2px); }
  .atk-warn   { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); color: #fbbf24; }
  .atk-warn:hover:not(:disabled)   { background: rgba(245,158,11,0.15); box-shadow: 0 4px 20px rgba(245,158,11,0.2); transform: translateY(-2px); }
  .atk-threat { background: rgba(239,68,68,0.09);  border-color: rgba(239,68,68,0.35); color: #f87171; }
  .atk-threat:hover:not(:disabled) { background: rgba(239,68,68,0.18);  box-shadow: 0 4px 24px rgba(239,68,68,0.3);  transform: translateY(-2px); }
  .atk-active { animation: atkPulse 1s ease-in-out infinite; }
}

@keyframes pingDot  { 75%,100%{transform:scale(2.5);opacity:0} }
@keyframes threatPulse {
  0%,100%{box-shadow:0 0 20px rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.45)}
  50%    {box-shadow:0 0 50px rgba(239,68,68,0.3);border-color:rgba(239,68,68,0.75)}
}
@keyframes atkPulse  { 0%,100%{opacity:1}50%{opacity:0.65} }
@keyframes fadeUp    { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
@keyframes popIn     { from{opacity:0;transform:scale(0.75)}to{opacity:1;transform:scale(1)} }
@keyframes limitDrop { 0%{transform:scale(1)}40%{transform:scale(1.2);color:#f87171}100%{transform:scale(1);color:#f87171} }
@keyframes limitRise { 0%{transform:scale(1)}40%{transform:scale(1.15);color:#4ade80}100%{transform:scale(1);color:#4ade80} }
@keyframes limitHold { 0%{transform:scale(1)}30%{transform:scale(1.05)}100%{transform:scale(1)} }

.fade-up { animation: fadeUp 0.5s ease-out both; }
.d1{animation-delay:.06s}.d2{animation-delay:.12s}.d3{animation-delay:.18s}
.d4{animation-delay:.24s}.d5{animation-delay:.30s}.d6{animation-delay:.36s}
ENDOFFILE

# api.js
cat > frontend/src/services/api.js << 'ENDOFFILE'
async function get(path) {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(4000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  } catch { return null }
}
export const fetchStats  = () => get('/stats')
export const fetchHealth = () => get('/health')
export async function triggerSim(mode, action='start') {
  try {
    const r = await fetch(`/simulate?mode=${mode}&action=${action}`,
      { method: 'POST', signal: AbortSignal.timeout(5000) })
    return r.json()
  } catch { return null }
}
ENDOFFILE

# useMetrics.js
cat > frontend/src/hooks/useMetrics.js << 'ENDOFFILE'
import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchStats, fetchHealth } from '../services/api'

export function useMetrics(ms = 1000) {
  const [stats,      setStats]      = useState(null)
  const [health,     setHealth]     = useState(null)
  const [history,    setHistory]    = useState([])
  const [connected,  setConnected]  = useState(false)
  const [trend,      setTrend]      = useState(null) // 'up'|'down'|'hold'
  const prev  = useRef(null)
  const timer = useRef(null)

  const poll = useCallback(async () => {
    const [s, h] = await Promise.all([fetchStats(), fetchHealth()])
    if (s) {
      if (prev.current !== null && s.current_limit !== prev.current) {
        const t = s.current_limit < prev.current ? 'down'
                : s.current_limit > prev.current ? 'up' : 'hold'
        setTrend(t)
        setTimeout(() => setTrend(null), 1800)
      }
      prev.current = s.current_limit
      setStats(s); setConnected(true)
      setHistory(p => {
        const pt = {
          t:       new Date().toLocaleTimeString('en-US', { hour12:false }),
          rate:    +(s.current_request_rate ?? 0).toFixed(0),
          limit:   s.current_limit        ?? 100,
          cpu:     +(s.current_cpu         ?? 0).toFixed(1),
          anomaly: s.anomaly_detected      ?? false,
          ok:      s.success_count         ?? 0,
          blocked: s.rejected_count        ?? 0,
        }
        const last = p[p.length-1]
        if (last?.t === pt.t) return [...p.slice(0,-1), pt]
        return [...p, pt].slice(-80)
      })
    } else { setConnected(false) }
    if (h) setHealth(h)
  }, [])

  useEffect(() => {
    poll()
    timer.current = setInterval(poll, ms)
    return () => clearInterval(timer.current)
  }, [poll, ms])

  return { stats, health, history, connected, trend }
}
ENDOFFILE

# Charts.jsx
cat > frontend/src/components/Charts.jsx << 'ENDOFFILE'
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
ENDOFFILE

# ShieldMeter.jsx — the big visual centrepiece
cat > frontend/src/components/ShieldMeter.jsx << 'ENDOFFILE'
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
ENDOFFILE

# Simulator.jsx
cat > frontend/src/components/Simulator.jsx << 'ENDOFFILE'
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
ENDOFFILE

# EventLog.jsx
cat > frontend/src/components/EventLog.jsx << 'ENDOFFILE'
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
ENDOFFILE

# BigStat.jsx
cat > frontend/src/components/BigStat.jsx << 'ENDOFFILE'
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
ENDOFFILE

# App.jsx — clean, human, non-technical
cat > frontend/src/App.jsx << 'ENDOFFILE'
import React, { useEffect } from 'react'
import { ShieldCheck, ShieldAlert, Activity, Users, Ban, Cpu, Clock } from 'lucide-react'
import BigStat     from './components/BigStat'
import ShieldMeter from './components/ShieldMeter'
import { MainChart, CpuSparkline, DonutChart } from './components/Charts'
import Simulator   from './components/Simulator'
import EventLog    from './components/EventLog'
import { useMetrics } from './hooks/useMetrics'

export default function App() {
  const { stats, health, history, connected, trend } = useMetrics(1000)

  const anomaly  = stats?.anomaly_detected    ?? false
  const total    = stats?.total_requests      ?? 0
  const ok       = stats?.success_count       ?? 0
  const blocked  = stats?.rejected_count      ?? 0
  const cpu      = stats?.current_cpu         ?? 0
  const rate     = stats?.current_request_rate?? 0
  const limit    = stats?.current_limit       ?? 100
  const mem      = health?.memory_percent     ?? 0
  const pct      = total>0 ? ((ok/total)*100).toFixed(1) : '100.0'
  const [time, setTime] = React.useState(new Date())
  React.useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t)},[])

  // Full-page threat mode
  useEffect(()=>{
    document.body.style.transition = 'background-color 0.8s ease'
    document.body.style.backgroundColor = anomaly ? '#120608' : '#0f1117'
  },[anomaly])

  const statusLabel = anomaly ? 'UNDER ATTACK' : limit <= 50 ? 'HIGH TRAFFIC' : limit <= 80 ? 'BUSY' : 'PROTECTED'
  const statusColor = anomaly ? 'text-threat' : limit <= 50 ? 'text-warn' : 'text-safe'

  return (
    <div className={`min-h-screen transition-colors duration-700`}
      style={{
        background: anomaly
          ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 50% 0%, rgba(0,212,170,0.04) 0%, transparent 60%)',
      }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-700 ${
        anomaly ? 'border-threat/30 bg-ink/95' : 'border-edge bg-ink/85'
      }`}>
        {anomaly && (
          <div className="bg-threat/12 border-b border-threat/30 py-2 flex items-center justify-center gap-3">
            <ShieldAlert size={14} className="text-threat animate-pulse"/>
            <span className="font-sans font-bold text-sm text-threat tracking-wide">
              ⚠ ATTACK DETECTED — AI Shield is actively blocking threats
            </span>
            <ShieldAlert size={14} className="text-threat animate-pulse"/>
          </div>
        )}
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              anomaly ? 'bg-threat/15 border-threat/40' : 'bg-glow/10 border-glow/30'
            }`}>
              {anomaly
                ? <ShieldAlert size={18} className="text-threat" strokeWidth={1.8}/>
                : <ShieldCheck size={18} className="text-glow"   strokeWidth={1.8}/>
              }
            </div>
            <div>
              <div className="font-sans font-extrabold text-white text-lg leading-none">SMART-LIMIT</div>
              <div className="font-mono text-[10px] text-mist mt-0.5">AI-Powered API Shield</div>
            </div>
          </div>

          {/* Center status badge */}
          <div className={`hidden md:flex items-center gap-2 px-5 py-2 rounded-full border font-sans font-bold text-sm ${
            anomaly ? 'bg-threat/10 border-threat/35 text-threat'
            : limit<=50 ? 'bg-warn/10 border-warn/30 text-warn'
            : 'bg-safe/10 border-safe/25 text-safe'
          }`}>
            <span className={`dot ${anomaly?'dot-threat':limit<=50?'dot-warn':'dot-safe'}`}/>
            {statusLabel}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4 font-mono text-xs">
            {stats && (
              <div className="hidden lg:flex gap-5 text-mist">
                <span>REQUESTS <span className="text-cloud font-semibold">{total.toLocaleString()}</span></span>
                <span>BLOCKED <span className={`font-semibold ${blocked>0?'text-threat':'text-mist'}`}>{blocked.toLocaleString()}</span></span>
                <span>AI LIMIT <span className={`font-semibold ${limit<=30?'text-threat':limit<=70?'text-warn':'text-safe'}`}>{limit}</span></span>
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              connected ? 'border-safe/30 bg-safe/8 text-safe' : 'border-threat/30 bg-threat/8 text-threat'
            }`}>
              <span className={`dot ${connected?'dot-safe':'dot-threat'}`} style={{width:6,height:6}}/>
              {connected ? 'LIVE' : 'OFFLINE'}
            </div>
            <div className="text-mist hidden md:block">{time.toLocaleTimeString('en-US',{hour12:false})}</div>
          </div>
        </div>
      </header>

      {/* Offline banner */}
      {!connected && (
        <div className="mx-6 mt-4 card border-warn/30 bg-warn/5 p-4 flex items-start gap-3 fade-up">
          <Clock size={15} className="text-warn mt-0.5 shrink-0"/>
          <div>
            <p className="font-sans font-semibold text-warn text-sm">Backend not running</p>
            <p className="font-mono text-xs text-mist mt-1">
              Open a terminal and run: <span className="text-safe">source venv/bin/activate && python app.py</span>
            </p>
          </div>
        </div>
      )}

      <main className="px-6 py-6 space-y-5 max-w-[1600px] mx-auto">

        {/* ── ROW 1: 4 stat cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="fade-up d1">
            <BigStat label="Total Requests" value={total.toLocaleString()}
              sub="Since server started" icon={Activity} col="text-white"/>
          </div>
          <div className="fade-up d2">
            <BigStat label="Requests Allowed" value={ok.toLocaleString()}
              sub={`${pct}% success rate`} icon={Users}
              col="text-safe" glow={connected?'card-safe':''}/>
          </div>
          <div className="fade-up d3">
            <BigStat label="Requests Blocked" value={blocked.toLocaleString()}
              sub={blocked>0 ? 'AI shield is working' : 'Nothing blocked yet'}
              icon={Ban}
              col={blocked>0?'text-threat':'text-mist'}
              glow={blocked>0?'card-threat':''}
              pulse={anomaly}/>
          </div>
          <div className="fade-up d4">
            <BigStat label="CPU + Memory"
              value={`${cpu.toFixed(0)}%`}
              sub={`Memory: ${mem.toFixed(0)}% used`} icon={Cpu}
              col={cpu>=90?'text-threat':cpu>=70?'text-warn':'text-info'}/>
          </div>
        </div>

        {/* ── ROW 2: Shield meter + Main chart ────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Shield — col span 2 */}
          <div className={`xl:col-span-2 card p-6 flex flex-col items-center justify-center fade-up ${
            anomaly ? 'card-threat' : trend==='up' ? 'card-safe' : 'card-glow'
          }`}>
            <div className="text-center mb-4">
              <h2 className="font-sans font-bold text-white text-base">AI Rate Limit</h2>
              <p className="font-mono text-xs text-mist mt-0.5">
                Automatically adjusts to protect the system
              </p>
            </div>
            <ShieldMeter limit={limit} trend={trend} rate={rate} anomaly={anomaly}/>
          </div>

          {/* Chart — col span 3 */}
          <div className={`xl:col-span-3 card p-5 fade-up d1 ${anomaly?'card-threat':'card-glow'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-sans font-bold text-white text-base">Traffic vs AI Limit</h2>
                <p className="font-mono text-xs text-mist mt-0.5">
                  Blue bars = incoming traffic &nbsp;·&nbsp; Teal line = AI rate limit
                </p>
              </div>
              <div className="text-right">
                <div className={`font-sans text-2xl font-extrabold ${anomaly?'text-threat':'text-info'}`}>
                  {rate.toFixed(0)}
                </div>
                <div className="font-mono text-[10px] text-mist">req/min now</div>
              </div>
            </div>
            <MainChart data={history} anomaly={anomaly}/>
            <div className="flex items-center gap-6 mt-3 font-mono text-[11px] text-mist">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-2.5 rounded inline-block" style={{background:'rgba(59,130,246,0.5)'}}/>
                Incoming traffic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block rounded" style={{background:'#00d4aa',boxShadow:'0 0 4px #00d4aa'}}/>
                AI limit (reacts to traffic)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3.5 inline-block" style={{borderLeft:'2px dashed rgba(239,68,68,0.6)'}}/>
                Attack detected
              </span>
            </div>
          </div>
        </div>

        {/* ── ROW 3: Donut + CPU + Event log + Simulator ──────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Donut */}
          <div className="card p-5 fade-up">
            <h3 className="font-sans font-bold text-white text-sm mb-1">Request Results</h3>
            <p className="font-mono text-[11px] text-mist mb-3">What happened to every request</p>
            <DonutChart ok={ok} blocked={blocked}/>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-deep rounded-xl p-2.5 border border-edge text-center">
                <div className="font-mono text-[10px] text-mist mb-1">ALLOWED</div>
                <div className="font-sans font-bold text-safe text-lg">{ok.toLocaleString()}</div>
              </div>
              <div className="bg-deep rounded-xl p-2.5 border border-edge text-center">
                <div className="font-mono text-[10px] text-mist mb-1">BLOCKED</div>
                <div className={`font-sans font-bold text-lg ${blocked>0?'text-threat':'text-mist'}`}>
                  {blocked.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* CPU sparkline */}
          <div className="card p-5 fade-up d1">
            <h3 className="font-sans font-bold text-white text-sm mb-1">Server Load</h3>
            <p className="font-mono text-[11px] text-mist mb-2">CPU usage over time</p>
            <div className={`font-sans text-4xl font-extrabold mb-3 ${
              cpu>=90?'text-threat':cpu>=70?'text-warn':'text-info'
            }`}>{cpu.toFixed(1)}%</div>
            <CpuSparkline data={history}/>
            <div className="mt-3 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-mist">Memory</span>
                <span className={mem>=85?'text-threat':mem>=70?'text-warn':'text-cloud'}>{mem.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Status</span>
                <span className={cpu>=90?'text-threat':cpu>=70?'text-warn':'text-safe'}>
                  {cpu>=90?'Critical':cpu>=70?'High load':'Healthy'}
                </span>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className={`card p-5 fade-up d2 ${anomaly?'card-threat':''}`}>
            <h3 className="font-sans font-bold text-white text-sm mb-1">AI Activity Log</h3>
            <p className="font-mono text-[11px] text-mist mb-3">Every decision the AI makes</p>
            <EventLog history={history}/>
          </div>

          {/* Simulator */}
          <div className={`card p-5 fade-up d3 ${anomaly?'card-warn':''}`}>
            <Simulator/>
          </div>
        </div>

      </main>

      <footer className="border-t border-edge px-6 py-3 flex items-center justify-between mt-4">
        <div className="font-mono text-[11px] text-dim flex items-center gap-2">
          <ShieldCheck size={11} className="text-glow"/>
          SMART-LIMIT · IsolationForest ML Engine · Flask + React
        </div>
        <div className={`font-mono text-[11px] flex items-center gap-1.5 ${connected?'text-safe':'text-threat'}`}>
          <span className={`dot ${connected?'dot-safe':'dot-threat'}`} style={{width:6,height:6}}/>
          {connected?'Connected to AI Engine':'AI Engine Offline'}
        </div>
      </footer>
    </div>
  )
}
ENDOFFILE

ok "All frontend files written"

# ── npm install ───────────────────────────────────────────────
info "Installing npm packages..."
cd frontend && npm install --silent && cd ..
ok "npm packages installed"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${B}================================================${N}"
echo -e "${G}  ✓ Done! Ready to run.${N}"
echo -e "${B}================================================${N}"
echo ""
echo -e "${B}STEP 1 — Terminal 1 (backend):${N}"
echo -e "  ${C}source venv/bin/activate${N}"
echo -e "  ${C}python app.py${N}"
echo ""
echo -e "${B}STEP 2 — Terminal 2 (dashboard):${N}"
echo -e "  ${C}cd frontend && npm run dev${N}"
echo ""
echo -e "${B}STEP 3 — Open browser:${N}"
echo -e "  ${C}http://localhost:5173${N}"
echo ""
echo -e "${B}STEP 4 — Hit the DDoS button on the dashboard!${N}"
echo -e "  The AI limit will drop from 100 → 5 in real-time."
echo ""
echo -e "${B}================================================${N}"
