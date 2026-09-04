# EE3601: Comprehensive Lecture Notes – Advanced Linear Control Systems and State-Space Analysis

## 1. Introduction to Modern Control Theory
Classical control theory, primarily based on the Laplace transform, root locus, and frequency response methods (Bode, Nyquist), is highly effective for single-input single-output (SISO) linear time-invariant (LTI) systems. However, it falls short when dealing with multi-input multi-output (MIMO) systems, time-varying systems, or non-linear dynamics. Modern control theory addresses these limitations by modeling systems in the time domain using state variables.

This chapter provides a rigorous textbook-quality foundation of State-Space Analysis, a critical topic for GATE Advanced Engineering Mathematics and core Electrical Engineering papers.

---

## 2. Theoretical Foundations: The State-Space Representation

### 2.1 State Variables and State Equations
The "state" of a dynamic system is the smallest set of variables (called state variables) such that the knowledge of these variables at $t = t_0$, together with the knowledge of the input for $t \ge t_0$, completely determines the behavior of the system for any time $t \ge t_0$.

For a continuous-time LTI system, the state-space representation comprises two equations:
1. **State Equation:** 
   $$ \dot{\mathbf{x}}(t) = \mathbf{A}\mathbf{x}(t) + \mathbf{B}\mathbf{u}(t) $$
2. **Output Equation:**
   $$ \mathbf{y}(t) = \mathbf{C}\mathbf{x}(t) + \mathbf{D}\mathbf{u}(t) $$

Where:
- $\mathbf{x}(t) \in \mathbb{R}^n$: State vector
- $\mathbf{u}(t) \in \mathbb{R}^m$: Input vector
- $\mathbf{y}(t) \in \mathbb{R}^p$: Output vector
- $\mathbf{A} \in \mathbb{R}^{n \times n}$: System matrix
- $\mathbf{B} \in \mathbb{R}^{n \times m}$: Input matrix
- $\mathbf{C} \in \mathbb{R}^{p \times n}$: Output matrix
- $\mathbf{D} \in \mathbb{R}^{p \times m}$: Feedthrough (or direct transmission) matrix

### 2.2 Derivation of the Transfer Function from State Space
Taking the Laplace transform of the state equations assuming zero initial conditions ($\mathbf{x}(0) = \mathbf{0}$):
$$ s\mathbf{X}(s) = \mathbf{A}\mathbf{X}(s) + \mathbf{B}\mathbf{U}(s) $$
$$ (s\mathbf{I} - \mathbf{A})\mathbf{X}(s) = \mathbf{B}\mathbf{U}(s) $$
$$ \mathbf{X}(s) = (s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\mathbf{U}(s) $$

Substituting $\mathbf{X}(s)$ into the output equation:
$$ \mathbf{Y}(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}\mathbf{U}(s) + \mathbf{D}\mathbf{U}(s) $$
$$ \mathbf{Y}(s) = \left[ \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + \mathbf{D} \right] \mathbf{U}(s) $$

The Transfer Function Matrix $\mathbf{G}(s)$ is defined as:
$$ \mathbf{G}(s) = \frac{\mathbf{Y}(s)}{\mathbf{U}(s)} = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B} + \mathbf{D} $$

The term $(s\mathbf{I} - \mathbf{A})^{-1}$ is called the **Resolvent Matrix**, denoted as $\mathbf{\Phi}(s)$. The poles of the transfer function are the roots of the characteristic equation:
$$ |s\mathbf{I} - \mathbf{A}| = 0 $$
These are the eigenvalues of the system matrix $\mathbf{A}$.

### 2.3 State Transition Matrix (STM)
The State Transition Matrix $\phi(t)$ describes how the unforced system transitions from its initial state to a state at time $t$. 
The homogeneous state equation is $\dot{\mathbf{x}}(t) = \mathbf{A}\mathbf{x}(t)$.
The solution is:
$$ \mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) $$
Thus, $\phi(t) = e^{\mathbf{A}t}$.

**Properties of STM:**
1. $\phi(0) = \mathbf{I}$
2. $\phi(t)^{-1} = \phi(-t)$
3. $\phi(t_1 + t_2) = \phi(t_1)\phi(t_2)$
4. $[\phi(t)]^k = \phi(kt)$

The complete solution to the non-homogeneous state equation is given by the convolution integral:
$$ \mathbf{x}(t) = e^{\mathbf{A}t}\mathbf{x}(0) + \int_{0}^{t} e^{\mathbf{A}(t-\tau)}\mathbf{B}\mathbf{u}(\tau) d\tau $$

### 2.4 Controllability and Observability
**Controllability** determines if an input can drive the system from any initial state to any desired final state in a finite time. 
Kalman's Controllability Matrix $\mathbf{Q}_c$:
$$ \mathbf{Q}_c = \begin{bmatrix} \mathbf{B} & \mathbf{AB} & \mathbf{A}^2\mathbf{B} & \dots & \mathbf{A}^{n-1}\mathbf{B} \end{bmatrix} $$
The system is entirely controllable if and only if $\text{rank}(\mathbf{Q}_c) = n$.

**Observability** determines if the internal states can be inferred from the knowledge of system outputs and inputs over a finite time.
Kalman's Observability Matrix $\mathbf{Q}_o$:
$$ \mathbf{Q}_o = \begin{bmatrix} \mathbf{C} \\ \mathbf{CA} \\ \mathbf{CA}^2 \\ \vdots \\ \mathbf{CA}^{n-1} \end{bmatrix} $$
The system is completely observable if and only if $\text{rank}(\mathbf{Q}_o) = n$.

---

## 3. Real-World Engineering Applications

1. **Aerospace - Satellite Attitude Control:**
   Satellites utilize state-space control (LQR - Linear Quadratic Regulator) for robust multi-axis stabilization. The inputs are thruster firings or reaction wheel torques, and the states are angular positions and velocities. Modern MIMO control ensures stability despite solar radiation pressure and magnetic interference.

2. **Power Systems - Wind Turbine Pitch Control:**
   In grid-connected wind energy conversion systems, wind speed variability requires continuous adjustment of blade pitch angles. State-space modeling predicts generator rotor speed and torque states to dynamically minimize structural fatigue and maximize power extraction.

3. **Automotive - Active Suspension Systems:**
   Quarter-car models are inherently 4th-order state-space systems. States include tire deflection, unsprung mass velocity, suspension stroke, and sprung mass velocity. Controllers calculate hydraulic actuator forces to balance ride comfort and road handling.

---

## 4. Advanced GATE-Level Solved Examples

### Example 1: Resolvent Matrix and Transfer Function
**Problem:** A system is defined by $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$, $\mathbf{C} = \begin{bmatrix} 1 & 0 \end{bmatrix}$, and $\mathbf{D} = 0$. Find the transfer function $G(s)$.

**Solution:**
1. Form $(s\mathbf{I} - \mathbf{A})$:
   $$ s\mathbf{I} - \mathbf{A} = \begin{bmatrix} s & -1 \\ 2 & s+3 \end{bmatrix} $$
2. Find $(s\mathbf{I} - \mathbf{A})^{-1}$:
   $$ |s\mathbf{I} - \mathbf{A}| = s(s+3) - (-2) = s^2 + 3s + 2 $$
   $$ (s\mathbf{I} - \mathbf{A})^{-1} = \frac{1}{s^2 + 3s + 2} \begin{bmatrix} s+3 & 1 \\ -2 & s \end{bmatrix} $$
3. Compute $G(s) = \mathbf{C}(s\mathbf{I} - \mathbf{A})^{-1}\mathbf{B}$:
   $$ G(s) = \begin{bmatrix} 1 & 0 \end{bmatrix} \frac{1}{s^2 + 3s + 2} \begin{bmatrix} s+3 & 1 \\ -2 & s \end{bmatrix} \begin{bmatrix} 0 \\ 1 \end{bmatrix} $$
   $$ G(s) = \frac{1}{s^2 + 3s + 2} \begin{bmatrix} s+3 & 1 \end{bmatrix} \begin{bmatrix} 0 \\ 1 \end{bmatrix} = \frac{1}{s^2 + 3s + 2} $$
**Answer:** $G(s) = \frac{1}{(s+1)(s+2)}$

### Example 2: State Transition Matrix Calculation
**Problem:** Calculate the State Transition Matrix $\phi(t)$ for $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$.

**Solution:**
1. $s\mathbf{I} - \mathbf{A} = \begin{bmatrix} s & -1 \\ 0 & s \end{bmatrix}$
2. $(s\mathbf{I} - \mathbf{A})^{-1} = \frac{1}{s^2}\begin{bmatrix} s & 1 \\ 0 & s \end{bmatrix} = \begin{bmatrix} 1/s & 1/s^2 \\ 0 & 1/s \end{bmatrix}$
3. $\phi(t) = \mathcal{L}^{-1} \left\{ (s\mathbf{I} - \mathbf{A})^{-1} \right\} = \begin{bmatrix} \mathcal{L}^{-1}(1/s) & \mathcal{L}^{-1}(1/s^2) \\ \mathcal{L}^{-1}(0) & \mathcal{L}^{-1}(1/s) \end{bmatrix}$
   $$ \phi(t) = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix} $$
**Answer:** $\phi(t) = \begin{bmatrix} 1 & t \\ 0 & 1 \end{bmatrix}$

### Example 3: Controllability and Observability Check
**Problem:** Determine if the system is controllable and observable:
$\mathbf{A} = \begin{bmatrix} -1 & 0 \\ 0 & -2 \end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$, $\mathbf{C} = \begin{bmatrix} 1 & 1 \end{bmatrix}$.

**Solution:**
1. **Controllability:**
   $\mathbf{Q}_c = \begin{bmatrix} \mathbf{B} & \mathbf{AB} \end{bmatrix} = \begin{bmatrix} 1 & -1 \\ 0 & 0 \end{bmatrix}$
   $|\mathbf{Q}_c| = 0$. Rank is 1 $< 2$.
   System is **uncontrollable**. (Mode associated with eigenvalue -2 is disconnected from input).
2. **Observability:**
   $\mathbf{Q}_o = \begin{bmatrix} \mathbf{C} \\ \mathbf{CA} \end{bmatrix} = \begin{bmatrix} 1 & 1 \\ -1 & -2 \end{bmatrix}$
   $|\mathbf{Q}_o| = (1)(-2) - (1)(-1) = -1 \neq 0$. Rank is 2.
   System is **observable**.
**Answer:** Uncontrollable, Observable.

### Example 4: Initial Value Problem in State Space
**Problem:** For the unforced system $\dot{\mathbf{x}} = \begin{bmatrix} 0 & 1 \\ -2 & -3 \end{bmatrix}\mathbf{x}$ with initial state $\mathbf{x}(0) = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$, find $\mathbf{x}(t)$.

**Solution:**
From Example 1, we know $(s\mathbf{I} - \mathbf{A})^{-1} = \frac{1}{(s+1)(s+2)} \begin{bmatrix} s+3 & 1 \\ -2 & s \end{bmatrix}$.
Taking partial fractions for $\mathcal{L}^{-1}$:
$\Phi_{11}(s) = \frac{s+3}{(s+1)(s+2)} = \frac{2}{s+1} - \frac{1}{s+2} \implies \phi_{11}(t) = 2e^{-t} - e^{-2t}$
$\Phi_{21}(s) = \frac{-2}{(s+1)(s+2)} = \frac{-2}{s+1} + \frac{2}{s+2} \implies \phi_{21}(t) = -2e^{-t} + 2e^{-2t}$
Since $\mathbf{x}(0) = \begin{bmatrix} 1 \\ 0 \end{bmatrix}$, $\mathbf{x}(t) = \phi(t)\mathbf{x}(0) = \begin{bmatrix} \phi_{11}(t) \\ \phi_{21}(t) \end{bmatrix}$.
**Answer:** $\mathbf{x}(t) = \begin{bmatrix} 2e^{-t} - e^{-2t} \\ -2e^{-t} + 2e^{-2t} \end{bmatrix}$

### Example 5: State-Feedback Controller Design (Pole Placement)
**Problem:** Given $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$ and $\mathbf{B} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$, design a state feedback gain $\mathbf{K} = [k_1, k_2]$ such that the closed-loop poles are at $-2 \pm j2$.

**Solution:**
1. Desired characteristic equation: $(s - (-2+j2))(s - (-2-j2)) = s^2 + 4s + 8 = 0$.
2. Closed-loop system matrix $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{BK}$:
   $$ \mathbf{A}_{cl} = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix} - \begin{bmatrix} 0 \\ 1 \end{bmatrix}\begin{bmatrix} k_1 & k_2 \end{bmatrix} = \begin{bmatrix} 0 & 1 \\ -k_1 & -k_2 \end{bmatrix} $$
3. Closed-loop characteristic equation:
   $$ |s\mathbf{I} - \mathbf{A}_{cl}| = \left| \begin{bmatrix} s & -1 \\ k_1 & s+k_2 \end{bmatrix} \right| = s^2 + k_2s + k_1 = 0 $$
4. Comparing coefficients with $s^2 + 4s + 8 = 0$:
   $k_1 = 8$, $k_2 = 4$.
**Answer:** $\mathbf{K} = \begin{bmatrix} 8 & 4 \end{bmatrix}$

---

## 5. Practice Problems for GATE Preparation

1. **Transfer Function equivalence:** A MIMO system has state matrices $\mathbf{A} = \begin{bmatrix} -1 & 0 \\ 0 & -3 \end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$, and $\mathbf{C} = \begin{bmatrix} 1 & 2 \end{bmatrix}$. Determine the transfer function matrix $\mathbf{G}(s)$.
2. **Eigenvalue Analysis:** Prove that the eigenvalues of the state transition matrix $\phi(t)$ are given by $e^{\lambda_i t}$, where $\lambda_i$ are the eigenvalues of the system matrix $\mathbf{A}$. 
3. **Observability via diagonalization:** Consider a system matrix $\mathbf{A}$ with distinct real eigenvalues, transformed into a diagonal canonical form. If an element in the output vector $\mathbf{C}_d$ is exactly zero, what does this imply about the observability of the corresponding state mode?
4. **Kalman Decomposition:** A system has $\mathbf{A} = \begin{bmatrix} 1 & 1 \\ -1 & -1 \end{bmatrix}$, $\mathbf{B} = \begin{bmatrix} 1 \\ -1 \end{bmatrix}$. Check its controllability. If uncontrollable, extract the controllable subspace.
5. **Non-linear to Linear State Space:** A non-linear pendulum equation is $\ddot{\theta} + \frac{g}{L}\sin(\theta) = u$. Define state variables $x_1 = \theta, x_2 = \dot{\theta}$. Linearize the model around the equilibrium point $x_1 = \pi$ (inverted position) and obtain the $\mathbf{A}$ and $\mathbf{B}$ matrices. Discuss the stability of the open-loop matrix $\mathbf{A}$.