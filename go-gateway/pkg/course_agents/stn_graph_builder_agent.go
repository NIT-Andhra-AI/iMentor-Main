package course_agents

import (
	"fmt"
	"math"
	"strings"
)

// STNGraphBuilderAgent constructs the concept DAG and compute adjacency matrix
type STNGraphBuilderAgent struct{}

// NewSTNGraphBuilderAgent initializes the agent
func NewSTNGraphBuilderAgent() *STNGraphBuilderAgent {
	return &STNGraphBuilderAgent{}
}

// BuildSTN constructs the Semantic Topic Network
func (a *STNGraphBuilderAgent) BuildSTN(course CourseStructure) STNGraph {
	codeLower := strings.ToLower(strings.ReplaceAll(course.CourseCode, " ", "_"))
	nodes := make([]STNNode, 0, len(course.Lectures))
	edges := make([]STNEdge, 0, len(course.Lectures)*3)
	nodeIDMap := make(map[string]string)

	bloomWeights := map[string]float64{
		"L1_REMEMBER":   0.20,
		"L2_UNDERSTAND": 0.35,
		"L3_APPLY":      0.55,
		"L4_ANALYZE":    0.75,
		"L5_EVALUATE":   0.88,
		"L6_CREATE":     0.98,
	}

	// 1. Build Nodes
	for idx, lec := range course.Lectures {
		nodeID := fmt.Sprintf("node_%s_l%d", codeLower, lec.Num)
		nodeIDMap[fmt.Sprintf("%d", lec.Num)] = nodeID

		diff := bloomWeights[lec.Bloom]
		if diff == 0 {
			diff = 0.50
		}

		// Synthetic 16-dim normalized vector for similarity index
		embedding := make([]float64, 16)
		sumSq := 0.0
		for i := 0; i < 16; i++ {
			val := math.Sin(float64(idx+1) * float64(i+1) * 0.4)
			embedding[i] = val
			sumSq += val * val
		}
		norm := math.Sqrt(sumSq)
		if norm > 0 {
			for i := 0; i < 16; i++ {
				embedding[i] = math.Round((embedding[i]/norm)*10000) / 10000
			}
		}

		nodes = append(nodes, STNNode{
			ID:              nodeID,
			LectureNum:      lec.Num,
			Title:           lec.Title,
			Module:          lec.Module,
			Subtopics:       lec.Subtopics,
			BloomLevel:      lec.Bloom,
			Difficulty:      diff,
			Embedding:       embedding,
			RequiredMastery: 0.85,
		})
	}

	// 2. Build Edges
	for idx, lec := range course.Lectures {
		currID := nodeIDMap[fmt.Sprintf("%d", lec.Num)]

		// Hierarchy edge: PART_OF module
		moduleID := fmt.Sprintf("mod_%s_%s", codeLower, strings.ToLower(strings.ReplaceAll(lec.Module, " ", "_")))
		edges = append(edges, STNEdge{
			Source: currID,
			Target: moduleID,
			Type:   "PART_OF",
			Weight: 1.0,
		})

		// Sequential prerequisite dependency
		if lec.Prereq != "" && lec.Prereq != "None" {
			if prereqID, exists := nodeIDMap[lec.Prereq]; exists {
				edges = append(edges, STNEdge{
					Source: prereqID,
					Target: currID,
					Type:   "PREREQUISITE_OF",
					Weight: 0.95,
				})
			}
		}

		// Forward pedagogical flow: LEADS_TO
		if idx+1 < len(course.Lectures) {
			nextID := nodeIDMap[fmt.Sprintf("%d", course.Lectures[idx+1].Num)]
			edges = append(edges, STNEdge{
				Source: currID,
				Target: nextID,
				Type:   "LEADS_TO",
				Weight: 0.80,
			})
		}
	}

	// 3. Construct Adjacency Matrix
	n := len(nodes)
	adjMatrix := make([][]float64, n)
	nodeIdx := make(map[string]int)
	for i, node := range nodes {
		adjMatrix[i] = make([]float64, n)
		nodeIdx[node.ID] = i
	}

	for _, edge := range edges {
		if srcIdx, ok1 := nodeIdx[edge.Source]; ok1 {
			if tgtIdx, ok2 := nodeIdx[edge.Target]; ok2 {
				adjMatrix[srcIdx][tgtIdx] = edge.Weight
			}
		}
	}

	return STNGraph{
		CourseCode:      course.CourseCode,
		CourseName:      course.CourseName,
		TotalNodes:      len(nodes),
		TotalEdges:      len(edges),
		Nodes:           nodes,
		Edges:           edges,
		AdjacencyMatrix: adjMatrix,
	}
}
