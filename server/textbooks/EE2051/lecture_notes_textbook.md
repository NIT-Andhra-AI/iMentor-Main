# EE2051: Electrical Circuit Analysis
## Comprehensive Reference: Advanced Network Analysis and Theorems

### 1. Deep Theoretical Foundations and Derivations

#### 1.1 Thevenin's and Norton's Theorems
**Statement:** Any linear bilateral network with active sources and passive elements can be replaced by an equivalent circuit containing a single voltage source ($V_{TH}$) in series with an equivalent impedance ($Z_{TH}$) (Thevenin) or a single current source ($I_{N}$) in parallel with an equivalent admittance ($Y_{N}$) (Norton).

**Derivation of Thevenin's Theorem:**
Consider a linear two-terminal network $N$ containing independent and dependent sources. Let the terminals be A and B. When a load current $I_L$ flows into a load $Z_L$, we can represent the network using the superposition theorem. 
The voltage $V_{AB}$ across the load is the sum of two components:
1. The open-circuit voltage $V_{OC}$ when $Z_L \to \infty$ (i.e., $I_L = 0$).
2. The voltage drop due to the load current $I_L$ flowing through the network's internal impedance $Z_{TH}$ (with all independent sources deactivated).

Mathematically, by superposition:
$$ V_{AB} = V_{OC} - I_L Z_{TH} $$
Since $V_{AB} = I_L Z_L$, we have:
$$ I_L Z_L = V_{OC} - I_L Z_{TH} \implies I_L = \frac{V_{OC}}{Z_{TH} + Z_L} $$
This is exactly the current that would flow if the load $Z_L$ were connected to a series combination of a voltage source $V_{TH} = V_{OC}$ and an impedance $Z_{TH}$. This completes the derivation.

#### 1.2 Tellegen's Theorem
**Statement:** For any lumped network consisting of $b$ branches and $n$ nodes, if $v_k$ and $i_k$ are the branch voltage and branch current of the $k$-th branch respectively, satisfying Kirchhoff's laws (KVL and KCL), then:
$$ \sum_{k=1}^{b} v_k i_k = 0 $$

**Derivation:**
Let $e_p$ and $e_q$ be the node potentials at the terminals of the $k$-th branch, such that current $i_k$ flows from node $p$ to node $q$. The branch voltage is $v_k = e_p - e_q$.
Then, the sum of power over all branches is:
$$ \sum_{k=1}^{b} v_k i_k = \sum_{k=1}^{b} (e_p - e_q) i_k = \sum_{k=1}^{b} e_p i_k - \sum_{k=1}^{b} e_q i_k $$
By rearranging the sum over nodes $j$ from 1 to $n$:
$$ \sum_{k=1}^{b} v_k i_k = \sum_{j=1}^{n} e_j \left( \sum_{\text{branches leaving node } j} i_k - \sum_{\text{branches entering node } j} i_k \right) $$
By Kirchhoff's Current Law (KCL), the algebraic sum of currents leaving any node is zero. Therefore, the term in the parenthesis is zero for all $j$.
$$ \sum_{k=1}^{b} v_k i_k = \sum_{j=1}^{n} e_j (0) = 0 $$
This theorem depends only on the topology of the network, irrespective of the nature of the elements (linear, non-linear, active, passive, time-varying).

#### 1.3 Maximum Power Transfer Theorem (AC Circuits)
For an AC circuit with a constant Thevenin voltage $V_{TH}$ and an internal impedance $Z_{TH} = R_{TH} + jX_{TH}$, the maximum active power is transferred to a load $Z_L = R_L + jX_L$ when $Z_L = Z_{TH}^*$ (complex conjugate of the internal impedance).

**Derivation:**
The current in the circuit is $I = \frac{V_{TH}}{(R_{TH} + R_L) + j(X_{TH} + X_L)}$.
The power delivered to the load is $P_L = |I|^2 R_L = \frac{|V_{TH}|^2 R_L}{(R_{TH} + R_L)^2 + (X_{TH} + X_L)^2}$.
To maximize $P_L$, we first differentiate with respect to $X_L$:
$$ \frac{\partial P_L}{\partial X_L} = 0 \implies X_{TH} + X_L = 0 \implies X_L = -X_{TH} $$
Now the power becomes $P_L = \frac{|V_{TH}|^2 R_L}{(R_{TH} + R_L)^2}$.
Differentiating with respect to $R_L$:
$$ \frac{\partial P_L}{\partial R_L} = |V_{TH}|^2 \frac{(R_{TH} + R_L)^2 - 2R_L(R_{TH} + R_L)}{(R_{TH} + R_L)^4} = 0 $$
$$ R_{TH} + R_L - 2R_L = 0 \implies R_L = R_{TH} $$
Hence, $Z_L = R_{TH} - jX_{TH} = Z_{TH}^*$.

---

### 2. Real-World Engineering Applications

1.  **Impedance Matching in RF and Audio Amplifiers (Maximum Power Transfer):**
    In radio frequency (RF) engineering, antennas must be impedance-matched to the transmission lines and transmitters (usually $50\Omega$) to ensure maximum power is radiated and to minimize standing waves (reflections) that can damage the transmitter. Similarly, in high-fidelity audio systems, amplifiers are designed with specific output impedances to drive loudspeakers optimally.
2.  **Power Grid Fault Analysis (Thevenin's Theorem):**
    Power systems are highly complex networks with thousands of nodes. When analyzing a fault (like a short circuit) at a specific bus (node), engineers use Thevenin's theorem. The entire interconnected grid is reduced to a single Thevenin voltage (pre-fault bus voltage) and a Thevenin impedance (short-circuit impedance). This simplified model allows for the rapid sizing of circuit breakers and protective relays.
3.  **Sensor Bridge Circuits (Superposition & Thevenin):**
    Wheatstone bridges are extensively used in instrumentation with strain gauges, RTDs, and thermistors. Evaluating the microvolt-level unbalance caused by a change in the physical parameter is modeled using Thevenin equivalents to calculate the exact current drawn by the sensitive galvanometer or instrumentation amplifier connected across the bridge.
4.  **Verification of Power Flow Software (Tellegen's Theorem):**
    Modern power systems utilize state-estimation and load-flow software (like Newton-Raphson solvers). Tellegen's theorem serves as a fundamental physical consistency check algorithm within these software suites, ensuring that the computed nodal voltages and branch currents do not violate the law of conservation of energy before outputting the results.

---

### 3. Advanced GATE-Level Solved Examples

#### Example 1: Thevenin Equivalent with Dependent Sources
**Problem:** Find the Thevenin equivalent circuit across terminals A and B for a circuit containing a 10V independent voltage source, a series $2\Omega$ resistor, and a current-controlled voltage source (CCVS) $V_d = 4I_x$ where $I_x$ is the current flowing out of the 10V source. The CCVS is in parallel with a $4\Omega$ resistor, and terminals A-B are across the $4\Omega$ resistor. (Assume node 0 is the negative terminal of the 10V source).

**Solution:**
**Step 1: Find $V_{OC}$ (Open Circuit Voltage $V_{AB}$)**
Let $V_A = V_{OC}$.
Current $I_x$ flows from the 10V source through the $2\Omega$ resistor: $I_x = \frac{10 - V_A}{2}$
The dependent source voltage is $V_d = 4I_x$.
Notice that the dependent source is directly connected between node A and ground. Thus, $V_A = V_d = 4I_x$.
Substitute $I_x$:
$$ V_A = 4 \left( \frac{10 - V_A}{2} \right) = 2(10 - V_A) = 20 - 2V_A $$
$$ 3V_A = 20 \implies V_{OC} = V_A = \frac{20}{3} \text{ V} = 6.67 \text{ V} $$

**Step 2: Find $R_{TH}$ (Thevenin Resistance)**
To find $R_{TH}$, we apply a test current $I_{test}$ at terminal A and turn off the independent source (10V source becomes a short to ground).
Let the test current source be injected at node A. 
With the 10V source shorted, $I_x$ through the $2\Omega$ resistor is now driven by $V_A$: $I_x = \frac{0 - V_A}{2} = -0.5 V_A$
The dependent source voltage is $V_d = 4I_x = 4(-0.5 V_A) = -2 V_A$.
But the dependent source is directly connected across terminals A-B, forcing $V_A = V_d$.
So $V_A = -2 V_A$, which implies $3 V_A = 0 \implies V_A = 0$ V for any arbitrary test current $I_{test}$.
Since $V_A = 0$ for any $I_{test}$, the internal equivalent resistance must be:
$$ R_{TH} = \frac{V_A}{I_{test}} = 0 \ \Omega $$
**Final Answer:** $V_{TH} = 6.67 \text{ V}$, $R_{TH} = 0 \ \Omega$.

#### Example 2: Maximum Power Transfer with Complex Impedances
**Problem:** An AC source $V_s = 100\angle0^\circ$ V (rms) has an internal impedance $Z_s = 4 + j3 \ \Omega$. It is connected to a variable load impedance $Z_L = R_L + jX_L$.
(a) Find $Z_L$ for maximum power transfer.
(b) If only $R_L$ is variable and $X_L$ is fixed at $2 \ \Omega$, find the value of $R_L$ for maximum power transfer.

**Solution:**
**(a) Both $R_L$ and $X_L$ variable:**
According to the Maximum Power Transfer Theorem for complex impedances:
$$ Z_L = Z_s^* = 4 - j3 \ \Omega $$
Maximum power $P_{max} = \frac{|V_s|^2}{4 R_s} = \frac{100^2}{4 \times 4} = \frac{10000}{16} = 625 \text{ W} $$

**(b) Only $R_L$ is variable, $X_L = 2 \ \Omega$:**
The current magnitude is $|I| = \frac{100}{| (4 + R_L) + j(3 + 2) |} = \frac{100}{\sqrt{(4 + R_L)^2 + 25}}$
Power $P = |I|^2 R_L = \frac{10000 R_L}{(4 + R_L)^2 + 25}$
To maximize $P$, set $\frac{dP}{dR_L} = 0$:
$$ (4 + R_L)^2 + 25 - R_L(2(4 + R_L)) = 0 $$
$$ 16 + 8R_L + R_L^2 + 25 - 8R_L - 2R_L^2 = 0 $$
$$ 41 - R_L^2 = 0 \implies R_L = \sqrt{41} \approx 6.4 \ \Omega $$
**Final Answer:** (a) $Z_L = 4 - j3 \ \Omega$, (b) $R_L = \sqrt{41} \ \Omega$.

#### Example 3: Two-Port Network Z-Parameters
**Problem:** The Z-parameters of a two-port network are $Z_{11} = 40\Omega$, $Z_{12} = Z_{21} = 20\Omega$, $Z_{22} = 30\Omega$. A load resistor $R_L = 10\Omega$ is connected across port 2. Find the input impedance $Z_{in}$ looking into port 1.

**Solution:**
The defining equations for Z-parameters are:
1) $V_1 = Z_{11}I_1 + Z_{12}I_2$
2) $V_2 = Z_{21}I_1 + Z_{22}I_2$

At port 2, a load $R_L$ is connected. By standard convention, $I_2$ enters the network, so the load voltage is $V_2 = -I_2 R_L$.
Substitute $V_2$ into equation (2):
$$ -I_2 R_L = Z_{21}I_1 + Z_{22}I_2 $$
$$ -I_2 (R_L + Z_{22}) = Z_{21}I_1 \implies I_2 = -\frac{Z_{21}}{Z_{22} + R_L} I_1 $$
Substitute $I_2$ into equation (1):
$$ V_1 = Z_{11}I_1 + Z_{12} \left( -\frac{Z_{21}}{Z_{22} + R_L} I_1 \right) $$
$$ Z_{in} = \frac{V_1}{I_1} = Z_{11} - \frac{Z_{12}Z_{21}}{Z_{22} + R_L} $$
Plugging in the given values:
$$ Z_{in} = 40 - \frac{20 \times 20}{30 + 10} = 40 - \frac{400}{40} = 40 - 10 = 30 \ \Omega $$
**Final Answer:** $Z_{in} = 30 \ \Omega$.

#### Example 4: Transient Analysis with Laplace Transforms
**Problem:** A series RLC circuit with $R = 2 \ \Omega$, $L = 1 \text{ H}$, and $C = 0.5 \text{ F}$ is connected to a DC voltage source $V_0 = 10 \text{ V}$ through a switch that closes at $t=0$. Initial conditions are zero. Find the current $i(t)$ for $t > 0$.

**Solution:**
Using KVL in the time domain:
$$ L \frac{di}{dt} + Ri + \frac{1}{C} \int_{0}^{t} i(\tau) d\tau = 10 $$
Applying Laplace transform, assuming zero initial conditions:
$$ sL I(s) + R I(s) + \frac{1}{sC} I(s) = \frac{10}{s} $$
$$ I(s) \left[ s(1) + 2 + \frac{2}{s} \right] = \frac{10}{s} $$
Multiply through by $s$:
$$ I(s) [s^2 + 2s + 2] = 10 $$
$$ I(s) = \frac{10}{s^2 + 2s + 2} = \frac{10}{(s+1)^2 + 1} $$
This matches the standard form $\frac{\omega}{(s+\alpha)^2 + \omega^2}$, where $\alpha = 1$, $\omega = 1$.
Taking the Inverse Laplace Transform:
$$ i(t) = 10 e^{-t} \sin(t) u(t) \text{ A} $$
**Final Answer:** $i(t) = 10 e^{-t} \sin(t) \text{ A}$.

#### Example 5: Millman's Theorem Application
**Problem:** Three voltage sources $V_1 = 10\text{V}$, $V_2 = 20\text{V}$, $V_3 = 30\text{V}$ with internal resistances $R_1 = 1\Omega$, $R_2 = 2\Omega$, $R_3 = 3\Omega$ respectively, are connected in parallel to supply a load resistor $R_L = 5\Omega$. Calculate the exact voltage across the load resistor.

**Solution:**
According to Millman's Theorem, parallel voltage branches can be reduced to a single equivalent voltage source $V_{eq}$ in series with $R_{eq}$.
$$ V_{eq} = \frac{V_1 G_1 + V_2 G_2 + V_3 G_3}{G_1 + G_2 + G_3} \quad \text{and} \quad R_{eq} = \frac{1}{G_1 + G_2 + G_3} $$
Where $G_i = \frac{1}{R_i}$:
$$ G_1 = 1 \text{ S}, \quad G_2 = 0.5 \text{ S}, \quad G_3 = \frac{1}{3} \text{ S} $$
$$ \sum G = 1 + 0.5 + \frac{1}{3} = \frac{11}{6} \text{ S} $$
Calculate $V_{eq}$:
$$ V_{eq} = \frac{10(1) + 20(0.5) + 30(1/3)}{11/6} = \frac{10 + 10 + 10}{11/6} = \frac{30 \times 6}{11} = \frac{180}{11} \text{ V} $$
Calculate $R_{eq}$:
$$ R_{eq} = \frac{6}{11} \ \Omega $$
Now, connect $R_L = 5 \ \Omega$ across this equivalent source using a simple voltage divider:
$$ V_L = V_{eq} \left( \frac{R_L}{R_{eq} + R_L} \right) = \left(\frac{180}{11}\right) \frac{5}{\frac{6}{11} + 5} = \left(\frac{180}{11}\right) \frac{5}{\frac{61}{11}} = \frac{900}{61} \text{ V} $$
**Final Answer:** The voltage across the load is $\frac{900}{61} \text{ V}$ (approximately $14.75 \text{ V}$).

---

### 4. GATE-Level Practice Problems

**Problem 1 (Superposition & Power):**
In a linear resistive circuit, when only a $10\text{V}$ voltage source is active, the power dissipated in a $5\Omega$ load resistor is $20\text{W}$. When only a $2\text{A}$ current source is active, the power dissipated in the same load is $5\text{W}$. If both sources are active simultaneously, calculate the two possible values of the total power dissipated in the $5\Omega$ load.

**Problem 2 (Network Topology & Graph Theory):**
A fully connected network graph consists of $12$ branches and $7$ nodes. Calculate:
1. The number of fundamental cut-sets.
2. The number of fundamental loops (tie-sets).

**Problem 3 (Advanced Transient Analysis):**
A parallel $RLC$ circuit with $R = 10\Omega$, $L = 0.1\text{H}$, and $C = 1\text{mF}$ is driven by a unit step current source $i_s(t) = u(t)\text{ A}$. Determine the damping ratio $\zeta$ and the undamped natural frequency $\omega_n$, and mathematically classify the system's transient response.

**Problem 4 (Two-Port Networks & Lattice Structures):**
For a symmetric two-port lattice network with series arm impedances $Z_a$ and diagonal cross-arm impedances $Z_b$, derive the Transmission ($ABCD$) parameters entirely in terms of $Z_a$ and $Z_b$. Conclude your derivation by proving that the network is reciprocal (i.e., $AD - BC = 1$).

**Problem 5 (Constrained Maximum Power Transfer):**
A Thevenin equivalent circuit comprises an AC voltage source $V_{TH} = 50\angle 30^\circ\text{ V}$ in series with $Z_{TH} = 8 - j6 \ \Omega$. A load $Z_L = R_L + jX_L$ is connected across the terminals. Due to strict design constraints, the load reactance is physically fixed at $X_L = 2 \ \Omega$. Determine the maximum real power that can be transferred to the load under this constraint, and the corresponding required value of $R_L$.