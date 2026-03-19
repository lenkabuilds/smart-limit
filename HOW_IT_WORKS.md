# How SMART-LIMIT Works

A technical deep-dive into the system architecture, algorithms, and design decisions.

---

## Overview

SMART-LIMIT solves a real problem: standard rate limiters are static. They allow 100 requests per minute regardless of whether those requests represent normal usage or a coordinated DDoS attack. SMART-LIMIT uses machine learning to understand what "normal" looks like and dynamically shrinks the allowed rate when it detects anomalies.

---

## 1. The Rate Limiting Algorithm

SMART-LIMIT uses a **sliding window counter** — more accurate than token buckets or fixed windows.

### How it works

For each IP address, we maintain a deque (double-ended queue) of request timestamps. On every incoming request:

```python
# 1. Remove timestamps older than 60 seconds
cutoff = time.time() - 60
while queue and queue[0] < cutoff:
    queue.popleft()

# 2. Count remaining timestamps = requests in last 60 seconds
count = len(queue)

# 3. Compare against current dynamic limit
if count >= current_limit:
    return 429  # Too Many Requests
else:
    queue.append(time.time())
    return process_request()
```

### Why sliding window over token bucket?

- **Token bucket** is good for smoothing burst traffic but allows a burst at the start of each window
- **Fixed window** has the "boundary attack" problem (double the allowed rate across window boundaries)
- **Sliding window** is precise — exactly N requests per 60 seconds, no edge cases

---

## 2. The ML Anomaly Detection

The ML engine uses scikit-learn's `IsolationForest` — an unsupervised anomaly detection algorithm.

### Why IsolationForest?

- Works without labeled attack data (we don't need "here are 1000 DDoS examples")
- Fast inference (< 1ms per prediction)
- Good at finding outliers in high-dimensional space
- No GPU needed

### Training Data

The model trains on 1,000 synthetic "normal" traffic samples generated at startup:

```python
# Normal request rates: centered at 50/min, std dev 15
request_rates = np.random.normal(loc=50, scale=15, size=1000)

# CPU usage correlates with request rate (more traffic = more CPU)
cpu_usage = 35 + request_rates * 0.3 + noise
```

This establishes what "normal" looks like: moderate request rates with correlated, reasonable CPU usage.

### Anomaly Scoring

IsolationForest assigns each observation a **decision function score**:
- Score close to 0 = hard to isolate = normal
- Score very negative = easy to isolate = anomaly

```python
X = [[request_rate, cpu_usage]]
prediction = model.predict(X)   # 1=normal, -1=anomaly
score = model.decision_function(X)  # continuous score
```

A DDoS attack (1000+ req/min) or CPU spike (90%+) will be far outside the training distribution and score as a strong anomaly.

---

## 3. The Adaptive Limit Controller

This is the "brain" that combines the ML score with traffic statistics to set the limit.

### Decision Logic

```python
if is_anomaly and rate > 3000:
    target = 5        # Emergency floor

elif is_anomaly and rate > 1500:
    target = 15       # Severe throttle

elif rate > 3000:
    target = 10       # High rate even without confirmed anomaly

elif rate > 1500:
    target = 25       # Spike territory

elif rate > 300:
    # Proportional reduction: 300→100%, 1500→40%
    scale = 1.0 - ((rate - 300) / 1200) * 0.6
    target = max(40, int(100 * scale))

elif rate < 100:
    target = min(150, current * 1.1)  # Reward quiet periods

else:
    target = 100      # Normal, hold steady
```

### Smoothing

Raw target values would cause jarring jumps. We apply exponential moving average:

```python
# Fast drop: respond quickly to threats
alpha = 0.7  if target < current else 0.15

smoothed = int(alpha * target + (1 - alpha) * current)
```

This means:
- **Attacks**: limit drops to target in ~2 ticks (fast response)
- **Recovery**: limit rises slowly over ~20 ticks (don't re-open too fast)

---

## 4. The Dashboard Architecture

### Polling Strategy

The React frontend polls `/stats` every 1 second using a custom hook:

```javascript
useEffect(() => {
    poll()  // immediate first call
    const timer = setInterval(poll, 1000)
    return () => clearInterval(timer)
}, [])
```

Each poll returns the current stats snapshot. The frontend maintains a rolling 80-point history array for charts.

### Limit Change Detection

The hook tracks the previous limit value and detects changes:

```javascript
if (prev !== null && newLimit !== prev) {
    setTrend(newLimit < prev ? 'down' : 'up')
    setTimeout(() => setTrend(null), 1800)
}
```

When `trend` is set, the `ShieldMeter` component plays a CSS animation (`limitDrop` or `limitRise`) on the big number.

### Threat Mode

When `anomaly_detected = true`, the entire UI switches to "threat mode":
- Page background shifts to dark red
- Header shows emergency banner
- All cards get red glow borders
- Shield meter shows emergency status

This is driven by a single boolean flowing through React props:

```jsx
<div style={{ backgroundColor: anomaly ? '#120608' : '#0f1117' }}>
```

---

## 5. The Attack Simulator

The simulator generates real HTTP traffic by spawning threads that each send requests at a configured rate:

```python
def traffic_thread(url, req_per_second, stop_event):
    while not stop_event.is_set():
        send_request(url)
        time.sleep(1.0 / req_per_second)

# DDoS: 20 threads × 5 req/s each = 100 req/s = 6000 req/min
threads = [Thread(target=traffic_thread, args=(url, 5, stop)) for _ in range(20)]
```

The simulator hits `/api/data` which goes through the real rate limiter, so blocked responses are counted and displayed.

### Mode Configuration

| Mode | Threads | Per-thread rate | Total rate |
|------|---------|----------------|------------|
| Normal | 3 | ~1.7 req/s | ~5 req/s = 300/min |
| Rush Hour | 6 | ~3.3 req/s | ~20 req/s = 1200/min |
| Spike | 10 | ~5 req/s | ~50 req/s = 3000/min |
| DDoS | 20 | ~5 req/s | ~100 req/s = 6000/min |

---

## 6. Data Flow

```
Request arrives
      │
      ▼
Rate Limit Middleware
      │
      ├── count_recent_requests(ip) ──► > limit? → 429
      │
      ├── calculate_dynamic_limit()
      │         │
      │         ├── get_cpu()              [psutil]
      │         ├── get_request_rate()     [sliding window sum]
      │         ├── predict_anomaly()      [IsolationForest]
      │         └── smooth(target, cur)    [EMA]
      │
      └── record_metrics() → metrics_history deque
                                    │
                                    ▼
                            stats_writer() [background thread]
                                    │
                                    ▼
                              stats.json  ◄── /stats endpoint
                                               │
                                               ▼
                                     React dashboard (polls 1/s)
```

---

## 7. Design Decisions

**Why Flask over FastAPI?**
Simplicity. For a prototype, Flask's synchronous model is easier to reason about. The rate limiting logic is inherently stateful and single-process, so async doesn't add value here.

**Why IsolationForest over a threshold rule?**
A simple threshold (rate > 500 = anomaly) is brittle. IsolationForest captures the *joint* distribution of rate + CPU, so it handles cases like: moderate rate but unusually high CPU (might indicate a complex attack), or very high rate but CPU is fine (might be a flash crowd, not an attack).

**Why synthetic training data?**
We don't have labeled real attack data. Synthetic data lets us define "normal" precisely. The model learns the normal boundary and flags anything outside it — which is exactly what we want.

**Why React over Streamlit?**
Streamlit is great for data science notebooks. For a production-looking monitoring dashboard with custom animations, smooth state transitions, and fine-grained control over every pixel, React is the right tool.
