# EE1011: Basic Electrical Engineering
## Comprehensive Lecture Notes: Fundamental Circuit Theory & Network Analysis

---

### 1. Introduction to Electrical Circuits

Electrical circuit theory is the fundamental discipline underpinning all of electrical engineering, electronics, and power systems. At its core, circuit theory abstracts complex physical phenomena—governed by Maxwell's equations—into simplified lumped-parameter models that are rigorously solvable using algebraic and differential equations. This chapter establishes the foundational principles of DC circuit analysis, acting as a definitive reference for academic study and GATE preparation.

---

### 2. Deep Theoretical Foundations

#### 2.1 Fundamental Quantities
*   **Charge ($q$):** The fundamental electrical property of matter, measured in Coulombs (C). The charge of an electron is $e = -1.602 \times 10^{-19}$ C.
*   **Current ($i$):** The time rate of flow of charge.
    $$i = \frac{dq}{dt} \text{ (Amperes, A)}$$
*   **Voltage ($v$):** The energy required to move a unit charge through an element. It is the electromotive force (EMF) or potential difference.
    $$v = \frac{dw}{dq} \text{ (Volts, V)}$$
*   **Power ($p$):** The time rate of expending or absorbing energy.
    $$p = \frac{dw}{dt} = \left(\frac{dw}{dq}\right)\left(\frac{dq}{dt}\right) = vi \text{ (Watts, W)}$$
    *Passive Sign Convention:* Power is positive (absorbed) when current enters the positive terminal of an element. Power is negative (supplied) when current enters the negative terminal.

#### 2.2 Ohm's Law and Resistance
Discovered by Georg Simon Ohm in 1827, Ohm's law states that the voltage across a conducting material is directly proportional to the current flowing through it, provided the temperature remains constant.
$$v = iR$$
Where $R$ is the resistance in Ohms ($\Omega$). Resistance is physically defined by the material and geometry of the conductor:
$$R = \rho \frac{l}{A}$$
where $\rho$ is resistivity, $l$ is length, and $A$ is the cross-sectional area. The reciprocal of resistance is Conductance ($G$), measured in Siemens (S): $G = 1/R$.

#### 2.3 Kirchhoff's Laws
Gustav Kirchhoff formalized two fundamental laws in 1845 based on the principles of conservation of charge and energy.

**Kirchhoff’s Current Law (KCL):** Based on the conservation of charge, the algebraic sum of currents entering a node is zero.
$$\sum_{k=1}^{N} i_k = 0$$
*Derivation:* The total charge at a node cannot accumulate indefinitely. Thus, $\frac{d}{dt}\sum q_k = 0 \implies \sum i_k = 0$.

**Kirchhoff’s Voltage Law (KVL):** Based on the conservation of energy, the algebraic sum of all voltages around any closed loop in a circuit is zero.
$$\sum_{k=1}^{M} v_k = 0$$
*Derivation:* The work done in moving a unit charge around a closed path in a conservative electrostatic field is zero: $\oint \mathbf{E} \cdot d\mathbf{l} = 0$. In lumped circuits, this translates directly to KVL.

#### 2.4 Network Theorems
1.  **Superposition Theorem:** In a linear circuit with multiple independent sources, the response (voltage or current) in any branch is the algebraic sum of the responses caused by each independent source acting alone, with all other independent sources turned off (voltage sources shorted, $v=0$; current sources opened, $i=0$).
2.  **Thevenin's Theorem:** Any linear two-terminal circuit can be replaced by an equivalent circuit consisting of a single voltage source $V_{th}$ in series with a resistor $R_{th}$.
    *   $V_{th}$ is the open-circuit voltage at the terminals.
    *   $R_{th}$ is the equivalent resistance at the terminals when all independent sources are turned off.
3.  **Norton's Theorem:** Any linear two-terminal circuit can be replaced by an equivalent circuit consisting of a current source $I_N$ in parallel with a resistor $R_N$ (where $I_N = V_{th}/R_{th}$ and $R_N = R_{th}$).
4.  **Maximum Power Transfer Theorem:** Maximum power is delivered to a load resistance $R_L$ when $R_L$ equals the Thevenin resistance $R_{th}$ of the source network.
    *Derivation:* Power to load $P = i^2 R_L = \left(\frac{V_{th}}{R_{th} + R_L}\right)^2 R_L$.
    To find the maximum, set $\frac{dP}{dR_L} = 0$:
    $$\frac{d}{dR_L} \left[ V_{th}^2 R_L (R_{th} + R_L)^{-2} \right] = V_{th}^2 \left[ (R_{th} + R_L)^{-2} - 2R_L(R_{th} + R_L)^{-3} \right] = 0$$
    $$R_{th} + R_L - 2R_L = 0 \implies R_L = R_{th}$$
    The maximum power delivered is $P_{max} = \frac{V_{th}^2}{4R_{th}}$.

---

### 3. Real-World Engineering Applications

1.  **Power Grid Fault Analysis:** Thevenin’s equivalent circuits are extensively used by power systems engineers to model the entire interconnected regional power grid at a specific bus to calculate the maximum fault current during a short circuit. This dictates the sizing of circuit breakers.
2.  **Analog Sensor Interfaces:** Wheatstone bridges (an application of KVL/KCL) are ubiquitous in industrial instrumentation to interface strain gauges, RTDs (Resistance Temperature Detectors), and pressure transducers, allowing the measurement of minute resistance changes with high precision.
3.  **Impedance Matching in Telecommunications:** The Maximum Power Transfer theorem is the foundation for impedance matching in RF antennas, audio amplifiers, and transmission lines. Matching the load impedance to the source prevents signal reflection and ensures optimal power delivery.
4.  **Integrated Circuit Biasing:** Nodal and mesh analyses are the algorithmic foundations for SPICE (Simulation Program with Integrated Circuit Emphasis). Biasing networks for transistors in VLSI design rely strictly on KCL and KVL to maintain active region operation despite temperature fluctuations.

---

### 4. Advanced GATE-Level Solved Examples

**Example 1: Nodal Analysis with a Dependent Source**
*Problem:* Find the voltage $V_x$ in a circuit containing three nodes (Node 0 as reference). Node 1 is connected to a 10V independent voltage source. A resistor of $2\Omega$ connects Node 1 and Node 2. A dependent current source of value $2V_x$ feeds into Node 2 from the reference node. A $4\Omega$ resistor connects Node 2 to the reference node. $V_x$ is defined as the voltage across the $4\Omega$ resistor.
*Solution:*
1.  Identify nodes: Node 1 voltage $V_1 = 10V$. Node 2 voltage $V_2 = V_x$.
2.  Apply KCL at Node 2: The currents leaving the node must equal the currents entering.
    Current leaving through $2\Omega$ resistor: $\frac{V_2 - V_1}{2} = \frac{V_x - 10}{2}$
    Current leaving through $4\Omega$ resistor: $\frac{V_2 - 0}{4} = \frac{V_x}{4}$
    Current entering from dependent source: $2V_x$
3.  Form the KCL equation:
    $$\frac{V_x - 10}{2} + \frac{V_x}{4} = 2V_x$$
4.  Multiply by 4 to clear denominators:
    $$2(V_x - 10) + V_x = 8V_x$$
    $$2V_x - 20 + V_x = 8V_x$$
    $$3V_x - 20 = 8V_x \implies 5V_x = -20 \implies V_x = -4V$$
*Answer:* $V_x = -4V$.

**Example 2: Thevenin Equivalent with Dependent Sources**
*Problem:* Determine the Thevenin resistance ($R_{th}$) of a two-terminal network (terminals A-B). The circuit contains a $5\Omega$ resistor in series with a dependent voltage source $3i_x$, where $i_x$ is the current flowing through a parallel $10\Omega$ resistor connected across the source and the $5\Omega$ resistor.
*Solution:*
Since there are no independent sources, $V_{th} = 0$. To find $R_{th}$, we must apply an external test source (e.g., $V_{test} = 1V$) at terminals A-B and find the current $I_{test}$ entering terminal A. Thus, $R_{th} = V_{test} / I_{test}$.
1.  Assume a test voltage $V_{test} = 1V$ is applied across terminals A-B.
2.  By observation of the parallel structure, the voltage across the $10\Omega$ resistor is $V_{test}$.
    Thus, $i_x = \frac{V_{test}}{10} = \frac{1}{10} = 0.1A$ (assuming $i_x$ flows downwards).
3.  The dependent voltage source value is $3i_x = 3(0.1) = 0.3V$.
4.  Apply KCL at the top node (Terminal A):
    $I_{test}$ enters. Currents leave through the $10\Omega$ branch and the branch with the $5\Omega$ resistor and dependent source.
    $$I_{test} = i_x + \frac{V_{test} - 3i_x}{5}$$
    $$I_{test} = 0.1 + \frac{1 - 0.3}{5} = 0.1 + \frac{0.7}{5} = 0.1 + 0.14 = 0.24A$$
5.  Calculate $R_{th}$:
    $$R_{th} = \frac{V_{test}}{I_{test}} = \frac{1}{0.24} = \frac{100}{24} = 4.167\Omega$$
*Answer:* $R_{th} = 4.167\Omega$.

**Example 3: Maximum Power Transfer**
*Problem:* A linear circuit has a Thevenin voltage of $V_{th} = 20V$ and a Thevenin resistance of $R_{th} = 4\Omega$. A variable load resistor $R_L$ is connected across its terminals. If $R_L$ can only vary between $5\Omega$ and $10\Omega$, what value of $R_L$ will absorb the maximum power, and what is that power?
*Solution:*
1.  The unconstrained maximum power transfer occurs when $R_L = R_{th} = 4\Omega$.
2.  However, the allowed range is $5\Omega \le R_L \le 10\Omega$. The power transfer curve $P(R_L)$ monotonically decreases as $R_L$ moves away from $R_{th}$.
3.  To maximize power within the constrained range, we must choose the value of $R_L$ closest to $R_{th}$. Thus, $R_L = 5\Omega$.
4.  Calculate the power at $R_L = 5\Omega$:
    $$P = \left( \frac{V_{th}}{R_{th} + R_L} \right)^2 R_L = \left( \frac{20}{4 + 5} \right)^2 \times 5 = \left( \frac{20}{9} \right)^2 \times 5 = \frac{400}{81} \times 5 = \frac{2000}{81} \approx 24.69W$$
*Answer:* $R_L = 5\Omega$, Power $\approx 24.69W$.

**Example 4: Superposition with Current and Voltage Sources**
*Problem:* In a circuit with a $12V$ voltage source, a $3A$ current source, and a $2\Omega$ resistor, the voltage source and current source are in parallel, and this combination is in series with the $2\Omega$ resistor which connects to a load $R_{L} = 4\Omega$. Find the current through $R_L$ using superposition.
*Solution:*
Wait, if a voltage source and current source are in parallel, the voltage across them is fixed by the voltage source. The current source acts as a redundant element with respect to the rest of the circuit. Let's prove this mathematically using superposition.
Let $I_L$ be the current through $R_L$. $R_{total} = 2\Omega + 4\Omega = 6\Omega$.
1.  **Turn off the 3A current source:** (Replace it with an open circuit).
    The circuit is simply the $12V$ source in series with the $6\Omega$ equivalent resistance.
    $I_{L1} = \frac{12V}{6\Omega} = 2A$.
2.  **Turn off the 12V voltage source:** (Replace it with a short circuit).
    The $3A$ current source is now in parallel with a short circuit. All $3A$ will flow through the short circuit (the path of zero resistance), and $0A$ will flow through the $2\Omega$ and $4\Omega$ resistors.
    $I_{L2} = 0A$.
3.  **Total response:**
    $I_L = I_{L1} + I_{L2} = 2A + 0A = 2A$.
*Answer:* The current through the load is $2A$. (This highlights a classic GATE trap: sources in parallel with ideal voltage sources or in series with ideal current sources).

**Example 5: Wheatstone Bridge Sensitivity (GATE Objective)**
*Problem:* An unbalanced Wheatstone bridge has arms $R_1 = 10\Omega$, $R_2 = 20\Omega$, $R_3 = 30\Omega$, and $R_4 = 40\Omega$ connected in a loop. A voltage source $V_s = 50V$ is applied across the node between $R_1$ and $R_3$, and the node between $R_2$ and $R_4$. Find the Thevenin voltage $V_{th}$ across the galvanometer nodes (between $R_1, R_2$ and $R_3, R_4$).
*Solution:*
Let the source nodes be A (top, between $R_1, R_3$) and B (bottom, between $R_2, R_4$). $V_A - V_B = 50V$. Let $V_B = 0V$, so $V_A = 50V$.
The galvanometer is connected between node C (between $R_1, R_2$) and node D (between $R_3, R_4$).
1.  Calculate voltage at node C ($V_C$): $R_1$ and $R_2$ form a voltage divider across the 50V source.
    $$V_C = 50 \times \frac{R_2}{R_1 + R_2} = 50 \times \frac{20}{10 + 20} = 50 \times \frac{20}{30} = 33.33V$$
2.  Calculate voltage at node D ($V_D$): $R_3$ and $R_4$ form a second voltage divider.
    $$V_D = 50 \times \frac{R_4}{R_3 + R_4} = 50 \times \frac{40}{30 + 40} = 50 \times \frac{40}{70} = 28.57V$$
3.  Calculate Thevenin voltage ($V_{th}$):
    $$V_{th} = V_C - V_D = 33.33V - 28.57V = 4.76V$$
*Answer:* The open-circuit voltage across the galvanometer terminals is $4.76V$.

---

### 5. Practice Problems for GATE Preparation

1.  **Nodal Analysis:** A circuit consists of a 5A current source connected to Node A, a 2$\Omega$ resistor between Node A and reference, a 4$\Omega$ resistor between Node A and Node B, and a dependent current source of $0.5V_a$ (where $V_a$ is the voltage at Node A) connected from Node B to reference. Determine the voltages at Nodes A and B.
2.  **Superposition:** A linear resistive network contains two independent voltage sources, $V_1$ and $V_2$. When $V_1 = 10V$ and $V_2 = 0V$, the power dissipated in a specific resistor $R$ is 4W. When $V_1 = 0V$ and $V_2 = 5V$, the power dissipated in the same resistor $R$ is 9W. What is the power dissipated in $R$ when both $V_1 = 10V$ and $V_2 = 5V$ are acting simultaneously? *(Hint: Superposition applies to voltage and current, not power. Watch the polarities!)*
3.  **Thevenin/Norton:** Given a complex bridge network with a non-linear load element $I_L = 0.5 V_L^2$. The linear portion of the network is evaluated to have $V_{th} = 12V$ and $R_{th} = 2\Omega$. Calculate the operating voltage $V_L$ of the non-linear load.
4.  **Circuit Topologies:** For a fully connected planar graph representing an electrical circuit with $N$ nodes and $B$ branches, prove that the number of independent KVL equations (fundamental loops) is $B - N + 1$.
5.  **Dependent Sources & Power:** In a single-loop circuit, a $10V$ independent source is in series with a $5\Omega$ resistor and a dependent voltage source of $2I$, where $I$ is the loop current. Determine if the dependent source is absorbing or supplying power, and calculate its magnitude.