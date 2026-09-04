package course_agents

import (
	"strings"
	"testing"
)

func TestStudentSwarmOrchestrator_AllMissions(t *testing.T) {
	orchestrator := NewStudentSwarmOrchestrator()

	// 1. Mission 1: GATE PYQ Dossier
	gatePlan, err := orchestrator.DecomposeAndExecuteMission("Fetch all last 3 year question papers for Electrical GATE and show weightage of each topic", "EEE")
	if err != nil {
		t.Fatalf("DecomposeAndExecuteMission GATE failed: %v", err)
	}
	if gatePlan.MissionType != MissionGatePYQDossier {
		t.Errorf("Expected MissionGatePYQDossier, got %s", gatePlan.MissionType)
	}
	if len(gatePlan.Tasks) != 4 {
		t.Errorf("Expected 4 subagent tasks for GATE dossier, got %d", len(gatePlan.Tasks))
	}
	if !strings.Contains(gatePlan.FinalReport, "Weightage Matrix") {
		t.Errorf("Final report missing weightage matrix")
	}

	// 2. Mission 2: Company Interview Prep
	companyPlan, err := orchestrator.DecomposeAndExecuteMission("What are common interview questions and coding questions asked by Texas Instruments?", "ECE")
	if err != nil {
		t.Fatalf("DecomposeAndExecuteMission Company failed: %v", err)
	}
	if companyPlan.MissionType != MissionCompanyInterviewPrep {
		t.Errorf("Expected MissionCompanyInterviewPrep, got %s", companyPlan.MissionType)
	}
	if companyPlan.TargetCompany != "Texas Instruments" {
		t.Errorf("Expected target company Texas Instruments, got %s", companyPlan.TargetCompany)
	}

	// 3. Mission 3: Resume Career Fit
	cvPlan, err := orchestrator.DecomposeAndExecuteMission("Here is my resume and CV: B.Tech student with C++ and circuit theory, where do I fit and how to improve my CV?", "EEE")
	if err != nil {
		t.Fatalf("DecomposeAndExecuteMission CV failed: %v", err)
	}
	if cvPlan.MissionType != MissionResumeCareerFit {
		t.Errorf("Expected MissionResumeCareerFit, got %s", cvPlan.MissionType)
	}
	if !strings.Contains(cvPlan.FinalReport, "Gap Analysis") {
		t.Errorf("Expected Gap Analysis in CV report")
	}
}
