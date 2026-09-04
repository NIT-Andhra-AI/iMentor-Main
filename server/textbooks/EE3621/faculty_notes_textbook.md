# EE3621: Faculty Notes 
## Comprehensive Reference on State-Variable Analysis and Advanced Control Theory

This chapter serves as the definitive theoretical reference and GATE preparation guide for State-Space Analysis, forming the cornerstone of modern multivariable control systems. 

---

### 1. Deep Theoretical Foundations and Derivations

Classical control theory (transfer functions, root locus, Bode plots) is fundamentally limited to Linear Time-Invariant (LTI), Single-Input Single-Output (SISO) systems with zero initial conditions. Modern control theory utilizes state-space representation to overcome these limitations, enabling the analysis of Multiple-Input Multiple-Output (MIMO), time-varying, and non-linear systems while fully accounting for initial energy states.

#### 1.1 The State-Space Concept
The **state** of a dynamic system is the smallest set of variables (called state variables) such that the knowledge of these variables at $t = t_0$, together with the knowledge of the input for $t \ge t_0$, completely determines the behavior of the system for any time $t \ge t_0$.

For a continuous-time LTI system, the state-space representation is given by two equations:
**1. State Equation (Differential Equation):**
$$ \dot{\mathbf{x}}(t) = A\mathbf{x}(t) + B\mathbf{u}(t) $$
**2. Output Equation (Algebraic Equation):**
$$ \mathbf{y}(t) = C\mathbf{x}(t) + D\mathbf{u}(t) $$

Where:
*   $\mathbf{x}(t) \in \mathbb{R}^n$: State vector
*   $\mathbf{u}(t) \in \mathbb{R}^m$: Input vector
*   $\mathbf{y}(t) \in \mathbb{R}^p$: Output vector
*   $A \in \mathbb{R}^{n \times n}$: System matrix
*   $B \in \mathbb{R}^{n \times m}$: Input matrix
*   $C \in \mathbb{R}^{p \times n}$: Output matrix
*   $D \in \mathbb{R}^{p \times m}$: Feedforward matrix (often zero in physical systems)

#### 1.2 Derivation of the State Transition Matrix (STM)
To find the time response of the system, we must solve the first-order matrix differential equation. Consider the unforced (homogeneous) system where $\mathbf{u}(t) = 0$:
$$ \dot{\mathbf{x}}(t) = A\mathbf{x}(t) $$

Taking the Laplace transform on both sides:
$$ s\mathbf{X}(s) - \mathbf{x}(0) = A\mathbf{X}(s) $$
$$ (sI - A)\mathbf{X}(s) = \mathbf{x}(0) $$
$$ \mathbf{X}(s) = (sI - A)^{-1}\mathbf{x}(0) $$

Taking the inverse Laplace transform gives the time-domain solution:
$$ \mathbf{x}(t) = \mathcal{L}^{-1}\{(sI - A)^{-1}\}\mathbf{x}(0) $$

We define the **State Transition Matrix (STM)** as $\Phi(t) = e^{At} = \mathcal{L}^{-1}\{(sI - A)^{-1}\}$.
The STM relates the state at $t=0$ to the state at any time $t$ when no input is applied. 

**Properties of the STM, $\Phi(t)$:**
1.  $\Phi(0) = I$ (Identity Matrix)
2.  $\Phi^{-1}(t) = \Phi(-t)$
3.  $\Phi(t_1 + t_2) = \Phi(t_1)\Phi(t_2)$
4.  $[\Phi(t)]^n = \Phi(nt)$

#### 1.3 Solution to the Non-Homogeneous State Equation
For the complete system with input $\mathbf{u}(t)$:
$$ \dot{\mathbf{x}}(t) - A\mathbf{x}(t) = B\mathbf{u}(t) $$
Multiplying both sides by the integrating factor $e^{-At}$:
$$ e^{-At}\dot{\mathbf{x}}(t) - e^{-At}A\mathbf{x}(t) = e^{-At}B\mathbf{u}(t) $$
$$ \frac{d}{dt} [e^{-At}\mathbf{x}(t)] = e^{-At}B\mathbf{u}(t) $$
Integrating from $0$ to $t$:
$$ e^{-At}\mathbf{x}(t) - \mathbf{x}(0) = \int_0^t e^{-A\tau}B\mathbf{u}(\tau) d\tau $$
Multiplying by $e^{At}$:
$$ \mathbf{x}(t) = e^{At}\mathbf{x}(0) + \int_0^t e^{A(t-\tau)}B\mathbf{u}(\tau) d\tau $$
This is the complete state response, comprising the **Zero-Input Response (ZIR)** and the **Zero-State Response (ZSR)**.

#### 1.4 Controllability and Observability (Kalman's Criteria)
*   **Controllability:** A system is completely state controllable if it is possible to transfer the system state from any initial state $\mathbf{x}(t_0)$ to any other desired state $\mathbf{x}(t_f)$ in finite time using an unconstrained control vector $\mathbf{u}(t)$.
    *   *Test:* The controllability matrix $Q_c = [B \;\; AB \;\; A^2B \;\; \dots \;\; A^{n-1}B]$ must have full rank $n$ (i.e., $|Q_c| \neq 0$).
*   **Observability:** A system is completely observable if every initial state $\mathbf{x}(t_0)$ can be determined from the observation of the output $\mathbf{y}(t)$ over a finite time interval.
    *   *Test:* The observability matrix $Q_o = [C^T \;\; A^T C^T \;\; (A^T)^2 C^T \;\; \dots \;\; (A^T)^{n-1} C^T]^T$ must have full rank $n$ (i.e., $|Q_o| \neq 0$).

---

### 2. Real-World Engineering Applications

**1. Aerospace Engineering: Satellite Attitude Control**
In orbital mechanics, a satellite's orientation (pitch, roll, yaw) must be maintained despite disturbance torques (solar radiation pressure, magnetic field variations). The dynamics are highly coupled and MIMO. State-space allows engineers to design a Linear Quadratic Regulator (LQR) that continuously adjusts reaction wheels (inputs) based on gyroscope and star-tracker data (outputs/states) to minimize orientation error with optimal energy expenditure.

**2. Power System Stability and FACTS Devices**
Modern power grids utilize Flexible AC Transmission Systems (FACTS). The grid is modeled as a massive state-space system where states include generator rotor angles, angular velocities, and bus voltages. By analyzing the eigenvalues of the system matrix $A$ (Small Signal Stability Analysis), engineers can predict oscillatory instabilities (eigenvalues crossing into the right-half $s$-plane) and design Power System Stabilizers (PSS) via state-feedback to shift these poles deep into the left-half plane, preventing blackouts.

**3. Electric Vehicle (EV) Battery Management Systems (BMS)**
The State of Charge (SoC) and State of Health (SoH) of a lithium-ion battery cannot be measured directly. They are modeled as internal "states". Using the state-space model of the battery's equivalent circuit, an Extended Kalman Filter (an observer based on state-space theory) is implemented in the BMS to estimate the SoC accurately by measuring only the terminal voltage, current, and temperature.

---

### 3. Advanced GATE-Level Solved Examples

#### Example 1: Computation of the State Transition Matrix
**Problem:** Find the state transition matrix $\Phi(t)$ for the system given by:
$$ \dot{\mathbf{x}} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} \mathbf{x} $$

**Solution:**
The system matrix is $A = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$.
First, find $(sI - A)$:
$$ (sI - A) = \begin{bmatrix} s & 0 \\ 0 & s \end{bmatrix} - \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} = \begin{bmatrix} s & -1 \\ 2 & s+3 \end{bmatrix} $$
Calculate the inverse $(sI - A)^{-1}$:
$$ \Delta(s) = |sI - A| = s(s+3) - (-2) = s^2 + 3s + 2 = (s+1)(s+2) $$
$$ (sI - A)^{-1} = \frac{1}{(s+1)(s+2)} \begin{bmatrix} s+3 & 1 \\ -2 & s \end{bmatrix} $$
Perform partial fraction expansion for each element:
*   $\frac{s+3}{(s+1)(s+2)} = \frac{2}{s+1} - \frac{1}{s+2}$
*   $\frac{1}{(s+1)(s+2)} = \frac{1}{s+1} - \frac{1}{s+2}$
*   $\frac{-2}{(s+1)(s+2)} = \frac{-2}{s+1} + \frac{2}{s+2}$
*   $\frac{s}{(s+1)(s+2)} = \frac{-1}{s+1} + \frac{2}{s+2}$

Taking the inverse Laplace transform $\mathcal{L}^{-1}$:
$$ \Phi(t) = \begin{bmatrix} 2e^{-t} - e^{-2t} & e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} & -e^{-t} + 2e^{-2t} \end{bmatrix} $$

#### Example 2: Transfer Function Matrix from State Space
**Problem:** A system has $A = \begin{bmatrix} -1 & 0 \\ 0 & -2 \end{bmatrix}$, $B = \begin{bmatrix} 1 \\ 1 \end{bmatrix}$, $C = \begin{bmatrix} 1 & 1 \end{bmatrix}$, $D = 0$. Calculate its Transfer Function.

**Solution:**
The Transfer Function $T(s)$ is given by $C(sI - A)^{-1}B + D$.
$$ (sI - A) = \begin{bmatrix} s+1 & 0 \\ 0 & s+2 \end{bmatrix} $$
Since $A$ is diagonal, the inverse is simply the inverse of the diagonal elements:
$$ (sI - A)^{-1} = \begin{bmatrix} \frac{1}{s+1} & 0 \\ 0 & \frac{1}{s+2} \end{bmatrix} $$
Now multiply by $B$:
$$ (sI - A)^{-1}B = \begin{bmatrix} \frac{1}{s+1} & 0 \\ 0 & \frac{1}{s+2} \end{bmatrix} \begin{bmatrix} 1 \\ 1 \end{bmatrix} = \begin{bmatrix} \frac{1}{s+1} \\ \frac{1}{s+2} \end{bmatrix} $$
Finally, multiply by $C$:
$$ T(s) = \begin{bmatrix} 1 & 1 \end{bmatrix} \begin{bmatrix} \frac{1}{s+1} \\ \frac{1}{s+2} \end{bmatrix} = \frac{1}{s+1} + \frac{1}{s+2} = \frac{2s+3}{s^2+3s+2} $$

#### Example 3: Controllability and Observability (GATE 2018 type)
**Problem:** Check the controllability and observability of the system:
$A = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}, \quad B = \begin{bmatrix} 0 \\ 1 \end{bmatrix}, \quad C = \begin{bmatrix} 1 & 1 \end{bmatrix}$

**Solution:**
**1. Controllability ($Q_c$):**
$Q_c = [B \;\; AB]$
$AB = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} \begin{bmatrix} 0 \\ 1 \end{bmatrix} = \begin{bmatrix} 1 \\ -3 \end{bmatrix}$
$Q_c = \begin{bmatrix} 0 & 1 \\ 1 & -3 \end{bmatrix}$
Determinant $|Q_c| = (0)(-3) - (1)(1) = -1 \neq 0$.
Rank is 2. The system is **completely controllable**.

**2. Observability ($Q_o$):**
$Q_o = \begin{bmatrix} C \\ CA \end{bmatrix}$
$CA = \begin{bmatrix} 1 & 1 \end{bmatrix} \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix} = \begin{bmatrix} -2 & -2 \end{bmatrix}$
$Q_o = \begin{bmatrix} 1 & 1 \\ -2 & -2 \end{bmatrix}$
Determinant $|Q_o| = (1)(-2) - (1)(-2) = 0$.
Rank is 1 (less than $n=2$). The system is **not observable** (unobservable).

#### Example 4: State Feedback Pole Placement
**Problem:** A system is given by $\dot{\mathbf{x}} = \begin{bmatrix} 0 & 1 \\ -1 & -2 \end{bmatrix}\mathbf{x} + \begin{bmatrix} 0 \\ 1 \end{bmatrix}u$. Design a state feedback controller $u = -K\mathbf{x}$ such that the closed-loop poles are at $s = -2, -3$.

**Solution:**
Let $K = \begin{bmatrix} k_1 & k_2 \end{bmatrix}$.
The closed-loop system matrix is $A_{cl} = A - BK$.
$$ BK = \begin{bmatrix} 0 \\ 1 \end{bmatrix} \begin{bmatrix} k_1 & k_2 \end{bmatrix} = \begin{bmatrix} 0 & 0 \\ k_1 & k_2 \end{bmatrix} $$
$$ A_{cl} = \begin{bmatrix} 0 & 1 \\ -1 & -2 \end{bmatrix} - \begin{bmatrix} 0 & 0 \\ k_1 & k_2 \end{bmatrix} = \begin{bmatrix} 0 & 1 \\ -(1+k_1) & -(2+k_2) \end{bmatrix} $$
The characteristic equation of the closed-loop system is $|sI - A_{cl}| = 0$:
$$ \begin{vmatrix} s & -1 \\ (1+k_1) & s+(2+k_2) \end{vmatrix} = s^2 + (2+k_2)s + (1+k_1) = 0 $$
The desired characteristic equation is $(s+2)(s+3) = s^2 + 5s + 6 = 0$.
Comparing coefficients:
$2 + k_2 = 5 \implies k_2 = 3$
$1 + k_1 = 6 \implies k_1 = 5$
The state feedback gain matrix is $K = \begin{bmatrix} 5 & 3 \end{bmatrix}$.

#### Example 5: Non-Homogeneous Solution Evaluation
**Problem:** For $\dot{x}(t) = -2x(t) + u(t)$, with $x(0) = 1$ and a unit step input $u(t) = 1$ for $t \ge 0$, find the complete response $x(t)$.

**Solution:**
This is a 1st-order system where $A = -2$, $B = 1$.
The State Transition Matrix is $\Phi(t) = e^{At} = e^{-2t}$.
The complete response formula is:
$$ x(t) = e^{At}x(0) + \int_0^t e^{A(t-\tau)}Bu(\tau) d\tau $$
Substitute the given values:
$$ x(t) = e^{-2t}(1) + \int_0^t e^{-2(t-\tau)}(1)(1) d\tau $$
$$ x(t) = e^{-2t} + e^{-2t} \int_0^t e^{2\tau} d\tau $$
$$ x(t) = e^{-2t} + e^{-2t} \left[ \frac{e^{2\tau}}{2} \right]_0^t $$
$$ x(t) = e^{-2t} + e^{-2t} \left( \frac{e^{2t} - 1}{2} \right) $$
$$ x(t) = e^{-2t} + \frac{1}{2} - \frac{1}{2}e^{-2t} = \frac{1}{2} + \frac{1}{2}e^{-2t} $$

---

### 4. Practice Problems

**Problem 1:** Given the state equation $\dot{\mathbf{x}} = \begin{bmatrix} -2 & 0 \\ 0 & -4 \end{bmatrix} \mathbf{x} + \begin{bmatrix} 1 \\ 1 \end{bmatrix} u$, and output $y = \begin{bmatrix} 1 & 0 \end{bmatrix} \mathbf{x}$. Prove mathematically whether the system is controllable and observable. Identify which mode is unobservable and why.

**Problem 2:** A continuous time system is defined by $A = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$. If the system is discretized with a sampling time $T = 0.1$ seconds, calculate the discrete-time system matrix $G = e^{AT}$. *(Hint: Use the power series expansion of $e^{AT}$ up to the second term for an approximation, or use inverse Laplace for exact solution).*

**Problem 3:** Given a system with transfer function $H(s) = \frac{s+2}{s^3 + 4s^2 + 5s + 2}$, write down the state-space equations in Controllable Canonical Form and Observable Canonical Form. Verify that the trace of matrix $A$ remains identical in both forms.

**Problem 4:** An LTI system has state transition matrix $\Phi(t) = \begin{bmatrix} e^{-t} & te^{-t} \\ 0 & e^{-t} \end{bmatrix}$. Determine the system matrix $A$. *(Hint: Use the property $\dot{\Phi}(0) = A$)*.

**Problem 5:** Consider the system $\dot{\mathbf{x}} = \begin{bmatrix} 1 & 2 \\ 0 & 3 \end{bmatrix} \mathbf{x} + \begin{bmatrix} 0 \\ 1 \end{bmatrix} u$. Is it possible to find a feedback gain matrix $K = [k_1 \;\; k_2]$ such that the closed loop poles are placed at $-1 + j$ and $-1 - j$? If so, calculate $K$. If not, prove why mathematically using Kalman's controllability test.