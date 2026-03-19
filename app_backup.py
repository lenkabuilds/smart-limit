"""
SMART-LIMIT Backend v3
======================
Key fix: Rate limit now VISIBLY reacts to traffic intensity.
- Normal traffic (~5 req/s)  → limit stays at 100
- Rush hour (~20 req/s)      → limit drops to ~60
- Spike (~50 req/s)          → limit drops to ~25
- DDoS (~100 req/s + anomaly)→ limit crashes to 5-10
- When traffic stops         → limit recovers back to 100

This makes the dashboard dramatic and clearly shows the AI working.
"""

import json
import os
import sys
import time
import threading
import subprocess
from datetime import datetime
from functools import wraps
from collections import deque

import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS

from ml_engine import predict_anomaly, get_anomaly_score


# ── Config ─────────────────────────────────────────────────────────────────
BASE_RATE_LIMIT        = 100   # normal operating limit
MIN_RATE_LIMIT         = 5     # absolute floor during attack
MAX_RATE_LIMIT         = 150   # ceiling (shows AI boosting when quiet)
HISTORY_LENGTH         = 120
STATS_FILE             = "stats.json"

# Traffic thresholds (req/min) that trigger limit reductions
TRAFFIC_NORMAL_THRESH  = 100   # below this = normal, limit can rise
TRAFFIC_HIGH_THRESH    = 300   # 5 req/s × 60 = 300/min is "normal"
TRAFFIC_SPIKE_THRESH   = 1500  # spike territory
TRAFFIC_DDOS_THRESH    = 3000  # DDoS territory

app = Flask(__name__)
CORS(app)


class SystemState:
    def __init__(self):
        self.total_requests       = 0
        self.success_count        = 0
        self.rejected_count       = 0
        self.current_limit        = BASE_RATE_LIMIT
        self.anomaly_detected     = False
        self.current_cpu          = 0.0
        self.current_request_rate = 0.0
        self.request_history      = {}
        self.metrics_history      = deque(maxlen=HISTORY_LENGTH)
        self.lock                 = threading.Lock()

    def add_request(self, ip_address):
        with self.lock:
            self.total_requests += 1
            now = time.time()
            if ip_address not in self.request_history:
                self.request_history[ip_address] = deque(maxlen=500)
            self.request_history[ip_address].append(now)

    def count_recent_requests(self, ip_address, window_seconds=60):
        with self.lock:
            if ip_address not in self.request_history:
                return 0
            cutoff = time.time() - window_seconds
            return sum(1 for t in self.request_history[ip_address] if t > cutoff)

    def record_success(self):
        with self.lock:
            self.success_count += 1

    def record_rejection(self):
        with self.lock:
            self.rejected_count += 1

    def update_limit(self, new_limit):
        with self.lock:
            self.current_limit = max(MIN_RATE_LIMIT, min(MAX_RATE_LIMIT, new_limit))

    def record_metrics(self, cpu, rate, anomaly, limit):
        with self.lock:
            self.current_cpu          = float(cpu)
            self.current_request_rate = float(rate)
            self.anomaly_detected     = bool(anomaly)
            self.metrics_history.append({
                'timestamp':     datetime.now().isoformat(),
                'cpu_usage':     float(cpu),
                'request_rate':  float(rate),
                'anomaly':       bool(anomaly),
                'current_limit': int(limit),
            })

    def get_stats(self):
        with self.lock:
            return {
                'total_requests':       int(self.total_requests),
                'success_count':        int(self.success_count),
                'rejected_count':       int(self.rejected_count),
                'current_limit':        int(self.current_limit),
                'anomaly_detected':     bool(self.anomaly_detected),
                'current_cpu':          float(self.current_cpu),
                'current_request_rate': float(self.current_request_rate),
                'timestamp':            datetime.now().isoformat(),
            }


system_state = SystemState()


def get_cpu():
    return psutil.cpu_percent(interval=0.1)


def get_request_rate():
    """Global requests per minute across all IPs."""
    cutoff = time.time() - 60
    total  = 0
    with system_state.lock:
        for h in system_state.request_history.values():
            total += sum(1 for t in h if t > cutoff)
    return float(total)


def calculate_dynamic_limit():
    """
    AI rate limit logic — visibly reacts to traffic intensity.

    Rate (req/min) → Action
    ─────────────────────────────────────────────────
    < 100           → Quiet! Boost limit to 120-150
    100–300         → Normal. Hold at 100
    300–1500        → Elevated. Drop to 60-80
    1500–3000       → Spike! Drop to 20-40
    > 3000 + anomaly→ DDoS! Emergency floor 5-15
    ─────────────────────────────────────────────────
    CPU also factors in independently.
    """
    cpu        = get_cpu()
    rate       = get_request_rate()
    is_anomaly = predict_anomaly(rate, cpu)
    score      = get_anomaly_score(rate, cpu)

    cur = system_state.current_limit

    # ── Primary driver: request rate ──────────────────────────────
    if is_anomaly and rate > TRAFFIC_DDOS_THRESH:
        # Full DDoS + ML confirms: emergency floor
        target = MIN_RATE_LIMIT
        reason = f"DDoS+anomaly (rate={rate:.0f}, score={score:.2f})"

    elif is_anomaly and rate > TRAFFIC_SPIKE_THRESH:
        # Spike + anomaly: severe throttle
        target = 15
        reason = f"Spike+anomaly (rate={rate:.0f})"

    elif rate > TRAFFIC_DDOS_THRESH:
        # Very high rate even without anomaly confirmation
        target = 10
        reason = f"Extreme rate ({rate:.0f} req/min)"

    elif rate > TRAFFIC_SPIKE_THRESH:
        # Spike traffic (50 req/s = 3000/min but let's be reactive)
        target = max(20, int(BASE_RATE_LIMIT * 0.25))
        reason = f"Traffic spike ({rate:.0f} req/min)"

    elif rate > TRAFFIC_HIGH_THRESH:
        # Elevated traffic (rush hour, 20 req/s = 1200/min)
        # Scale: 300→100%, 1500→25%
        scale  = 1.0 - ((rate - TRAFFIC_HIGH_THRESH) / (TRAFFIC_SPIKE_THRESH - TRAFFIC_HIGH_THRESH)) * 0.6
        target = max(40, int(BASE_RATE_LIMIT * scale))
        reason = f"High traffic ({rate:.0f} req/min)"

    elif rate < TRAFFIC_NORMAL_THRESH:
        # Very quiet: reward with higher limit (shows AI is smart)
        target = min(MAX_RATE_LIMIT, int(cur * 1.1))
        reason = f"Low traffic ({rate:.0f} req/min) — scaling up"

    else:
        # Normal range: hold steady
        target = BASE_RATE_LIMIT
        reason = f"Normal ({rate:.0f} req/min)"

    # ── Secondary: CPU penalty ─────────────────────────────────────
    if cpu > 90:
        target = min(target, MIN_RATE_LIMIT + 5)
        reason += f" + CPU critical ({cpu:.1f}%)"
    elif cpu > 70:
        target = min(target, int(target * 0.7))
        reason += f" + CPU high ({cpu:.1f}%)"

    # ── Smooth transition (avoid jarring jumps) ────────────────────
    # Fast drop (threats need immediate response): alpha=0.7
    # Slow recovery (don't re-open too fast): alpha=0.15
    if target < cur:
        alpha = 0.7   # fast drop
    else:
        alpha = 0.15  # slow recovery

    smoothed = int(alpha * target + (1 - alpha) * cur)
    smoothed = max(MIN_RATE_LIMIT, min(MAX_RATE_LIMIT, smoothed))

    print(f"[AI] rate={rate:.0f}/min cpu={cpu:.1f}% anomaly={is_anomaly} "
          f"target={target} smoothed={smoothed} | {reason}")

    system_state.record_metrics(cpu, rate, is_anomaly, smoothed)
    return smoothed


def rate_limit_decorator(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        ip     = request.remote_addr
        new    = calculate_dynamic_limit()
        system_state.update_limit(new)
        recent = system_state.count_recent_requests(ip)

        if recent > system_state.current_limit:
            system_state.record_rejection()
            resp = jsonify({
                'error':         'Rate limit exceeded',
                'retry_after':   10,
                'current_limit': system_state.current_limit,
            })
            resp.status_code = 429
            resp.headers['Retry-After']           = '10'
            resp.headers['X-RateLimit-Limit']     = str(system_state.current_limit)
            resp.headers['X-RateLimit-Remaining'] = '0'
            return resp

        system_state.add_request(ip)
        system_state.record_success()
        resp = f(*args, **kwargs)
        if isinstance(resp, tuple):
            r, code = resp
            r.headers['X-RateLimit-Limit']     = str(system_state.current_limit)
            r.headers['X-RateLimit-Remaining'] = str(max(0, system_state.current_limit - recent - 1))
            return r, code
        return resp
    return decorated


# ── Stats persistence ──────────────────────────────────────────────────────
def save_stats():
    stats = system_state.get_stats()
    with system_state.lock:
        stats['history'] = list(system_state.metrics_history)
    try:
        with open(STATS_FILE, 'w') as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        print(f"[Error] save_stats: {e}")

def stats_writer():
    while True:
        save_stats()
        time.sleep(1)


# ── Simulator ──────────────────────────────────────────────────────────────
_sim_proc = None

def _run_sim(mode, duration, threads):
    try:
        result = subprocess.run(
            [sys.executable, "simulator.py",
             "--mode", mode, "--duration", str(duration),
             "--threads", str(threads),
             "--url", "http://localhost:5000/api/data"],
            timeout=duration + 15
        )
        print(f"[Sim] {mode} finished (exit {result.returncode})")
    except subprocess.TimeoutExpired:
        print(f"[Sim] {mode} timed out")
    except Exception as e:
        print(f"[Sim] Error: {e}")


# ── Routes ─────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return jsonify({'name': 'SMART-LIMIT', 'version': '3.0',
                    'current_rate_limit': system_state.current_limit})

@app.route('/api/data')
@rate_limit_decorator
def get_data():
    r = jsonify({
        'status': 'success',
        'timestamp': datetime.now().isoformat(),
        'current_limit': system_state.current_limit,
    })
    r.headers['X-RateLimit-Limit'] = str(system_state.current_limit)
    return r

@app.route('/stats')
def get_stats():
    return jsonify(system_state.get_stats())

@app.route('/stats/history')
def get_history():
    with system_state.lock:
        h = list(system_state.metrics_history)
    return jsonify({'history': h})

@app.route('/health')
def health():
    cpu = get_cpu()
    mem = psutil.virtual_memory()
    return jsonify({
        'status':          'healthy' if cpu < 70 else ('degraded' if cpu < 90 else 'critical'),
        'cpu_usage':        cpu,
        'memory_percent':  mem.percent,
    })

@app.route('/simulate', methods=['POST', 'OPTIONS'])
def simulate():
    if request.method == 'OPTIONS':
        return '', 204
    mode   = request.args.get('mode',   'normal')
    action = request.args.get('action', 'start')
    if action == 'stop':
        return jsonify({'status': 'stopped'})

    cfg = {
        'normal':    {'duration': 60,  'threads': 3},
        'rush_hour': {'duration': 45,  'threads': 6},
        'spike':     {'duration': 30,  'threads': 10},
        'ddos':      {'duration': 20,  'threads': 20},
    }.get(mode, {'duration': 30, 'threads': 5})

    t = threading.Thread(target=_run_sim,
                         args=(mode, cfg['duration'], cfg['threads']),
                         daemon=True)
    t.start()
    print(f"[Sim] Launched {mode}: {cfg['threads']} threads × {cfg['duration']}s")
    return jsonify({'status': 'started', 'mode': mode, **cfg})


# ── Init ───────────────────────────────────────────────────────────────────
def init():
    print("=" * 50)
    print("  SMART-LIMIT v3")
    print("=" * 50)
    from ml_engine import get_detector
    get_detector()
    print("[OK] ML Engine ready")
    threading.Thread(target=stats_writer, daemon=True).start()
    print("[OK] Stats writer running")
    print(f"[OK] Base limit: {BASE_RATE_LIMIT} req/min")
    print("=" * 50)
    print("  http://localhost:5000  (backend)")
    print("  http://localhost:5173  (dashboard)")
    print("=" * 50)

init()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
