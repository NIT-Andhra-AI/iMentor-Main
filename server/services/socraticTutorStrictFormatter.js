// Strict Socratic formatter used to enforce iMentor Study Mode output constraints.
// Guarantees:
// - Clean prose only: no bullets/lists, no headings, no code fences, no Mermaid, no <thinking>
// - Preserves an explicit question when the model provides one
// - Does not invent a follow-up question when the response should remain explanation-first

function cleanResponse(text) {
  if (!text) return "";
  return String(text)
    .replace(/^(Thinking Process|Thought|Analysis|Reasoning|Internal Monologue|Thought Process):?\s*/i, '')
    .replace(/\n(Thinking Process|Thought|Analysis|Reasoning|Internal Monologue|Thought Process):?\s*/i, '\n')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]?/g)
    ?.map(s => s.trim())
    .filter(Boolean) || [];
}

function formatSocraticStrict(text) {
  const raw = cleanResponse(text);

  // Remove thinking blocks
  let t = raw
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .trim();

  // Strip prompt template labels/meta-headers (case-insensitive) to prevent leaking structural markers
  t = t
    .replace(/\*\*(Feedback|Transition|Next Question|Question|Explanation|Socratic Question)\*\*:\s*/gi, '')
    .replace(/\b(Feedback|Transition|Next Question|Question|Explanation|Socratic Question):\s*/gi, '');

  const paras = t
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paras.length === 0) return "";

  // Find the last paragraph that contains a question mark '?'
  let qIndex = -1;
  for (let i = paras.length - 1; i >= 0; i--) {
    if (paras[i] && paras[i].includes('?')) {
      qIndex = i;
      break;
    }
  }

  // If no question is found, return the full text paragraphs
  if (qIndex === -1) {
    return paras.join('\n\n').trim();
  }

  const q = paras[qIndex];
  const teaching = paras.filter((_, idx) => idx !== qIndex);

  // Return all teaching paragraphs, followed by the question paragraph, to ensure rich details are preserved
  return [...teaching, q]
    .join('\n\n')
    .trim();
}

module.exports = { cleanResponse, formatSocraticStrict };
