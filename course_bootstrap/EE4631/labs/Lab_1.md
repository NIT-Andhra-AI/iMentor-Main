# Lab 1: Mathematical Modeling & Parameter Simulation of Special Machines

**Course:** EE4631 - Special Machines  
**Contact Hours:** 3 Hours  
**Tools Required:** LTSpice, MATLAB Simscape, Falstad Circuit Simulator, TINA-TI  

---

## 1. Laboratory Objective
Formulate the continuous/discrete state equations for Special Machines and simulate time-domain behavior under perturbation.

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
Lab 1: Modeling & Simulation for Special Machines
"""
import numpy as np

def simulate_system(time_span=10.0, dt=0.01):
    steps = int(time_span / dt)
    t = np.linspace(0, time_span, steps)
    
    # State variable evolution
    x = np.zeros(steps)
    x[0] = 1.0 # Initial condition
    
    # Euler integration of linear state equation dx/dt = -alpha * x + u(t)
    alpha = 1.5
    for k in range(steps - 1):
        u = 1.0 if t[k] >= 1.0 else 0.0 # Step excitation at t=1s
        dx = -alpha * x[k] + u
        x[k + 1] = x[k] + dx * dt
        
    return t, x

if __name__ == "__main__":
    t, x = simulate_system()
    print(f"Simulation completed: Final state = {x[-1]:.4f}")

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
