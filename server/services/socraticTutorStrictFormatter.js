// Strict Socratic formatter used to enforce iMentor Study Mode output constraints.
// Guarantees:
// - Clean prose + Code-as-Visual preservation (preserves ```mermaid, ```svg, ```html, ```code fences)
// - Strips internal <thinking> tags and prompt meta-headers
// - Preserves exactly one explicit check question at the end
// - Multi-section scaffolding with zero conversational discontinuity
// - Interactive response/hypothesis chip extraction for UI scaffolding (ChatGPT/Gemini parity)

function cleanResponse(text) {
  if (!text) return "";
  let s = String(text)
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
  s = s
    .replace(/^(Thinking Process|Thought Process|Internal Monologue|Thought|Analysis|Reasoning)\b[^\n]*\n*/i, '')
    .replace(/\n(Thinking Process|Thought Process|Internal Monologue|Thought|Analysis|Reasoning)\b[^\n]*\n*/i, '\n')
    .trim();
  return s;
}

/**
 * Extract interactive hypothesis/choice chips from the question or text.
 * Enables 1-click student responses in the frontend.
 * @param {string} text - Formatted Socratic tutor response text
 * @returns {Array<{label: string, value: string}>} Array of option chips
 */
function extractInteractiveChips(text) {
  if (!text || typeof text !== 'string') return [];

  // Pattern 1: Multiple choice format (A) Option1 (B) Option2 ...
  const mcRegex = /\(([A-Ea-e])\)\s*([^()\n\r]+)/g;
  let match;
  const mcMatches = [];
  while ((match = mcRegex.exec(text)) !== null) {
    mcMatches.push({
      key: match[1].toUpperCase(),
      text: match[2].trim()
    });
  }

  if (mcMatches.length >= 2 && mcMatches.length <= 5) {
    return mcMatches.map(m => ({
      label: `(${m.key}) ${m.text}`,
      value: `(${m.key}) ${m.text}`
    }));
  }

  // Pattern 2: Numbered options like "1. Option ... 2. Option ..."
  const numRegex = /(?:^|\n)\s*([1-4])[\.\)]\s+([^\n\r]+)/g;
  const numMatches = [];
  while ((match = numRegex.exec(text)) !== null) {
    numMatches.push({
      num: match[1],
      text: match[2].trim()
    });
  }

  if (numMatches.length >= 2 && numMatches.length <= 4) {
    return numMatches.map(m => ({
      label: `${m.num}. ${m.text}`,
      value: `${m.num}. ${m.text}`
    }));
  }

  // Pattern 3: Common physical/engineering comparative dilemmas
  const lower = text.toLowerCase();
  if (lower.includes('increase') && lower.includes('decrease') && (lower.includes('constant') || lower.includes('remain') || lower.includes('same'))) {
    return [
      { label: "📈 Increases", value: "It increases." },
      { label: "📉 Decreases", value: "It decreases." },
      { label: "⚖️ Remains Constant", value: "It remains constant." }
    ];
  }

  if (lower.includes('true or false') || lower.includes('is this true') || lower.includes('correct or incorrect')) {
    return [
      { label: "✅ True / Correct", value: "True." },
      { label: "❌ False / Incorrect", value: "False." }
    ];
  }

  if (lower.includes('time complexity') || lower.includes('big-o') || lower.includes('big o')) {
    return [
      { label: "O(1)", value: "O(1)" },
      { label: "O(log n)", value: "O(log n)" },
      { label: "O(n)", value: "O(n)" },
      { label: "O(n log n)", value: "O(n log n)" },
      { label: "O(n²)", value: "O(n^2)" }
    ];
  }

  return [];
}

function formatSocraticStrict(text) {
  const raw = cleanResponse(text);

  // 1. Remove thinking blocks
  let t = raw
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();

  // 2. Protect Code-as-Visual fences (Mermaid, SVG, HTML5, Waveforms, Pseudocode)
  const codeBlocks = [];
  t = t.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_VISUAL_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });

  // If text is already formatted into 3-Block Guided Learning structure, preserve headers
  if (/\b(Validate\s*&\s*Clarify|Bite-Sized\s*Step|Guided\s*Checkpoint)\b/i.test(t) || /[📌🧩🎯]/.test(t)) {
    codeBlocks.forEach((block, idx) => {
      t = t.replace(`__CODE_VISUAL_BLOCK_${idx}__`, block);
    });
    return t.trim();
  }

  // 3. Strip prompt template labels/meta-headers (case-insensitive) to prevent leaking structural markers
  t = t
    .replace(/^#{1,6}\s*(Feedback|Transition|Next Question|Question|Explanation|Socratic Question|Concept|Analogy|Step\s*\d+|Acknowledge\s*&\s*Affirm|Validate\s*&\s*Diagnose|Multimodal\s*Scaffolding|Metacognitive\s*Checkpoint)\b.*$/gim, '')
    .replace(/\*\*(Feedback|Transition|Next Question|Question|Explanation|Socratic Question|Concept|Analogy|Step\s*\d+|Acknowledge\s*&\s*Affirm|Validate\s*&\s*Diagnose|Multimodal\s*Scaffolding|Metacognitive\s*Checkpoint)\*\*:\s*/gi, '')
    .replace(/\b(Feedback|Transition|Next Question|Question|Explanation|Socratic Question|Concept|Analogy|Step\s*\d+):\s*/gi, '');

  const paras = t
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paras.length === 0) {
    return codeBlocks.join('\n\n');
  }

  // 4. Find the last paragraph that contains a question mark '?' or imperative prompt verb
  const isPromptOrQuestion = (str) => {
    if (!str || str.startsWith('__CODE_VISUAL_BLOCK_')) return false;
    if (str.includes('?')) return true;
    const trimmed = str.trim();
    if (/^(name|list|explain|describe|give|identify|state|compare|define|calculate|find|show|derive|write|determine|classify|evaluate)\b/i.test(trimmed)) return true;
    if (/\b(question|prompt|ask|consider|reflect)\b/i.test(trimmed)) return true;
    return false;
  };

  let qIndex = -1;
  for (let i = paras.length - 1; i >= 0; i--) {
    if (isPromptOrQuestion(paras[i])) {
      qIndex = i;
      break;
    }
  }

  let formattedText = '';
  if (qIndex === -1) {
    // If no explicit question or prompt was found, ensure one is present to preserve the Socratic loop
    formattedText = paras.join('\n\n').trim();
    if (!formattedText.endsWith('?') && !isPromptOrQuestion(formattedText)) {
      formattedText += '\n\nHow would you explain this in your own words, or what initial thought comes to mind?';
    }
  } else {
    const q = paras[qIndex];
    const teaching = paras.filter((_, idx) => idx !== qIndex);
    formattedText = [...teaching, q].join('\n\n').trim();
  }

  // 5. Restore Code-as-Visual fences
  codeBlocks.forEach((block, idx) => {
    formattedText = formattedText.replace(`__CODE_VISUAL_BLOCK_${idx}__`, block);
  });

  return formattedText;
}

module.exports = { cleanResponse, formatSocraticStrict, extractInteractiveChips };
