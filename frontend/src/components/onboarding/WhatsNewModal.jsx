// frontend/src/components/onboarding/WhatsNewModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, Brain, Trophy, GraduationCap, Target, Swords,
    Code2, BookOpen, CheckCircle2, Circle, Volume2, VolumeX, X, ArrowRight, Compass
} from 'lucide-react';

export const CURRENT_RELEASE_VERSION = 'v2.5';

const NEW_FEATURES = [
    {
        id: 'mindmap',
        badge: 'NEW · ANTI-FARM XP',
        title: "Concept Mind Map & Bloom Taxonomy Gate",
        description: 'iMentor now builds a live Mind Map of every concept you study. Repeated L1 (Remember) prompts on mastered concepts (≥85%) cap at 0 XP, while climbing to L3–L6 (Apply, Analyze, Evaluate) awards a 125% Depth Bonus!',
        icon: Brain,
        accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
        ctaLabel: 'Open My Concept Mind Map',
        action: 'open_xp_modal'
    },
    {
        id: 'leaderboard',
        badge: 'NEW · SOCIAL',
        title: 'Public Student XP Leaderboard',
        description: 'Compare your Total XP, Level Rank, and daily learning streak with fellow students in real time (test, developer, and admin accounts are automatically filtered out).',
        icon: Trophy,
        accent: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300',
        ctaLabel: 'View Leaderboard',
        path: '/gamification/leaderboard'
    },
    {
        id: 'guided_learning',
        badge: 'ENHANCED · +10 XP/TURN',
        title: 'Socratic Guided Learning Mode',
        description: 'Toggle "Learning Mode" in the chat bar for structured, syllabus-grounded explanations with KaTeX math derivations and a single focused check-for-understanding question per turn.',
        icon: GraduationCap,
        accent: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-300',
        ctaLabel: 'Enable Guided Learning Mode',
        action: 'enable_learning_mode'
    },
    {
        id: 'bounties_boss',
        badge: 'INTERACTIVE · REWARDS',
        title: 'Interactive Daily Bounties & Boss Battles',
        description: 'Attempt daily MCQ Bounties directly in an interactive modal (+Credits & +XP) or challenge a 5-question Boss Battle generated from your weakest concepts to unlock badges.',
        icon: Target,
        accent: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300',
        ctaLabel: 'Attempt Daily Bounty',
        path: '/gamification/bounties'
    }
];

const STARTER_QUESTS = [
    {
        id: 'quest_learning_mode',
        title: 'Ask a question in Guided Learning Mode',
        subtitle: 'Earns +10 XP and records your first concept on your Mind Map',
        cta: 'Try Guided Learning',
        action: 'enable_learning_mode'
    },
    {
        id: 'quest_mind_map',
        title: 'Inspect your Concept Mind Map & XP Breakdown',
        subtitle: 'Click your XP badge in the top bar to see Bloom levels (L1–L6)',
        cta: 'Open Mind Map',
        action: 'open_xp_modal'
    },
    {
        id: 'quest_bounty',
        title: 'Complete 1 Daily Bounty or Boss Battle',
        subtitle: 'Solve a targeted MCQ challenge to earn Bounty Credits & badges',
        cta: 'Open Bounties',
        path: '/gamification/bounties'
    },
    {
        id: 'quest_skill_tree',
        title: 'Generate a Course Skill Tree or Run Code',
        subtitle: 'Practice visual syllabus nodes in Control Systems, DSP, OS, ML & more',
        cta: 'Explore Skill Trees',
        path: '/gamification/skill-tree'
    }
];

const ALL_TOOLS_DIRECTORY = [
    { cmd: '/learn', name: 'Guided Learning Mode', desc: 'Step-by-step Socratic teaching (+10 XP/turn)', action: 'enable_learning_mode', icon: GraduationCap },
    { cmd: '/mindmap', name: 'Concept Mind Map & XP', desc: 'View mastery %, Bloom levels & XP history', action: 'open_xp_modal', icon: Brain },
    { cmd: '/leaderboard', name: 'Student Leaderboard', desc: 'Live student XP & streak rankings', path: '/gamification/leaderboard', icon: Trophy },
    { cmd: '/bounty', name: 'Daily Bounties', desc: 'Daily MCQ challenges for Credits & XP', path: '/gamification/bounties', icon: Target },
    { cmd: '/boss', name: 'Boss Battles', desc: '5-question arena on your weakest topic', path: '/gamification/boss-battles', icon: Swords },
    { cmd: '/skilltree', name: 'Course Skill Tree', desc: 'Visual node map across engineering courses', path: '/gamification/skill-tree', icon: Compass },
    { cmd: '/code', name: 'Code Executor', desc: 'Write, compile & test code in browser', path: '/tools/code-executor', icon: Code2 },
    { cmd: '/quiz', name: 'Quiz Generator', desc: 'Upload notes or pick a topic to test yourself', path: '/tools/quiz-generator', icon: BookOpen }
];

export default function WhatsNewModal({ isOpen, onClose, onOpenXPModal, onEnableLearningMode }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('whats_new');
    const [completedQuests, setCompletedQuests] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('imentor_starter_quests') || '[]');
        } catch {
            return [];
        }
    });
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            try {
                localStorage.setItem('imentor_seen_release', CURRENT_RELEASE_VERSION);
            } catch {}
        } else if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const markQuestDone = (questId) => {
        const updated = Array.from(new Set([...completedQuests, questId]));
        setCompletedQuests(updated);
        try {
            localStorage.setItem('imentor_starter_quests', JSON.stringify(updated));
        } catch {}
    };

    const handleTrigger = (item, questId = null) => {
        if (questId) markQuestDone(questId);
        onClose();
        if (item.path) {
            navigate(item.path);
        } else if (item.action === 'open_xp_modal' && onOpenXPModal) {
            onOpenXPModal();
        } else if (item.action === 'enable_learning_mode' && onEnableLearningMode) {
            onEnableLearningMode();
        }
    };

    const toggleVoiceGuide = () => {
        if (!('speechSynthesis' in window)) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        const script = "Welcome to iMentor version 2.5! Here is what you can do: First, toggle Guided Learning Mode in the chat bar to learn concepts step-by-step and earn 10 XP per turn. Second, click your XP badge in the top right to inspect your Concept Mind Map, Bloom's taxonomy levels, and the Student Leaderboard. Third, type a forward slash in the chat box anytime to quickly launch Daily Bounties, Boss Battles, Course Skill Trees, or the Code Executor.";
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = 1.02;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-[#141418] border border-gray-700/80 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden text-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-sky-950/60 via-indigo-950/50 to-purple-950/50 border-b border-gray-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white">Discover iMentor & What&apos;s New</h2>
                                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    {CURRENT_RELEASE_VERSION}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">
                                New features for returning students &amp; quick-start guide for new explorers
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {'speechSynthesis' in window && (
                            <button
                                type="button"
                                onClick={toggleVoiceGuide}
                                className={'px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ' + (
                                    isSpeaking
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
                                        : 'bg-gray-800/80 text-gray-200 border-gray-700 hover:bg-gray-700'
                                )}
                                title="Listen to a 15-second spoken overview of iMentor features"
                            >
                                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                <span>{isSpeaking ? 'Stop Audio' : '🔊 15s Audio Guide'}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#18181d] px-6 pt-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('whats_new')}
                        className={'px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ' + (
                            activeTab === 'whats_new'
                                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        )}
                    >
                        <Sparkles size={13} />
                        <span>🔥 What&apos;s New ({NEW_FEATURES.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('starter_guide')}
                        className={'px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ' + (
                            activeTab === 'starter_guide'
                                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        )}
                    >
                        <Compass size={13} />
                        <span>🚀 New User Quests &amp; &apos;/&apos; Commands ({completedQuests.length}/{STARTER_QUESTS.length})</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                    {activeTab === 'whats_new' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {NEW_FEATURES.map((feat) => {
                                const Icon = feat.icon;
                                return (
                                    <div
                                        key={feat.id}
                                        className={'p-4 rounded-xl border bg-gradient-to-br ' + feat.accent + ' flex flex-col justify-between gap-3'}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-black/40 border border-white/10">
                                                    {feat.badge}
                                                </span>
                                                <Icon size={18} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                                            <p className="text-xs text-gray-300 leading-relaxed">{feat.description}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleTrigger(feat)}
                                            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/15"
                                        >
                                            <span>{feat.ctaLabel}</span>
                                            <ArrowRight size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Starter Quests */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                        Interactive Starter Checklist ({completedQuests.length}/{STARTER_QUESTS.length} Completed)
                                    </h3>
                                    <span className="text-[11px] text-gray-400">Click any quest to jump right in</span>
                                </div>
                                <div className="space-y-2">
                                    {STARTER_QUESTS.map((q) => {
                                        const done = completedQuests.includes(q.id);
                                        return (
                                            <div
                                                key={q.id}
                                                className={'p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ' + (
                                                    done
                                                        ? 'bg-emerald-950/20 border-emerald-500/30 text-gray-300'
                                                        : 'bg-gray-900/90 border-gray-800 hover:border-gray-700 text-white'
                                                )}
                                            >
                                                <div className="flex items-start gap-2.5 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => markQuestDone(q.id)}
                                                        className="mt-0.5 text-emerald-400 flex-shrink-0"
                                                    >
                                                        {done ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-gray-500" />}
                                                    </button>
                                                    <div className="min-w-0">
                                                        <p className={'text-xs font-bold ' + (done ? 'line-through text-gray-400' : 'text-white')}>
                                                            {q.title}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 truncate">{q.subtitle}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTrigger(q, q.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold flex-shrink-0 transition-colors"
                                                >
                                                    {q.cta} →
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Slash Commands Reference */}
                            <div className="space-y-2.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                                    ⚡ Quick Slash Commands (Type &apos;/&apos; in the Chat Box Anytime)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {ALL_TOOLS_DIRECTORY.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.cmd}
                                                type="button"
                                                onClick={() => handleTrigger(item)}
                                                className="p-2.5 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-gray-800/80 hover:border-gray-600 text-left flex items-center gap-3 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-300 flex-shrink-0">
                                                    <Icon size={15} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                            {item.cmd}
                                                        </code>
                                                        <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-[#18181d] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                    <span>💡 Pro Tip: Type <code className="text-amber-300 font-mono font-bold">/</code> in the chat input bar to open the quick command menu anytime.</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition-colors"
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}
