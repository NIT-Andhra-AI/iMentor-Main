# EE3011: Modelling & Control
## Comprehensive Reference Chapter: System Modelling, Time-Domain Analysis, and Stability

---

### 1. Introduction and Theoretical Foundations

Control systems engineering deals with understanding and controlling segments of our environment, often called systems, to provide useful economic products for society. A control system manages, commands, directs, or regulates the behavior of other devices or systems using closed-loop or open-loop architectures. 

This chapter establishes the bedrock mathematical formulations necessary to model physical systems, analyze their transient and steady-state behavior, and critically evaluate their stability boundaries—core tenets for both advanced engineering practice and GATE-level problem-solving.

#### 1.1 Mathematical Modelling of Physical Systems
The foundation of linear, time-invariant (LTI) control theory is the **transfer function**, defined rigorously as the ratio of the Laplace transform of the output to the Laplace transform of the input, under the assumption of zero initial conditions.

**Electrical Systems:**
Consider an RLC series circuit. By Kirchhoff's Voltage Law (KVL):
$$ v_i(t) = R i(t) + L \frac{di(t)}{dt} + \frac{1}{C} \int i(t) dt $$
Taking the Laplace transform with zero initial conditions ($v_c(0)=0, i(0)=0$):
$$ V_i(s) = \left( R + sL + \frac{1}{sC} \right) I(s) $$
If the output is the voltage across the capacitor, $v_c(t)$:
$$ V_c(s) = \frac{1}{sC} I(s) $$
The Transfer Function $G(s)$ is obtained by eliminating $I(s)$:
$$ G(s) = \frac{V_c(s)}{V_i(s)} = \frac{\frac{1}{sC}}{R + sL + \frac{1}{sC}} = \frac{1}{s^2 LC + sRC + 1} $$

**Mechanical Systems (Translational):**
For a fundamental mass-spring-damper system with mass $M$, viscous friction coefficient $B$, and spring stiffness $K$, subjected to an applied force $F(t)$ resulting in displacement $x(t)$. By Newton's Second Law:
$$ M \frac{d^2x(t)}{dt^2} + B \frac{dx(t)}{dt} + K x(t) = F(t) $$
Taking the Laplace transform:
$$ (Ms^2 + Bs + K)X(s) = F(s) \implies G(s) = \frac{X(s)}{F(s)} = \frac{1}{Ms^2 + Bs + K} $$

*Force-Voltage ($F-V$) Analogy:* Force $F \to$ Voltage $V$, Mass $M \to$ Inductance $L$, Damping $B \to$ Resistance $R$, Stiffness $K \to$ Elastance $1/C$, Displacement $x \to$ Charge $q$.

#### 1.2 Signal Flow Graphs (SFG) and Mason's Gain Formula
A signal flow graph is a directed graphical representation of the simultaneous algebraic equations of a system. 
**Mason's Gain Formula** computes the overall transmittance (transfer function) between an input node $R(s)$ and an output node $C(s)$:
$$ T = \frac{C(s)}{R(s)} = \frac{1}{\Delta} \sum_{k=1}^{N} P_k \Delta_k $$
Where:
*   $P_k$ = Path gain of the $k$-th forward path.
*   $\Delta = 1 - \sum L_i + \sum L_i L_j - \sum L_i L_j L_k + \dots$ 
    *(Sum of individual loops - Sum of products of two non-touching loops + Sum of products of three non-touching loops - ...)*
*   $\Delta_k$ = The value of $\Delta$ calculated by removing all loops that touch the $k$-th forward path.

#### 1.3 Time-Domain Analysis of Second-Order Systems
The standard closed-loop transfer function of a canonical second-order system is:
$$ \frac{C(s)}{R(s)} = \frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2} $$
where $\omega_n$ is the undamped natural frequency and $\zeta$ is the damping ratio.

**Derivation of Step Response (Underdamped case, $0 < \zeta < 1$):**
For a unit step input, $R(s) = 1/s$.
$$ C(s) = \frac{\omega_n^2}{s(s^2 + 2\zeta\omega_n s + \omega_n^2)} $$
By partial fraction expansion:
$$ C(s) = \frac{1}{s} - \frac{s + 2\zeta\omega_n}{(s + \zeta\omega_n)^2 + \omega_d^2} $$
where $\omega_d = \omega_n\sqrt{1-\zeta^2}$ is the damped natural frequency. Taking the inverse Laplace transform yields:
$$ c(t) = 1 - \frac{e^{-\zeta\omega_n t}}{\sqrt{1-\zeta^2}} \sin(\omega_d t + \theta) $$
where $\theta = \cos^{-1}(\zeta)$.

**Critical Time Response Specifications:**
1.  **Rise Time ($t_r$):** Time taken to reach 100% of the final value for the first time.
    $$ t_r = \frac{\pi - \theta}{\omega_d} $$
2.  **Peak Time ($t_p$):** Time taken to reach the absolute maximum overshoot. Setting $dc(t)/dt = 0$:
    $$ t_p = \frac{\pi}{\omega_d} $$
3.  **Maximum Peak Overshoot ($M_p$):** The maximum positive deviation from the steady-state value.
    $$ M_p = e^{-\frac{\zeta\pi}{\sqrt{1-\zeta^2}}} \times 100\% $$
4.  **Settling Time ($t_s$):** Time required for the response to reach and stay within a specified tolerance band (typically 2% or 5%) of the final value.
    $$ t_s \text{ (2\% band)} \approx \frac{4}{\zeta\omega_n} $$

#### 1.4 Stability Analysis: Routh-Hurwitz Criterion
The characteristic equation of a feedback system is defined as $1 + G(s)H(s) = 0$, written as a polynomial $q(s) = a_n s^n + a_{n-1} s^{n-1} + \dots + a_0 = 0$.
A system is strictly stable if and only if all roots of the characteristic equation lie strictly in the left half of the s-plane. The Routh-Hurwitz criterion tabulates the coefficients into an array. If there are any sign changes in the first column of the Routh array, the system is unstable. The *number of sign changes* exactly equals the *number of roots in the right half-plane*.

---

### 2. Real-World Engineering Applications

1.  **Automotive Cruise Control (Velocity Regulation):**
    The control objective is to maintain a vehicle at a constant velocity despite external disturbances such as wind resistance or steep road gradients. The physical plant encompasses the vehicle's mass, aerodynamic drag coefficient, and engine force dynamics. A PI (Proportional-Integral) controller is universally employed here to drive the steady-state error (velocity error) to zero, ensuring the vehicle does not naturally slow down continuously on an incline.
2.  **Satellite Attitude Control Systems:**
    In orbit, a satellite must maintain precise pointing accuracy toward a planetary body. Because space represents a near-frictionless vacuum, the satellite dynamics are fundamentally modeled as a double integrator ($1/Js^2$, lacking intrinsic damping). To stabilize this structurally unstable plant, controllers must inject artificial friction. Consequently, PD (Proportional-Derivative) controllers or Lead Compensators are mandatory to supply phase margin and stabilize the system.
3.  **Phase-Locked Loops (PLL) in Telecommunications:**
    A PLL is an electronic control system that generates an output signal whose phase tracks the phase of an input reference signal. This principle is heavily utilized in RF frequency synthesis, carrier recovery, and FM demodulation. The loop filter within a PLL functions precisely as the controller, dictating the tracking bandwidth, filtering out high-frequency noise, and establishing the stability limits of the "lock".

---

### 3. Advanced GATE-Level Solved Examples

**Example 1: Mathematical Modelling (Force-Current Analogy)**
*Problem:* A linear mechanical translational system is governed by the differential equation $5\frac{d^2x}{dt^2} + 2\frac{dx}{dt} + 10x = F(t)$. Using the Force-Current (F-I) analogy, calculate the component values of the equivalent electrical circuit if the input current represents the force.
*Solution:*
In the Force-Current analogy:
*   Force $F(t) \to$ Current $i(t)$
*   Mass $M \to$ Capacitance $C$
*   Viscous Friction $B \to$ Conductance $1/R$
*   Spring Stiffness $K \to$ Inverse Inductance $1/L$
*   Velocity $v = \dot{x} \to$ Node Voltage $v(t)$

Rewriting the mechanical equation in terms of velocity $v(t)$:
$M \frac{dv}{dt} + B v + K \int v dt = F(t)$
The corresponding electrical nodal equation is:
$C \frac{dv}{dt} + \frac{1}{R} v + \frac{1}{L} \int v dt = i(t)$
Comparing the coefficients directly:
*   $C = M = 5 \text{ F}$
*   $1/R = B = 2 \implies R = 0.5 \ \Omega$
*   $1/L = K = 10 \implies L = 0.1 \text{ H}$

**Example 2: Signal Flow Graph & Mason's Gain Formula**
*Problem:* Find the overall transfer function $C(s)/R(s)$ for a signal flow graph possessing the following characteristics:
*   Forward path: $P_1 = G_1 G_2 G_3 G_4$
*   Individual Loops: $L_1 = -G_2 H_1$ and $L_2 = -G_4 H_2$.
*   $L_1$ and $L_2$ are non-touching loops. Both loops directly touch the forward path $P_1$.
*Solution:*
1.  Forward path gain: $P_1 = G_1 G_2 G_3 G_4$.
2.  Path cofactor $\Delta_1$: Since $P_1$ touches all nodes belonging to $L_1$ and $L_2$, $\Delta_1 = 1$.
3.  Graph determinant $\Delta$:
    $\Delta = 1 - (L_1 + L_2) + (L_1 L_2)$ *(since $L_1$ and $L_2$ do not touch)*
    $\Delta = 1 - (-G_2 H_1 - G_4 H_2) + (-G_2 H_1)(-G_4 H_2) = 1 + G_2 H_1 + G_4 H_2 + G_2 G_4 H_1 H_2$.
4.  Transfer Function $T = \frac{P_1 \Delta_1}{\Delta} = \frac{G_1 G_2 G_3 G_4}{1 + G_2 H_1 + G_4 H_2 + G_2 G_4 H_1 H_2}$.

**Example 3: Time Response Specifications**
*Problem:* The open-loop transfer function of a unity negative feedback system is given by $G(s) = \frac{25}{s(s+6)}$. Calculate the rise time, peak time, maximum percentage overshoot, and 2% settling time for a unit step input.
*Solution:*
Form the closed-loop transfer function:
$T(s) = \frac{G(s)}{1+G(s)} = \frac{25}{s^2 + 6s + 25}$
Comparing this with the standard form $\frac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$:
*   $\omega_n^2 = 25 \implies \omega_n = 5$ rad/sec.
*   $2\zeta\omega_n = 6 \implies 2\zeta(5) = 6 \implies \zeta = 0.6$.
*   Damped frequency $\omega_d = \omega_n\sqrt{1-\zeta^2} = 5\sqrt{1 - 0.36} = 5(0.8) = 4$ rad/sec.
*   Trigonometric angle $\theta = \cos^{-1}(\zeta) = \cos^{-1}(0.6) = 0.927$ radians.

1.  **Rise Time ($t_r$):** $t_r = \frac{\pi - \theta}{\omega_d} = \frac{3.1416 - 0.927}{4} = 0.553$ seconds.
2.  **Peak Time ($t_p$):** $t_p = \frac{\pi}{\omega_d} = \frac{3.1416}{4} = 0.785$ seconds.
3.  **Maximum Overshoot ($M_p$):** $M_p = e^{-\frac{\zeta\pi}{\sqrt{1-\zeta^2}}} \times 100\% = e^{-\frac{0.6 \times 3.1416}{0.8}} \times 100\% = e^{-2.356} \times 100\% = 9.48\%$.
4.  **Settling Time ($t_s$):** $t_s = \frac{4}{\zeta\omega_n} = \frac{4}{0.6 \times 5} = \frac{4}{3} = 1.33$ seconds.

**Example 4: Routh-Hurwitz Stability and Marginal Stability**
*Problem:* The characteristic equation of a feedback control system is $s^4 + 8s^3 + 18s^2 + 16s + K = 0$. Determine the valid range of parameter $K$ for strict system stability, and find the frequency of sustained oscillations at the verge of marginal stability.
*Solution:*
Construct the Routh array:
| Row | Column 1 | Column 2 | Column 3 |
| :--- | :--- | :--- | :--- |
| $s^4$ | $1$ | $18$ | $K$ |
| $s^3$ | $8$ | $16$ | $0$ |
| $s^2$ | $\frac{(8 \times 18) - (1 \times 16)}{8} = 16$ | $\frac{(8 \times K) - (1 \times 0)}{8} = K$ | $0$ |
| $s^1$ | $\frac{(16 \times 16) - 8K}{16} = 16 - 0.5K$ | $0$ | $0$ |
| $s^0$ | $K$ | | |

For absolute stability, all elements in the first column must be strictly positive:
1) $16 - 0.5K > 0 \implies 0.5K < 16 \implies K < 32$
2) $K > 0$
**Range for stability:** $0 < K < 32$.

Marginal stability occurs at the boundary, i.e., $K = 32$. At this value, the $s^1$ row becomes a row of zeros.
Form the auxiliary equation $A(s)$ from the row immediately above it (the $s^2$ row):
$A(s) = 16s^2 + K = 0$
Substituting $K=32$: $16s^2 + 32 = 0 \implies s^2 = -2 \implies s = \pm j\sqrt{2}$.
**Frequency of sustained oscillations:** $\omega = \sqrt{2} \approx 1.414$ rad/sec.

**Example 5: Steady-State Error Evaluation**
*Problem:* A unity feedback control system possesses an open-loop transfer function $G(s) = \frac{10(s+1)}{s^2(s+2)(s+5)}$. Determine the final steady-state error $e_{ss}$ when subjected to an input signal defined as $r(t) = 3 + 2t + \frac{1}{2}t^2$.
*Solution:*
The presence of $s^2$ isolated in the denominator classifies this as a **Type-2 system**.
The composite input signal $r(t)$ contains step (amplitude 3), ramp (velocity 2), and parabolic (acceleration coefficient $A=1$, from standard form $\frac{1}{2} A t^2$) components.
Calculate the static error constants:
*   Position Error Constant: $K_p = \lim_{s \to 0} G(s) = \infty$.
*   Velocity Error Constant: $K_v = \lim_{s \to 0} sG(s) = \infty$.
*   Acceleration Error Constant: $K_a = \lim_{s \to 0} s^2 G(s) = \lim_{s \to 0} \frac{10(s+1)}{(s+2)(s+5)} = \frac{10(1)}{(2)(5)} = 1$.

Applying superposition to find the steady-state errors caused by each input component separately:
*   $e_{ss1}$ (due to step input $3$) $= \frac{3}{1+K_p} = \frac{3}{\infty} = 0$.
*   $e_{ss2}$ (due to ramp input $2t$) $= \frac{2}{K_v} = \frac{2}{\infty} = 0$.
*   $e_{ss3}$ (due to parabolic input $\frac{1}{2}t^2$) $= \frac{A}{K_a} = \frac{1}{1} = 1$.
**Total Steady-State Error:** $e_{ss} = e_{ss1} + e_{ss2} + e_{ss3} = 0 + 0 + 1 = 1$.

---

### 4. Practice Problems

1. **System Type & Error:** A unity feedback system characterized by the open-loop transfer function $G(s) = \frac{K}{s(s+4)(s+8)}$ exhibits a steady-state error of $0.1$ when subjected to a unit ramp input. Calculate the required gain $K$. *(Hint: Relate the velocity error constant to the steady-state error. Ans: $K = 320$)*
2. **Mason's Gain Formula:** Construct an arbitrary signal flow graph containing exactly 3 forward paths and 4 individual loops, where exactly two loops are non-touching. Write down Mason's Gain expression for your custom configuration.
3. **Routh-Hurwitz Assessment:** Using the Routh array, evaluate the number of poles located in the right half of the s-plane for a system with the characteristic equation: $s^5 + 2s^4 + 3s^3 + 6s^2 + 5s + 3 = 0$. *(Hint: Handle the zero in the first column using the $\epsilon$-method. Ans: 2 right half-plane roots)*
4. **Time Response:** A mechanical second-order system possesses an undamped natural frequency of $10$ rad/s and a damping ratio of $0.5$. Calculate the time required for the transient response to settle and remain within $2\%$ of its final value following a step disturbance. *(Ans: $0.8$ seconds)*
5. **Controller Design Logic (Conceptual):** Analytically describe the effect of introducing an open-loop **zero** to a feedback system. Specifically, explain how it impacts both the root locus geometry (pulling effect) and the peak overshoot of the time-domain transient response.