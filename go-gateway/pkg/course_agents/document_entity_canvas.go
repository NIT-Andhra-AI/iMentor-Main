package course_agents

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// DocumentEntityNode represents an extracted knowledge graph entity with grounded PDF coordinates
type DocumentEntityNode struct {
	EntityID     string   `json:"entity_id"`
	Name         string   `json:"name"`
	EntityType   string   `json:"entity_type"` // "CIRCUIT_TOPOLOGY", "SEMICONDUCTOR", "GOVERNING_LAW", "EQUATION", "NUMERICAL_CONSTANT"
	Definition   string   `json:"definition"`
	PageNumber   int      `json:"page_number"`
	BoundingBox  []float64 `json:"bounding_box"` // [x_min, y_min, x_max, y_max] normalized 0..1
	RelatedNodes []string `json:"related_nodes"`
	BloomTier    string   `json:"bloom_tier"`
	LaTeXFormula string   `json:"latex_formula,omitempty"`
}

// DocumentEntityCanvas manages split-screen document canvas state and GraphRAG highlights
type DocumentEntityCanvas struct {
	mu          sync.RWMutex
	documentID  string
	title       string
	totalPages  int
	entityNodes map[string]*DocumentEntityNode
}

// NewDocumentEntityCanvas creates a new interactive document entity canvas
func NewDocumentEntityCanvas(docID, title string, pages int) *DocumentEntityCanvas {
	canvas := &DocumentEntityCanvas{
		documentID:  docID,
		title:       title,
		totalPages:  pages,
		entityNodes: make(map[string]*DocumentEntityNode),
	}
	canvas.seedEngineeringEntities()
	return canvas
}

// GetEntitiesForPage retrieves all grounded entity bounding boxes for a specific document page
func (c *DocumentEntityCanvas) GetEntitiesForPage(pageNumber int) []*DocumentEntityNode {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var nodes []*DocumentEntityNode
	for _, n := range c.entityNodes {
		if n.PageNumber == pageNumber {
			nodes = append(nodes, n)
		}
	}
	return nodes
}

// GetEntityGraphNeighborhood retrieves the 1-hop and 2-hop connected graph neighborhood for an entity
func (c *DocumentEntityCanvas) GetEntityGraphNeighborhood(entityID string) ([]*DocumentEntityNode, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	target, exists := c.entityNodes[entityID]
	if !exists {
		return nil, fmt.Errorf("entity %s not found in canvas graph", entityID)
	}

	resultMap := make(map[string]*DocumentEntityNode)
	resultMap[target.EntityID] = target

	// 1-hop neighbors
	for _, relID := range target.RelatedNodes {
		if neighbor, ok := c.entityNodes[relID]; ok {
			resultMap[neighbor.EntityID] = neighbor
		}
	}

	var results []*DocumentEntityNode
	for _, node := range resultMap {
		results = append(results, node)
	}
	return results, nil
}

// RegisterEntity registers a new grounded entity on the canvas
func (c *DocumentEntityCanvas) RegisterEntity(node *DocumentEntityNode) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entityNodes[node.EntityID] = node
}

func (c *DocumentEntityCanvas) seedEngineeringEntities() {
	defaultEntities := []*DocumentEntityNode{
		{
			EntityID:     "ent_buck_inductor",
			Name:         "Filter Inductor L",
			EntityType:   "SEMICONDUCTOR",
			Definition:   "Stores magnetic energy during switch ON period and discharges into load during freewheeling OFF period.",
			PageNumber:   1,
			BoundingBox:  []float64{0.32, 0.25, 0.58, 0.42},
			RelatedNodes: []string{"ent_buck_ccm_law", "ent_volt_second_balance"},
			BloomTier:    "L2_UNDERSTAND",
			LaTeXFormula: "v_L = L \\frac{di_L}{dt}",
		},
		{
			EntityID:     "ent_buck_ccm_law",
			Name:         "Critical Inductance Bound",
			EntityType:   "GOVERNING_LAW",
			Definition:   "Minimum inductance required to maintain non-zero inductor valley current throughout the full cycle.",
			PageNumber:   2,
			BoundingBox:  []float64{0.15, 0.60, 0.85, 0.78},
			RelatedNodes: []string{"ent_buck_inductor", "ent_duty_ratio"},
			BloomTier:    "L3_APPLY",
			LaTeXFormula: "L_{crit} = \\frac{(1-D)R_L}{2 f_s}",
		},
		{
			EntityID:     "ent_volt_second_balance",
			Name:         "Volt-Second Balance Principle",
			EntityType:   "GOVERNING_LAW",
			Definition:   "The net integral of inductor voltage over one periodic steady-state switching cycle must equal exactly zero.",
			PageNumber:   2,
			BoundingBox:  []float64{0.10, 0.12, 0.90, 0.35},
			RelatedNodes: []string{"ent_buck_inductor"},
			BloomTier:    "L4_ANALYZE",
			LaTeXFormula: "\\int_0^{T_s} v_L(t)\\,dt = 0",
		},
		{
			EntityID:     "ent_duty_ratio",
			Name:         "Duty Cycle Ratio D",
			EntityType:   "NUMERICAL_CONSTANT",
			Definition:   "The fraction of one switching period during which the high-side power MOSFET switch remains turned ON.",
			PageNumber:   1,
			BoundingBox:  []float64{0.05, 0.80, 0.45, 0.92},
			RelatedNodes: []string{"ent_buck_ccm_law"},
			BloomTier:    "L1_REMEMBER",
			LaTeXFormula: "D = \\frac{t_{on}}{T_s} = \\frac{V_o}{V_{in}}",
		},
	}

	for _, e := range defaultEntities {
		c.entityNodes[e.EntityID] = e
	}
}

// ToJSON serializes canvas state
func (c *DocumentEntityCanvas) ToJSON() (string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	payload := map[string]interface{}{
		"document_id":  c.documentID,
		"title":        c.title,
		"total_pages":  c.totalPages,
		"entities":     c.entityNodes,
		"generated_at": time.Now(),
	}
	bytes, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
