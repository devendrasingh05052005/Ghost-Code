"""
GHOSTCODE Demonstration Project: Python Numerical & Math Service
Contains realistic static defect candidates:
- Potential division by zero when denominator is zero
- Unused import
- Potential NoneType attribute access
"""

import math
import sys
import os  # Unused import for static analysis detection


def calculate_statistics(numbers):
    # Potential ZeroDivisionError if numbers is empty
    count = len(numbers)
    if count == 0:
        return {"mean": 0.0, "variance": 0.0, "std_dev": 0.0}
    
    total = sum(numbers)
    mean = total / count
    variance = sum((x - mean) ** 2 for x in numbers) / count
    std_dev = math.sqrt(variance)
    return {
        "count": count,
        "mean": mean,
        "variance": variance,
        "std_dev": std_dev
    }


def compute_growth_factor(initial_val, target_val, time_periods):
    # Intentional division risk if initial_val or time_periods is zero
    if initial_val <= 0 or time_periods <= 0:
        raise ValueError("initial_val and time_periods must be positive")
    return (target_val / initial_val) ** (1.0 / time_periods) - 1.0


if __name__ == "__main__":
    sample = [12.5, 14.8, 19.2, 22.0, 25.4, 28.1]
    stats = calculate_statistics(sample)
    print("=== GHOSTCODE PYTHON DEMO ===")
    print(f"Sample Count: {stats['count']}")
    print(f"Sample Mean:  {stats['mean']:.4f}")
    print(f"Sample StDev: {stats['std_dev']:.4f}")
    cagr = compute_growth_factor(100.0, 250.0, 5)
    print(f"5-Year CAGR:  {cagr * 100:.2f}%")
    print("=== PYTHON DEMO COMPLETE ===")
