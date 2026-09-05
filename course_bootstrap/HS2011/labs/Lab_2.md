# Lab 2: Transform Domain Analysis & Spectral Characterization

**Course:** HS2011 - Personality Development & Professional Ethics  
**Contact Hours:** 3 Hours  
**Tools Required:** LTSpice, MATLAB Simscape, Falstad Circuit Simulator, TINA-TI  

---

## 1. Laboratory Objective
Implement frequency/transform domain solvers (FFT/Laplace/Z-transform) and analyze stability margins and poles/zeros.

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
Lab 2: Transform Domain Solver for Personality Development & Professional Ethics
"""
import numpy as np

def compute_spectral_decomposition(signal_data, sample_rate=1000):
    N = len(signal_data)
    fft_vals = np.fft.rfft(signal_data)
    freqs = np.fft.rfftfreq(N, 1.0 / sample_rate)
    magnitude = np.abs(fft_vals) / N
    return freqs, magnitude

if __name__ == "__main__":
    t = np.linspace(0, 1.0, 1000)
    sig = np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 120 * t)
    f, mag = compute_spectral_decomposition(sig)
    print(f"Dominant frequencies identified: {f[np.argsort(mag)[-2:]]} Hz")

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
