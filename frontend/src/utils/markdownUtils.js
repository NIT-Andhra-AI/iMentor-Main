import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Configure marked with standard GitHub Flavored Markdown settings
const renderer = new marked.Renderer();
marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

// KaTeX math tags and attributes that DOMPurify must not strip
const KATEX_TAGS = [
  'math', 'annotation', 'semantics',
  'mrow', 'mi', 'mn', 'mo', 'ms', 'mtext', 'mspace',
  'msup', 'msub', 'msubsup', 'munder', 'mover', 'munderover',
  'mfrac', 'msqrt', 'mroot', 'mfenced', 'mtable', 'mtr', 'mtd', 'mlabeledtr',
  'svg', 'path', 'use', 'defs', 'g', 'rect', 'line', 'span', 'div', 'nobr',
];

const KATEX_ATTRS = [
  'allow', 'allowfullscreen', 'frameborder', 'scrolling',
  'class', 'style', 'encoding', 'xmlns', 'viewBox', 'preserveAspectRatio',
  'd', 'fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'href', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'transform', 'data-katex-code',
  'mathvariant', 'mathsize', 'mathcolor', 'columnalign', 'rowalign', 'aria-hidden',
];

const KATEX_CONFIG = {
  throwOnError: false,
  output: 'htmlAndMathml',
  macros: {
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
    '\\CC': '\\mathbb{C}',
  },
};

/**
 * Render a LaTeX expression to HTML using KaTeX.
 * Falls back gracefully to escaped text if KaTeX fails.
 */
function renderKatex(expr, displayMode) {
  if (!expr || !expr.trim()) return '';
  const cleanExpr = expr.trim();
  try {
    return katex.renderToString(cleanExpr, {
      ...KATEX_CONFIG,
      displayMode,
    });
  } catch (err) {
    return displayMode
      ? `<div class="katex-display-fallback">$$${cleanExpr}$$</div>`
      : `<span class="katex-inline-fallback">$${cleanExpr}$</span>`;
  }
}

/**
 * Robust Markdown & LaTeX Math Renderer
 * 1. Protects code blocks from math parsing.
 * 2. Extracts LaTeX math into discrete placeholders (prevents marked from corrupting &, \\, _, ^, <br>).
 * 3. Renders Markdown structure.
 * 4. Injects pre-rendered KaTeX HTML.
 * 5. Sanitizes with DOMPurify while preserving KaTeX DOM nodes and SVG symbols.
 */
export const renderMarkdown = (markdownText) => {
  if (!markdownText) return { __html: '' };

  let text = String(markdownText);
  const mathPlaceholders = [];

  // Step 1: Protect code blocks (```...```) and inline code (`...`)
  const codePlaceholders = [];
  text = text.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const placeholder = `%%CODE_BLOCK_${codePlaceholders.length}%%`;
    codePlaceholders.push(match);
    return placeholder;
  });

  // Step 2: Extract Display Math: \[...\] or $$...$$
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, expr) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ expr, display: true });
    return `\n\n${placeholder}\n\n`;
  });

  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ expr, display: true });
    return `\n\n${placeholder}\n\n`;
  });

  // Step 3: Extract raw LaTeX environments (matrix, bmatrix, aligned, cases, etc.) if not enclosed in $$
  text = text.replace(/\\begin\{(matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|align\*?|equation\*?|gather\*?|split|cases)\}([\s\S]+?)\\end\{\1\}/g, (fullMatch) => {
    const placeholder = `%%MATH_BLOCK_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ expr: fullMatch, display: true });
    return `\n\n${placeholder}\n\n`;
  });

  // Step 4: Extract Inline Math: \(...\) or $...$
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, expr) => {
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ expr, display: false });
    return placeholder;
  });

  // Inline $...$ (ensure not matching empty $$, prices like $50, or escaped \$)
  text = text.replace(/(^|[^$\\])\$(?!\$)((?:[^$\n\\]|\\[\s\S])+?)\$(?!\$)/g, (full, prefix, expr) => {
    if (/^\s*\d+(\.\d+)?\s*$/.test(expr)) {
      return full; // Currency format ($50)
    }
    const placeholder = `%%MATH_INLINE_${mathPlaceholders.length}%%`;
    mathPlaceholders.push({ expr, display: false });
    return `${prefix}${placeholder}`;
  });

  // Step 5: Restore Code Blocks
  text = text.replace(/%%CODE_BLOCK_(\d+)%%/g, (_, idx) => codePlaceholders[Number(idx)]);

  // Step 6: Render Markdown with marked
  let html = marked(text);

  // Step 7: Remove wrapping <p> around block math placeholders
  html = html.replace(/<p>\s*(%%MATH_BLOCK_\d+%%)\s*<\/p>/g, '$1');

  // Step 8: Replace math placeholders with KaTeX rendered HTML
  html = html.replace(/%%MATH_(?:BLOCK|INLINE)_(\d+)%%/g, (_, idx) => {
    const item = mathPlaceholders[Number(idx)];
    if (!item) return '';
    return renderKatex(item.expr, item.display);
  });

  // Step 9: Sanitize with DOMPurify while keeping KaTeX tags and attributes intact
  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_TAGS: KATEX_TAGS,
    ADD_ATTR: KATEX_ATTRS,
    FORCE_BODY: false,
  });

  return { __html: sanitized };
};

/**
 * Post-processor for HTML strings that may contain LaTeX math delimiters.
 */
export const renderMathInHtml = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  return renderMarkdown(htmlString).__html;
};

export default renderMarkdown;
