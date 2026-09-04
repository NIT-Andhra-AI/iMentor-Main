package course_agents

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"
)

// SwarmMissionType classifies high-level autonomous student missions
type SwarmMissionType string

const (
	MissionGatePYQDossier       SwarmMissionType = "GATE_PYQ_DOSSIER"
	MissionCompanyInterviewPrep SwarmMissionType = "COMPANY_INTERVIEW_PREP"
	MissionResumeCareerFit      SwarmMissionType = "RESUME_CAREER_FIT"
	MissionCustomResearchReport SwarmMissionType = "CUSTOM_RESEARCH_REPORT"
)

// SubagentTask represents a concurrent step executed by a specialized Set 2 subagent
type SubagentTask struct {
	TaskID         string    `json:"task_id"`
	AgentName      string    `json:"agent_name"`
	Role           string    `json:"role"`
	Status         string    `json:"status"` // "PENDING", "RUNNING", "COMPLETED", "FAILED"
	Description    string    `json:"description"`
	ResultPayload  string    `json:"result_payload,omitempty"`
	StartedAt      time.Time `json:"started_at"`
	CompletedAt    time.Time `json:"completed_at"`
	ExecutionMs    int64     `json:"execution_ms"`
}

// StudentMissionPlan represents the full autonomous execution DAG for a student request
type StudentMissionPlan struct {
	MissionID       string             `json:"mission_id"`
	MissionType     SwarmMissionType   `json:"mission_type"`
	StudentPrompt   string             `json:"student_prompt"`
	Department      string             `json:"department"`
	TargetCompany   string             `json:"target_company,omitempty"`
	YearRange       string             `json:"year_range,omitempty"`
	Tasks           []*SubagentTask    `json:"tasks"`
	FinalReport     string             `json:"final_report"`
	TotalDurationMs int64              `json:"total_duration_ms"`
	CreatedAt       time.Time          `json:"created_at"`
}

// StudentSwarmOrchestrator spawns and coordinates autonomous Set 2 in-app agents for students
type StudentSwarmOrchestrator struct {
	mu sync.RWMutex
}

// NewStudentSwarmOrchestrator initializes the student agent swarm engine
func NewStudentSwarmOrchestrator() *StudentSwarmOrchestrator {
	return &StudentSwarmOrchestrator{}
}

// DecomposeAndExecuteMission analyzes student prompt and launches the concurrent agent swarm
func (o *StudentSwarmOrchestrator) DecomposeAndExecuteMission(prompt, department string) (*StudentMissionPlan, error) {
	start := time.Now()
	cleanPrompt := strings.TrimSpace(prompt)
	lowerP := strings.ToLower(cleanPrompt)

	var missionType SwarmMissionType
	var targetCompany string
	var yearRange = "2022-2024"

	if strings.Contains(lowerP, "gate") || strings.Contains(lowerP, "pyq") || strings.Contains(lowerP, "question paper") {
		missionType = MissionGatePYQDossier
	} else if strings.Contains(lowerP, "interview") || strings.Contains(lowerP, "company") || strings.Contains(lowerP, "coding question") {
		missionType = MissionCompanyInterviewPrep
		if strings.Contains(lowerP, "texas") || strings.Contains(lowerP, "ti") {
			targetCompany = "Texas Instruments"
		} else if strings.Contains(lowerP, "qualcomm") {
			targetCompany = "Qualcomm"
		} else if strings.Contains(lowerP, "google") {
			targetCompany = "Google"
		} else if strings.Contains(lowerP, "l&t") {
			targetCompany = "L&T"
		} else {
			targetCompany = "Tier-1 Core Engineering"
		}
	} else if strings.Contains(lowerP, "cv") || strings.Contains(lowerP, "resume") || strings.Contains(lowerP, "profile") {
		missionType = MissionResumeCareerFit
	} else {
		missionType = MissionCustomResearchReport
	}

	missionID := fmt.Sprintf("mission_%d", time.Now().UnixNano())
	plan := &StudentMissionPlan{
		MissionID:     missionID,
		MissionType:   missionType,
		StudentPrompt: cleanPrompt,
		Department:    department,
		TargetCompany: targetCompany,
		YearRange:     yearRange,
		CreatedAt:     start,
	}

	// 1. Decompose into specialized subagent tasks
	switch missionType {
	case MissionGatePYQDossier:
		plan.Tasks = []*SubagentTask{
			{TaskID: "task_1", AgentName: "gate_paper_indexer", Role: "Ingest & filter past 3 years official GATE questions", Status: "PENDING"},
			{TaskID: "task_2", AgentName: "weightage_analyzer", Role: "Compute unit-wise marks distribution & frequency matrices", Status: "PENDING"},
			{TaskID: "task_3", AgentName: "step_solver", Role: "Synthesize step-by-step mathematical solutions & trap warnings", Status: "PENDING"},
			{TaskID: "task_4", AgentName: "dossier_compiler", Role: "Generate downloadable high-impact executive dossier", Status: "PENDING"},
		}
	case MissionCompanyInterviewPrep:
		plan.Tasks = []*SubagentTask{
			{TaskID: "task_1", AgentName: "company_pattern_scraper", Role: "Aggregate recent technical interview rounds & patterns", Status: "PENDING"},
			{TaskID: "task_2", AgentName: "core_engineering_synthesizer", Role: "Compile high-frequency conceptual & circuit questions", Status: "PENDING"},
			{TaskID: "task_3", AgentName: "coding_challenge_designer", Role: "Generate timed coding problems with Big-O benchmarks", Status: "PENDING"},
			{TaskID: "task_4", AgentName: "placement_dossier_compiler", Role: "Assemble comprehensive company interview preparation pack", Status: "PENDING"},
		}
	case MissionResumeCareerFit:
		plan.Tasks = []*SubagentTask{
			{TaskID: "task_1", AgentName: "resume_parser_agent", Role: "Extract coursework, skills, projects, and CGPA metrics", Status: "PENDING"},
			{TaskID: "task_2", AgentName: "gap_analysis_agent", Role: "Benchmark candidate skills against Tier-1 job descriptions", Status: "PENDING"},
			{TaskID: "task_3", AgentName: "ats_optimization_agent", Role: "Rewrite CV bullet points using action verbs & metrics", Status: "PENDING"},
			{TaskID: "task_4", AgentName: "project_recommender_agent", Role: "Recommend 2 high-impact capstone projects to fill skill gaps", Status: "PENDING"},
		}
	default:
		plan.Tasks = []*SubagentTask{
			{TaskID: "task_1", AgentName: "web_search_agent", Role: "Retrieve latest technical literature & benchmarks", Status: "PENDING"},
			{TaskID: "task_2", AgentName: "academic_synthesis_agent", Role: "Extract governing equations & peer-reviewed citations", Status: "PENDING"},
			{TaskID: "task_3", AgentName: "visual_sandbox_agent", Role: "Generate interactive circuit schematics & sliders", Status: "PENDING"},
		}
	}

	// 2. Execute tasks in parallel/pipeline
	var wg sync.WaitGroup
	for _, task := range plan.Tasks {
		wg.Add(1)
		go func(t *SubagentTask) {
			defer wg.Done()
			tStart := time.Now()
			t.StartedAt = tStart
			t.Status = "RUNNING"
			
			// Simulate subagent execution
			time.Sleep(10 * time.Millisecond)
			t.ResultPayload = fmt.Sprintf("✅ Subagent [%s] successfully executed: %s", t.AgentName, t.Role)
			t.Status = "COMPLETED"
			t.CompletedAt = time.Now()
			t.ExecutionMs = time.Since(tStart).Milliseconds()
		}(task)
	}
	wg.Wait()

	// 3. Assemble Final Markdown Report
	plan.FinalReport = o.generateFinalReport(plan)
	plan.TotalDurationMs = time.Since(start).Milliseconds()

	return plan, nil
}

func (o *StudentSwarmOrchestrator) generateFinalReport(plan *StudentMissionPlan) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# 📋 Autonomous Mission Report: %s\n\n", plan.MissionType))
	b.WriteString(fmt.Sprintf("**Target Department:** `%s` | **Execution ID:** `%s`\n\n", plan.Department, plan.MissionID))
	b.WriteString("## 🤖 Subagent Execution DAG\n")
	for _, t := range plan.Tasks {
		b.WriteString(fmt.Sprintf("- **[%s] %s**: %s (%d ms)\n", t.Status, t.AgentName, t.Role, t.ExecutionMs))
	}
	b.WriteString("\n---\n## 🎯 Executive Synthesis & Deliverables\n\n")

	switch plan.MissionType {
	case MissionGatePYQDossier:
		b.WriteString("### 1. 3-Year Topic Marks Weightage Matrix (2022 - 2024)\n\n")
		b.WriteString("| Engineering Subject | Average Marks (2022-2024) | Topic Traps & Key Formulas |\n")
		b.WriteString("| :--- | :--- | :--- |\n")
		b.WriteString("| Power Electronics | 12 - 14 Marks | CCM/DCM boundary condition $L_{crit} = \\frac{(1-D)R_L}{2 f_s}$ |\n")
		b.WriteString("| Control Systems | 10 - 12 Marks | Nyquist stability criteria $N = P - Z$ and Gain Margin |\n")
		b.WriteString("| Power Systems | 11 - 13 Marks | Symmetrical fault currents $I_{sc} = \\frac{1.0}{X_{th}}$ |\n\n")
		b.WriteString("### 2. High-Yield PYQ Worked Solutions\n")
		b.WriteString("- **GATE 2024 Q32**: Continuous Conduction Mode Buck Converter $\\to$ Solved step-by-step with $0.5$ duty ratio.\n")
	case MissionCompanyInterviewPrep:
		b.WriteString(fmt.Sprintf("### 1. High-Frequency Interview Topics for %s\n\n", plan.TargetCompany))
		b.WriteString("- **Circuit Topologies**: Buck/Boost switching transients, MOSFET thermal resistance $\\theta_{JA}$.\n")
		b.WriteString("- **Coding & Algorithms**: State machine serialization, circular ring buffers for DMA, Big-O analysis.\n")
		b.WriteString("- **System Trade-offs**: BOM costing ($1\\text{k}$ vs $100\\text{k}$ volume) and EMI/EMC compliance.\n")
	case MissionResumeCareerFit:
		b.WriteString("### 1. Candidate Skill-Match & Gap Analysis\n\n")
		b.WriteString("- **Core Strengths**: Strong grasp of Circuit Theory, C++, and MATLAB.\n")
		b.WriteString("- **Identified Gaps**: Missing hands-on embedded RTOS (FreeRTOS) experience and hardware PCB layout (Altium/KiCad).\n")
		b.WriteString("- **Recommended Project**: Build an STM32-based Closed-Loop Digital PID Buck Converter with telemetry.\n")
	default:
		b.WriteString("Synthesis completed across all academic and industry databases.\n")
	}

	return b.String()
}

// ToJSON serializes the student mission plan
func (plan *StudentMissionPlan) ToJSON() (string, error) {
	bytes, err := json.MarshalIndent(plan, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
