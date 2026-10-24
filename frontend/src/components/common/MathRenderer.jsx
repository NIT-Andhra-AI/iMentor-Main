import React, { useMemo } from 'react';
import { renderMarkdown } from '../../utils/markdownUtils.js';

/**
 * Pre-processes text to ensure standard mathematical expressions are wrapped
 * in LaTeX delimiters if they do not already have them.
 */
function autoWrapMathExpressions(text) {
    if (!text || typeof text !== 'string') return '';
    // If the text already contains LaTeX math delimiters, return as-is
    if (text.includes('$') || text.includes('\\(') || text.includes('\\[') || text.includes('\\begin{')) {
        return text;
    }

    let result = text;

    // Convert common discrete-time signal notation: x[n], h[n], y[n], delta[n], u[n]
    result = result.replace(/\b([xyhwdXYHWD])\[([^\]]+)\]/g, (m, v, idx) => `$${v}[${idx}]$`);

    // Convert transform notation: X(z), H(z), Y(z), X(e^{j*omega})
    result = result.replace(/\b([XHY])\((?:e\^\{?j\*?omega\}?|e\^\{?j\*?\w+\}?)\)/g, (m, v) => `$${v}(e^{j\\omega})$`);
    result = result.replace(/\b([XHY])\(z\)/g, (m, v) => `$${v}(z)$`);

    // Convert Z-transform powers: z^-1, z^-2, z^-N
    result = result.replace(/\bz\^(-?\d+)\b/g, (m, p) => `$z^{${p}}$`);

    // Convert twiddle factors: W_N^k, W_N^(...)
    result = result.replace(/\bW_N\^([a-zA-Z0-9_+\-/]+)\b/g, (m, p) => `$W_N^{${p}}$`);

    // Convert Greek letters with subscripts/superscripts: mu_e, sigma_e^2, omega_0
    result = result.replace(/\b(mu|sigma|omega|theta|alpha|beta|gamma|lambda|delta)_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b/g, (m, g, sub, sup) => `$\\${g}_{${sub}}^{${sup}}$`);
    result = result.replace(/\b(mu|sigma|omega|theta|alpha|beta|gamma|lambda|delta)_([a-zA-Z0-9]+)\b/g, (m, g, sub) => `$\\${g}_{${sub}}$`);
    result = result.replace(/\b(sigma|omega|theta|alpha|beta|gamma|lambda|delta)\^([a-zA-Z0-9]+)\b/g, (m, g, sup) => `$\\${g}^{${sup}}$`);

    // Convert logarithm expressions: log2(N), log_2(N)
    result = result.replace(/\blog2\(([^)]+)\)/g, (m, val) => `$\\log_2(${val})$`);

    // Convert standalone ROC notations: |z| > r, |z| < r
    result = result.replace(/\|z\|\s*([><]=?)\s*([0-9.]+)/g, (m, op, val) => `$|z| ${op} ${val}$`);

    // Convert common sum/integral notation: sum_{n=...}^... or int_{-pi}^pi
    result = result.replace(/\b(?:sum|int|integral)_\{?([^\s^}]+)\}?\^\{?([^\s^}]+)\}?/g, (match, lower, upper) => {
        const cmd = match.startsWith('sum') ? '\\sum' : '\\int';
        const cleanLower = lower.replace(/infinity/g, '\\infty').replace(/pi/g, '\\pi');
        const cleanUpper = upper.replace(/infinity/g, '\\infty').replace(/pi/g, '\\pi');
        return `$${cmd}_{${cleanLower}}^{${cleanUpper}}$`;
    });

    return result;
}

/**
 * MathRenderer: Renders text containing Markdown and KaTeX math formulas ($...$ or $$...$$).
 *
 * @param {string} content - Raw markdown or LaTeX text.
 * @param {string} className - Optional container styling classes.
 * @param {boolean} inline - When true, wraps the content inline without paragraph spacing.
 */
const MathRenderer = ({ content = '', text = '', className = '', inline = false }) => {
    const rawText = content || text || '';

    const markup = useMemo(() => {
        if (!rawText) return { __html: '' };
        const processed = autoWrapMathExpressions(rawText);
        return renderMarkdown(processed);
    }, [rawText]);

    return (
        <span
            className={`math-rendered-content ${inline ? 'inline [&>p]:inline [&>p]:m-0' : 'block [&>p]:mb-2 [&>p:last-child]:mb-0'} ${className}`}
            dangerouslySetInnerHTML={markup}
        />
    );
};

export default MathRenderer;
