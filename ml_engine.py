
"""
SMART-LIMIT: ML Engine Module
=============================

This module implements the Machine Learning brain of the adaptive traffic control system.
It uses an IsolationForest algorithm for anomaly detection to identify unusual traffic patterns
that might indicate DDoS attacks, traffic spikes, or system stress conditions.
"""

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os


class AnomalyDetector:
    """
    Anomaly Detector using IsolationForest algorithm.
    """
    
    def __init__(self, contamination=0.1, n_estimators=100, random_state=42):
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
            max_samples='auto'
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_training_data(self, n_samples=1000):
        """Generate synthetic training data representing 'normal' traffic patterns."""
        np.random.seed(42)
        
        # Generate normal request rates (requests per minute)
        request_rates = np.random.normal(loc=50, scale=15, size=n_samples)
        request_rates = np.clip(request_rates, 5, 150)
        
        # Generate corresponding CPU usage
        cpu_base = 35
        cpu_load_factor = request_rates * 0.3
        cpu_noise = np.random.normal(loc=0, scale=8, size=n_samples)
        cpu_usage = cpu_base + cpu_load_factor + cpu_noise
        cpu_usage = np.clip(cpu_usage, 10, 85)
        
        X_train = np.column_stack([request_rates, cpu_usage])
        return X_train
    
    def train(self, X_train=None):
        """Train the IsolationForest model on normal traffic data."""
        if X_train is None:
            X_train = self.generate_training_data()
        
        self.scaler.fit(X_train)
        X_scaled = self.scaler.transform(X_train)
        self.model.fit(X_scaled)
        self.is_trained = True
        
        print(f"[ML Engine] Model trained successfully on {len(X_train)} samples")
        return self
    
    def predict(self, request_rate, cpu_usage):
        """Predict whether a given traffic pattern is an anomaly."""
        if not self.is_trained:
            self.train()
        
        X = np.array([[request_rate, cpu_usage]])
        X_scaled = self.scaler.transform(X)
        prediction = self.model.predict(X_scaled)[0]
        is_anomaly = prediction == -1
        
        return bool(is_anomaly)
    
    def get_anomaly_score(self, request_rate, cpu_usage):
        """Get the anomaly score for a given traffic pattern."""
        if not self.is_trained:
            self.train()
        
        X = np.array([[request_rate, cpu_usage]])
        X_scaled = self.scaler.transform(X)
        score = self.model.decision_function(X_scaled)[0]
        
        return float(score)


# Global detector instance
_detector = None


def get_detector():
    """Get or create the global anomaly detector instance."""
    global _detector
    if _detector is None:
        _detector = AnomalyDetector()
        _detector.train()
    return _detector


def predict_anomaly(request_rate, cpu_usage):
    """
    Main function to predict if current traffic is anomalous.
    
    Args:
        request_rate (float): Current request rate (requests per minute)
        cpu_usage (float): Current CPU usage percentage (0-100)
        
    Returns:
        bool: True if anomaly detected, False if normal
    """
    detector = get_detector()
    return detector.predict(request_rate, cpu_usage)


def get_anomaly_score(request_rate, cpu_usage):
    """Get the anomaly score for current traffic."""
    detector = get_detector()
    return detector.get_anomaly_score(request_rate, cpu_usage)


if __name__ == "__main__":
    print("=" * 60)
    print("SMART-LIMIT ML Engine - Anomaly Detection Test")
    print("=" * 60)
    
    detector = AnomalyDetector(contamination=0.05)
    detector.train()
    
    test_cases = [
        ("Normal traffic", 45, 35),
        ("Moderate load", 80, 55),
        ("High load", 120, 70),
        ("DDoS attack", 450, 92),
        ("CPU spike", 30, 95),
        ("Low traffic", 10, 20),
    ]
    
    print("\nTest Results:")
    print("-" * 60)
    
    for name, rate, cpu in test_cases:
        is_anomaly = detector.predict(rate, cpu)
        score = detector.get_anomaly_score(rate, cpu)
        status = "ANOMALY" if is_anomaly else "NORMAL"
        print(f"{name:20} | Rate: {rate:4} | CPU: {cpu:3}% | "
              f"Score: {score:6.3f} | Status: {status}")
    
    print("-" * 60)
    print("\nML Engine is ready for integration!")

