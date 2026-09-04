package course_agents

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// CourseOrchestrator coordinates the 6 Go course creation agents.
// It supports:
//   - Dedicated Subject Folders: Each course has its own independent folder and curriculum_spec.json
//   - SyllabusMode toggle: UseR24Predefined (default) or GenerateCustom
//   - Integrated Version Control (VCS): Full history, immutable snapshots, diffs, and instant rollbacks
type CourseOrchestrator struct {
	baseOutputDir  string
	syllabusMode   SyllabusMode
	r24Parser      *R24SyllabusParser
	versionManager *CourseVersionManager
	resourceAgent  *ResourceCollectorAgent
	syllabusAgent  *SyllabusStructureAgent
	stnAgent       *STNGraphBuilderAgent
	contentAgent   *ContentSynthesizerAgent
	demoAgent      *InteractiveDemoAgent
	facultyAgent   *FacultyDashboardAgent
	textbookAgent  *AITextbookEnhancerAgent
}

// NewCourseOrchestrator initializes the master coordinator
func NewCourseOrchestrator(baseOutputDir string) *CourseOrchestrator {
	if baseOutputDir == "" {
		baseOutputDir = "course_bootstrap"
	}
	return &CourseOrchestrator{
		baseOutputDir:  baseOutputDir,
		syllabusMode:   UseR24Predefined,
		r24Parser:      NewR24SyllabusParser(""),
		versionManager: NewCourseVersionManager(baseOutputDir),
		resourceAgent:  NewResourceCollectorAgent(),
		syllabusAgent:  NewSyllabusStructureAgent(),
		stnAgent:       NewSTNGraphBuilderAgent(),
		contentAgent:   NewContentSynthesizerAgent(),
		demoAgent:      NewInteractiveDemoAgent(),
		facultyAgent:   NewFacultyDashboardAgent(),
		textbookAgent:  NewAITextbookEnhancerAgent(baseOutputDir),
	}
}

// SetSyllabusMode toggles between predefined R24 syllabus and custom generation
func (o *CourseOrchestrator) SetSyllabusMode(mode SyllabusMode) {
	o.syllabusMode = mode
	if mode == UseR24Predefined {
		log.Printf("📋 [Orchestrator] Syllabus mode: USE R24 PREDEFINED (official university syllabus)")
	} else {
		log.Printf("📋 [Orchestrator] Syllabus mode: GENERATE CUSTOM (discipline-specific auto-generation)")
	}
}

// SetR24CurriculumPath overrides the default path to curriculum_pdf.json
func (o *CourseOrchestrator) SetR24CurriculumPath(path string) {
	o.r24Parser = NewR24SyllabusParser(path)
}

// SplitCurricula separates the monolithic curriculum JSON into individual course folders
func (o *CourseOrchestrator) SplitCurricula(curriculumPath string) (int, error) {
	return o.versionManager.SplitCurriculumToSubjectFolders(curriculumPath)
}

// SaveVersion manually creates an immutable named version of a course
func (o *CourseOrchestrator) SaveVersion(courseCode, author, message, tag string) (*CourseVersion, error) {
	return o.versionManager.SaveVersion(courseCode, author, message, tag)
}

// ListVersions returns the history of snapshots for a course
func (o *CourseOrchestrator) ListVersions(courseCode string) ([]CourseVersion, error) {
	return o.versionManager.ListVersions(courseCode)
}

// RevertVersion rolls back a course to a previous snapshot
func (o *CourseOrchestrator) RevertVersion(courseCode, targetVersionID string) error {
	return o.versionManager.RevertToVersion(courseCode, targetVersionID)
}

// DiffVersions compares two versions of a course's syllabus
func (o *CourseOrchestrator) DiffVersions(courseCode, v1ID, v2ID string) (string, error) {
	return o.versionManager.DiffVersions(courseCode, v1ID, v2ID)
}

// PrintVersionHistory outputs formatted version history to stdout
func (o *CourseOrchestrator) PrintVersionHistory(courseCode string) {
	o.versionManager.PrintVersionHistory(courseCode)
}

// BuildCourse executes the full 6-agent pipeline for a single course
func (o *CourseOrchestrator) BuildCourse(courseCode, subjectName, rawSyllabus, description string) (*GenerationResult, error) {
	log.Printf("🚀 [Go Agent Swarm] Initializing Course Creation for: [%s] %s", courseCode, subjectName)

	courseDir := filepath.Join(o.baseOutputDir, strings.ReplaceAll(courseCode, " ", "_"))
	lecturesDir := filepath.Join(courseDir, "lectures")
	portalDir := filepath.Join(courseDir, "interactive_portal")

	if err := os.MkdirAll(lecturesDir, 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(portalDir, 0755); err != nil {
		return nil, err
	}

	// 1. Resource Collection Agent
	resources := o.resourceAgent.Collect(courseCode, subjectName, description)
	resJSONPath := filepath.Join(courseDir, "resources.json")
	resBytes, _ := json.MarshalIndent(resources, "", "  ")
	_ = os.WriteFile(resJSONPath, resBytes, 0644)

	// 2. Syllabus Structure — Check Dedicated Folder Spec First
	var courseStructure CourseStructure

	if o.syllabusMode == UseR24Predefined {
		// First try reading from the course's dedicated curriculum_spec.json
		if spec, err := o.versionManager.LoadCourseSpec(courseCode); err == nil && spec != nil {
			log.Printf("📂 [Dedicated Course Spec] Loaded local curriculum_spec.json for [%s]", courseCode)
			courseStructure = o.buildFromParsedSpec(courseCode, spec)
		} else {
			// Otherwise fallback to master R24 parser
			courseStructure = o.buildFromR24(courseCode, subjectName, rawSyllabus)
		}
	}

	if courseStructure.TotalLectures == 0 {
		// FALLBACK: R24 data not found or mode is GenerateCustom — auto-generate
		if o.syllabusMode == UseR24Predefined {
			log.Printf("⚠️ [Orchestrator] R24 syllabus not found for [%s], falling back to custom generation", courseCode)
		}
		courseStructure = o.syllabusAgent.StructureCourse(courseCode, subjectName, rawSyllabus)
		courseStructure.SyllabusSource = GenerateCustom
	}

	// Also ensure a local curriculum_spec.json exists in this course's dedicated folder
	specPath := filepath.Join(courseDir, "curriculum_spec.json")
	if _, err := os.Stat(specPath); os.IsNotExist(err) {
		r24Course := o.r24Parser.GetCourse(courseCode)
		if r24Course != nil {
			specData, _ := json.MarshalIndent(r24Course, "", "  ")
			_ = os.WriteFile(specPath, specData, 0644)
		}
	}

	// Write syllabus CSV
	csvPath := filepath.Join(courseDir, "syllabus.csv")
	csvFile, err := os.Create(csvPath)
	if err == nil {
		w := csv.NewWriter(csvFile)
		_ = w.Write([]string{"Course Code", "Course Name", "Module", "Lecture Topic", "Subtopics", "Prerequisites", "Bloom Level", "Source"})
		sourceLabel := "R24_Predefined"
		if courseStructure.SyllabusSource == GenerateCustom {
			sourceLabel = "Custom_Generated"
		}
		for _, lec := range courseStructure.Lectures {
			_ = w.Write([]string{
				courseCode,
				subjectName,
				lec.Module,
				lec.Title,
				lec.Subtopics,
				lec.Prereq,
				lec.Bloom,
				sourceLabel,
			})
		}
		w.Flush()
		csvFile.Close()
	}

	// 3. STN Graph Builder Agent
	stnGraph := o.stnAgent.BuildSTN(courseStructure)
	stnJSONPath := filepath.Join(courseDir, "stn_graph.json")
	stnBytes, _ := json.MarshalIndent(stnGraph, "", "  ")
	_ = os.WriteFile(stnJSONPath, stnBytes, 0644)

	// 4. Content Synthesizer Agent (Parallel Goroutines for all 36 lectures/12 experiments)
	var wg sync.WaitGroup
	for _, lec := range courseStructure.Lectures {
		wg.Add(1)
		go func(l Lecture) {
			defer wg.Done()
			mdContent := o.contentAgent.SynthesizeLecture(courseStructure, l, resources)
			lecPath := filepath.Join(lecturesDir, fmt.Sprintf("L%d.md", l.Num))
			_ = os.WriteFile(lecPath, []byte(mdContent), 0644)
		}(lec)
	}
	wg.Wait()

	// 5. Interactive Demo Agent (HTML5/Canvas Web Portal)
	portalHTML, err := o.demoAgent.GeneratePortal(courseStructure, resources, portalDir)
	if err != nil {
		log.Printf("Warning: failed to generate interactive portal: %v", err)
	}

	// 6. Faculty Dashboard Reference Compendium (GATE + Industry ready)
	_, err = o.facultyAgent.GenerateFacultyDashboard(courseStructure, resources, courseDir)
	if err != nil {
		log.Printf("Warning: failed to generate faculty dashboard: %v", err)
	}

	// 7. AI-Generated Master Reference Textbook & Pedagogical Enhancement Report
	textbookMD, enhancementReport := o.textbookAgent.EnhanceAndGenerateTextbook(courseStructure, resources)
	log.Printf("📖 [AI Textbook Swarm] Generated Master Reference Textbook for [%s] (%d bytes, %d subtopics enhanced)",
		courseCode, len(textbookMD), enhancementReport.TotalSubtopics)

	// 8. Auto-save Version Snapshot
	_, _ = o.versionManager.SaveVersion(courseCode, "Faculty AI Swarm", "Automated course synthesis & master textbook build", "latest")

	modeLabel := "R24 Predefined"
	if courseStructure.SyllabusSource == GenerateCustom {
		modeLabel = "Custom Generated"
	}
	log.Printf("✅ [Go Swarm] Completed Course [%s] with %d lectures & %d STN nodes [Syllabus: %s]",
		courseCode, len(courseStructure.Lectures), stnGraph.TotalNodes, modeLabel)

	return &GenerationResult{
		CourseCode:        courseCode,
		SubjectName:       subjectName,
		Category:          resources.Category,
		IsLab:             courseStructure.IsLab,
		TotalLectures:     len(courseStructure.Lectures),
		ModulesCount:      len(courseStructure.Modules),
		STNNodes:          stnGraph.TotalNodes,
		STNEdges:          stnGraph.TotalEdges,
		SyllabusCSV:       csvPath,
		STNJSON:           stnJSONPath,
		ResourcesJSON:     resJSONPath,
		LecturesDir:       lecturesDir,
		InteractivePortal: portalHTML,
		AITextbookPath:    enhancementReport.MasterTextbookPath,
		EnhancementReport: filepath.Join(courseDir, "pedagogical_enhancement_report.json"),
	}, nil
}

func (o *CourseOrchestrator) buildFromParsedSpec(courseCode string, spec *R24ParsedCourse) CourseStructure {
	nameUpper := strings.ToUpper(spec.CourseName)
	isLab := strings.Contains(nameUpper, "LAB") || strings.Contains(nameUpper, "PRACTICAL")

	var lectures []Lecture
	if isLab {
		lectures = o.r24Parser.DecomposeParsedLabExperiments(spec)
	} else {
		lectures = o.r24Parser.DecomposeParsedCourse(spec)
	}

	if len(lectures) == 0 {
		return CourseStructure{}
	}

	moduleMap := make(map[string]bool)
	var modules []string
	for _, l := range lectures {
		if !moduleMap[l.Module] {
			moduleMap[l.Module] = true
			modules = append(modules, l.Module)
		}
	}

	outcomes := spec.CourseOutcomes
	if len(outcomes) == 0 {
		outcomes = []string{
			fmt.Sprintf("CO1: Understand the fundamental governing principles of %s.", spec.CourseName),
			fmt.Sprintf("CO2: Apply analytical models and transform methods to %s.", spec.CourseName),
			"CO3: Analyze steady-state and dynamic responses under operational constraints.",
			"CO4: Synthesize robust engineering solutions aligned with industry standards.",
		}
	}

	return CourseStructure{
		CourseCode:     courseCode,
		CourseName:     spec.CourseName,
		IsLab:          isLab,
		TotalLectures:  len(lectures),
		Modules:        modules,
		CourseOutcomes: outcomes,
		Lectures:       lectures,
		SyllabusSource: UseR24Predefined,
	}
}

func (o *CourseOrchestrator) buildFromR24(courseCode, subjectName, rawSyllabus string) CourseStructure {
	if rawSyllabus != "" {
		return o.syllabusAgent.StructureCourse(courseCode, subjectName, rawSyllabus)
	}

	if err := o.r24Parser.Load(); err != nil {
		log.Printf("⚠️ [R24 Parser] Could not load R24 curriculum: %v", err)
		return CourseStructure{}
	}

	r24Course := o.r24Parser.GetCourse(courseCode)
	if r24Course == nil {
		return CourseStructure{}
	}

	nameUpper := strings.ToUpper(subjectName)
	if subjectName == "" {
		nameUpper = strings.ToUpper(r24Course.CourseName)
		subjectName = r24Course.CourseName
	}
	isLab := strings.Contains(nameUpper, "LAB") || strings.Contains(nameUpper, "PRACTICAL")

	var lectures []Lecture
	if isLab {
		lectures = o.r24Parser.DecomposeToLabExperiments(courseCode)
	} else {
		lectures = o.r24Parser.DecomposeToLectures(courseCode)
	}

	if len(lectures) == 0 {
		return CourseStructure{}
	}

	moduleMap := make(map[string]bool)
	var modules []string
	for _, l := range lectures {
		if !moduleMap[l.Module] {
			moduleMap[l.Module] = true
			modules = append(modules, l.Module)
		}
	}

	outcomes := r24Course.CourseOutcomes
	if len(outcomes) == 0 {
		outcomes = []string{
			fmt.Sprintf("CO1: Understand the fundamental principles of %s.", subjectName),
			fmt.Sprintf("CO2: Apply analytical and computational methods to %s problems.", subjectName),
			"CO3: Analyze system behavior and performance under various operating conditions.",
			"CO4: Design and evaluate engineering solutions meeting specified criteria.",
		}
	}

	return CourseStructure{
		CourseCode:     courseCode,
		CourseName:     subjectName,
		IsLab:          isLab,
		TotalLectures:  len(lectures),
		Modules:        modules,
		CourseOutcomes: outcomes,
		Lectures:       lectures,
		SyllabusSource: UseR24Predefined,
	}
}
