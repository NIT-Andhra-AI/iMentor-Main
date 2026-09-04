package course_agents

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// DistillationSample represents a verified high-quality training pair for SLM fine-tuning
type DistillationSample struct {
	SampleID           string    `json:"sample_id"`
	Topic              string    `json:"topic"`
	Discipline         string    `json:"discipline"` // "circuits", "control", "power_electronics", "math", "dsp"
	Prompt             string    `json:"prompt"`
	ChainOfThought     string    `json:"chain_of_thought"`
	ProcessRewardScore float64   `json:"process_reward_score"`
	VerifiedOutput     string    `json:"verified_output"`
	RecordedAt         time.Time `json:"recorded_at"`
}

// SLMDistillationPipeline harvests high-scoring System 2 proofs into training datasets
type SLMDistillationPipeline struct {
	datasetDir string
	samples    []DistillationSample
	mu         sync.Mutex
}

// NewSLMDistillationPipeline initializes the dataset pipeline
func NewSLMDistillationPipeline(datasetDir string) *SLMDistillationPipeline {
	if datasetDir == "" {
		datasetDir = ".agent_memory/distillation_datasets"
	}
	os.MkdirAll(datasetDir, 0755)
	p := &SLMDistillationPipeline{
		datasetDir: datasetDir,
		samples:    []DistillationSample{},
	}
	p.seedInitialDistillationData()
	return p
}

func (p *SLMDistillationPipeline) seedInitialDistillationData() {
	p.samples = append(p.samples, DistillationSample{
		SampleID:           "sample_buck_ccm_01",
		Topic:              "Buck Converter Critical Inductance",
		Discipline:         "power_electronics",
		Prompt:             "Calculate critical inductance for buck converter CCM with Vin=48V Vo=12V fs=50kHz R=10ohm",
		ChainOfThought:     "Step 1: Compute duty cycle D = Vo / Vin = 12 / 48 = 0.25.\nStep 2: Apply volt-second balance under CCM boundary (IL_min = 0, Delta_iL = 2*Io).\nStep 3: L_crit = (1 - D)*R / (2*fs) = (1 - 0.25)*10 / (2*50000) = 75 uH.",
		ProcessRewardScore: 0.98,
		VerifiedOutput:     "L_crit = 75 µH. The inductor must exceed 75 µH to guarantee Continuous Conduction Mode.",
		RecordedAt:         time.Now(),
	})
}

// HarvestTrajectory records a high-scoring System 2 trajectory if PRM score >= 0.90
func (p *SLMDistillationPipeline) HarvestTrajectory(topic, discipline, prompt, cot, output string, prmScore float64) bool {
	if prmScore < 0.90 {
		return false
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	sample := DistillationSample{
		SampleID:           fmt.Sprintf("sample_%d", time.Now().UnixNano()),
		Topic:              topic,
		Discipline:         discipline,
		Prompt:             prompt,
		ChainOfThought:     cot,
		ProcessRewardScore: prmScore,
		VerifiedOutput:     output,
		RecordedAt:         time.Now(),
	}

	p.samples = append(p.samples, sample)
	_ = p.exportToJSONL(sample)
	return true
}

func (p *SLMDistillationPipeline) exportToJSONL(sample DistillationSample) error {
	filePath := filepath.Join(p.datasetDir, "slm_fine_tune_pairs.jsonl")
	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := json.Marshal(sample)
	if err != nil {
		return err
	}

	_, err = f.WriteString(string(data) + "\n")
	return err
}

// GetDatasetStats returns current harvest counts
func (p *SLMDistillationPipeline) GetDatasetStats() map[string]interface{} {
	p.mu.Lock()
	defer p.mu.Unlock()

	byDiscipline := make(map[string]int)
	for _, s := range p.samples {
		byDiscipline[s.Discipline]++
	}

	return map[string]interface{}{
		"total_samples": len(p.samples),
		"by_discipline": byDiscipline,
		"dataset_path":  filepath.Join(p.datasetDir, "slm_fine_tune_pairs.jsonl"),
	}
}
