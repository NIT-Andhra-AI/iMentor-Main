# EE3621: Digital Signal Processing – Advanced Lecture Series
## Chapter: Transform Domain Analysis of Discrete-Time LTI Systems

### 1. Introduction and Scope
This chapter serves as a definitive reference for the mathematical and conceptual framework governing Discrete-Time Linear Time-Invariant (LTI) systems. Designed for faculty reference and advanced GATE preparation, the text bridges the gap between abstract functional analysis and physical system design. We will rigorously explore the Z-transform, the Discrete-Time Fourier Transform (DTFT), and their profound implications on system stability, causality, and frequency response.

---

### 2. Deep Theoretical Foundations

#### 2.1 The Z-Transform: Definition and Analytic Continuation
For a discrete-time sequence $x[n]$, the two-sided (bilateral) Z-transform is defined as a Laurent series:
$$X(z) = \sum_{n=-\infty}^{\infty} x[n]z^{-n}$$
where $z$ is a complex variable, $z = r e^{j\omega}$.

**Derivation of the Region of Convergence (ROC):**
The existence of the Z-transform depends on the absolute convergence of the series:
$$\sum_{n=-\infty}^{\infty} |x[n]||z|^{-n} < \infty$$
Splitting the sum into causal and anti-causal parts:
$$S_1 = \sum_{n=0}^{\infty} |x[n]| r^{-n}, \quad S_2 = \sum_{n=-\infty}^{-1} |x[n]| r^{-n} = \sum_{m=1}^{\infty} |x[-m]| r^{m}$$
By the Cauchy-Hadamard theorem for power series, $S_1$ converges for $r > R_{in}$ and $S_2$ converges for $r < R_{out}$. The complete transform converges in the annular region:
$$R_{in} < |z| < R_{out}$$
This annular region is the **Region of Convergence (ROC)**. 

#### 2.2 System Transfer Function and Stability
For an LTI system characterized by its impulse response $h[n]$, the output $y[n]$ to an input $x[n]$ is the convolution sum $y[n] = x[n] * h[n]$. By the convolution property of the Z-transform:
$$Y(z) = H(z)X(z)$$
where $H(z)$ is the **System Transfer Function**.

**Theorem (BIBO Stability):** An LTI system is Bounded-Input Bounded-Output (BIBO) stable if and only if its impulse response is absolutely summable ($\sum |h[n]| < \infty$). In the Z-domain, this requires the ROC of $H(z)$ to include the unit circle ($|z| = 1$). 

**Corollary (Causality and Stability):** For a causal LTI system, the ROC is of the form $|z| > R_{max}$, where $R_{max}$ is the magnitude of the largest pole. For stability, we must have $R_{max} < 1$. Thus, a causal system is stable if and only if **all its poles lie strictly inside the unit circle**.

#### 2.3 The Discrete-Time Fourier Transform (DTFT)
Evaluating the Z-transform on the unit circle ($z = e^{j\omega}$) yields the DTFT:
$$X(e^{j\omega}) = \sum_{n=-\infty}^{\infty} x[n]e^{-j\omega n}$$
The DTFT is always periodic with period $2\pi$. The inverse DTFT is formulated via Cauchy's integral theorem over the unit circle:
$$x[n] = \frac{1}{2\pi} \int_{-\pi}^{\pi} X(e^{j\omega})e^{j\omega n} d\omega$$

---

### 3. Real-World Engineering Applications

1. **Telecommunications - Channel Equalization:** In digital communication systems (e.g., 5G NR, Wi-Fi), multipath fading causes Intersymbol Interference (ISI). A discrete-time equalizer uses an inverse filter $H_{eq}(z) \approx 1/H_{channel}(z)$. Analyzing the zeros of $H_{channel}(z)$ dictates whether the equalizer can be stable and causal (minimum phase system).
2. **Audio Signal Processing - Active Noise Cancellation (ANC):** ANC algorithms rely on adaptive DSP (like the Filtered-X LMS algorithm). The transfer function of the acoustic path (secondary path) is modeled as an LTI system. Z-transform analysis ensures the adaptation step size maintains closed-loop stability.
3. **Biomedical Engineering - ECG Artifact Removal:** To remove 50/60 Hz powerline interference from an electrocardiogram (ECG) without distorting the clinical features (like the QRS complex), engineers design Notch filters. The zeros are placed exactly on the unit circle at $\omega = \pm \omega_0$, and poles are placed at $r \approx 0.99$ at the same angles to ensure a sharp, stable notch.

---

### 4. Advanced GATE-Level Solved Examples

#### Example 1: ROC Intersection and System Properties
**Problem:** Consider a discrete-time signal $x[n] = (0.5)^n u[n] - (2)^n u[-n-1]$. Determine the Z-transform $X(z)$ and its ROC. Is the DTFT of $x[n]$ defined?

**Solution:**
1. Split the signal: $x_1[n] = (0.5)^n u[n]$ and $x_2[n] = -(2)^n u[-n-1]$.
2. Z-transform of $x_1[n]$: $X_1(z) = \frac{1}{1 - 0.5z^{-1}}$, with ROC $|z| > 0.5$.
3. Z-transform of $x_2[n]$: Using the property $-a^n u[-n-1] \leftrightarrow \frac{1}{1 - az^{-1}}$ for $|z| < |a|$, we have $X_2(z) = \frac{1}{1 - 2z^{-1}}$, with ROC $|z| < 2$.
4. Total Z-transform: $X(z) = \frac{1}{1 - 0.5z^{-1}} + \frac{1}{1 - 2z^{-1}}$.
5. Overall ROC is the intersection: $0.5 < |z| < 2$.
6. Since the unit circle ($|z| = 1$) lies entirely within the ROC ($0.5 < 1 < 2$), the sequence is absolutely summable. Therefore, the **DTFT of $x[n]$ is well-defined and exists.**

#### Example 2: Inverse Z-Transform via Residue Theorem
**Problem:** Find the impulse response $h[n]$ of a system whose transfer function is $H(z) = \frac{z}{z^2 - 1.5z + 0.5}$ for an anti-causal system.

**Solution:**
1. Factor the denominator: $z^2 - 1.5z + 0.5 = (z - 1)(z - 0.5)$.
2. Poles are at $p_1 = 1$ and $p_2 = 0.5$.
3. The possible ROCs are: $|z| > 1$ (Causal), $0.5 < |z| < 1$ (Two-sided), $|z| < 0.5$ (Anti-causal).
4. Since the system is specified as anti-causal, the ROC must be $|z| < 0.5$.
5. Perform partial fraction expansion on $H(z)/z$:
   $$\frac{H(z)}{z} = \frac{1}{(z - 1)(z - 0.5)} = \frac{A}{z - 1} + \frac{B}{z - 0.5}$$
   $A = \left. \frac{1}{z - 0.5} \right|_{z=1} = 2$
   $B = \left. \frac{1}{z - 1} \right|_{z=0.5} = -2$
6. $H(z) = \frac{2z}{z - 1} - \frac{2z}{z - 0.5} = \frac{2}{1 - z^{-1}} - \frac{2}{1 - 0.5z^{-1}}$.
7. Since ROC is $|z| < 0.5$, both terms correspond to left-sided (anti-causal) sequences:
   $h[n] = -2(1)^n u[-n-1] - (-2(0.5)^n u[-n-1])$
   $h[n] = [2(0.5)^n - 2] u[-n-1]$.

#### Example 3: Parseval's Theorem and Energy Computation
**Problem:** An ideal low-pass filter has a frequency response $H(e^{j\omega}) = 1$ for $|\omega| \le \frac{\pi}{4}$ and $0$ otherwise. If the input is $x[n] = \frac{\sin(\pi n / 2)}{\pi n}$, find the total energy of the output signal $y[n]$.

**Solution:**
1. Input Energy Density: $x[n]$ is an ideal low-pass signal with cutoff $\omega_c = \pi/2$. 
   $X(e^{j\omega}) = 1$ for $|\omega| \le \frac{\pi}{2}$, and $0$ otherwise.
2. The output spectrum $Y(e^{j\omega}) = H(e^{j\omega})X(e^{j\omega})$. 
   Multiplying the two rectangular spectra yields $Y(e^{j\omega}) = 1$ for $|\omega| \le \frac{\pi}{4}$, and $0$ otherwise.
3. By Parseval's Theorem, the total energy $E$ is:
   $$E = \sum_{n=-\infty}^{\infty} |y[n]|^2 = \frac{1}{2\pi} \int_{-\pi}^{\pi} |Y(e^{j\omega})|^2 d\omega$$
4. Compute the integral:
   $$E = \frac{1}{2\pi} \int_{-\pi/4}^{\pi/4} (1)^2 d\omega = \frac{1}{2\pi} \left[ \frac{\pi}{4} - \left(-\frac{\pi}{4}\right) \right] = \frac{1}{2\pi} \left(\frac{\pi}{2}\right) = 0.25$$
**Answer: The total energy of the output signal is 0.25 Joules.**

#### Example 4: Minimum Phase Systems and All-Pass Filters
**Problem:** A stable and causal LTI system has a transfer function $H(z) = \frac{z^{-1} - 0.8}{1 - 0.8z^{-1}}$. Prove that the magnitude response $|H(e^{j\omega})|$ is exactly 1 for all $\omega$.

**Solution:**
1. Replace $z$ with $e^{j\omega}$:
   $$H(e^{j\omega}) = \frac{e^{-j\omega} - 0.8}{1 - 0.8e^{-j\omega}}$$
2. Compute the squared magnitude $|H(e^{j\omega})|^2 = H(e^{j\omega})H^*(e^{j\omega})$:
   $$|H(e^{j\omega})|^2 = \left( \frac{e^{-j\omega} - 0.8}{1 - 0.8e^{-j\omega}} \right) \left( \frac{e^{j\omega} - 0.8}{1 - 0.8e^{j\omega}} \right)$$
3. Expand the numerator:
   $N(\omega) = (e^{-j\omega} - 0.8)(e^{j\omega} - 0.8) = 1 - 0.8e^{-j\omega} - 0.8e^{j\omega} + 0.64 = 1.64 - 1.6\cos(\omega)$
4. Expand the denominator:
   $D(\omega) = (1 - 0.8e^{-j\omega})(1 - 0.8e^{j\omega}) = 1 - 0.8e^{j\omega} - 0.8e^{-j\omega} + 0.64 = 1.64 - 1.6\cos(\omega)$
5. Since $N(\omega) = D(\omega)$ for all $\omega$, $|H(e^{j\omega})|^2 = 1 \implies |H(e^{j\omega})| = 1$.
**Conclusion:** The system is an **All-Pass Filter**. Its phase response is nonlinear, but it passes all frequencies without magnitude attenuation.

#### Example 5: Solving Linear Constant-Coefficient Difference Equations
**Problem:** A system is described by $y[n] - \frac{5}{6}y[n-1] + \frac{1}{6}y[n-2] = x[n]$. The system is causal. Find the step response of the system.

**Solution:**
1. Take the Z-transform with zero initial conditions to find $H(z)$:
   $$Y(z) \left(1 - \frac{5}{6}z^{-1} + \frac{1}{6}z^{-2}\right) = X(z)$$
   $$H(z) = \frac{1}{1 - \frac{5}{6}z^{-1} + \frac{1}{6}z^{-2}} = \frac{1}{(1 - \frac{1}{2}z^{-1})(1 - \frac{1}{3}z^{-1})}$$
2. The input is a unit step $x[n] = u[n]$, so $X(z) = \frac{1}{1 - z^{-1}}$.
3. The output Z-transform is $Y(z) = H(z)X(z)$:
   $$Y(z) = \frac{1}{(1 - z^{-1})(1 - \frac{1}{2}z^{-1})(1 - \frac{1}{3}z^{-1})}$$
4. Perform partial fraction expansion (in terms of $z^{-1}$):
   $$Y(z) = \frac{A}{1 - z^{-1}} + \frac{B}{1 - \frac{1}{2}z^{-1}} + \frac{C}{1 - \frac{1}{3}z^{-1}}$$
5. Solve for constants (via Heaviside cover-up on roots $z^{-1} = 1, 2, 3$):
   * For $A$ (at $z^{-1} = 1$): $A = \frac{1}{(1 - 1/2)(1 - 1/3)} = \frac{1}{(1/2)(2/3)} = 3$.
   * For $B$ (at $z^{-1} = 2$): $B = \frac{1}{(1 - 2)(1 - 2/3)} = \frac{1}{(-1)(1/3)} = -3$.
   * For $C$ (at $z^{-1} = 3$): $C = \frac{1}{(1 - 3)(1 - 3/2)} = \frac{1}{(-2)(-1/2)} = 1$.
6. Substitute back:
   $$Y(z) = \frac{3}{1 - z^{-1}} - \frac{3}{1 - \frac{1}{2}z^{-1}} + \frac{1}{1 - \frac{1}{3}z^{-1}}$$
7. Take the inverse Z-transform (causal ROC $|z| > 1$):
   $$y[n] = 3u[n] - 3\left(\frac{1}{2}\right)^n u[n] + \left(\frac{1}{3}\right)^n u[n]$$

---

### 5. Practice Problems

**Problem 1 (Stability and Parameter Range):**
Consider a causal LTI system with transfer function $H(z) = \frac{1}{1 - Kz^{-1} + 0.25z^{-2}}$. Determine the range of the real parameter $K$ for which the system remains BIBO stable.

**Problem 2 (DTFT Properties):**
Let $X(e^{j\omega})$ be the DTFT of a real and even discrete-time sequence $x[n]$. Prove theoretically that $X(e^{j\omega})$ must also be purely real and even.

**Problem 3 (System Cascades):**
Two LTI systems with impulse responses $h_1[n] = (\alpha)^n u[n]$ and $h_2[n] = (\beta)^n u[n]$ (where $\alpha \neq \beta$ and both are $<1$) are connected in series. Derive the overall impulse response $h[n]$ using convolution in the time domain, and verify your answer using the Z-transform partial fraction method.

**Problem 4 (Inverse System Design):**
An LTI system has $H(z) = \frac{1 - 2z^{-1}}{1 - 0.5z^{-1}}$. Design a stable inverse system $G(z)$ such that $H(z)G(z) = 1$. Specify the ROC of $G(z)$ and comment on whether the inverse system can be implemented causally in real-time hardware. 

**Problem 5 (Energy & Parseval's):**
A signal $x[n] = \frac{\sin(\omega_c n)}{\pi n}$ is passed through an ideal high-pass filter with cutoff frequency $\omega_0$ (where $\omega_0 < \omega_c$). Compute the energy of the resulting signal as a function of $\omega_c$ and $\omega_0$.