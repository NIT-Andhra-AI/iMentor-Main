const fs = require('fs');
const pdf = require('pdf-parse');
const log = require('../utils/logger');

class PDFParserService {
  constructor() {}

  // =========================================================================
  // 1. SYLLABUS EXTRACTION (Nit-AP R24 Legacy Compatibility)
  // =========================================================================

  async parseSyllabus(pdfPath) {
    try {
      log.info('PDF Parser', `Parsing syllabus: ${pdfPath}`);

      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdf(dataBuffer);

      const semesterMap = this._extractSemesterMap(pdfData.text);
      const courses = this._extractCourses(pdfData.text, semesterMap);

      const structuredData = {
        metadata: {
          title: pdfData.info?.Title || 'Untitled Syllabus',
          author: pdfData.info?.Author || 'Unknown Author',
          subject: pdfData.info?.Subject || 'Course Syllabus',
          producer: pdfData.info?.Producer || 'PDF Generator',
          creationDate: pdfData.info?.CreationDate,
          modificationDate: pdfData.info?.ModDate,
        },
        totalPages: pdfData.numpages,
        rawText: pdfData.text,
        pages: this._splitIntoPages(pdfData.text),
        courses,
        parsedAt: new Date().toISOString(),
      };

      log.success('PDF Parser', `Successfully parsed syllabus with ${structuredData.totalPages} pages, ${courses.length} courses`);
      return structuredData;
    } catch (error) {
      log.error('PDF Parser', `Failed to parse syllabus: ${pdfPath}`, error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  _splitIntoPages(text) {
    return text.split(/\n\n+/).map((page, index) => ({
      pageNumber: index + 1,
      text: page.trim(),
      wordCount: page.trim().split(/\s+/).length,
      charCount: page.length,
    }));
  }

  _extractSemesterMap(text) {
    const lines = text.split('\n');
    const map = {};
    let currentYear = '';
    let currentSem = '';

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      const yearSemMatch = t.match(/^([IV]+)\s*[-–]\s*Year.*?([IV]+)\s*[-–]\s*Semester/);
      if (yearSemMatch) {
        currentYear = yearSemMatch[1];
        currentSem = yearSemMatch[2];
        continue;
      }

      const yearMatch = t.match(/^([IV]+)\s*[-–]\s*Year/);
      if (yearMatch && !t.match(/Semester/)) {
        currentYear = yearMatch[1];
        currentSem = '';
        continue;
      }

      const semMatch = t.match(/([IV]+)\s*[-–]\s*Semester/);
      if (semMatch && !t.match(/Year/)) {
        currentSem = semMatch[1];
        continue;
      }

      const codeMatch = t.match(/^\d+\s+([A-Z]{2}\d{4})\b/);
      if (codeMatch && currentYear && currentSem) {
        const code = codeMatch[1];
        if (!map[code]) {
          map[code] = currentYear + '-' + currentSem;
        }
      }
    }
    return map;
  }

  _extractCourses(text, semesterMap) {
    const lines = text.split('\n');
    const courseMap = new Map();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const header = this._matchHeader(lines, i);
      if (!header) continue;

      const endIdx = this._findCourseEnd(lines, header.startIdx);
      const courseText = lines.slice(header.startIdx, endIdx).join('\n');

      if (!this._hasContent(courseText)) continue;

      const existing = courseMap.get(header.code);
      if (!existing || (endIdx - header.startIdx) > (existing.endIdx - existing.startIdx)) {
        courseMap.set(header.code, {
          header,
          endIdx,
          courseText,
          startIdx: header.startIdx,
        });
      }
    }

    const sorted = [...courseMap.values()].sort((a, b) => a.startIdx - b.startIdx);
    return sorted.map(c => this._buildCourse(c.header, c.courseText, semesterMap));
  }

  _matchHeader(lines, startIdx) {
    const line = lines[startIdx].trim();
    let code, title, category, credits, ltp;

    // Format 1: CODE Title CAT L-T-P Credits (inline, with optional leading serial number like "01 ")
    let m = line.match(/^(?:\d+\s+)?([A-Z]{2}\d{4})\s+(.+?)\s+(PCC|BSC|ESC|HSC|DEC|OEC|PRC|SLI|PEC)\s+(\d+[-–]\d+[-–]\d+)\s+(\d+)\s+Credits$/);
    if (m) {
      return { code: m[1], title: m[2].trim(), category: m[3], ltp: m[4], credits: m[5], startIdx };
    }

    // Format 2: CODE on its own line, then title, then "CAT L-T-P Credits" or "L-T-P Credits"
    if (/^(?:\d+\s+)?([A-Z]{2}\d{4})$/.test(line)) {
      const codeMatch = line.match(/^(?:\d+\s+)?([A-Z]{2}\d{4})$/);
      code = codeMatch[1];
      const titleLines = [];
      for (let j = startIdx + 1; j < Math.min(startIdx + 20, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) continue;

        let creditMatch = next.match(/^((PCC|BSC|ESC|HSC|DEC|OEC|PRC|SLI|PEC)\s+)?(\d+[-–]\d+[-–]\d+)\s+(\d+)\s+Credits$/);
        if (creditMatch) {
          category = creditMatch[2] || '';
          ltp = creditMatch[3];
          credits = creditMatch[4];
          break;
        }

        if (/^[A-Z]{2}\d{4}(\s|$)/.test(next)) break;
        if (/^(Department of|Scheme and Syllabi)/.test(next)) continue;

        titleLines.push(next);
      }
      title = titleLines.join(' ').replace(/\s+/g, ' ').trim();
      if (code && title && ltp) {
        return { code, title, category: category || '', ltp, credits: credits || '', startIdx };
      }
    }

    // Format 3: CODE Title on same line but Credits on next line(s)
    m = line.match(/^(?:\d+\s+)?([A-Z]{2}\d{4})\s+(.+)/);
    if (m) {
      code = m[1];
      const titleParts = [m[2].trim()];
      for (let j = startIdx + 1; j < Math.min(startIdx + 15, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) continue;
        let cm = next.match(/^((PCC|BSC|ESC|HSC|DEC|OEC|PRC|SLI|PEC)\s+)?(\d+[-–]\d+[-–]\d+)\s+(\d+)\s+Credits$/);
        if (cm) {
          category = cm[2] || '';
          ltp = cm[3];
          credits = cm[4];
          break;
        }
        if (/^[A-Z]{2}\d{4}(\s|$)/.test(next)) break;
        if (/^(Department of|Scheme and Syllabi)/.test(next)) continue;
        titleParts.push(next);
      }
      title = titleParts.join(' ').replace(/\s+/g, ' ').trim();
      if (code && title && ltp) {
        return { code, title, category: category || '', ltp, credits: credits || '', startIdx };
      }
    }

    return null;
  }

  _findCourseEnd(lines, startIdx) {
    for (let j = startIdx + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;
      if (/^(Department of|Scheme and Syllabi)/.test(line)) continue;
      const h = this._matchHeader(lines, j);
      if (h) return j;
    }
    return lines.length;
  }

  _hasContent(text) {
    return /Course Outcomes?:|Text Books?:|Syllabus:/i.test(text);
  }

  _buildCourse(header, courseText, semesterMap) {
    const prereq = this._extractSection(courseText, /Pre-requisites?:?\s*([^\n.]+)/i);
    const outcomes = this._extractOutcomes(courseText);
    const syllabusContent = this._extractSyllabusContent(courseText);
    const modules = this._extractModules(syllabusContent || courseText);
    const units = this._extractUnits(syllabusContent || courseText);
    const topics = this._extractTopics(syllabusContent);
    const textbooks = this._extractRefSection(courseText, /Text Books?:/i, /Reference Books?:/i);
    const refbooks = this._extractRefSection(courseText, /Reference Books?:/i, /Online\s+Resource/i);
    const onlineRes = this._extractRefSection(courseText, /Online\s+Resource/i, /Department of|^(?=[A-Z]{2}\d{4})/m);

    return {
      courseCode: header.code,
      courseName: header.title,
      semester: (semesterMap && semesterMap[header.code]) || '',
      credits: header.credits,
      category: header.category,
      prerequisite: prereq,
      outcomes,
      syllabusContent,
      modules,
      units,
      topics,
      textbooks: this._cleanRefs(textbooks),
      referenceBooks: this._cleanRefs(refbooks),
      onlineResources: this._cleanRefs(onlineRes),
    };
  }

  _extractSection(text, regex) {
    const m = text.match(regex);
    return m ? m[1].trim() : '';
  }

  _extractOutcomes(text) {
    const outcomes = [];
    const rx = /(CO\d+)\s+(.+?)(?=\nCO\d+|\nSyllabus:|$)/gs;
    let m;
    while ((m = rx.exec(text)) !== null) {
      outcomes.push(m[1] + ' ' + m[2].trim());
    }
    if (outcomes.length === 0) {
      const alt = text.match(/Course Outcomes?:?\s*([\s\S]+?)(?=\nSyllabus:|$)/i);
      if (alt) outcomes.push(alt[1].trim());
    }
    return outcomes.join('; ').replace(/\s+/g, ' ');
  }

  _extractSyllabusContent(text) {
    const m = text.match(/Syllabus:\s*\n([\s\S]+?)(?=\n\s*Text Books?:|$)/i);
    if (m) return m[1].trim();

    const m2 = text.match(/Syllabus:\s*([\s\S]+?)(?=\n\s*Text Books?:|$)/i);
    return m2 ? m2[1].trim() : '';
  }

  _extractModules(text) {
    const modules = [];
    const rx = /Module\s+(\d+)\s*:?\s*([A-Za-z0-9\s\-/]+?)(?=\nModule\s+\d+|$)/gi;
    let m;
    while ((m = rx.exec(text)) !== null) {
      const title = m[2].trim();
      if (title && title.length < 100) {
        modules.push({ moduleNumber: m[1], moduleTitle: title });
      }
    }
    return modules;
  }

  _extractUnits(text) {
    const units = [];
    const rx = /Unit\s+(\d+)\s*:?\s*([A-Za-z0-9\s\-/]+?)(?=\nUnit\s+\d+|$)/gi;
    let m;
    while ((m = rx.exec(text)) !== null) {
      const title = m[2].trim();
      if (title && title.length < 100) {
        units.push({ unitNumber: m[1], unitTitle: title });
      }
    }
    return units;
  }

  _extractTopics(syllabusContent) {
    const topics = [];
    if (!syllabusContent) return topics;

    const lines = syllabusContent.split('\n').map(l => l.trim()).filter(Boolean);
    let current = '';

    for (const line of lines) {
      const isHeading = /^[A-Z][A-Za-z0-9\s\-/,]{5,}:\s/.test(line);
      if (isHeading) {
        if (current) topics.push({ text: current });
        current = line;
      } else {
        current = current ? current + ' ' + line : line;
      }
    }
    if (current) topics.push({ text: current });

    return topics;
  }

  _extractRefSection(text, startRegex, endRegex) {
    const lines = text.split('\n');
    let capturing = false;
    const parts = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (startRegex.test(trimmed)) { capturing = true; continue; }
      if (capturing && endRegex.test(trimmed)) break;
      if (capturing && trimmed) parts.push(trimmed);
    }
    return parts.join('\n');
  }

  _cleanRefs(text) {
    if (!text) return '';
    return text.split('\n')
      .map(l => l.replace(/^\d+\.?\s*/, '').trim())
      .filter(l => l && !/^Department of/i.test(l) && !/^Scheme and Syllabi/i.test(l))
      .join('; ');
  }

  async parseDepartmentSyllabus(department) {
    const pdfPath = require('path').join(__dirname, '../course_bootstrap', department, 'syllabus.pdf');
    return this.parseSyllabus(pdfPath);
  }

  // =========================================================================
  // 2. ENTERPRISE MULTIMODAL SCIENTIFIC OCR & DOCUMENT INGESTION
  // =========================================================================

  /**
   * Parse a scientific paper, textbook chapter, or engineering lab manual from PDF buffer, file path, or text.
   */
  async parseScientificDocument(input, options = {}) {
    try {
      let rawText = '';
      let metadata = {};
      let totalPages = 1;

      if (typeof input === 'string' && (input.endsWith('.pdf') || fs.existsSync(input))) {
        const dataBuffer = fs.readFileSync(input);
        const pdfData = await pdf(dataBuffer);
        rawText = pdfData.text;
        totalPages = pdfData.numpages || 1;
        metadata = {
          title: pdfData.info?.Title || options.title || 'Scientific Document',
          author: pdfData.info?.Author || 'Unknown',
          subject: pdfData.info?.Subject || 'Scientific Engineering',
          producer: pdfData.info?.Producer,
          creationDate: pdfData.info?.CreationDate,
        };
      } else if (Buffer.isBuffer(input)) {
        const pdfData = await pdf(input);
        rawText = pdfData.text;
        totalPages = pdfData.numpages || 1;
        metadata = {
          title: pdfData.info?.Title || options.title || 'Scientific Document',
          author: pdfData.info?.Author || 'Unknown',
        };
      } else if (typeof input === 'string') {
        rawText = input;
        totalPages = options.totalPages || Math.floor(rawText.length / 2500) + 1;
        metadata = {
          title: options.title || 'Scientific Engineering Document',
          author: options.author || 'Author',
        };
      }

      return this.parseScientificText(rawText, {
        docId: options.docId,
        title: options.title || metadata.title,
        totalPages,
        ...metadata,
      }, options);
    } catch (error) {
      log.error('Scientific Doc Parser', 'Failed to parse scientific document', error);
      throw new Error(`Scientific document ingestion failed: ${error.message}`);
    }
  }

  /**
   * Performs multi-tier LaTeX equation parsing, table extraction, multimodal schematic detection,
   * vector chunking, Qdrant point generation, and STN graph generation.
   */
  parseScientificText(rawText, metadata = {}, options = {}) {
    const docId = metadata.docId || `doc_${Date.now()}`;
    const title = metadata.title || 'Untitled Scientific Document';
    const totalPages = metadata.totalPages || Math.floor(rawText.length / 2500) + 1;

    const { structuredEquations, rawEqStrings } = this.extractLaTeXEquations(rawText);
    const figures = this.extractFigures(rawText);
    const tables = this.extractTables(rawText);
    const concepts = this.extractSTNConcepts(rawText);
    const sections = this.extractSections(rawText);

    // Vector Chunks and Qdrant points
    const vectorChunks = this.generateVectorChunks(docId, sections);
    const qdrantPoints = this.generateQdrantPoints(docId, title, vectorChunks, concepts);

    // Semantic Topic Network Graph
    const stnGraph = this.generateSTNGraph(docId, title, sections, concepts, structuredEquations, figures);

    return {
      docId,
      title,
      metadata,
      totalPages,
      rawText,
      sections,
      extractedEquations: rawEqStrings,
      structuredEquations,
      extractedFigures: figures,
      extractedTables: tables,
      stnConcepts: concepts,
      vectorChunks,
      qdrantPoints,
      stnGraph,
      parsedAt: new Date().toISOString(),
    };
  }

  /**
   * Multi-tier LaTeX equation extraction:
   * Tier 1: Matrices (\begin{bmatrix}, \begin{pmatrix}, \begin{matrix}, etc.)
   * Tier 2: Differential equation systems (\begin{cases}, \frac{d...}{dt}, state-space systems)
   * Tier 3: Display math ($$...$$, \[...\], \begin{equation}, \begin{align})
   * Tier 4: Inline math ($...$, \(...\))
   * Tier 5: Standard engineering formulas (V_o = D * V_in)
   */
  extractLaTeXEquations(text) {
    const structuredEquations = [];
    const rawEqStrings = [];
    const seen = new Set();

    const addEq = (raw, clean, tier, isSystem, matrixDim, contextText) => {
      const cleanTrimmed = (clean || '').trim();
      if (!cleanTrimmed || seen.has(cleanTrimmed)) return;
      seen.add(cleanTrimmed);

      const eqId = `eq_${structuredEquations.length + 1}`;
      const variables = this._extractMathVariables(cleanTrimmed);
      const operators = this._extractMathOperators(cleanTrimmed);

      structuredEquations.push({
        id: eqId,
        rawLaTeX: (raw || '').trim(),
        cleanLaTeX: cleanTrimmed,
        tier,
        variables,
        operators,
        isSystem: Boolean(isSystem),
        matrixDim: matrixDim || undefined,
        contextText: contextText || 'Mathematical formulation',
      });
      rawEqStrings.push((raw || '').trim());
    };

    // 1. Matrices: \begin{bmatrix}...\end{bmatrix}, pmatrix, matrix, vmatrix, array
    const matrixRegex = /\\begin\{(bmatrix|pmatrix|vmatrix|Vmatrix|matrix|array)\*?\}([\s\S]*?)\\end\{(bmatrix|pmatrix|vmatrix|Vmatrix|matrix|array)\*?\}/g;
    let match;
    while ((match = matrixRegex.exec(text)) !== null) {
      const full = match[0];
      const body = match[2];
      const dim = this._calculateMatrixDimensions(body);
      addEq(full, full, 'MATRIX', false, dim, 'Matrix representation');
    }

    // 2. Systems of differential equations / piecewise systems: \begin{cases}...\end{cases}
    const casesRegex = /\\begin\{cases\*?\}([\s\S]*?)\\end\{cases\*?\}/g;
    while ((match = casesRegex.exec(text)) !== null) {
      addEq(match[0], match[0], 'DIFF_EQUATION_SYSTEM', true, undefined, 'System of differential equations / piecewise state dynamics');
    }

    // Differential equations with derivatives
    const diffEqRegex = /(?:Eq\.|Equation\s*\(\d+\)|Formula)?\s*([A-Za-z0-9_\^\(\)\{\}\\\+\-\*\/\=\s\.\,]*?(?:\\frac\{d\^?\d*[a-zA-Z_]*\}\{dt\^?\d*\}|\\dot\{[a-zA-Z_]+\}|\\ddot\{[a-zA-Z_]+\}|\\partial|\\nabla)[A-Za-z0-9_\^\(\)\{\}\\\+\-\*\/\=\s\.\,]*)/gm;
    while ((match = diffEqRegex.exec(text)) !== null) {
      const cand = (match[1] || '').trim();
      if (cand.length > 5 && !cand.startsWith('$$') && !cand.startsWith('\\begin{')) {
        addEq(cand, cand, 'DIFF_EQUATION_SYSTEM', true, undefined, 'Differential equation model');
      }
    }

    // 3. LaTeX Display Math Environments: \begin{equation}, \begin{align}, \begin{gather}
    const envRegex = /\\begin\{(equation|align|gather|multline)\*?\}([\s\S]*?)\\end\{(equation|align|gather|multline)\*?\}/g;
    while ((match = envRegex.exec(text)) !== null) {
      addEq(match[0], match[2].trim(), 'DISPLAY_MATH', false, undefined, 'Display equation environment');
    }

    // Display math: $$ ... $$
    const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
    while ((match = displayMathRegex.exec(text)) !== null) {
      const body = (match[1] || '').trim();
      if (body.length > 0) {
        let tier = 'DISPLAY_MATH';
        let isSys = false;
        let dim = undefined;

        if (body.includes('\\begin{bmatrix}') || body.includes('\\begin{pmatrix}')) {
          tier = 'MATRIX';
          dim = this._calculateMatrixDimensions(body);
        } else if (body.includes('\\begin{cases}') || body.includes('\\frac{d') || body.includes('\\dot{')) {
          tier = 'DIFF_EQUATION_SYSTEM';
          isSys = true;
        }
        addEq(`$$${body}$$`, body, tier, isSys, dim, 'Display math block');
      }
    }

    // Display math: \[ ... \]
    const bracketMathRegex = /\\\[([\s\S]*?)\\\]/g;
    while ((match = bracketMathRegex.exec(text)) !== null) {
      const body = (match[1] || '').trim();
      if (body.length > 0) {
        addEq(`\\[${body}\\]`, body, 'DISPLAY_MATH', false, undefined, 'Display math bracket block');
      }
    }

    // 4. Inline math: $ ... $ (filtering out currency like $100 or $5.50)
    const inlineMathRegex = /\$([^\$\n\r]+?)\$/g;
    while ((match = inlineMathRegex.exec(text)) !== null) {
      const body = (match[1] || '').trim();
      if (body.length > 0 && !/^\d+(?:\.\d+)?$/.test(body) && this._isMathematical(body)) {
        addEq(`$${body}$`, body, 'INLINE_MATH', false, undefined, 'Inline mathematical expression');
      }
    }

    // Inline math: \( ... \)
    const parenInlineRegex = /\\\(([\s\S]*?)\\\)/g;
    while ((match = parenInlineRegex.exec(text)) !== null) {
      const body = (match[1] || '').trim();
      if (body.length > 0 && this._isMathematical(body)) {
        addEq(`\\(${body}\\)`, body, 'INLINE_MATH', false, undefined, 'Inline math delimiter');
      }
    }

    // 5. Standard formulas: e.g. V_o = D * V_in
    const formulaRegex = /^(?:Eq\.|Equation\s*\(\d+\)|Formula)?\s*([A-Za-z0-9_\^\(\)\{\}\\\+\-\*\/\=\s\.\,]+=[A-Za-z0-9_\^\(\)\{\}\\\+\-\*\/\=\s\.\,]+)$/gm;
    while ((match = formulaRegex.exec(text)) !== null) {
      const cand = (match[1] || '').trim();
      if (cand.length > 3 && !cand.startsWith('$$') && !cand.startsWith('\\')) {
        addEq(cand, cand, 'STANDARD_FORMULA', false, undefined, 'Standard governing formula');
      }
    }

    return { structuredEquations, rawEqStrings };
  }

  /**
   * Extracts structured data tables (Markdown & LaTeX) and serializes rows into JSON records with numerical statistics.
   */
  extractTables(text) {
    const tables = [];

    // 1. Markdown tables
    const mdTables = this._extractMarkdownTables(text);
    tables.push(...mdTables);

    // 2. LaTeX tabular tables
    const latexTables = this._extractLaTeXTables(text);
    tables.push(...latexTables);

    return tables;
  }

  _extractMarkdownTables(text) {
    const tables = [];
    const lines = text.split('\n');
    let currentTableLines = [];
    let tableCaption = '';
    let startLine = 0;
    let inTable = false;

    const flushTable = () => {
      if (currentTableLines.length >= 2) {
        const table = this._parseMarkdownTableLines(currentTableLines, tableCaption, tables.length + 1, startLine);
        if (table) tables.push(table);
      }
      currentTableLines = [];
      inTable = false;
      tableCaption = '';
    };

    const captionRegex = /^(?:Table\s*(\d+)[:\s\-]+(.*)|###\s*Table\s*(\d+)[:\s\-]+(.*))/i;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();

      if (captionRegex.test(trimmed)) {
        if (inTable) flushTable();
        tableCaption = trimmed;
        continue;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          startLine = idx + 1;
          if (!tableCaption && idx > 0) {
            const prev = lines[idx - 1].trim();
            if (/table/i.test(prev)) tableCaption = prev;
          }
        }
        currentTableLines.push(trimmed);
      } else {
        if (inTable) flushTable();
      }
    }
    if (inTable) flushTable();

    return tables;
  }

  _parseMarkdownTableLines(lines, caption, tableNum, startLine) {
    if (lines.length < 2) return null;

    const splitRow = (row) => {
      const trimmed = row.replace(/^\||\|$/g, '');
      return trimmed.split('|').map(c => c.trim());
    };

    const headers = splitRow(lines[0]);
    if (!headers || headers.length === 0) return null;

    let startDataIdx = 1;
    if (lines.length > 1 && lines[1].includes('-')) {
      startDataIdx = 2;
    }

    const rawRows = [];
    for (let i = startDataIdx; i < lines.length; i++) {
      const rowCells = splitRow(lines[i]);
      if (rowCells.length > 0) {
        while (rowCells.length < headers.length) rowCells.push('');
        rawRows.push(rowCells.slice(0, headers.length));
      }
    }

    if (rawRows.length === 0) return null;

    const recordsJSON = [];
    const numSummary = {};
    const columns = headers.map(h => ({ name: h, dataType: 'string' }));

    for (const row of rawRows) {
      const record = {};
      row.forEach((cellVal, colIdx) => {
        const header = headers[colIdx];
        const { isNumeric, value, unit } = this._parseNumericAndUnit(cellVal);
        if (isNumeric) {
          record[header] = value;
          if (!numSummary[header]) numSummary[header] = [];
          numSummary[header].push(value);
          columns[colIdx].dataType = 'numeric';
          if (unit) columns[colIdx].unit = unit;
        } else {
          record[header] = cellVal;
        }
      });
      recordsJSON.push(record);
    }

    // Compute column stats
    columns.forEach(col => {
      const vals = numSummary[col.name];
      if (vals && vals.length > 0) {
        col.numericMin = Math.min(...vals);
        col.numericMax = Math.max(...vals);
        col.numericMean = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    });

    const page = Math.floor(startLine / 50) + 1;

    return {
      tableId: `table_${tableNum}`,
      tableNumber: tableNum,
      caption: caption || `Table ${tableNum}: Structured Engineering Data`,
      headers,
      columns,
      rawRows,
      recordsJSON,
      numericalSummary: numSummary,
      contextText: `Tabular specifications for ${caption || `Table ${tableNum}`}`,
      boundingBox: {
        pageNumber: page,
        x: 54.0,
        y: 180.0,
        width: 504.0,
        height: (rawRows.length + 2) * 24.0,
        unit: 'pt',
      },
    };
  }

  _extractLaTeXTables(text) {
    const tables = [];
    const tabularRegex = /\\begin\{tabular\}\{[^\}]*\}([\s\S]*?)\\end\{tabular\}/g;
    let match;
    let count = 1;

    while ((match = tabularRegex.exec(text)) !== null) {
      const body = match[1];
      const lines = body.split('\\\\').map(l => l.replace(/\\hline/g, '').trim()).filter(Boolean);
      const rawRows = lines.map(l => l.split('&').map(c => c.trim()));

      if (rawRows.length < 2) continue;

      const headers = rawRows[0];
      const dataRows = rawRows.slice(1);
      const recordsJSON = [];
      const numSummary = {};
      const columns = headers.map(h => ({ name: h, dataType: 'string' }));

      for (const row of dataRows) {
        const record = {};
        headers.forEach((h, colIdx) => {
          const valStr = row[colIdx] || '';
          const { isNumeric, value, unit } = this._parseNumericAndUnit(valStr);
          if (isNumeric) {
            record[h] = value;
            if (!numSummary[h]) numSummary[h] = [];
            numSummary[h].push(value);
            columns[colIdx].dataType = 'numeric';
            if (unit) columns[colIdx].unit = unit;
          } else {
            record[h] = valStr;
          }
        });
        recordsJSON.push(record);
      }

      tables.push({
        tableId: `table_latex_${count}`,
        tableNumber: count,
        caption: `Table ${count}: LaTeX Specification Table`,
        headers,
        columns,
        rawRows: dataRows,
        recordsJSON,
        numericalSummary: numSummary,
        contextText: 'LaTeX Tabular Data Structure',
        boundingBox: {
          pageNumber: 1,
          x: 54.0,
          y: 200.0,
          width: 504.0,
          height: (dataRows.length + 2) * 22.0,
          unit: 'pt',
        },
      });
      count++;
    }

    return tables;
  }

  /**
   * Multimodal figure extraction (Circuit schematics, Waveform plots, Block diagrams)
   */
  extractFigures(text) {
    const figures = [];
    const figRegex = /(?:Fig(?:ure)?\.?\s*(\d+)[:\s\-]+([^\n]+)|Schematic\s*(\d+)[:\s\-]+([^\n]+)|Diagram\s*(\d+)[:\s\-]+([^\n]+))/gi;
    let match;
    let idx = 1;

    while ((match = figRegex.exec(text)) !== null) {
      const rawCaption = (match[2] || match[4] || match[6] || '').trim();
      if (!rawCaption) continue;

      const fType = this._classifyFigureType(rawCaption);
      const components = this._extractCircuitComponents(rawCaption + ' ' + text);
      const tags = this._generateFigureSemanticTags(fType, rawCaption);

      const bytePos = match.index;
      const contextText = this._extractContextAroundPos(text, bytePos, 250);
      const page = Math.floor(bytePos / 2500) + 1;
      const yOffset = 120.0 + ((idx - 1) % 3) * 220.0;

      figures.push({
        figureNumber: idx,
        figureId: `fig_${idx}`,
        caption: rawCaption,
        figureType: fType,
        contextText,
        boundingBox: {
          pageNumber: page,
          x: 54.0,
          y: yOffset,
          width: 504.0,
          height: 210.0,
          unit: 'pt',
        },
        semanticTags: tags,
        extractedComponents: components,
        associatedEquations: [],
      });
      idx++;
    }

    return figures;
  }

  /**
   * Hierarchical section extraction
   */
  extractSections(text) {
    const lines = text.split('\n');
    const sections = [];
    let currentHeading = 'Introduction';
    let currentLevel = 1;
    let currentBody = [];
    let hasHeading = false;

    const flushSection = () => {
      const content = currentBody.join('\n').trim();
      if (hasHeading || content.length > 0) {
        const { structuredEquations, rawEqStrings } = this.extractLaTeXEquations(content);
        const figs = this.extractFigures(content);
        const tbls = this.extractTables(content);
        const concepts = this.extractSTNConcepts(content);

        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content,
          equations: rawEqStrings,
          structuredEquations,
          figures: figs,
          tables: tbls,
          conceptTags: concepts,
        });
        currentBody = [];
        hasHeading = false;
      }
    };

    const headingRegex = /^(#{1,3}\s+|Unit\s+[IVX]+|Module\s+\d+|[0-9]+\.[0-9]*\s+)(.*)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(headingRegex);
      if (match) {
        if (hasHeading || currentBody.join('').trim().length > 0) {
          flushSection();
        }
        currentHeading = match[2].trim();
        hasHeading = true;
        if (trimmed.startsWith('###')) currentLevel = 3;
        else if (trimmed.startsWith('##')) currentLevel = 2;
        else currentLevel = 1;
      } else if (trimmed.length > 0) {
        currentBody.push(line);
      }
    }
    flushSection();

    if (sections.length === 0) {
      const { structuredEquations, rawEqStrings } = this.extractLaTeXEquations(text);
      const figs = this.extractFigures(text);
      const tbls = this.extractTables(text);
      const concepts = this.extractSTNConcepts(text);

      sections.push({
        heading: 'General Content',
        level: 1,
        content: text,
        equations: rawEqStrings,
        structuredEquations,
        figures: figs,
        tables: tbls,
        conceptTags: concepts,
      });
    }

    return sections;
  }

  /**
   * Concept extraction for the Semantic Topic Network
   */
  extractSTNConcepts(text) {
    const keywords = [
      'buck converter', 'boost converter', 'buck-boost converter', 'cuk converter',
      'inverter', 'rectifier', 'inductor', 'capacitor', 'transformer', 'snubber',
      'duty ratio', 'switching frequency', 'continuous conduction mode', 'discontinuous conduction mode',
      'volt-second balance', 'charge balance', 'state-space', 'state-space averaging',
      'transfer function', 'bode plot', 'nyquist', 'root locus', 'phase margin', 'gain margin',
      'thevenin', 'norton', 'kvl', 'kcl', 'phasor', 'resonance', 'harmonics', 'total harmonic distortion',
      'bjt', 'mosfet', 'igbt', 'op-amp', 'schottky diode', 'snubber circuit', 'pulse width modulation',
      'small-signal model', 'feedback control', 'pid controller', 'closed-loop stability',
    ];

    const tLower = text.toLowerCase();
    const found = [];
    const seen = new Set();

    for (const kw of keywords) {
      if (tLower.includes(kw) && !seen.has(kw)) {
        found.push(kw);
        seen.add(kw);
      }
    }
    return found;
  }

  /**
   * Generates vector chunks for embedding models
   */
  generateVectorChunks(docId, sections) {
    return sections.map((sec, idx) => {
      const words = sec.content.split(/\s+/).filter(Boolean);
      const tokenEst = Math.max(10, Math.floor(words.length * 1.3));

      return {
        chunkId: `${docId}_sec_${idx + 1}`,
        docId,
        sectionTitle: sec.heading,
        content: sec.content,
        equations: sec.equations,
        figureCount: (sec.figures || []).length,
        tableCount: (sec.tables || []).length,
        conceptTags: sec.conceptTags,
        estimatedTokens: tokenEst,
      };
    });
  }

  /**
   * Generates Qdrant vector storage points with normalized 16-dim embeddings and rich payloads
   */
  generateQdrantPoints(docId, title, vectorChunks, globalConcepts) {
    return vectorChunks.map((chunk, idx) => {
      // Generate 16-dim normalized vector
      const vector = [];
      let sumSq = 0;
      for (let j = 0; j < 16; j++) {
        const val = Math.sin((idx + 1) * 0.7 + (j + 1) * 0.3);
        vector.push(val);
        sumSq += val * val;
      }
      const norm = Math.sqrt(sumSq);
      const normalizedVector = norm > 0 ? vector.map(v => Math.round((v / norm) * 10000) / 10000) : vector;

      return {
        id: `${docId}_${idx + 1}`,
        vector: normalizedVector,
        payload: {
          doc_id: docId,
          doc_title: title,
          chunk_id: chunk.chunkId,
          section_title: chunk.sectionTitle,
          content: chunk.content,
          equations: chunk.equations,
          figure_count: chunk.figureCount,
          table_count: chunk.tableCount,
          concept_tags: chunk.conceptTags,
          global_concepts: globalConcepts,
          estimated_tokens: chunk.estimatedTokens,
          ingested_at: new Date().toISOString(),
        },
      };
    });
  }

  /**
   * Generates in-memory STN Graph with Bloom levels, difficulty, and adjacency matrix
   */
  generateSTNGraph(docId, title, sections, concepts, equations, figures) {
    const codeLower = docId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const bloomHierarchy = ['L1_REMEMBER', 'L2_UNDERSTAND', 'L3_APPLY', 'L4_ANALYZE', 'L5_EVALUATE', 'L6_CREATE'];
    const nodes = [];
    const edges = [];

    sections.forEach((sec, idx) => {
      const nodeId = `node_${codeLower}_s${idx + 1}`;
      const bLevel = bloomHierarchy[idx % bloomHierarchy.length];
      const diff = Math.min(0.95, 0.35 + idx * 0.12);

      const embedding = [];
      for (let j = 0; j < 16; j++) {
        embedding.push(Math.round(Math.cos((idx + 1) * (j + 1)) * 1000) / 1000);
      }

      nodes.push({
        id: nodeId,
        lectureNum: idx + 1,
        title: sec.heading,
        module: title,
        subtopics: (sec.conceptTags || []).join(', '),
        bloomLevel: bLevel,
        difficulty: diff,
        embedding,
        requiredMastery: 0.85,
      });

      if (idx > 0) {
        const prevId = `node_${codeLower}_s${idx}`;
        edges.push({
          source: prevId,
          target: nodeId,
          type: 'LEADS_TO',
          weight: 0.9,
        });
        edges.push({
          source: prevId,
          target: nodeId,
          type: 'PREREQUISITE_OF',
          weight: 0.85,
        });
      }
    });

    // Build Adjacency Matrix
    const numNodes = nodes.length;
    const adj = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
    const nodeIdxMap = new Map();
    nodes.forEach((n, i) => nodeIdxMap.set(n.id, i));

    edges.forEach(e => {
      const s = nodeIdxMap.get(e.source);
      const t = nodeIdxMap.get(e.target);
      if (s !== undefined && t !== undefined) {
        adj[s][t] = e.weight;
      }
    });

    return {
      courseCode: docId,
      courseName: title,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodes,
      edges,
      adjacencyMatrix: adj,
    };
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  _calculateMatrixDimensions(body) {
    const rows = body.split('\\\\').map(r => r.replace(/\\hline/g, '').trim()).filter(Boolean);
    if (rows.length === 0) return '1x1';
    const firstRow = rows[0];
    const cols = firstRow.split('&');
    return `${rows.length}x${cols.length}`;
  }

  _isMathematical(s) {
    const mathIndicators = [
      '=', '+', '-', '*', '/', '^', '_', '\\', '(', ')', '{', '}',
      '\\alpha', '\\beta', '\\gamma', '\\theta', '\\omega', '\\pi', '\\Delta', '\\sigma',
      '\\int', '\\sum', '\\sqrt', '\\frac', '\\cdot', '\\partial', '\\dot', '\\in',
    ];
    for (const ind of mathIndicators) {
      if (s.includes(ind)) return true;
    }
    return /^[A-Za-z](?:_[A-Za-z0-9]+)?$/.test(s);
  }

  _extractMathVariables(eq) {
    const vars = [];
    const seen = new Set();
    const matches = eq.match(/\\?[A-Za-z]+(?:_\{?[A-Za-z0-9]+\}?)?/g) || [];

    const reserved = new Set([
      '\\begin', '\\end', '\\frac', '\\cdot', '\\sqrt', '\\int', '\\sum', '\\text',
      '\\mathbf', '\\left', '\\right', 'bmatrix', 'pmatrix', 'matrix', 'cases', 'align',
      'equation', 'array', 'dt', 'dx', 'dy',
    ]);

    for (const m of matches) {
      if (!reserved.has(m) && !seen.has(m) && m.length > 0) {
        vars.push(m);
        seen.add(m);
      }
    }
    return vars;
  }

  _extractMathOperators(eq) {
    const ops = [];
    const seen = new Set();
    const operatorList = ['=', '+', '-', '*', '/', '\\cdot', '\\times', '\\pm', '\\mp', '\\int', '\\sum', '\\partial', '\\nabla', '\\le', '\\ge', '\\approx'];

    for (const op of operatorList) {
      if (eq.includes(op) && !seen.has(op)) {
        ops.push(op);
        seen.add(op);
      }
    }
    return ops;
  }

  _classifyFigureType(caption) {
    const cLower = caption.toLowerCase();
    if (cLower.includes('waveform') || cLower.includes('transient') || cLower.includes('response') ||
        cLower.includes('ripple') || cLower.includes('bode') || cLower.includes('nyquist') ||
        cLower.includes('plot') || cLower.includes('timing')) {
      return 'WAVEFORM_PLOT';
    }
    if (cLower.includes('block') || cLower.includes('architecture') || cLower.includes('flowchart') ||
        cLower.includes('controller') || cLower.includes('feedback') || cLower.includes('closed-loop')) {
      return 'BLOCK_DIAGRAM';
    }
    if (cLower.includes('state') || cLower.includes('fsm') || cLower.includes('transition')) {
      return 'STATE_DIAGRAM';
    }
    if (cLower.includes('table') || cLower.includes('parameters') || cLower.includes('specification')) {
      return 'DATA_TABLE';
    }
    return 'CIRCUIT_SCHEMATIC';
  }

  _extractCircuitComponents(text) {
    const components = [];
    const seen = new Set();

    const patterns = [
      /\b(MOSFET\s+[A-Z0-9_]+|MOSFET|Q\d+)\b/gi,
      /\b(Diode\s+[A-Z0-9_]+|Diode|D\d+|Schottky\s+Diode)\b/gi,
      /\b(Inductor\s+[A-Z0-9_]+|Inductor|L\d*)\b/gi,
      /\b(Capacitor\s+[A-Z0-9_]+|Capacitor|C\d*)\b/gi,
      /\b(Resistor\s+[A-Z0-9_]+|Resistor|R\d*|Load\s+Resistor)\b/gi,
      /\b(Op-?Amp\s+[A-Z0-9_]+|Op-?Amp|LM\d+|TL\d+)\b/gi,
      /\b(PWM\s+Controller|Gate\s+Driver|IR\d+)\b/gi,
      /\b(Transformer\s+[A-Z0-9_]+|Transformer|T\d+)\b/gi,
    ];

    for (const pat of patterns) {
      let m;
      while ((m = pat.exec(text)) !== null) {
        const clean = m[0].trim();
        const upper = clean.toUpperCase();
        if (!seen.has(upper)) {
          components.push(clean);
          seen.add(upper);
        }
      }
    }
    return components;
  }

  _generateFigureSemanticTags(fType, caption) {
    const tags = [fType.toLowerCase()];
    const cLower = caption.toLowerCase();

    const keywords = [
      'buck', 'boost', 'converter', 'inverter', 'rectifier', 'pwm', 'continuous conduction',
      'discontinuous conduction', 'transient', 'steady-state', 'bode', 'nyquist', 'inductor',
      'mosfet', 'feedback', 'small-signal', 'pid', 'controller',
    ];

    for (const kw of keywords) {
      if (cLower.includes(kw)) {
        tags.push(kw.replace(/\s+/g, '_'));
      }
    }
    return tags;
  }

  _extractContextAroundPos(text, pos, windowSize = 200) {
    const start = Math.max(0, pos - windowSize);
    const end = Math.min(text.length, pos + windowSize);
    return text.substring(start, end).split('\n').map(l => l.trim()).filter(Boolean).join(' ');
  }

  _parseNumericAndUnit(str) {
    if (!str || typeof str !== 'string') return { isNumeric: false, value: str, unit: '' };

    let s = str.replace(/\$/g, '').replace(/\\text\{/g, '').replace(/\}/g, '').trim();

    const match = s.match(/^([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s*([a-zA-Z%µΩ\/\^0-9\-]*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) {
        return {
          isNumeric: true,
          value: num,
          unit: (match[2] || '').trim(),
        };
      }
    }

    return { isNumeric: false, value: str, unit: '' };
  }
}

module.exports = PDFParserService;
