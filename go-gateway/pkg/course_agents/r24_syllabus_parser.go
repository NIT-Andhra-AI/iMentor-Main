package course_agents

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
)

// R24SyllabusParser loads and parses the official NIT Andhra Pradesh R24 regulation
// curriculum from curriculum_pdf.json. It extracts predefined syllabi, course outcomes,
// textbooks, and decomposes them into 36-lecture structures.
type R24SyllabusParser struct {
	// CurriculumPath is the path to curriculum_pdf.json
	CurriculumPath string
	// cache stores parsed courses indexed by normalized course code
	cache map[string]*R24ParsedCourse
	// loaded tracks whether the JSON has been read
	loaded bool
}

// NewR24SyllabusParser creates a parser pointing to the curriculum JSON file
func NewR24SyllabusParser(curriculumPath string) *R24SyllabusParser {
	if curriculumPath == "" {
		curriculumPath = "server/scripts/curriculum_pdf.json"
	}
	return &R24SyllabusParser{
		CurriculumPath: curriculumPath,
		cache:          make(map[string]*R24ParsedCourse),
	}
}

// Load reads and parses the curriculum JSON file, populating the cache
func (p *R24SyllabusParser) Load() error {
	if p.loaded {
		return nil
	}

	data, err := os.ReadFile(p.CurriculumPath)
	if err != nil {
		return fmt.Errorf("failed to read R24 curriculum file %s: %w", p.CurriculumPath, err)
	}

	var entries []R24SyllabusEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return fmt.Errorf("failed to parse R24 curriculum JSON: %w", err)
	}

	// Regex patterns for parsing
	codePattern := regexp.MustCompile(`(?i)((?:EE|CS|EC|MA|SM)\s*\d{3,4}[A-Za-z]?)\s+(.+?)(?:\s+(?:PCC|ESC|BSC|DEC|OE|PEC)\s+)?(\d-\d-\d)\s+(\d+\s+Credits?)`)
	coPattern := regexp.MustCompile(`(?i)CO(\d)\s+(.+?)(?:\n|$)`)

	for _, entry := range entries {
		text := entry.Text
		if !strings.Contains(text, "Syllabus:") && !strings.Contains(text, "Syllabus:\n") {
			continue
		}

		// Extract course code and name
		codeMatch := codePattern.FindStringSubmatch(text)
		if codeMatch == nil {
			continue
		}

		courseCode := strings.ReplaceAll(strings.TrimSpace(codeMatch[1]), " ", "")
		courseName := strings.TrimSpace(codeMatch[2])
		credits := strings.TrimSpace(codeMatch[3]) + " " + strings.TrimSpace(codeMatch[4])

		// Extract prerequisites
		prereqs := ""
		if idx := strings.Index(text, "Pre-requisites:"); idx >= 0 {
			end := strings.Index(text[idx:], "\n")
			if end > 0 {
				prereqs = strings.TrimSpace(text[idx+len("Pre-requisites:") : idx+end])
			}
		} else if idx := strings.Index(text, "Pre-requisite:"); idx >= 0 {
			end := strings.Index(text[idx:], "\n")
			if end > 0 {
				prereqs = strings.TrimSpace(text[idx+len("Pre-requisite:") : idx+end])
			}
		}

		// Extract course outcomes
		var outcomes []string
		coMatches := coPattern.FindAllStringSubmatch(text, -1)
		for _, m := range coMatches {
			outcomes = append(outcomes, fmt.Sprintf("CO%s: %s", m[1], strings.TrimSpace(m[2])))
		}

		// Extract syllabus text (between "Syllabus:" and "Text Books:" or "Textbooks:")
		syllabusText := ""
		syllabusStart := strings.Index(text, "Syllabus:")
		if syllabusStart < 0 {
			syllabusStart = strings.Index(text, "Syllabus:\n")
		}
		if syllabusStart >= 0 {
			syllabusStart += len("Syllabus:")
			syllabusEnd := len(text)

			// Find where syllabus section ends
			for _, marker := range []string{"Text Books:", "Textbooks:", "Text books:", "Reference Books:", "Online Resources:", "Scheme and Syllabi"} {
				if idx := strings.Index(text[syllabusStart:], marker); idx >= 0 && (syllabusStart+idx) < syllabusEnd {
					syllabusEnd = syllabusStart + idx
				}
			}
			syllabusText = strings.TrimSpace(text[syllabusStart:syllabusEnd])
		}

		// Extract textbooks
		var textbooks []string
		tbStart := -1
		for _, marker := range []string{"Text Books:", "Textbooks:", "Text books:"} {
			if idx := strings.Index(text, marker); idx >= 0 {
				tbStart = idx + len(marker)
				break
			}
		}
		if tbStart >= 0 {
			tbEnd := len(text)
			for _, marker := range []string{"Reference Books:", "Online Resources:", "Scheme and Syllabi"} {
				if idx := strings.Index(text[tbStart:], marker); idx >= 0 && (tbStart+idx) < tbEnd {
					tbEnd = tbStart + idx
				}
			}
			tbText := strings.TrimSpace(text[tbStart:tbEnd])
			tbLines := strings.Split(tbText, "\n")
			for _, line := range tbLines {
				line = strings.TrimSpace(line)
				if len(line) > 10 && !strings.HasPrefix(line, "Reference") {
					// Remove leading numbering like "1. " or "2. "
					line = regexp.MustCompile(`^\d+\.\s*`).ReplaceAllString(line, "")
					if len(line) > 5 {
						textbooks = append(textbooks, line)
					}
				}
			}
		}

		// Extract references
		var references []string
		refStart := -1
		if idx := strings.Index(text, "Reference Books:"); idx >= 0 {
			refStart = idx + len("Reference Books:")
		} else if idx := strings.Index(text, "Reference books:"); idx >= 0 {
			refStart = idx + len("Reference books:")
		}
		if refStart >= 0 {
			refEnd := len(text)
			for _, marker := range []string{"Online Resources:", "Scheme and Syllabi"} {
				if idx := strings.Index(text[refStart:], marker); idx >= 0 && (refStart+idx) < refEnd {
					refEnd = refStart + idx
				}
			}
			refText := strings.TrimSpace(text[refStart:refEnd])
			refLines := strings.Split(refText, "\n")
			for _, line := range refLines {
				line = strings.TrimSpace(line)
				line = regexp.MustCompile(`^\d+\.\s*`).ReplaceAllString(line, "")
				if len(line) > 10 {
					references = append(references, line)
				}
			}
		}

		// Parse syllabus into unit titles and texts
		unitTitles, unitTexts := p.parseSyllabusUnits(syllabusText)

		parsed := &R24ParsedCourse{
			CourseCode:     courseCode,
			CourseName:     courseName,
			Credits:        credits,
			Prerequisites:  prereqs,
			CourseOutcomes: outcomes,
			SyllabusText:   syllabusText,
			UnitTexts:      unitTexts,
			UnitTitles:     unitTitles,
			Textbooks:      textbooks,
			References:     references,
		}

		p.cache[courseCode] = parsed
		log.Printf("📋 [R24 Parser] Loaded predefined syllabus for [%s] %s (%d units)", courseCode, courseName, len(unitTitles))
	}

	p.loaded = true
	log.Printf("📋 [R24 Parser] Successfully loaded %d predefined R24 syllabi from %s", len(p.cache), p.CurriculumPath)
	return nil
}

// parseSyllabusUnits splits the raw syllabus text into titled unit paragraphs.
// R24 syllabus uses bold/titled paragraphs like:
//   "Introduction: topics...\nPhase-Controlled Rectifiers: topics...\n"
// Each paragraph heading becomes a unit title.
func (p *R24SyllabusParser) parseSyllabusUnits(syllabusText string) ([]string, []string) {
	if syllabusText == "" {
		return nil, nil
	}

	// Pattern: A capitalized heading followed by a colon, then content until the next heading
	// Examples: "Introduction:", "Phase-Controlled Rectifiers:", "Inverters:", "DC-DC Converters:"
	headingPattern := regexp.MustCompile(`(?m)^([A-Z][A-Za-z\s,\-\(\)&/]+):\s*`)

	matches := headingPattern.FindAllStringSubmatchIndex(syllabusText, -1)

	if len(matches) == 0 {
		// No structured headings found — split by double newlines or treat as single unit
		paragraphs := strings.Split(syllabusText, "\n\n")
		var titles, texts []string
		for i, para := range paragraphs {
			para = strings.TrimSpace(para)
			if len(para) > 20 {
				titles = append(titles, fmt.Sprintf("Unit %d", i+1))
				texts = append(texts, para)
			}
		}
		if len(titles) == 0 {
			return []string{"Unit I"}, []string{syllabusText}
		}
		return titles, texts
	}

	var titles, texts []string
	for i, match := range matches {
		titleStart := match[2]
		titleEnd := match[3]
		contentStart := match[1] // End of full match (after the colon)

		title := strings.TrimSpace(syllabusText[titleStart:titleEnd])

		var contentEnd int
		if i+1 < len(matches) {
			contentEnd = matches[i+1][0]
		} else {
			contentEnd = len(syllabusText)
		}

		content := strings.TrimSpace(syllabusText[contentStart:contentEnd])
		if len(content) > 5 {
			titles = append(titles, title)
			texts = append(texts, content)
		}
	}

	return titles, texts
}

// GetCourse retrieves a parsed R24 course by code. Returns nil if not found.
func (p *R24SyllabusParser) GetCourse(courseCode string) *R24ParsedCourse {
	code := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	if !p.loaded {
		if err := p.Load(); err != nil {
			log.Printf("Warning: failed to load R24 curriculum: %v", err)
			return nil
		}
	}
	return p.cache[code]
}

// HasCourse checks if the R24 syllabus contains a given course code
func (p *R24SyllabusParser) HasCourse(courseCode string) bool {
	return p.GetCourse(courseCode) != nil
}

// DecomposeToLectures converts the predefined R24 syllabus into exactly 36 Lecture structs
func (p *R24SyllabusParser) DecomposeToLectures(courseCode string) []Lecture {
	r24 := p.GetCourse(courseCode)
	if r24 == nil {
		return nil
	}
	return p.DecomposeParsedCourse(r24)
}

// DecomposeParsedCourse converts a parsed course specification into 36 lectures
func (p *R24SyllabusParser) DecomposeParsedCourse(r24 *R24ParsedCourse) []Lecture {
	if r24 == nil {
		return nil
	}

	totalLectures := 36
	numUnits := len(r24.UnitTitles)
	if numUnits == 0 {
		return nil
	}

	// Distribute lectures across units
	lecturesPerUnit := make([]int, numUnits)
	baseLecs := totalLectures / numUnits
	remainder := totalLectures % numUnits
	for i := range lecturesPerUnit {
		lecturesPerUnit[i] = baseLecs
		if i < remainder {
			lecturesPerUnit[i]++
		}
	}

	var lectures []Lecture
	lecNum := 1

	for uIdx := 0; uIdx < numUnits; uIdx++ {
		unitTitle := r24.UnitTitles[uIdx]
		unitContent := ""
		if uIdx < len(r24.UnitTexts) {
			unitContent = r24.UnitTexts[uIdx]
		}

		moduleName := fmt.Sprintf("Unit %s: %s", romanNumeral(uIdx+1), unitTitle)
		nLecs := lecturesPerUnit[uIdx]

		// Split unit content into individual topic chunks for each lecture
		topics := p.splitUnitIntoTopics(unitContent, nLecs)

		for tIdx := 0; tIdx < nLecs; tIdx++ {
			topicTitle := unitTitle
			subtopics := ""
			if tIdx < len(topics) {
				topicTitle = topics[tIdx].title
				subtopics = topics[tIdx].subtopics
			} else {
				topicTitle = fmt.Sprintf("%s - Advanced Topics & Problem Solving (Part %d)", unitTitle, tIdx+1)
				subtopics = "Advanced problems, worked examples, GATE practice"
			}

			// Bloom level progression within the unit
			bloom := p.assignBloomLevel(uIdx, tIdx, nLecs)

			prereq := "None"
			if lecNum > 1 {
				prereq = fmt.Sprintf("L%d", lecNum-1)
			}

			lectures = append(lectures, Lecture{
				Module:    moduleName,
				Num:       lecNum,
				Title:     topicTitle,
				Subtopics: subtopics,
				Bloom:     bloom,
				Prereq:    prereq,
				IsLab:     false,
			})
			lecNum++
		}
	}

	return lectures
}

// topicChunk holds a parsed lecture topic from the R24 syllabus text
type topicChunk struct {
	title     string
	subtopics string
}

// splitUnitIntoTopics decomposes a unit's content text into n lecture topics
// Pre-compiled regexes for topic splitting (Go re2 compatible — no lookaheads)
var (
	whitespaceNorm = regexp.MustCompile(`\s+`)
)

func (p *R24SyllabusParser) splitUnitIntoTopics(unitContent string, nLectures int) []topicChunk {
	if unitContent == "" || nLectures == 0 {
		return nil
	}

	unitContent = strings.TrimSpace(unitContent)
	unitContent = whitespaceNorm.ReplaceAllString(unitContent, " ")

	// Split by sentence boundaries: ". X" or "; X" where X is uppercase
	// Go's regexp doesn't support lookaheads, so we split manually
	sentences := splitAtSentenceBoundaries(unitContent)

	// Clean up sentences and filter out very short fragments
	var cleanSentences []string
	for _, s := range sentences {
		s = strings.TrimSpace(s)
		s = strings.TrimRight(s, ".")
		if len(s) >= 15 { // Minimum meaningful sentence length
			cleanSentences = append(cleanSentences, s)
		} else if len(s) > 3 && len(cleanSentences) > 0 {
			// Merge short fragment with previous sentence
			cleanSentences[len(cleanSentences)-1] += "; " + s
		}
	}

	// If we got fewer sentences than lectures, try splitting on commas between
	// major clauses (comma followed by keyword patterns)
	if len(cleanSentences) < nLectures {
		var expanded []string
		for _, sent := range cleanSentences {
			// Split on commas that precede topic-starting keywords
			clauses := splitAtClauseKeywords(sent)
			for _, c := range clauses {
				c = strings.TrimSpace(c)
				if len(c) >= 12 {
					expanded = append(expanded, c)
				} else if len(c) > 3 && len(expanded) > 0 {
					expanded[len(expanded)-1] += ", " + c
				}
			}
		}
		if len(expanded) > len(cleanSentences) {
			cleanSentences = expanded
		}
	}

	if len(cleanSentences) == 0 {
		return []topicChunk{{title: unitContent, subtopics: unitContent}}
	}

	// Group sentences into nLectures chunks
	chunks := make([]topicChunk, 0, nLectures)

	if len(cleanSentences) <= nLectures {
		// Fewer topics than lectures — each topic gets its own lecture,
		// pad remaining with review/GATE practice sessions
		for i, sent := range cleanSentences {
			title := sent
			if len(title) > 80 {
				// Truncate title at a natural word boundary
				cutIdx := 80
				for cutIdx > 40 && title[cutIdx] != ' ' {
					cutIdx--
				}
				title = title[:cutIdx]
			}
			// Capitalize first letter
			if len(title) > 0 {
				title = strings.ToUpper(title[:1]) + title[1:]
			}
			chunks = append(chunks, topicChunk{
				title:     title,
				subtopics: sent,
			})
			_ = i
		}
		// Fill remaining with review lectures
		for i := len(cleanSentences); i < nLectures; i++ {
			chunks = append(chunks, topicChunk{
				title:     fmt.Sprintf("Numerical Problem Solving & GATE Practice (Session %d)", i-len(cleanSentences)+1),
				subtopics: "Comprehensive review, GATE PYQ practice, numerical problem solving, concept mapping",
			})
		}
	} else {
		// More topics than lectures — merge topics into groups
		topicsPerLec := len(cleanSentences) / nLectures
		if topicsPerLec < 1 {
			topicsPerLec = 1
		}

		for i := 0; i < nLectures; i++ {
			start := i * topicsPerLec
			end := start + topicsPerLec
			if i == nLectures-1 {
				end = len(cleanSentences) // Last lecture gets all remaining
			}
			if start >= len(cleanSentences) {
				chunks = append(chunks, topicChunk{
					title:     fmt.Sprintf("Review & GATE Problem Practice (Session %d)", i+1),
					subtopics: "Comprehensive review, numerical problem solving, GATE PYQ practice",
				})
				continue
			}
			if end > len(cleanSentences) {
				end = len(cleanSentences)
			}

			batch := cleanSentences[start:end]
			title := batch[0]
			if len(title) > 80 {
				cutIdx := 80
				for cutIdx > 40 && cutIdx < len(title) && title[cutIdx] != ' ' {
					cutIdx--
				}
				title = title[:cutIdx]
			}
			if len(title) > 0 {
				title = strings.ToUpper(title[:1]) + title[1:]
			}
			subtopics := strings.Join(batch, "; ")

			chunks = append(chunks, topicChunk{
				title:     title,
				subtopics: subtopics,
			})
		}
	}

	return chunks
}

// splitAtSentenceBoundaries splits text at ". X" or "; X" where X is an uppercase letter.
// Go's re2 engine doesn't support lookaheads, so this is done manually.
func splitAtSentenceBoundaries(text string) []string {
	var result []string
	start := 0
	runes := []rune(text)
	n := len(runes)

	for i := 0; i < n-2; i++ {
		ch := runes[i]
		if ch != '.' && ch != ';' {
			continue
		}
		// Check for whitespace after the delimiter
		j := i + 1
		for j < n && (runes[j] == ' ' || runes[j] == '\t' || runes[j] == '\n') {
			j++
		}
		// Check if the next non-space character is uppercase A-Z
		if j < n && runes[j] >= 'A' && runes[j] <= 'Z' {
			segment := strings.TrimSpace(string(runes[start:i]))
			if len(segment) > 0 {
				result = append(result, segment)
			}
			start = j
			i = j - 1
		}
	}
	// Append the last segment
	last := strings.TrimSpace(string(runes[start:]))
	if len(last) > 0 {
		result = append(result, last)
	}
	return result
}

// splitAtClauseKeywords splits text at ", <Keyword>" where Keyword is a topic-starting word
func splitAtClauseKeywords(text string) []string {
	keywords := []string{
		"Introduction", "Principle", "Concept", "Effect", "Design",
		"Analysis", "Operation", "Control", "Method", "Evaluation",
		"Understanding", "Application", "Comparison", "Performance",
		"Classification", "Construction", "Testing", "Working",
		"Study", "Types", "Modeling", "Simulation",
	}

	var result []string
	remaining := text

	for {
		bestIdx := -1
		bestKw := ""
		for _, kw := range keywords {
			needle := ", " + kw
			idx := strings.Index(remaining, needle)
			if idx >= 0 && (bestIdx < 0 || idx < bestIdx) {
				bestIdx = idx
				bestKw = kw
			}
		}
		if bestIdx < 0 {
			break
		}
		before := strings.TrimSpace(remaining[:bestIdx])
		if len(before) > 0 {
			result = append(result, before)
		}
		remaining = remaining[bestIdx+2:] // skip ", "
		_ = bestKw
	}
	remaining = strings.TrimSpace(remaining)
	if len(remaining) > 0 {
		result = append(result, remaining)
	}
	if len(result) == 0 {
		return []string{text}
	}
	return result
}

// assignBloomLevel assigns a Bloom's taxonomy level based on position in the course
func (p *R24SyllabusParser) assignBloomLevel(unitIdx, lecIdx, lecsInUnit int) string {
	// Early units: more foundational; later units: more analytical/creative
	// Within each unit: progression from understand → apply → analyze
	position := float64(lecIdx) / float64(lecsInUnit)

	switch {
	case unitIdx == 0 && position < 0.3:
		return "L2_UNDERSTAND"
	case unitIdx == 0:
		return "L3_APPLY"
	case unitIdx == 1 && position < 0.5:
		return "L3_APPLY"
	case unitIdx == 1:
		return "L4_ANALYZE"
	case unitIdx == 2 && position < 0.5:
		return "L4_ANALYZE"
	case unitIdx == 2:
		return "L5_EVALUATE"
	case unitIdx >= 3 && position < 0.5:
		return "L4_ANALYZE"
	case unitIdx >= 3 && position < 0.8:
		return "L5_EVALUATE"
	default:
		return "L6_CREATE"
	}
}

// romanNumeral converts 1-10 to Roman numerals
func romanNumeral(n int) string {
	numerals := []string{"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"}
	if n >= 1 && n <= 10 {
		return numerals[n]
	}
	return fmt.Sprintf("%d", n)
}

// DecomposeToLabExperiments creates lab experiment Lectures from the R24 syllabus.
func (p *R24SyllabusParser) DecomposeToLabExperiments(courseCode string) []Lecture {
	r24 := p.GetCourse(courseCode)
	if r24 == nil {
		return nil
	}
	return p.DecomposeParsedLabExperiments(r24)
}

// DecomposeParsedLabExperiments converts a parsed lab course specification into 12 experiments
func (p *R24SyllabusParser) DecomposeParsedLabExperiments(r24 *R24ParsedCourse) []Lecture {
	if r24 == nil {
		return nil
	}

	// Split the lab syllabus by numbered items or paragraph breaks
	syllText := r24.SyllabusText
	expPattern := regexp.MustCompile(`(?m)(?:^\d+[.)]\s*|^Experiment\s+\d+\s*[:.]\s*)`)
	parts := expPattern.Split(syllText, -1)

	var experiments []Lecture
	expNum := 1
	cycleName := "Cycle I: Core Experiments"

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if len(part) < 10 {
			continue
		}

		if expNum > 6 {
			cycleName = "Cycle II: Advanced Experiments"
		}

		// First sentence or clause becomes the title
		titleEnd := strings.IndexAny(part, ".\n")
		title := part
		subtopics := part
		if titleEnd > 0 && titleEnd < 120 {
			title = strings.TrimSpace(part[:titleEnd])
			subtopics = strings.TrimSpace(part)
		}

		bloom := "L3_APPLY"
		if expNum > 8 {
			bloom = "L5_EVALUATE"
		} else if expNum > 4 {
			bloom = "L4_ANALYZE"
		}

		experiments = append(experiments, Lecture{
			Module:    cycleName,
			Num:       expNum,
			Title:     title,
			Subtopics: subtopics,
			Bloom:     bloom,
			Prereq:    fmt.Sprintf("L%d", expNum-1),
			IsLab:     true,
		})
		expNum++
	}

	// If we couldn't parse enough experiments, pad with generic ones
	for len(experiments) < 10 {
		expNum := len(experiments) + 1
		experiments = append(experiments, Lecture{
			Module:    "Cycle II: Advanced Experiments",
			Num:       expNum,
			Title:     fmt.Sprintf("Advanced Experiment %d & Comprehensive Viva Voce", expNum),
			Subtopics: "Integration testing, simulation verification, comprehensive viva",
			Bloom:     "L5_EVALUATE",
			Prereq:    fmt.Sprintf("L%d", expNum-1),
			IsLab:     true,
		})
	}

	return experiments
}
