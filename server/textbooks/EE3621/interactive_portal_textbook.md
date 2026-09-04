# Chapter 8: Interactive Portals in Cyber-Physical Systems (EE3621)

## 8.1 Introduction to Interactive Portals
In modern Electrical and Electronics Engineering, particularly within the domains of Cyber-Physical Systems (CPS) and the Internet of Things (IoT), an **Interactive Portal** acts as the crucial Human-Machine Interface (HMI) and data aggregation node. It bridges the physical layer (sensors, actuators, microcontrollers) with the application layer, enabling real-time monitoring, teleoperation, and data analytics.

Unlike traditional static web pages, interactive portals for EE applications must adhere to strict deterministic timing constraints, high availability, and secure duplex communication.

## 8.2 Deep Theoretical Foundations and Derivations

### 8.2.1 Networked Control System (NCS) Delay Modeling
When an interactive portal is used in a closed-loop control system, the end-to-end latency significantly impacts the system's phase margin and stability. 

Let the continuous-time plant be described by:
$$ \dot{x}(t) = Ax(t) + Bu(t) $$

In a discrete-time portal-controlled system, the total time delay $\tau_{total}$ is the sum of distributed delays:
$$ \tau_{total} = \tau_{sc} + \tau_{portal} + \tau_{ca} + \tau_{c} $$
Where:
* $\tau_{sc}$: Sensor-to-Controller (Portal) network delay.
* $\tau_{portal}$: Processing delay at the interactive portal (parsing, rendering, decision logic).
* $\tau_{ca}$: Portal-to-Actuator network delay.
* $\tau_{c}$: Computational delay of the end nodes.

**Derivation of Maximum Allowable Delay Margin (MADM):**
For stability, the system roots must lie inside the unit circle in the z-plane. Assuming a constant delay $\tau = kT_s + \tau_f$ (where $T_s$ is the sampling period, $k$ is an integer, and $\tau_f < T_s$), the augmented state-space model becomes:
$$ x(k+1) = \Phi x(k) + \Gamma_0 u(k) + \Gamma_1 u(k-1) $$
Where:
$$ \Phi = e^{AT_s}, \quad \Gamma_0 = \int_{0}^{T_s - \tau_f} e^{As} ds B, \quad \Gamma_1 = \int_{T_s - \tau_f}^{T_s} e^{As} ds B $$
For the portal to maintain system stability, the eigenvalues of the closed-loop matrix must satisfy:
$$ |\lambda_i(\Phi - \Gamma_0 K - \Gamma_1 K)| < 1 $$
The supremum of $\tau_{total}$ that satisfies this condition is the MADM. If the portal processing time $\tau_{portal}$ causes $\tau_{total} > MADM$, the system becomes unstable.

### 8.2.2 Server Queueing Dynamics (M/M/1 Model)
An interactive portal server handles asynchronous data streams from thousands of embedded nodes. This is modeled using Queueing Theory.
Assume packets arrive according to a Poisson process with rate $\lambda$ (packets/sec) and are processed with an exponentially distributed service time with rate $\mu$ (packets/sec).

The utilization factor of the portal server is:
$$ \rho = \frac{\lambda}{\mu} $$
For a stable portal, $\rho < 1$. 

The expected number of data packets in the system (waiting + being processed) is:
$$ L = \frac{\rho}{1 - \rho} = \frac{\lambda}{\mu - \lambda} $$
The average time a control packet spends in the portal ($W$) is derived using Little’s Law ($L = \lambda W$):
$$ \tau_{portal} \approx W = \frac{1}{\mu - \lambda} $$
**Design Insight:** As the arrival rate $\lambda$ approaches the portal's processing capacity $\mu$, the delay $\tau_{portal}$ approaches infinity, leading to catastrophic control failures.

### 8.2.3 Data Serialization Overhead
Information theory dictates the efficiency of data transfer to the portal. For a payload of $D$ bytes, the overhead ratio is:
$$ \eta = \frac{D}{D + H_{tcp} + H_{ip} + H_{mac} + H_{app}} $$
Where $H_{app}$ is the application-layer header (e.g., HTTP/REST vs. MQTT). 
For HTTP/JSON, $H_{app}$ can be >200 bytes. For MQTT/Binary, $H_{app}$ is typically 2 bytes. The choice directly affects the required channel bandwidth $C$ (Shannon-Hartley theorem):
$$ C = B \log_2\left(1 + \frac{S}{N}\right) \ge \lambda (D + H_{total}) \times 8 \text{ bits/sec} $$

## 8.3 Real-World Engineering Applications

1. **Smart Grid SCADA Dashboards:** Wide Area Monitoring Systems (WAMS) use interactive portals to visualize Phasor Measurement Unit (PMU) data. The portal must render voltage phase angles at 30-60 frames per second to allow operators to detect islanding conditions.
2. **Tele-Robotic Surgery HMIs:** Surgeons use high-fidelity interactive portals offering haptic feedback. The portal must guarantee end-to-end latencies of $<10\text{ms}$ over 5G networks to prevent spatial desynchronization.
3. **Industrial IoT (IIoT) Predictive Maintenance:** Portals aggregate continuous vibration and thermal data from induction motors. Edge-integrated portals run Fast Fourier Transforms (FFT) on WebGL, offloading the cloud.

---

## 8.4 GATE-Level Solved Examples

**Example 1: Queueing Delay in IIoT Portal**
**Problem:** An interactive portal server for a chemical plant receives temperature updates from sensors following a Poisson distribution at a rate of 400 packets/second. The portal processes these packets with an exponential service time, capable of handling 500 packets/second. The total allowable delay for a temperature update before sounding a physical alarm is 15 ms. What is the probability that a packet exceeds this delay? (Assume M/M/1 queue).

**Solution:**
1. Arrival rate $\lambda = 400$ packets/sec.
2. Service rate $\mu = 500$ packets/sec.
3. The probability density function of waiting time $W$ in an M/M/1 queue is $f(t) = (\mu - \lambda)e^{-(\mu - \lambda)t}$.
4. The probability that the delay exceeds $T = 15$ ms ($0.015$ s) is:
$$ P(W > t) = e^{-(\mu - \lambda)t} $$
$$ P(W > 0.015) = e^{-(500 - 400) \times 0.015} = e^{-100 \times 0.015} = e^{-1.5} $$
$$ e^{-1.5} \approx 0.2231 $$
**Answer:** The probability is 0.2231 (or 22.31%).

**Example 2: Portal Bandwidth and Shannon Capacity**
**Problem:** A remote interactive portal monitors a 3-phase power system. It samples voltage and current at 1 kHz with 16-bit resolution per channel (3 voltage, 3 current channels). The data is sent using TCP/IP with a total header overhead of 40 bytes per packet. If 10 samples are packed into one packet to reduce overhead, calculate the minimum required channel bandwidth if the Signal-to-Noise Ratio (SNR) of the telemetry link is 15 dB.

**Solution:**
1. Payload per sample = 6 channels $\times$ 16 bits = 96 bits = 12 bytes.
2. Payload per packet (10 samples) = 120 bytes.
3. Total packet size = 120 (payload) + 40 (header) = 160 bytes = 1280 bits.
4. Sampling rate is 1 kHz, meaning 1000 samples/sec. Since 10 samples are in one packet, packet transmission rate = 100 packets/sec.
5. Required Data Rate ($R$) = $100 \times 1280 = 128,000$ bps = 128 kbps.
6. Shannon Capacity: $C = B \log_2(1 + SNR_{linear})$.
7. SNR in linear scale: $15 \text{ dB} = 10 \log_{10}(SNR_{linear}) \implies SNR_{linear} = 10^{1.5} = 31.62$.
8. $128,000 = B \log_2(1 + 31.62) = B \log_2(32.62) \approx B \times 5.027$.
9. Required Bandwidth $B = \frac{128,000}{5.027} \approx 25,462.5$ Hz.
**Answer:** Minimum bandwidth is approximately 25.46 kHz.

**Example 3: Stability of Portal-in-the-Loop**
**Problem:** A DC motor speed control system uses a proportional controller $K_p = 2$. The continuous plant is $G(s) = \frac{1}{s+1}$. An interactive portal introduces a pure time delay $\tau$. What is the maximum processing delay the portal can introduce before the closed-loop system becomes unstable? 

**Solution:**
1. Open-loop transfer function: $H(s) = K_p G(s) e^{-s\tau} = \frac{2 e^{-s\tau}}{s+1}$.
2. The characteristic equation is $1 + H(s) = 0 \implies s + 1 + 2e^{-s\tau} = 0$.
3. For marginal stability, set $s = j\omega$:
$$ j\omega + 1 + 2(\cos(\omega\tau) - j\sin(\omega\tau)) = 0 $$
4. Equate real and imaginary parts to zero:
Real: $1 + 2\cos(\omega\tau) = 0 \implies \cos(\omega\tau) = -0.5 \implies \omega\tau = \frac{2\pi}{3}$ (for lowest positive $\tau$).
Imaginary: $\omega - 2\sin(\omega\tau) = 0$.
5. From Real part, $\sin(\omega\tau) = \sqrt{1 - (-0.5)^2} = \sqrt{0.75} = \frac{\sqrt{3}}{2}$.
6. Substitute into Imaginary part: $\omega - 2(\frac{\sqrt{3}}{2}) = 0 \implies \omega = \sqrt{3}$ rad/s.
7. Solve for $\tau$: $\tau = \frac{2\pi}{3\omega} = \frac{2\pi}{3\sqrt{3}} \approx 1.209$ seconds.
**Answer:** The maximum portal delay for stability is 1.209 seconds.

**Example 4: Throughput Efficiency of Websockets vs HTTP Polling**
**Problem:** A portal requires data from a sensor every 50ms. 
Scheme A (HTTP Polling): Each request has a 200B header, and the response has a 200B header + 50B payload.
Scheme B (Websockets): After a 1000B initial handshake, the server pushes data every 50ms with a 10B header + 50B payload.
Calculate the ratio of total bytes transmitted by Scheme A to Scheme B over a 10-second monitoring window.

**Solution:**
1. Number of data events in 10s: $\frac{10}{0.05} = 200$ events.
2. Scheme A total bytes per event: 200 (req) + 200 (resp header) + 50 (payload) = 450 bytes.
3. Total bytes Scheme A over 10s = $200 \times 450 = 90,000$ bytes.
4. Scheme B total bytes per event: 10 (header) + 50 (payload) = 60 bytes.
5. Total bytes Scheme B over 10s = 1000 (handshake) + $(200 \times 60) = 1000 + 12000 = 13,000$ bytes.
6. Ratio = $\frac{90,000}{13,000} = \frac{90}{13} \approx 6.92$.
**Answer:** The ratio is 6.92. Scheme A utilizes nearly 7 times the bandwidth.

**Example 5: Z-Transform of Portal Controller**
**Problem:** A digital PI controller implemented on an interactive portal has the transfer function $D(z) = \frac{U(z)}{E(z)} = 2 + \frac{0.5}{1 - z^{-1}}$. If the error signal $e(k)$ is a unit step sequence, calculate the control effort $u(k)$ at $k = 2$.

**Solution:**
1. Simplify $D(z) = \frac{2(1 - z^{-1}) + 0.5}{1 - z^{-1}} = \frac{2.5 - 2z^{-1}}{1 - z^{-1}}$.
2. The difference equation is: $u(k) - u(k-1) = 2.5e(k) - 2e(k-1)$.
3. Re-arrange: $u(k) = u(k-1) + 2.5e(k) - 2e(k-1)$.
4. Assuming zero initial conditions: $u(-1) = 0, e(-1) = 0$.
5. For $k=0$: $u(0) = 0 + 2.5(1) - 2(0) = 2.5$.
6. For $k=1$: $u(1) = 2.5 + 2.5(1) - 2(1) = 2.5 + 0.5 = 3.0$.
7. For $k=2$: $u(2) = 3.0 + 2.5(1) - 2(1) = 3.0 + 0.5 = 3.5$.
**Answer:** The control effort at $k=2$ is 3.5.

---

## 8.5 Practice Problems

**Q1.** An interactive portal server operates as an M/M/c queue with $c=2$ load-balanced processors. The combined arrival rate is $\lambda = 800$ packets/sec, and each processor has a service rate $\mu = 500$ packets/sec. Calculate the average waiting time in the queue (before processing begins). 
*(Hint: Use Erlang C formula for M/M/c utilization)*.

**Q2.** An embedded IoT system uploads video frames to a portal. The portal requires an uncompressed frame rate of 30 fps at a resolution of $320 \times 240$ with 8-bit grayscale. If the transmission channel utilizes QPSK modulation with a roll-off factor $\alpha = 0.25$, what is the minimum required channel bandwidth in MHz?

**Q3.** An interactive portal implements an IIR low-pass filter to smooth sensor noise. The filter is defined by $y[n] = 0.8y[n-1] + 0.2x[n]$. Find the magnitude of the steady-state response of the portal if the input is a DC sensor reading of 5V with a superimposed high-frequency noise $x[n] = 5 + 2(-1)^n$. 

**Q4.** A smart grid portal has a phase margin requirement of $45^\circ$. The open-loop system is $G(s) = \frac{10}{s(s+2)}$. Calculate the maximum pure time delay $\tau_d$ the portal's communication protocol can introduce before the phase margin requirement is violated.