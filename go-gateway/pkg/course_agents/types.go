package course_agents

// SyllabusMode controls whether the agent uses the predefined R24 university syllabus
// or generates a custom syllabus. Default should be UseR24Predefined.
type SyllabusMode int

const (
	// UseR24Predefined parses the official NIT Andhra Pradesh R24 regulation syllabus
	// from curriculum_pdf.json and decomposes it into 36 lectures. This is the DEFAULT.
	UseR24Predefined SyllabusMode = iota

	// GenerateCustom generates discipline-specific lecture topics from scratch.
	// Use only when the R24 syllabus is unavailable or when explicitly toggled.
	GenerateCustom
)

// R24SyllabusEntry represents a single page entry from the R24 curriculum PDF JSON
type R24SyllabusEntry struct {
	Page int    `json:"page"`
	Text string `json:"text"`
}

// R24ParsedCourse holds the parsed R24 syllabus data for a single course
type R24ParsedCourse struct {
	CourseCode     string   // e.g., "EE3011"
	CourseName     string   // e.g., "Power Electronics"
	Credits        string   // e.g., "3-0-0 3 Credits"
	Prerequisites  string   // e.g., "Basic electrical circuits..."
	CourseOutcomes []string // CO1, CO2, CO3...
	SyllabusText   string   // The raw "Syllabus:" section text
	UnitTexts      []string // Split syllabus by unit/paragraph headings
	UnitTitles     []string // Extracted unit heading titles
	Textbooks      []string // Listed textbooks
	References     []string // Listed reference books
}

// Textbook represents a recommended academic reference book
type Textbook struct {
	Title     string `json:"title"`
	Authors   string `json:"authors"`
	Publisher string `json:"publisher"`
	Edition   string `json:"edition"`
	Code      string `json:"code"`
	Relevance string `json:"relevance"`
}

// NPTELCourse represents an mapped NPTEL/MOOC video lecture course
type NPTELCourse struct {
	CourseName   string `json:"course_name"`
	Instructor   string `json:"instructor"`
	Institute    string `json:"institute"`
	URL          string `json:"url"`
	ModulesCount int    `json:"modules_count"`
}

// ResourceBundle holds all curated references and tools for a subject
type ResourceBundle struct {
	CourseCode                  string        `json:"course_code"`
	SubjectName                 string        `json:"subject_name"`
	Category                    string        `json:"category"`
	Textbooks                   []Textbook    `json:"textbooks"`
	References                  []Textbook    `json:"references"`
	NPTELCourses                []NPTELCourse `json:"nptel_courses"`
	SimulationTools             []string      `json:"simulation_tools"`
	InteractiveSandboxAvailable bool          `json:"interactive_sandbox_available"`
	SuggestedPrerequisites      []string      `json:"suggested_prerequisites"`
}

// Lecture represents a single 40-50 minute syllabus lecture or lab experiment
type Lecture struct {
	Module    string `json:"module"`
	Num       int    `json:"num"`
	Title     string `json:"title"`
	Subtopics string `json:"subtopics"`
	Bloom     string `json:"bloom"`
	Prereq    string `json:"prereq"`
	IsLab     bool   `json:"is_lab"`
}

// CourseStructure represents the complete accredited syllabus specification
type CourseStructure struct {
	CourseCode     string       `json:"course_code"`
	CourseName     string       `json:"course_name"`
	IsLab          bool         `json:"is_lab"`
	TotalLectures  int          `json:"total_lectures"`
	Modules        []string     `json:"modules"`
	CourseOutcomes []string     `json:"course_outcomes"`
	Lectures       []Lecture    `json:"lectures"`
	SyllabusSource SyllabusMode `json:"syllabus_source"` // Tracks which mode was used
}

// STNNode represents a concept in the Semantic Topic Network
type STNNode struct {
	ID              string    `json:"id"`
	LectureNum      int       `json:"lecture_num"`
	Title           string    `json:"title"`
	Module          string    `json:"module"`
	Subtopics       string    `json:"subtopics"`
	BloomLevel      string    `json:"bloom_level"`
	Difficulty      float64   `json:"difficulty"`
	Embedding       []float64 `json:"embedding"`
	RequiredMastery float64   `json:"required_mastery"`
}

// STNEdge represents a directed relation between concepts
type STNEdge struct {
	Source string  `json:"source"`
	Target string  `json:"target"`
	Type   string  `json:"type"` // PREREQUISITE_OF, PART_OF, LEADS_TO
	Weight float64 `json:"weight"`
}

// STNGraph represents the full DAG and adjacency matrix for compute acceleration
type STNGraph struct {
	CourseCode      string      `json:"course_code"`
	CourseName      string      `json:"course_name"`
	TotalNodes      int         `json:"total_nodes"`
	TotalEdges      int         `json:"total_edges"`
	Nodes           []STNNode   `json:"nodes"`
	Edges           []STNEdge   `json:"edges"`
	AdjacencyMatrix [][]float64 `json:"adjacency_matrix"`
}

// GenerationResult summarizes the generated assets
type GenerationResult struct {
	CourseCode        string `json:"course_code"`
	SubjectName       string `json:"subject_name"`
	Category          string `json:"category"`
	IsLab             bool   `json:"is_lab"`
	TotalLectures     int    `json:"total_lectures"`
	ModulesCount      int    `json:"modules_count"`
	STNNodes          int    `json:"stn_nodes"`
	STNEdges          int    `json:"stn_edges"`
	SyllabusCSV       string `json:"syllabus_csv"`
	STNJSON           string `json:"stn_json"`
	ResourcesJSON     string `json:"resources_json"`
	LecturesDir       string `json:"lectures_dir"`
	InteractivePortal string `json:"interactive_portal"`
	AITextbookPath    string `json:"ai_textbook_path"`
	EnhancementReport string `json:"enhancement_report"`
}

// CatalogCourse represents an official university course definition
type CatalogCourse struct {
	Code string `json:"code"`
	Name string `json:"name"`
	Desc string `json:"desc"`
}

// FullEECS_EC_MA_Catalog lists the 44 official undergraduate engineering courses & laboratories
var FullEECS_EC_MA_Catalog = []CatalogCourse{
	// Laboratories
	{"EE2012", "Analog and Digital Circuits Lab", "V-I characteristics of diodes, BJT CE mode, MOSFET drain/transfer, op-amp inverting/non-inverting/filters, logic gates, adders/subtractors, MUX/DEMUX, counters"},
	{"EE2022", "Circuits and Measurements Lab", "KVL/KCL, Thevenin/Norton/Max power theorems, series/parallel RLC resonance, two-port Z/Y parameters, energy meter calibration, Kelvin/Maxwell/Schering bridges, 2-wattmeter power"},
	{"EE2032", "DC Machines and Transformers Lab", "OCC of DC generator, load characteristics of DC shunt/compound generator, brake test, speed control, Swinburne test, Hopkinson test, OC/SC tests on transformer, Sumpner test, Scott connection"},
	{"EE2042", "Control Systems Lab", "AC/DC servomotors, synchro pair, analog PID controller, lead-lag compensator, time response simulation, root locus, Bode/Nyquist plots, state-space controllability/observability, digital PID"},
	{"EE2052", "AC Rotating Machines Lab", "No-load & blocked rotor tests on 3-phase induction motor, circle diagram, slip ring load test, V/f speed control, 1-phase induction motor, alternator regulation (EMF/MMF/ZPF), Xd & Xq slip test, V-curves, synchronization"},
	{"EE2062", "Power Systems and Renewable Energy Lab", "ABCD parameters of transmission line, symmetrical/unsymmetrical fault analysis, IDMT relay, transformer differential protection, load flow simulation, PV I-V/P-V curves, MPPT algorithm, wind DFIG emulator, BESS charging, microgrid synchronization"},
	{"EE3012", "Power Electronics Lab", "SCR/MOSFET/IGBT static characteristics, UJT firing circuit, 1-phase and 3-phase bridge rectifiers, AC voltage controllers, Buck/Boost/Buck-Boost choppers, PWM voltage source inverter, cycloconverter, closed-loop buck simulation"},
	{"EE3022", "Embedded Systems Lab", "ARM Cortex-M Keil setup, GPIO LED/button debouncing, EXTI interrupts, hardware timers, PWM motor speed, ADC with DMA, UART serial PC comms, I2C sensor (MPU6050), SPI TFT/SD card, FreeRTOS preemptive multitasking"},
	{"EE3032", "Electric Power Drives Lab", "Four-quadrant chopper DC drive, converter fed DC drive, closed-loop cascade speed/current control, scalar V/f induction drive, SVPWM inverter, DTC direct torque control, FOC field oriented vector control, PMSM drive, BLDC drive, regenerative braking"},
	{"CS1032", "Problem Solving through Computer Programming Lab", "Linux CLI, GCC setup, format specifiers, if-else, loops, 1D/2D arrays, matrix multiplication, strings, functions, recursion, pointers, dynamic memory allocation (malloc/free), structures, file I/O, binary search & sorting"},
	{"CS2102", "Data Structures and Applications Lab", "Singly/doubly linked lists, stack applications (infix-postfix), circular queues, binary search trees (BST), AVL tree rotations, min/max heap, hash table collision resolution, BFS/DFS graph traversals, Dijkstra shortest path"},
	{"MA2092", "Numerical Methods Lab", "Gauss elimination, Gauss-Seidel, Newton-Raphson root finding, Lagrange interpolation, Simpson's 1/3 and 3/8 integration, Runge-Kutta 4th order ODE solver, power method for eigenvalues"},

	// Theory Courses
	{"EE1011", "Basic Electrical Circuits", "Circuit elements, KVL, KCL, Nodal & Mesh analysis, Network theorems, AC sinusoidal steady-state, Series & Parallel resonance, Magnetic circuits"},
	{"EE1021", "Analog Electronics", "BJT & MOSFET amplifiers, small signal models, power amplifiers, operational amplifiers, active filters, feedback oscillators"},
	{"EE1031", "Electrical Network Analysis", "Network theorems, first and second order circuit transients, Laplace transform in s-domain, two-port parameters, balanced & unbalanced 3-phase systems"},
	{"EE2011", "Measurements and Instrumentation", "PMMC, Moving Iron, Electrodynamometer, DC & AC bridges for resistance/inductance/capacitance, instrument transformers, digital voltmeters"},
	{"EE2021", "DC Machines and Transformers", "Electromechanical energy conversion, DC generators, DC motors, single-phase & three-phase transformers, testing and efficiency"},
	{"EE2031", "Power System Generation and Transmission", "Conventional & renewable generation, transmission line parameters, modeling, performance, traveling waves"},
	{"EE2041", "Digital Electronics", "Boolean algebra, combinational logic, sequential circuits, flip-flops, counters, shift registers, finite state machines, semiconductor memories"},
	{"EE2051", "AC Rotating Machines", "3-phase induction motors, circle diagrams, starting & speed control, synchronous generators, V-curves, synchronous motors"},
	{"EE2061", "Control Systems", "LTI system modeling, transfer functions, block reduction, time response, Routh-Hurwitz, Root Locus, Bode plots, Nyquist criterion, State-Space analysis"},
	{"EE2071", "Power Systems Analysis", "Per-unit system, bus admittance matrix, Gauss-Seidel & Newton-Raphson load flow, symmetrical and unsymmetrical fault analysis, swing equation"},
	{"EE3011", "Power Electronics", "Power semiconductor devices, phase-controlled rectifiers, DC-DC buck/boost converters, PWM inverters, AC voltage controllers"},
	{"EE3021", "Power System Protection and Control", "Overcurrent relays, distance protection, differential protection for transformers and alternators, circuit breakers, digital relays"},
	{"EE3031", "Embedded Systems", "Microcontroller architecture, ARM Cortex, GPIO, interrupts, timers, ADC, serial communication (UART, SPI, I2C), RTOS concepts"},
	{"EE3041", "Electric Power Drives", "DC motor drives, chopper fed drives, induction motor drives (V/f control, vector control), synchronous motor drives, traction"},
	{"EE2601", "Basics of Internet of Things", "Sensors, actuators, microcontrollers, IoT communication protocols (MQTT, HTTP, CoAP), cloud platforms, smart energy monitoring"},
	{"EE2611", "Renewable Power Generation", "Solar PV physics, solar cell modeling, wind power aerodynamics, MPPT algorithms, grid integration, energy storage systems"},
	{"EE3601", "Advanced Control Systems", "Nonlinear control systems, phase plane analysis, describing function, Lyapunov stability, state observer design, optimal control LQR"},
	{"EE3611", "Wind and Solar Electrical Systems", "Solar irradiance estimation, PV array sizing, wind turbine topologies, DFIG & PMSG, grid codes, hybrid renewable microgrids"},
	{"EE3621", "Digital Signal Processing", "Discrete-time signals, DTFT, Z-transform, DFT, FFT, Butterworth/Chebyshev IIR filter design, windowed FIR filters, finite wordlength effects"},
	{"EE3631", "Soft Computing Techniques", "Fuzzy sets, membership functions, fuzzy logic controllers, neural networks, backpropagation, genetic algorithms, neuro-fuzzy inference (ANFIS)"},
	{"EE3641", "Introduction to Electric Vehicles", "EV powertrain architectures, battery chemistries (Li-ion, LFP), Battery Management Systems (BMS), motor drives for traction, regenerative braking, EV charging standards"},
	{"EE3651", "Advanced Computer Methods in Power Systems", "Sparse matrix techniques, Fast Decoupled load flow, optimal power flow (OPF), state estimation, contingency analysis, security assessment"},
	{"EE3661", "Advanced Power Electronics", "Resonant converters (ZVS/ZCS), multilevel inverters (diode clamped, flying capacitor, cascaded H-bridge), matrix converters, space vector modulation"},
	{"EE3671", "Industrial Instrumentation and Automation", "PLC programming (ladder logic), SCADA systems, DCS architectures, industrial sensors, 4-20mA current loops, Fieldbus protocols"},
	{"EE3681", "Converters for Renewable Energy Systems", "Z-source inverters, bidirectional DC-DC converters, grid-forming and grid-following inverters, harmonic mitigation, active power filtering"},
	{"EE3691", "Deep Learning Algorithms", "Convolutional neural networks (CNNs), recurrent neural networks (RNNs/LSTMs), transformers, attention mechanisms, reinforcement learning for power systems"},
	{"EE3701", "Design of Electrical Machines", "Magnetic circuit calculations, output equations, design of armature & field windings for DC machines, transformer core & winding design, induction motor stator/rotor design"},
	{"EE3711", "Power System Deregulation", "Restructured electricity markets, pool and bilateral contracts, locational marginal pricing (LMP), transmission open access, ancillary services management"},
	{"EE3721", "Electric Vehicle Powertrain Design", "Traction motor sizing (PMSM, Induction, SRM), inverter topologies (SiC/GaN), regenerative braking control, gear ratio optimization, thermal management of EV battery packs"},
	{"EE3731", "High Voltage Engineering", "Breakdown mechanisms in gases/liquids/solids, generation of high AC/DC/impulse voltages, Marx generator, impulse current generation, measurement techniques (sphere gaps, electrostatic voltmeters)"},
	{"EE3741", "Switched Mode Power Supplies", "Flyback, Forward, Push-Pull, Half-Bridge, Full-Bridge SMPS topologies, magnetic core selection (area product method), high-frequency transformer design, control loop design, EMI filtering"},
	{"EE4601", "Energy Conservation and Management", "Energy auditing methodology, electrical load management, power factor correction, energy efficient motors, HVAC optimization, cogeneration, economic evaluation (NPV, IRR)"},
	{"EE4611", "Power Quality", "Voltage sags, swells, interruptions, harmonics, IEEE 519 standards, active power filters (APF), dynamic voltage restorers (DVR), unified power quality conditioners (UPQC)"},
	{"EE4621", "Smart Grid Technologies", "Smart grid architecture, Wide Area Measurement Systems (WAMS), Phasor Measurement Units (PMU), AMI, microgrid control, cyber security, demand response"},
	{"EE4631", "Special Electrical Machines", "Stepper motors, Switched Reluctance Motors (SRM), Brushless DC (BLDC) motors, Permanent Magnet Synchronous Motors (PMSM), Linear Induction Motors (LIM)"},
	{"CS1031", "Problem Solving through Computer Programming", "C programming fundamentals, control structures, functions, arrays, pointers, dynamic memory allocation, file handling, algorithmic problem solving"},
	{"CS2101", "Data Structures and Applications", "Abstract Data Types, arrays, linked lists, stacks, queues, trees, binary search trees, AVL trees, graphs, sorting, searching, hashing"},
	{"EC1521", "Signals and Systems", "Continuous & discrete time signals, LTI systems, convolution, continuous Fourier transform, Fourier series, Laplace transform, Z-transform"},
	{"MA1011", "Calculus and Linear Algebra", "Differential calculus, Taylor series, multivariable calculus, partial derivatives, matrix algebra, system of linear equations, eigenvalues and eigenvectors"},
	{"MA1021", "Differential Equations and Vector Calculus", "First and higher order ODEs, series solutions, Laplace transforms, vector differential calculus, gradient, divergence, curl, line/surface/volume integrals, Green/Gauss/Stokes theorems"},
	{"MA2051", "Complex Variables and Partial Differential Equations", "Analytic functions, Cauchy-Riemann equations, conformal mapping, complex integration, Cauchy integral formula, Taylor & Laurent series, Residue theorem, separation of variables for PDE"},
}
