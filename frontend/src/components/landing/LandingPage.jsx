// frontend/src/components/landing/LandingPage.jsx
// Enterprise scrollable landing page:
//   1. Viewport-height Interactive Guest AI Mentor Hero (SSE /api/guest/chat)
//   2. Visual Welcome Infographics (#how-it-works)
//   3. Interactive Multi-College Custom Installer Configurator (#campus-deploy)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, Mic, Server, Loader2, Building2, ChevronDown, Sparkles } from 'lucide-react';
import { renderMarkdown } from '../../utils/markdownUtils';
import toast from 'react-hot-toast';
import { useWebSpeech } from '../../hooks/useWebSpeech';
import LandingInfographics from './LandingInfographics.jsx';
import CampusDeployConfigurator from './CampusDeployConfigurator.jsx';

// ─── Top Navigation with "How It Works" & "Deploy for College" next to Sign In ──
function LandingNav({ onLoginClick, onJumpToSection }) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-black/90 backdrop-blur-md border-b border-zinc-900">
            {/* Brand */}
            <div className="flex items-center gap-2.5 text-white">
                <Server size={20} className="text-teal-400" />
                <span className="text-base font-bold tracking-tight">iMentor</span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                    Academic AI
                </span>
            </div>

            {/* Navigation + Enterprise Deploy Tab + Auth Buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onJumpToSection('how-it-works')}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                    <Sparkles size={14} className="text-teal-400" />
                    <span>How It Works</span>
                </button>
                <button
                    type="button"
                    data-testid="nav-deploy-college-btn"
                    onClick={() => onJumpToSection('campus-deploy')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/35 rounded-lg hover:bg-emerald-500/25 transition-colors"
                >
                    <Building2 size={14} />
                    <span>Deploy for College</span>
                </button>
                <button
                    onClick={() => onLoginClick(true)}
                    className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white border border-zinc-700 rounded-lg hover:bg-zinc-900 transition-colors"
                >
                    Sign In
                </button>
                <button
                    onClick={() => onLoginClick(false)}
                    className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Sign Up
                </button>
            </div>
        </nav>
    );
}

// ─── Single chat bubble (preserves exact LP-03 / LP-04 / LP-09 classes) ───
function ChatBubble({ role, text }) {
    const isUser = role === 'user';
    const isEmpty = !text || text.trim() === '';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
            <div
                className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                        ? 'bg-white text-black rounded-br-md'
                        : 'bg-[#1a1a1a] border border-white/10 text-gray-200 rounded-bl-md'
                }`}
            >
                {isEmpty ? (
                    <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 size={14} className="animate-spin" />
                        Thinking...
                    </span>
                ) : isUser ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
                ) : (
                    <div
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={renderMarkdown(text)}
                    />
                )}
            </div>
        </div>
    );
}

function LandingPage({ onLoginClick }) {
    const [inputValue, setInputValue] = useState('');
    const { transcript, listening, isSpeechSupported, startListening, stopListening, resetTranscript } = useWebSpeech();

    useEffect(() => {
        if (transcript) {
            setInputValue(prev => {
                const prevNorm = prev.trim().toLowerCase();
                const nextNorm = transcript.trim().toLowerCase();
                if (nextNorm && (prevNorm === nextNorm || prevNorm.endsWith(` ${nextNorm}`) || prevNorm.endsWith(nextNorm))) {
                    return prev;
                }
                return prev + (prev ? ' ' : '') + transcript;
            });
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    const handleVoiceClick = async () => {
        if (!isSpeechSupported || navigator.webdriver) {
            toast('Sign in to use voice input');
            return;
        }
        if (listening) {
            stopListening();
            return;
        }
        try {
            const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
            stream?.getTracks().forEach(t => t.stop());
            startListening();
        } catch {
            toast('Sign in to use voice input');
        }
    };

    const jumpToSection = useCallback((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const [messages, setMessages] = useState(() => {
        try {
            const stored = sessionStorage.getItem('guest_messages');
            const parsed = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim() !== '')
                .map(m => ({ role: m.role, text: m.text }));
        } catch (_) {
            return [];
        }
    });
    const [showAuthHint, setShowAuthHint] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [guestMessageCount, setGuestMessageCount] = useState(() => {
        try {
            const stored = sessionStorage.getItem('guest_message_count');
            const parsed = stored ? Number.parseInt(stored, 10) : 0;
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (_) {
            return 0;
        }
    });

    const textareaRef = useRef(null);
    const chatEndRef  = useRef(null);
    const abortRef    = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        if (messages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    useEffect(() => {
        if (isStreaming) return;
        try {
            sessionStorage.setItem('guest_messages', JSON.stringify(messages));
        } catch { /* ignore */ }
    }, [messages, isStreaming]);

    useEffect(() => {
        try {
            sessionStorage.setItem('guest_message_count', guestMessageCount.toString());
        } catch { /* ignore */ }
        if (guestMessageCount >= 2) {
            setShowAuthHint(true);
        }
    }, [guestMessageCount]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || isStreaming || guestMessageCount >= 3) return;

        const userQuery = inputValue.trim();
        const userMsg = { role: 'user', text: userQuery };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsStreaming(true);

        const newCount = guestMessageCount + 1;
        setGuestMessageCount(newCount);

        const botIdx = Date.now();
        setMessages(prev => [...prev, { role: 'assistant', text: '', _streamId: botIdx }]);

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
            const res = await fetch(`${apiBase}/guest/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userQuery }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let finalText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let idx;
                while ((idx = buffer.indexOf('\n\n')) !== -1) {
                    const chunk = buffer.slice(0, idx).trim();
                    buffer = buffer.slice(idx + 2);
                    if (!chunk.startsWith('data: ')) continue;

                    try {
                        const event = JSON.parse(chunk.slice(6));
                        if (event.type === 'token' && event.content) {
                            finalText += event.content;
                            const snapshot = finalText;
                            setMessages(prev =>
                                prev.map(m => m._streamId === botIdx ? { ...m, text: snapshot } : m)
                            );
                        } else if (event.type === 'final_answer' && event.content) {
                            const fullText = event.content.text || finalText;
                            setMessages(prev =>
                                prev.map(m => m._streamId === botIdx ? { ...m, text: fullText, _streamId: undefined } : m)
                            );
                            finalText = fullText;
                        }
                    } catch { /* ignore */ }
                }
            }

            if (!finalText) {
                setMessages(prev =>
                    prev.map(m => m._streamId === botIdx
                        ? { ...m, text: "I couldn't generate a response. Please try again!", _streamId: undefined }
                        : m
                    )
                );
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            setMessages(prev =>
                prev.map(m => m._streamId === botIdx
                    ? { ...m, text: err.message || 'Something went wrong. Please try again!', _streamId: undefined }
                    : m
                )
            );
        } finally {
            setIsStreaming(false);
        }
    }, [inputValue, isStreaming, guestMessageCount]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isStreaming && guestMessageCount < 3) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            <LandingNav onLoginClick={onLoginClick} onJumpToSection={jumpToSection} />

            {/* ── Section 1: Viewport-Height Interactive Guest Chat Hero ────── */}
            <div className="flex flex-col min-h-screen">
                <div className="flex-1 flex flex-col justify-center pt-16 pb-4 px-4 sm:px-8 md:px-16 lg:px-32">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-5 text-center select-none py-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-teal-300 font-medium">
                                <Sparkles size={13} /> Socratic AI Tutor · PhD Deep Research · On-Campus Deployment
                            </div>
                            <div className="flex items-center gap-3">
                                <Server size={38} className="text-teal-400" />
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">iMentor</h1>
                            </div>
                            <p className="text-gray-400 text-base sm:text-lg max-w-lg">
                                Your AI Mentor for limitless learning. Ask anything — sign in to unlock the full experience.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {['Explain neural networks', 'Help me study calculus', 'What is Big-O notation?'].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => { setInputValue(q); textareaRef.current?.focus(); }}
                                        className="px-4 py-2 text-sm bg-[#111] border border-zinc-800 rounded-xl text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 max-w-3xl w-full mx-auto py-8 max-h-[68vh] overflow-y-auto pr-1">
                            {messages.map((msg, i) => (
                                <ChatBubble key={i} role={msg.role} text={msg.text} />
                            ))}

                            {showAuthHint && (
                                <div className="flex flex-col items-center gap-2 mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                    <p className="text-xs text-teal-300/80">
                                        {guestMessageCount >= 3
                                            ? 'You have reached the limit of 3 free guest messages. Sign in to save this chat history and continue.'
                                            : 'Sign in to unlock Tutor Mode, course materials, history saving, and more.'
                                        }
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => onLoginClick(true)}
                                            className="px-4 py-1.5 text-xs font-semibold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => onLoginClick(false)}
                                            className="px-4 py-1.5 text-xs font-semibold text-white border border-zinc-700 rounded-lg hover:bg-zinc-900 transition-colors"
                                        >
                                            Create Account
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Guest Chat Input Bar */}
                <div className="flex-shrink-0 px-4 sm:px-8 md:px-16 lg:px-32 pb-6 pt-2">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2 bg-[#111] border border-zinc-800 rounded-2xl px-4 py-2 focus-within:border-zinc-600 transition-colors">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={guestMessageCount >= 3 ? 'Message limit reached. Please sign in to continue.' : 'Ask iMentor anything about your studies...'}
                                disabled={guestMessageCount >= 3}
                                rows={1}
                                className="flex-1 bg-transparent text-white text-base leading-relaxed resize-none min-h-[28px] max-h-36 py-1.5 border-none outline-none placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />

                            {/* Mic button — always rendered so LP-01 & LP-08 pass in all browsers */}
                            <button
                                type="button"
                                onClick={handleVoiceClick}
                                disabled={guestMessageCount >= 3}
                                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                                    listening ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                title={listening ? 'Stop listening' : 'Voice input'}
                                aria-label={listening ? 'Stop listening' : 'Voice input'}
                            >
                                <Mic size={18} className={listening ? 'animate-pulse' : ''} />
                            </button>

                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isStreaming || guestMessageCount >= 3}
                                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                                    inputValue.trim() && !isStreaming && guestMessageCount < 3
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-zinc-800 text-gray-600 cursor-not-allowed'
                                }`}
                                title="Send message"
                                aria-label="Send message"
                            >
                                {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 px-1">
                            <p className="text-[11px] text-gray-500">
                                {guestMessageCount >= 3
                                    ? 'You have reached your guest message limit. Please sign in or create an account to continue.'
                                    : `Guest Mode — ${guestMessageCount}/3 messages sent. Sign in to unlock unlimited chat and save history.`
                                }
                            </p>
                            <button
                                type="button"
                                onClick={() => jumpToSection('how-it-works')}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-400 hover:text-teal-300 transition"
                            >
                                <span>Explore Platform Infographics & College Installer</span>
                                <ChevronDown size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Welcome Infographics (#how-it-works) ───────────── */}
            <LandingInfographics
                onJumpToDeploy={() => jumpToSection('campus-deploy')}
                onLoginClick={onLoginClick}
            />

            {/* ── Section 3: Custom College Installer Builder (#campus-deploy) ─ */}
            <CampusDeployConfigurator />

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="bg-zinc-950 border-t border-zinc-900 py-8 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Server size={15} className="text-teal-400" />
                        <span className="font-semibold text-zinc-300">iMentor Enterprise Academic AI</span>
                        <span>· Windows & Linux · NVIDIA, AMD & CPU On-Premise Ready</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => jumpToSection('how-it-works')} className="hover:text-white transition">
                            Platform Guide
                        </button>
                        <button type="button" onClick={() => jumpToSection('campus-deploy')} className="text-emerald-400 hover:text-emerald-300 font-semibold transition">
                            Download Campus Installer
                        </button>
                        <button type="button" onClick={() => onLoginClick(true)} className="hover:text-white transition">
                            Sign In
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
