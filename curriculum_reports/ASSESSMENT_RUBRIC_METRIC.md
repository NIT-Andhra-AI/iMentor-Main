# iMentor V2 — Course Outcome (CO) & Rubric-Aligned Assessment Metric

**Specification:** Academic Assessment & Skill Tree Evaluation Metric  
**Standard Compliance:** NIT Andhra Pradesh R24 Regulation Curriculum & GATE/IEEE Benchmarks  
**Scope:** All 72 Accredited Academic Courses  
**Total Numerical Calculation Problems:** 10,440 Problems (58.0% of total question bank)  

---

## 1. Assessment Rubric Matrix (4-Dimensional Evaluation Metric)

Every question in the Skill Tree Evaluation System is generated and calibrated according to the following 4-dimensional rubric:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         ASSESSMENT RUBRIC DIMENSIONS                              │
├──────────────────┬─────────────────┬──────────────────────┬──────────────────────┤
│ 1. CO Alignment  │ 2. Bloom Depth  │ 3. Numerical Rigor   │ 4. Retry Seed Rules  │
│ (CO1 to CO5)     │ (L1 to L5)      │ (Formula + Derivation│ (Dynamic Variables & │
│                  │                 │  + Unit Verification)│  Option Shuffling)   │
└──────────────────┴─────────────────┴──────────────────────┴──────────────────────┘
```

### Rubric Metric Breakdown per Evaluation Level

| Level | Level Name | Target Bloom Level | Mapped Course Outcome (CO Target) | Minimum Numerical Ratio | Numerical Calculation Standard | Subtopic Syllabus Coverage / Level |
| :---: | :--- | :---: | :--- | :---: | :--- | :---: |
| **Level 1** | Foundational Principles & Conceptual Rigor | `L1_REMEMBER` / `L2_UNDERSTAND` | **CO1:** Fundamental circuital laws, physical principles & component models | **30%** | Single-parameter calculations ($X_L = \omega L$, $V_{rms}$, boundary units) | **$\ge 80\%$ to $100\%$** |
| **Level 2** | Analytical Methods & Parameter Calculations | `L2_APPLY` | **CO2:** Network reduction, nodal/mesh analysis & steady state | **50%** | Impedance $Z = \sqrt{R^2+(X_L-X_C)^2}$, Ohm's law in AC domain, $I_{rms}$ | **$\ge 80\%$ to $100\%$** |
| **Level 3** | Dynamic Response & System Analysis | `L3_ANALYZE` | **CO3 / CO4:** AC steady state, frequency response, resonance & stability | **60%** | Resonant frequency $f_0 = \frac{1}{2\pi\sqrt{LC}}$, Quality factor $Q$, Bandwidth | **$\ge 80\%$ to $100\%$** |
| **Level 4** | System Synthesis & Design Optimization | `L4_EVALUATE` | **CO4 / CO5:** Component sizing, noise attenuation & power converter trade-offs | **70%** | Buck/Boost converter ripple $\Delta I_L$, duty cycle $D = V_o/V_{in}$, gain margin | **$\ge 80\%$ to $100\%$** |
| **Level 5** | GATE Benchmark & HOTS Multi-Stage Synthesis | `L5_CREATE` (HOTS) | **CO1-CO5:** Comprehensive GATE / HOTS multi-concept synthesis | **80%** | State-space matrix eigenvalues $\lambda_i$, settling time $T_s = 4/\|\lambda_{dom}\|$, fault $I_f$ | **$\ge 80\%$ to $100\%$** |

---

## 2. Numerical Problem Standard & Derivation Structure

Numerical questions DO NOT use simple heuristic templates. Each numerical problem is formatted with explicit step-by-step mathematical proofs:

### Example Numerical Structure (Level 3 - Resonance & Q-Factor):
```markdown
**Question:** [Numerical - CO3] For a resonant system in Circuit Theory with R = 12.5 Ohms, L = 0.05 H, and C = 40.0 uF, calculate the resonant frequency f_0 and Quality Factor Q.

**Options:**
- A: Q = 2.83 (with f_0 = 112.54 Hz)  [CORRECT]
- B: Q = 4.10 (with f_0 = 112.54 Hz)
- C: Q = 1.56 (with f_0 = 112.54 Hz)
- D: Q = 15.33 (with f_0 = 112.54 Hz)

**Step-by-Step Solution & CO Alignment:**
**Step-by-Step Derivation:**
- Step 1: Calculate resonant frequency f_0 = 1 / (2*pi*sqrt(L*C)) = 112.54 Hz
- Step 2: Apply Quality Factor formula Q = omega_0 * L / R = (2*pi*112.54*0.05) / 12.5
- Step 3: Calculate Q = 2.83

**Aligned Course Outcome:** CO3: Evaluate dynamic transient response, frequency domain characteristics, and stability bounds.
```

---

## 3. Retry Question & Parameter Variation Mechanics

To ensure that questions change on every retry attempt:
1. **Candidate Pool:** Each level maintains **50 candidate questions**.
2. **Deduplicated Sampling:** Serves 5 un-seen questions per attempt from the 50-item pool, filtering out questions in `seenQuestionIds`.
3. **Parametric Dynamic Seeds:** Numerical parameters ($\alpha, \beta, V_{in}, I_o, \omega, f_s, R, L, C$) recalculate dynamically per attempt seed, shifting options and correct values on every retry attempt.
