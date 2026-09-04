package course_agents

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// AgentExecutionState represents the lifecycle phase of an in-flight subagent
type AgentExecutionState string

const (
	StatePlanned      AgentExecutionState = "PLANNED"
	StateRunning      AgentExecutionState = "RUNNING"
	StateCheckpointed AgentExecutionState = "CHECKPOINTED"
	StatePaused       AgentExecutionState = "PAUSED_BOTTLENECK"
	StateResuming     AgentExecutionState = "RESUMING"
	StateCompleted    AgentExecutionState = "COMPLETED"
	StateFailed       AgentExecutionState = "FAILED"
)

// SubagentCheckpoint stores the persistent execution snapshot of a subagent
type SubagentCheckpoint struct {
	SubagentID       string              `json:"subagent_id"`
	AgentName        string              `json:"agent_name"`
	Role             string              `json:"role"`
	CurrentState     AgentExecutionState `json:"current_state"`
	ProgressPercent  int                 `json:"progress_percent"` // 0 - 100
	CurrentActivity  string              `json:"current_activity"` // e.g. "Executing Python circuit sandbox simulation"
	IntermediateData map[string]interface{} `json:"intermediate_data"`
	CompletedSteps   []string            `json:"completed_steps"`
	OutputPayload    string              `json:"output_payload,omitempty"`
	LastHeartbeat    time.Time           `json:"last_heartbeat"`
	RetryCount       int                 `json:"retry_count"`
}

// MissionStateJournal tracks the full mission checkpoint state for zero-loss auto-resume
type MissionStateJournal struct {
	MissionID        string                         `json:"mission_id"`
	OriginalGoal     string                         `json:"original_goal"`
	Department       string                         `json:"department"`
	TotalSubagents   int                            `json:"total_subagents"`
	CompletedCount   int                            `json:"completed_count"`
	IsBottlenecked   bool                           `json:"is_bottlenecked"`
	SubagentStates   map[string]*SubagentCheckpoint `json:"subagent_states"`
	FinalSynthesis   string                         `json:"final_synthesis,omitempty"`
	LastCheckpointAt time.Time                      `json:"last_checkpoint_at"`
}

// RealtimeAgentProgressEvent represents live progress emitted to the student UI
type RealtimeAgentProgressEvent struct {
	MissionID       string              `json:"mission_id"`
	SubagentID      string              `json:"subagent_id"`
	AgentName       string              `json:"agent_name"`
	State           AgentExecutionState `json:"state"`
	ProgressPercent int                 `json:"progress_percent"`
	ActiveAction    string              `json:"active_action"`
	Message         string              `json:"message"`
	Timestamp       time.Time           `json:"timestamp"`
}

// ResilientAgentMemoryJournal manages in-memory and persistent mission recovery
type ResilientAgentMemoryJournal struct {
	mu       sync.RWMutex
	missions map[string]*MissionStateJournal
	events   map[string][]*RealtimeAgentProgressEvent
}

// NewResilientAgentMemoryJournal initializes the resilient checkpoint memory engine
func NewResilientAgentMemoryJournal() *ResilientAgentMemoryJournal {
	return &ResilientAgentMemoryJournal{
		missions: make(map[string]*MissionStateJournal),
		events:   make(map[string][]*RealtimeAgentProgressEvent),
	}
}

// InitMissionJournal creates a persistent mission tracking journal
func (j *ResilientAgentMemoryJournal) InitMissionJournal(missionID, goal, dept string, subagentSpecs []*EphemeralSubagentSpec) *MissionStateJournal {
	j.mu.Lock()
	defer j.mu.Unlock()

	journal := &MissionStateJournal{
		MissionID:        missionID,
		OriginalGoal:     goal,
		Department:       dept,
		TotalSubagents:   len(subagentSpecs),
		CompletedCount:   0,
		IsBottlenecked:   false,
		SubagentStates:   make(map[string]*SubagentCheckpoint),
		LastCheckpointAt: time.Now(),
	}

	for _, s := range subagentSpecs {
		journal.SubagentStates[s.ID] = &SubagentCheckpoint{
			SubagentID:       s.ID,
			AgentName:        s.Name,
			Role:             s.Specialty,
			CurrentState:     StatePlanned,
			ProgressPercent:  0,
			CurrentActivity:  "Waiting in execution queue",
			IntermediateData: make(map[string]interface{}),
			CompletedSteps:   []string{},
			LastHeartbeat:    time.Now(),
		}
	}

	j.missions[missionID] = journal
	return journal
}

// RecordStepProgress updates the live state of a subagent and emits a student event
func (j *ResilientAgentMemoryJournal) RecordStepProgress(missionID, subagentID string, state AgentExecutionState, percent int, action, msg string, partialData map[string]interface{}) {
	j.mu.Lock()
	defer j.mu.Unlock()

	m, ok := j.missions[missionID]
	if !ok {
		return
	}

	sub, exists := m.SubagentStates[subagentID]
	if !exists {
		return
	}

	sub.CurrentState = state
	sub.ProgressPercent = percent
	sub.CurrentActivity = action
	sub.LastHeartbeat = time.Now()
	if msg != "" {
		sub.CompletedSteps = append(sub.CompletedSteps, msg)
	}
	if partialData != nil {
		for k, v := range partialData {
			sub.IntermediateData[k] = v
		}
	}

	if state == StateCompleted {
		m.CompletedCount++
	}
	m.LastCheckpointAt = time.Now()

	// Append to real-time event stream for student UI
	event := &RealtimeAgentProgressEvent{
		MissionID:       missionID,
		SubagentID:      subagentID,
		AgentName:       sub.AgentName,
		State:           state,
		ProgressPercent: percent,
		ActiveAction:    action,
		Message:         msg,
		Timestamp:       time.Now(),
	}
	j.events[missionID] = append(j.events[missionID], event)
}

// SimulateBottleneckAndAutoResume checks for stalled/interrupted subagents and resumes from checkpoint
func (j *ResilientAgentMemoryJournal) SimulateBottleneckAndAutoResume(missionID string) ([]*SubagentCheckpoint, error) {
	j.mu.Lock()
	defer j.mu.Unlock()

	m, ok := j.missions[missionID]
	if !ok {
		return nil, fmt.Errorf("mission %s not found in checkpoint memory", missionID)
	}

	var resumed []*SubagentCheckpoint
	for _, sub := range m.SubagentStates {
		if sub.CurrentState != StateCompleted {
			// Mark resuming from last completed step without student intervention
			sub.CurrentState = StateResuming
			sub.RetryCount++
			sub.CurrentActivity = fmt.Sprintf("Auto-resuming from step [%d]: %s", len(sub.CompletedSteps), sub.CurrentActivity)
			sub.LastHeartbeat = time.Now()
			resumed = append(resumed, sub)
		}
	}
	m.IsBottlenecked = false
	return resumed, nil
}

// GetLiveEvents retrieves all emitted progress events for a student session
func (j *ResilientAgentMemoryJournal) GetLiveEvents(missionID string) []*RealtimeAgentProgressEvent {
	j.mu.RLock()
	defer j.mu.RUnlock()

	return j.events[missionID]
}

// ToJSON serializes mission journal state
func (j *ResilientAgentMemoryJournal) ToJSON(missionID string) (string, error) {
	j.mu.RLock()
	defer j.mu.RUnlock()

	m, ok := j.missions[missionID]
	if !ok {
		return "", fmt.Errorf("mission not found")
	}

	bytes, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
