<div align="center">

<img src="https://img.shields.io/badge/SMART--LIMIT-v3.0-00d4aa?style=for-the-badge&logo=shield&logoColor=white" alt="version"/>
<img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white"/>
<img src="https://img.shields.io/badge/ML-IsolationForest-FF6B35?style=for-the-badge&logo=scikit-learn&logoColor=white"/>
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>

<br/><br/>

# 🛡️ SMART-LIMIT

### AI-Powered Adaptive API Rate Limiting System

**SMART-LIMIT** uses machine learning to detect traffic anomalies and automatically adjust rate limits in real-time — protecting your API from DDoS attacks, traffic spikes, and abuse, while keeping legitimate users unaffected.

[**Live Demo**](#demo) · [**Quick Start**](#quick-start) · [**How It Works**](#how-it-works) · [**Documentation**](#documentation)

<br/>

```
Normal traffic  →  Limit: 100 req/min  →  ✅ All requests pass
Rush hour       →  Limit:  70 req/min  →  ⚡ AI adapts automatically
DDoS attack     →  Limit:   5 req/min  →  🛡️ System protected, threats blocked
Attack stops    →  Limit: 100 req/min  →  ✅ Auto-recovery complete
```

</div>

---

## 📸 Dashboard Preview

| Normal State | Under Attack |
|:---:|:---:|
| Green shield, limit at 100 | Red alert, AI drops limit to 5 |
| All traffic flows freely | Threats blocked, system protected |

> The dashboard switches between **green (protected)** and **red (threat active)** in real-time as attacks are simulated.

---

## ✨ Features

- 🤖 **AI Anomaly Detection** — IsolationForest ML model detects unusual traffic patterns automatically
- ⚡ **Adaptive Rate Limiting** — Limit adjusts in real-time based on traffic intensity and CPU load
- 🎯 **Attack Simulator** — Built-in simulator for Normal / Rush Hour / Spike / DDoS scenarios
- 📊 **Live Dashboard** — React frontend with real-time charts, event log, and threat visualization
- 🔄 **Auto Recovery** — Rate limit automatically restores after threats clear
- 🧠 **Smart Decisions** — AI logs every decision with reason (visible in the dashboard)
- 🚀 **One-Command Setup** — Single install script for Fedora/Linux

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SMART-LIMIT System                       │
│                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│   │   React      │    │    Flask     │    │  ML Engine  │  │
│   │  Dashboard   │◄──►│   Backend   │◄──►│ IsolationF. │  │
│   │ localhost:   │    │ localhost:  │    │             │  │
│   │    5173      │    │    5000     │    │  Anomaly    │  │
│   └──────────────┘    └──────┬───────┘    │  Detection  │  │
│                              │            └─────────────┘  │
│                    ┌─────────▼──────┐                       │
│                    │   Simulator    │                       │
│                    │  Normal/Rush/  │                       │
│                    │  Spike/DDoS   │                       │
│                    └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TailwindCSS | Live dashboard UI |
| Charts | Recharts | Traffic & limit visualization |
| Backend | Flask 3 + Flask-CORS | REST API server |
| ML | scikit-learn IsolationForest | Anomaly detection |
| Rate Limiter | Sliding window algorithm | Per-IP request tracking |
| Simulator | Python threading + requests | Traffic simulation |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Fedora Linux (or any Linux distro)

### Option A — One-Command Install (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/smart-limit.git
cd smart-limit

# 2. Run the installer (does everything automatically)
chmod +x install.sh
./install.sh
```

### Option B — Manual Install

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/smart-limit.git
cd smart-limit

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

---

## ▶️ Running the Project

You need **two terminals** open at the same time.

**Terminal 1 — Start the backend:**
```bash
source venv/bin/activate
python app.py
```
> You should see: `Backend → http://localhost:5000`

**Terminal 2 — Start the dashboard:**
```bash
cd frontend
npm run dev
```
> You should see: `Local: http://localhost:5173`

**Open your browser:** [http://localhost:5173](http://localhost:5173)

---

## 🎮 Running a Demo

Once both servers are running, use the **Attack Simulator** panel on the dashboard:

| Button | What happens |
|--------|-------------|
| 🟢 Normal Day | 5 req/s · AI limit stays ~100 |
| 🔵 Rush Hour | 20 req/s · AI drops limit to ~70 |
| 🟡 Traffic Spike | 50 req/s · AI drops limit to ~25 |
| 🔴 DDoS Attack | 100 req/s · ML anomaly fires · Limit crashes to 5–15 · **Page goes red** |

Or run the simulator manually from a third terminal:

```bash
source venv/bin/activate

# Normal traffic
python simulator.py --mode normal --duration 60 --threads 3

# Rush hour
python simulator.py --mode rush_hour --duration 45 --threads 6

# Traffic spike
python simulator.py --mode spike --duration 30 --threads 10

# Full DDoS attack (most dramatic — triggers ML anomaly)
python simulator.py --mode ddos --duration 20 --threads 15
```

---

## 📁 Project Structure

```
smart-limit/
│
├── app.py                  # Flask backend (main server)
├── ml_engine.py            # IsolationForest ML anomaly detector
├── simulator.py            # Traffic simulator (4 attack modes)
├── requirements.txt        # Python dependencies
├── install.sh              # One-command Fedora installer
│
└── frontend/               # React dashboard
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx                    # Main layout
        ├── index.css                  # Global styles + animations
        ├── components/
        │   ├── ShieldMeter.jsx        # Circular AI rate limit gauge
        │   ├── Charts.jsx             # Traffic + CPU + donut charts
        │   ├── Simulator.jsx          # Attack simulator panel
        │   ├── EventLog.jsx           # AI decision log
        │   └── BigStat.jsx            # KPI stat cards
        ├── hooks/
        │   └── useMetrics.js          # Polling hook (1s interval)
        └── services/
            └── api.js                 # Backend API calls
```

---

## ⚙️ How It Works

### 1. Rate Limiting Engine

Every incoming request passes through a **sliding window counter** per IP address. The window is 60 seconds. If an IP exceeds the current limit, it gets a `429 Too Many Requests` response.

### 2. ML Anomaly Detection

The backend runs an **IsolationForest** model trained on synthetic "normal" traffic patterns:
- Normal: ~50 req/min, CPU ~35–55%
- The model scores any new observation (request_rate, cpu_usage)
- Outliers trigger `anomaly_detected = True`

### 3. Adaptive Limit Calculation

On every request, the AI calculates a new limit:

```
Traffic < 100/min    →  Limit rises  (quiet period, reward)
Traffic 100–300/min  →  Limit ~100   (normal, hold)
Traffic 300–1500/min →  Limit 60–80  (elevated, reduce)
Traffic 1500–3000/min→  Limit 20–40  (spike, throttle)
Traffic > 3000/min
+ ML anomaly fires   →  Limit 5–15   (emergency floor)

CPU > 70%            →  Additional 30% reduction
CPU > 90%            →  Emergency floor regardless
```

Recovery is **intentionally slow** (alpha=0.15) to prevent attackers from rapidly resuming after a brief pause.

### 4. Dashboard

The React frontend polls `/stats` every 1 second and updates:
- Circular arc gauge (the AI limit number)
- Traffic vs Limit combo chart
- CPU sparkline
- Success/Blocked donut
- AI Activity Log (every limit change, every anomaly)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Server info |
| `GET` | `/api/data` | Rate-limited data endpoint |
| `GET` | `/stats` | Current system statistics |
| `GET` | `/stats/history` | Historical metrics (last 120 points) |
| `GET` | `/health` | Health check (CPU, memory, status) |
| `POST` | `/simulate?mode=ddos` | Trigger traffic simulation |

### `/stats` Response Example

```json
{
  "total_requests": 1842,
  "success_count": 1654,
  "rejected_count": 188,
  "current_limit": 23,
  "anomaly_detected": true,
  "current_cpu": 67.3,
  "current_request_rate": 2847.0,
  "timestamp": "2025-03-19T14:32:10.441Z"
}
```

---

## 🧠 ML Model Details

| Parameter | Value |
|-----------|-------|
| Algorithm | IsolationForest |
| Training samples | 1,000 synthetic normal patterns |
| Features | request_rate, cpu_usage |
| Contamination | 0.1 (10% expected anomaly rate) |
| Estimators | 100 trees |
| Scaler | StandardScaler |

The model is trained on startup and runs inference on every single request. No GPU required — inference takes < 1ms.

---

## 🛠️ Configuration

Edit the constants at the top of `app.py` to tune the system:

```python
BASE_RATE_LIMIT        = 100   # Normal operating limit
MIN_RATE_LIMIT         = 5     # Absolute floor during attack
MAX_RATE_LIMIT         = 150   # Ceiling when traffic is low

# Traffic thresholds (requests per minute)
TRAFFIC_NORMAL_THRESH  = 100   # Below this = boost limit
TRAFFIC_HIGH_THRESH    = 300   # Above = start reducing
TRAFFIC_SPIKE_THRESH   = 1500  # Spike territory
TRAFFIC_DDOS_THRESH    = 3000  # DDoS territory
```

---

## 🐛 Troubleshooting

**Dashboard shows "Backend Offline"**
```bash
# Make sure venv is active and Flask is running
source venv/bin/activate
python app.py
```

**`ModuleNotFoundError: flask_cors`**
```bash
source venv/bin/activate
pip install flask-cors
```

**Port 5000 already in use**
```bash
sudo lsof -i :5000
kill -9 <PID>
```

**Simulator buttons don't trigger traffic**
```bash
# Run manually in a third terminal
source venv/bin/activate
python simulator.py --mode ddos --duration 20 --threads 15
```

**npm install warnings about vulnerabilities**
> These are in dev-only build tools. Safe to ignore. Do NOT run `npm audit fix --force`.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Your Name**
- GitHub: [@lenkabuilds](https://github.com/lenkabuilds)
- Project: [smart-limit](https://github.com/YOUR_USERNAME/smart-limit)

---

<div align="center">

**If this project helped you, consider giving it a ⭐**

Made with 🛡️ and machine learning

</div>
