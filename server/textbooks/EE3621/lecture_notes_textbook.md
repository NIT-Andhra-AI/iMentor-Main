# EE3621 Lecture Notes: Advanced Power Electronics – Switch-Mode DC-DC Converters

## 1. Introduction and Objectives
The study of Switch-Mode Power Supplies (SMPS) forms the backbone of modern power electronics. Unlike linear regulators, which dissipate excess power as heat, switch-mode DC-DC converters (choppers) use semiconductor devices operating fully on (saturation) or fully off (cutoff) to regulate voltage. This chapter provides a rigorous theoretical foundation for analyzing these converters in Continuous Conduction Mode (CCM) and Discontinuous Conduction Mode (DCM), specifically tailored for advanced engineering coursework and GATE (Graduate Aptitude Test in Engineering) preparation.

## 2. Theoretical Foundations and Derivations

The analysis of any DC-DC converter in steady-state relies on two fundamental principles of network theory:
1.  **Inductor Volt-Second Balance**: In steady-state, the net change in inductor current over one switching period $T$ is zero. Therefore, the average voltage across an inductor is zero:
    $$ \langle v_L \rangle = \frac{1}{T} \int_{0}^{T} v_L(t) dt = 0 $$
2.  **Capacitor Charge Balance (Amp-Second Balance)**: In steady-state, the net change in capacitor voltage over one period is zero. Therefore, the average current through a capacitor is zero:
    $$ \langle i_C \rangle = \frac{1}{T} \int_{0}^{T} i_C(t) dt = 0 $$

### 2.1 The Buck Converter (Step-Down)
The buck converter reduces the input DC voltage to a lower output DC voltage. 

**Steady-State Analysis (CCM):**
Let $D$ be the duty cycle ($0 \le D \le 1$), and $T$ be the switching period.
*   **Mode 1: Switch ON ($0 < t \le DT$)**
    The diode is reverse-biased. The inductor voltage is $v_L = V_s - V_o$.
    The rate of change of current is:
    $$ \frac{di_L}{dt} = \frac{V_s - V_o}{L} \implies \Delta I_L = \left(\frac{V_s - V_o}{L}\right) DT $$
*   **Mode 2: Switch OFF ($DT < t \le T$)**
    The diode is forward-biased (freewheeling). The inductor voltage is $v_L = -V_o$.
    $$ \frac{di_L}{dt} = \frac{-V_o}{L} \implies \Delta I_L = \left(\frac{V_o}{L}\right) (1-D)T $$

Applying volt-second balance:
$$ (V_s - V_o)DT + (-V_o)(1-D)T = 0 \implies V_o = D V_s $$

**Output Voltage Ripple ($\Delta V_o$):**
The ripple current $\Delta I_L$ charges and discharges the output capacitor. The charge $\Delta Q$ is the area of the triangle of the capacitor current waveform above zero.
$$ \Delta Q = \frac{1}{2} \times \frac{T}{2} \times \frac{\Delta I_L}{2} = \frac{T \Delta I_L}{8} $$
$$ \Delta V_o = \frac{\Delta Q}{C} = \frac{\Delta I_L}{8fC} = \frac{V_o (1-D)}{8 L C f^2} $$

### 2.2 The Boost Converter (Step-Up)
The boost converter increases the input DC voltage.

**Steady-State Analysis (CCM):**
*   **Mode 1: Switch ON ($0 < t \le DT$)**
    The inductor is connected across the source. $v_L = V_s$.
    $$ \Delta I_L = \frac{V_s}{L} DT $$
*   **Mode 2: Switch OFF ($DT < t \le T$)**
    The inductor discharges into the load. $v_L = V_s - V_o$.
    $$ \Delta I_L = \frac{V_o - V_s}{L} (1-D)T $$

Applying volt-second balance:
$$ V_s DT + (V_s - V_o)(1-D)T = 0 \implies V_s - V_o(1-D) = 0 \implies V_o = \frac{V_s}{1-D} $$

### 2.3 The Buck-Boost Converter
Provides an output voltage that can be higher or lower than the input, with inverted polarity.

**Steady-State Analysis (CCM):**
*   **Mode 1 (ON):** $v_L = V_s$ $\implies \Delta I_L = \frac{V_s}{L} DT$
*   **Mode 2 (OFF):** $v_L = -V_o$ $\implies \Delta I_L = \frac{V_o}{L} (1-D)T$ (assuming $V_o$ is the magnitude of the inverted voltage).

Volt-second balance:
$$ V_s DT - V_o(1-D)T = 0 \implies V_o = V_s \left( \frac{D}{1-D} \right) $$

## 3. Real-World Engineering Applications

1.  **Electric Vehicle (EV) Powertrains**: Boost converters are critical in EVs to step up the nominal battery voltage (e.g., 400V) to the high-voltage DC bus (e.g., 800V) required by the traction inverter, allowing for thinner cables and lower $I^2R$ losses.
2.  **Solar Maximum Power Point Tracking (MPPT)**: Buck-boost or SEPIC converters are used to dynamically match the apparent input impedance of the converter to the optimal power point impedance of the photovoltaic array. Because $R_{in} = R_{load} \frac{(1-D)^2}{D^2}$, varying $D$ tracks the maximum power regardless of insolation changes.
3.  **Telecommunications Power Systems**: Standard -48V DC telecom buses use isolated buck-derived topologies (like Forward or Half-Bridge converters) to provide precisely regulated, low-noise power to sensitive routing equipment.

---

## 4. GATE-Level Solved Examples

### Example 1: Boundary of CCM and DCM (Buck Converter)
**Problem:** A buck converter operates from a $24\text{ V}$ input and provides a $12\text{ V}$ output to a $10\ \Omega$ resistive load. The switching frequency is $20\text{ kHz}$. Determine the critical inductance ($L_{crit}$) required to keep the converter at the boundary of continuous and discontinuous conduction modes.

**Solution:**
1. Calculate Duty Cycle ($D$):
   $D = \frac{V_o}{V_s} = \frac{12}{24} = 0.5$
2. Calculate average inductor current ($I_L$):
   In a buck converter, average inductor current equals load current.
   $I_L = I_o = \frac{V_o}{R} = \frac{12}{10} = 1.2\text{ A}$
3. At the boundary of CCM/DCM, the ripple current $\Delta I_L$ is twice the average current:
   $\Delta I_L = 2 I_L = 2.4\text{ A}$
4. Use the ON-state ripple equation to find $L_{crit}$:
   $\Delta I_L = \frac{V_s - V_o}{L_{crit}} DT \implies 2.4 = \frac{24 - 12}{L_{crit}} \times 0.5 \times \frac{1}{20 \times 10^3}$
   $L_{crit} = \frac{12 \times 0.5}{2.4 \times 20 \times 10^3} = \frac{6}{48000} = 125\ \mu\text{H}$
**Answer:** $125\ \mu\text{H}$

### Example 2: Non-Ideal Boost Converter Voltage Gain Limit
**Problem:** A boost converter has a practical inductor with an Equivalent Series Resistance (ESR) of $r_L$. The load is a resistor $R$. Derive the expression for the voltage gain $\frac{V_o}{V_s}$ and find the duty cycle $D$ at which the maximum output voltage occurs.

**Solution:**
1. Applying volt-second balance including the voltage drop across $r_L$:
   $V_s - I_L r_L = (1-D)V_o$
2. Applying power balance (assuming ideal switch and diode):
   $P_{in} = P_{out} + P_{loss} \implies V_s I_L = \frac{V_o^2}{R} + I_L^2 r_L$
   By relating $I_o = (1-D)I_L \implies I_L = \frac{V_o}{R(1-D)}$
3. Substitute $I_L$ into the volt-second equation:
   $V_s - \left[ \frac{V_o}{R(1-D)} \right] r_L = (1-D)V_o$
   $V_s = V_o \left[ (1-D) + \frac{r_L}{R(1-D)} \right] \implies \frac{V_o}{V_s} = \frac{1-D}{(1-D)^2 + \frac{r_L}{R}}$
4. To find maximum gain, differentiate with respect to $(1-D)$ and set to zero:
   Let $x = 1-D$. Gain $G(x) = \frac{x}{x^2 + k}$ where $k = \frac{r_L}{R}$.
   $\frac{dG}{dx} = \frac{(x^2+k) \cdot 1 - x(2x)}{(x^2+k)^2} = 0 \implies k - x^2 = 0 \implies x = \sqrt{\frac{r_L}{R}}$
5. Therefore, maximum voltage occurs when:
   $1-D = \sqrt{\frac{r_L}{R}} \implies D_{max} = 1 - \sqrt{\frac{r_L}{R}}$
**Answer:** $\frac{V_o}{V_s} = \frac{1-D}{(1-D)^2 + \frac{r_L}{R}}$; $D_{max} = 1 - \sqrt{\frac{r_L}{R}}$

### Example 3: Boost Converter Output Capacitor Ripple
**Problem:** A boost converter has $V_s = 10\text{ V}$, $V_o = 30\text{ V}$, $R = 50\ \Omega$, $f = 100\text{ kHz}$. Determine the minimum value of capacitance $C$ required to limit the output voltage ripple to $1\%$.

**Solution:**
1. Duty Cycle: $V_o = \frac{V_s}{1-D} \implies 30 = \frac{10}{1-D} \implies 1-D = 0.333 \implies D = 0.667$
2. Ripple Voltage limit: $\Delta V_o = 0.01 \times 30 = 0.3\text{ V}$.
3. In a boost converter, during the ON time ($DT$), the load is supplied entirely by the capacitor. 
   Charge lost by capacitor: $\Delta Q = I_o \times DT = \left(\frac{V_o}{R}\right) DT$
4. Output voltage ripple: $\Delta V_o = \frac{\Delta Q}{C} = \frac{V_o D}{R f C}$
5. Rearranging for $C$:
   $C = \frac{V_o D}{R f \Delta V_o} = \frac{30 \times 0.667}{50 \times 100 \times 10^3 \times 0.3} = \frac{20}{1500 \times 10^3} = 13.33\ \mu\text{F}$
**Answer:** $13.33\ \mu\text{F}$

### Example 4: Buck-Boost Inductor Current Profile
**Problem:** An ideal buck-boost converter is operating at $D = 0.4$, $V_s = 50\text{ V}$, $f = 50\text{ kHz}$, $L = 1\text{ mH}$, and $R = 20\ \Omega$. Determine the peak-to-peak inductor current ripple and the maximum inductor current.

**Solution:**
1. Calculate output voltage magnitude:
   $V_o = V_s \frac{D}{1-D} = 50 \frac{0.4}{0.6} = 33.33\text{ V}$
2. Average load current:
   $I_o = \frac{V_o}{R} = \frac{33.33}{20} = 1.667\text{ A}$
3. Average inductor current:
   For a buck-boost, $I_L = I_s + I_o$. Since $P_{in} = P_{out}$, $V_s I_s = V_o I_o \implies I_s = \frac{V_o}{V_s} I_o = \frac{D}{1-D} I_o$.
   $I_L = \frac{I_o}{1-D} = \frac{1.667}{0.6} = 2.778\text{ A}$
4. Peak-to-peak ripple current:
   $\Delta I_L = \frac{V_s}{L} DT = \frac{50}{10^{-3}} \times 0.4 \times \frac{1}{50 \times 10^3} = 50000 \times 0.4 \times 20 \times 10^{-6} = 0.4\text{ A}$
5. Maximum inductor current:
   $I_{max} = I_L + \frac{\Delta I_L}{2} = 2.778 + 0.2 = 2.978\text{ A}$
**Answer:** Ripple = $0.4\text{ A}$, $I_{max} = 2.978\text{ A}$

### Example 5: Discontinuous Conduction Mode (Buck)
**Problem:** A buck converter operates with $V_s = 20\text{ V}$, $L = 50\ \mu\text{H}$, $f = 100\text{ kHz}$, $D = 0.25$. The load resistance is increased to $200\ \Omega$. Calculate the new output voltage in steady state.

**Solution:**
1. Check for CCM/DCM. 
   Critical resistance $R_{crit} = \frac{2L f}{1-D} = \frac{2 \times 50 \times 10^{-6} \times 10^5}{1 - 0.25} = \frac{10}{0.75} = 13.33\ \Omega$.
   Since $R = 200\ \Omega > R_{crit}$, the converter operates heavily in DCM.
2. In DCM, the voltage gain of a buck converter is load-dependent.
   Let $D_1$ be the diode conduction duty cycle. Volt-second balance:
   $(V_s - V_o)D T = V_o D_1 T \implies D_1 = \frac{V_s - V_o}{V_o} D$
3. Average output current:
   The inductor current is a triangle of base $(D+D_1)T$ and height $I_{pk} = \frac{V_s - V_o}{L}DT$.
   The average current delivered to the output node over the period is equal to the load current:
   $I_o = \frac{1}{2} I_{pk} (D+D_1) = \frac{V_o}{R}$
4. Substitute $D_1$ and $I_{pk}$:
   $\frac{1}{2} \left( \frac{V_s - V_o}{L} DT \right) \left( D + \frac{V_s - V_o}{V_o} D \right) = \frac{V_o}{R}$
   $\frac{1}{2} \left( \frac{V_s - V_o}{L} DT \right) \left( \frac{V_s}{V_o} D \right) = \frac{V_o}{R}$
   Rearranging yields a quadratic in $V_o$, simplified via the parameter $K = \frac{2L}{RT}$:
   $K = \frac{2 \times 50 \times 10^{-6}}{200 \times 10^{-5}} = 0.05$
   $V_o = \frac{2 V_s}{1 + \sqrt{1 + \frac{4K}{D^2}}} = \frac{2 \times 20}{1 + \sqrt{1 + \frac{4(0.05)}{0.0625}}} = \frac{40}{1 + \sqrt{1 + 3.2}} = \frac{40}{1 + \sqrt{4.2}} = \frac{40}{1 + 2.049} = 13.12\text{ V}$
*(Note: If it were in CCM, $V_o$ would have been $0.25 \times 20 = 5\text{ V}$. Because it is in DCM with a light load, the output voltage balloons up to 13.12V).*
**Answer:** $13.12\text{ V}$

---

## 5. Practice Problems

**P1.** A boost converter is required to have an output voltage of $48\text{ V}$ from a $12\text{ V}$ battery. If the inductor is $100\ \mu\text{H}$ and switching frequency is $50\text{ kHz}$, calculate the critical load resistance $R_{crit}$ below which the converter enters DCM. 
*(Hint: In a boost converter, $R_{crit} = \frac{2L f}{D(1-D)^2}$)*

**P2.** A buck converter supplies $5\text{ V}$ at $10\text{ A}$ from a $12\text{ V}$ source. The switching frequency is $200\text{ kHz}$. Calculate the minimum value of $L$ such that the peak inductor current does not exceed $12\text{ A}$.

**P3.** In a Cuk converter operating in steady-state CCM, derive the relationship between output voltage $V_o$ and input voltage $V_s$. Prove that it offers the same voltage magnitude transformation ratio as the buck-boost converter but with continuous input and output currents.

**P4.** An ideal buck-boost converter is supplied with $100\text{ V}$ and drives a $10\ \Omega$ load. If the duty ratio is $0.6$, calculate the RMS current passing through the active switch (transistor) assuming the inductor is infinitely large (ripple-free current).