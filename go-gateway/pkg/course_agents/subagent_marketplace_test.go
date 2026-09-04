package course_agents

import (
	"testing"
)

func TestSubagentMarketplace_OperationsAndStarring(t *testing.T) {
	market := NewSubagentMarketplaceEngine()

	// 1. Search by department
	eeeAgents := market.SearchMarketplace("EEE", "")
	if len(eeeAgents) < 2 {
		t.Errorf("Expected at least 2 EEE agents in marketplace, got %d", len(eeeAgents))
	}

	// 2. Test Starring & Unstarring
	targetAgent := "market_solar_pv_npv"
	initialStars := market.agents[targetAgent].StarCount

	// Student "sri_nit" stars the agent
	starred, newCount, err := market.ToggleStarAgent(targetAgent, "sri_nit")
	if err != nil {
		t.Fatalf("ToggleStarAgent failed: %v", err)
	}
	if !starred || newCount != initialStars+1 {
		t.Errorf("Expected starred=true with count %d, got starred=%v count %d", initialStars+1, starred, newCount)
	}

	// Check GetStarredAgents
	myStarred := market.GetStarredAgents("sri_nit")
	if len(myStarred) != 1 || myStarred[0].AgentID != targetAgent {
		t.Errorf("Expected 1 starred agent for sri_nit, got %d", len(myStarred))
	}

	// Unstar
	starredAgain, unstarCount, err := market.ToggleStarAgent(targetAgent, "sri_nit")
	if err != nil {
		t.Fatalf("ToggleStarAgent unstar failed: %v", err)
	}
	if starredAgain || unstarCount != initialStars {
		t.Errorf("Expected starred=false with count %d, got starred=%v count %d", initialStars, starredAgain, unstarCount)
	}

	// 3. Upvote Agent
	solarAgents := market.SearchMarketplace("ALL", "solar")
	initialUpvotes := solarAgents[0].Upvotes
	newUpvotes, err := market.UpvoteAgent(solarAgents[0].AgentID)
	if err != nil {
		t.Fatalf("UpvoteAgent failed: %v", err)
	}
	if newUpvotes != initialUpvotes+1 {
		t.Errorf("Expected upvotes %d, got %d", initialUpvotes+1, newUpvotes)
	}

	// 4. Fork and Execute
	initialUsage := solarAgents[0].UsageCount
	card, err := market.ForkAndExecute(solarAgents[0].AgentID)
	if err != nil {
		t.Fatalf("ForkAndExecute failed: %v", err)
	}
	if card.UsageCount != initialUsage+1 {
		t.Errorf("Expected usage count %d, got %d", initialUsage+1, card.UsageCount)
	}
}
