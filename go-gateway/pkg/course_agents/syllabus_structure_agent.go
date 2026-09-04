package course_agents

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type SyllabusStructureAgent struct {
	Mode SyllabusMode
}

func NewSyllabusStructureAgent() *SyllabusStructureAgent {
	return &SyllabusStructureAgent{
		Mode: UseR24Predefined,
	}
}

func (a *SyllabusStructureAgent) StructureCourse(courseCode, subjectName, rawSyllabus string) CourseStructure {
	codeNorm := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	nameUpper := strings.ToUpper(subjectName)
	isLab := strings.Contains(nameUpper, "LAB") || strings.Contains(nameUpper, "PRACTICAL") || strings.HasSuffix(codeNorm, "2") || strings.HasSuffix(codeNorm, "3")

	var lectures []Lecture
	var courseOutcomes []string
	syllabusSource := UseR24Predefined

	if rawSyllabus == "" && a.Mode == UseR24Predefined {
		rawSyllabus = a.fetchR24Syllabus(codeNorm)
	}

	if rawSyllabus != "" {
		lectures, courseOutcomes = a.parseR24Text(rawSyllabus, subjectName, isLab)
	} else {
		syllabusSource = GenerateCustom
		lectures = a.generateCustomLectures(codeNorm, nameUpper, subjectName, isLab)

		if isLab {
			courseOutcomes = []string{
				fmt.Sprintf("CO1: Formulate the experimental test procedures and circuit connections for %s.", subjectName),
				"CO2: Measure, record, and tabulate electrical parameters under varying physical load conditions.",
				"CO3: Analyze experimental waveforms and metrics against theoretical models using error bounds.",
				"CO4: Synthesize simulation models using computational CAD tools to validate hardware benchmarks.",
				"CO5: Adhere strictly to laboratory electrical safety protocols and answer rigorous analytical viva-voce evaluations.",
			}
		} else {
			courseOutcomes = []string{
				fmt.Sprintf("CO1: Formulate the governing mathematical and physical principles of %s from first principles.", subjectName),
				fmt.Sprintf("CO2: Apply transform domain methods and state-space equations to %s.", subjectName),
				"CO3: Analyze transient and steady-state dynamic responses under realistic operational and noise constraints.",
				"CO4: Synthesize robust, fault-tolerant engineering architectures meeting modern industrial standards.",
				"CO5: Employ computational tools and numerical simulations for empirical verification and design optimization.",
			}
		}
	}

	moduleMap := make(map[string]bool)
	var modules []string
	for _, l := range lectures {
		if !moduleMap[l.Module] && l.Module != "" {
			moduleMap[l.Module] = true
			modules = append(modules, l.Module)
		}
	}

	return CourseStructure{
		CourseCode:     courseCode,
		CourseName:     subjectName,
		IsLab:          isLab,
		TotalLectures:  len(lectures),
		Modules:        modules,
		CourseOutcomes: courseOutcomes,
		Lectures:       lectures,
		SyllabusSource: syllabusSource,
	}
}

func (a *SyllabusStructureAgent) fetchR24Syllabus(codeNorm string) string {
	data, err := os.ReadFile("/home/sri/Downloads/iMentor_march/iMentorV2/server/scripts/curriculum_pdf.json")
	if err != nil {
		return ""
	}
	var entries []R24SyllabusEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return ""
	}

	for _, entry := range entries {
		// Some course codes might be embedded in text
		if strings.Contains(entry.Text, codeNorm) {
			idx := strings.Index(entry.Text, "Syllabus:")
			if idx != -1 {
				// Extract text after Syllabus:
				text := entry.Text[idx+len("Syllabus:"):]
				// Stop at Text Books or References
				stopIdx := strings.Index(text, "Text Books")
				if stopIdx == -1 {
					stopIdx = strings.Index(text, "References")
				}
				if stopIdx != -1 {
					text = text[:stopIdx]
				}
				return strings.TrimSpace(text)
			}
		}
	}
	return ""
}

func (a *SyllabusStructureAgent) parseR24Text(text, subjectName string, isLab bool) ([]Lecture, []string) {
	// Splitting by newline or common paragraph breaks
	lines := strings.Split(text, "\n")
	var paragraphs []string
	currentPara := ""
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			if currentPara != "" {
				paragraphs = append(paragraphs, currentPara)
				currentPara = ""
			}
		} else {
			currentPara += line + " "
		}
	}
	if currentPara != "" {
		paragraphs = append(paragraphs, currentPara)
	}

	// Filter short noisy paragraphs
	var units []string
	for _, p := range paragraphs {
		if len(p) > 20 {
			units = append(units, p)
		}
	}

	var lectures []Lecture
	targetTotal := 36
	if isLab {
		targetTotal = 12
	}

	// If we couldn't parse units, just make one block
	if len(units) == 0 {
		units = []string{text}
	}

	lecturesPerUnit := targetTotal / len(units)
	if lecturesPerUnit == 0 {
		lecturesPerUnit = 1
	}

	lecIndex := 1
	for uIdx, unitText := range units {
		moduleName := fmt.Sprintf("Unit %d", uIdx+1)
		parts := strings.SplitN(unitText, ":", 2)
		if len(parts) == 2 && len(parts[0]) < 50 {
			moduleName = strings.TrimSpace(parts[0])
			unitText = parts[1]
		}

		subParts := strings.Split(unitText, ",")
		var topics []string
		for _, sp := range subParts {
			// further split by "and" or "."
			sp = strings.ReplaceAll(sp, ".", "")
			clean := strings.TrimSpace(sp)
			if len(clean) > 3 {
				topics = append(topics, clean)
			}
		}
		if len(topics) == 0 {
			topics = []string{"General Concepts"}
		}

		for i := 0; i < lecturesPerUnit && lecIndex <= targetTotal; i++ {
			topicIdx := i % len(topics)
			bloom := "L3_APPLY"
			if lecIndex > targetTotal/2 {
				bloom = "L4_ANALYZE"
			}

			prereq := fmt.Sprintf("%d", lecIndex-1)
			if lecIndex == 1 {
				prereq = "None"
			}

			lectures = append(lectures, Lecture{
				Module:    moduleName,
				Num:       lecIndex,
				Title:     topics[topicIdx],
				Subtopics: fmt.Sprintf("%s concepts in %s", topics[topicIdx], moduleName),
				Bloom:     bloom,
				Prereq:    prereq,
				IsLab:     isLab,
			})
			lecIndex++
		}
	}

	// Fill any remainder
	for lecIndex <= targetTotal {
		lectures = append(lectures, Lecture{
			Module:    "Advanced Topics",
			Num:       lecIndex,
			Title:     fmt.Sprintf("Advanced %s %d", subjectName, lecIndex),
			Subtopics: "Capstone synthesis",
			Bloom:     "L6_CREATE",
			Prereq:    fmt.Sprintf("%d", lecIndex-1),
			IsLab:     isLab,
		})
		lecIndex++
	}

	courseOutcomes := []string{
		"CO1: Understand the primary concepts specified in the R24 syllabus.",
		"CO2: Apply mathematical models to solve relevant engineering problems.",
		"CO3: Analyze performance characteristics using appropriate tools.",
		"CO4: Synthesize solutions for complex scenarios based on course modules.",
		"CO5: Evaluate advanced topics and modern implementations.",
	}
	return lectures, courseOutcomes
}

func (a *SyllabusStructureAgent) generateCustomLectures(codeNorm, nameUpper, subjectName string, isLab bool) []Lecture {
	cat := a.matchCategory(codeNorm, nameUpper, subjectName)
	switch cat {
	case "circuits":
		return a.generateLectures_circuits(subjectName, isLab)
	case "analog":
		return a.generateLectures_analog(subjectName, isLab)
	case "digital":
		return a.generateLectures_digital(subjectName, isLab)
	case "machines":
		return a.generateLectures_machines(subjectName, isLab)
	case "control":
		return a.generateLectures_control(subjectName, isLab)
	case "power_systems":
		return a.generateLectures_power_systems(subjectName, isLab)
	case "power_electronics":
		return a.generateLectures_power_electronics(subjectName, isLab)
	case "drives":
		return a.generateLectures_drives(subjectName, isLab)
	case "dsp":
		return a.generateLectures_dsp(subjectName, isLab)
	case "measurements":
		return a.generateLectures_measurements(subjectName, isLab)
	case "embedded":
		return a.generateLectures_embedded(subjectName, isLab)
	case "iot":
		return a.generateLectures_iot(subjectName, isLab)
	case "renewable":
		return a.generateLectures_renewable(subjectName, isLab)
	case "ml":
		return a.generateLectures_ml(subjectName, isLab)
	case "deep_learning":
		return a.generateLectures_deep_learning(subjectName, isLab)
	case "soft_computing":
		return a.generateLectures_soft_computing(subjectName, isLab)
	case "data_structures":
		return a.generateLectures_data_structures(subjectName, isLab)
	case "programming":
		return a.generateLectures_programming(subjectName, isLab)
	case "signals":
		return a.generateLectures_signals(subjectName, isLab)
	case "calculus":
		return a.generateLectures_calculus(subjectName, isLab)
	case "matrices_ode":
		return a.generateLectures_matrices_ode(subjectName, isLab)
	case "complex_methods":
		return a.generateLectures_complex_methods(subjectName, isLab)
	case "ev":
		return a.generateLectures_ev(subjectName, isLab)
	case "protection":
		return a.generateLectures_protection(subjectName, isLab)
	case "automation":
		return a.generateLectures_automation(subjectName, isLab)
	case "energy_management":
		return a.generateLectures_energy_management(subjectName, isLab)
	case "power_quality":
		return a.generateLectures_power_quality(subjectName, isLab)
	default:
		return a.generateLectures_circuits(subjectName, isLab) // default fallback
	}
}

func (a *SyllabusStructureAgent) matchCategory(codeNorm, nameUpper, subjectName string) string {
	codeToCat := map[string]string{
		"EE1011": "circuits", "EE1031": "circuits", "EE2022": "circuits",
		"EE1021": "analog", "EE2012": "analog",
		"EE2041": "digital",
		"EE2021": "machines", "EE2051": "machines", "EE3701": "machines", "EE4631": "machines",
		"EE2061": "control", "EE3601": "control", "EE2042": "control",
		"EE2031": "power_systems", "EE2071": "power_systems", "EE3651": "power_systems", "EE3711": "power_systems", "EE3731": "power_systems", "EE4621": "power_systems",
		"EE3011": "power_electronics", "EE3661": "power_electronics", "EE3741": "power_electronics", "EE3681": "power_electronics", "EE3012": "power_electronics",
		"EE3041": "drives", "EE3032": "drives",
		"EE3621": "dsp",
		"EE2011": "measurements",
		"EE3031": "embedded", "EE3022": "embedded",
		"EE2601": "iot",
		"EE2611": "renewable", "EE3611": "renewable", "EE2062": "renewable",
		"CS601": "ml", "EE2621": "ml",
		"EE3691": "deep_learning",
		"EE3631": "soft_computing",
		"CS2101": "data_structures",
		"CS1031": "programming",
		"EC1521": "signals",
		"MA1011": "calculus",
		"MA1021": "matrices_ode",
		"MA2051": "complex_methods", "MA2092": "complex_methods",
		"EE3641": "ev", "EE3721": "ev",
		"EE3021": "protection",
		"EE3671": "automation",
		"EE4601": "energy_management",
		"EE4611": "power_quality",
	}

	for k, v := range codeToCat {
		if strings.Contains(codeNorm, k) {
			return v
		}
	}

	// Fallback to keyword matching
	if strings.Contains(nameUpper, "CIRCUIT") || strings.Contains(nameUpper, "NETWORK") {
		return "circuits"
	}
	if strings.Contains(nameUpper, "ANALOG") {
		return "analog"
	}
	if strings.Contains(nameUpper, "DIGITAL ELECTRONICS") {
		return "digital"
	}
	if strings.Contains(nameUpper, "MACHINE") || strings.Contains(nameUpper, "TRANSFORMER") {
		return "machines"
	}
	if strings.Contains(nameUpper, "CONTROL") {
		return "control"
	}
	if strings.Contains(nameUpper, "POWER SYSTEM") || strings.Contains(nameUpper, "TRANSMISSION") {
		return "power_systems"
	}
	if strings.Contains(nameUpper, "POWER ELECTRONICS") || strings.Contains(nameUpper, "CONVERTER") {
		return "power_electronics"
	}
	if strings.Contains(nameUpper, "DRIVE") {
		return "drives"
	}
	if strings.Contains(nameUpper, "SIGNAL PROCESSING") || strings.Contains(nameUpper, "DSP") {
		return "dsp"
	}
	if strings.Contains(nameUpper, "MEASUREMENT") || strings.Contains(nameUpper, "INSTRUMENTATION") {
		return "measurements"
	}
	if strings.Contains(nameUpper, "EMBEDDED") || strings.Contains(nameUpper, "MICROCONTROLLER") {
		return "embedded"
	}
	if strings.Contains(nameUpper, "INTERNET OF THINGS") || strings.Contains(nameUpper, "IOT") {
		return "iot"
	}
	if strings.Contains(nameUpper, "RENEWABLE") || strings.Contains(nameUpper, "SOLAR") || strings.Contains(nameUpper, "WIND") {
		return "renewable"
	}
	if strings.Contains(nameUpper, "MACHINE LEARNING") {
		return "ml"
	}
	if strings.Contains(nameUpper, "DEEP LEARNING") {
		return "deep_learning"
	}
	if strings.Contains(nameUpper, "SOFT COMPUTING") {
		return "soft_computing"
	}
	if strings.Contains(nameUpper, "DATA STRUCTURE") {
		return "data_structures"
	}
	if strings.Contains(nameUpper, "PROGRAMMING") {
		return "programming"
	}
	if strings.Contains(nameUpper, "SIGNAL") {
		return "signals"
	}
	if strings.Contains(nameUpper, "CALCULUS") {
		return "calculus"
	}
	if strings.Contains(nameUpper, "MATRIX") || strings.Contains(nameUpper, "ODE") {
		return "matrices_ode"
	}
	if strings.Contains(nameUpper, "COMPLEX") || strings.Contains(nameUpper, "NUMERICAL") {
		return "complex_methods"
	}
	if strings.Contains(nameUpper, "ELECTRIC VEHICLE") || strings.Contains(nameUpper, "EV ") {
		return "ev"
	}
	if strings.Contains(nameUpper, "PROTECTION") {
		return "protection"
	}
	if strings.Contains(nameUpper, "AUTOMATION") || strings.Contains(nameUpper, "PLC") {
		return "automation"
	}
	if strings.Contains(nameUpper, "ENERGY MANAGEMENT") {
		return "energy_management"
	}
	if strings.Contains(nameUpper, "POWER QUALITY") {
		return "power_quality"
	}

	return "circuits"
}
func (a *SyllabusStructureAgent) generateLectures_circuits(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "V-I Characteristics",
			Subtopics: "Voltage, current, linearity",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Verification of KVL & KCL",
			Subtopics: "Node equations, mesh, breadboard",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Superposition Theorem Verification",
			Subtopics: "Linearity, multiple sources",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Thevenin's Theorem Verification",
			Subtopics: "Vth, Rth, load variations",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Maximum Power Transfer",
			Subtopics: "Impedance matching, efficiency",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "RC Transient Response",
			Subtopics: "Step response, time constant",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "RL Transient Response",
			Subtopics: "Inductive kick, step response",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "RLC Series Resonance",
			Subtopics: "Bandwidth, Q-factor, resonant freq",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "RLC Parallel Resonance",
			Subtopics: "Tank circuit, dynamic impedance",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Z & Y Parameters",
			Subtopics: "Two-port, open/short circuit",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "ABCD Parameters",
			Subtopics: "Transmission line model, cascade",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "SPICE Simulation of Circuits",
			Subtopics: "AC sweep, transient analysis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Charge, Current, Voltage & Power",
			Subtopics: "Charge conservation, Energy, Active/Passive elements",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Ohm's Law & Kirchhoff's Laws",
			Subtopics: "KVL, KCL, Node equations, Mesh equations",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Network Elements & Sources",
			Subtopics: "Resistors, Inductors, Capacitors, Dependent Sources",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Series & Parallel Connections",
			Subtopics: "Voltage division, Current division, Source transformation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Nodal Analysis Fundamentals",
			Subtopics: "Reference node, conductance matrix, supernode",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Mesh Analysis Fundamentals",
			Subtopics: "Loop currents, resistance matrix, supermesh",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Graph Theory Fundamentals",
			Subtopics: "Trees, cotrees, incidence matrix",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Tie-Set & Cut-Set Matrices",
			Subtopics: "Fundamental loops, cut-sets, KCL/KVL formulation",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Superposition & Linearity",
			Subtopics: "Homogeneity, additivity, power calculations",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Thevenin's Theorem",
			Subtopics: "Open circuit voltage, Thevenin resistance, Equivalent circuit",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Norton's Theorem",
			Subtopics: "Short circuit current, Norton equivalent, Duals",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Maximum Power Transfer Theorem",
			Subtopics: "Load matching, source resistance, derivative optimization",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Reciprocity & Millman's Theorems",
			Subtopics: "Bilateral networks, parallel voltage sources",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Compensation & Tellegen's Theorems",
			Subtopics: "Substitution, power conservation, topology",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "First-Order RC Circuits",
			Subtopics: "Transient response, time constant, natural/forced response",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "First-Order RL Circuits",
			Subtopics: "Inductor current, time constant, step response",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Second-Order RLC Circuits",
			Subtopics: "Series RLC, parallel RLC, differential equations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Damping & Transient Behaviors",
			Subtopics: "Underdamped, critically damped, overdamped, overshoot",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Sinusoidal Steady-State Analysis",
			Subtopics: "Sinusoids, phasors, complex impedance, admittance",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Phasor Diagrams & Relations",
			Subtopics: "Leading/lagging, phase shifts, V-I vectors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "AC Power Analysis",
			Subtopics: "Real, reactive, apparent power, Power factor",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Power Factor Correction",
			Subtopics: "Capacitor banks, reactive power compensation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Series Resonance",
			Subtopics: "Resonant frequency, bandwidth, quality factor",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Parallel Resonance",
			Subtopics: "Tank circuits, dynamic impedance, magnification",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Magnetically Coupled Circuits",
			Subtopics: "Mutual inductance, dot convention, coupling coefficient",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Ideal & Linear Transformers",
			Subtopics: "Turns ratio, impedance reflection, isolation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Two-Port Networks Introduction",
			Subtopics: "Port definition, driving point/transfer impedance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Z and Y Parameters",
			Subtopics: "Open-circuit impedance, short-circuit admittance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Transmission (ABCD) Parameters",
			Subtopics: "Cascade connection, forward V/I ratio",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Hybrid (h) Parameters",
			Subtopics: "Transistor modeling, series-parallel combinations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Interconnection of Two-Port Networks",
			Subtopics: "Series, parallel, cascade connections",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Network Synthesis Basics",
			Subtopics: "Hurwitz polynomials, positive real functions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Driving Point Synthesis (LC)",
			Subtopics: "Foster forms, Cauer forms, reactance functions",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Driving Point Synthesis (RC & RL)",
			Subtopics: "Foster I & II, Cauer I & II",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Filter Fundamentals",
			Subtopics: "Low-pass, high-pass, attenuation, characteristic impedance",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Active vs Passive Filters",
			Subtopics: "Op-amp realizations, Butterworth approximations",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_analog(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "PN Junction Diode V-I",
			Subtopics: "Forward bias, reverse bias, breakdown",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Zener Diode Characteristics",
			Subtopics: "Voltage regulation, Zener breakdown",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Half-Wave & Full-Wave Rectifiers",
			Subtopics: "Ripple factor, efficiency, filters",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "BJT Input/Output Characteristics",
			Subtopics: "CE configuration, active region, cutoff",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "BJT Biasing & Q-Point",
			Subtopics: "Voltage divider bias, stability factor",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "MOSFET Drain/Transfer Curves",
			Subtopics: "Threshold voltage, transconductance",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "BJT CE Amplifier",
			Subtopics: "Voltage gain, bandwidth, input impedance",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Op-Amp Inverting & Non-Inverting",
			Subtopics: "Gain, feedback, offset nulling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Op-Amp Integrator & Differentiator",
			Subtopics: "Waveform shaping, frequency limits",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Active Low-Pass & High-Pass Filters",
			Subtopics: "Cutoff frequency, roll-off, Bode plot",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "RC Phase Shift Oscillator",
			Subtopics: "Barkhausen criterion, sine wave generation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Class B Push-Pull Amplifier",
			Subtopics: "Crossover distortion, power efficiency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Semiconductor Physics Basics",
			Subtopics: "Electrons, holes, drift/diffusion currents",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "PN Junction Diode Operation",
			Subtopics: "Depletion region, built-in potential, diode equation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Diode Equivalent Circuits",
			Subtopics: "Ideal, piecewise linear, dynamic resistance",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Zener Diodes & Special Diodes",
			Subtopics: "Voltage regulation, varactor, tunnel diode",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Rectifier Circuits",
			Subtopics: "Half-wave, full-wave, bridge, ripple factor",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Filter Circuits for Power Supplies",
			Subtopics: "Capacitor, inductor, LC, Pi filters",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Clippers and Clampers",
			Subtopics: "Wave shaping, limiting, DC restoration",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Bipolar Junction Transistor (BJT)",
			Subtopics: "NPN, PNP, active, saturation, cutoff",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "BJT Biasing Techniques",
			Subtopics: "Fixed bias, emitter bias, voltage divider",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "BJT Small-Signal Modeling",
			Subtopics: "Hybrid-pi model, re model, h-parameters",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Common Emitter Amplifier",
			Subtopics: "Voltage gain, current gain, input/output impedance",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Common Base & Common Collector",
			Subtopics: "Voltage buffer, current buffer, impedance matching",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Field Effect Transistors (JFET)",
			Subtopics: "Construction, pinch-off, transfer curve",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "MOSFET Basics & Biasing",
			Subtopics: "Enhancement, depletion, threshold voltage",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "MOSFET Small-Signal Analysis",
			Subtopics: "Transconductance, common-source amplifier",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "High-Frequency Response of BJT/MOSFET",
			Subtopics: "Miller effect, parasitic capacitances, cutoff frequency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Multistage Amplifiers",
			Subtopics: "Cascade, cascode, Darlington pair",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Feedback Amplifiers Concept",
			Subtopics: "Positive/negative feedback, gain desensitivity",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Topologies of Negative Feedback",
			Subtopics: "Voltage-series, voltage-shunt, current-series",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Stability & Oscillators",
			Subtopics: "Barkhausen criterion, Nyquist plot, gain margin",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "RC Oscillators",
			Subtopics: "Phase shift, Wien bridge, frequency of oscillation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "LC & Crystal Oscillators",
			Subtopics: "Colpitts, Hartley, quartz crystal resonance",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Power Amplifiers Classification",
			Subtopics: "Class A, B, AB, C, efficiency limits",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Push-Pull & Tuned Amplifiers",
			Subtopics: "Crossover distortion, resonant loads",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Operational Amplifiers (Op-Amps)",
			Subtopics: "Ideal characteristics, virtual ground, CMRR",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Linear Op-Amp Applications",
			Subtopics: "Inverting, non-inverting, summing, difference",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Integrators & Differentiators",
			Subtopics: "Frequency response, practical limitations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Instrumentation Amplifiers",
			Subtopics: "High CMRR, transducer interfacing, 3-op-amp design",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Comparators & Schmitt Triggers",
			Subtopics: "Zero-crossing detector, hysteresis, noise immunity",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Active Filters (1st & 2nd Order)",
			Subtopics: "Butterworth, Sallen-Key, LPF, HPF",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Bandpass, Bandstop & All-Pass Filters",
			Subtopics: "Q-factor, center frequency, phase shift",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Waveform Generators",
			Subtopics: "Square wave, triangular wave, astable multivibrator",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "555 Timer IC & Applications",
			Subtopics: "Monostable, astable, VCO, PWM",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Phase-Locked Loops (PLL)",
			Subtopics: "VCO, phase detector, capture range, lock range",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Analog-to-Digital Converters (ADC)",
			Subtopics: "Flash, SAR, dual-slope, quantization noise",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Digital-to-Analog Converters (DAC)",
			Subtopics: "R-2R ladder, weighted resistor, resolution",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_digital(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Logic Gates Verification",
			Subtopics: "AND, OR, NOT, NAND, NOR, XOR",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Universal Gates Implementation",
			Subtopics: "NAND/NOR equivalence, De Morgan's",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Adders and Subtractors",
			Subtopics: "Half/Full adder, 4-bit parallel adder",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Multiplexers & Demultiplexers",
			Subtopics: "Data routing, function realization",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Encoders and Decoders",
			Subtopics: "BCD to 7-segment, priority encoder",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Flip-Flop Truth Tables",
			Subtopics: "SR, JK, D, T, clock triggering",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Shift Registers",
			Subtopics: "SISO, SIPO, PISO, PIPO, ring counter",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Asynchronous Counters",
			Subtopics: "Ripple counter, mod-N design, delay",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Synchronous Counters",
			Subtopics: "State table, excitation table, up/down",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Finite State Machine Design",
			Subtopics: "Sequence detector, Mealy/Moore models",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Memory Interfacing Basics",
			Subtopics: "RAM/ROM read/write, address decoding",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "VHDL/Verilog Simulation",
			Subtopics: "Gate level modeling, testbenches",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Number Systems & Base Conversions",
			Subtopics: "Binary, Octal, Hexadecimal, Decimal",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Signed Numbers & Complements",
			Subtopics: "1's/2's complement, sign-magnitude, arithmetic",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Binary Codes",
			Subtopics: "BCD, Gray, Excess-3, ASCII, Parity",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Boolean Algebra Theorems",
			Subtopics: "De Morgan's laws, duality, consensus theorem",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Logic Gates & Universal Gates",
			Subtopics: "AND, OR, NOT, NAND, NOR, XOR, XNOR",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Sum of Products & Product of Sums",
			Subtopics: "Minterms, maxterms, canonical forms",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Karnaugh Maps (up to 4 variables)",
			Subtopics: "Implicants, prime implicants, grouping",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Advanced K-Map Minimization",
			Subtopics: "5-variable K-maps, don't care conditions",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Quine-McCluskey Method",
			Subtopics: "Tabular minimization, prime implicant chart",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Combinational Logic Design",
			Subtopics: "Design procedure, gate-level implementation",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Adders and Subtractors",
			Subtopics: "Half, full, ripple carry, look-ahead carry",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Multipliers & Magnitude Comparators",
			Subtopics: "Binary multiplier, 4-bit comparator (7485)",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Decoders & Encoders",
			Subtopics: "Address decoding, priority encoders, BCD-to-7-segment",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Multiplexers (Data Selectors)",
			Subtopics: "Function realization using MUX, tree structure",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Demultiplexers & Parity Generators",
			Subtopics: "Data routing, error detection basics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Hazards in Combinational Circuits",
			Subtopics: "Static/dynamic hazards, hazard-free design",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Sequential Logic Fundamentals",
			Subtopics: "Latches, flip-flops, clocking, setup/hold times",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "SR & D Flip-Flops",
			Subtopics: "Characteristic equations, excitation tables",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "JK & T Flip-Flops",
			Subtopics: "Race-around condition, master-slave configuration",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Registers & Shift Registers",
			Subtopics: "SISO, SIPO, PISO, PIPO, universal shift register",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Applications of Shift Registers",
			Subtopics: "Ring counter, Johnson counter, PRBS generator",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Asynchronous (Ripple) Counters",
			Subtopics: "Up/down counters, Mod-N counters, propagation delay",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Synchronous Counters",
			Subtopics: "Design procedure, state diagrams, excitation tables",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Advanced Counter Design",
			Subtopics: "Arbitrary sequence counters, lock-out, self-starting",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Finite State Machines (FSM)",
			Subtopics: "Mealy and Moore models, state representation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "FSM State Reduction & Assignment",
			Subtopics: "Implication table, equivalent states, state coding",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Algorithmic State Machines (ASM)",
			Subtopics: "ASM charts, data path, control logic design",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Logic Families Characteristics",
			Subtopics: "Propagation delay, fan-in/fan-out, noise margin",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "TTL & CMOS Logic Families",
			Subtopics: "Totem-pole output, open-collector, CMOS inverter",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Interfacing Logic Families",
			Subtopics: "TTL to CMOS, CMOS to TTL, voltage levels",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Semiconductor Memories",
			Subtopics: "ROM, RAM, SRAM vs DRAM, memory cells",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Programmable Logic Devices (PLD)",
			Subtopics: "PROM, PLA, PAL, logic implementation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Complex PLDs & FPGAs",
			Subtopics: "CPLD architecture, FPGA LUTs, routing channels",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Hardware Description Languages",
			Subtopics: "VHDL/Verilog basics, entities, architectures",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Dataflow & Behavioral Modeling",
			Subtopics: "Concurrent assignments, process blocks, sensitivity list",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Digital System Testing",
			Subtopics: "Stuck-at faults, test pattern generation, JTAG",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_machines(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "OCC of DC Shunt Generator",
			Subtopics: "Critical resistance, critical speed, magnetization",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Load Test on DC Shunt Motor",
			Subtopics: "Efficiency, torque-speed curve, output power",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Speed Control of DC Motor",
			Subtopics: "Armature control, field control, Ward-Leonard",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Swinburne's Test",
			Subtopics: "No-load losses, efficiency pre-determination",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "OC & SC Tests on 1-Phase Transformer",
			Subtopics: "Equivalent circuit parameters, efficiency, regulation",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Sumpner's Test",
			Subtopics: "Back-to-back test, temperature rise, full-load efficiency",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Scott Connection of Transformers",
			Subtopics: "3-phase to 2-phase conversion, load balancing",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "No-Load & Blocked Rotor Tests on IM",
			Subtopics: "Circle diagram, equivalent circuit, slip",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Brake Test on 3-Phase Induction Motor",
			Subtopics: "Torque-slip characteristics, efficiency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "V & Inverted V Curves of Synchronous Motor",
			Subtopics: "Excitation variation, power factor correction",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Regulation of Alternator (EMF/MMF Method)",
			Subtopics: "Synchronous impedance, voltage drop",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Slip Test on Salient Pole Alternator",
			Subtopics: "Xd, Xq determination, reluctance torque",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Magnetic Circuits Fundamentals",
			Subtopics: "MMF, reluctance, flux, Ampere's Law",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Electromagnetic Induction",
			Subtopics: "Faraday's Law, Lenz's Law, statically/dynamically induced EMF",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Energy Conversion Principles",
			Subtopics: "Electromechanical energy, co-energy, singly/multiply excited",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "DC Generator Construction & Principle",
			Subtopics: "Commutator, armature, field windings, yoke",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Armature Windings",
			Subtopics: "Lap, wave windings, equalizer rings, dummy coils",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "EMF Equation & Types of DC Generators",
			Subtopics: "Shunt, series, compound, separately excited",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Armature Reaction in DC Machines",
			Subtopics: "Cross-magnetizing, demagnetizing, compensating windings",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Commutation Process",
			Subtopics: "Reactance voltage, interpoles, brush shift",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "DC Motor Principle & Torque Equation",
			Subtopics: "Back EMF, driving torque, load matching",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Characteristics of DC Motors",
			Subtopics: "Speed-torque, current-torque, application suitability",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Speed Control of DC Motors",
			Subtopics: "Flux control, armature voltage control, Ward-Leonard",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Starting & Testing of DC Motors",
			Subtopics: "3-point/4-point starters, Swinburne's, Hopkinson's test",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Single-Phase Transformer Principle",
			Subtopics: "Ideal transformer, EMF equation, phasor diagram",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Practical Transformer Equivalent Circuit",
			Subtopics: "Leakage reactance, core loss, exact/approx equivalent",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Transformer Testing",
			Subtopics: "OC test, SC test, Sumpner's test, polarity test",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Voltage Regulation & Efficiency",
			Subtopics: "All-day efficiency, condition for max efficiency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Auto-Transformers",
			Subtopics: "Copper saving, equivalent circuit, step-up/down",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Three-Phase Transformers",
			Subtopics: "Star/Delta connections, vector groups, phasing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Parallel Operation of Transformers",
			Subtopics: "Load sharing, circulating current, V-connection",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Three-Phase Induction Motor Principle",
			Subtopics: "Rotating magnetic field, slip, rotor frequency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Induction Motor Equivalent Circuit",
			Subtopics: "Stator/rotor parameters, mechanical load equivalent",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Torque-Slip Characteristics",
			Subtopics: "Starting torque, max torque, operating region",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Testing of Induction Motors",
			Subtopics: "No-load test, blocked rotor test, circle diagram",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Starting Methods of 3-Ph IM",
			Subtopics: "DOL, star-delta, auto-transformer, rotor resistance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Speed Control of 3-Ph IM",
			Subtopics: "V/f control, pole changing, cascade connection",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Single-Phase Induction Motors",
			Subtopics: "Double revolving field theory, split-phase, capacitor start",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Synchronous Generator (Alternator) Principle",
			Subtopics: "Pitch factor, distribution factor, EMF equation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Armature Reaction in Alternators",
			Subtopics: "Power factor effect, synchronous impedance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Voltage Regulation Methods",
			Subtopics: "EMF, MMF, ZPF (Potier), ASA methods",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Salient Pole Alternators",
			Subtopics: "Two-reaction theory, Xd, Xq, slip test",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Parallel Operation of Alternators",
			Subtopics: "Synchronization, infinite bus, load sharing",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Synchronous Motor Principle",
			Subtopics: "Starting methods, damper windings, synchronous speed",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Synchronous Motor Characteristics",
			Subtopics: "V-curves, inverted V-curves, power factor correction",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Power Flow in Synchronous Machines",
			Subtopics: "Power angle equation, reluctance power, stability limit",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Special Electrical Machines",
			Subtopics: "Stepper motors, BLDC motors, switched reluctance",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Universal & Repulsion Motors",
			Subtopics: "AC series motor, commutation, applications",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_control(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Transfer Function of DC Motor",
			Subtopics: "Armature/field control, step response",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Effect of Feedback on DC Servomotor",
			Subtopics: "Open loop vs closed loop, error analysis",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Characteristics of AC Servomotor",
			Subtopics: "Torque-speed curve, two-phase operation",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Synchro Transmitter-Receiver",
			Subtopics: "Error detector, angular position tracking",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Time Response of 2nd Order System",
			Subtopics: "RLC circuit, damping ratio, natural frequency",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "P, PI, PD, PID Controller Tuning",
			Subtopics: "Zeigler-Nichols, step response optimization",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Root Locus Plot using MATLAB",
			Subtopics: "Pole-zero variation, stability limits",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Bode Plot Analysis",
			Subtopics: "Gain margin, phase margin, frequency response",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Nyquist Stability Plot",
			Subtopics: "Encirclements, absolute/relative stability",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "State Space Model Simulation",
			Subtopics: "Controllability, observability matrices",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Lead-Lag Compensator Design",
			Subtopics: "Phase advance/retard, frequency domain tuning",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Simulation of Non-Linear Systems",
			Subtopics: "Dead zone, saturation, phase plane trajectories",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Control Systems",
			Subtopics: "Open-loop, closed-loop, historical evolution",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Mathematical Modeling of Physical Systems",
			Subtopics: "Mechanical, electrical, electromechanical analogies",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Transfer Function Concept",
			Subtopics: "Laplace transform application, impulse response",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Block Diagram Reduction",
			Subtopics: "Cascade, parallel, feedback loops, summing points",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Signal Flow Graphs",
			Subtopics: "Mason's Gain Formula, nodes, branches, loops",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Modeling of DC and AC Servomotors",
			Subtopics: "Armature control, field control, torque-speed",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Time Domain Analysis Fundamentals",
			Subtopics: "Standard test signals, steady-state error",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "First Order System Response",
			Subtopics: "Time constant, step/ramp response",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Second Order System Response",
			Subtopics: "Damping ratio, natural frequency, transient specs",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Error Analysis & Static Error Constants",
			Subtopics: "Kp, Kv, Ka, dynamic error coefficients",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Stability Concepts in Time Domain",
			Subtopics: "BIBO stability, asymptotic stability, poles location",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Routh-Hurwitz Criterion",
			Subtopics: "Characteristic equation, array formulation, marginal stability",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Root Locus Technique Fundamentals",
			Subtopics: "Angle and magnitude criteria, locus branches",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Construction Rules of Root Locus",
			Subtopics: "Asymptotes, breakaway points, imaginary axis crossing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Effect of Adding Poles & Zeros",
			Subtopics: "Root locus shifting, transient response impact",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Frequency Domain Analysis Intro",
			Subtopics: "Frequency response specifications, resonance peak",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Bode Plots Formulation",
			Subtopics: "Magnitude/phase plots, corner frequencies, asymptotic approx",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Gain & Phase Margins from Bode Plots",
			Subtopics: "Relative stability, crossover frequencies",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Polar Plots & Nyquist Path",
			Subtopics: "Mapping contours, conformal mapping basics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Nyquist Stability Criterion",
			Subtopics: "Encirclements of (-1, j0), absolute stability",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Closed-Loop Frequency Response",
			Subtopics: "M and N circles, Nichols chart",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Compensator Design Overview",
			Subtopics: "Lead, lag, lead-lag compensation networks",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Lead Compensator Design",
			Subtopics: "Phase advance, Bode plot method, bandwidth extension",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Lag Compensator Design",
			Subtopics: "Steady-state improvement, phase retardation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "PID Controllers Introduction",
			Subtopics: "Proportional, integral, derivative action",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Tuning of PID Controllers",
			Subtopics: "Ziegler-Nichols rules, Cohen-Coon, practical tuning",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "State Variable Approach Basics",
			Subtopics: "State variables, state equations, output equations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "State Space vs Transfer Function",
			Subtopics: "Canonical forms, diagonal/Jordan forms",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Solution of State Equations",
			Subtopics: "State transition matrix, Laplace and time domain",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Controllability & Observability",
			Subtopics: "Kalman's test, Gilbert's test, duality",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Pole Placement by State Feedback",
			Subtopics: "Ackermann's formula, closed-loop eigenvalues",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "State Observers Design",
			Subtopics: "Full-order observer, Luenberger observer, separation principle",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Non-Linear Systems Introduction",
			Subtopics: "Types of non-linearities, saturation, backlash",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Phase Plane Analysis",
			Subtopics: "Singular points, trajectories, limit cycles",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Describing Function Analysis",
			Subtopics: "Fundamental harmonic approximation, stability analysis",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Lyapunov Stability Theorems",
			Subtopics: "Positive definite functions, direct method, asymptotic stability",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_power_systems(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Characteristics of IDMT Relay",
			Subtopics: "Overcurrent, time multiplier, pick-up current",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Differential Protection of Transformer",
			Subtopics: "Percentage bias, circulating current, fault simulation",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Distance Relay Characteristics",
			Subtopics: "Impedance relay, mho relay, reach measurement",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Transmission Line Parameters Simulation",
			Subtopics: "ABCD constants, Ferranti effect, voltage profile",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "String Efficiency of Insulators",
			Subtopics: "Voltage distribution, guard ring impact",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Symmetrical Fault Analysis",
			Subtopics: "3-phase short circuit, subtransient reactance",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Unsymmetrical Fault Analysis",
			Subtopics: "LG, LL, LLG faults, sequence components",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Gauss-Seidel Load Flow",
			Subtopics: "Y-bus formation, slack/PQ/PV buses, iterations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Newton-Raphson Load Flow",
			Subtopics: "Jacobian matrix, convergence, power mismatch",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Transient Stability Analysis",
			Subtopics: "Swing equation, critical clearing time, RK method",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Load Frequency Control (Single Area)",
			Subtopics: "Droop characteristics, integral control, tie-line",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Economic Dispatch Simulation",
			Subtopics: "Penalty factors, incremental fuel cost, B-coefficients",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Structure of Power Systems",
			Subtopics: "Generation, transmission, distribution, grid layout",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Transmission Line Parameters (R & L)",
			Subtopics: "Skin effect, proximity effect, inductance of 1-ph/3-ph",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Transmission Line Capacitance",
			Subtopics: "Electric field, GMD, GMR, bundled conductors",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Performance of Short & Medium Lines",
			Subtopics: "Nominal T, Nominal Pi, ABCD parameters",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Performance of Long Lines",
			Subtopics: "Rigorous solution, surge impedance loading (SIL)",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Ferranti Effect & Corona",
			Subtopics: "Voltage rise on no-load, corona discharge, visual/critical voltage",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Mechanical Design of Lines",
			Subtopics: "Sag and tension, ice/wind loading, stringing chart",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Overhead Line Insulators",
			Subtopics: "Pin, suspension, strain insulators, string efficiency",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Underground Cables",
			Subtopics: "Types, dielectric stress, capacitance, grading of cables",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Per-Unit System",
			Subtopics: "Base values, per-unit impedance diagram, advantages",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Symmetrical Fault Analysis",
			Subtopics: "Thevenin's equivalent, short circuit capacity, reactor sizing",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Symmetrical Components",
			Subtopics: "Positive, negative, zero sequence networks",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Sequence Impedances of Equipment",
			Subtopics: "Generators, transformers, transmission lines",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Unsymmetrical Faults: LG & LL",
			Subtopics: "Sequence network interconnection, fault current derivation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Unsymmetrical Faults: LLG Faults",
			Subtopics: "Open conductor faults, boundary conditions",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Load Flow Studies Introduction",
			Subtopics: "Bus classification, Y-bus matrix building algorithms",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Gauss-Seidel Method",
			Subtopics: "Iterative equations, acceleration factor, PV bus handling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Newton-Raphson Method",
			Subtopics: "Power mismatch equations, Jacobian elements, convergence",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Fast Decoupled Load Flow",
			Subtopics: "Approximations, B' and B'' matrices, speed vs accuracy",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Economic Operation of Power Systems",
			Subtopics: "Input-output curves, incremental cost, optimum scheduling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Transmission Loss Consideration",
			Subtopics: "B-coefficients, penalty factor, exact coordination equation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Load Frequency Control (LFC)",
			Subtopics: "Generator model, load model, prime mover dynamics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Single Area & Two Area LFC",
			Subtopics: "Tie-line bias control, Area Control Error (ACE)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Power System Stability Concepts",
			Subtopics: "Rotor angle, voltage, frequency stability, steady-state limits",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Swing Equation",
			Subtopics: "Inertia constant (H), per-unit swing dynamics",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Equal Area Criterion",
			Subtopics: "Transient stability limit, sudden load changes, faults",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Critical Clearing Angle & Time",
			Subtopics: "Numerical solution methods, step-by-step method",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Voltage Control Methods",
			Subtopics: "Tap-changing transformers, shunt capacitors, SVC",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Introduction to Protective Relays",
			Subtopics: "Primary/backup protection, zones, trip circuits",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Electromagnetic & Static Relays",
			Subtopics: "Overcurrent, directional, distance, differential",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Protection of Alternators & Transformers",
			Subtopics: "Stator faults, Buchholz relay, restricted earth fault",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Protection of Transmission Lines",
			Subtopics: "Carrier current protection, distance relaying zones",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Circuit Breakers Principle",
			Subtopics: "Arc interruption, recovery voltage, RRRV, current chopping",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Types of Circuit Breakers",
			Subtopics: "Air-blast, SF6, Vacuum, bulk/minimum oil",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Insulation Coordination",
			Subtopics: "BIL, surge arresters, lightning phenomena, shielding",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Smart Grids & Modern Trends",
			Subtopics: "PMUs, WAMS, microgrids, renewable integration",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_power_electronics(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "V-I Characteristics of SCR",
			Subtopics: "Holding/latching currents, forward breakover",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Triggering Circuits for SCR",
			Subtopics: "R, RC, UJT triggering, firing angle control",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Single-Phase Half Controlled Converter",
			Subtopics: "R/RL load, freewheeling diode, waveforms",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Single-Phase Fully Controlled Converter",
			Subtopics: "Continuous/discontinuous conduction, inversion",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Three-Phase Controlled Rectifier",
			Subtopics: "Six-pulse converter, ripple analysis, power factor",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "DC Jones Chopper/Buck Converter",
			Subtopics: "Duty cycle control, voltage/current ripple",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Boost/Buck-Boost Converter",
			Subtopics: "Step-up operation, inductor current profiling",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Single-Phase AC Voltage Controller",
			Subtopics: "Triac phase control, illumination/speed control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Single-Phase PWM Inverter",
			Subtopics: "Unipolar/bipolar PWM, harmonic spectrum",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Three-Phase Voltage Source Inverter",
			Subtopics: "180 and 120 degree conduction modes",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Cycloconverter Simulation",
			Subtopics: "Frequency step-down, interharmonics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Switched Mode Power Supply (SMPS)",
			Subtopics: "Flyback/Forward converter topology testing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Power Semiconductor Devices Intro",
			Subtopics: "Diodes, Thyristors, BJT, MOSFET, IGBT",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Silicon Controlled Rectifier (SCR)",
			Subtopics: "Two-transistor model, turn-on/turn-off mechanisms",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "SCR Static & Dynamic Characteristics",
			Subtopics: "di/dt, dv/dt protection, snubber circuits",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Gate Triggering Methods",
			Subtopics: "R, RC, UJT, pulse transformer isolation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Commutation Techniques",
			Subtopics: "Natural, forced commutation (Class A to F)",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Phase Controlled Rectifiers Intro",
			Subtopics: "Line commutation, firing angle, output voltage",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "1-Ph Half-Wave Rectifier",
			Subtopics: "R, RL loads, freewheeling diode effect",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "1-Ph Full-Wave Converters",
			Subtopics: "Mid-point, bridge type, continuous conduction",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Inverter Mode of Operation",
			Subtopics: "Line commutated inversion, overlap angle",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Effect of Source Inductance",
			Subtopics: "Voltage drop, overlap, commutation failure",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "3-Ph Half-Wave Converters",
			Subtopics: "Three-pulse operation, ripple frequency",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "3-Ph Fully Controlled Bridge",
			Subtopics: "Six-pulse, R/RL/RLE loads, input power factor",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Dual Converters",
			Subtopics: "Circulating, non-circulating modes, four-quadrant",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "DC-DC Converters (Choppers)",
			Subtopics: "Principle, step-down, step-up, duty cycle",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Chopper Control Strategies",
			Subtopics: "TRC, PWM, variable frequency, current limit",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Classes of Choppers",
			Subtopics: "Class A, B, C, D, E (Four-quadrant operation)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Buck Converter Analysis",
			Subtopics: "CCM/DCM, voltage ripple, inductor sizing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Boost Converter Analysis",
			Subtopics: "Voltage gain, right-half-plane zero, energy storage",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Buck-Boost & Cuk Converters",
			Subtopics: "Inverting output, isolated versions (Flyback/Forward)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Switched Mode Power Supplies",
			Subtopics: "Linear vs SMPS, magnetic design basics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Inverters Introduction",
			Subtopics: "Voltage Source (VSI) vs Current Source (CSI)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "1-Ph Half/Full Bridge Inverters",
			Subtopics: "Square wave operation, harmonics, RMS output",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "3-Ph Voltage Source Inverters",
			Subtopics: "180-degree and 120-degree conduction modes",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "PWM Techniques for Inverters",
			Subtopics: "Single, multiple, sinusoidal PWM (SPWM)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Advanced PWM & Harmonics",
			Subtopics: "Space Vector PWM (SVPWM), harmonic elimination",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Current Source Inverters (CSI)",
			Subtopics: "Auto-sequential commutated inverter, load commutation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "AC Voltage Controllers",
			Subtopics: "ON-OFF control, phase control, Triac-Diac applications",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "1-Ph AC Voltage Controllers",
			Subtopics: "R and RL loads, harmonic analysis, power factor",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "3-Ph AC Voltage Controllers",
			Subtopics: "Star/Delta loads, sequencing",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Cycloconverters",
			Subtopics: "Step-up, step-down, blocking mode, circulating current",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Matrix Converters",
			Subtopics: "Direct AC-AC conversion, bi-directional switches",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Resonant Converters Introduction",
			Subtopics: "ZVS, ZCS, switching loss reduction",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Power Quality & Active Filters",
			Subtopics: "Harmonics mitigation, IEEE 519 standards",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Power Electronics for Renewables",
			Subtopics: "Solar PV MPPT, wind turbine grid interfacing",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "HVDC Transmission & FACTS",
			Subtopics: "Thyristor valves, SVC, STATCOM, UPFC",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Thermal Design of PE Converters",
			Subtopics: "Heat sink sizing, thermal resistance, packaging",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_drives(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Speed Control of DC Motor using Chopper",
			Subtopics: "Four-quadrant operation, duty cycle",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "1-Ph Fully Controlled DC Drive",
			Subtopics: "Continuous/discontinuous modes, speed-torque",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "3-Ph Fully Controlled DC Drive",
			Subtopics: "Six-pulse ripple, heavy load starting",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Dual Converter Fed DC Drive",
			Subtopics: "Reversing, regenerative braking, circulating current",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "V/f Control of 3-Ph Induction Motor",
			Subtopics: "Constant flux operation, starting torque",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Stator Voltage Control of IM",
			Subtopics: "AC voltage controller, fan load matching",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Slip Power Recovery Scheme",
			Subtopics: "Static Kramer drive, sub-synchronous speed",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Rotor Resistance Control",
			Subtopics: "Slip ring motor, torque speed characteristic shift",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Vector Control/FOC Simulation",
			Subtopics: "Clarke/Park transforms, d-q axis decoupling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Direct Torque Control (DTC)",
			Subtopics: "Flux trajectory, hysteresis controllers",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Synchronous Motor Drive",
			Subtopics: "Self-controlled mode, load commutation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "BLDC Motor Drive",
			Subtopics: "Hall sensors, electronic commutation, speed loop",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Fundamentals of Electric Drives",
			Subtopics: "Components, load torques, multi-quadrant dynamics",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Dynamics of Motor-Load System",
			Subtopics: "Fundamental torque equation, equivalent inertia",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Steady-State Stability",
			Subtopics: "Criteria, torque-speed intersections, transient stability",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Selection of Motor Power Rating",
			Subtopics: "Thermal model, heating/cooling curves, duty cycles",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "DC Motor Drives Overview",
			Subtopics: "Speed control methods, starting, braking (dynamic, plugging)",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Single-Phase Controlled DC Drives",
			Subtopics: "Half/full bridge fed separately excited motor",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Discontinuous Conduction in DC Drives",
			Subtopics: "Torque-speed curve drooping, performance degradation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Three-Phase Controlled DC Drives",
			Subtopics: "Half/full/dual converter fed motors, large power apps",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Chopper Fed DC Drives",
			Subtopics: "Motoring, regenerative braking, four-quadrant chopper",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Closed-Loop Control of DC Drives",
			Subtopics: "Current limit, speed/current loops, PI controller tuning",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Phase-Locked Loop (PLL) Control",
			Subtopics: "Precise speed regulation, synchronization",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Induction Motor Drives Overview",
			Subtopics: "Review of characteristics, starting methods",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Stator Voltage Control",
			Subtopics: "AC voltage controllers, soft starting, pump/fan loads",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "V/f Control Principle",
			Subtopics: "Constant volts/hertz, low-speed voltage boost",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "VSI Fed Induction Motor Drives",
			Subtopics: "Square wave, PWM VSI drives, harmonics impact",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "CSI Fed Induction Motor Drives",
			Subtopics: "Current source inverter, regeneration, stability",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Rotor Resistance Control",
			Subtopics: "Slip ring motors, static rotor resistance control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Slip Power Recovery Schemes",
			Subtopics: "Static Kramer (sub-synchronous), Static Scherbius",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Vector Control (Field Oriented Control)",
			Subtopics: "Decoupling of flux/torque, d-q modeling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Direct and Indirect FOC",
			Subtopics: "Flux estimation, slip calculation, rotor time constant",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Direct Torque Control (DTC)",
			Subtopics: "Stator flux vector, hysteresis bands, switching table",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Synchronous Motor Drives Overview",
			Subtopics: "Wound-field, permanent magnet, reluctance motors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "VSI/CSI Fed Synchronous Motors",
			Subtopics: "Open loop V/f control, hunting/damping",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Self-Controlled Synchronous Motor",
			Subtopics: "Load commutated inverter (LCI), brush-less DC",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Permanent Magnet Synchronous Motor (PMSM)",
			Subtopics: "Surface/interior magnets, field weakening",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Brushless DC (BLDC) Motor Drives",
			Subtopics: "Trapezoidal back-EMF, Hall sensor commutation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Switched Reluctance Motor (SRM) Drives",
			Subtopics: "Current profiling, acoustic noise, torque ripple",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Stepper Motor Drives",
			Subtopics: "Micro-stepping, translators, positioning applications",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Traction Drives",
			Subtopics: "Requirements, DC series vs AC traction, regenerative braking",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Energy Conservation in Drives",
			Subtopics: "Loss minimization, optimal flux, load matching",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Microcontroller/DSP Control of Drives",
			Subtopics: "PWM generation, ADC sampling, interrupts",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Sensors for Drive Systems",
			Subtopics: "Encoders, resolvers, Hall effect current sensors",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Sensorless Control Techniques",
			Subtopics: "Model reference adaptive system (MRAS), sliding mode",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Fault Tolerant Drives",
			Subtopics: "Redundancy, open-phase faults, reliable operation",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Industrial Application Case Studies",
			Subtopics: "Cranes, hoists, rolling mills, paper machines",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future Trends in Electric Drives",
			Subtopics: "Wide bandgap devices (SiC/GaN), EV powertrains",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_dsp(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Generation of Discrete Signals",
			Subtopics: "Impulse, step, ramp, exponential, sine sequences",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Linear Convolution Verification",
			Subtopics: "Mathematical formula vs MATLAB function",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Circular Convolution Verification",
			Subtopics: "Matrix method, DFT/IDFT approach",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Difference Equation Solution",
			Subtopics: "Step response, impulse response of LTI system",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Discrete Fourier Transform (DFT)",
			Subtopics: "Magnitude and phase spectrum plotting",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Fast Fourier Transform (FFT)",
			Subtopics: "Radix-2 DIT/DIF algorithms, execution time",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "IIR Filter Design (Butterworth/Chebyshev)",
			Subtopics: "Lowpass/Highpass, frequency response",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "FIR Filter Design using Windows",
			Subtopics: "Rectangular, Hamming, Hanning, Kaiser windows",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Z-Transform and Pole-Zero Plots",
			Subtopics: "ROC visualization, stability analysis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Multirate Signal Processing",
			Subtopics: "Decimation, interpolation, spectral changes",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "DSP Hardware Implementation",
			Subtopics: "TMS320C6713 architecture, CCS IDE basics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Audio Signal Processing",
			Subtopics: "Echo generation, noise removal filtering",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to DSP",
			Subtopics: "Advantages, limitations, applications, typical block diagram",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Discrete-Time Signals",
			Subtopics: "Classification, standard sequences, shifting, scaling",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Discrete-Time Systems",
			Subtopics: "Linearity, causality, time-invariance, stability",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Linear Convolution",
			Subtopics: "Graphical/tabular methods, properties, LTI response",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Difference Equations",
			Subtopics: "Recursive, non-recursive, homogeneous/particular solution",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Z-Transform Fundamentals",
			Subtopics: "Definition, ROC, properties (linearity, shift, convolution)",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Inverse Z-Transform",
			Subtopics: "Partial fraction, power series, contour integration",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "System Function H(z)",
			Subtopics: "Poles, zeros, stability in z-domain, frequency response",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Discrete Fourier Series (DFS)",
			Subtopics: "Properties, periodic sequence representation",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Discrete Fourier Transform (DFT)",
			Subtopics: "Definition, relationship with Z-transform/DTFT",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Properties of DFT",
			Subtopics: "Periodicity, symmetry, circular convolution",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Linear Convolution using DFT",
			Subtopics: "Overlap-add, overlap-save methods",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Fast Fourier Transform (FFT)",
			Subtopics: "Computational complexity, divide and conquer",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Radix-2 DIT-FFT Algorithm",
			Subtopics: "Butterfly diagram, bit reversal, in-place computation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Radix-2 DIF-FFT Algorithm",
			Subtopics: "Decimation in frequency, butterfly structures",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "IIR Filter Design Intro",
			Subtopics: "Analog filter approximations, specs translation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Butterworth Analog Filters",
			Subtopics: "Magnitude squared function, pole locations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Chebyshev Analog Filters",
			Subtopics: "Type I & II, ripple, roll-off characteristics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Impulse Invariant Method",
			Subtopics: "Mapping s-plane to z-plane, aliasing effect",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Bilinear Transformation",
			Subtopics: "Frequency warping, pre-warping, stable mapping",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Realization of IIR Filters",
			Subtopics: "Direct form I & II, cascade, parallel forms",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "FIR Filter Design Intro",
			Subtopics: "Linear phase conditions, symmetric/anti-symmetric",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Fourier Series Method for FIR",
			Subtopics: "Gibbs phenomenon, truncation effects",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Windowing Techniques",
			Subtopics: "Rectangular, Bartlett, Hanning, Hamming, Blackman",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Kaiser Window & Advanced FIR",
			Subtopics: "Shape parameter, Parks-McClellan algorithm",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Realization of FIR Filters",
			Subtopics: "Transversal, linear phase, lattice structures",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Finite Word Length Effects",
			Subtopics: "Number representation, fixed-point vs floating-point",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Quantization Noise",
			Subtopics: "ADC quantization error, coefficient quantization",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Limit Cycles in IIR Filters",
			Subtopics: "Zero-input limit cycle, overflow oscillation, scaling",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Multirate DSP Intro",
			Subtopics: "Sampling rate conversion, decimation by integer factor",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Interpolation by Integer Factor",
			Subtopics: "Anti-imaging filter, spectral interpretation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Rational Factor Rate Conversion",
			Subtopics: "Polyphase filter structures, efficient implementation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "DSP Processors Architecture",
			Subtopics: "Harvard architecture, MAC unit, pipelining",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Addressing Modes & Instructions",
			Subtopics: "Bit-reversed addressing, circular buffers",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Applications of DSP",
			Subtopics: "Speech processing, image processing, radar/sonar",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Spectral Estimation",
			Subtopics: "Periodogram, Welch method, parametric estimation",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_measurements(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Calibration of Voltmeter/Ammeter",
			Subtopics: "Standard cell, potentiometer",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Measurement of Resistance (Wheatstone)",
			Subtopics: "Medium resistance, sensitivity",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Measurement of Low Resistance (Kelvin)",
			Subtopics: "Double bridge, contact resistance",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Measurement of Inductance (Maxwell/Anderson)",
			Subtopics: "AC bridge balance, Q-factor",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Measurement of Capacitance (Schering)",
			Subtopics: "Dielectric loss, dissipation factor",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Calibration of Energy Meter",
			Subtopics: "Phantom loading, percentage error",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "CT/PT Characteristics",
			Subtopics: "Ratio error, phase angle error",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "LVDT Characteristics",
			Subtopics: "Displacement measurement, linearity",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Strain Gauge & Load Cell",
			Subtopics: "Bridge completion, weight measurement",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Temperature Measurement (Thermocouple/RTD)",
			Subtopics: "Cold junction compensation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Digital Storage Oscilloscope (DSO)",
			Subtopics: "Waveform capture, frequency measurement",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Data Acquisition System (DAQ)",
			Subtopics: "ADC interfacing, sensor logging",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Fundamentals of Measurement",
			Subtopics: "Accuracy, precision, resolution, sensitivity",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Errors in Measurement",
			Subtopics: "Gross, systematic, random errors, statistical analysis",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Standards & Calibration",
			Subtopics: "Primary/secondary standards, traceability",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Electromechanical Indicating Instruments",
			Subtopics: "Deflecting, controlling, damping torques",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "PMMC Instruments",
			Subtopics: "Construction, torque equation, extension of range",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Moving Iron Instruments",
			Subtopics: "Attraction, repulsion types, AC/DC measurement",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Electrodynamometer Type Instruments",
			Subtopics: "Wattmeter, errors, power measurement",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Measurement of Power (3-Phase)",
			Subtopics: "Two wattmeter method, reactive power",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Energy Meters",
			Subtopics: "Induction type, creeping, friction compensation",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "DC Potentiometers",
			Subtopics: "Crompton's potentiometer, calibration of meters",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "AC Potentiometers",
			Subtopics: "Polar/coordinate types, standardization",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Measurement of Resistance",
			Subtopics: "Low, medium, high resistance (Megger)",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "AC Bridges Intro",
			Subtopics: "Balance conditions, sources, detectors",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Measurement of Inductance",
			Subtopics: "Maxwell's, Hay's, Anderson's bridges",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Measurement of Capacitance",
			Subtopics: "Schering bridge, De Sauty's bridge",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Frequency & Mutual Inductance Bridges",
			Subtopics: "Wien bridge, Heaviside Campbell",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Instrument Transformers",
			Subtopics: "CT, PT, ratio/phase angle errors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Electronic Voltmeters",
			Subtopics: "Solid-state VTVM, True RMS voltmeter",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Digital Voltmeters (DVM)",
			Subtopics: "Ramp, integrating, successive approximation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Digital Multimeters & Frequency Counters",
			Subtopics: "Time base, period measurement",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Cathode Ray Oscilloscope (CRO)",
			Subtopics: "CRT, electron gun, deflection plates",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "CRO Time Base & Triggering",
			Subtopics: "Sweep generator, Lissajous figures",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Digital Storage Oscilloscope (DSO)",
			Subtopics: "Sampling, memory, pre-triggering",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Signal Generators & Wave Analyzers",
			Subtopics: "AF/RF generators, spectrum analyzer",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Transducers Introduction",
			Subtopics: "Active/passive, primary/secondary, selection",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Resistive Transducers",
			Subtopics: "Potentiometers, strain gauges, gauge factor",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Inductive & Capacitive Transducers",
			Subtopics: "LVDT, RVDT, variable dielectric",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Piezoelectric & Photoelectric Transducers",
			Subtopics: "Crystals, charge amplifier, LDR",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Temperature Measurement",
			Subtopics: "Thermocouples, RTDs, Thermistors, Pyrometers",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Flow & Pressure Measurement",
			Subtopics: "Orifice, Venturi, Bourdon tube, load cells",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Signal Conditioning",
			Subtopics: "Instrumentation amplifiers, filtering, isolation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Data Acquisition Systems (DAQ)",
			Subtopics: "Multiplexing, S/H circuits, ADC/DAC",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Telemetry & Data Transmission",
			Subtopics: "Voltage, current, RF telemetry",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Smart Sensors & IEEE 1451",
			Subtopics: "Built-in intelligence, digital interfaces",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "PC Based Instrumentation",
			Subtopics: "LabVIEW, Virtual Instruments (VI)",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Microprocessor Based Measurement",
			Subtopics: "Automated testing, digital filtering",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_embedded(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Introduction to IDE & Assembly",
			Subtopics: "Keil uVision, instruction set simulation",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "GPIO Programming",
			Subtopics: "LED blinking, switch interfacing",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Timers & Counters",
			Subtopics: "Delay generation, event counting",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Interrupt Programming",
			Subtopics: "External interrupts, ISR execution",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Serial Communication (UART)",
			Subtopics: "PC to MCU data transfer",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "ADC Interfacing",
			Subtopics: "Sensor voltage measurement, display",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "DAC & Waveform Generation",
			Subtopics: "Sine/triangular wave using DAC",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "I2C Interfacing (EEPROM/RTC)",
			Subtopics: "Read/write operations, clock set",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "SPI Interfacing (OLED/Sensor)",
			Subtopics: "High speed data transfer",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "PWM Generation",
			Subtopics: "DC motor speed control, servo control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "RTOS Task Scheduling",
			Subtopics: "Task creation, preemptive scheduling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "RTOS IPC mechanisms",
			Subtopics: "Semaphores, Mutex, Message Queues",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Embedded Systems Overview",
			Subtopics: "Definition, constraints, application areas",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Microprocessor vs Microcontroller",
			Subtopics: "Architecture differences, selection criteria",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "ARM Cortex-M Architecture",
			Subtopics: "Registers, pipeline, Memory Map, NVIC",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Instruction Set Architecture",
			Subtopics: "Thumb-2, Data processing, Load/Store",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Assembly Language Programming",
			Subtopics: "Addressing modes, branching, looping",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "C Programming for Embedded",
			Subtopics: "Bit manipulation, volatile, pointers",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Memory Architecture",
			Subtopics: "Flash, SRAM, memory protection unit (MPU)",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "System Clock & Reset",
			Subtopics: "PLL, clock tree, watchdog timer",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "General Purpose IO (GPIO)",
			Subtopics: "Pin multiplexing, alternate functions",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Interrupts & Exceptions",
			Subtopics: "Vector table, priorities, tail-chaining",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Timers & Counters",
			Subtopics: "SysTick, general purpose timers",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Pulse Width Modulation (PWM)",
			Subtopics: "Duty cycle, frequency, motor control",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Analog to Digital Converters (ADC)",
			Subtopics: "Resolution, sampling rate, triggering",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Digital to Analog Converters (DAC)",
			Subtopics: "Audio output, waveform generation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Direct Memory Access (DMA)",
			Subtopics: "CPU offloading, circular buffer",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "UART/USART Communication",
			Subtopics: "Baud rate, parity, hardware flow control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "I2C Protocol",
			Subtopics: "Master/slave, addressing, clock stretching",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "SPI Protocol",
			Subtopics: "CPOL, CPHA, daisy chaining, high speed",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "CAN Bus Interface",
			Subtopics: "Differential signaling, message frames, arbitration",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "USB Device Fundamentals",
			Subtopics: "Enumeration, endpoints, transfer types",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Display Interfacing",
			Subtopics: "LCD, OLED, graphics libraries",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Sensor Interfacing",
			Subtopics: "Temperature, IMU, touch sensors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Actuator Interfacing",
			Subtopics: "Relays, stepper motors, H-bridge",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Power Management",
			Subtopics: "Sleep modes, wake-up sources, low power design",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Embedded Operating Systems Intro",
			Subtopics: "Foreground/Background, RTOS need",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "RTOS Concepts",
			Subtopics: "Tasks, TCB, context switching, tick interrupt",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Task Scheduling Algorithms",
			Subtopics: "Round-robin, preemptive priority",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Inter-Process Communication",
			Subtopics: "Semaphores, mutexes, priority inversion",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Message Queues & Mailboxes",
			Subtopics: "Data passing between tasks",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Software Timers & Event Flags",
			Subtopics: "Deferred interrupt processing",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "FreeRTOS Architecture",
			Subtopics: "Porting, memory allocation schemes",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Embedded Linux Basics",
			Subtopics: "Bootloader, kernel, root filesystem",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Device Drivers",
			Subtopics: "Character devices, module programming",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Hardware/Software Co-design",
			Subtopics: "Partitioning, prototyping",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Testing & Debugging Tools",
			Subtopics: "JTAG, SWD, logic analyzer, oscilloscopes",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "IoT Integration",
			Subtopics: "Wi-Fi/BLE modules, MQTT publish/subscribe",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_iot(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "IoT Node Setup",
			Subtopics: "NodeMCU/ESP32, Arduino IDE, Wi-Fi connect",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Sensor Data Acquisition",
			Subtopics: "DHT11, LDR, analog/digital reads",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Actuator Control via Web",
			Subtopics: "Relay, LED, local web server",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "MQTT Broker Setup",
			Subtopics: "Mosquitto, publish/subscribe testing",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Cloud Integration (ThingSpeak)",
			Subtopics: "Data pushing, dashboard visualization",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "RESTful API Interaction",
			Subtopics: "GET/POST requests, JSON parsing",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Bluetooth Low Energy (BLE)",
			Subtopics: "GATT profiles, smartphone connect",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "LoRaWAN Node Setup",
			Subtopics: "Gateway connection, long range payload",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Edge Processing",
			Subtopics: "Local rule engine, threshold alerts",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "IoT Security Setup",
			Subtopics: "TLS/SSL certificates, secure MQTT",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Database Integration",
			Subtopics: "InfluxDB/MongoDB, time-series logging",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Voice Assistant Integration",
			Subtopics: "Alexa/Google Home skill for IoT",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to IoT",
			Subtopics: "Definition, evolution, characteristics",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "IoT Architecture & Reference Model",
			Subtopics: "Perception, network, application layers",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Sensors & Actuators in IoT",
			Subtopics: "Types, smart sensors, energy harvesting",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "IoT Edge Hardware",
			Subtopics: "Arduino, Raspberry Pi, ESP32, ARM boards",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Communication Protocols Basics",
			Subtopics: "OSI model, short/long range, bandwidth",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "RFID & NFC",
			Subtopics: "Principles, tags, readers, applications",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Bluetooth & BLE",
			Subtopics: "Classic vs Low Energy, beacons, GATT",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Zigbee & Z-Wave",
			Subtopics: "Mesh networking, IEEE 802.15.4, smart home",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Wi-Fi & Li-Fi",
			Subtopics: "802.11 ah (HaLow), visible light communication",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "LPWAN Technologies",
			Subtopics: "LoRa, Sigfox, NB-IoT, LTE-M",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Network Layer Protocols",
			Subtopics: "IPv4 vs IPv6, 6LoWPAN, RPL routing",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Application Layer Protocols Intro",
			Subtopics: "TCP/UDP impact, constrained environments",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "MQTT Protocol",
			Subtopics: "Broker, topics, QoS levels, retained messages",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "CoAP Protocol",
			Subtopics: "RESTful architecture, observe, block transfer",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "AMQP & XMPP",
			Subtopics: "Enterprise messaging, presence, chat protocols",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "IoT Cloud Platforms",
			Subtopics: "AWS IoT, Azure IoT, Google Cloud, architecture",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Edge/Fog Computing",
			Subtopics: "Latency reduction, local analytics, gateways",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Data Analytics in IoT",
			Subtopics: "Batch vs Stream processing, time-series data",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Machine Learning at the Edge",
			Subtopics: "TinyML, model quantization, inference",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "IoT Security Challenges",
			Subtopics: "Mirai botnet, attack surfaces, vulnerabilities",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Hardware Security",
			Subtopics: "Secure boot, Trusted Execution Environment (TEE)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Network Security",
			Subtopics: "TLS/DTLS, IPSec, firewalls, VPNs",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Data Privacy & Trust",
			Subtopics: "Encryption, anonymization, GDPR compliance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "IoT Operating Systems",
			Subtopics: "Contiki, RIOT, FreeRTOS, Zephyr",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Smart Home & Building Automation",
			Subtopics: "HVAC control, lighting, smart meters",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Smart Cities",
			Subtopics: "Traffic management, waste management, parking",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Industrial IoT (IIoT) & Industry 4.0",
			Subtopics: "SCADA integration, digital twins, predictive maintenance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Connected Healthcare",
			Subtopics: "Wearables, remote monitoring, body area networks",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Smart Agriculture",
			Subtopics: "Soil moisture, weather stations, automated irrigation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Connected Vehicles",
			Subtopics: "V2X communication, fleet management",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "IoT Standardization & Alliances",
			Subtopics: "IETF, IEEE, OCF, oneM2M",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Blockchain in IoT",
			Subtopics: "Decentralization, smart contracts, immutable logs",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "5G and IoT",
			Subtopics: "URLLC, mMTC, slicing, latency",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "System Design Methodology",
			Subtopics: "Purpose, specification, deployment",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Prototyping & 3D Printing",
			Subtopics: "Enclosures, PCB design for IoT",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future of IoT",
			Subtopics: "AIoT, quantum cryptography, ethical considerations",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_renewable(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Solar PV Characteristics",
			Subtopics: "I-V/P-V curves, shading effect",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "MPPT Algorithm Implementation",
			Subtopics: "Perturb & Observe, boost converter",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Wind Turbine Emulator",
			Subtopics: "Torque-speed curve, generator loading",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Fuel Cell Characteristics",
			Subtopics: "V-I curve, hydrogen flow rate",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Battery Charge/Discharge",
			Subtopics: "Lead-acid/Li-ion, capacity, C-rate",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Microgrid Synchronization",
			Subtopics: "Grid tie inverter, PLL, voltage matching",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Standalone PV Inverter",
			Subtopics: "PWM generation, load variation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Wind DFIG Setup",
			Subtopics: "Sub/super-synchronous operation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Hybrid System Simulation",
			Subtopics: "PV + Wind + Battery power flow",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Power Quality of Inverters",
			Subtopics: "THD measurement, LC filter design",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Solar Thermal System",
			Subtopics: "Collector efficiency, heat transfer",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Biomass Gasifier Simulation",
			Subtopics: "Energy yield, thermodynamic model",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Global Energy Scenario",
			Subtopics: "Fossil fuels depletion, climate change, emissions",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Introduction to Renewables",
			Subtopics: "Solar, wind, hydro, biomass, geothermal",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Solar Radiation Physics",
			Subtopics: "Extraterrestrial, global, direct, diffuse, pyranometer",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Solar Cell Principles",
			Subtopics: "PN junction, bandgap, quantum efficiency",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "PV Module Characteristics",
			Subtopics: "I-V, P-V curves, series/parallel mismatch",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Environmental Effects on PV",
			Subtopics: "Irradiance, temperature coefficients, shading",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Maximum Power Point Tracking",
			Subtopics: "P&O, INC, fractional open-circuit voltage",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "PV System Topologies",
			Subtopics: "Standalone, grid-tied, micro-inverters",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Solar Thermal Energy",
			Subtopics: "Flat plate collectors, parabolic troughs, CSP",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Wind Energy Fundamentals",
			Subtopics: "Aerodynamics, Betz limit, wind speed statistics",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Wind Turbine Components",
			Subtopics: "Rotor, gearbox, yaw/pitch control, tower",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Generators for Wind Turbines",
			Subtopics: "SCIG, DFIG, PMSG characteristics",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "DFIG Operation",
			Subtopics: "Rotor side converter, grid side converter, slip power",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "PMSG Wind Systems",
			Subtopics: "Full-scale converter, gearless drive",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Wind Farm Interconnection",
			Subtopics: "Wake effect, layout, grid codes, LVRT",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Hydropower Principles",
			Subtopics: "Head, flow rate, specific speed, classification",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Hydro Turbines",
			Subtopics: "Pelton, Francis, Kaplan, efficiency curves",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Micro & Pico Hydro Systems",
			Subtopics: "Run-of-river, induction generators, load control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Biomass Energy",
			Subtopics: "Thermochemical, biochemical conversion, gasification",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Biogas Plants",
			Subtopics: "Anaerobic digestion, digester types, co-generation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Geothermal Energy",
			Subtopics: "Hydrothermal, petrothermal, power cycles",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Ocean Energy",
			Subtopics: "Tidal barrage, wave energy converters, OTEC",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Fuel Cells",
			Subtopics: "PEM, SOFC, thermodynamics, hydrogen economy",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Energy Storage Systems Intro",
			Subtopics: "Need for storage, Ragone plot, metrics",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Battery Technologies",
			Subtopics: "Lead-acid, Li-ion, flow batteries, BMS",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Alternative Storage",
			Subtopics: "Flywheels, supercapacitors, pumped hydro",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Power Electronics for Renewables",
			Subtopics: "DC-DC converters, grid-tied inverters",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Grid Integration Challenges",
			Subtopics: "Intermittency, voltage regulation, harmonics",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Microgrids Concept",
			Subtopics: "AC/DC microgrids, islanding, synchronization",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Microgrid Control",
			Subtopics: "Droop control, hierarchical control (Primary/Secondary)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Smart Grids & Demand Response",
			Subtopics: "AMI, time-of-use pricing, peak shaving",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Economics of Renewable Energy",
			Subtopics: "LCOE, payback period, NPV, subsidies",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Environmental Impact & Life Cycle",
			Subtopics: "Carbon footprint, recycling of PV/batteries",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Policies & Regulations",
			Subtopics: "Renewable Purchase Obligations, Feed-in Tariffs",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Hybrid Energy Systems",
			Subtopics: "PV-Wind-Diesel, sizing optimization",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future Energy Trends",
			Subtopics: "Green hydrogen, vehicle-to-grid (V2G)",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_ml(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Python/NumPy Basics for ML",
			Subtopics: "Matrix operations, Pandas, Matplotlib",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Linear Regression Implementation",
			Subtopics: "Gradient descent, cost function",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Logistic Regression & Metrics",
			Subtopics: "ROC, AUC, precision, recall",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Decision Trees & Random Forests",
			Subtopics: "Gini impurity, pruning, ensemble",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Support Vector Machines (SVM)",
			Subtopics: "Linear/RBF kernel, hyperparameter tuning",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "K-Means Clustering",
			Subtopics: "Elbow method, silhouette score",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Principal Component Analysis (PCA)",
			Subtopics: "Dimensionality reduction, eigenfaces",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Artificial Neural Networks",
			Subtopics: "MLPClassifier, backpropagation setup",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Time Series Forecasting",
			Subtopics: "ARIMA/Prophet for energy demand",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Anomaly Detection",
			Subtopics: "Isolation forest for fault detection",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Hyperparameter Optimization",
			Subtopics: "Grid search, random search, cross-validation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Deployment of ML Model",
			Subtopics: "Flask/FastAPI, REST endpoint",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Machine Learning",
			Subtopics: "Supervised, unsupervised, reinforcement",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Mathematical Foundations",
			Subtopics: "Linear algebra, probability, calculus basics",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Data Preprocessing",
			Subtopics: "Imputation, scaling, one-hot encoding",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Linear Regression",
			Subtopics: "Hypothesis, cost function, OLS method",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Gradient Descent",
			Subtopics: "Batch, stochastic, mini-batch, learning rate",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Polynomial Regression",
			Subtopics: "Underfitting, overfitting, bias-variance tradeoff",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Regularization Techniques",
			Subtopics: "Ridge (L2), Lasso (L1), Elastic Net",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Logistic Regression",
			Subtopics: "Sigmoid function, cross-entropy loss",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Classification Metrics",
			Subtopics: "Confusion matrix, precision, recall, F1-score",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "K-Nearest Neighbors (KNN)",
			Subtopics: "Distance metrics, K selection, curse of dimensionality",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Naive Bayes Classifier",
			Subtopics: "Bayes theorem, conditional independence",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Decision Trees",
			Subtopics: "Entropy, Information Gain, Gini Index",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Ensemble Learning Intro",
			Subtopics: "Bagging, Boosting, Stacking",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Random Forests",
			Subtopics: "Feature randomness, out-of-bag error",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Boosting Algorithms",
			Subtopics: "AdaBoost, Gradient Boosting, XGBoost",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Support Vector Machines (Linear)",
			Subtopics: "Margin, support vectors, hard/soft margin",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "SVM (Non-Linear & Kernels)",
			Subtopics: "Kernel trick, RBF, polynomial kernels",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Unsupervised Learning Intro",
			Subtopics: "Clustering vs Dimensionality reduction",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "K-Means Clustering",
			Subtopics: "Algorithm, convergence, initialization (K-Means++)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Hierarchical Clustering",
			Subtopics: "Agglomerative, dendrograms, linkage criteria",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Density-Based Clustering",
			Subtopics: "DBSCAN, epsilon, min-points, noise handling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Dimensionality Reduction",
			Subtopics: "PCA, eigenvalues, variance ratio",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Advanced Dimensionality Reduction",
			Subtopics: "t-SNE, UMAP, visualization",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Association Rule Learning",
			Subtopics: "Apriori algorithm, support, confidence, lift",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Artificial Neural Networks (ANN)",
			Subtopics: "Perceptron, activation functions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Multilayer Perceptron",
			Subtopics: "Hidden layers, universal approximation theorem",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Backpropagation Algorithm",
			Subtopics: "Chain rule, weight updates, vanishing gradient",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Model Evaluation & Selection",
			Subtopics: "K-fold cross-validation, learning curves",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Hyperparameter Tuning",
			Subtopics: "Grid search, Random search, Bayesian optimization",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Handling Imbalanced Data",
			Subtopics: "SMOTE, class weights, undersampling",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Time Series Analysis",
			Subtopics: "Stationarity, autocorrelation, ARIMA",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Recommender Systems",
			Subtopics: "Collaborative filtering, content-based",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Anomaly Detection",
			Subtopics: "Gaussian distribution, Isolation forest",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Reinforcement Learning Basics",
			Subtopics: "Markov Decision Process, Q-learning",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "ML System Design",
			Subtopics: "Data pipelines, feature engineering, MLOps",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Ethics in ML",
			Subtopics: "Bias, fairness, explainability, data privacy",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_deep_learning(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "TensorFlow/PyTorch Basics",
			Subtopics: "Tensors, autograd, computational graphs",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "MLP for Image Classification",
			Subtopics: "MNIST dataset, dense layers",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "CNN Implementation",
			Subtopics: "Conv2D, MaxPooling, filters, feature maps",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Transfer Learning",
			Subtopics: "VGG16/ResNet feature extraction, fine-tuning",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "RNN/LSTM for Sequence Data",
			Subtopics: "Text classification, sentiment analysis",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Time Series with LSTM",
			Subtopics: "Stock price/load forecasting",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Generative Adversarial Networks",
			Subtopics: "DCGAN, fake image generation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Autoencoders for Denoising",
			Subtopics: "Latent space, reconstruction loss",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Object Detection basics",
			Subtopics: "YOLO/SSD bounding boxes (inference)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Semantic Segmentation",
			Subtopics: "U-Net architecture on medical/satellite images",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Attention Mechanism/Transformers",
			Subtopics: "HuggingFace basics, BERT inference",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Model Quantization & Export",
			Subtopics: "ONNX, TFLite for edge deployment",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Deep Learning",
			Subtopics: "History, ANN vs DL, hardware (GPUs/TPUs)",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Neural Network Foundations",
			Subtopics: "McCulloch-Pitts, perceptron, activation functions",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Feedforward Neural Networks",
			Subtopics: "Architecture, forward propagation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Loss Functions",
			Subtopics: "MSE, Cross-Entropy, KL Divergence",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Optimization Algorithms",
			Subtopics: "SGD, Momentum, RMSprop, Adam",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Backpropagation & Gradients",
			Subtopics: "Computational graphs, chain rule",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Regularization in DL",
			Subtopics: "Dropout, L1/L2, Early stopping, Data augmentation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Weight Initialization",
			Subtopics: "Xavier/Glorot, He initialization, vanishing/exploding gradients",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Batch Normalization",
			Subtopics: "Internal covariate shift, scaling and shifting",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Convolutional Neural Networks (CNN)",
			Subtopics: "Convolution operation, padding, stride",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Pooling & Receptive Fields",
			Subtopics: "Max/Average pooling, spatial reduction",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Classic CNN Architectures",
			Subtopics: "LeNet, AlexNet, VGGNet",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Advanced CNN Architectures",
			Subtopics: "ResNet, Inception, MobileNet",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Object Detection Concepts",
			Subtopics: "R-CNN, YOLO, SSD, IoU, non-max suppression",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Semantic & Instance Segmentation",
			Subtopics: "FCN, U-Net, Mask R-CNN",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Recurrent Neural Networks (RNN)",
			Subtopics: "Sequential data, hidden state, BPTT",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "LSTM Networks",
			Subtopics: "Cell state, forget/input/output gates",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Gated Recurrent Units (GRU)",
			Subtopics: "Update and reset gates, vs LSTM",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Bidirectional & Deep RNNs",
			Subtopics: "Context capturing, sequence-to-sequence models",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Word Embeddings",
			Subtopics: "Word2Vec, GloVe, CBOW, Skip-gram",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Attention Mechanism",
			Subtopics: "Self-attention, query/key/value vectors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Transformer Architecture",
			Subtopics: "Multi-head attention, positional encoding",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Pre-trained Language Models",
			Subtopics: "BERT, GPT, fine-tuning strategies",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Autoencoders (AE)",
			Subtopics: "Encoder-decoder, bottleneck, undercomplete AE",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Variational Autoencoders (VAE)",
			Subtopics: "Latent distributions, reparameterization trick",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Generative Adversarial Networks (GAN)",
			Subtopics: "Generator, discriminator, min-max game",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Advanced GANs",
			Subtopics: "DCGAN, CycleGAN, Mode collapse",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Deep Reinforcement Learning",
			Subtopics: "Deep Q-Networks (DQN), replay buffer",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Policy Gradient Methods",
			Subtopics: "REINFORCE, Actor-Critic, PPO",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Graph Neural Networks (GNN)",
			Subtopics: "Message passing, graph convolution",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Self-Supervised Learning",
			Subtopics: "Contrastive learning, SimCLR",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Transfer Learning & Few-Shot",
			Subtopics: "Domain adaptation, meta-learning",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Interpretability & XAI",
			Subtopics: "Grad-CAM, SHAP, LIME",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Adversarial Attacks & Defenses",
			Subtopics: "FGSM, robustness, adversarial training",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Deep Learning for Edge (TinyML)",
			Subtopics: "Quantization, pruning, knowledge distillation",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future Trends in DL",
			Subtopics: "Multimodal models, large language models (LLMs)",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_soft_computing(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Fuzzy Logic Controller Design",
			Subtopics: "Membership functions, rules, defuzzification",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Fuzzy Inference System Simulation",
			Subtopics: "Mamdani vs Sugeno, inverted pendulum",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Artificial Neural Network (ANN) setup",
			Subtopics: "XOR problem, backpropagation tuning",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Genetic Algorithm for Optimization",
			Subtopics: "Fitness function, crossover, mutation",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Particle Swarm Optimization (PSO)",
			Subtopics: "Velocity update, global best tracking",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Neuro-Fuzzy System (ANFIS)",
			Subtopics: "Training data, surface visualization",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Ant Colony Optimization (ACO)",
			Subtopics: "Traveling salesperson problem",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Simulated Annealing",
			Subtopics: "Cooling schedule, local optima escape",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "System Identification using ANN",
			Subtopics: "Curve fitting, error analysis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Fuzzy PID Controller",
			Subtopics: "Rule base creation, step response",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Image Processing using Fuzzy",
			Subtopics: "Contrast enhancement, edge detection",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Optimization of Power System",
			Subtopics: "Economic dispatch using GA/PSO",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Soft Computing",
			Subtopics: "Hard vs Soft computing, components, applications",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Fuzzy Sets Theory",
			Subtopics: "Crisp sets vs fuzzy sets, membership functions",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Fuzzy Set Operations",
			Subtopics: "Union, intersection, complement, T-norms, T-conorms",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Fuzzy Relations",
			Subtopics: "Cartesian product, max-min composition",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Fuzzy Logic & Rules",
			Subtopics: "Linguistic variables, IF-THEN rules, fuzzy propositions",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Fuzzy Inference Systems (FIS)",
			Subtopics: "Fuzzification, rule evaluation, defuzzification methods",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Mamdani & Sugeno Models",
			Subtopics: "Differences, output generation, applications",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Design of Fuzzy Controllers",
			Subtopics: "Rule base creation, scaling factors, PID equivalent",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Artificial Neural Networks Basics",
			Subtopics: "Biological inspiration, perceptron, activation",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Supervised Learning in ANN",
			Subtopics: "Delta rule, multi-layer perceptron, backpropagation",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Unsupervised Learning in ANN",
			Subtopics: "Hebbian learning, competitive learning",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Associative Memory Networks",
			Subtopics: "Hopfield networks, BAM, storage capacity",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Self-Organizing Maps (SOM)",
			Subtopics: "Kohonen network, topological mapping",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Radial Basis Function Networks",
			Subtopics: "RBF architecture, centers, interpolation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Evolutionary Computation Intro",
			Subtopics: "Darwinian evolution, genotype/phenotype",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Genetic Algorithms (GA) Basics",
			Subtopics: "Encoding, population initialization, fitness",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "GA Operators: Selection",
			Subtopics: "Roulette wheel, tournament, rank selection",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "GA Operators: Crossover & Mutation",
			Subtopics: "Single-point, uniform, mutation rate",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Advanced GA Techniques",
			Subtopics: "Elitism, multi-objective optimization (NSGA-II)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Particle Swarm Optimization (PSO)",
			Subtopics: "Swarm intelligence, personal/global best",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Ant Colony Optimization (ACO)",
			Subtopics: "Pheromone trail, probabilistic routing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Simulated Annealing",
			Subtopics: "Thermodynamic analogy, metropolis criterion",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Artificial Bee Colony (ABC)",
			Subtopics: "Employed, onlooker, scout bees",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Hybrid Systems Introduction",
			Subtopics: "Need for hybridization, types",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Neuro-Fuzzy Systems",
			Subtopics: "Fuzzy logic vs neural nets, cooperative models",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Adaptive Neuro-Fuzzy Inference System (ANFIS)",
			Subtopics: "Architecture, hybrid learning algorithm",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Fuzzy-Genetic Systems",
			Subtopics: "GA for fuzzy rule tuning, membership optimization",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Neuro-Genetic Systems",
			Subtopics: "Evolving neural network weights/topologies (NEAT)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Fuzzy Clustering",
			Subtopics: "Fuzzy C-Means (FCM), objective function",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Rough Sets Theory",
			Subtopics: "Lower/upper approximations, indiscernibility",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Support Vector Machines in SC",
			Subtopics: "Kernel methods, relation to neural networks",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Applications: Control Systems",
			Subtopics: "Inverted pendulum, robot navigation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Applications: Pattern Recognition",
			Subtopics: "Character recognition, medical diagnosis",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Applications: Power Systems",
			Subtopics: "Load forecasting, fault classification",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Applications: Optimization",
			Subtopics: "Traveling salesman, scheduling",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Current Research Trends",
			Subtopics: "Deep neuro-fuzzy, quantum soft computing",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_data_structures(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Array Operations",
			Subtopics: "Insertion, deletion, linear/binary search",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Singly Linked List",
			Subtopics: "Create, insert, delete, display",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Doubly Linked List",
			Subtopics: "Forward/backward traversal, node manipulation",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Stack Implementation",
			Subtopics: "Array/List based, push, pop, peek",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Queue Implementation",
			Subtopics: "Array/List based, enqueue, dequeue",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Circular & Priority Queue",
			Subtopics: "Modulo arithmetic, heap based priority",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Expression Conversion & Evaluation",
			Subtopics: "Infix to Postfix, stack evaluation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Binary Search Tree (BST)",
			Subtopics: "Insert, delete, inorder, preorder, postorder",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Graph Traversal",
			Subtopics: "Breadth First Search (BFS), Depth First Search (DFS)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Sorting Algorithms I",
			Subtopics: "Bubble, Insertion, Selection sort",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Sorting Algorithms II",
			Subtopics: "Merge sort, Quick sort, complexity analysis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Hashing & Collision",
			Subtopics: "Chaining, linear probing, hash table setup",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Data Structures",
			Subtopics: "Abstract Data Types (ADT), memory layout",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Algorithm Analysis",
			Subtopics: "Time/space complexity, Big-O, Omega, Theta notations",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Arrays & Strings",
			Subtopics: "1D/2D arrays, row/column major, string operations",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Searching Algorithms",
			Subtopics: "Linear search, Binary search, interpolation search",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Sorting Concepts",
			Subtopics: "Internal vs external sorting, stability",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Basic Sorting Algorithms",
			Subtopics: "Bubble, Selection, Insertion sort",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Advanced Sorting I",
			Subtopics: "Merge sort, Divide and Conquer strategy",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Advanced Sorting II",
			Subtopics: "Quick sort, pivot selection, partitioning",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Advanced Sorting III",
			Subtopics: "Heap sort, Radix sort, Counting sort",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Linked Lists Basics",
			Subtopics: "Node structure, dynamic memory allocation",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Singly Linked Lists",
			Subtopics: "Traversal, insertion/deletion at various positions",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Doubly Linked Lists",
			Subtopics: "Prev/Next pointers, advantages/disadvantages",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Circular Linked Lists",
			Subtopics: "Josephus problem, implementation",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Stacks Introduction",
			Subtopics: "LIFO principle, Array & List implementations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Applications of Stacks",
			Subtopics: "Balanced parentheses, recursion memory (call stack)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Expression Parsing",
			Subtopics: "Infix, Postfix, Prefix conversions and evaluation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Queues Introduction",
			Subtopics: "FIFO principle, Array & List implementations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Advanced Queues",
			Subtopics: "Circular queue, Deque (Double Ended Queue)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Priority Queues",
			Subtopics: "Implementations, real-world applications",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Trees Fundamentals",
			Subtopics: "Root, leaf, height, depth, binary trees",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Tree Traversals",
			Subtopics: "Inorder, Preorder, Postorder, Level-order",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Binary Search Trees (BST)",
			Subtopics: "Properties, insertion, deletion cases",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Balanced Trees Intro",
			Subtopics: "Degenerate trees, need for balancing",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "AVL Trees",
			Subtopics: "Rotations (LL, RR, LR, RL), height balance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "B-Trees and B+ Trees",
			Subtopics: "Disk access, multi-way search trees, databases",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Heaps",
			Subtopics: "Min-heap, Max-heap, insertion, heapify",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Graphs Fundamentals",
			Subtopics: "Vertices, edges, directed/undirected, adjacency matrix/list",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Graph Traversals",
			Subtopics: "Breadth First Search (BFS), Depth First Search (DFS)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Topological Sorting",
			Subtopics: "DAGs, dependency resolution",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Shortest Path Algorithms",
			Subtopics: "Dijkstra's algorithm, greedy approach",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Minimum Spanning Trees",
			Subtopics: "Prim's algorithm, Kruskal's algorithm, Disjoint sets",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Hashing Concepts",
			Subtopics: "Hash functions, load factor, direct addressing",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Collision Resolution Techniques",
			Subtopics: "Open addressing (Linear, Quadratic), Chaining",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Dynamic Programming Intro",
			Subtopics: "Overlapping subproblems, optimal substructure, Memoization",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Greedy Algorithms Intro",
			Subtopics: "Local optimum vs global optimum, fractional knapsack",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Trie Data Structure",
			Subtopics: "Prefix trees, autocomplete, string matching",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_programming(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Basic I/O & Operators",
			Subtopics: "printf, scanf, arithmetic, bitwise",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Control Structures (if/switch)",
			Subtopics: "Branching, calculator implementation",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Looping (for/while)",
			Subtopics: "Factorial, Fibonacci, prime numbers",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "1D Arrays",
			Subtopics: "Max/min, reversing, linear search",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "2D Arrays & Matrices",
			Subtopics: "Matrix addition, multiplication, transpose",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Strings",
			Subtopics: "Length, copy, concatenate, palindrome check",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Functions & Scope",
			Subtopics: "Call by value, local vs global variables",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Recursion",
			Subtopics: "Tower of Hanoi, recursive factorial",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Pointers Basics",
			Subtopics: "Address operator, pointer arithmetic, swap",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Dynamic Memory & Arrays",
			Subtopics: "malloc, calloc, passing arrays to functions",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Structures & Unions",
			Subtopics: "Student record database, memory layout",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "File Handling",
			Subtopics: "Read/write text files, copying file contents",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Computers",
			Subtopics: "Hardware/software, OS, compilation process",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Problem Solving & Algorithms",
			Subtopics: "Flowcharts, pseudocode, algorithmic thinking",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "C Language Fundamentals",
			Subtopics: "History, structure of C program, tokens",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Data Types & Variables",
			Subtopics: "Int, float, char, declaration, initialization",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Operators & Expressions",
			Subtopics: "Arithmetic, relational, logical, precedence",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Bitwise Operators",
			Subtopics: "AND, OR, XOR, shifts, masking",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Input & Output Operations",
			Subtopics: "Formatted I/O, unformatted I/O, escape sequences",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Control Statements: Branching",
			Subtopics: "if, if-else, nested if, else-if ladder",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Switch Statement",
			Subtopics: "Cases, break, default, fall-through",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Control Statements: Looping",
			Subtopics: "while, do-while loops, entry vs exit control",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "For Loop & Loop Control",
			Subtopics: "for loop syntax, break, continue, goto",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Arrays Introduction",
			Subtopics: "1D arrays, memory allocation, initialization",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Array Operations",
			Subtopics: "Traversal, searching, sorting basics",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Two-Dimensional Arrays",
			Subtopics: "Matrix representation, row/column operations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Multidimensional Arrays",
			Subtopics: "Memory mapping, applications",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Strings in C",
			Subtopics: "Character arrays, null terminator, string I/O",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "String Handling Functions",
			Subtopics: "strlen, strcpy, strcat, strcmp, custom functions",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Functions Introduction",
			Subtopics: "Modularity, function declaration, definition, call",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Parameter Passing",
			Subtopics: "Call by value, actual vs formal parameters",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Variable Scope & Storage Classes",
			Subtopics: "Auto, register, static, extern, lifetime",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Recursion",
			Subtopics: "Base case, recursive step, stack overflow",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Pointers Introduction",
			Subtopics: "Memory addresses, pointer declaration, dereferencing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Pointer Arithmetic",
			Subtopics: "Increment/decrement, pointer differences",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Pointers and Arrays",
			Subtopics: "Array name as pointer, passing array by pointer",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Pointers and Strings",
			Subtopics: "Array of pointers, string manipulation via pointers",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Pointers to Functions",
			Subtopics: "Callback functions, array of function pointers",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Dynamic Memory Allocation",
			Subtopics: "malloc, calloc, realloc, free, memory leaks",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Structures",
			Subtopics: "Definition, declaration, accessing members, dot/arrow operators",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Arrays of Structures",
			Subtopics: "Database management, nested structures",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Unions",
			Subtopics: "Memory sharing, difference from structures, applications",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Enumerations & Typedef",
			Subtopics: "enum keyword, custom type names",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "File Handling Basics",
			Subtopics: "File pointers, fopen, fclose, modes",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Reading & Writing Files",
			Subtopics: "fgetc, fputc, fgets, fputs, fprintf, fscanf",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Binary Files & Random Access",
			Subtopics: "fread, fwrite, fseek, ftell, rewind",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Preprocessor Directives",
			Subtopics: "#define, #include, macros, conditional compilation",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Command Line Arguments",
			Subtopics: "argc, argv, parsing inputs",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_signals(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Signal Generation & Plotting",
			Subtopics: "Unit step, impulse, exponential, sinc",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Operations on Signals",
			Subtopics: "Time shifting, scaling, reversal",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Properties of LTI Systems",
			Subtopics: "Linearity, time-invariance verification",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Linear Convolution",
			Subtopics: "1D convolution computation and plotting",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Circular Convolution",
			Subtopics: "DFT based convolution vs linear",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Fourier Series Expansion",
			Subtopics: "Square wave synthesis from harmonics",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Fourier Transform Simulation",
			Subtopics: "Magnitude/phase spectra of signals",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Laplace Transform",
			Subtopics: "Poles, zeros, stability using s-plane",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Z-Transform",
			Subtopics: "ROC visualization, inverse Z-transform",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Sampling Theorem Verification",
			Subtopics: "Aliasing effect, Nyquist rate",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Correlation of Signals",
			Subtopics: "Auto/cross-correlation, matched filter",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "LTI System Response",
			Subtopics: "Step/impulse response via differential equation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Signals",
			Subtopics: "Continuous vs Discrete, deterministic/random",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Basic Operations on Signals",
			Subtopics: "Time shifting, scaling, reversal, precedence",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Elementary Signals",
			Subtopics: "Impulse, step, ramp, exponential, sinusoidal",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Classification of Signals",
			Subtopics: "Energy vs Power, periodic/aperiodic, even/odd",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Systems Classification",
			Subtopics: "Linear/non-linear, time-invariant/variant",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Causal & Stable Systems",
			Subtopics: "Memoryless/memory, BIBO stability",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "LTI Systems",
			Subtopics: "Impulse response, convolution integral",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Properties of LTI Systems",
			Subtopics: "Commutative, associative, distributive, stability",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Difference & Differential Equations",
			Subtopics: "System representations, recursive structures",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Fourier Series Introduction",
			Subtopics: "Trigonometric FS, Dirichlet conditions",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Exponential Fourier Series",
			Subtopics: "Complex coefficients, spectrum representation",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Properties of Fourier Series",
			Subtopics: "Linearity, time shift, Parseval's theorem",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Continuous-Time Fourier Transform (CTFT)",
			Subtopics: "Derivation from FS, magnitude/phase spectra",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "CTFT Properties I",
			Subtopics: "Linearity, time shift, frequency shift, scaling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "CTFT Properties II",
			Subtopics: "Differentiation, integration, duality",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Fourier Transform of Standard Signals",
			Subtopics: "Impulse, step, signum, periodic signals",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "LTI System Analysis with CTFT",
			Subtopics: "Frequency response H(jw), distortionless transmission",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Sampling Theorem",
			Subtopics: "Nyquist rate, ideal sampling, aliasing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Reconstruction of Signals",
			Subtopics: "Ideal lowpass filter, zero-order hold",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Discrete-Time Fourier Transform (DTFT)",
			Subtopics: "Definition, relation to CTFT, properties",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "DTFT of Standard Sequences",
			Subtopics: "Impulse, step, exponential, periodicity",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Laplace Transform Introduction",
			Subtopics: "Bilateral/Unilateral, Region of Convergence (ROC)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Laplace Transform Properties",
			Subtopics: "Time shift, s-domain shift, differentiation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Inverse Laplace Transform",
			Subtopics: "Partial fraction expansion, initial/final value theorems",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "LTI System Analysis using Laplace",
			Subtopics: "Transfer function H(s), poles/zeros, stability",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Unilateral Laplace Transform",
			Subtopics: "Solution of differential equations with initial conditions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Z-Transform Introduction",
			Subtopics: "Definition, ROC properties, left/right sided sequences",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Z-Transform Properties",
			Subtopics: "Time shift, scaling in z-domain, convolution",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Inverse Z-Transform",
			Subtopics: "Partial fraction, power series, contour integral",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "LTI System Analysis using Z-Transform",
			Subtopics: "System function H(z), stability, causality",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Unilateral Z-Transform",
			Subtopics: "Solution of difference equations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Relation between Transforms",
			Subtopics: "Fourier, Laplace, Z-transform mapping",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Hilbert Transform",
			Subtopics: "Analytic signals, phase shifting",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Bandpass Signals",
			Subtopics: "Lowpass equivalent, envelopes, quadrature",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "State-Space Analysis Intro",
			Subtopics: "State equations from transfer function",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Random Signals Basics",
			Subtopics: "Mean, variance, autocorrelation, power spectral density",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_calculus(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Plotting Functions in MATLAB",
			Subtopics: "Domain, range, limits visualization",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Derivative Evaluation",
			Subtopics: "Symbolic differentiation, tangents",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Integral Evaluation",
			Subtopics: "Definite/indefinite, area under curve",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Multivariable Functions",
			Subtopics: "Surface plots, contour maps",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Partial Derivatives",
			Subtopics: "Gradient vector visualization",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Optimization",
			Subtopics: "Local maxima/minima using Hessian",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Vector Fields",
			Subtopics: "Quiver plots, flow lines",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Line Integrals",
			Subtopics: "Work done computation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Surface Integrals",
			Subtopics: "Flux computation through parameterized surfaces",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Green's Theorem Verification",
			Subtopics: "Circulation vs Area integral",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Stokes' Theorem Simulation",
			Subtopics: "Curl of vector field over surface",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Divergence Theorem Simulation",
			Subtopics: "Volume vs Surface flux",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Limits and Continuity",
			Subtopics: "Epsilon-delta definition, properties",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Derivatives and Rates of Change",
			Subtopics: "Tangent lines, differentiability",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Differentiation Rules",
			Subtopics: "Product, quotient, chain rule, implicit",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Applications of Derivatives",
			Subtopics: "Related rates, linear approximation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Mean Value Theorem",
			Subtopics: "Rolle's theorem, applications",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Maxima and Minima",
			Subtopics: "First and second derivative tests",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Curve Sketching",
			Subtopics: "Asymptotes, concavity, inflection points",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Optimization Problems",
			Subtopics: "Applied max/min in geometry/physics",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "L'Hopital's Rule",
			Subtopics: "Indeterminate forms, growth rates",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Antiderivatives & Indefinite Integrals",
			Subtopics: "Basic rules, initial value problems",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Definite Integrals",
			Subtopics: "Riemann sums, area under curve",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Fundamental Theorem of Calculus",
			Subtopics: "Part 1 & Part 2, accumulation functions",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Integration Techniques: Substitution",
			Subtopics: "u-substitution, limits change",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Integration Techniques: Parts",
			Subtopics: "Product rule reverse, tabular method",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Integration Techniques: Partial Fractions",
			Subtopics: "Rational functions, long division",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Trigonometric Integrals & Substitution",
			Subtopics: "Powers of trig functions, radical elimination",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Improper Integrals",
			Subtopics: "Infinite limits, discontinuous integrands, convergence",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Applications of Definite Integrals",
			Subtopics: "Area between curves, average value",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Volumes by Slicing",
			Subtopics: "Disk and washer methods",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Volumes by Cylindrical Shells",
			Subtopics: "Vertical vs horizontal axis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Arc Length and Surface Area",
			Subtopics: "Parametric curves, surfaces of revolution",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Functions of Several Variables",
			Subtopics: "Domain, range, level curves",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Limits & Continuity in Higher Dimensions",
			Subtopics: "Two-path test, open/closed sets",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Partial Derivatives",
			Subtopics: "First/second order, Clairaut's theorem",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Chain Rule for Multivariable",
			Subtopics: "Tree diagrams, implicit differentiation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Directional Derivatives & Gradient",
			Subtopics: "Max rate of change, normal vectors",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Tangent Planes & Linear Approximations",
			Subtopics: "Differentials, error estimation",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Maxima & Minima (Multivariable)",
			Subtopics: "Critical points, Hessian determinant test",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Lagrange Multipliers",
			Subtopics: "Constrained optimization, multiple constraints",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Double Integrals",
			Subtopics: "Iterated integrals, Fubini's theorem",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Double Integrals in Polar Coordinates",
			Subtopics: "Jacobian determinant, circular regions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Triple Integrals",
			Subtopics: "Rectangular, cylindrical, spherical coordinates",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Vector Fields & Line Integrals",
			Subtopics: "Work, circulation, conservative fields",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Fundamental Theorem for Line Integrals",
			Subtopics: "Potential functions, path independence",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Green's, Stokes' & Divergence Theorems",
			Subtopics: "Curl, divergence, generalized Stokes",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_matrices_ode(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Matrix Operations & Determinants",
			Subtopics: "Addition, multiplication, inverse",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Solving Linear Systems",
			Subtopics: "Gauss elimination, LU decomposition",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Eigenvalues & Eigenvectors",
			Subtopics: "Characteristic polynomial, diagonalization",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "First Order ODEs",
			Subtopics: "Euler's method, Runge-Kutta 4th order",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Second Order ODEs",
			Subtopics: "Phase plane, damped oscillator",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Systems of ODEs",
			Subtopics: "Coupled equations, predator-prey model",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Laplace Transform",
			Subtopics: "Symbolic transforms, Heaviside step",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Inverse Laplace Transform",
			Subtopics: "Partial fractions, solving ODEs",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Fourier Series",
			Subtopics: "Harmonic analysis, Gibbs phenomenon",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "PDEs - Heat Equation",
			Subtopics: "Finite difference method 1D",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "PDEs - Wave Equation",
			Subtopics: "Vibrating string simulation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Numerical Integration",
			Subtopics: "Trapezoidal rule, Simpson's 1/3 rule",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Matrix Algebra Fundamentals",
			Subtopics: "Rank, row echelon form, consistency",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Systems of Linear Equations",
			Subtopics: "Gauss elimination, Gauss-Jordan",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Vector Spaces & Subspaces",
			Subtopics: "Linear independence, basis, dimension",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Linear Transformations",
			Subtopics: "Matrix representation, kernel, image",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Eigenvalues and Eigenvectors",
			Subtopics: "Characteristic equation, properties",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Diagonalization",
			Subtopics: "Similar matrices, powers of matrices",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Orthogonal & Symmetric Matrices",
			Subtopics: "Spectral theorem, quadratic forms",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Cayley-Hamilton Theorem",
			Subtopics: "Inverse/powers computation, minimal polynomial",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "First Order Differential Equations",
			Subtopics: "Separable, exact, integrating factors",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Linear First Order ODEs",
			Subtopics: "Bernoulli's equation, orthogonal trajectories",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Applications of First Order ODEs",
			Subtopics: "Newton's cooling, RC circuits, population",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Second Order Linear ODEs",
			Subtopics: "Homogeneous, constant coefficients",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Non-Homogeneous Second Order ODEs",
			Subtopics: "Undetermined coefficients",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Variation of Parameters",
			Subtopics: "Wronskian, general solution",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Higher Order Linear ODEs",
			Subtopics: "Characteristic roots, superposition",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Euler-Cauchy Equations",
			Subtopics: "Variable coefficients, substitution",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Applications of Second Order ODEs",
			Subtopics: "Spring-mass system, RLC circuits",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Systems of Linear ODEs",
			Subtopics: "Matrix formulation, eigenvalues approach",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Phase Plane Analysis",
			Subtopics: "Critical points, stability, node/saddle/spiral",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Series Solution of ODEs",
			Subtopics: "Power series method, ordinary points",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Frobenius Method",
			Subtopics: "Regular singular points, indicial equation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Bessel Functions",
			Subtopics: "Properties, recurrence relations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Legendre Polynomials",
			Subtopics: "Rodrigues' formula, orthogonality",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Laplace Transform Definition",
			Subtopics: "Existence, linearity, first shifting",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Laplace of Derivatives & Integrals",
			Subtopics: "Initial value problems",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Unit Step & Dirac Delta Functions",
			Subtopics: "Second shifting theorem, impulses",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Convolution Theorem",
			Subtopics: "Inverse transform, integral equations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Solving ODEs with Laplace",
			Subtopics: "System of ODEs, periodic functions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Fourier Series Concepts",
			Subtopics: "Euler formulas, Dirichlet conditions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Half-Range Expansions",
			Subtopics: "Sine/Cosine series, even/odd functions",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Partial Differential Equations Intro",
			Subtopics: "Formation, classification (elliptic, parabolic, hyperbolic)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Method of Separation of Variables",
			Subtopics: "Superposition principle",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "1D Heat Equation",
			Subtopics: "Boundary conditions, steady state",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "1D Wave Equation",
			Subtopics: "D'Alembert's solution, vibrating string",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "2D Laplace Equation",
			Subtopics: "Steady state heat in a plate, Dirichlet problem",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Fourier Transforms in PDEs",
			Subtopics: "Solving on infinite domains",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_complex_methods(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Complex Arithmetic",
			Subtopics: "Polar form, roots of complex numbers",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Analytic Functions",
			Subtopics: "Cauchy-Riemann equations visualization",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Conformal Mapping",
			Subtopics: "Mapping z to w-plane, transformations",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Complex Integration",
			Subtopics: "Contour integrals over curves",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Taylor & Laurent Series",
			Subtopics: "Radius of convergence, principal part",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Residue Theorem",
			Subtopics: "Pole identification, residue calculation",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Real Integrals via Complex Methods",
			Subtopics: "Improper integrals evaluation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Z-Transform Computation",
			Subtopics: "Region of convergence mapping",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Bilinear Transformations",
			Subtopics: "Cross-ratio, circle to circle mapping",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Potential Flow Visualization",
			Subtopics: "Complex potential, streamlines",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Laplace Inversion by Contour",
			Subtopics: "Bromwich integral simulation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Numerical PDEs",
			Subtopics: "Finite difference for Laplace equation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Complex Numbers and Plane",
			Subtopics: "Algebra, polar form, De Moivre's formula",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Roots of Complex Numbers",
			Subtopics: "Principal values, roots of unity",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Functions of a Complex Variable",
			Subtopics: "Limits, continuity, derivatives",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Cauchy-Riemann Equations",
			Subtopics: "Analytic functions, harmonic functions",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Elementary Complex Functions",
			Subtopics: "Exponential, trigonometric, hyperbolic",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Complex Logarithm",
			Subtopics: "Branches, branch cuts, complex exponents",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Conformal Mapping",
			Subtopics: "Preservation of angles, magnification",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Standard Transformations",
			Subtopics: "Translation, rotation, inversion",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Bilinear (Möbius) Transformation",
			Subtopics: "Cross-ratio, fixed points, mapping properties",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Complex Integration Intro",
			Subtopics: "Contours, line integrals, upper bound",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Cauchy's Integral Theorem",
			Subtopics: "Simply connected domains, path independence",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Cauchy's Integral Formula",
			Subtopics: "Derivatives of analytic functions, Morera's theorem",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Liouville's Theorem & Fundamental Theorem of Algebra",
			Subtopics: "Maximum modulus principle",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Sequences and Series",
			Subtopics: "Convergence, uniform convergence, Weierstrass M-test",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Taylor Series",
			Subtopics: "Analytic representation, radius of convergence",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Laurent Series",
			Subtopics: "Annulus of convergence, singular part",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Classification of Singularities",
			Subtopics: "Isolated, removable, poles, essential singularities",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Residues",
			Subtopics: "Calculation at poles, Residue Theorem",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Evaluation of Real Integrals I",
			Subtopics: "Integrals of rational functions over (0, 2pi)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Evaluation of Real Integrals II",
			Subtopics: "Improper integrals over real axis",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Evaluation of Real Integrals III",
			Subtopics: "Indented contours, Jordan's lemma",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Argument Principle",
			Subtopics: "Rouche's theorem, counting zeros and poles",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Analytic Continuation",
			Subtopics: "Power series method, reflection principle",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Riemann Surfaces",
			Subtopics: "Multivalued functions, branch points",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Applications to Potential Theory",
			Subtopics: "Electrostatics, fluid flow, heat conduction",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Dirichlet & Neumann Problems",
			Subtopics: "Poisson's integral formula",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Fourier Transforms Revisited",
			Subtopics: "Complex form, properties, inversion",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Z-Transform Revisted",
			Subtopics: "Complex variable approach, ROC",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Laplace Transform Inversion",
			Subtopics: "Bromwich contour, residue method",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Special Functions in Complex Plane",
			Subtopics: "Gamma function, Beta function",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Asymptotic Expansions",
			Subtopics: "Method of steepest descent, stationary phase",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Difference Equations",
			Subtopics: "Solution using Z-transforms",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Boundary Value Problems",
			Subtopics: "Use of conformal mapping to solve BVPs",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Schwarz-Christoffel Transformation",
			Subtopics: "Mapping polygons to half-planes",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Fractional Calculus",
			Subtopics: "Differintegrals using Cauchy formula",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Advanced Complex Dynamics",
			Subtopics: "Julia sets, Mandelbrot set basics",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_ev(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "EV Architecture Modeling",
			Subtopics: "Simulink model of EV powertrain",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Battery Cell Characterization",
			Subtopics: "OCV vs SOC curve, internal resistance",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Battery Management System (BMS)",
			Subtopics: "Cell balancing, overcharge protection",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Traction Motor Control",
			Subtopics: "BLDC/PMSM speed control under load",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Regenerative Braking Simulation",
			Subtopics: "Energy recovery calculation, torque control",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "DC-DC Converter for EV",
			Subtopics: "Bidirectional converter operation",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "On-Board Charger Testing",
			Subtopics: "AC-DC rectification, power factor",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Drive Cycle Analysis",
			Subtopics: "WLTP, NEDC emulation, range estimation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Thermal Management System",
			Subtopics: "Battery heating/cooling simulation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Vehicle Dynamics",
			Subtopics: "Tractive effort, rolling resistance, gradeability",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Fuel Cell EV Setup",
			Subtopics: "PEMFC characteristics, hybridization",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "EV Charging Station Protocol",
			Subtopics: "OCPP/CCS protocol simulation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Electric Vehicles",
			Subtopics: "History, environmental impact, types of EVs",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "EV Architectures",
			Subtopics: "BEV, HEV, PHEV, FCEV configurations",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Vehicle Dynamics Fundamentals",
			Subtopics: "Tractive effort, aerodynamic drag, rolling resistance",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Drive Cycles and Range",
			Subtopics: "Standard cycles (NEDC, WLTP, EPA), range estimation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Electric Propulsion Systems",
			Subtopics: "Motor requirements, torque-speed profiles",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "DC Motors in EVs",
			Subtopics: "Series, separately excited, advantages/disadvantages",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Induction Motors in EVs",
			Subtopics: "Vector control, efficiency maps, Tesla approach",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "PMSM & BLDC in EVs",
			Subtopics: "High power density, field weakening, Nissan Leaf approach",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Switched Reluctance Motors",
			Subtopics: "Fault tolerance, torque ripple, rare-earth free",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Power Electronics in EVs",
			Subtopics: "Inverters, bi-directional DC-DC converters",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Energy Storage Systems Intro",
			Subtopics: "Lead-acid, NiMH, Li-ion battery chemistry",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Li-ion Batteries for EVs",
			Subtopics: "NMC, LFP, NCA, energy density, cycle life",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Battery Modeling & Equivalent Circuits",
			Subtopics: "Thevenin model, R-C branches, OCV",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Battery Management Systems (BMS)",
			Subtopics: "Architecture, voltage/current/temp sensing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "State Estimation in BMS",
			Subtopics: "SOC (Coulomb counting, Kalman filter), SOH, SOP",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Cell Balancing Techniques",
			Subtopics: "Passive and active balancing methods",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Thermal Management of Batteries",
			Subtopics: "Air, liquid, phase-change cooling, thermal runaway",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Supercapacitors & Flywheels",
			Subtopics: "Power density, hybridization with batteries",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Fuel Cell Electric Vehicles (FCEV)",
			Subtopics: "PEM fuel cells, hydrogen storage, balance of plant",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "HEV Powertrain Topologies",
			Subtopics: "Series, parallel, power-split (Prius) architectures",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Energy Management Strategies in HEV",
			Subtopics: "Rule-based vs optimization-based control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Regenerative Braking",
			Subtopics: "Brake blending, safety, energy recovery efficiency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "EV Charging Infrastructure",
			Subtopics: "AC vs DC charging, Levels 1/2/3, connector standards",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Fast Charging Technology",
			Subtopics: "DC fast chargers, Chademo, CCS, thermal constraints",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Wireless Power Transfer (WPT)",
			Subtopics: "Inductive/resonant charging, dynamic charging",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Vehicle-to-Grid (V2G) & V2X",
			Subtopics: "Ancillary services, bidirectional chargers, grid impact",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Smart Charging & Microgrids",
			Subtopics: "Peak shaving, demand response, renewable integration",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Communication Protocols in EV",
			Subtopics: "CAN bus, LIN, FlexRay, Automotive Ethernet",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Functional Safety (ISO 26262)",
			Subtopics: "ASIL levels, HARA, fault-tolerant design",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "EMI/EMC in Electric Vehicles",
			Subtopics: "Shielding, filtering, automotive standards",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Sizing of EV Components",
			Subtopics: "Motor, battery, converter rating calculations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Homologation & Testing Standards",
			Subtopics: "ARAI, AIS, crash testing, IP ratings",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Economics & Policy",
			Subtopics: "TCO, FAME policy, subsidies, carbon credits",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Battery Recycling & Circular Economy",
			Subtopics: "Second-life applications, hydrometallurgy",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Autonomous Driving & EVs",
			Subtopics: "Sensors (LiDAR, Radar), ADAS integration",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future Trends in E-Mobility",
			Subtopics: "Solid-state batteries, 800V architectures, hyperloop",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_protection(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Electromechanical Overcurrent Relay",
			Subtopics: "Pick-up/drop-out, time-current curve",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Directional Overcurrent Relay",
			Subtopics: "Phase angle adjustment, torque calculation",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Differential Relay on Transformer",
			Subtopics: "Percentage bias, magnetizing inrush",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Distance Relay (Mho/Impedance)",
			Subtopics: "Reach measurement, zone setting",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Static/Microprocessor Relay Testing",
			Subtopics: "Parameter configuration via software",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Simulation of Sequence Networks",
			Subtopics: "Symmetrical components of faults",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Circuit Breaker Operation",
			Subtopics: "Contact resistance, timing tests",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Generator Protection Simulation",
			Subtopics: "Reverse power, loss of excitation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Busbar Protection Scheme",
			Subtopics: "High impedance differential testing",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Motor Protection Relay",
			Subtopics: "Overload, unbalance, stall protection",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "CT Saturation Effect",
			Subtopics: "Ratio error variation with fault current",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Relay Coordination Study",
			Subtopics: "Grading margin, selectivity on radial feeder",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Fundamentals of Power System Protection",
			Subtopics: "Need, zones, primary/backup, reliability",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Current & Voltage Transformers",
			Subtopics: "Equivalent circuit, burden, accuracy class, ALF",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "CT Saturation & Transients",
			Subtopics: "DC offset, remnant flux, effect on relays",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Electromechanical Relays",
			Subtopics: "Attraction, induction disc/cup types, torque equation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Overcurrent Protection",
			Subtopics: "Definite time, IDMT, instantaneous, relay coordination",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Directional Overcurrent Relays",
			Subtopics: "Phase fault, earth fault, polarizing quantities",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Distance Protection Fundamentals",
			Subtopics: "Impedance, Reactance, Mho relays, R-X diagram",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Advanced Distance Relaying",
			Subtopics: "Quadrilateral characteristics, stepped time-distance",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Distance Protection Issues",
			Subtopics: "Power swing, out-of-step blocking, load encroachment",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Differential Protection Principle",
			Subtopics: "Circulating current, voltage balance, Merz-Price",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Percentage Biased Differential",
			Subtopics: "Through fault stability, slope setting",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Transformer Protection",
			Subtopics: "Inrush current, harmonic restraint, Buchholz relay",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Generator Protection - Stator",
			Subtopics: "Earth fault (100%), phase fault, inter-turn fault",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Generator Protection - Rotor & Misc",
			Subtopics: "Loss of excitation, reverse power, negative sequence",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Busbar Protection",
			Subtopics: "High impedance, low impedance, CT saturation handling",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Motor Protection",
			Subtopics: "Thermal overload, locked rotor, unbalance, under-voltage",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Feeder & Transmission Line Protection",
			Subtopics: "Pilot wire, carrier current protection, phase comparison",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Static Relays",
			Subtopics: "Comparators (Amplitude & Phase), block diagrams",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Microprocessor Based Numerical Relays",
			Subtopics: "Architecture, ADC, DSP, algorithms",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Digital Signal Processing in Relaying",
			Subtopics: "Fourier algorithm, half-cycle/full-cycle windows",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Wide Area Protection (WAMS)",
			Subtopics: "Phasor Measurement Units (PMUs), system integrity",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Physics of Arc Phenomena",
			Subtopics: "Arc initiation, maintenance, arc voltage, theories of interruption",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Circuit Breaker Rating & Terms",
			Subtopics: "Restriking voltage, RRRV, current chopping, resistance switching",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Air Break & Air Blast Breakers",
			Subtopics: "Cross blast, axial blast, arc chutes",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Bulk & Minimum Oil Circuit Breakers",
			Subtopics: "Arc extinction in oil, advantages, fire hazard",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Vacuum Circuit Breakers",
			Subtopics: "High vacuum properties, contact material, chopping",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "SF6 Circuit Breakers",
			Subtopics: "Puffer type, properties of SF6 gas, environmental impact",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Testing of Circuit Breakers",
			Subtopics: "Direct testing, synthetic testing methods",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Overvoltages in Power Systems",
			Subtopics: "Lightning, switching surges, temporary overvoltages",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Protection Against Overvoltages",
			Subtopics: "Surge arresters (Zno), spark gaps, ground wires",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Insulation Coordination",
			Subtopics: "Volt-time curves, BIL, margin of protection",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Substation Earthing",
			Subtopics: "Touch/step potentials, earth mat design",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Smart Grid Protection",
			Subtopics: "Adaptive relaying, IEC 61850 communication standard",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Cybersecurity in Substation Automation",
			Subtopics: "GOOSE/SV messaging security",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "DC System Protection",
			Subtopics: "HVDC line faults, MTDC protection, DC circuit breakers",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "System Integrity Protection Schemes (SIPS)",
			Subtopics: "Under-frequency load shedding, islanding",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_automation(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "PLC Programming Fundamentals",
			Subtopics: "Ladder logic, NO/NC contacts, coils",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Timers and Counters in PLC",
			Subtopics: "TON, TOF, CTU, CTD implementation",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Arithmetic & Logical PLC Operations",
			Subtopics: "Data compare, move, math instructions",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Motor Control via PLC",
			Subtopics: "DOL starter, Star-Delta starter logic",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Traffic Light Control using PLC",
			Subtopics: "Sequential timers, interlocking",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Bottle Filling Plant Simulation",
			Subtopics: "Sensors, actuators, continuous process",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "SCADA HMI Design",
			Subtopics: "Screen creation, tags, animation",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "SCADA-PLC Interfacing",
			Subtopics: "Modbus communication, read/write registers",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "PID Control in PLC",
			Subtopics: "Analog input, tuning parameters, level control",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Pneumatic/Hydraulic Control",
			Subtopics: "Solenoid valves, cylinder actuation via PLC",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "VFD Parameterization",
			Subtopics: "Speed control of motor via PLC/VFD interface",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Industrial Internet of Things (IIoT)",
			Subtopics: "Publishing PLC data to cloud via MQTT",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Industrial Automation",
			Subtopics: "Role of automation, hierarchy (CIM pyramid)",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Sensors & Transducers",
			Subtopics: "Proximity, photoelectric, ultrasonic, encoders",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Actuators & Final Control Elements",
			Subtopics: "Pneumatic/hydraulic cylinders, control valves",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Electric Drives in Automation",
			Subtopics: "Servo motors, stepper motors, VFDs",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Relay Logic Control",
			Subtopics: "Electromechanical relays, contactors, schematics",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Programmable Logic Controllers (PLC)",
			Subtopics: "Architecture, scan cycle, memory mapping",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "PLC Programming Languages",
			Subtopics: "Ladder Diagram, FBD, STL, SFC (IEC 61131-3)",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Ladder Logic Fundamentals",
			Subtopics: "Contacts, coils, latching, interlocking",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Timers & Counters",
			Subtopics: "On-delay, off-delay, up/down counters",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Data Handling & Math Instructions",
			Subtopics: "Move, compare, arithmetic logic",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Advanced PLC Functions",
			Subtopics: "Shift registers, sequencers, PID implementation",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Analog I/O in PLC",
			Subtopics: "Resolution, scaling, 4-20mA loop, 0-10V",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Supervisory Control & Data Acquisition (SCADA)",
			Subtopics: "Architecture, RTU, MTU, HMI",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "SCADA Features & Components",
			Subtopics: "Trending, alarms, datalogging, scripts",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Distributed Control Systems (DCS)",
			Subtopics: "DCS vs PLC/SCADA, architecture, field stations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "DCS Communication & Redundancy",
			Subtopics: "Controller redundancy, network rings",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Industrial Communication Networks",
			Subtopics: "OSI model in industry, topologies",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Serial Protocols",
			Subtopics: "RS-232, RS-485, Modbus RTU/ASCII",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Fieldbus Technology",
			Subtopics: "Profibus DP/PA, Foundation Fieldbus, CANopen",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Industrial Ethernet",
			Subtopics: "Profinet, EtherCAT, Modbus TCP/IP",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "OPC Standard",
			Subtopics: "OPC DA, OPC UA (Unified Architecture), interoperability",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Process Control Basics",
			Subtopics: "Continuous vs discrete control, P/I/D modes",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Tuning of PID Controllers",
			Subtopics: "Ziegler-Nichols, auto-tuning in PLCs",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Machine Vision in Automation",
			Subtopics: "Cameras, lighting, image processing, inspection",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Robotics in Manufacturing",
			Subtopics: "Manipulators, kinematics, end-effectors, teach pendant",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "CNC Machines",
			Subtopics: "G-code, M-code, axis control, interpolations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Safety in Automation",
			Subtopics: "Safety PLCs, light curtains, emergency stops (SIL)",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Pneumatics & Hydraulics Circuits",
			Subtopics: "Compressors, pumps, directional valves",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Electro-Pneumatics",
			Subtopics: "Solenoid control, cascade method, step counter",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Building Automation Systems (BAS)",
			Subtopics: "HVAC control, lighting, energy management",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Industry 4.0 Concepts",
			Subtopics: "Cyber-physical systems, digital twin, Big Data",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Industrial IoT (IIoT)",
			Subtopics: "Edge computing, cloud platforms, predictive maintenance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Cybersecurity in ICS",
			Subtopics: "Stuxnet, firewalls, network segmentation (Purdue model)",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "System Integration",
			Subtopics: "Interfacing multi-vendor equipment, project lifecycle",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Economics of Automation",
			Subtopics: "ROI, downtime costs, productivity metrics",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Case Studies",
			Subtopics: "Automotive assembly, chemical process, water treatment",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_energy_management(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Energy Audit Instrument Familiarization",
			Subtopics: "Power analyzer, lux meter, anemometer",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Load Profile Analysis",
			Subtopics: "Maximum demand, load factor calculation",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Power Factor Improvement",
			Subtopics: "Capacitor bank sizing, kVAR calculation",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Motor Efficiency Testing",
			Subtopics: "Slip method, no-load/full-load losses",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Lighting System Audit",
			Subtopics: "Lux level measurement, LED replacement ROI",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "HVAC System Performance",
			Subtopics: "COP calculation, airflow measurement",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Pump/Fan Efficiency",
			Subtopics: "Flow rate, head, power consumption",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Harmonic Analysis",
			Subtopics: "THD measurement, filter impact on efficiency",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Tariff Structure Analysis",
			Subtopics: "Time-of-use pricing, penalty calculations",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Energy Simulation Software",
			Subtopics: "eQUEST or EnergyPlus basics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Thermal Audit (Boiler/Furnace)",
			Subtopics: "Flue gas analysis, efficiency calculation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "Financial Analysis",
			Subtopics: "NPV, IRR computation using spreadsheets",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Energy Scenario & Policy",
			Subtopics: "Global/National energy trends, EC Act 2001",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Energy Management Basics",
			Subtopics: "Definition, objectives, energy management system (ISO 50001)",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Energy Audit Methodology",
			Subtopics: "Preliminary vs Detailed audit, instrumentation",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Material & Energy Balance",
			Subtopics: "Sankey diagrams, facility energy flows",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Energy Economics & Financial Analysis",
			Subtopics: "Simple payback, ROI, NPV, IRR",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Life Cycle Costing",
			Subtopics: "Cash flow analysis, sensitivity analysis, inflation",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Electricity Tariffs & Billing",
			Subtopics: "Two-part tariff, maximum demand, TOU/TOD rates",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Load Management & Demand Control",
			Subtopics: "Peak clipping, valley filling, load shifting",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Power Factor & Economics",
			Subtopics: "Penalties, capacitor sizing, optimum power factor",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Energy Efficiency in Motors",
			Subtopics: "Standard vs Premium efficiency motors, losses",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Motor Speed Control",
			Subtopics: "VFDs, fluid couplings, energy savings in fans/pumps",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Energy Efficiency in Transformers",
			Subtopics: "Load vs no-load losses, sizing, amorphous core",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Cables & Distribution",
			Subtopics: "Voltage drop, I2R loss reduction, reactive power compensation",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Lighting Systems",
			Subtopics: "Efficacy, CRI, LED tech, daylight integration, occupancy sensors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "HVAC Systems Basics",
			Subtopics: "Refrigeration cycle, chillers, AHUs, cooling towers",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "Energy Conservation in HVAC",
			Subtopics: "VAV systems, economizers, COP optimization",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Pumps & Pumping Systems",
			Subtopics: "System curve, pump curve, parallel/series operation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Fans & Blowers",
			Subtopics: "Fan laws, damper vs speed control, efficiency metrics",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Compressed Air Systems",
			Subtopics: "Leakages, specific power, receiver sizing, waste heat recovery",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Thermal Energy Basics",
			Subtopics: "Steam properties, fuel combustion, stoichiometric air",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Boilers & Furnaces",
			Subtopics: "Efficiency evaluation (direct/indirect methods), blowdown",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Steam Distribution & Traps",
			Subtopics: "Insulation, flash steam recovery, thermostatic/float traps",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Waste Heat Recovery",
			Subtopics: "Recuperators, regenerators, economizers, heat wheels",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Cogeneration (CHP)",
			Subtopics: "Topping/Bottoming cycles, heat-to-power ratio, gas turbines",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Trigeneration",
			Subtopics: "Combined cooling, heat, and power (CCHP), absorption chillers",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Energy Storage for Management",
			Subtopics: "Thermal storage (ice/water), battery systems",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Smart Meters & AMI",
			Subtopics: "Real-time monitoring, data analytics, consumer engagement",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Energy Performance Contracting",
			Subtopics: "ESCOs, guaranteed savings, shared savings models",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Building Energy Codes",
			Subtopics: "ECBC, LEED, Green Buildings, passive architecture",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Industrial Sector Conservation",
			Subtopics: "Cement, steel, textile industry specific measures",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Electrical Safety & Earthing",
			Subtopics: "Impact on efficiency, leakage currents",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Renewable Energy Integration",
			Subtopics: "Solar rooftop ROI, net metering, self-consumption",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Power Quality & Energy Efficiency",
			Subtopics: "Harmonics impact on losses, IEEE standards",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "Carbon Footprint & Trading",
			Subtopics: "GHG emissions, CDM, carbon credits/markets",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Energy Management Information Systems",
			Subtopics: "Dashboards, KPIs, baseline establishment",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future of Energy Management",
			Subtopics: "AI/ML in energy forecasting, IoT sensors",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}

func (a *SyllabusStructureAgent) generateLectures_power_quality(subjectName string, isLab bool) []Lecture {
	var lecs []Lecture
	if isLab {
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       1,
			Title:     "Power Quality Analyzer Setup",
			Subtopics: "Voltage/current monitoring, logging",
			Bloom:     "L3_APPLY",
			Prereq:    "None",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       2,
			Title:     "Voltage Sag/Swell Simulation",
			Subtopics: "Fault impact, heavy load switching",
			Bloom:     "L3_APPLY",
			Prereq:    "1",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       3,
			Title:     "Harmonic Spectrum Analysis",
			Subtopics: "Non-linear load (rectifier, VFD), THD",
			Bloom:     "L3_APPLY",
			Prereq:    "2",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       4,
			Title:     "Flicker Measurement",
			Subtopics: "Arc furnace model, voltage fluctuation",
			Bloom:     "L3_APPLY",
			Prereq:    "3",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       5,
			Title:     "Passive Filter Design",
			Subtopics: "Single-tuned, high-pass filter sizing",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 1",
			Num:       6,
			Title:     "Active Power Filter Simulation",
			Subtopics: "Shunt APF, reference current generation",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       7,
			Title:     "Dynamic Voltage Restorer (DVR)",
			Subtopics: "Sag mitigation, series injection",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       8,
			Title:     "Unified Power Quality Conditioner (UPQC)",
			Subtopics: "Simultaneous sag/harmonic correction",
			Bloom:     "L4_ANALYZE",
			Prereq:    "7",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       9,
			Title:     "Grounding System Analysis",
			Subtopics: "Ground loop noise, neutral current",
			Bloom:     "L4_ANALYZE",
			Prereq:    "8",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       10,
			Title:     "Capacitor Switching Transients",
			Subtopics: "Inrush current, voltage magnification",
			Bloom:     "L4_ANALYZE",
			Prereq:    "9",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       11,
			Title:     "Custom Power Park Simulation",
			Subtopics: "Microgrid PQ enhancement",
			Bloom:     "L4_ANALYZE",
			Prereq:    "10",
			IsLab:     true,
		})
		lecs = append(lecs, Lecture{
			Module:    "Cycle 2",
			Num:       12,
			Title:     "IEEE 519 Standard Compliance",
			Subtopics: "Report generation, limits verification",
			Bloom:     "L4_ANALYZE",
			Prereq:    "11",
			IsLab:     true,
		})
	} else {
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       1,
			Title:     "Introduction to Power Quality",
			Subtopics: "Definition, scope, concerns for modern equipment",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "None",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       2,
			Title:     "Power Quality Standards",
			Subtopics: "IEEE 519, IEEE 1159, IEC 61000 series",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "1",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       3,
			Title:     "Categorization of PQ Issues",
			Subtopics: "Transients, RMS variations, waveform distortion",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "2",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       4,
			Title:     "Voltage Sags & Interruptions",
			Subtopics: "Causes (faults, motor starting), characteristics",
			Bloom:     "L2_UNDERSTAND",
			Prereq:    "3",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       5,
			Title:     "Voltage Swells & Overvoltages",
			Subtopics: "Causes (load rejection, faults), capacitor switching",
			Bloom:     "L3_APPLY",
			Prereq:    "4",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       6,
			Title:     "Transients in Power Systems",
			Subtopics: "Impulsive vs oscillatory, lightning, switching",
			Bloom:     "L3_APPLY",
			Prereq:    "5",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       7,
			Title:     "Long-Duration Voltage Variations",
			Subtopics: "Overvoltage, undervoltage, sustained interruptions",
			Bloom:     "L3_APPLY",
			Prereq:    "6",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       8,
			Title:     "Waveform Distortion (Harmonics)",
			Subtopics: "Integer harmonics, interharmonics, subharmonics",
			Bloom:     "L3_APPLY",
			Prereq:    "7",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 1",
			Num:       9,
			Title:     "Sources of Harmonics",
			Subtopics: "Non-linear loads, converters, SMPS, arc furnaces",
			Bloom:     "L3_APPLY",
			Prereq:    "8",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       10,
			Title:     "Effects of Harmonics",
			Subtopics: "Transformer heating, motor derating, neutral currents",
			Bloom:     "L3_APPLY",
			Prereq:    "9",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       11,
			Title:     "Harmonic Indices",
			Subtopics: "THD, TDD, crest factor, K-factor transformers",
			Bloom:     "L3_APPLY",
			Prereq:    "10",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       12,
			Title:     "Voltage Fluctuation & Flicker",
			Subtopics: "Human eye response, flicker severity indices (Pst, Plt)",
			Bloom:     "L3_APPLY",
			Prereq:    "11",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       13,
			Title:     "Power Frequency Variations",
			Subtopics: "Grid imbalance, generator limits",
			Bloom:     "L3_APPLY",
			Prereq:    "12",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       14,
			Title:     "Voltage Unbalance",
			Subtopics: "Symmetrical components, negative sequence effects on motors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "13",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       15,
			Title:     "Power Quality Monitoring",
			Subtopics: "Instruments, locations, monitoring duration",
			Bloom:     "L4_ANALYZE",
			Prereq:    "14",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       16,
			Title:     "PQ Data Analysis",
			Subtopics: "Statistical evaluation, CBEMA and ITIC curves",
			Bloom:     "L4_ANALYZE",
			Prereq:    "15",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       17,
			Title:     "Mitigation of Voltage Sags",
			Subtopics: "Equipment sensitivity, UPS, flywheels, SMES",
			Bloom:     "L4_ANALYZE",
			Prereq:    "16",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 2",
			Num:       18,
			Title:     "Dynamic Voltage Restorer (DVR)",
			Subtopics: "Working principle, series compensation, topologies",
			Bloom:     "L4_ANALYZE",
			Prereq:    "17",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       19,
			Title:     "Distribution STATCOM (D-STATCOM)",
			Subtopics: "Shunt compensation, reactive power, voltage regulation",
			Bloom:     "L4_ANALYZE",
			Prereq:    "18",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       20,
			Title:     "Harmonic Mitigation Techniques",
			Subtopics: "Phase multiplication, zig-zag transformers, line reactors",
			Bloom:     "L4_ANALYZE",
			Prereq:    "19",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       21,
			Title:     "Passive Harmonic Filters",
			Subtopics: "Design of single tuned, double tuned, damped filters",
			Bloom:     "L4_ANALYZE",
			Prereq:    "20",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       22,
			Title:     "Active Power Filters (APF)",
			Subtopics: "Shunt APF, Series APF, control algorithms (p-q theory)",
			Bloom:     "L4_ANALYZE",
			Prereq:    "21",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       23,
			Title:     "Unified Power Quality Conditioner (UPQC)",
			Subtopics: "Combined series/shunt, power flow, architecture",
			Bloom:     "L5_EVALUATE",
			Prereq:    "22",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       24,
			Title:     "Grounding & Wiring Issues",
			Subtopics: "Safety vs PQ, ground loops, isolated grounds",
			Bloom:     "L5_EVALUATE",
			Prereq:    "23",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       25,
			Title:     "Transient Overvoltage Protection",
			Subtopics: "Surge arresters, TVSS, shielding, line terminations",
			Bloom:     "L5_EVALUATE",
			Prereq:    "24",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       26,
			Title:     "Power Factor vs Power Quality",
			Subtopics: "Displacement vs distortion PF, capacitor resonance",
			Bloom:     "L5_EVALUATE",
			Prereq:    "25",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 3",
			Num:       27,
			Title:     "Distributed Generation Impact on PQ",
			Subtopics: "Islanding, harmonics from inverters, voltage rise",
			Bloom:     "L5_EVALUATE",
			Prereq:    "26",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       28,
			Title:     "Smart Grid & Power Quality",
			Subtopics: "Advanced metering, predictive maintenance, real-time control",
			Bloom:     "L5_EVALUATE",
			Prereq:    "27",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       29,
			Title:     "Custom Power Devices Overview",
			Subtopics: "Solid state breaker, SSTS, premium power parks",
			Bloom:     "L5_EVALUATE",
			Prereq:    "28",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       30,
			Title:     "Economic Impacts of PQ",
			Subtopics: "Cost of downtime, scrap, equipment failure",
			Bloom:     "L5_EVALUATE",
			Prereq:    "29",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       31,
			Title:     "Immunity of Electronic Equipment",
			Subtopics: "IEC limits, ride-through capabilities",
			Bloom:     "L5_EVALUATE",
			Prereq:    "30",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       32,
			Title:     "Electromagnetic Compatibility (EMC)",
			Subtopics: "Conducted/radiated emissions, susceptibility",
			Bloom:     "L5_EVALUATE",
			Prereq:    "31",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       33,
			Title:     "Modeling & Simulation of PQ",
			Subtopics: "MATLAB/Simulink tools, harmonic load flow",
			Bloom:     "L6_CREATE",
			Prereq:    "32",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       34,
			Title:     "PQ Auditing Procedure",
			Subtopics: "Site survey, measurement points, root cause analysis",
			Bloom:     "L6_CREATE",
			Prereq:    "33",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       35,
			Title:     "Case Studies: Industrial PQ",
			Subtopics: "Arc furnace, rolling mill, semiconductor fab",
			Bloom:     "L6_CREATE",
			Prereq:    "34",
			IsLab:     false,
		})
		lecs = append(lecs, Lecture{
			Module:    "Unit 4",
			Num:       36,
			Title:     "Future Trends in Power Quality",
			Subtopics: "DC microgrids, wide bandgap devices effect",
			Bloom:     "L6_CREATE",
			Prereq:    "35",
			IsLab:     false,
		})
	}
	return lecs
}
