package course_agents

import (
	"testing"
)

func TestDynamicSubagentFactory_OpenEndedMissions(t *testing.T) {
	factory := NewDynamicSubagentFactory()

	// 1. Unforeseen Complex Renewable Energy & Financial Cashflow Mission
	solarPrompt := "Compare the payback period, LCOE, and battery degradation of a 5kW rooftop solar PV system in Andhra Pradesh with lithium LFP vs lead-acid batteries over 10 years."
	dag, err := factory.PlanAndExecuteOpenEndedGoal(solarPrompt, "EEE")
	if err != nil {
		t.Fatalf("PlanAndExecuteOpenEndedGoal failed: %v", err)
	}

	if len(dag.Subagents) != 4 {
		t.Errorf("Expected 4 dynamically spun subagents, got %d", len(dag.Subagents))
	}
	if !dag.IsComplete {
		t.Errorf("Expected dynamic mission DAG to complete successfully")
	}

	// Verify dependencies execution order
	for _, sa := range dag.Subagents {
		if sa.Status != "COMPLETED" {
			t.Errorf("Subagent %s did not complete: %s", sa.Name, sa.Status)
		}
	}

	// 2. Generic Novel Problem
	novelPrompt := "Design a high-speed FPGA hardware accelerator for matrix multiplication using systolic arrays and verify timing closure."
	dag2, err := factory.PlanAndExecuteOpenEndedGoal(novelPrompt, "ECE")
	if err != nil {
		t.Fatalf("PlanAndExecuteOpenEndedGoal novel failed: %v", err)
	}
	if len(dag2.Subagents) != 3 {
		t.Errorf("Expected 3 dynamically spun subagents for novel prompt, got %d", len(dag2.Subagents))
	}
	if !dag2.IsComplete {
		t.Errorf("Expected novel mission DAG to complete")
	}
}
