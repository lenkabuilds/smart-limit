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
