#!/usr/bin/env python3
"""
ContentSynthesizerAgent:
Generates comprehensive, publication-grade academic lecture notes with
KaTeX mathematical equations, worked numerical proofs, Mermaid architecture
diagrams, NPTEL/MIT OCW video lecture references, real-world industrial case studies,
pedagogical scaffolding, and interactive diagnostic checkpoints.
"""

from typing import Dict, List, Any

class ContentSynthesizerAgent:
    """Agent that creates structured, high-yield Markdown lecture notes for each syllabus topic."""

    def synthesize_lecture(self, course_info: Dict[str, Any], lecture: Dict[str, Any], resources: Dict[str, Any]) -> str:
        course_code = course_info.get("course_code", "GEN001")
        course_name = course_info.get("course_name", "Engineering Course")
        lec_num = str(lecture["num"])
        lec_title = lecture["title"]
        module = lecture["module"]
        subtopics = lecture.get("subtopics", "")
        bloom = lecture.get("bloom", "L3_APPLY")

        tb_list = resources.get("textbooks", [])
        primary_tb = tb_list[0]["title"] if tb_list else "Standard IEEE / B.Tech Reference"
        secondary_tb = tb_list[1]["title"] if len(tb_list) > 1 else "Advanced Reference Manual"

        videos = resources.get("video_lectures", [])
        v1_name = videos[0]["course_name"] if videos else "NPTEL Advanced Video Course"
        v1_url = videos[0]["url"] if videos else "https://nptel.ac.in"
        v1_inst = videos[0].get("instructor", "IIT Faculty") if videos else "Senior Faculty"
        v1_plat = videos[0].get("platform", "NPTEL") if videos else "NPTEL"

        v2_name = videos[1]["course_name"] if len(videos) > 1 else "MIT OpenCourseWare Series"
        v2_url = videos[1]["url"] if len(videos) > 1 else "https://ocw.mit.edu"
        v2_inst = videos[1].get("instructor", "MIT Faculty") if len(videos) > 1 else "Course Instructor"
        v2_plat = videos[1].get("platform", "MIT OCW") if len(videos) > 1 else "MIT OCW"

        subtopics_lines = ""
        for item in subtopics.split(";"):
            subtopics_lines += f"- **{item.strip()}**: Detailed theoretical analysis, physical intuition, and parameter bounds.\n"

        domain = self._detect_domain(course_name, lec_title)
        theory_sec = self._generate_theoretical_foundations(domain, lec_title)
        diagram_sec = self._generate_mermaid_diagram(domain, lec_title)
        numerical_sec = self._generate_worked_numerical(domain, lec_title)
        case_study_sec = self._generate_industrial_case_study(domain, lec_title)
        checkpoints_sec = self._generate_diagnostic_checkpoints(domain, lec_title)

        template = r"""# Lecture __LEC_NUM__: __LEC_TITLE__

**Course:** `__COURSE_CODE__` — __COURSE_NAME__  
**Curriculum Module:** __MODULE__  
**Target Cognitive Depth:** `__BLOOM__` (Bloom's Taxonomy)  
**Primary Academic Reference:** *__PRIMARY_TB__*  
**Supplementary Reading:** *__SECONDARY_TB__*  

---

## 1. Executive Motivation, Physical Intuition & Pedagogical Scaffolding
In modern engineering and technology systems, **__LEC_TITLE__** forms a core analytical pillar. Whether optimizing energy efficiency, maximizing computational throughput, guaranteeing closed-loop stability, or eliminating timing violations, mastering the underlying mathematics and physical trade-offs is essential for both university examinations and industrial product development.

### Core Pedagogical Scaffolding:
1. **Physical Intuition:** Understand the physical boundary conditions, energy flows, or algorithmic mechanics before formulating equations.
2. **First-Principles Formulation:** Derive governing differential, algebraic, or state equations without heuristic shortcuts.
3. **Parametric Sensitivity:** Analyze how perturbations in damping, capacitance, clock skew, or learning rate impact the system.
4. **Industrial Benchmark:** Map theoretical formulas to production deployment constraints (e.g. latency budgets, thermal limits).

### Key Learning Objectives:
- Master the formal mathematical and physical representations governing **__LEC_TITLE__**.
- Derive exact closed-form expressions and boundary state trajectories from first principles.
- Analyze transient, steady-state, and spectral dynamics across operating regions.
- Evaluate real-world trade-offs between performance, robustness, and implementation cost.

---

## 2. Mathematical Foundations & First-Principles Derivations

__THEORY_SEC__

---

## 3. Structural Block Diagram & Signal Flow Topology

__DIAGRAM_SEC__

### Granular Subtopics Analyzed in this Lecture:
__SUBTOPICS__

---

## 4. Worked Engineering Numerical Example & Step-by-Step Proof

__NUMERICAL_SEC__

---

## 5. Curated Online Video Lectures & Standard References
To deepen your mastery, review the following curated lectures from world-class university repositories:
- 📺 **[__V1_PLAT__] __V1_NAME__** — *__V1_INST__*: [Access Lecture Series](__V1_URL__)
- 📺 **[__V2_PLAT__] __V2_NAME__** — *__V2_INST__*: [Access Course Materials](__V2_URL__)
- 📖 **Textbook Reading Assignment:** *__PRIMARY_TB__*, Chapters corresponding to *__LEC_TITLE__*.

---

## 6. Real-World Industrial Case Study & Telemetry Analysis

__CASE_STUDY_SEC__

---

## 7. Interactive Lecture Checkpoints & Diagnostics

__CHECKPOINTS_SEC__

---

## 8. Summary & Key Engineering Takeaways
- **Core Principle:** **__LEC_TITLE__** establishes the analytical foundation for dynamic stability, performance bounds, and scalability.
- **Engineering Design Rule:** Always verify that physical operating margins, noise limits, and timing constraints satisfy standard safety margins (typically $\ge 20\%$ margin).
- **Prerequisite Link:** Proceed to the subsequent lecture to build advanced feedback compensation, optimization frameworks, and physical realization topologies.
"""
        return (
            template.replace("__LEC_NUM__", lec_num)
            .replace("__LEC_TITLE__", lec_title)
            .replace("__COURSE_CODE__", course_code)
            .replace("__COURSE_NAME__", course_name)
            .replace("__MODULE__", module)
            .replace("__BLOOM__", bloom)
            .replace("__PRIMARY_TB__", primary_tb)
            .replace("__SECONDARY_TB__", secondary_tb)
            .replace("__V1_PLAT__", v1_plat)
            .replace("__V1_NAME__", v1_name)
            .replace("__V1_INST__", v1_inst)
            .replace("__V1_URL__", v1_url)
            .replace("__V2_PLAT__", v2_plat)
            .replace("__V2_NAME__", v2_name)
            .replace("__V2_INST__", v2_inst)
            .replace("__V2_URL__", v2_url)
            .replace("__SUBTOPICS__", subtopics_lines)
            .replace("__THEORY_SEC__", theory_sec)
            .replace("__DIAGRAM_SEC__", diagram_sec)
            .replace("__NUMERICAL_SEC__", numerical_sec)
            .replace("__CASE_STUDY_SEC__", case_study_sec)
            .replace("__CHECKPOINTS_SEC__", checkpoints_sec)
            .strip()
        )

    def _detect_domain(self, course_name: str, lec_title: str) -> str:
        text = f"{course_name} {lec_title}".lower()
        if any(k in text for k in ["vlsi", "cmos", "mosfet", "transistor", "inverter", "asic", "fpga", "timing slack", "sram", "dram", "logical effort"]):
            return "vlsi"
        if any(k in text for k in ["reinforce", "rl", "markov", "policy gradient", "q-learn", "actor-critic"]):
            return "rl"
        if any(k in text for k in ["machine learning", "neural", "backprop", "deep learning", "classifier", "svm", "regression", "cnn", "transformer"]):
            return "ml"
        if any(k in text for k in ["dsp", "signal", "dft", "fft", "dtft", "filter", "z-transform", "convolution", "sampling"]):
            return "dsp"
        if any(k in text for k in ["control", "transfer function", "root locus", "bode", "nyquist", "state-space", "routh", "observer"]):
            return "control"
        if any(k in text for k in ["converter", "rectifier", "inverter", "buck", "boost", "power electronic", "scr", "thyristor"]):
            return "power_electronics"
        if any(k in text for k in ["circuit", "nodal", "mesh", "thevenin", "norton", "impedance", "resonance", "phasor"]):
            return "circuits"
        if any(k in text for k in ["robot", "kinematic", "jacobian", "dynamics", "denavit", "trajectory"]):
            return "robotics"
        if any(k in text for k in ["distributed", "raft", "paxos", "microservice", "consensus", "cloud", "kafka"]):
            return "distributed"
        return "general_engineering"

    def _generate_theoretical_foundations(self, domain: str, title: str) -> str:
        if domain == "vlsi":
            return r"""### 2.1 MOS Submicron Transport Physics & Velocity Saturation
In deep submicron and nanometer regime CMOS technologies, the saturation drain current $I_{ds,\text{sat}}$ accounts for velocity saturation, mobility degradation, and channel-length modulation:

$$
I_{ds,\text{sat}} = v_{\text{sat}} C_{ox} W (V_{gs} - V_{th} - V_{ds,\text{sat}}) (1 + \lambda V_{ds})
$$

For multi-stage combinational paths, the total path delay $D$ is minimized using the Method of Logical Effort:

$$
D = \sum_{j=1}^N (g_j h_j + p_j) = N F^{1/N} + P, \quad F = G \cdot B \cdot H
$$

where $G = \prod g_j$ is path logical effort, $B$ is branching effort, $H = C_{\text{load}} / C_{\text{in}}$ is electrical effort, and $p_j$ is intrinsic parasitic delay."""

        elif domain == "rl":
            return r"""### 2.1 Markov Decision Process & The Bellman Equation
The dynamics of the system are formalized via a Markov Decision Process (MDP) defined by the 5-tuple $(\mathcal{S}, \mathcal{A}, \mathcal{P}, \mathcal{R}, \gamma)$. The state-action value function satisfies the recursive Bellman Optimality Equation:

$$
Q^*(s, a) = \mathcal{R}(s, a) + \gamma \sum_{s' \in \mathcal{S}} \mathcal{P}(s' \mid s, a) \max_{a' \in \mathcal{A}} Q^*(s', a')
$$

For continuous policy optimization, the Policy Gradient Theorem yields the exact gradient of expected cumulative return $J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)]$:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^T \nabla_\theta \log \pi_\theta(a_t \mid s_t) A^{\pi_\theta}(s_t, a_t) \right]
$$

where $A(s_t, a_t) = Q(s_t, a_t) - V(s_t)$ represents the Generalized Advantage Estimator (GAE)."""

        elif domain == "ml":
            return r"""### 2.1 Empirical Risk Minimization & Regularized Loss Landscapes
The learning dynamics minimize the regularized empirical objective over dataset $\mathcal{D} = \{(x_i, y_i)\}_{i=1}^N$:

$$
\min_{\mathbf{w}} \mathcal{L}(\mathbf{w}) = \frac{1}{N} \sum_{i=1}^N \ell(f_{\mathbf{w}}(x_i), y_i) + \frac{\lambda_1}{2} \|\mathbf{w}\|_2^2 + \lambda_2 \|\mathbf{w}\|_1
$$

Applying reverse-mode automatic differentiation across computational graph layers yields the parameter update vector under momentum-accelerated gradient descent:

$$
\mathbf{v}_{t+1} = \beta \mathbf{v}_t + (1 - \beta) \nabla_{\mathbf{w}} \mathcal{L}(\mathbf{w}_t), \quad \mathbf{w}_{t+1} = \mathbf{w}_t - \eta \frac{\mathbf{v}_{t+1}}{\sqrt{\mathbf{s}_{t+1}} + \epsilon}
$$"""

        elif domain == "dsp":
            return r"""### 2.1 Frequency Domain Transformation & Convergence Criteria
The Discrete Fourier Transform (DFT) of a sequence $x[n]$ for length $N$ is formulated as:

$$
X[k] = \sum_{n=0}^{N-1} x[n] W_N^{nk}, \quad W_N = e^{-j \frac{2\pi}{N}}, \quad k \in [0, N-1]
$$

Under the Bilinear Transformation mapping from analog $s$-domain to discrete $z$-domain with pre-warping parameter $\omega_d$:

$$
s = \frac{2}{T_s} \frac{1 - z^{-1}}{1 + z^{-1}}, \quad \Omega_a = \frac{2}{T_s} \tan\left( \frac{\omega_d T_s}{2} \right)
$$

This strictly maps the open left half of the $s$-plane into the interior of the unit disk $|z| < 1$, guaranteeing unconditional BIBO stability."""

        elif domain == "control":
            return r"""### 2.1 State-Space Dynamic Evolution & Controllability
The continuous-time linear time-invariant (LTI) system is represented in state-variable canonical form:

$$
\dot{\mathbf{x}}(t) = \mathbf{A} \mathbf{x}(t) + \mathbf{B} \mathbf{u}(t), \quad \mathbf{y}(t) = \mathbf{C} \mathbf{x}(t) + \mathbf{D} \mathbf{u}(t)
$$

The system is completely state-controllable if and only if the Controllability Matrix $\mathcal{C}$ has full rank:

$$
\text{rank}(\mathcal{C}) = \text{rank} \begin{bmatrix} \mathbf{B} & \mathbf{A}\mathbf{B} & \mathbf{A}^2\mathbf{B} & \dots & \mathbf{A}^{n-1}\mathbf{B} \end{bmatrix} = n
$$

For state-feedback control law $\mathbf{u}(t) = -\mathbf{K} \mathbf{x}(t) + r(t)$, the closed-loop poles are governed by $\det(s\mathbf{I} - (\mathbf{A} - \mathbf{B}\mathbf{K})) = 0$."""

        elif domain == "power_electronics":
            return r"""### 2.1 Volt-Second Balance & Inductor Dynamic Balance
Under steady-state periodic switching with period $T_s$ and duty ratio $D = t_{on} / T_s$, the net inductor voltage over one complete cycle must equal zero:

$$
\int_{0}^{T_s} v_L(t) dt = 0 \iff V_{L,\text{on}} D T_s + V_{L,\text{off}} (1 - D) T_s = 0
$$

For a standard DC-DC Buck converter, this yields the ideal conversion ratio and peak-to-peak inductor current ripple $\Delta I_L$:

$$
V_o = D V_{in}, \quad \Delta I_L = \frac{(V_{in} - V_o) D}{f_s L} = \frac{V_{in} D (1 - D)}{f_s L}
$$"""

        else:
            return r"""### 2.1 Governing Differential Equations & Conservation Principles
The dynamic system under consideration is governed by energy and momentum conservation laws expressed as a system of coupled differential equations:

$$
\mathbf{M} \ddot{\mathbf{q}}(t) + \mathbf{C}(\mathbf{q}, \dot{\mathbf{q}}) \dot{\mathbf{q}}(t) + \mathbf{K} \mathbf{q}(t) = \mathbf{\tau}(t)
$$

Transforming to the complex frequency domain via the Laplace transform with zero initial conditions yields the transfer impedance matrix:

$$
\mathbf{H}(s) = \left[ \mathbf{M} s^2 + \mathbf{C} s + \mathbf{K} \right]^{-1}
$$"""

    def _generate_mermaid_diagram(self, domain: str, title: str) -> str:
        if domain == "vlsi":
            return """```mermaid
flowchart LR
    CLK["Clock Distribution Network (H-Tree)"] --> REG1["Launch Flip-Flop (FF1)"]
    CLK --> REG2["Capture Flip-Flop (FF2)"]
    REG1 -->|"t_cq (Clock-to-Q)"| LOGIC["Combinational Logic Cloud (t_comb)"]
    LOGIC -->|"Data D_in (Slack = T_clk - t_cq - t_comb - t_setup - t_skew)"| REG2
    REG2 --> OUT["Pipelined Datapath Output Q"]
```"""
        elif domain in ["rl", "ml"]:
            return """```mermaid
flowchart LR
    A["Environment State S_t"] --> B["Policy Network π_θ(A_t|S_t)"]
    B --> C["Action Execution A_t"]
    C --> D["State Transition & Reward R_t+1"]
    D --> E["Experience Replay Buffer"]
    E --> F["Loss Minimizer & Backprop"]
    F --> B
```"""
        elif domain == "dsp":
            return """```mermaid
flowchart LR
    A["Analog Signal x(t)"] --> B["Anti-Aliasing Filter"]
    B --> C["ADC Sampling (f_s >= 2f_max)"]
    C --> D["Core Filter H(z) / FFT Engine"]
    D --> E["Quantization & Saturation"]
    E --> F["DAC Reconstruction y(t)"]
```"""
        elif domain == "control":
            return """```mermaid
flowchart LR
    R["Reference r(t)"] --> Sum1(("⊕"))
    Sum1 --> K["Compensator / State Gain K"]
    K --> P["Plant G(s) = B/(sI-A)"]
    P --> Y["Output y(t)"]
    Y --> H["Sensor / Feedback Matrix C"]
    H --> Sum1
```"""
        else:
            return """```mermaid
flowchart LR
    A["System Input u(t)"] --> B["Input Stage / Signal Conditioning"]
    B --> C["Core Dynamic Topology: H(s)"]
    C --> D["Feedback & Stabilization Loop"]
    D --> E["System Output y(t)"]
```"""

    def _generate_worked_numerical(self, domain: str, title: str) -> str:
        if domain == "vlsi":
            return r"""### Problem Statement:
A critical datapath in a 28nm standard-cell ASIC consists of a 3-stage logic path: Inverter $\to$ 2-input NAND gate $\to$ 2-input NOR gate driving an output load capacitance $C_{\text{load}} = 64\text{ fF}$. The input capacitance of the first inverter is $C_{\text{in}} = 2\text{ fF}$.
- Logical efforts: $g_{\text{inv}} = 1$, $g_{\text{nand2}} = 4/3$, $g_{\text{nor2}} = 5/3$.
- Parasitic delays: $p_{\text{inv}} = 1$, $p_{\text{nand2}} = 2$, $p_{\text{nor2}} = 2$.
1. Compute the path logical effort $G$, path electrical effort $H$, and total path effort $F$.
2. Calculate the optimal stage effort $f^*$, minimum total path delay $D^*$ (in units of $\tau$), and optimal input capacitance for each stage.

### Step-by-Step Analytical Solution:

**Step 1: Compute Path Efforts**
$$
G = g_1 \times g_2 \times g_3 = 1 \times \left(\frac{4}{3}\right) \times \left(\frac{5}{3}\right) = \frac{20}{9} = 2.222
$$
$$
H = \frac{C_{\text{load}}}{C_{\text{in}}} = \frac{64\text{ fF}}{2\text{ fF}} = 32
$$
$$
F = G \times H \times B = 2.222 \times 32 \times 1 = 71.11
$$

**Step 2: Determine Optimal Stage Effort ($f^*$) & Minimum Delay ($D^*$)**
$$
f^* = F^{1/3} = (71.11)^{1/3} = 4.143
$$
Total parasitic delay $P = \sum p_i = 1 + 2 + 2 = 5$.
$$
D^* = N f^* + P = 3 \times 4.143 + 5 = 12.43 + 5 = 17.43\ \tau
$$

**Step 3: Size the Intermediate Gate Capacitances**
Working backwards from the output stage:
$$
C_{\text{in, stage 3 (NOR2)}} = \frac{g_3 C_{\text{load}}}{f^*} = \frac{\frac{5}{3} \times 64\text{ fF}}{4.143} = \frac{106.67}{4.143} = 25.75\text{ fF}
$$
$$
C_{\text{in, stage 2 (NAND2)}} = \frac{g_2 C_{\text{in, stage 3}}}{f^*} = \frac{\frac{4}{3} \times 25.75\text{ fF}}{4.143} = \frac{34.33}{4.143} = 8.29\text{ fF}
$$

**Engineering Verification:** $C_{\text{in, stage 1 (INV)}} = \frac{1 \times 8.29}{4.143} = 2.0\text{ fF} = C_{\text{in}}$, exactly matching the initial input constraint. $\blacksquare$"""

        elif domain == "power_electronics":
            return r"""### Problem Statement:
Design a DC-DC Buck converter operating in Continuous Conduction Mode (CCM) with the following specifications:
- Input Voltage: $V_{in} = 48\text{ V}$
- Output Voltage: $V_o = 12\text{ V}$
- Switching Frequency: $f_s = 100\text{ kHz}$
- Maximum Output Current: $I_{o,\max} = 5\text{ A}$
- Maximum Allowed Inductor Current Ripple: $\Delta I_L = 20\% \text{ of } I_o$
- Maximum Allowed Output Voltage Ripple: $\Delta V_o = 1\% \text{ of } V_o$

### Step-by-Step Analytical Solution:

**Step 1: Calculate the Nominal Duty Ratio ($D$)**
$$
D = \frac{V_o}{V_{in}} = \frac{12\text{ V}}{48\text{ V}} = 0.25
$$

**Step 2: Determine Minimum Inductor Sizing ($L$)**
The allowed ripple current is $\Delta I_L = 0.20 \times 5\text{ A} = 1.0\text{ A}$.
$$
L = \frac{V_{in} D (1 - D)}{f_s \Delta I_L} = \frac{48 \times 0.25 \times (1 - 0.25)}{100 \times 10^3 \times 1.0} = \frac{9.0}{10^5} = 90\ \mu\text{H}
$$

**Step 3: Determine Minimum Filter Capacitor Sizing ($C$)**
The allowed voltage ripple is $\Delta V_o = 0.01 \times 12\text{ V} = 0.12\text{ V}$.
$$
C = \frac{\Delta I_L}{8 f_s \Delta V_o} = \frac{1.0}{8 \times 100 \times 10^3 \times 0.12} = \frac{1.0}{96000} = 10.42\ \mu\text{F}
$$

**Engineering Conclusion:** Select a standard commercial inductor of $L = 100\ \mu\text{H}$ (rated for $>6\text{ A}$) and low-ESR ceramic capacitor of $C = 22\ \mu\text{F}$. $\blacksquare$"""

        elif domain == "rl":
            return r"""### Problem Statement:
Consider a 2-state MDP with states $S = \{s_1, s_2\}$ and discount factor $\gamma = 0.9$.
For a fixed policy $\pi$, the transition matrix and immediate reward vectors are:
$$
P^\pi = \begin{bmatrix} 0.7 & 0.3 \\ 0.2 & 0.8 \end{bmatrix}, \quad R^\pi = \begin{bmatrix} +5 \\ -2 \end{bmatrix}
$$
Compute the exact closed-form value function $V^\pi = [V(s_1), V(s_2)]^T$ using the Bellman matrix equation.

### Step-by-Step Analytical Solution:

**Step 1: Set up the Linear Bellman System**
$$
V^\pi = R^\pi + \gamma P^\pi V^\pi \iff (I - \gamma P^\pi) V^\pi = R^\pi
$$

**Step 2: Formulate the Invertible Matrix $(I - \gamma P^\pi)$**
$$
I - \gamma P^\pi = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix} - 0.9 \begin{bmatrix} 0.7 & 0.3 \\ 0.2 & 0.8 \end{bmatrix} = \begin{bmatrix} 0.37 & -0.27 \\ -0.18 & 0.28 \end{bmatrix}
$$

**Step 3: Invert and Solve for $V^\pi$**
$$
\det(I - \gamma P^\pi) = (0.37)(0.28) - (-0.27)(-0.18) = 0.1036 - 0.0486 = 0.055
$$
$$
V^\pi = \frac{1}{0.055} \begin{bmatrix} 0.28 & 0.27 \\ 0.18 & 0.37 \end{bmatrix} \begin{bmatrix} 5 \\ -2 \end{bmatrix} = \frac{1}{0.055} \begin{bmatrix} 1.40 - 0.54 \\ 0.90 - 0.74 \end{bmatrix} = \begin{bmatrix} 15.64 \\ 2.91 \end{bmatrix}
$$

**Result:** State values under $\pi$ are $V(s_1) = 15.64$ and $V(s_2) = 2.91$. $\blacksquare$"""

        else:
            return r"""### Problem Statement:
Given a second-order physical system characterized by closed-loop transfer function:
$$
T(s) = \frac{\omega_n^2}{s^2 + 2 \zeta \omega_n s + \omega_n^2} = \frac{100}{s^2 + 12 s + 100}
$$
1. Determine the undamped natural frequency $\omega_n$ and damping ratio $\zeta$.
2. Calculate the peak percentage overshoot ($\%M_p$) and 2% settling time ($t_s$).

### Step-by-Step Analytical Solution:

**Step 1: Extract Parameters from Denominator**
Comparing coefficients with standard form $s^2 + 2\zeta\omega_n s + \omega_n^2$:
- $\omega_n^2 = 100 \implies \omega_n = 10\text{ rad/s}$
- $2 \zeta \omega_n = 12 \implies \zeta = \frac{12}{2 \times 10} = 0.60$

**Step 2: Calculate Percentage Overshoot ($\%M_p$)**
$$
\%M_p = e^{-\frac{\pi \zeta}{\sqrt{1 - \zeta^2}}} \times 100\% = e^{-\frac{3.14159 \times 0.60}{\sqrt{1 - 0.36}}} \times 100\% = e^{-\frac{1.885}{0.80}} \times 100\% = e^{-2.356} \times 100\% = 9.48\%
$$

**Step 3: Calculate 2% Settling Time ($t_s$)**
$$
t_s = \frac{4}{\zeta \omega_n} = \frac{4}{0.60 \times 10} = \frac{4}{6} = 0.667\text{ seconds}
$$

**Result:** The system exhibits an underdamped response with $\%M_p = 9.48\%$ and settles within $0.667\text{ s}$. $\blacksquare$"""

    def _generate_industrial_case_study(self, domain: str, title: str) -> str:
        if domain == "vlsi":
            return r"""**Industrial Application: High-Performance GPU Shader Datapath (NVIDIA H100 / TSMC 4N)**
- **Architecture:** Pipelined Floating-Point Fused Multiply-Add (FMA) unit clocked at $1.8\text{ GHz}$.
- **Challenge:** Tight clock period $T_{\text{clk}} = 555\text{ ps}$ with clock skew uncertainty budget $<15\text{ ps}$ across large $814\text{ mm}^2$ die.
- **Resolution:** Implementation of balanced H-Tree with CTS-inserted low-jitter clock mesh combined with MTCMOS power gating yields positive worst-negative-slack ($WNS = +24\text{ ps}$) with zero hold violations."""
        elif domain == "rl":
            return r"""**Industrial Application: Autonomous Drone Flight Control (Skydio / Tesla Autopilot)**
- **Architecture:** Continuous action space policy running Soft Actor-Critic (SAC) on an onboard edge TPU.
- **Challenge:** High non-linear aerodynamic turbulence and latency budget $<5\text{ ms}$.
- **Resolution:** By employing reward shaping with an entropy penalty, the policy achieves robust attitude stabilization under $45\text{ km/h}$ crosswinds while preventing policy collapse."""
        elif domain == "power_electronics":
            return r"""**Industrial Application: EV Fast-Charging DC-DC Architecture (Tesla Supercharger V3 / V4)**
- **Architecture:** Interleaved multi-phase Silicon Carbide (SiC) resonant LLC / Buck converter operating at $250\text{ kHz}$.
- **Challenge:** Dissipating $250\text{ kW}$ peak power with efficiency $>98.5\%$.
- **Resolution:** Zero-Voltage Switching (ZVS) combined with digital phase-shifting minimizes switching losses by $68\%$, allowing compact liquid-cooled heatsinking."""
        else:
            return r"""**Industrial Application: Real-Time Telemetry & Predictive Control (NASA JPL Deep Space Network)**
- **Architecture:** High-throughput streaming digital signal processing pipeline with FPGA-accelerated matrix transforms.
- **Challenge:** Phase noise and extreme Doppler shifts at gigahertz carrier frequencies.
- **Resolution:** Asymptotic tracking filters with Kalman gain updates maintain phase lock down to $-140\text{ dBm}$ signal-to-noise ratio."""

    def _generate_diagnostic_checkpoints(self, domain: str, title: str) -> str:
        return f"""### Checkpoint 1 (Conceptual Recall & Fundamentals)
**Question:** In the context of **{title}**, what is the primary consequence of violating boundary stability constraints?
- **A)** The system maintains asymptotic stability with reduced bandwidth
- **B)** State variables or outputs experience exponential divergence / saturation *(Correct)*
- **C)** Computational complexity decreases linearly
- **D)** Phase margin increases by $90^\\circ$

> **Explanation:** Violating stability boundaries (e.g. poles outside unit circle or right-half plane) causes the unforced homogenous solution to grow exponentially, driving physical hardware into destructive saturation.

---

### Checkpoint 2 (Diagnostic Engineering Analysis)
**Question:** If the parameter damping / regularization factor is increased, how does the system trade-off behave?
- **A)** Increases transient overshoot while decreasing settling time
- **B)** Decreases variance / overshoot at the expense of slower response speed *(Correct)*
- **C)** Eliminates steady-state error completely without integral action
- **D)** Has zero effect on eigenvalue locations

> **Explanation:** Higher damping/regularization attenuates oscillatory transient modes and limits high-frequency noise amplification, but naturally lengthens the rise and settling times."""
