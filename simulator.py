
"""
SMART-LIMIT: Traffic Simulator
==============================

Simulates realistic API traffic patterns to demonstrate the adaptive rate limiter.
"""

import time
import threading
import random
import argparse
from datetime import datetime

import requests
from requests.exceptions import RequestException


DEFAULT_SERVER_URL = "http://localhost:5000/api/data"

TRAFFIC_MODES = {
    'normal': {
        'requests_per_second': 5,
        'variance': 2,
        'description': 'Normal traffic - steady, moderate load'
    },
    'rush_hour': {
        'requests_per_second': 20,
        'variance': 5,
        'description': 'Rush hour - high traffic volume'
    },
    'ddos': {
        'requests_per_second': 100,
        'variance': 20,
        'description': 'DDoS attack - overwhelming traffic'
    },
    'spike': {
        'requests_per_second': 50,
        'variance': 30,
        'description': 'Traffic spike - sudden burst'
    }
}


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class Statistics:
    def __init__(self):
        self.total_requests = 0
        self.success_count = 0
        self.rejected_count = 0
        self.error_count = 0
        self.lock = threading.Lock()
        self.start_time = time.time()
    
    def record_response(self, status_code):
        with self.lock:
            self.total_requests += 1
            if status_code == 200:
                self.success_count += 1
            elif status_code == 429:
                self.rejected_count += 1
            else:
                self.error_count += 1
    
    def get_summary(self):
        with self.lock:
            elapsed = time.time() - self.start_time
            return {
                'total': self.total_requests,
                'success': self.success_count,
                'rejected': self.rejected_count,
                'errors': self.error_count,
                'elapsed': elapsed,
                'rate': self.total_requests / elapsed if elapsed > 0 else 0
            }


stats = Statistics()


def send_request(url, request_id):
    try:
        response = requests.get(url, timeout=5)
        status_code = response.status_code
        rate_limit = response.headers.get('X-RateLimit-Limit', 'N/A')
        
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        
        if status_code == 200:
            color = Colors.GREEN
            status_text = "SUCCESS"
        elif status_code == 429:
            color = Colors.RED
            status_text = "RATE LIMITED"
        else:
            color = Colors.YELLOW
            status_text = f"ERROR {status_code}"
        
        print(f"{color}[{timestamp}] Request #{request_id:4d} | "
              f"Status: {status_code} ({status_text}) | "
              f"Limit: {rate_limit}{Colors.RESET}")
        
        stats.record_response(status_code)
        return status_code
        
    except RequestException as e:
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        print(f"{Colors.RED}[{timestamp}] Request #{request_id:4d} | "
              f"Error: {str(e)[:30]}{Colors.RESET}")
        stats.record_response(0)
        return 0


def traffic_thread(url, requests_per_second, variance, duration, thread_id, stop_event):
    start_time = time.time()
    request_count = 0
    
    while not stop_event.is_set():
        if duration > 0 and (time.time() - start_time) >= duration:
            break
        
        actual_rate = requests_per_second + random.uniform(-variance, variance)
        actual_rate = max(0.1, actual_rate)
        delay = 1.0 / actual_rate
        
        request_count += 1
        request_id = thread_id * 10000 + request_count
        send_request(url, request_id)
        
        time.sleep(delay)


def run_traffic_simulation(url, duration, num_threads, mode):
    stop_event = threading.Event()
    threads = []
    
    for i in range(num_threads):
        thread = threading.Thread(
            target=traffic_thread,
            args=(url, mode['requests_per_second'] / num_threads,
                  mode['variance'], duration, i, stop_event)
        )
        threads.append(thread)
        thread.start()
    
    if duration > 0:
        time.sleep(duration)
        stop_event.set()
    
    for thread in threads:
        thread.join(timeout=2)
    
    print_summary()


def print_summary():
    summary = stats.get_summary()
    
    print(f"\n{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.CYAN}SIMULATION COMPLETE{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"Total Requests: {summary['total']}")
    print(f"Successful (200): {Colors.GREEN}{summary['success']}{Colors.RESET}")
    print(f"Rate Limited (429): {Colors.RED}{summary['rejected']}{Colors.RESET}")
    print(f"Errors: {Colors.YELLOW}{summary['errors']}{Colors.RESET}")
    print(f"Elapsed Time: {summary['elapsed']:.2f}s")
    print(f"Average Rate: {summary['rate']:.2f} req/s")
    
    if summary['total'] > 0:
        success_rate = (summary['success'] / summary['total']) * 100
        print(f"Success Rate: {success_rate:.1f}%")
    
    print(f"{Colors.CYAN}{'='*60}{Colors.RESET}\n")


def main():
    parser = argparse.ArgumentParser(description='SMART-LIMIT Traffic Simulator')
    
    parser.add_argument('--mode', '-m', choices=['normal', 'rush_hour', 'ddos', 'spike'],
                        default='normal', help='Traffic simulation mode')
    parser.add_argument('--url', '-u', default=DEFAULT_SERVER_URL, help='Target URL')
    parser.add_argument('--duration', '-d', type=float, default=30, help='Duration in seconds')
    parser.add_argument('--threads', '-t', type=int, default=5, help='Concurrent threads')
    
    args = parser.parse_args()
    
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}SMART-LIMIT Traffic Simulator{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"Target URL: {args.url}")
    print(f"Mode: {args.mode}")
    print(f"Threads: {args.threads}")
    print(f"Duration: {args.duration}s")
    
    try:
        requests.get(args.url.rsplit('/', 1)[0], timeout=5)
        print(f"{Colors.GREEN}Server is reachable!{Colors.RESET}")
    except RequestException:
        print(f"{Colors.RED}Warning: Cannot reach server at {args.url}{Colors.RESET}")
        print(f"{Colors.YELLOW}Make sure the server is running first!{Colors.RESET}")
        return
    
    mode = TRAFFIC_MODES[args.mode]
    print(f"\n{Colors.BLUE}Mode: {mode['description']}{Colors.RESET}\n")
    
    run_traffic_simulation(args.url, args.duration, args.threads, mode)


if __name__ == '__main__':
    main()

