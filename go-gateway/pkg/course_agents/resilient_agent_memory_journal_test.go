package course_agents

import (
	"testing"
)

func TestResilientAgentMemoryJournal_LiveProgressAndAutoResume(t *testing.T) {
	journal := NewResilientAgentMemoryJournal()

	missionID := "mission_solar_microgrid_101"
	specs := []*EphemeralSubagentSpec{
		{ID: "sa_1_irradiance", Name: "solar_irradiance_data_engineer", Specialty: "Solar irradiance data"},
		{ID: "sa_2_battery", Name: "battery_chemistry_specialist", Specialty: "Battery degradation"},
		{ID: "sa_3_financial", Name: "cashflow_npv_financial_modeler", Specialty: "NPV and cashflows"},
	}

	// 1. Initialize Journal
	mission := journal.InitMissionJournal(missionID, "Evaluate 5kW solar PV system", "EEE", specs)
	if mission.TotalSubagents != 3 {
		t.Fatalf("Expected 3 subagents in journal, got %d", mission.TotalSubagents)
	}

	// 2. Subagent 1 makes progress and completes
	journal.RecordStepProgress(missionID, "sa_1_irradiance", StateRunning, 50, "Fetching NASA solar insolation", "Retrieved 5.2 peak sun hours", nil)
	journal.RecordStepProgress(missionID, "sa_1_irradiance", StateCompleted, 100, "Insolation calculation complete", "Annual yield = 7,500 kWh", map[string]interface{}{"yield_kwh": 7500})

	// 3. Subagent 2 reaches 60% and gets PAUSED due to computational bottleneck
	journal.RecordStepProgress(missionID, "sa_2_battery", StateRunning, 30, "Loading LFP cycle life curve", "Loaded 6,000 cycles at 80% DoD", nil)
	journal.RecordStepProgress(missionID, "sa_2_battery", StatePaused, 60, "Paused due to compute bottleneck", "Saved intermediate chemistry coefficients", map[string]interface{}{"dod_coeff": 0.82})

	// 4. Verify Live Events Stream
	events := journal.GetLiveEvents(missionID)
	if len(events) != 4 {
		t.Errorf("Expected 4 live progress events emitted to student UI, got %d", len(events))
	}

	// 5. Test Zero-Loss Auto-Resume (Without Student Intervention)
	resumedAgents, err := journal.SimulateBottleneckAndAutoResume(missionID)
	if err != nil {
		t.Fatalf("AutoResume failed: %v", err)
	}

	// Only Subagents 2 and 3 should resume (Subagent 1 already COMPLETED)
	if len(resumedAgents) != 2 {
		t.Errorf("Expected 2 uncompleted subagents resumed, got %d", len(resumedAgents))
	}

	// Subagent 2 should retain its intermediate data
	sa2Checkpoint := mission.SubagentStates["sa_2_battery"]
	if sa2Checkpoint.CurrentState != StateResuming {
		t.Errorf("Expected Subagent 2 state RESUMING, got %s", sa2Checkpoint.CurrentState)
	}
	if sa2Checkpoint.IntermediateData["dod_coeff"] != 0.82 {
		t.Errorf("Expected preserved dod_coeff 0.82 across resume, got %v", sa2Checkpoint.IntermediateData["dod_coeff"])
	}
}
