package course_agents

import (
	"os"
	"testing"
)

func TestSLMDistillationPipeline(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "slm_distill_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	pipeline := NewSLMDistillationPipeline(tempDir)

	// Test 1: Reject low-scoring trajectory (PRM < 0.90)
	rejected := pipeline.HarvestTrajectory("KCL Test", "circuits", "Find I1", "Guessing I1 = 2A", "2A", 0.75)
	if rejected {
		t.Errorf("Expected low PRM score sample to be rejected from distillation dataset")
	}

	// Test 2: Accept high-scoring verified trajectory (PRM >= 0.90)
	accepted := pipeline.HarvestTrajectory("Thevenin Rth", "circuits", "Calculate Rth across terminals A-B", "Deactivate independent sources, sum series/parallel resistors", "Rth = 4 ohms", 0.96)
	if !accepted {
		t.Errorf("Expected high PRM score sample to be accepted into distillation dataset")
	}

	// Test 3: Stats check
	stats := pipeline.GetDatasetStats()
	if stats["total_samples"].(int) < 2 {
		t.Errorf("Expected at least 2 samples in dataset, got %d", stats["total_samples"].(int))
	}
}
