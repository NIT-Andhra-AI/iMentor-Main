// frontend/src/components/analysis/MindmapViewer.jsx
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import toast from 'react-hot-toast';
import { escapeHtml } from '../../utils/helpers.js';

const MindmapViewer = forwardRef(({ mermaidCode }, ref) => {
    const svgContainerRef = useRef(null);
    const [error, setError] = useState(null);
    const [isMermaidReady, setIsMermaidReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [uniqueId] = useState(() => `mermaid-graph-${Math.random().toString(36).substr(2, 9)}`);

    useImperativeHandle(ref, () => ({
        getSvgElement: () => {
            return svgContainerRef.current?.querySelector('svg');
        }
    }));

    useEffect(() => {
        if (typeof window.mermaid !== 'undefined') {
            setIsMermaidReady(true);
        } else {
            const intervalId = setInterval(() => {
                if (typeof window.mermaid !== 'undefined') {
                    setIsMermaidReady(true);
                    clearInterval(intervalId);
                }
            }, 100);
            return () => clearInterval(intervalId);
        }
    }, []);

    useEffect(() => {
        if (!isMermaidReady || !mermaidCode || !svgContainerRef.current) {
            if (svgContainerRef.current) svgContainerRef.current.innerHTML = '';
            setError(null);
            setIsLoading(false);
            return;
        }

        const renderMermaidDiagram = async () => {
            setIsLoading(true);
            setError(null);
            if (!svgContainerRef.current) {
                setIsLoading(false);
                return;
            }
            svgContainerRef.current.innerHTML = '<div class="flex justify-center items-center h-full w-full text-sm text-text-muted-light dark:text-text-muted-dark"><div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mr-2"></div>Rendering diagram...</div>';
            
            let codeToRender = mermaidCode.trim();
            
            // --- THIS IS THE FIX ---
            // New, more robust regex to find the diagram code.
            const fenceRegex = /```(?:mermaid)?\s*([\s\S]*?(?:graph|mindmap|flowchart|sequenceDiagram)[\s\S]*?)\s*```/i;
            const match = codeToRender.match(fenceRegex);

            if (match && match[1]) {
                codeToRender = match[1].trim();
            } else {
                codeToRender = codeToRender.trim();
            }

            // Auto-quote unquoted node labels with brackets, math, or indices e.g. C[Calculate h[k] * x[3-k]]
            const sanitizeMermaidLabels = (code) => {
                if (!code) return '';
                let clean = code
                    .replace(/\\[(]/g, '(')
                    .replace(/\\[)]/g, ')')
                    .replace(/\\[\[]/g, '[')
                    .replace(/\\[\]]/g, ']')
                    .replace(/\$\$?[^$]*\$\$?/g, ''); // strip inline $$...$$

                // Match node definitions with rectangular brackets like A[...] or A(...)
                clean = clean.replace(/([a-zA-Z0-9_-]+)\[([^"\n\r]+)\]/g, (m, id, text) => {
                    if (text.startsWith('"') && text.endsWith('"')) return m;
                    // If text contains internal brackets, parentheses, or math operations, wrap in double quotes
                    if (text.includes('[') || text.includes(']') || text.includes('*') || text.includes('/') || text.includes('=') || text.includes('+') || text.includes('-')) {
                        const safe = text.replace(/"/g, "'").trim();
                        return `${id}["${safe}"]`;
                    }
                    return m;
                });
                return clean.trim();
            };

            codeToRender = sanitizeMermaidLabels(codeToRender);
            // --- END OF FIX ---

            try {
                if (typeof window.mermaid === 'undefined') {
                    throw new Error("Mermaid library failed to load or initialize properly.");
                }

                const { svg, bindFunctions } = await window.mermaid.render(uniqueId, codeToRender);
                
                if (svgContainerRef.current) {
                    svgContainerRef.current.innerHTML = svg;
                    if (bindFunctions) {
                        bindFunctions(svgContainerRef.current);
                    }
                    const svgElement = svgContainerRef.current.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.width = '100%';
                        svgElement.style.height = 'auto'; 
                        svgElement.style.maxWidth = '100%'; 
                        svgElement.style.display = 'block';
                    }
                }
            } catch (e) {
                console.warn("Handled Mermaid syntax parsing exception:", e.message);
                // Clean up any stray error SVG Mermaid v11 may have appended directly to document.body
                try {
                    const strayErrors = document.querySelectorAll(`[id*="${uniqueId}"], [id^="d${uniqueId}"]`);
                    strayErrors.forEach(el => {
                        if (el && el.parentNode && el !== svgContainerRef.current && el.parentNode === document.body) {
                            el.parentNode.removeChild(el);
                        }
                    });
                } catch (_) {}

                const errorMsg = e.message || "Failed to render diagram";
                setError(errorMsg);
                if (svgContainerRef.current) {
                    const codeSnippet = escapeHtml(codeToRender.substring(0, 300) + (codeToRender.length > 300 ? "..." : ""));
                    svgContainerRef.current.innerHTML = `<div class="p-3 text-left text-xs bg-slate-800/80 rounded border border-slate-700 font-mono text-slate-300"><div class="text-amber-400 font-semibold mb-1">Diagram Architecture:</div><pre class="whitespace-pre-wrap">${codeSnippet}</pre></div>`;
                }
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(renderMermaidDiagram, 100); 
        return () => clearTimeout(timer);
        
    }, [mermaidCode, uniqueId, isMermaidReady]);

    if (!isMermaidReady && !error) {
      return <div className="p-4 text-center text-text-muted-light dark:text-text-muted-dark text-xs">Waiting for Mermaid.js library...</div>;
    }
    if (error && (!isLoading || (svgContainerRef.current && svgContainerRef.current.innerHTML.includes('Error rendering')))) {
        return <div ref={svgContainerRef} className="mermaid-diagram-render-area w-full h-full flex justify-center items-center bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-md p-4 rounded-xl text-slate-100">
                {/* Error message will be injected by useEffect's catch block */}
               </div>;
    }
    
    if (isLoading) { 
         return <div ref={svgContainerRef} className="mermaid-diagram-render-area w-full h-full flex justify-center items-center bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-md p-4 rounded-xl text-slate-100">
            {/* Loading message is set by renderMermaidDiagram's initial innerHTML write */}
         </div>;
    }

    if (!mermaidCode && !error && isMermaidReady) { 
        return <p className="text-xs text-center text-text-muted-light dark:text-text-muted-dark p-4">No mind map data to display.</p>;
    }
    
    return (
        <div 
            ref={svgContainerRef} 
            className="mermaid-diagram-render-area w-full h-full flex justify-center items-center bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-md p-4 rounded-xl text-slate-100"
        >

        </div>
    );
});

export default MindmapViewer;
