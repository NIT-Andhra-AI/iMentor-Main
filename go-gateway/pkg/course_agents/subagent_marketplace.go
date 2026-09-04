package course_agents

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// MarketplaceAgentCard represents a published community subagent in the marketplace
type MarketplaceAgentCard struct {
	AgentID          string            `json:"agent_id"`
	Name             string            `json:"name"`
	Title            string            `json:"title"`
	Department       string            `json:"department"` // "EEE", "CSE", "ECE", "MECH", "CIVIL", "CORE"
	CourseCode       string            `json:"course_code,omitempty"`
	Specialty        string            `json:"specialty"`
	SystemPrompt     string            `json:"system_prompt"`
	ToolsRequired    []DynamicToolType `json:"tools_required"`
	SamplePrompt     string            `json:"sample_prompt"`
	AuthorName       string            `json:"author_name"` // e.g. "AutoSwarm", "Sri (NIT-Andhra)", "Prof. Sharma"
	Upvotes          int               `json:"upvotes"`
	StarCount        int               `json:"star_count"`
	StarredBy        []string          `json:"starred_by"` // Student User IDs who starred this agent
	UsageCount       int               `json:"usage_count"`
	IsVerified       bool              `json:"is_verified"`
	CategoryTags     []string          `json:"category_tags"`
	PublishedAt      time.Time         `json:"published_at"`
}

// SubagentMarketplaceEngine manages the in-app Agent Store & Community Registry
type SubagentMarketplaceEngine struct {
	mu     sync.RWMutex
	agents map[string]*MarketplaceAgentCard
}

// NewSubagentMarketplaceEngine initializes the subagent marketplace
func NewSubagentMarketplaceEngine() *SubagentMarketplaceEngine {
	engine := &SubagentMarketplaceEngine{
		agents: make(map[string]*MarketplaceAgentCard),
	}
	engine.seedDefaultMarketplaceAgents()
	return engine
}

// PublishAgent publishes a newly synthesized or custom student subagent to the marketplace
func (m *SubagentMarketplaceEngine) PublishAgent(card *MarketplaceAgentCard) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if card.AgentID == "" {
		card.AgentID = fmt.Sprintf("agent_%d", time.Now().UnixNano())
	}
	if card.PublishedAt.IsZero() {
		card.PublishedAt = time.Now()
	}
	if card.StarredBy == nil {
		card.StarredBy = []string{}
	}
	m.agents[card.AgentID] = card
	return nil
}

// SearchMarketplace queries agents by department, keyword, and course code, sorted by star count
func (m *SubagentMarketplaceEngine) SearchMarketplace(department, keyword string) []*MarketplaceAgentCard {
	m.mu.RLock()
	defer m.mu.RUnlock()

	deptUpper := strings.ToUpper(strings.TrimSpace(department))
	kwLower := strings.ToLower(strings.TrimSpace(keyword))

	var results []*MarketplaceAgentCard
	for _, a := range m.agents {
		if deptUpper != "" && deptUpper != "ALL" && a.Department != deptUpper && a.Department != "CORE" {
			continue
		}
		if kwLower != "" {
			nameMatch := strings.Contains(strings.ToLower(a.Name), kwLower)
			titleMatch := strings.Contains(strings.ToLower(a.Title), kwLower)
			specMatch := strings.Contains(strings.ToLower(a.Specialty), kwLower)
			courseMatch := strings.Contains(strings.ToLower(a.CourseCode), kwLower)
			if !nameMatch && !titleMatch && !specMatch && !courseMatch {
				continue
			}
		}
		results = append(results, a)
	}

	// Sort by StarCount descending
	sort.Slice(results, func(i, j int) bool {
		return results[i].StarCount > results[j].StarCount
	})

	return results
}

// ToggleStarAgent allows students to star/unstar an agent and updates total star count
func (m *SubagentMarketplaceEngine) ToggleStarAgent(agentID, studentID string) (bool, int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	card, ok := m.agents[agentID]
	if !ok {
		return false, 0, fmt.Errorf("agent %s not found in marketplace", agentID)
	}

	// Check if already starred
	isStarred := false
	var updatedStars []string
	for _, id := range card.StarredBy {
		if id == studentID {
			isStarred = true
		} else {
			updatedStars = append(updatedStars, id)
		}
	}

	if isStarred {
		// Unstar
		card.StarredBy = updatedStars
		if card.StarCount > 0 {
			card.StarCount--
		}
		return false, card.StarCount, nil
	}

	// Star
	card.StarredBy = append(card.StarredBy, studentID)
	card.StarCount++
	return true, card.StarCount, nil
}

// GetStarredAgents returns all agents starred by a specific student
func (m *SubagentMarketplaceEngine) GetStarredAgents(studentID string) []*MarketplaceAgentCard {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var starred []*MarketplaceAgentCard
	for _, a := range m.agents {
		for _, id := range a.StarredBy {
			if id == studentID {
				starred = append(starred, a)
				break
			}
		}
	}
	return starred
}

// UpvoteAgent increments the community upvote score of a marketplace agent
func (m *SubagentMarketplaceEngine) UpvoteAgent(agentID string) (int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	card, ok := m.agents[agentID]
	if !ok {
		return 0, fmt.Errorf("agent %s not found in marketplace", agentID)
	}
	card.Upvotes++
	return card.Upvotes, nil
}

// ForkAndExecute increments usage count and returns the execution blueprint
func (m *SubagentMarketplaceEngine) ForkAndExecute(agentID string) (*MarketplaceAgentCard, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	card, ok := m.agents[agentID]
	if !ok {
		return nil, fmt.Errorf("agent %s not found in marketplace", agentID)
	}
	card.UsageCount++
	return card, nil
}

// seedDefaultMarketplaceAgents populates initial verified high-yield community agents
func (m *SubagentMarketplaceEngine) seedDefaultMarketplaceAgents() {
	defaultCards := []*MarketplaceAgentCard{
		{
			AgentID:       "market_solar_pv_npv",
			Name:          "SolarPV_Cashflow_Optimizer",
			Title:         "☀️ 10-Year Rooftop Solar PV & Battery NPV Modeler",
			Department:    "EEE",
			CourseCode:    "EE2611",
			Specialty:     "Calculates solar insolation, LFP battery degradation, LCOE, and 10-year discounted cashflows",
			SystemPrompt:  "You are a Techno-Economic Solar Modeler. Synthesize insolation, battery lifecycle, and cashflows.",
			ToolsRequired: []DynamicToolType{ToolWebSearch, ToolCodeSandbox, ToolMathSolver, ToolLaTeXRender},
			SamplePrompt:  "Evaluate a 5kW rooftop solar PV system in Andhra Pradesh with lithium batteries over 10 years.",
			AuthorName:    "AutoSwarm Verified",
			Upvotes:       142,
			StarCount:     88,
			StarredBy:     []string{"student_1", "student_2"},
			UsageCount:    860,
			IsVerified:    true,
			CategoryTags:  []string{"Renewable", "Solar", "Economics", "Energy"},
		},
		{
			AgentID:       "market_fpga_systolic",
			Name:          "SystolicArray_FPGA_Architect",
			Title:         "💻 FPGA Systolic Array & Timing Closure Synthesizer",
			Department:    "ECE",
			CourseCode:    "EC3021",
			Specialty:     "Designs matrix multiplication systolic arrays, models Elmore delays, and verifies timing closure",
			SystemPrompt:  "You are an Advanced VLSI & FPGA Architect. Generate Verilog/VHDL models and timing analysis.",
			ToolsRequired: []DynamicToolType{ToolAcademicFetch, ToolCodeSandbox, ToolMathSolver},
			SamplePrompt:  "Design a 4x4 matrix multiplication systolic array on Xilinx Artix-7 and optimize DSP slices.",
			AuthorName:    "Prof. VLSI Group",
			Upvotes:       98,
			StarCount:     64,
			StarredBy:     []string{"student_3"},
			UsageCount:    520,
			IsVerified:    true,
			CategoryTags:  []string{"VLSI", "FPGA", "Hardware", "Systolic"},
		},
		{
			AgentID:       "market_gate_nat_trap_solver",
			Name:          "GATE_NAT_Trap_Auditor",
			Title:         "🎯 GATE 2-Mark NAT Trap & Shortcut Auditor",
			Department:    "EEE",
			CourseCode:    "EE3011",
			Specialty:     "Audits boundary conditions, DCM vs CCM traps, and derives exact 2-mark numerical shortcuts",
			SystemPrompt:  "You are a Senior GATE Faculty Auditor. Solve numericals with boundary condition alerts.",
			ToolsRequired: []DynamicToolType{ToolGraphRagQuery, ToolMathSolver, ToolLaTeXRender},
			SamplePrompt:  "Solve 2024 GATE Power Electronics Buck converter critical inductance problem step-by-step.",
			AuthorName:    "GATE Toppers Community",
			Upvotes:       215,
			StarCount:     175,
			StarredBy:     []string{"student_1", "student_4", "student_5"},
			UsageCount:    1420,
			IsVerified:    true,
			CategoryTags:  []string{"GATE", "Numericals", "Shortcuts", "Traps"},
		},
		{
			AgentID:       "market_ats_cv_rewriter",
			Name:          "ATS_Engineering_CV_Optimizer",
			Title:         "📄 Tier-1 Core Engineering ATS Resume Optimizer",
			Department:    "CORE",
			CourseCode:    "ALL",
			Specialty:     "Benchmarks student CV against Qualcomm/Tesla/Google job specs and rewrites bullets with action verbs",
			SystemPrompt:  "You are a Technical Talent Recruiter. Transform project descriptions into quantified impact bullets.",
			ToolsRequired: []DynamicToolType{ToolWebSearch, ToolLaTeXRender},
			SamplePrompt:  "Optimize my electrical engineering CV for a Texas Instruments Hardware Application Engineer role.",
			AuthorName:    "Placement Cell AI",
			Upvotes:       340,
			StarCount:     290,
			StarredBy:     []string{"student_1", "student_2", "student_3"},
			UsageCount:    2890,
			IsVerified:    true,
			CategoryTags:  []string{"Placement", "Resume", "ATS", "Career"},
		},
	}

	for _, c := range defaultCards {
		m.agents[c.AgentID] = c
	}
}
