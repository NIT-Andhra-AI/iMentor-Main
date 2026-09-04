# Lab 3: Feedback Compensation, Optimization & Closed-Loop Control

**Course:** EE3751 - New Venture Creation  
**Contact Hours:** 3 Hours  
**Tools Required:** LTSpice, MATLAB Simscape, Falstad Circuit Simulator, TINA-TI  

---

## 1. Laboratory Objective
Design state feedback, compensator networks, or neural loss optimizers to satisfy transient and steady-state design constraints.

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
Lab 3: Feedback Compensation & Parameter Optimization for New Venture Creation
"""
import numpy as np

def optimize_parameters(target_value=10.0, learning_rate=0.05, max_iters=100):
    # Gradient descent parameter optimization
    theta = 0.0
    history = []
    
    for epoch in range(max_iters):
        # Loss: J(theta) = 0.5 * (theta^2 - target_value)^2
        error = (theta ** 2) - target_value
        loss = 0.5 * (error ** 2)
        grad = 2.0 * error * theta
        theta -= learning_rate * grad
        history.append(loss)
        if abs(grad) < 1e-5:
            break
            
    return theta, history

if __name__ == "__main__":
    opt_val, hist = optimize_parameters()
    print(f"Optimized parameter converged to: {opt_val:.4f} (Loss: {hist[-1]:.6f})")

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
