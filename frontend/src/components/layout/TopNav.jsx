// frontend/src/components/layout/TopNav.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../../contexts/AppStateContext';

import LLMSelectionModal from './LLMSelectionModal.jsx';
import ProfileSettingsModal from '../profile/ProfileSettingsModal.jsx';
import {
    LogOut,
    User,
    MessageSquare,
    Settings,
    Cpu,
    Zap,
    ServerCrash,
    Server,
    Wrench,
    GraduationCap,
    Brain,
    Sparkles,
    Type,
    Code2, Trophy
} from 'lucide-react';
import ToolsModal from '../tools/ToolsModal.jsx';
import LevelBadge from '../gamification/LevelBadge.jsx';
import RankBadge from '../gamification/RankBadge.jsx';
import XPProgressModal from '../gamification/XPProgressModal.jsx';
import DeveloperPortalModal from '../developer/DeveloperPortalModal.jsx';
import WhatsNewModal, { CURRENT_RELEASE_VERSION } from '../onboarding/WhatsNewModal.jsx';
import { useUserLevel } from '../../hooks/useUserLevel.jsx';
import FeedbackWidget from './FeedbackWidget.jsx';

// ─── Text Size Control (Executive Zoom Scaler) ────────────────────────────────
// Eight steps: 2 below default · default (17px = 100%) · 5 above default
// Persisted in localStorage so preference survives page refresh.

const FONT_SIZES = [
    { size: '13px', label: '76%',  title: 'Compact (76%)'     },
    { size: '15px', label: '88%',  title: 'Small (88%)'       },
    { size: '17px', label: '100%', title: 'Default (100%)'    },  // ← index 2
    { size: '19px', label: '112%', title: 'Medium Large (112%)' },
    { size: '21px', label: '124%', title: 'Large (124%)'      },
    { size: '23px', label: '135%', title: 'Extra Large (135%)'},
    { size: '25px', label: '147%', title: 'Huge (147%)'       },
    { size: '27px', label: '160%', title: 'Maximum (160%)'    },
];
const FS_STORAGE_KEY  = 'imentor-font-base';
const FS_DEFAULT_IDX  = 2;  // index of FS_DEFAULT (17px) in FONT_SIZES

function applyFontSize(size) {
    document.documentElement.style.setProperty('--font-base', size);
}

function TextSizeControl() {
    const [sizeIndex, setSizeIndex] = useState(() => {
        const saved = localStorage.getItem(FS_STORAGE_KEY);
        if (!saved || saved === '15px') return FS_DEFAULT_IDX;
        const idx = FONT_SIZES.findIndex(f => f.size === saved);
        return idx !== -1 ? idx : FS_DEFAULT_IDX;
    });

    useEffect(() => {
        applyFontSize(FONT_SIZES[sizeIndex].size);
    }, [sizeIndex]);

    const decrease = useCallback(() => {
        setSizeIndex(prev => {
            const next = Math.max(0, prev - 1);
            applyFontSize(FONT_SIZES[next].size);
            localStorage.setItem(FS_STORAGE_KEY, FONT_SIZES[next].size);
            return next;
        });
    }, []);

    const resetDefault = useCallback(() => {
        setSizeIndex(FS_DEFAULT_IDX);
        applyFontSize(FONT_SIZES[FS_DEFAULT_IDX].size);
        localStorage.setItem(FS_STORAGE_KEY, FONT_SIZES[FS_DEFAULT_IDX].size);
    }, []);

    const increase = useCallback(() => {
        setSizeIndex(prev => {
            const next = Math.min(FONT_SIZES.length - 1, prev + 1);
            applyFontSize(FONT_SIZES[next].size);
            localStorage.setItem(FS_STORAGE_KEY, FONT_SIZES[next].size);
            return next;
        });
    }, []);

    // Global keyboard shortcuts (Ctrl/Cmd + [=, -, 0])
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    increase();
                } else if (e.key === '-') {
                    e.preventDefault();
                    decrease();
                } else if (e.key === '0') {
                    e.preventDefault();
                    resetDefault();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [increase, decrease, resetDefault]);

    const currentItem = FONT_SIZES[sizeIndex];

    return (
        <div
            className="flex items-center gap-1 bg-[color:var(--vs-panel)] px-2 py-1 rounded-md border border-[color:var(--vs-border)] shadow-sm"
            role="group"
            aria-label="Text size scale control"
            title={`Current Text Scale: ${currentItem.title} (Ctrl + / - to adjust)`}
        >
            <Type
                size={13}
                className="text-[color:var(--vs-text-dim)] flex-shrink-0"
                aria-hidden="true"
            />
            {/* Decrease */}
            <button
                onClick={decrease}
                disabled={sizeIndex === 0}
                title={sizeIndex === 0 ? 'Smallest font scale reached' : `Decrease font size (${FONT_SIZES[sizeIndex - 1]?.label})`}
                aria-label="Decrease text size"
                className="w-6 h-6 flex items-center justify-center rounded text-xs font-semibold text-[color:var(--vs-text-lo)] hover:text-[color:var(--vs-text)] hover:bg-[color:var(--vs-surface-hi)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                A-
            </button>
            {/* Scale badge & reset */}
            <button
                onClick={resetDefault}
                title={`Reset to standard 100% (${FONT_SIZES[FS_DEFAULT_IDX]?.size})`}
                aria-label="Reset text size to default"
                className={`px-1.5 h-6 flex items-center justify-center rounded text-[11px] font-mono tracking-tight transition-all ${
                    sizeIndex === FS_DEFAULT_IDX
                        ? 'text-[color:var(--vs-text-lo)] font-medium'
                        : 'text-[color:var(--vs-accent)] font-bold bg-[color:var(--vs-surface-hi)] border border-[color:var(--vs-border-hi)]'
                }`}
            >
                {currentItem.label}
            </button>
            {/* Increase */}
            <button
                onClick={increase}
                disabled={sizeIndex === FONT_SIZES.length - 1}
                title={sizeIndex === FONT_SIZES.length - 1 ? 'Largest font scale reached' : `Increase font size (${FONT_SIZES[sizeIndex + 1]?.label})`}
                aria-label="Increase text size"
                className="w-6 h-6 flex items-center justify-center rounded text-sm font-semibold text-[color:var(--vs-text-lo)] hover:text-[color:var(--vs-text)] hover:bg-[color:var(--vs-surface-hi)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
                A+
            </button>
        </div>
    );
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

function TopNav({
    user: authUser,
    onLogout,
    onNewChat,
    orchestratorStatus,
    isChatProcessing,
    xpRefreshCounter = 0
}) {
    const [isLLMModalOpen, setIsLLMModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [isXPModalOpen, setIsXPModalOpen] = useState(false);
    const [isDeveloperPortalOpen, setIsDeveloperPortalOpen] = useState(false);
    const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
    const [hasUnseenWhatsNew, setHasUnseenWhatsNew] = useState(() => {
        try { return localStorage.getItem('imentor_seen_release') !== CURRENT_RELEASE_VERSION; } catch { return true; }
    });
    const [hasUnseenMindMap, setHasUnseenMindMap] = useState(() => {
        try { return localStorage.getItem('imentor_seen_xp_mindmap') !== 'true'; } catch { return true; }
    });

    const navigate = useNavigate();
    const { level, totalXP, loading: levelLoading } = useUserLevel(null, xpRefreshCounter);
    const { selectedLLM, switchLLM, tutorMode, setLearningMode } = useAppState();

    const handleEnableTutorMode = () => navigate('/tutor');

    useEffect(() => {
        const openXpHandler = () => {
            setIsXPModalOpen(true);
            setHasUnseenMindMap(false);
            try { localStorage.setItem('imentor_seen_xp_mindmap', 'true'); } catch {}
        };
        const openWhatsNewHandler = () => {
            setIsWhatsNewOpen(true);
            setHasUnseenWhatsNew(false);
            try { localStorage.setItem('imentor_seen_release', CURRENT_RELEASE_VERSION); } catch {}
        };
        window.addEventListener('imentor-open-xp-modal', openXpHandler);
        window.addEventListener('imentor-open-whats-new', openWhatsNewHandler);
        return () => {
            window.removeEventListener('imentor-open-xp-modal', openXpHandler);
            window.removeEventListener('imentor-open-whats-new', openWhatsNewHandler);
        };
    }, []);

    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);

    const StatusIndicator = useMemo(() => {
        if (!orchestratorStatus) {
            return (
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--vs-border-hi)' }}
                    title="Status unavailable"
                />
            );
        }
        if (orchestratorStatus.status === 'ok') {
            return (
                <Zap
                    size={20}
                    style={{ color: 'var(--vs-text-lo)' }}
                    title={orchestratorStatus.message}
                />
            );
        }
        if (orchestratorStatus.status === 'loading') {
            return (
                <div
                    className="animate-spin rounded-full w-5 h-5 border-t border-b"
                    style={{ borderColor: 'var(--vs-text-dim)' }}
                    title="Connecting..."
                />
            );
        }
        return (
            <ServerCrash
                size={20}
                style={{ color: 'var(--vs-text-dim)' }}
                title={orchestratorStatus.message}
            />
        );
    }, [orchestratorStatus]);

    useEffect(() => {
        const handler = (e) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Shared pill style — VS Code activity bar button aesthetic
    const pillCls = `
        inline-flex items-center gap-1.5
        px-3 py-1.5
        text-xs font-medium tracking-wide
        rounded-vs
        border
        transition-colors duration-150
        select-none
        cursor-pointer
    `;
    const pillNormal = `
        ${pillCls}
        text-[color:var(--vs-text-lo)]
        bg-[color:var(--vs-sidebar)]
        border-[color:var(--vs-border)]
        hover:bg-[color:var(--vs-surface)]
        hover:text-[color:var(--vs-text)]
        hover:border-[color:var(--vs-border-hi)]
    `;
    const pillDisabled = 'opacity-40 cursor-not-allowed';

    return (
        <>
            {/* ── Nav bar ─────────────────────────────────────────────────── */}
            <nav
                className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-5 h-11"
                style={{
                    background:   'var(--vs-sidebar)',
                    borderBottom: '1px solid var(--vs-border)',
                    boxShadow:    '0 1px 0 rgba(0,0,0,0.3)',
                }}
            >
                {/* Executive Logo & Version Switcher */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 flex-shrink-0 group"
                        style={{ textDecoration: 'none' }}
                    >
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-sm group-hover:border-sky-400/60 transition-all">
                            <Brain size={15} className="text-sky-400" />
                        </div>
                        <span
                            className="hidden sm:flex items-center gap-1.5 text-sm font-bold tracking-tight text-white"
                            style={{ letterSpacing: '-0.01em' }}
                        >
                            iMentor
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                PRO
                            </span>
                        </span>
                    </Link>
                </div>

                {/* Center actions — hidden in Tutor mode */}
                {!tutorMode && (
                    <div className="flex-1 flex justify-center px-4">
                        <div className="flex items-center gap-1.5">

                            <button
                                onClick={onNewChat}
                                disabled={isChatProcessing}
                                aria-label="New Chat"
                                title="New Chat"
                                data-testid="new-chat-button"
                                className={`${pillNormal} ${isChatProcessing ? pillDisabled : ''}`}
                            >
                                <MessageSquare size={12} />
                                <span className="hidden sm:inline">New Chat</span>
                            </button>

                            <Link
                                to="/study-plan"
                                className={`hidden md:inline-flex ${pillNormal}`}
                            >
                                <GraduationCap size={12} />
                                <span>Study Plan</span>
                            </Link>

                            <button
                                onClick={() => setIsToolsModalOpen(true)}
                                className={`hidden md:inline-flex ${pillNormal}`}
                            >
                                <Wrench size={12} />
                                <span>Tools</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsWhatsNewOpen(true);
                                    setHasUnseenWhatsNew(false);
                                    try { localStorage.setItem('imentor_seen_release', CURRENT_RELEASE_VERSION); } catch {}
                                }}
                                className={'relative inline-flex ' + pillNormal}
                                title="Discover New Features, Starter Quests & Slash Commands"
                            >
                                <Sparkles size={12} className="text-sky-400" />
                                <span className="hidden sm:inline">What&apos;s New</span>
                                {hasUnseenWhatsNew && (
                                    <span className="ml-1 px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                        NEW
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsLLMModalOpen(true)}
                                className={`hidden md:inline-flex ${pillNormal}`}
                            >
                                <Cpu size={12} />
                                <span>
                                    {selectedLLM === 'local_llm'
                                        ? 'Local LLM'
                                        : selectedLLM?.toUpperCase()}
                                </span>
                            </button>

                        </div>
                    </div>
                )}

                {/* Right controls */}
                <div className="flex items-center gap-3 flex-shrink-0">

                    {/* Role-Aware Mode Switcher for Admin & Teacher/Faculty viewing Student Mode */}
                    {(isAdminSessionActive || authUser?.isAdmin || authUser?.isFaculty) && (
                        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5">
                            {(isAdminSessionActive || authUser?.isAdmin) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        sessionStorage.setItem('activeViewMode', 'admin');
                                        sessionStorage.removeItem('viewAsStudent');
                                        navigate('/admin/dashboard');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition"
                                    title="Switch to Admin Mode"
                                >
                                    <ShieldCheck size={12} />
                                    <span className="hidden lg:inline">Admin Mode</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    sessionStorage.setItem('activeViewMode', 'faculty');
                                    sessionStorage.removeItem('viewAsStudent');
                                    navigate('/faculty/dashboard');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
                                title="Switch to Teacher / Faculty Mode (Course Generation Swarm)"
                            >
                                <GraduationCap size={12} />
                                <span className="hidden lg:inline">Teacher Mode</span>
                            </button>
                            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                Student View
                            </span>
                        </div>
                    )}

                    {/* Orchestrator status dot */}
                    {StatusIndicator}

                    {/* ── Text size control — hidden on mobile (tap targets too small) */}
                    <div className="hidden md:flex">
                        <TextSizeControl />
                    </div>

                    {/* User / profile area */}
                    <div className="relative" ref={profileDropdownRef}>
                        <div className="flex items-center gap-2">

                            {/* XP rank badge (small) */}
                            {!levelLoading && level && (
                                <div
                                    className="flex items-center gap-1.5 relative"
                                    style={{ cursor: 'pointer' }}
                                    title="Click to view your Concept Mind Map, XP Breakdown & Student Leaderboard"
                                    onClick={() => {
                                        setIsXPModalOpen(true);
                                        setHasUnseenMindMap(false);
                                        try { localStorage.setItem('imentor_seen_xp_mindmap', 'true'); } catch {}
                                    }}
                                >
                                    <RankBadge
                                        level={level}
                                        size="md"
                                        showLabel={false}
                                    />
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#6bcf7f',
                                        letterSpacing: '0.03em',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 0 8px rgba(107,207,127,0.3)',
                                    }}>
                                        {totalXP.toLocaleString()} XP
                                    </span>
                                    {hasUnseenMindMap && (
                                        <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                                            Mind Map
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Product feedback — bug / enhancement report */}
                            <FeedbackWidget />
                            <button
                                onClick={() => setIsProfileDropdownOpen(p => !p)}
                                className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150"
                                style={{
                                    background:   'var(--vs-surface)',
                                    border:       '1px solid var(--vs-border-hi)',
                                    color:        'var(--vs-text)',
                                }}
                                aria-label="Open user menu"
                                aria-expanded={isProfileDropdownOpen}
                            >
                                <User size={20} />
                                {!levelLoading && level && (
                                    <div className="absolute -bottom-1 -right-1">
                                        <LevelBadge level={level} size="xs" />
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Dropdown */}
                        {isProfileDropdownOpen && (
                            <div
                                className="absolute right-0 mt-1.5 w-52 z-50 animate-motion-scale-in-sm"
                                style={{
                                    background:   'var(--vs-panel)',
                                    border:       '1px solid var(--vs-border-hi)',
                                    borderRadius: '4px',
                                    boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
                                    overflow:     'hidden',
                                }}
                                role="menu"
                            >
                                {/* Header */}
                                <div
                                    className="px-3 py-2.5"
                                    style={{
                                        borderBottom: '1px solid var(--vs-border)',
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    <div style={{ color: 'var(--vs-text-dim)', marginBottom: '1px' }}>
                                        Signed in as
                                    </div>
                                    <div
                                        className="font-semibold truncate"
                                        style={{ color: 'var(--vs-text)' }}
                                    >
                                        {authUser?.username}
                                    </div>
                                </div>

                                {/* Menu items */}
                                {[
                                    {
                                        type: 'link',
                                        to: '/gamification/leaderboard',
                                        icon: Trophy,
                                        label: 'Student Leaderboard',
                                    },
                                    {
                                        type: 'link',
                                        to: '/learning-profile',
                                        icon: Brain,
                                        label: 'Learning Memory',
                                    },
                                    {
                                        type: 'button',
                                        onClick: () => { setIsDeveloperPortalOpen(true); setIsProfileDropdownOpen(false); },
                                        icon: Code2, Trophy,
                                        label: 'Developer API Hub',
                                    },
                                    {
                                        type: 'button',
                                        onClick: () => { setIsProfileModalOpen(true); setIsProfileDropdownOpen(false); },
                                        icon: Settings,
                                        label: 'Profile Settings',
                                    },
                                    {
                                        type: 'button',
                                        onClick: () => { onLogout(); setIsProfileDropdownOpen(false); },
                                        icon: LogOut,
                                        label: 'Logout',
                                    },
                                ].map((item, idx) => {
                                    const itemCls = `
                                        flex items-center gap-2.5 w-full
                                        px-3 py-2 text-left text-xs
                                        transition-colors duration-100 cursor-pointer
                                    `;
                                    const itemStyle = {
                                        color:      'var(--vs-text-lo)',
                                        background: 'transparent',
                                        border:     'none',
                                        textDecoration: 'none',
                                    };
                                    const Icon = item.icon;

                                    if (item.type === 'link') {
                                        return (
                                            <Link
                                                key={idx}
                                                to={item.to}
                                                className={itemCls}
                                                style={itemStyle}
                                                role="menuitem"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'var(--vs-hover)';
                                                    e.currentTarget.style.color      = 'var(--vs-text)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color      = 'var(--vs-text-lo)';
                                                }}
                                            >
                                                <Icon size={13} />
                                                {item.label}
                                            </Link>
                                        );
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            onClick={item.onClick}
                                            className={itemCls}
                                            style={itemStyle}
                                            role="menuitem"
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'var(--vs-hover)';
                                                e.currentTarget.style.color      = 'var(--vs-text)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color      = 'var(--vs-text-lo)';
                                            }}
                                        >
                                            <Icon size={13} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Modals ──────────────────────────────────────────────────── */}
            <LLMSelectionModal
                isOpen={isLLMModalOpen}
                onClose={() => setIsLLMModalOpen(false)}
                currentLLM={selectedLLM}
                onSelectLLM={(llm) => { switchLLM(llm); setIsLLMModalOpen(false); }}
            />
            <ProfileSettingsModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <ToolsModal
                isOpen={isToolsModalOpen}
                onClose={() => setIsToolsModalOpen(false)}
                onEnableTutorMode={handleEnableTutorMode}
            />
            <XPProgressModal
                isOpen={isXPModalOpen}
                onClose={() => setIsXPModalOpen(false)}
                level={level}
                refreshCounter={xpRefreshCounter}
            />
            <DeveloperPortalModal
                isOpen={isDeveloperPortalOpen}
                onClose={() => setIsDeveloperPortalOpen(false)}
            />
            <WhatsNewModal
                isOpen={isWhatsNewOpen}
                onClose={() => setIsWhatsNewOpen(false)}
                onOpenXPModal={() => {
                    setIsXPModalOpen(true);
                    setHasUnseenMindMap(false);
                    try { localStorage.setItem('imentor_seen_xp_mindmap', 'true'); } catch {}
                }}
                onEnableLearningMode={() => {
                    if (typeof setLearningMode === 'function') setLearningMode(true);
                    navigate('/');
                }}
            />
        </>
    );
}

export default TopNav;
