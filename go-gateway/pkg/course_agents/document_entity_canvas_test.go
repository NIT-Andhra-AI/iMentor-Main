package course_agents

import (
	"testing"
)

func TestDocumentEntityCanvas_Queries(t *testing.T) {
	canvas := NewDocumentEntityCanvas("doc_buck_design", "Buck Converter Engineering Manual", 5)

	// 1. Query entities on Page 1
	page1Nodes := canvas.GetEntitiesForPage(1)
	if len(page1Nodes) != 2 {
		t.Fatalf("Expected 2 entities on Page 1, got %d", len(page1Nodes))
	}

	// 2. Query entities on Page 2
	page2Nodes := canvas.GetEntitiesForPage(2)
	if len(page2Nodes) != 2 {
		t.Fatalf("Expected 2 entities on Page 2, got %d", len(page2Nodes))
	}

	// 3. Query Graph Neighborhood for Filter Inductor L
	neighborhood, err := canvas.GetEntityGraphNeighborhood("ent_buck_inductor")
	if err != nil {
		t.Fatalf("GetEntityGraphNeighborhood failed: %v", err)
	}

	// Target + 2 related nodes = 3 nodes
	if len(neighborhood) != 3 {
		t.Errorf("Expected 3 nodes in inductor neighborhood, got %d", len(neighborhood))
	}

	// 4. Test non-existent entity error handling
	_, err = canvas.GetEntityGraphNeighborhood("non_existent_id")
	if err == nil {
		t.Errorf("Expected error for non-existent entity query")
	}
}
