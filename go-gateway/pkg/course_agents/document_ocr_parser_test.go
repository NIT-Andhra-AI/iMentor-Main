package course_agents

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestScientificDocParser(t *testing.T) {
	parser := NewScientificDocParser()

	sampleText := `# Module 1: DC-DC Power Conversion

## 1.1 Buck Converter Operation
A buck converter steps down DC voltage from $V_{in}$ to $V_o$.
The governing equation under volt-second balance is:
$$ (V_{in} - V_o) D T_s - V_o (1 - D) T_s = 0 $$
Solving yields:
$$ V_o = D \cdot V_{in} $$

Figure 1: Canonical Buck Converter Circuit Schematic with MOSFET Q1 and Diode D1.
The current through inductor $L$ increases linearly.

Figure 2: Inductor Current and Voltage Waveforms under Continuous Conduction Mode.
`

	doc := parser.ParseDocumentText("doc_test_01", "Buck Converter Engineering Notes", sampleText)

	if doc.Title != "Buck Converter Engineering Notes" {
		t.Errorf("Expected title 'Buck Converter Engineering Notes', got '%s'", doc.Title)
	}

	if len(doc.Sections) < 2 {
		t.Errorf("Expected at least 2 sections, got %d", len(doc.Sections))
	}

	if len(doc.ExtractedEquations) < 2 {
		t.Errorf("Expected at least 2 extracted equations, got %d", len(doc.ExtractedEquations))
	}

	if len(doc.ExtractedFigures) != 2 {
		t.Errorf("Expected exactly 2 extracted figures, got %d", len(doc.ExtractedFigures))
	}

	if doc.ExtractedFigures[0].FigureType != "CIRCUIT_SCHEMATIC" {
		t.Errorf("Expected Figure 1 to be CIRCUIT_SCHEMATIC, got %s", doc.ExtractedFigures[0].FigureType)
	}

	if doc.ExtractedFigures[1].FigureType != "WAVEFORM_PLOT" {
		t.Errorf("Expected Figure 2 to be WAVEFORM_PLOT, got %s", doc.ExtractedFigures[1].FigureType)
	}
}

func TestScientificDocParser_MultiTierEquationsAndMatrices(t *testing.T) {
	parser := NewScientificDocParser()

	advancedMathDoc := `# State-Space Modeling of Switching Converters

## State-Space Equations
The state vector is $\mathbf{x} = [i_L, v_C]^T$ and the input is $u = v_g$.
The state-space representation in Continuous Conduction Mode (CCM) is given by:

$$
\frac{d\mathbf{x}}{dt} = \mathbf{A}\mathbf{x} + \mathbf{B}u
$$

The characteristic undamped natural resonant frequency is:
$$
\omega_0 = \frac{1}{\sqrt{LC}}
$$

where the state matrix and input matrix are:

\begin{bmatrix}
0 & -\frac{1}{L} \\
\frac{1}{C} & -\frac{1}{RC}
\end{bmatrix}

and the input coupling vector is:

\begin{bmatrix}
\frac{D}{L} \\
0
\end{bmatrix}

The piecewise system dynamics can also be expressed as:
\begin{cases}
L \frac{di_L}{dt} = V_g - v_C & \text{for } 0 < t \le DT_s \\
L \frac{di_L}{dt} = -v_C & \text{for } DT_s < t \le T_s
\end{cases}
`

	doc := parser.ParseDocumentText("doc_state_space", "State Space Modeling", advancedMathDoc)

	// Verify multi-tier structured equations
	if len(doc.StructuredEquations) < 3 {
		t.Fatalf("Expected at least 3 structured equations, got %d", len(doc.StructuredEquations))
	}

	hasMatrix := false
	hasDiffSystem := false
	hasDisplayMath := false
	hasInlineMath := false

	for _, eq := range doc.StructuredEquations {
		if eq.Tier == TierMatrix {
			hasMatrix = true
			if eq.MatrixDim != "2x2" && eq.MatrixDim != "2x1" {
				t.Errorf("Expected matrix dimension 2x2 or 2x1, got '%s'", eq.MatrixDim)
			}
		}
		if eq.Tier == TierDiffEquation {
			hasDiffSystem = true
		}
		if eq.Tier == TierDisplayMath {
			hasDisplayMath = true
		}
		if eq.Tier == TierInlineMath {
			hasInlineMath = true
		}
	}

	if !hasMatrix {
		t.Errorf("Expected at least one TierMatrix equation")
	}
	if !hasDiffSystem {
		t.Errorf("Expected at least one TierDiffEquation system")
	}
	if !hasDisplayMath {
		t.Errorf("Expected at least one TierDisplayMath equation")
	}
	if !hasInlineMath {
		t.Errorf("Expected at least one TierInlineMath equation")
	}
}

func TestScientificDocParser_StructuredDataTables(t *testing.T) {
	parser := NewScientificDocParser()

	tableDoc := `# Module 2: Converter Design Specifications

## Design Specifications and Parameters
Table 1: Synchronous Buck Converter Parameter Matrix
| Parameter | Symbol | Nominal Value | Unit |
|---|---|---|---|
| Input Voltage | V_in | 24 | V |
| Output Voltage | V_out | 5.0 | V |
| Switching Frequency | f_sw | 100000 | Hz |
| Inductor Ripple Ratio | r | 0.4 | |
| Efficiency | \eta | 95.2 | % |

The following table summarizes semiconductor ratings:
\begin{tabular}{|l|c|r|}
\hline
Component & Voltage Rating & Current Rating \\
\hline
MOSFET Q1 & 40V & 25A \\
MOSFET Q2 & 40V & 35A \\
\hline
\end{tabular}
`

	doc := parser.ParseDocumentText("doc_tables", "Converter Design Specs", tableDoc)

	if len(doc.ExtractedTables) < 2 {
		t.Fatalf("Expected 2 extracted tables (1 Markdown, 1 LaTeX), got %d", len(doc.ExtractedTables))
	}

	// Verify Markdown Table
	mdTable := doc.ExtractedTables[0]
	if len(mdTable.Headers) != 4 {
		t.Errorf("Expected 4 column headers in markdown table, got %d", len(mdTable.Headers))
	}
	if len(mdTable.RawRows) != 5 {
		t.Errorf("Expected 5 rows in markdown table, got %d", len(mdTable.RawRows))
	}
	if len(mdTable.RecordsJSON) != 5 {
		t.Errorf("Expected 5 JSON records, got %d", len(mdTable.RecordsJSON))
	}

	// Verify numerical values parsed into JSON
	firstRec := mdTable.RecordsJSON[0]
	if val, ok := firstRec["Nominal Value"].(float64); !ok || val != 24.0 {
		t.Errorf("Expected first row Nominal Value to be float 24.0, got %v", firstRec["Nominal Value"])
	}

	// Verify numerical summary statistics
	numSummary := mdTable.NumericalSummary["Nominal Value"]
	if len(numSummary) != 5 {
		t.Errorf("Expected 5 numeric entries in 'Nominal Value', got %d", len(numSummary))
	}

	// Verify LaTeX Table
	latexTable := doc.ExtractedTables[1]
	if len(latexTable.Headers) != 3 {
		t.Errorf("Expected 3 headers in LaTeX table, got %d", len(latexTable.Headers))
	}
	if len(latexTable.RecordsJSON) != 2 {
		t.Errorf("Expected 2 records in LaTeX table, got %d", len(latexTable.RecordsJSON))
	}
}

func TestScientificDocParser_MultimodalFiguresAndSchematics(t *testing.T) {
	parser := NewScientificDocParser()

	multimodalDoc := `# Multi-Topology Power Stage

Figure 1: Full-Bridge Inverter Circuit Schematic with MOSFET Q1, MOSFET Q2, MOSFET Q3, MOSFET Q4 and Output Filter Inductor L1.
The gating signals are shifted by 180 degrees to produce an alternating output voltage.

Figure 2: Transient Step Response and Voltage Ripple Waveform Plot under Load Step.
The settling time is approximately 1.2ms with an overshoot of 4.5%.

Figure 3: Closed-Loop Digital PID Voltage Controller Block Diagram with Feedback Loop.
The digital compensator generates PWM duty ratio updates at 50kHz.
`

	doc := parser.ParseDocumentText("doc_multimodal", "Power Stage Architecture", multimodalDoc)

	if len(doc.ExtractedFigures) != 3 {
		t.Fatalf("Expected 3 extracted figures, got %d", len(doc.ExtractedFigures))
	}

	// Figure 1: Circuit Schematic
	fig1 := doc.ExtractedFigures[0]
	if fig1.FigureType != "CIRCUIT_SCHEMATIC" {
		t.Errorf("Expected Fig 1 to be CIRCUIT_SCHEMATIC, got %s", fig1.FigureType)
	}
	if fig1.BoundingBox.Width <= 0 || fig1.BoundingBox.Height <= 0 {
		t.Errorf("Expected non-zero bounding box dimensions, got width=%v, height=%v", fig1.BoundingBox.Width, fig1.BoundingBox.Height)
	}
	if len(fig1.ExtractedComponents) == 0 {
		t.Errorf("Expected extracted circuit components in Figure 1, got 0")
	}

	// Figure 2: Waveform Plot
	fig2 := doc.ExtractedFigures[1]
	if fig2.FigureType != "WAVEFORM_PLOT" {
		t.Errorf("Expected Fig 2 to be WAVEFORM_PLOT, got %s", fig2.FigureType)
	}

	// Figure 3: Block Diagram
	fig3 := doc.ExtractedFigures[2]
	if fig3.FigureType != "BLOCK_DIAGRAM" {
		t.Errorf("Expected Fig 3 to be BLOCK_DIAGRAM, got %s", fig3.FigureType)
	}
}

func TestScientificDocParser_QdrantAndSTNGraphOutput(t *testing.T) {
	parser := NewScientificDocParser()

	text := `# Unit I: DC-DC Buck Converters

## Operating Principles
The buck converter utilizes a semiconductor switch like MOSFET Q1 and inductor L to step down input voltage.
Under continuous conduction mode:
$$ V_o = D \cdot V_{in} $$

Figure 1: Buck Converter Circuit Schematic with MOSFET Q1 and Diode D1.

Table 1: Operating Specifications
| Spec | Value | Unit |
|---|---|---|
| Frequency | 100000 | Hz |
| Input | 12.0 | V |

## Small-Signal Modeling
The state-space averaged model yields the control-to-output transfer function $G_{vd}(s)$.
The closed-loop stability is verified using Bode plot phase margin analysis.
`

	doc := parser.ParseDocumentText("EE3011_Buck", "Power Electronics - Buck Converter", text)

	// Verify Vector Chunks
	if len(doc.VectorChunks) == 0 {
		t.Fatalf("Expected vector chunks to be generated, got 0")
	}

	// Verify Qdrant Points
	if len(doc.QdrantPoints) == 0 {
		t.Fatalf("Expected Qdrant vector points to be generated, got 0")
	}
	firstPoint := doc.QdrantPoints[0]
	if len(firstPoint.Vector) != 16 {
		t.Errorf("Expected 16-dim normalized vector, got %d", len(firstPoint.Vector))
	}
	if firstPoint.Payload["doc_id"] != "EE3011_Buck" {
		t.Errorf("Expected doc_id 'EE3011_Buck' in Qdrant payload, got '%v'", firstPoint.Payload["doc_id"])
	}

	// Verify STN Graph
	if doc.STNGraph == nil {
		t.Fatalf("Expected STN graph to be generated")
	}
	if len(doc.STNGraph.Nodes) < 2 {
		t.Errorf("Expected at least 2 STN graph nodes, got %d", len(doc.STNGraph.Nodes))
	}
	if len(doc.STNGraph.AdjacencyMatrix) != len(doc.STNGraph.Nodes) {
		t.Errorf("Expected adjacency matrix size to match node count (%d), got %d", len(doc.STNGraph.Nodes), len(doc.STNGraph.AdjacencyMatrix))
	}

	// Verify JSON Serialization
	jsonStr, err := doc.ToJSON()
	if err != nil {
		t.Fatalf("Failed to serialize ParsedDocument to JSON: %v", err)
	}
	if !strings.Contains(jsonStr, "EE3011_Buck") || !strings.Contains(jsonStr, "stn_graph") {
		t.Errorf("Serialized JSON missing expected fields: %s", jsonStr[:200])
	}

	var unmarshaled map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &unmarshaled); err != nil {
		t.Fatalf("Failed to unmarshal serialized JSON: %v", err)
	}
}
