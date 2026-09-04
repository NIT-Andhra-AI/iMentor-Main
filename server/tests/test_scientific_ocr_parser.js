const assert = require('assert');
const PDFParserService = require('../services/pdfParserService');

describe('Enterprise Scientific OCR & Document Parser Service', () => {
  const parser = new PDFParserService();

  const sampleScientificText = String.raw`# Module 1: DC-DC Power Conversion & State-Space Dynamics

## 1.1 Operating Principles & Governing Equations
A buck converter steps down DC voltage from $V_{in}$ to $V_o$ using a switching duty ratio $D$.
The governing steady-state volt-second balance yields:
$$ V_o = D \cdot V_{in} $$

The characteristic natural resonant frequency is:
$$ \omega_0 = \frac{1}{\sqrt{LC}} $$

Under continuous conduction mode (CCM), the state-space representation is:
$$
\frac{d\mathbf{x}}{dt} = \mathbf{A}\mathbf{x} + \mathbf{B}u
$$

where the state matrix is:
\begin{bmatrix}
0 & -\frac{1}{L} \\
\frac{1}{C} & -\frac{1}{RC}
\end{bmatrix}

and the input coupling vector is:
\begin{bmatrix}
\frac{D}{L} \\
0
\end{bmatrix}

The sub-interval inductor dynamics are expressed as:
\begin{cases}
L \frac{di_L}{dt} = V_{in} - V_o & \text{for } 0 < t \le D T_s \\
L \frac{di_L}{dt} = -V_o & \text{for } D T_s < t \le T_s
\end{cases}

## 1.2 Converter Component Specifications
Table 1: Synchronous Buck Converter Parameter Matrix
| Parameter | Symbol | Nominal Value | Unit |
|---|---|---|---|
| Input Voltage | V_in | 24 | V |
| Output Voltage | V_out | 5.0 | V |
| Switching Frequency | f_sw | 100000 | Hz |
| Inductor Ripple Ratio | r | 0.4 | |
| Efficiency | \eta | 95.2 | % |

The semiconductor ratings are summarized below:
\begin{tabular}{|l|c|r|}
\hline
Component & Voltage Rating & Current Rating \\
\hline
MOSFET Q1 & 40V & 25A \\
MOSFET Q2 & 40V & 35A \\
\hline
\end{tabular}

## 1.3 Multimodal Topologies and Waveforms
Figure 1: Synchronous Buck Converter Circuit Schematic with MOSFET Q1, MOSFET Q2, Filter Inductor L1 and Output Capacitor C1.
The gating signals provide complementary drive with 25ns dead-time.

Figure 2: Transient Inductor Current and Voltage Ripple Waveform Plot under Step Load.
The ripple magnitude remains bounded within 5% of nominal output.

Figure 3: Closed-Loop Digital PID Voltage Controller Block Diagram with Feedback Loop.
The digital loop samples output voltage and adjusts PWM duty ratio.
`;

  it('should parse multi-tier LaTeX equations (Display, Inline, Matrices, Differential Systems)', () => {
    const result = parser.parseScientificText(sampleScientificText, {
      docId: 'EE3011_Scientific',
      title: 'DC-DC Power Conversion',
    });

    assert.ok(result.structuredEquations.length >= 4, `Expected at least 4 structured equations, got ${result.structuredEquations.length}`);

    const matrixEqs = result.structuredEquations.filter(e => e.tier === 'MATRIX');
    assert.ok(matrixEqs.length >= 2, `Expected at least 2 matrix equations, got ${matrixEqs.length}`);
    assert.strictEqual(matrixEqs[0].matrixDim, '2x2', 'First matrix should have dimension 2x2');
    assert.strictEqual(matrixEqs[1].matrixDim, '2x1', 'Second matrix should have dimension 2x1');

    const diffSystemEqs = result.structuredEquations.filter(e => e.tier === 'DIFF_EQUATION_SYSTEM');
    assert.ok(diffSystemEqs.length >= 1, `Expected at least 1 differential equation system, got ${diffSystemEqs.length}`);
    assert.strictEqual(diffSystemEqs[0].isSystem, true, 'Differential system must have isSystem=true');

    const displayMathEqs = result.structuredEquations.filter(e => e.tier === 'DISPLAY_MATH');
    assert.ok(displayMathEqs.length >= 1, `Expected at least 1 display math equation, got ${displayMathEqs.length}`);

    const inlineMathEqs = result.structuredEquations.filter(e => e.tier === 'INLINE_MATH');
    assert.ok(inlineMathEqs.length >= 1, `Expected inline math formulas, got ${inlineMathEqs.length}`);

    // Check variable extraction
    const firstEq = result.structuredEquations[0];
    assert.ok(Array.isArray(firstEq.variables), 'Variables should be an array');
    assert.ok(Array.isArray(firstEq.operators), 'Operators should be an array');
  });

  it('should extract structured Markdown and LaTeX tables into JSON records with numerical statistics', () => {
    const result = parser.parseScientificText(sampleScientificText, {
      docId: 'EE3011_Scientific',
      title: 'DC-DC Power Conversion',
    });

    assert.ok(result.extractedTables.length >= 2, `Expected 2 extracted tables, got ${result.extractedTables.length}`);

    // Verify Markdown Table
    const mdTable = result.extractedTables[0];
    assert.strictEqual(mdTable.headers.length, 4, 'Markdown table should have 4 headers');
    assert.strictEqual(mdTable.rawRows.length, 5, 'Markdown table should have 5 data rows');
    assert.strictEqual(mdTable.recordsJSON.length, 5, 'Markdown table should have 5 JSON records');

    const firstRec = mdTable.recordsJSON[0];
    assert.strictEqual(firstRec['Nominal Value'], 24, 'Numerical entry should be parsed as number');
    assert.strictEqual(firstRec['Unit'], 'V', 'Unit should be V');

    // Verify column statistics
    const nominalCol = mdTable.columns.find(c => c.name === 'Nominal Value');
    assert.ok(nominalCol, 'Column "Nominal Value" should exist');
    assert.strictEqual(nominalCol.dataType, 'numeric', 'Data type should be numeric');
    assert.strictEqual(nominalCol.numericMin, 0.4, 'Min value should be 0.4');
    assert.strictEqual(nominalCol.numericMax, 100000, 'Max value should be 100000');

    // Verify LaTeX Table
    const latexTable = result.extractedTables[1];
    assert.strictEqual(latexTable.headers.length, 3, 'LaTeX table should have 3 headers');
    assert.strictEqual(latexTable.recordsJSON.length, 2, 'LaTeX table should have 2 records');
    assert.ok(latexTable.recordsJSON[0]['Component'].includes('MOSFET Q1'));
  });

  it('should identify circuit schematics, waveform plots, and block diagrams with bounding metadata', () => {
    const result = parser.parseScientificText(sampleScientificText, {
      docId: 'EE3011_Scientific',
      title: 'DC-DC Power Conversion',
    });

    assert.strictEqual(result.extractedFigures.length, 3, 'Expected 3 extracted figures');

    // Figure 1: Circuit Schematic
    const fig1 = result.extractedFigures[0];
    assert.strictEqual(fig1.figureType, 'CIRCUIT_SCHEMATIC', 'Fig 1 should be CIRCUIT_SCHEMATIC');
    assert.ok(fig1.extractedComponents.length >= 2, 'Fig 1 should have extracted components (MOSFET, Inductor, etc.)');
    assert.ok(fig1.boundingBox.width > 0 && fig1.boundingBox.height > 0, 'Bounding box dimensions should be valid');
    assert.ok(fig1.contextText.length > 0, 'Context text should be populated');

    // Figure 2: Waveform Plot
    const fig2 = result.extractedFigures[1];
    assert.strictEqual(fig2.figureType, 'WAVEFORM_PLOT', 'Fig 2 should be WAVEFORM_PLOT');

    // Figure 3: Block Diagram
    const fig3 = result.extractedFigures[2];
    assert.strictEqual(fig3.figureType, 'BLOCK_DIAGRAM', 'Fig 3 should be BLOCK_DIAGRAM');
  });

  it('should generate Qdrant vector points and STN concept graph', () => {
    const result = parser.parseScientificText(sampleScientificText, {
      docId: 'EE3011_Scientific',
      title: 'DC-DC Power Conversion',
    });

    // Vector Chunks
    assert.ok(result.vectorChunks.length >= 3, 'Expected at least 3 vector chunks');
    const firstChunk = result.vectorChunks[0];
    assert.ok(firstChunk.estimatedTokens > 0, 'Estimated tokens should be > 0');
    assert.strictEqual(firstChunk.docId, 'EE3011_Scientific');

    // Qdrant Points
    assert.ok(result.qdrantPoints.length >= 3, 'Expected Qdrant vector points');
    const firstPoint = result.qdrantPoints[0];
    assert.strictEqual(firstPoint.vector.length, 16, 'Qdrant vector should have 16 dimensions');
    assert.strictEqual(firstPoint.payload.doc_id, 'EE3011_Scientific');
    assert.ok(Array.isArray(firstPoint.payload.global_concepts), 'Global concepts should be in payload');

    // STN Graph
    assert.ok(result.stnGraph, 'STN Graph should be generated');
    assert.strictEqual(result.stnGraph.courseCode, 'EE3011_Scientific');
    assert.ok(result.stnGraph.nodes.length >= 3, 'STN Graph should have at least 3 nodes');
    assert.ok(result.stnGraph.edges.length >= 2, 'STN Graph should have dependency edges');
    assert.strictEqual(result.stnGraph.adjacencyMatrix.length, result.stnGraph.nodes.length, 'Adjacency matrix size should match node count');
  });

  it('should maintain backward compatibility for semester map and course extraction', () => {
    const syllabusSnippet = `
IV - Year I - Semester
01 EE4001 Power System Protection PCC 3-0-0 3 Credits
Prerequisites: Power Systems
Course Outcomes:
CO1 Analyze fault conditions
CO2 Design relay schemes
Syllabus:
Module 1: Symmetrical Faults
Module 2: Protection Relays
Text Books:
1. J. Lewis Blackburn, Protective Relaying.
Reference Books:
1. Badri Ram, Power System Protection.
`;

    const semMap = parser._extractSemesterMap(syllabusSnippet);
    assert.strictEqual(semMap['EE4001'], 'IV-I', 'Semester map should resolve IV-I for EE4001');

    const courses = parser._extractCourses(syllabusSnippet, semMap);
    assert.strictEqual(courses.length, 1, 'Should extract 1 course');
    assert.strictEqual(courses[0].courseCode, 'EE4001');
    assert.strictEqual(courses[0].courseName, 'Power System Protection');
    assert.strictEqual(courses[0].credits, '3');
    assert.strictEqual(courses[0].modules.length, 2);
  });
});
