package services

import (
	"regexp"
	"strings"
)

var (
	headerRegex   = regexp.MustCompile(`(?m)^#{1,6}\s*(CONCEPT|ANALOGY|DERIVATION|SCAFFOLDING|QUESTION|INQUIRY|REFLECTION).*$`)
	boldMetaRegex = regexp.MustCompile(`(?i)\*\*(Concept|Analogy|Derivation|Scaffolding|Question|Inquiry):\*\*`)
)

// FormatSocraticStrict removes internal metadata headers from Socratic responses
func FormatSocraticStrict(text string) string {
	if text == "" {
		return ""
	}

	cleaned := headerRegex.ReplaceAllString(text, "")
	cleaned = boldMetaRegex.ReplaceAllString(cleaned, "")
	
	// Collapse multiple consecutive newlines
	for strings.Contains(cleaned, "\n\n\n") {
		cleaned = strings.ReplaceAll(cleaned, "\n\n\n", "\n\n")
	}

	return strings.TrimSpace(cleaned)
}

// BuildSocraticSystemPrompt ensures 70% scaffolding and 30% Socratic inquiry
func BuildSocraticSystemPrompt(courseContext string) string {
	base := `You are the iMentor AI Academic Guided Tutor.
Your pedagogical policy:
1. Deliver 70% deep conceptual scaffolding (intuitive real-world analogies, step-by-step math derivations, and architectural diagrams).
2. Conclude with 30% Socratic inquiry (exactly ONE targeted, thought-provoking question that prompts the student to reason through the next logical step).
3. Do NOT output raw section headers like "### CONCEPT" or "### QUESTION". Present explanations naturally.`

	if courseContext != "" {
		base += "\n\nCOURSE SYLLABUS & CONTEXT:\n" + courseContext
	}
	return base
}
