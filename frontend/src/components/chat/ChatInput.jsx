// frontend/src/components/chat/ChatInput.jsx
import { useAppState } from '../../contexts/AppStateContext.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { Send, Mic, Plus, Brain, Zap, Globe, BookMarked, Sparkles, Square, Database, Lock, GraduationCap, Sigma } from 'lucide-react';
import { useWebSpeech } from '../../hooks/useWebSpeech';
import { useDeepResearch } from '../../contexts/DeepResearchContext';
import Button from '../core/Button.jsx';
import IconButton from '../core/IconButton.jsx';
import toast from 'react-hot-toast';
import Animate from '../core/Animate.jsx';
import KnowledgeBaseDropdown from '../documents/KnowledgeBaseDropdown.jsx';
import MathRenderer from '../common/MathRenderer.jsx';

const STEM_MATH_SYMBOLS = [
    { label: 'ω', symbol: '\\omega', title: 'Omega (Angular Frequency)' },
    { label: 'π', symbol: '\\pi', title: 'Pi' },
    { label: 'z⁻¹', symbol: 'z^{-1}', title: 'Unit Delay (z^-1)' },
    { label: 'e⁻ʲʷⁿ', symbol: 'e^{-j\\omega n}', title: 'Complex Exponential' },
    { label: 'X[k]', symbol: 'X[k]', title: 'DFT Spectrum Bin' },
    { label: 'X(eʲʷ)', symbol: 'X(e^{j\\omega})', title: 'DTFT Spectrum' },
    { label: '∑', symbol: '\\sum', title: 'Summation' },
    { label: 'Δω', symbol: '\\Delta\\omega', title: 'Bin Spacing Delta Omega' },
    { label: '2πk/N', symbol: '\\frac{2\\pi k}{N}', title: 'Discrete Frequency Point' },
    { label: '≤', symbol: '\\le', title: 'Less Than or Equal' },
    { label: 'W_N^k', symbol: 'W_N^{kn}', title: 'Twiddle Factor' },
    { label: 'x[n]', symbol: 'x[n]', title: 'Discrete-Time Signal' }
];

const SLASH_COMMANDS = [
    { cmd: '/learn', label: 'Guided Learning Mode (+10 XP)', desc: 'Toggle interactive Socratic step-by-step tutoring', action: 'toggle_learning', badge: '+10 XP' },
    { cmd: '/mindmap', label: 'Concept Mind Map & XP Gate', desc: 'Inspect your Bloom taxonomy levels (L1–L6) & mastery', action: 'open_mindmap', badge: 'NEW' },
    { cmd: '/leaderboard', label: 'Student XP Leaderboard', desc: 'See live student rankings & streaks', path: '/gamification/leaderboard', badge: 'NEW' },
    { cmd: '/bounty', label: 'Daily Bounty Challenges', desc: 'Solve daily gap-targeted MCQs for Credits & XP', path: '/gamification/bounties', badge: '+XP' },
    { cmd: '/boss', label: 'Boss Battle Arena', desc: 'Fight a 5-question battle on your weakest concept', path: '/gamification/boss-battles', badge: 'Arena' },
    { cmd: '/skilltree', label: 'Course Skill Tree', desc: 'Visual syllabus map (Control Systems, DSP, OS, ML)', path: '/gamification/skill-tree', badge: 'Map' },
    { cmd: '/code', label: 'Code Executor Sandbox', desc: 'Write, compile & test code interactively', path: '/tools/code-executor', badge: 'Tool' },
    { cmd: '/whatsnew', label: "What is New & Audio Guide", desc: 'Open the Feature Discovery Hub & 15s voice tour', action: 'open_whatsnew', badge: 'v2.5' }
];

// Rotating placeholder texts for engagement
const PLACEHOLDER_TEXTS = [
    "Ask iMentor anything about your studies...",
    "What would you like to learn today?",
    "Type your question or paste code here...",
    "Explore any topic with AI guidance...",
    "Tip: Type '/' for Guided Learning, Bounties, Mind Map & Skill Trees..."
];

function ChatInput({
    onSendMessage,
    onStop,
    isLoading,
    useWebSearch,
    setUseWebSearch,
    useAcademicSearch,
    setUseAcademicSearch,
    criticalThinkingEnabled,
    setCriticalThinkingEnabled,
    ragEnabled,
    setRagEnabled,
    initialPrompt,
    setInitialPromptForNewSession,
    openCoachModalWithData,
    setCoachModalOpen
}) {
    const [inputValue, setInputValue] = useState('');
    const { transcript, listening, isSpeechSupported, startListening, stopListening, resetTranscript } = useWebSpeech();
    const textareaRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isKbOpen, setIsKbOpen] = useState(false);
    const [isSlashOpen, setIsSlashOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    const { isResearchMode, setIsResearchMode } = useDeepResearch();
    const { selectDocumentForAnalysis, selectedDocumentForAnalysis, selectedSubject, setSelectedSubject, learningMode, setLearningMode } = useAppState();
    // True when an admin course is selected from the left panel — RAG is mandatory in this state
    const isAdminCourseActive = !!selectedSubject;

    const [isCoaching, setIsCoaching] = useState(false);
    const [skipThinking, setSkipThinking] = useState(() => {
        try {
            return localStorage.getItem('imentor_skip_thinking') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const syncThinkingPref = () => {
            try {
                setSkipThinking(localStorage.getItem('imentor_skip_thinking') === 'true');
            } catch {}
        };
        window.addEventListener('imentor-thinking-pref-changed', syncThinkingPref);
        return () => window.removeEventListener('imentor-thinking-pref-changed', syncThinkingPref);
    }, []);

    const handleToggleThinkingMode = () => {
        try {
            const nextVal = !skipThinking;
            localStorage.setItem('imentor_skip_thinking', String(nextVal));
            setSkipThinking(nextVal);
            window.dispatchEvent(new CustomEvent('imentor-thinking-pref-changed'));
            toast(
                nextVal
                    ? '⚡ Answer Now Mode enabled (skips thinking pause)'
                    : '🧠 Think & Dissect Mode enabled (Gemini-style 3-stage reasoning)',
                { duration: 2000 }
            );
        } catch {}
    };



    // Rotate placeholder text every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_TEXTS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestPromptCoaching = async () => {
        const trimmedInput = inputValue.trim();

        if (!trimmedInput) return;

        if (trimmedInput.length < 3) {
            toast("Prompt is too short for coaching. Please provide a bit more detail.", {
                icon: 'ℹ️',
                style: { background: '#000000', color: '#ffffff', border: '1px solid #ffffff' },
            });
            return;
        }

        if (isCoaching) return;

        setIsCoaching(true);

        const promise = api.analyzePrompt(trimmedInput);

        toast.promise(
            promise,
            {
                loading: 'Asking the coach for advice...',
                success: 'Suggestion received!',
                error: (err) => err.message || "The Prompt Coach is unavailable.",
            }
        );

        try {
            const response = await promise;
            openCoachModalWithData({
                original: trimmedInput,
                improved: response.improvedPrompt,
                explanation: response.explanation
            });
            setCoachModalOpen(true);
        } catch (error) {
            console.error("Error requesting prompt coaching:", error.message);
        } finally {
            setIsCoaching(false);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedText = e.clipboardData.getData('text/plain');
        const trimmedText = pastedText.trim();

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue = inputValue.substring(0, start) + trimmedText + inputValue.substring(end);
        setInputValue(newValue);

        setTimeout(() => {
            const newCursorPosition = start + trimmedText.length;
            textarea.selectionStart = newCursorPosition;
            textarea.selectionEnd = newCursorPosition;
        }, 0);
    };

    const activeSlashFilter = inputValue.startsWith('/') && !inputValue.includes(' ')
        ? inputValue.slice(1).toLowerCase()
        : null;
    const filteredSlashCommands = activeSlashFilter !== null
        ? SLASH_COMMANDS.filter(c => c.cmd.slice(1).includes(activeSlashFilter) || c.label.toLowerCase().includes(activeSlashFilter))
        : SLASH_COMMANDS;
    const showSlashMenu = isSlashOpen || (activeSlashFilter !== null && filteredSlashCommands.length > 0);

    const handleExecuteSlashCommand = (item) => {
        setIsSlashOpen(false);
        if (inputValue.startsWith('/')) setInputValue('');
        if (item.path) {
            navigate(item.path);
            return;
        }
        if (item.action === 'toggle_learning') {
            const nextState = !learningMode;
            setLearningMode(nextState);
            toast.success(nextState ? '🎓 Guided Learning Mode ON (+10 XP/turn)' : 'Guided Learning Mode OFF');
        } else if (item.action === 'open_mindmap') {
            window.dispatchEvent(new CustomEvent('imentor-open-xp-modal'));
        } else if (item.action === 'open_whatsnew') {
            window.dispatchEvent(new CustomEvent('imentor-open-whats-new'));
        }
    };

    const handleInsertSymbol = (sym) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setInputValue(prev => prev + ' $' + sym + '$ ');
            return;
        }
        const start = textarea.selectionStart ?? inputValue.length;
        const end = textarea.selectionEnd ?? inputValue.length;
        const insertText = ` $${sym}$ `;
        const updated = inputValue.substring(0, start) + insertText + inputValue.substring(end);
        setInputValue(updated);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + insertText.length, start + insertText.length);
        }, 10);
    };

    useEffect(() => {
        if (initialPrompt) {
            console.log("[ChatInput] Received initial prompt via props:", initialPrompt);
            setInputValue(initialPrompt);
            setInitialPromptForNewSession(null);
        }
    }, [initialPrompt, setInitialPromptForNewSession]);

    useEffect(() => {
        if (transcript) {
            setInputValue(prev => {
                const prevNorm = prev.trim().toLowerCase();
                const nextNorm = transcript.trim().toLowerCase();
                // Guard against duplicate emits from some browser engines.
                if (nextNorm && (prevNorm === nextNorm || prevNorm.endsWith(` ${nextNorm}`) || prevNorm.endsWith(nextNorm))) {
                    return prev;
                }
                return prev + (prev ? " " : "") + transcript;
            });
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    useEffect(() => {
        const savedWeb = localStorage.getItem('im_useWebSearch');
        const savedAcademic = localStorage.getItem('im_useAcademicSearch');
        if (savedWeb !== null) setUseWebSearch(savedWeb === 'true');
        if (savedAcademic !== null) setUseAcademicSearch(savedAcademic === 'true');
    }, [setUseWebSearch, setUseAcademicSearch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim(), {
                useWebSearch,
                useAcademicSearch,
                criticalThinkingEnabled,
                documentContextName: selectedDocumentForAnalysis || selectedSubject || null
            });
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleVoiceClick = () => {
        if (listening) stopListening();
        else startListening();
    };

    const handleWebSearchToggle = () => {
        const newWebSearchState = !useWebSearch;
        setUseWebSearch(newWebSearchState);
        localStorage.setItem('im_useWebSearch', String(newWebSearchState));
        if (newWebSearchState) {
            setUseAcademicSearch(false);
            localStorage.setItem('im_useAcademicSearch', 'false');
        }
        toast(newWebSearchState ? "Web Search enabled." : "Web Search disabled.", { icon: newWebSearchState ? "🌐" : "📄" });
        setIsMenuOpen(false);
    };

    const handleAcademicSearchToggle = () => {
        const newState = !useAcademicSearch;
        setUseAcademicSearch(newState);
        localStorage.setItem('im_useAcademicSearch', String(newState));
        if (newState) {
            setUseWebSearch(false);
            localStorage.setItem('im_useWebSearch', 'false');
        }
        toast(newState ? "Academic Search enabled." : "Academic Search disabled.", { icon: newState ? "🎓" : "📄" });
        setIsMenuOpen(false);
    };

    const handleDeepResearchToggle = () => {
        setIsResearchMode(!isResearchMode);
        setIsMenuOpen(false);
    }

    const currentPlaceholder = isResearchMode 
        ? "Ask a research question..." 
        : isLoading
        ? "iMentor is thinking..."
        : PLACEHOLDER_TEXTS[placeholderIndex];

    return (
        <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            {/* Wrapper for dropdown + input */}
            <div className="relative">
            {/* Knowledge Base Dropdown (renders above input bar) */}
            <KnowledgeBaseDropdown
                isOpen={isKbOpen}
                onClose={() => setIsKbOpen(false)}
                onSelectSource={(title) => { selectDocumentForAnalysis(title); }}
                selectedSource={selectedDocumentForAnalysis}
            />

            {isLoading && criticalThinkingEnabled && (
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-400 bg-blue-500/10 rounded-md mb-1 animate-pulse">
                    <Brain size={13} className="animate-spin" />
                    <span>iMentor is building multi-stage reasoning tree...</span>
                </div>
            )}

            {/* Live KaTeX Preview Strip */}
            {(inputValue.includes('\\') || inputValue.includes('$')) && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-[#141416]/95 border border-teal-500/30 flex items-center gap-2 overflow-x-auto shadow-inner text-xs">
                    <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/20 flex-shrink-0">
                        LaTeX Preview
                    </span>
                    <div className="text-gray-200 text-xs font-mono">
                        <MathRenderer content={inputValue} inline={true} />
                    </div>
                </div>
            )}

            {/* Slash Command Palette Popup */}
            {showSlashMenu && (
                <div className="mb-2 rounded-xl bg-[#16161c] border border-sky-500/40 shadow-2xl overflow-hidden z-30 animate-fadeIn">
                    <div className="px-3 py-1.5 bg-sky-950/50 border-b border-gray-800 flex items-center justify-between text-[11px] text-sky-300">
                        <span className="font-bold flex items-center gap-1.5">
                            <Sparkles size={12} /> Quick Commands &amp; Feature Launcher
                        </span>
                        <button
                            type="button"
                            onClick={() => { setIsSlashOpen(false); if (inputValue.startsWith('/')) setInputValue(''); }}
                            className="text-gray-400 hover:text-white text-xs font-bold px-1"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-800/60 p-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {filteredSlashCommands.map((item) => (
                            <button
                                key={item.cmd}
                                type="button"
                                onClick={() => handleExecuteSlashCommand(item)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-500/15 transition-colors flex items-center justify-between gap-2 group"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                            {item.cmd}
                                        </code>
                                        <span className="text-xs font-semibold text-white group-hover:text-sky-200 truncate">
                                            {item.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.desc}</p>
                                </div>
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex-shrink-0">
                                    {item.badge}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* STEM Math Helper Strip + Quick '/' Feature Launcher */}
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto py-1 px-1 custom-scrollbar">
                <button
                    type="button"
                    onClick={() => setIsSlashOpen(prev => !prev)}
                    title="Open Quick Commands & Feature Menu (or type '/')"
                    className="px-2.5 py-0.5 text-xs rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold flex items-center gap-1 flex-shrink-0 transition-all cursor-pointer mr-1"
                >
                    <Sparkles size={11} />
                    <span>/Commands</span>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0 text-[11px] text-gray-400 mr-1">
                    <Sigma size={13} className="text-teal-400" />
                    <span className="font-semibold text-gray-300">Math:</span>
                </div>
                {STEM_MATH_SYMBOLS.map((item) => (
                    <button
                        key={item.symbol}
                        type="button"
                        onClick={() => handleInsertSymbol(item.symbol)}
                        title={item.title}
                        className="px-2 py-0.5 text-xs rounded bg-[#1e1e24] hover:bg-teal-900/40 hover:text-teal-300 hover:border-teal-500/40 text-gray-300 border border-gray-700/60 transition-all cursor-pointer font-mono flex-shrink-0 shadow-sm active:scale-95"
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* VS Code terminal-style input container */}
            <Animate
                data-tutor-tour="chat-input"
                className="relative flex items-end gap-2"
                style={{
                    background:   'var(--vs-panel)',
                    border:       isFocused
                        ? '1px solid var(--vs-border-hi)'
                        : '1px solid var(--vs-border)',
                    borderRadius: '6px',
                    transition:   'border-color 0.15s, box-shadow 0.15s',
                    padding:      '8px 10px',
                    boxShadow:    isFocused
                        ? '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)'
                        : '0 2px 8px rgba(0,0,0,0.3)',
                }}
                animation="fade-in"
            >
                {/* Plus Menu Button */}
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        disabled={isLoading}
                        title="More options"
                        aria-label="More options"
                        style={{
                            padding:      '5px',
                            borderRadius: '3px',
                            background:   isMenuOpen ? 'var(--vs-active)' : 'transparent',
                            border:       '1px solid transparent',
                            color:        isMenuOpen ? 'var(--vs-text)' : 'var(--vs-text-dim)',
                            cursor:       'pointer',
                            transition:   'color 0.15s, background 0.15s',
                            flexShrink:   0,
                            opacity:      isLoading ? 0.4 : 1,
                        }}
                        onMouseEnter={e => { if (!isMenuOpen) e.currentTarget.style.color = 'var(--vs-text-lo)'; }}
                        onMouseLeave={e => { if (!isMenuOpen) e.currentTarget.style.color = 'var(--vs-text-dim)'; }}
                    >
                        <Plus
                            size={16}
                            style={{ transition: 'transform 0.2s', transform: isMenuOpen ? 'rotate(45deg)' : 'none' }}
                        />
                    </button>

                    {isMenuOpen && (
                            <Animate
                                animation="scale-in"
                                className="absolute bottom-full left-0 mb-2 z-20"
                                style={{
                                    width:        '220px',
                                    background:   'var(--vs-panel)',
                                    border:       '1px solid var(--vs-border-hi)',
                                    borderRadius: '4px',
                                    boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
                                    padding:      '4px',
                                }}
                            >
                                {[
                                    { onClick: handleWebSearchToggle,      Icon: Globe,     active: useWebSearch,      label: useWebSearch      ? 'Web Search ON'      : 'Enable Web Search'     },
                                    { onClick: handleAcademicSearchToggle, Icon: BookMarked, active: useAcademicSearch, label: useAcademicSearch ? 'Academic Search ON'  : 'Enable Academic Search' },
                                    { onClick: () => { setLearningMode(!learningMode); setIsMenuOpen(false); }, Icon: GraduationCap, active: learningMode, label: learningMode ? 'Guided Learning Mode ON' : 'Enable Guided Learning Mode' },
                                ].map(({ onClick, Icon, active, label }) => (
                                    <button
                                        key={label}
                                        onClick={onClick}
                                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs"
                                        style={{
                                            borderRadius: '3px',
                                            background:   active ? 'var(--vs-active)' : 'transparent',
                                            color:        active ? 'var(--vs-text)'   : 'var(--vs-text-lo)',
                                            border:       'none',
                                            cursor:       'pointer',
                                            fontWeight:   active ? 500 : 400,
                                            transition:   'background 0.1s, color 0.1s',
                                        }}
                                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--vs-hover)'; e.currentTarget.style.color = 'var(--vs-text)'; }}}
                                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent';     e.currentTarget.style.color = 'var(--vs-text-lo)'; }}}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}

                                {/* Mobile-only options */}
                                <div
                                    className="sm:hidden mt-1 pt-1"
                                    style={{ borderTop: '1px solid var(--vs-border)' }}
                                >
                                    <button
                                        onClick={() => { handleVoiceClick(); setIsMenuOpen(false); }}
                                        disabled={!isSpeechSupported}
                                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs"
                                        style={{ borderRadius:'3px', color: listening ? '#f87171' : 'var(--vs-text-lo)', background: listening ? 'var(--vs-active)' : 'transparent', border:'none', cursor: !isSpeechSupported ? 'not-allowed' : 'pointer' }}
                                    >
                                        <Mic size={13} className={listening ? 'animate-pulse' : ''} />
                                        {listening ? 'Stop Listening' : 'Voice Input'}
                                    </button>
                                    {[
                                        { onClick: () => { handleRequestPromptCoaching(); setIsMenuOpen(false); }, Icon: Sparkles, label: 'Prompt Coach', active: false },
                                        { onClick: () => { setCriticalThinkingEnabled(!criticalThinkingEnabled); setIsMenuOpen(false); }, Icon: Brain, label: `Tree of Thought ${criticalThinkingEnabled ? 'ON' : 'OFF'}`, active: criticalThinkingEnabled },
                                        { onClick: () => { setIsKbOpen(prev => !prev); setIsMenuOpen(false); }, Icon: Database, label: selectedDocumentForAnalysis ? `RAG: ${selectedDocumentForAnalysis}` : 'RAG / Knowledge Base', active: !!(isKbOpen || selectedDocumentForAnalysis) },
                                        { onClick: () => { setLearningMode(!learningMode); setIsMenuOpen(false); }, Icon: GraduationCap, label: `Learning Mode ${learningMode ? 'ON' : 'OFF'}`, active: learningMode },
                                    ].map(({ onClick, Icon, label, active }) => (
                                        <button
                                            key={label}
                                            onClick={onClick}
                                            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs"
                                            style={{
                                                borderRadius: '3px',
                                                background:   active ? 'var(--vs-active)' : 'transparent',
                                                color:        active ? 'var(--vs-text)'   : 'var(--vs-text-lo)',
                                                border:       'none',
                                                cursor:       'pointer',
                                                fontWeight:   active ? 500 : 400,
                                                transition:   'background 0.1s, color 0.1s',
                                            }}
                                        >
                                            <Icon size={13} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </Animate>
                    )}
                </div>

                {/* Premium Textarea */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={currentPlaceholder}
                        className={`
                            w-full
                            bg-transparent
                            text-white text-base leading-relaxed
                            placeholder:text-gray-500 placeholder:transition-opacity
                            resize-none
                            min-h-[28px] max-h-40
                            py-2 px-1
                            border-none outline-none
                            custom-scrollbar
                            transition-all duration-200
                            ${isLoading ? 'opacity-60' : ''}
                        `}
                        style={{
                            caretColor:  '#ffffff',
                            color:       '#ffffff',
                            fontSize:    '0.875rem',
                            lineHeight:  '1.6',
                            opacity:     isLoading ? 0.5 : 1,
                        }}
                        rows="1"
                        disabled={isLoading}
                        aria-label="Message input"
                    />
                </div>

                {/* Right-side Action Buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">

                    {/* Helper: uniform icon button */}
                    {/* (inline — keeps this component self-contained) */}

                    {/* Voice - Desktop (Web Speech API, instant) */}
                    {isSpeechSupported && (
                    <button
                        onClick={handleVoiceClick}
                        disabled={isLoading}
                        className="hidden sm:flex items-center justify-center"
                        title={listening ? 'Stop listening' : 'Voice input'}
                        aria-label={listening ? 'Stop listening' : 'Voice input'}
                        style={{
                            padding: '5px', borderRadius: '3px',
                            background: listening ? 'var(--vs-active)' : 'transparent',
                            border: listening ? '1px solid var(--vs-accent)' : '1px solid transparent',
                            color: listening ? '#f87171' : 'var(--vs-text-dim)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.4 : 1,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                    >
                        <Mic size={15} className={listening ? 'animate-pulse' : ''} />
                    </button>
                    )}

                    {/* Prompt Coach - Desktop */}
                    <button
                        onClick={handleRequestPromptCoaching}
                        disabled={isLoading || isCoaching || !inputValue.trim()}
                        className="hidden sm:flex items-center justify-center"
                        title="Prompt Coach"
                        aria-label="Prompt Coach"
                        style={{
                            padding: '5px', borderRadius: '3px',
                            background: 'transparent', border: '1px solid transparent',
                            color: inputValue.trim() ? 'var(--vs-text-dim)' : 'var(--vs-text-dim)',
                            cursor: (!inputValue.trim() || isLoading || isCoaching) ? 'not-allowed' : 'pointer',
                            opacity: (!inputValue.trim() || isLoading || isCoaching) ? 0.35 : 1,
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { if (inputValue.trim() && !isLoading) e.currentTarget.style.color = 'var(--vs-text-lo)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--vs-text-dim)'; }}
                    >
                        {isCoaching
                            ? <div className="w-3.5 h-3.5 border border-[color:var(--vs-text-dim)] border-t-transparent rounded-full animate-spin" />
                            : <Sparkles size={15} />
                        }
                    </button>

                    {/* Divider */}
                    <div style={{ width:'1px', height:'16px', background:'var(--vs-border)', margin:'0 3px' }} />

                    {/* ToT - Desktop */}
                    <button
                        onClick={() => setCriticalThinkingEnabled(!criticalThinkingEnabled)}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-1"
                        title={criticalThinkingEnabled ? 'Tree of Thought ON' : 'Enable Tree of Thought'}
                        aria-label="Toggle Tree of Thought"
                        aria-pressed={criticalThinkingEnabled}
                        style={{
                            padding: '4px 6px', borderRadius: '3px',
                            background: criticalThinkingEnabled ? 'var(--vs-active)' : 'transparent',
                            border: criticalThinkingEnabled ? '1px solid var(--vs-border-hi)' : '1px solid transparent',
                            color: criticalThinkingEnabled ? 'var(--vs-text)' : 'var(--vs-text-dim)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.4 : 1,
                            fontSize: '0.6875rem', fontWeight: criticalThinkingEnabled ? 600 : 400,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { if (!criticalThinkingEnabled && !isLoading) e.currentTarget.style.color = 'var(--vs-text-lo)'; }}
                        onMouseLeave={e => { if (!criticalThinkingEnabled) e.currentTarget.style.color = 'var(--vs-text-dim)'; }}
                    >
                        <Brain size={13} />
                        <span>ToT</span>
                    </button>

                    {/* RAG / Knowledge Base - Desktop */}
                    <button
                        onClick={() => {
                            if (selectedSubject || selectedDocumentForAnalysis) {
                                setRagEnabled(!ragEnabled);
                            } else {
                                setIsKbOpen(prev => !prev);
                            }
                        }}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-1"
                        title={
                            selectedSubject
                                ? (ragEnabled ? `RAG active: grounded in "${selectedSubject}". Click to disable.` : `RAG disabled. Click to ground chat in "${selectedSubject}".`)
                                : selectedDocumentForAnalysis
                                    ? (ragEnabled ? `RAG active: "${selectedDocumentForAnalysis}". Click to disable.` : `RAG disabled. Click to ground chat in "${selectedDocumentForAnalysis}".`)
                                    : 'Enable RAG / Knowledge Base'
                        }
                        aria-label="Toggle RAG / Knowledge Base"
                        aria-pressed={!!(ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject))}
                        style={{
                            padding: '4px 6px', borderRadius: '3px',
                            background: (ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject)) ? 'var(--vs-active)' : 'transparent',
                            border: (ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject)) ? '1px solid var(--vs-border-hi)' : '1px solid transparent',
                            color: (ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject)) ? 'var(--vs-text)' : 'var(--vs-text-dim)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.4 : 1,
                            fontSize: '0.6875rem', fontWeight: (ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject)) ? 600 : 400,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { if (!(ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject)) && !isLoading) e.currentTarget.style.color = 'var(--vs-text-lo)'; }}
                        onMouseLeave={e => { if (!(ragEnabled && (isKbOpen || selectedDocumentForAnalysis || selectedSubject))) e.currentTarget.style.color = 'var(--vs-text-dim)'; }}
                    >
                        <Database size={13} />
                        <span>RAG</span>
                    </button>

                    {/* Learning Mode - Desktop */}
                    <button
                        onClick={() => setLearningMode(!learningMode)}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-1"
                        title={learningMode ? 'Guided Learning Mode ON' : 'Enable Guided Learning Mode'}
                        aria-label="Toggle Learning Mode"
                        aria-pressed={learningMode}
                        style={{
                            padding: '4px 6px', borderRadius: '3px',
                            background: learningMode ? 'var(--vs-active)' : 'transparent',
                            border: learningMode ? '1px solid var(--vs-border-hi)' : '1px solid transparent',
                            color: learningMode ? 'var(--vs-text)' : 'var(--vs-text-dim)',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.4 : 1,
                            fontSize: '0.6875rem', fontWeight: learningMode ? 600 : 400,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { if (!learningMode && !isLoading) e.currentTarget.style.color = 'var(--vs-text-lo)'; }}
                        onMouseLeave={e => { if (!learningMode) e.currentTarget.style.color = 'var(--vs-text-dim)'; }}
                    >
                        <GraduationCap size={13} />
                        <span>Learn</span>
                    </button>

                    {/* Gemini-Style Think & Dissect / Answer Now Toggle - Desktop */}
                    <button
                        type="button"
                        onClick={handleToggleThinkingMode}
                        className="hidden sm:flex items-center gap-1"
                        title={skipThinking ? 'Answer Now Mode ON (click to enable Think & Dissect)' : 'Think & Dissect Mode ON (click for instant Answer Now)'}
                        aria-label="Toggle Think & Dissect or Answer Now"
                        aria-pressed={!skipThinking}
                        style={{
                            padding: '4px 6px', borderRadius: '3px',
                            background: !skipThinking ? 'rgba(20, 184, 166, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                            border: !skipThinking ? '1px solid rgba(20, 184, 166, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                            color: !skipThinking ? '#5eead4' : '#fcd34d',
                            cursor: 'pointer',
                            fontSize: '0.6875rem', fontWeight: 600,
                            transition: 'color 0.15s, background 0.15s',
                        }}
                    >
                        {skipThinking ? <Zap size={12} /> : <Brain size={12} />}
                        <span>{skipThinking ? 'Answer Now' : 'Think'}</span>
                    </button>

                    {/* Divider */}
                    <div style={{ width:'1px', height:'16px', background:'var(--vs-border)', margin:'0 3px' }} />

                    {/* Send / Stop */}
                    {isLoading ? (
                        <button
                            key="stop-button"
                            type="button"
                            onClick={onStop}
                            className="flex items-center justify-center"
                            title="Stop generating"
                            style={{
                                padding: '6px', borderRadius: '3px',
                                background: 'var(--vs-surface)',
                                border: '1px solid var(--vs-border-hi)',
                                color: 'var(--vs-text-lo)',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ width:'10px', height:'10px', background:'var(--vs-text-lo)', borderRadius:'1px' }} />
                        </button>
                    ) : (
                        <button
                            key="send-button"
                            type="submit"
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            title="Send message (Enter)"
                            style={{
                                padding: '6px', borderRadius: '3px',
                                background: inputValue.trim() ? 'var(--vs-text)' : 'var(--vs-surface)',
                                border: '1px solid transparent',
                                color: inputValue.trim() ? 'var(--vs-text-inv)' : 'var(--vs-text-dim)',
                                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                        >
                            <Send size={15} />
                        </button>
                    )}
                </div>
            </Animate >
            </div>{/* end relative wrapper */}

            {/* Status Indicators — flat VS Code statusbar style */}
            {(useWebSearch || useAcademicSearch || criticalThinkingEnabled || selectedDocumentForAnalysis || selectedSubject || learningMode) && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5 px-1">
                    {[
                        useWebSearch        && { key: 'ws',  Icon: Globe,      label: 'Web Search'        },
                        useAcademicSearch   && { key: 'as',  Icon: BookMarked, label: 'Academic Search'   },
                        criticalThinkingEnabled && { key: 'tot', Icon: Brain,  label: 'Tree of Thought'   },
                        learningMode        && { key: 'learn', Icon: GraduationCap, label: 'Learning Mode' },
                    ].filter(Boolean).map(({ key, Icon, label }) => (
                        <Animate key={key} animation="slide-up-sm">
                            <span
                                className="inline-flex items-center gap-1 text-2xs"
                                style={{
                                    padding:      '2px 6px',
                                    borderRadius: '2px',
                                    background:   'var(--vs-surface)',
                                    border:       '1px solid var(--vs-border)',
                                    color:        'var(--vs-text-lo)',
                                }}
                            >
                                <Icon size={10} />
                                {label}
                            </span>
                        </Animate>
                    ))}
                    {ragEnabled && (selectedDocumentForAnalysis || selectedSubject) && (
                        <Animate key="rag" animation="slide-up-sm">
                            {isAdminCourseActive ? (
                                // Admin course — RAG can be disabled with click
                                <button
                                    onClick={() => setRagEnabled(false)}
                                    title={`RAG active: grounded in "${selectedSubject}". Click to disable.`}
                                    className="inline-flex items-center gap-1 text-2xs cursor-pointer"
                                    style={{
                                        padding:      '2px 6px',
                                        borderRadius: '2px',
                                        background:   'var(--vs-surface)',
                                        border:       '1px solid var(--vs-border-hi)',
                                        color:        'var(--vs-text)',
                                    }}
                                >
                                    <Database size={10} />
                                    <span style={{ fontWeight: 600, marginRight: '2px' }}>RAG:</span>
                                    <span className="max-w-[100px] truncate">{selectedSubject}</span>
                                    <span style={{ color: 'var(--vs-text-dim)', marginLeft: '1px' }}>×</span>
                                </button>
                            ) : (
                                // User-uploaded doc — allow deselect with ×
                                <button
                                    onClick={() => selectDocumentForAnalysis(null)}
                                    title="RAG active — click to deselect"
                                    className="inline-flex items-center gap-1 text-2xs cursor-pointer"
                                    style={{
                                        padding:      '2px 6px',
                                        borderRadius: '2px',
                                        background:   'var(--vs-surface)',
                                        border:       '1px solid var(--vs-border-hi)',
                                        color:        'var(--vs-text)',
                                    }}
                                >
                                    <Database size={10} />
                                    <span style={{ fontWeight: 600, marginRight: '2px' }}>RAG:</span>
                                    <span className="max-w-[100px] truncate">{selectedDocumentForAnalysis}</span>
                                    <span style={{ color: 'var(--vs-text-dim)', marginLeft: '1px' }}>×</span>
                                </button>
                            )}
                        </Animate>
                    )}
                </div>
            )}
        </div >
    );
}

export default ChatInput;
