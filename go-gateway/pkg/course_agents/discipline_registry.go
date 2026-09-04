package course_agents

import (
	"encoding/json"
	"strings"
	"sync"
)

// EngineeringDepartment represents an accredited engineering discipline
type EngineeringDepartment string

const (
	DeptEEE   EngineeringDepartment = "EEE"   // Electrical & Electronics Engineering
	DeptECE   EngineeringDepartment = "ECE"   // Electronics & Communication Engineering
	DeptCSE   EngineeringDepartment = "CSE"   // Computer Science & Engineering
	DeptMECH  EngineeringDepartment = "MECH"  // Mechanical Engineering
	DeptCIVIL EngineeringDepartment = "CIVIL" // Civil Engineering
	DeptCORE  EngineeringDepartment = "CORE"  // Common First-Year Engineering Sciences
)

// DisciplineSubject represents a credit-bearing course within a department curriculum
type DisciplineSubject struct {
	CourseCode        string                `json:"course_code"`
	CourseName        string                `json:"course_name"`
	Department        EngineeringDepartment `json:"department"`
	Semester          int                   `json:"semester"`
	Credits           int                   `json:"credits"`
	IsLab             bool                  `json:"is_lab"`
	GatePaperCode     string                `json:"gate_paper_code"` // e.g. "EE", "EC", "CS", "ME", "CE"
	VisualDiagramType string                `json:"visual_diagram_type"` // "SVG_CIRCUIT", "MERMAID_DAG", "SMITH_CHART", "STRESS_STRAIN_SVG", "TREE_MEMORY_LAYOUT"
	TopRecruiters     []string              `json:"top_recruiters"`
	CoreTopics        []string              `json:"core_topics"`
}

// MultiDisciplineRegistry manages curriculum catalogs across all engineering branches
type MultiDisciplineRegistry struct {
	mu       sync.RWMutex
	subjects map[string]*DisciplineSubject
}

// NewMultiDisciplineRegistry initializes the universal engineering discipline registry
func NewMultiDisciplineRegistry() *MultiDisciplineRegistry {
	r := &MultiDisciplineRegistry{
		subjects: make(map[string]*DisciplineSubject),
	}
	r.seedUniversalEngineeringCurricula()
	return r
}

// GetSubject retrieves a specific course by its code
func (r *MultiDisciplineRegistry) GetSubject(courseCode string) (*DisciplineSubject, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	subj, exists := r.subjects[strings.ToUpper(strings.TrimSpace(courseCode))]
	return subj, exists
}

// GetCurriculumForDepartment retrieves all semester courses for a department
func (r *MultiDisciplineRegistry) GetCurriculumForDepartment(dept EngineeringDepartment, semester int) []*DisciplineSubject {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matched []*DisciplineSubject
	for _, s := range r.subjects {
		if s.Department == dept && (semester == 0 || s.Semester == semester) {
			matched = append(matched, s)
		}
	}
	return matched
}

// GetAllDepartments returns the list of supported engineering departments
func (r *MultiDisciplineRegistry) GetAllDepartments() []EngineeringDepartment {
	return []EngineeringDepartment{
		DeptEEE,
		DeptECE,
		DeptCSE,
		DeptMECH,
		DeptCIVIL,
		DeptCORE,
	}
}

// seedUniversalEngineeringCurricula populates university curricula across all 5 disciplines + first-year core
func (r *MultiDisciplineRegistry) seedUniversalEngineeringCurricula() {
	curricula := []*DisciplineSubject{
		// ─── 1. EEE (Electrical & Electronics Engineering) ─────────────────────────
		{
			CourseCode:        "EE3011",
			CourseName:        "Power Electronics & Converters",
			Department:        DeptEEE,
			Semester:          5,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EE",
			VisualDiagramType: "SVG_CIRCUIT",
			TopRecruiters:     []string{"Tesla", "ABB", "Schneider Electric", "Siemens", "Texas Instruments"},
			CoreTopics:        []string{"Buck Converter", "Boost Converter", "Inverters", "PWM Control", "MOSFET Loss"},
		},
		{
			CourseCode:        "EE2031",
			CourseName:        "Power System Analysis",
			Department:        DeptEEE,
			Semester:          4,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EE",
			VisualDiagramType: "SVG_CIRCUIT",
			TopRecruiters:     []string{"Power Grid", "NTPC", "GE Vernova", "Hitachi Energy"},
			CoreTopics:        []string{"Load Flow", "Symmetrical Faults", "Swing Equation", "Y-Bus Matrix"},
		},
		{
			CourseCode:        "EE2061",
			CourseName:        "Control Systems Engineering",
			Department:        DeptEEE,
			Semester:          4,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EE",
			VisualDiagramType: "BODE_NYQUIST_SVG",
			TopRecruiters:     []string{"ISRO", "DRDO", "Honeywell", "Rockwell Automation"},
			CoreTopics:        []string{"Root Locus", "Bode Plots", "Nyquist Stability", "State-Space Models"},
		},

		// ─── 2. CSE (Computer Science & Engineering) ──────────────────────────────
		{
			CourseCode:        "CS2101",
			CourseName:        "Data Structures & Algorithms",
			Department:        DeptCSE,
			Semester:          3,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CS",
			VisualDiagramType: "TREE_MEMORY_LAYOUT",
			TopRecruiters:     []string{"Google", "Microsoft", "Amazon", "Meta", "Apple"},
			CoreTopics:        []string{"Binary Search Trees", "Red-Black Trees", "Dynamic Programming", "Graph Dijkstra", "Tries"},
		},
		{
			CourseCode:        "CS3101",
			CourseName:        "Operating Systems & Concurrency",
			Department:        DeptCSE,
			Semester:          5,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CS",
			VisualDiagramType: "MERMAID_DAG",
			TopRecruiters:     []string{"Microsoft", "Oracle", "VMware", "Red Hat", "NVIDIA"},
			CoreTopics:        []string{"Virtual Memory Paging", "Semaphores & Mutexes", "MESI Cache Coherence", "Deadlock Banker Algorithm"},
		},
		{
			CourseCode:        "CS3201",
			CourseName:        "Database Management Systems",
			Department:        DeptCSE,
			Semester:          5,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CS",
			VisualDiagramType: "MERMAID_DAG",
			TopRecruiters:     []string{"MongoDB", "Salesforce", "Snowflake", "Amazon AWS"},
			CoreTopics:        []string{"B+ Trees", "ACID Transactions", "2PL Concurrency Control", "Relational Algebra Normalization"},
		},
		{
			CourseCode:        "CS3691",
			CourseName:        "Deep Learning & Foundation Models",
			Department:        DeptCSE,
			Semester:          6,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CS",
			VisualDiagramType: "MERMAID_DAG",
			TopRecruiters:     []string{"Google DeepMind", "OpenAI", "Anthropic", "NVIDIA", "Meta AI"},
			CoreTopics:        []string{"Multi-Head Attention", "Transformer Architecture", "Backpropagation Calculus", "KV-Cache Radix Optimization"},
		},

		// ─── 3. ECE (Electronics & Communication Engineering) ─────────────────────
		{
			CourseCode:        "EC2011",
			CourseName:        "Signals and Systems",
			Department:        DeptECE,
			Semester:          3,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EC",
			VisualDiagramType: "WAVEFORM_SVG",
			TopRecruiters:     []string{"Qualcomm", "Texas Instruments", "Broadcom", "Intel"},
			CoreTopics:        []string{"CT/DT Fourier Transform", "Laplace Transform", "Z-Transform ROC", "Nyquist Sampling Theorem"},
		},
		{
			CourseCode:        "EC3011",
			CourseName:        "Digital Signal Processing",
			Department:        DeptECE,
			Semester:          5,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EC",
			VisualDiagramType: "WAVEFORM_SVG",
			TopRecruiters:     []string{"Qualcomm", "Analog Devices", "Apple", "Cirrus Logic"},
			CoreTopics:        []string{"DFT & Radix-2 FFT", "IIR Butterworth/Chebyshev Filters", "FIR Linear Phase", "Bilinear Transform"},
		},
		{
			CourseCode:        "EC3021",
			CourseName:        "CMOS VLSI Design",
			Department:        DeptECE,
			Semester:          5,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "EC",
			VisualDiagramType: "SVG_CIRCUIT",
			TopRecruiters:     []string{"NVIDIA", "Intel", "AMD", "Synopsys", "Cadence"},
			CoreTopics:        []string{"CMOS Inverter VTC", "Elmore Delay Model", "Static Timing Analysis", "Logical Effort"},
		},

		// ─── 4. MECH (Mechanical Engineering) ─────────────────────────────────────
		{
			CourseCode:        "ME2011",
			CourseName:        "Engineering Thermodynamics",
			Department:        DeptMECH,
			Semester:          3,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "ME",
			VisualDiagramType: "PV_TS_DIAGRAM_SVG",
			TopRecruiters:     []string{"Boeing", "L&T", "General Electric", "Tata Motors", "Cummins"},
			CoreTopics:        []string{"First Law Closed/Open Systems", "Carnot & Second Law", "Rankine Cycle", "Otto & Diesel Cycles"},
		},
		{
			CourseCode:        "ME2021",
			CourseName:        "Mechanics of Materials & Stress Analysis",
			Department:        DeptMECH,
			Semester:          4,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "ME",
			VisualDiagramType: "STRESS_STRAIN_SVG",
			TopRecruiters:     []string{"L&T", "BHEL", "Mahindra", "Airbus"},
			CoreTopics:        []string{"Mohr's Circle", "Shear Force & Bending Moment (SFD/BMD)", "Torsion of Circular Shafts", "Euler Buckling Column"},
		},

		// ─── 5. CIVIL (Civil Engineering) ─────────────────────────────────────────
		{
			CourseCode:        "CE2011",
			CourseName:        "Structural Analysis",
			Department:        DeptCIVIL,
			Semester:          4,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CE",
			VisualDiagramType: "STRESS_STRAIN_SVG",
			TopRecruiters:     []string{"L&T Construction", "Shapoorji Pallonji", "Tata Projects", "NHAI"},
			CoreTopics:        []string{"Moment Distribution Method", "Slope Deflection", "Influence Line Diagrams", "Truss Deflection Castigliano"},
		},
		{
			CourseCode:        "CE2021",
			CourseName:        "Fluid Mechanics & Hydraulics",
			Department:        DeptCIVIL,
			Semester:          3,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "CE",
			VisualDiagramType: "WAVEFORM_SVG",
			TopRecruiters:     []string{"L&T Water", "WAPCOS", "Irrigation Department"},
			CoreTopics:        []string{"Bernoulli Equation", "Pipe Flow Darcy-Weisbach", "Manning Open Channel Flow", "Boundary Layer Separation"},
		},

		// ─── 6. Common Engineering Core (First-Year) ──────────────────────────────
		{
			CourseCode:        "MA1011",
			CourseName:        "Multivariable Calculus & Differential Equations",
			Department:        DeptCORE,
			Semester:          1,
			Credits:           4,
			IsLab:             false,
			GatePaperCode:     "ALL",
			VisualDiagramType: "WAVEFORM_SVG",
			TopRecruiters:     []string{"All Engineering Disciplines"},
			CoreTopics:        []string{"Eigenvalues & Eigenvectors", "Taylor Series", "Double & Triple Integrals", "Green Gauss Stokes Theorems"},
		},
		{
			CourseCode:        "CS1011",
			CourseName:        "Problem Solving & Python Programming",
			Department:        DeptCORE,
			Semester:          1,
			Credits:           3,
			IsLab:             false,
			GatePaperCode:     "ALL",
			VisualDiagramType: "TREE_MEMORY_LAYOUT",
			TopRecruiters:     []string{"All Engineering Disciplines"},
			CoreTopics:        []string{"Control Flow", "Recursion", "Complexity Analysis", "File I/O", "Object-Oriented Design"},
		},
	}

	for _, c := range curricula {
		r.subjects[c.CourseCode] = c
	}
}

// ToJSON exports the full multi-discipline registry
func (r *MultiDisciplineRegistry) ToJSON() (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	bytes, err := json.MarshalIndent(r.subjects, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
