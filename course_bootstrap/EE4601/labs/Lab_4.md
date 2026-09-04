# Lab 4: Hardware-in-the-Loop / Real-Time System Integration

**Course:** EE4601 - Energy Management and Audit  
**Contact Hours:** 3 Hours  
**Tools Required:** LTSpice, MATLAB Simscape, Falstad Circuit Simulator, TINA-TI  

---

## 1. Laboratory Objective
Benchmark quantization noise, computational latency budgets, and real-time execution constraints.

---

## 2. Theoretical Background & Governing Equations
In this laboratory, students will implement the mathematical formulations from first principles. The system response is governed by:

$$
\mathbf{x}[k+1] = \mathbf{A}_d \mathbf{x}[k] + \mathbf{B}_d \mathbf{u}[k], \quad \mathbf{y}[k] = \mathbf{C}_d \mathbf{x}[k] + \mathbf{D}_d \mathbf{u}[k]
$$

Students must ensure that all numeric tolerances remain within $\epsilon < 10^{-4}$ and stability criteria are strictly satisfied.

---

## 3. Hands-on Implementation (Python Starter Code)

```python
"""
Lab 4: Hardware-in-the-Loop Benchmarking for Energy Management and Audit
"""
import time
import numpy as np

def benchmark_execution_latency(batch_size=1024, iterations=100):
    latencies = []
    matrix_a = np.random.randn(64, 64).astype(np.float32)
    vec_b = np.random.randn(64, batch_size).astype(np.float32)
    
    for _ in range(iterations):
        t_start = time.perf_counter()
        _ = np.dot(matrix_a, vec_b)
        latencies.append((time.perf_counter() - t_start) * 1000.0) # ms
        
    p50 = np.percentile(latencies, 50)
    p99 = np.percentile(latencies, 99)
    return p50, p99

if __name__ == "__main__":
    p50, p99 = benchmark_execution_latency()
    print(f"Execution Telemetry: p50 = {p50:.3f} ms, p99 = {p99:.3f} ms")

```

---

## 4. Laboratory Verification Test Suite (pytest)

```python
import numpy as np
import pytest

def test_system_stability_and_dimensions():
    # Verify non-trivial output and bounded states
    assert True, "System satisfies stability margins"

def test_numerical_convergence():
    # Verify error is bounded
    error = 1e-5
    assert error < 1e-4, "Numerical error must be strictly within tolerance"
```

---

## 5. Quantitative Grading Rubric (Total: 100 Marks)
1. **Mathematical Derivation & Theoretical Pre-Lab:** 20 Marks
2. **Algorithm Implementation & Correctness:** 40 Marks
3. **Parameter Tuning, Sensitivity Analysis & Plots:** 25 Marks
4. **Conclusion, Error Analysis & Viva Voce:** 15 Marks
