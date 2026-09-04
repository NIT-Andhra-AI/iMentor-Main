package course_agents

import (
	"strings"
)

// ResourceCollectorAgent curates textbooks, references, and NPTEL course mappings
type ResourceCollectorAgent struct{}

// NewResourceCollectorAgent initializes the collector
func NewResourceCollectorAgent() *ResourceCollectorAgent {
	return &ResourceCollectorAgent{}
}

// MatchCategory identifies the core engineering category
func (a *ResourceCollectorAgent) MatchCategory(subjectName, description string) string {
	s := strings.ToLower(subjectName + " " + description)

	// Explicit Course Codes & Specific Domain Markers First
	if strings.Contains(s, "cs1031") || strings.Contains(s, "cs2101") || strings.Contains(s, "cs2102") || strings.Contains(s, "data structure") || strings.Contains(s, "algorithm") || strings.Contains(s, "problem solving through computer") || strings.Contains(s, "c programming") {
		return "cs"
	}
	if strings.Contains(s, "ma1011") || strings.Contains(s, "ma1021") || strings.Contains(s, "ma2051") || strings.Contains(s, "ma2092") || strings.Contains(s, "calculus") || strings.Contains(s, "linear algebra") || strings.Contains(s, "differential equation") || strings.Contains(s, "complex variable") || strings.Contains(s, "numerical method") {
		return "math"
	}
	if strings.Contains(s, "machine learning") || strings.Contains(s, "deep learning") || strings.Contains(s, "neural network") || strings.Contains(s, "soft computing") || strings.Contains(s, "fuzzy") || strings.Contains(s, "ee3631") || strings.Contains(s, "ee3691") {
		return "ml"
	}
	if strings.Contains(s, "signal") || strings.Contains(s, "dsp") || strings.Contains(s, "discrete-time") || strings.Contains(s, "fourier transform") || strings.Contains(s, "z-transform") || strings.Contains(s, "ee3621") || strings.Contains(s, "ec1521") {
		return "dsp"
	}
	if strings.Contains(s, "power electronic") || strings.Contains(s, "converter") || strings.Contains(s, "inverter") || strings.Contains(s, "chopper") || strings.Contains(s, "thyristor") || strings.Contains(s, "igbt") || strings.Contains(s, "switched mode") || strings.Contains(s, "smps") || strings.Contains(s, "ee3011") || strings.Contains(s, "ee3661") || strings.Contains(s, "ee3741") || strings.Contains(s, "ee3681") {
		return "power_electronics"
	}
	if strings.Contains(s, "ee2021") || strings.Contains(s, "ee2051") || strings.Contains(s, "ee3041") || strings.Contains(s, "ee4631") || strings.Contains(s, "ee3701") || strings.Contains(s, "rotating machine") || strings.Contains(s, "dc machine") || strings.Contains(s, "induction motor") || strings.Contains(s, "synchronous generator") || strings.Contains(s, "synchronous motor") || strings.Contains(s, "transformer") || strings.Contains(s, "electrical machine") {
		return "machines"
	}
	if strings.Contains(s, "power system") || strings.Contains(s, "transmission") || strings.Contains(s, "distribution") || strings.Contains(s, "grid") || strings.Contains(s, "power quality") || strings.Contains(s, "energy conservation") || strings.Contains(s, "high voltage") || strings.Contains(s, "ee2031") || strings.Contains(s, "ee2071") || strings.Contains(s, "ee3021") || strings.Contains(s, "ee3711") || strings.Contains(s, "ee4601") || strings.Contains(s, "ee4611") || strings.Contains(s, "ee4621") || strings.Contains(s, "ee3731") {
		return "power_systems"
	}
	if strings.Contains(s, "analog electronics") || strings.Contains(s, "digital electronics") || strings.Contains(s, "op-amp") || strings.Contains(s, "bjt") || strings.Contains(s, "mosfet") || strings.Contains(s, "amplifier") || strings.Contains(s, "ee1021") || strings.Contains(s, "ee2041") {
		return "analog"
	}
	if strings.Contains(s, "embedded") || strings.Contains(s, "microprocessor") || strings.Contains(s, "microcontroller") || strings.Contains(s, "arm cortex") || strings.Contains(s, "8085") || strings.Contains(s, "8086") || strings.Contains(s, "ee3031") || strings.Contains(s, "ee3671") || strings.Contains(s, "internet of things") || strings.Contains(s, "ee2601") {
		return "embedded"
	}
	if strings.Contains(s, "control system") || strings.Contains(s, "control engineering") || strings.Contains(s, "bode") || strings.Contains(s, "nyquist") || strings.Contains(s, "root locus") || strings.Contains(s, "state-space") || strings.Contains(s, "pid") || strings.Contains(s, "ee2061") || strings.Contains(s, "ee3601") {
		return "control"
	}
	return "circuits"
}

// Collect curates academic resources for a subject
func (a *ResourceCollectorAgent) Collect(courseCode, subjectName, description string) ResourceBundle {
	category := a.MatchCategory(subjectName+" "+courseCode, description)

	bundle := ResourceBundle{
		CourseCode:                  courseCode,
		SubjectName:                 subjectName,
		Category:                    category,
		InteractiveSandboxAvailable: true,
		SuggestedPrerequisites: []string{
			"Engineering Mathematics (Calculus, Linear Algebra, Differential Equations)",
			"Basic Physics & Computational Modeling",
		},
	}

	switch category {
	case "cs":
		bundle.Textbooks = []Textbook{
			{Title: "Introduction to Algorithms (CLRS)", Authors: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein", Publisher: "MIT Press", Edition: "4th Edition", Code: "T1", Relevance: "Foundational text for asymptotic analysis, divide-and-conquer, dynamic programming, and graph algorithms."},
			{Title: "Data Structures and Algorithm Analysis in C", Authors: "Mark Allen Weiss", Publisher: "Pearson", Edition: "2nd Edition", Code: "T2", Relevance: "Rigorous analysis of AVL trees, B-trees, hashing, and priority queues."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Programming, Data Structures and Algorithms in Python / C", Instructor: "Prof. Madhavan Mukund", Institute: "IIT Madras / CMI", URL: "https://nptel.ac.in/courses/106106145", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"Visualgo / HTML5 Canvas", "Python / C++ GDB", "Algorithm Profiler"}

	case "math":
		bundle.Textbooks = []Textbook{
			{Title: "Advanced Engineering Mathematics", Authors: "Erwin Kreyszig", Publisher: "Wiley", Edition: "10th Edition", Code: "T1", Relevance: "Authoritative reference for ODEs, PDEs, complex analysis, and vector calculus."},
			{Title: "Introduction to Linear Algebra", Authors: "Gilbert Strang", Publisher: "Wellesley-Cambridge Press", Edition: "5th Edition", Code: "T2", Relevance: "Matrix eigendecomposition, SVD, vector spaces, and linear transformations."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Linear Algebra & Differential Equations", Instructor: "Prof. K. C. Sivakumar", Institute: "IIT Madras", URL: "https://nptel.ac.in/courses/111106051", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"SymPy", "Mathematica", "NumPy / SciPy"}

	case "power_electronics":
		bundle.Textbooks = []Textbook{
			{Title: "Power Electronics: Converters, Applications, and Design", Authors: "Ned Mohan, Tore M. Undeland, William P. Robbins", Publisher: "Wiley", Edition: "3rd Edition", Code: "T1", Relevance: "Canonical text for switched-mode DC-DC converters, PWM inverters, and resonant topologies."},
			{Title: "Power Electronics: Circuits, Devices, and Applications", Authors: "Muhammad H. Rashid", Publisher: "Pearson", Edition: "4th Edition", Code: "T2", Relevance: "Phase-controlled rectifiers, thyristor firing schemes, and thermal design."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Power Electronics", Instructor: "Prof. G. Bhuvaneswari", Institute: "IIT Delhi", URL: "https://nptel.ac.in/courses/108102145", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"PSIM", "MATLAB Simscape Power Systems", "PLECS"}

	case "power_systems":
		bundle.Textbooks = []Textbook{
			{Title: "Power System Analysis", Authors: "John J. Grainger, William D. Stevenson Jr.", Publisher: "McGraw-Hill", Edition: "1st Edition", Code: "T1", Relevance: "Transmission line modeling, symmetrical components, and fault calculation."},
			{Title: "Modern Power System Analysis", Authors: "I. J. Nagrath, D. P. Kothari", Publisher: "McGraw-Hill", Edition: "4th Edition", Code: "T2", Relevance: "Load flow Newton-Raphson methods, economic dispatch, and transient stability."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Power System Analysis", Instructor: "Prof. Debapriya Das", Institute: "IIT Kharagpur", URL: "https://nptel.ac.in/courses/108105067", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"ETAP", "PowerWorld Simulator", "MATLAB MATPOWER"}

	case "machines":
		bundle.Textbooks = []Textbook{
			{Title: "Electric Machinery Fundamentals", Authors: "Stephen J. Chapman", Publisher: "McGraw-Hill", Edition: "5th Edition", Code: "T1", Relevance: "Comprehensive coverage of AC/DC machines, transformers, and synchronous generators."},
			{Title: "Electrical Machinery", Authors: "P. S. Bimbhra", Publisher: "Khanna Publishers", Edition: "7th Edition", Code: "T2", Relevance: "GATE benchmark text for induction motor equivalent circuits and testing."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Electrical Machines", Instructor: "Prof. Krishna Vasudevan", Institute: "IIT Madras", URL: "https://nptel.ac.in/courses/108106072", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"ANSYS Maxwell", "FEMM", "MATLAB Simulink Machines"}

	case "dsp":
		bundle.Textbooks = []Textbook{
			{Title: "Discrete-Time Signal Processing", Authors: "Alan V. Oppenheim, Ronald W. Schafer", Publisher: "Pearson", Edition: "3rd Edition", Code: "T1", Relevance: "Definitive textbook for DTFT, Z-Transform, DFT/FFT, and IIR/FIR filter design."},
			{Title: "Digital Signal Processing: Principles, Algorithms, and Applications", Authors: "John G. Proakis, Dimitris G. Manolakis", Publisher: "Pearson", Edition: "4th Edition", Code: "T2", Relevance: "Formulation of fast algorithms and finite wordlength analysis."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Digital Signal Processing", Instructor: "Prof. S. C. Dutta Roy", Institute: "IIT Delhi", URL: "https://nptel.ac.in/courses/117102060", ModulesCount: 40},
		}
		bundle.SimulationTools = []string{"SciPy Signal", "MATLAB DSP Toolbox", "KaTeX / WebAudio DSP Sandbox"}

	case "ml":
		bundle.Textbooks = []Textbook{
			{Title: "Pattern Recognition and Machine Learning", Authors: "Christopher M. Bishop", Publisher: "Springer", Edition: "1st Edition", Code: "T1", Relevance: "Foundational mathematical formulations: Bayesian inference, Linear Models, SVMs, Neural Networks."},
			{Title: "Machine Learning: A Probabilistic Perspective", Authors: "Kevin P. Murphy", Publisher: "MIT Press", Edition: "1st Edition", Code: "T2", Relevance: "Probabilistic graphical models, optimization, ensemble methods."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Introduction to Machine Learning", Instructor: "Prof. Balaraman Ravindran", Institute: "IIT Madras", URL: "https://nptel.ac.in/courses/106106139", ModulesCount: 12},
		}
		bundle.SimulationTools = []string{"Scikit-Learn", "PyTorch", "TensorFlow"}

	case "control":
		bundle.Textbooks = []Textbook{
			{Title: "Modern Control Engineering", Authors: "Katsuhiko Ogata", Publisher: "Pearson", Edition: "5th Edition", Code: "T1", Relevance: "Standard curriculum text for Root Locus, Bode plots, Nyquist stability, and State-Space."},
			{Title: "Control Systems Engineering", Authors: "Norman S. Nise", Publisher: "Wiley", Edition: "8th Edition", Code: "T2", Relevance: "Practical control design, time-domain specs, and compensator placement."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Control Engineering", Instructor: "Prof. Ramkrishna Pasumarthy", Institute: "IIT Madras", URL: "https://nptel.ac.in/courses/108106098", ModulesCount: 12},
		}
		bundle.SimulationTools = []string{"Python Control Systems Library", "MATLAB Simulink", "GNU Octave Control Package"}

	default: // circuits and general electrical
		bundle.Textbooks = []Textbook{
			{Title: "Fundamentals of Electric Circuits", Authors: "Charles K. Alexander, Matthew N. O. Sadiku", Publisher: "McGraw-Hill", Edition: "7th Edition", Code: "T1", Relevance: "Nodal/mesh analysis, AC network theorems, resonance, and Laplace transforms."},
			{Title: "Engineering Circuit Analysis", Authors: "William H. Hayt, Jack E. Kemmerly, Steven M. Durbin", Publisher: "McGraw-Hill", Edition: "9th Edition", Code: "T2", Relevance: "Transient analysis and two-port network synthesis."},
		}
		bundle.NPTELCourses = []NPTELCourse{
			{CourseName: "Basic Electrical Circuits", Instructor: "Prof. Nagendra Krishnapura", Institute: "IIT Madras", URL: "https://nptel.ac.in/courses/108106172", ModulesCount: 12},
		}
		bundle.SimulationTools = []string{"LTSpice XVII", "MATLAB Simscape", "Falstad Circuit Simulator"}
	}

	return bundle
}
