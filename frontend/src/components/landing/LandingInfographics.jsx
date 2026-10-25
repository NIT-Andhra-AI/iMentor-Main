// frontend/src/components/landing/LandingInfographics.jsx
import React from 'react';
import {
    Brain, Network, GraduationCap, Trophy, BookOpen, FileSearch,
    Sparkles, ShieldCheck, Server, Laptop, Wifi, Database,
    CheckCircle2, ArrowRight, Cpu, Layers, BarChart3
} from 'lucide-react';

const LEARNING_LOOP = [
    {
        step: '01',
        title: "Diagnostic Bloom's Calibration",
        subtitle: 'Pinpoint exact baseline',
        desc: 'Adaptive L1–L6 diagnostic quizzes map each student’s conceptual strengths and hidden misconceptions in under 3 minutes.',
        metric: 'Bloom L1 → L6',
        accent: 'from-teal-500/20 to-emerald-500/5 border-teal-500/30 text-teal-300',
        icon: BarChart3
    },
    {
        step: '02',
        title: 'Fog-of-War Skill Tree & Study Plan',
        subtitle: 'Visual prerequisite roadmap',
        desc: 'Generates an interactive syllabus graph and structured Study Plan where mastering foundational nodes unlocks advanced topics.',
        metric: 'DAG Skill Map',
        accent: 'from-sky-500/20 to-blue-500/5 border-sky-500/30 text-sky-300',
        icon: Network
    },
    {
        step: '03',
        title: 'Socratic AI Tutor & STEM Lab',
        subtitle: 'Guided reasoning, never spoon-fed',
        desc: 'Coaches students step-by-step with KaTeX math derivations, Tree-of-Thought (<think>) reasoning, code execution, and course-grounded RAG.',
        metric: 'Socratic + RAG',
        accent: 'from-violet-500/20 to-purple-500/5 border-violet-500/30 text-violet-300',
        icon: Brain
    },
    {
        step: '04',
        title: 'Boss Battles, Bounties & XP',
        subtitle: 'Verified mastery & analytics',
        desc: 'Validates retention through multi-topic Boss Battles and targeted Bounties while streaming live cohort analytics to faculty.',
        metric: 'Verified Mastery',
        accent: 'from-amber-500/20 to-orange-500/5 border-amber-500/30 text-amber-300',
        icon: Trophy
    }
];

const ROLE_PILLARS = [
    {
        badge: 'FOR STUDENTS',
        title: '24/7 Personalized Socratic Mentor',
        color: 'text-teal-400',
        borderHover: 'hover:border-teal-500/40',
        icon: GraduationCap,
        points: [
            'Course Explorer with structured lecture notes, KaTeX equations & worked examples',
            'Interactive Study Mode with hint ladders, misconception repair & instant rubric grading',
            'Tree-of-Thought (ToT) & Critical Thinking cues for complex engineering derivations',
            'Placement readiness, coding sandboxes, XP ranks & daily Bounty challenges'
        ]
    },
    {
        badge: 'FOR PHD & RESEARCH SCHOLARS',
        title: '4-Phase Deep Literature Synthesis',
        color: 'text-sky-400',
        borderHover: 'hover:border-sky-500/40',
        icon: FileSearch,
        points: [
            'Harvests 35+ peer-reviewed papers & open-access PDFs across scholarly aggregators',
            'Automated PRISMA screening & full-text methodology/dataset extraction',
            '3,500+ word citation-verified literature reviews with inline [N] references',
            'Structured 15-row Paper Comparison Matrix & PhD Research Gap identification'
        ]
    },
    {
        badge: 'FOR FACULTY & DEANS',
        title: 'Autonomous Course Swarm & Analytics',
        color: 'text-amber-400',
        borderHover: 'hover:border-amber-500/40',
        icon: Layers,
        points: [
            'Upload a syllabus CSV/PDF → multi-agent swarm builds 36 lecture modules & question banks',
            'Automatic CO-PO & Bloom’s Taxonomy alignment audit for NBA / NAAC accreditation',
            'Cohort heatmaps showing which syllabus topics students struggle with in real time',
            '100% institutional ownership of curriculum IP, question banks & student data'
        ]
    }
];

export default function LandingInfographics({ onJumpToDeploy, onLoginClick }) {
    return (
        <section id="how-it-works" className="relative bg-zinc-950 border-t border-zinc-900 py-20 px-4 sm:px-8 lg:px-16">
            <div className="max-w-6xl mx-auto space-y-20">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        <Sparkles size={13} /> Platform Architecture & Workflow
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        How iMentor Transforms Campus Learning & Research
                    </h2>
                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                        Built from the ground up for engineering colleges, universities, and research labs — combining Socratic pedagogy, textbook-grounded RAG, and sovereign on-campus AI inference.
                    </p>
                </div>

                {/* ── Infographic 1: 4-Stage Student Mastery Loop ─────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <BookOpen size={18} className="text-teal-400" />
                            1. Closed-Loop Student Mastery Pipeline
                        </h3>
                        <span className="text-xs font-mono text-zinc-400">
                            Assess → Map → Coach → Verify
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {LEARNING_LOOP.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.step}
                                    className={`relative rounded-xl p-5 bg-gradient-to-b ${item.accent} border bg-zinc-900/70 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-black/50 border border-zinc-800 text-white">
                                                STEP {item.step}
                                            </span>
                                            <div className="p-2 rounded-lg bg-black/40 border border-zinc-800">
                                                <Icon size={18} />
                                            </div>
                                        </div>
                                        <h4 className="text-base font-bold text-white mb-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs font-medium text-zinc-300 mb-2.5">
                                            {item.subtitle}
                                        </p>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold">
                                        <span>{item.metric}</span>
                                        {idx < LEARNING_LOOP.length - 1 ? (
                                            <span className="text-zinc-500 flex items-center gap-1">
                                                Next <ArrowRight size={12} />
                                            </span>
                                        ) : (
                                            <span className="text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Loop Complete
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Infographic 2: 3-Pillar Ecosystem Matrix ────────────────── */}
                <div className="space-y-6">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Layers size={18} className="text-sky-400" />
                        2. One Unified Platform for Every Campus Role
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {ROLE_PILLARS.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div
                                    key={role.badge}
                                    className={`rounded-xl bg-zinc-900/80 border border-zinc-800 ${role.borderHover} p-6 flex flex-col justify-between transition-colors`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[11px] font-mono font-bold tracking-wider ${role.color}`}>
                                                {role.badge}
                                            </span>
                                            <Icon size={20} className={role.color} />
                                        </div>
                                        <h4 className="text-lg font-bold text-white mb-4">
                                            {role.title}
                                        </h4>
                                        <ul className="space-y-2.5">
                                            {role.points.map((pt) => (
                                                <li key={pt} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                                                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Infographic 3: Campus LAN Zero-Install Visual Topology ──── */}
                <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-teal-950/30 border border-zinc-800 p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                                3. Sovereign Campus Topology
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                                Install on 1 Server PC — Serve 50 to 500+ Student Browsers Over Campus LAN
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onJumpToDeploy}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition flex items-center gap-1.5"
                            >
                                Build Custom College Installer <ArrowRight size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onLoginClick(false)}
                                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 transition"
                            >
                                Student Sign Up
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                        {/* Node 1: Student Browsers */}
                        <div className="rounded-xl bg-black/50 border border-zinc-800 p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2.5 text-sky-300 font-semibold text-sm mb-2">
                                <Laptop size={18} />
                                <span>Student & Faculty Lab PCs</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Zero software installation on lab desktops or student laptops. Opens directly in Chrome/Edge at <code className="text-zinc-200">http://imentor.campus.local</code> over campus Wi-Fi/Ethernet.
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                                <Wifi size={13} /> Works 100% on Campus Intranet
                            </div>
                        </div>

                        {/* Node 2: Single College Server */}
                        <div className="rounded-xl bg-black/50 border border-teal-500/40 p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2.5 text-teal-300 font-semibold text-sm mb-2">
                                <Cpu size={18} />
                                <span>1 Campus AI Server (Win / Linux)</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Auto-adapts to your hardware: <strong className="text-zinc-200">NVIDIA CUDA</strong> (SGLang), <strong className="text-zinc-200">AMD Radeon/Instinct</strong> (Vulkan/ROCm), <strong className="text-zinc-200">Pooled Lab PCs</strong>, or <strong className="text-zinc-200">CPU/Hybrid Cloud</strong>.
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-teal-300 font-medium">
                                <Server size={13} /> Rust Kernel + Go Gateway + Local LLM
                            </div>
                        </div>

                        {/* Node 3: Campus Data Vault */}
                        <div className="rounded-xl bg-black/50 border border-zinc-800 p-4 flex flex-col justify-between">
                            <div className="flex items-center gap-2.5 text-amber-300 font-semibold text-sm mb-2">
                                <Database size={18} />
                                <span>100% On-Campus Data Vault</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                All student records (MongoDB), textbook embeddings (Qdrant INT8), knowledge graphs (Neo4j), and faculty syllabi remain strictly inside your institution.
                            </p>
                            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-amber-300 font-medium">
                                <ShieldCheck size={13} /> Zero External Cloud Data Leakage
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
