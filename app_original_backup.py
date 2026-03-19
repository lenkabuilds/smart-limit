
"""
SMART-LIMIT: Flask Backend with Adaptive Rate Limiting
=======================================================

Main API server with dynamic, AI-driven rate limiting.
"""

import json
import os
import time
import threading
from datetime import datetime
from functools import wraps
from collections import deque

import psutil
from flask import Flask, request, jsonify

from ml_engine import predict_anomaly, get_anomaly_score


# Configuration Constants
BASE_RATE_LIMIT = 100
MIN_RATE_LIMIT = 5
MAX_RATE_LIMIT = 200
CPU_LOW_THRESHOLD = 40
CPU_HIGH_THRESHOLD = 70
CPU_CRITICAL_THRESHOLD = 90
ANOMALY_LIMIT_MULTIPLIER = 0.1
STATS_FILE = "stats.json"
HISTORY_LENGTH = 100

from flask_cors import CORS
app = Flask(__name__)
CORS(app)


class SystemState:
    """Thread-safe container for global system state."""
    
    def __init__(self):
        self.total_requests = 0
        self.success_count = 0
        self.rejected_count = 0
        self.current_limit = BASE_RATE_LIMIT
        self.anomaly_detected = False
        self.current_cpu = 0.0
        self.current_request_rate = 0.0
        self.request_history = {}
        self.metrics_history = deque(maxlen=HISTORY_LENGTH)
        self.lock = threading.Lock()
        
    def add_request(self, ip_address):
        with self.lock:
            self.total_requests += 1
            current_time = time.time()
            
            if ip_address not in self.request_history:
                self.request_history[ip_address] = deque(maxlen=MAX_RATE_LIMIT)
            
            self.request_history[ip_address].append(current_time)
            return self.request_history[ip_address]
    
    def count_recent_requests(self, ip_address, window_seconds=60):
        with self.lock:
            if ip_address not in self.request_history:
                return 0
            
            current_time = time.time()
            cutoff = current_time - window_seconds
            count = sum(1 for t in self.request_history[ip_address] if t > cutoff)
            return count
    
    def record_success(self):
        with self.lock:
            self.success_count += 1
    
    def record_rejection(self):
        with self.lock:
            self.rejected_count += 1
    
    def update_limit(self, new_limit):
        with self.lock:
            self.current_limit = max(MIN_RATE_LIMIT, min(MAX_RATE_LIMIT, new_limit))
    
    def record_metrics(self, cpu_usage, request_rate, anomaly):
        with self.lock:
            self.current_cpu = float(cpu_usage)
            self.current_request_rate = float(request_rate)
            self.anomaly_detected = bool(anomaly)
            
            self.metrics_history.append({
                'timestamp': datetime.now().isoformat(),
                'cpu_usage': float(cpu_usage),
                'request_rate': float(request_rate),
                'anomaly': bool(anomaly),
                'current_limit': int(self.current_limit)
            })
    
    def get_stats(self):
        with self.lock:
            return {
                'total_requests': int(self.total_requests),
                'success_count': int(self.success_count),
                'rejected_count': int(self.rejected_count),
                'current_limit': int(self.current_limit),
                'anomaly_detected': bool(self.anomaly_detected),
                'current_cpu': float(self.current_cpu),
                'current_request_rate': float(self.current_request_rate),
                'timestamp': datetime.now().isoformat()
            }


system_state = SystemState()


def calculate_cpu_usage():
    """Get current system CPU usage percentage."""
    return psutil.cpu_percent(interval=0.1)


def calculate_request_rate():
    """Calculate global request rate (requests per minute)."""
    current_time = time.time()
    window_seconds = 60
    cutoff = current_time - window_seconds
    
    total_recent = 0
    with system_state.lock:
        for ip_history in system_state.request_history.values():
            total_recent += sum(1 for t in ip_history if t > cutoff)
    
    return total_recent


def calculate_dynamic_limit():
    """Calculate dynamic rate limit based on system conditions."""
    cpu_usage = calculate_cpu_usage()
    request_rate = calculate_request_rate()
    
    is_anomaly = predict_anomaly(request_rate, cpu_usage)
    anomaly_score = get_anomaly_score(request_rate, cpu_usage)
    
    print(f"[Rate Limiter] CPU: {cpu_usage:.1f}% | "
          f"Rate: {request_rate:.0f} req/min | "
          f"Anomaly Score: {anomaly_score:.3f} | "
          f"Anomaly: {is_anomaly}")
    
    system_state.record_metrics(cpu_usage, request_rate, is_anomaly)
    
    current_limit = system_state.current_limit
    
    if is_anomaly:
        new_limit = int(BASE_RATE_LIMIT * ANOMALY_LIMIT_MULTIPLIER)
        print(f"[Rate Limiter] ANOMALY DETECTED! Reducing limit to {new_limit}")
    elif cpu_usage > CPU_CRITICAL_THRESHOLD:
        new_limit = MIN_RATE_LIMIT
        print(f"[Rate Limiter] CRITICAL CPU ({cpu_usage:.1f}%)! Emergency mode")
    elif cpu_usage > CPU_HIGH_THRESHOLD:
        new_limit = int(current_limit * 0.7)
        print(f"[Rate Limiter] High CPU ({cpu_usage:.1f}%), reducing limit")
    elif cpu_usage < CPU_LOW_THRESHOLD:
        new_limit = int(current_limit * 1.2)
        print(f"[Rate Limiter] Low CPU ({cpu_usage:.1f}%), increasing limit")
    else:
        new_limit = current_limit
    
    return new_limit


def rate_limit(f):
    """Decorator to enforce dynamic rate limiting."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip_address = request.remote_addr
        
        new_limit = calculate_dynamic_limit()
        system_state.update_limit(new_limit)
        
        recent_requests = system_state.count_recent_requests(ip_address)
        
        if recent_requests > system_state.current_limit:
            system_state.record_rejection()
            
            response = jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': 60,
                'current_limit': system_state.current_limit
            })
            response.status_code = 429
            response.headers['Retry-After'] = '60'
            response.headers['X-RateLimit-Limit'] = str(system_state.current_limit)
            response.headers['X-RateLimit-Remaining'] = '0'
            
            return response
        
        system_state.add_request(ip_address)
        system_state.record_success()
        
        response = f(*args, **kwargs)
        
        if isinstance(response, tuple):
            response_obj, status_code = response
            response_obj.headers['X-RateLimit-Limit'] = str(system_state.current_limit)
            response_obj.headers['X-RateLimit-Remaining'] = str(
                max(0, system_state.current_limit - recent_requests - 1)
            )
            return response_obj, status_code
        
        return response
    
    return decorated_function


def save_stats():
    """Save current statistics to JSON file."""
    stats = system_state.get_stats()
    
    with system_state.lock:
        stats['history'] = list(system_state.metrics_history)
    
    try:
        with open(STATS_FILE, 'w') as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        print(f"[Error] Failed to save stats: {e}")


def stats_writer():
    """Background thread for saving statistics."""
    while True:
        save_stats()
        time.sleep(1)


# API Routes
@app.route('/')
def index():
    return jsonify({
        'name': 'SMART-LIMIT API',
        'version': '1.0.0',
        'description': 'AI-Driven Adaptive API Traffic Control System',
        'endpoints': {
            '/': 'This information page',
            '/api/data': 'Main data endpoint (rate limited)',
            '/stats': 'Current system statistics',
            '/health': 'Health check endpoint'
        },
        'current_rate_limit': system_state.current_limit
    })


@app.route('/api/data')
@rate_limit
def get_data():
    response = jsonify({
        'status': 'success',
        'message': 'Request processed successfully',
        'data': {
            'timestamp': datetime.now().isoformat(),
            'server_info': {
                'cpu_usage': float(system_state.current_cpu),
                'request_rate': float(system_state.current_request_rate),
                'anomaly_detected': bool(system_state.anomaly_detected)
            }
        }
    })
    response.headers['X-RateLimit-Limit'] = str(system_state.current_limit)
    return response


@app.route('/stats')
def get_stats():
    return jsonify(system_state.get_stats())


@app.route('/health')
def health_check():
    cpu = calculate_cpu_usage()
    
    health_status = 'healthy'
    if cpu > CPU_CRITICAL_THRESHOLD:
        health_status = 'critical'
    elif cpu > CPU_HIGH_THRESHOLD:
        health_status = 'degraded'
    
    return jsonify({
        'status': health_status,
        'cpu_usage': cpu,
        'memory_percent': psutil.virtual_memory().percent
    })


# Initialization
start_time = time.time()

def initialize_system():
    print("=" * 60)
    print("SMART-LIMIT: AI-Driven Adaptive API Traffic Control System")
    print("=" * 60)
    print()
    
    print("[Init] Initializing ML Engine...")
    from ml_engine import get_detector
    get_detector()
    print("[Init] ML Engine ready!")
    print()
    
    print("[Init] Starting statistics writer thread...")
    stats_thread = threading.Thread(target=stats_writer, daemon=True)
    stats_thread.start()
    print("[Init] Stats writer thread started!")
    print()
    
    cpu = calculate_cpu_usage()
    memory = psutil.virtual_memory().percent
    print(f"[Init] CPU Usage: {cpu:.1f}%")
    print(f"[Init] Memory Usage: {memory:.1f}%")
    print(f"[Init] Initial Rate Limit: {BASE_RATE_LIMIT} requests/min")
    print()
    
    print("=" * 60)
    print("Server ready! Endpoints:")
    print("  - http://localhost:5000/")
    print("  - http://localhost:5000/api/data")
    print("  - http://localhost:5000/stats")
    print("  - http://localhost:5000/health")
    print("=" * 60)
    print()


initialize_system()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)

