// frontend/src/components/tutor/SocraticTurnCard.jsx
import React, { useState } from 'react';
import MathRenderer from '../common/MathRenderer.jsx';
import { 
    Sparkles, 
    Lightbulb, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    BookmarkCheck, 
    ExternalLink, 
    AlertTriangle, 
    Layers, 
    Award,
    HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * SocraticTurnCard
 * Renders a structured Socratic turn for Gemini-Grade Guided Learning:
 * 1. Concept Bubble with auto-rendered KaTeX typography
 * 2. Inquiry Callout with focused conceptual question
 * 3. Progressive 3-Tier Hint Engine Drawer (0/3 used -> Tier 1 -> Tier 2 -> Tier 3)
 * 4. Interactive Quick-Response Chips (quick_hypotheses)
 * 5. Milestone Synthesis Card ("Knowledge Cleared") when phase is SYNTHESIS
 * 6. Interactive Simulator Tool Link
 */
export default function SocraticTurnCard({ turn, onSendHypothesis }) {
    const [revealedTier, setRevealedTier] = useState(0); // 0 = none, 1 = Tier 1, 2 = Tier 2, 3 = Tier 3
    const [isHintAccordionOpen, setIsHintAccordionOpen] = useState(false);
    const [isSavedToKB, setIsSavedToKB] = useState(false);

    if (!turn) return null;

    const {
        scaffold_phase = 'GUIDED_SCAFFOLD',
        bloom_level = 'understanding',
        competence_acknowledgement = '',
        rearticulated_nudge = '',
        concept_anchor = '',
        counter_example = '',
        guided_hint = '',
        next_subtopic_title = '',
        next_subtopic_explanation = '',
        probe_question = '',
        math_payload = null,
        hints = [],
        quick_hypotheses = [],
        interactive_tool_link = null,
        synthesis_artifact = null
    } = turn;

    const handleUnlockNextHint = () => {
        if (!isHintAccordionOpen) {
            setIsHintAccordionOpen(true);
        }
        if (revealedTier < (hints.length || 3)) {
            setRevealedTier(prev => prev + 1);
        }
    };

    const handleSaveToKB = () => {
        setIsSavedToKB(true);
        try {
            const kbItem = {
                id: turn.turn_id || Date.now(),
                title: synthesis_artifact?.title || 'DTFT vs DFT Fundamentals',
                topic: synthesis_artifact?.topic || 'Digital Signal Processing',
                savedAt: new Date().toISOString()
            };
            const existing = JSON.parse(localStorage.getItem('student_saved_knowledge_base') || '[]');
            localStorage.setItem('student_saved_knowledge_base', JSON.stringify([...existing, kbItem]));
            toast.success('📥 Saved to My Knowledge Base!');
        } catch {
            toast.success('Saved to Knowledge Base!');
        }
    };

    const isMisconception = scaffold_phase === 'MISCONCEPTION_REPAIR';
    const isSynthesis = scaffold_phase === 'SYNTHESIS' || Boolean(synthesis_artifact);

    return (
        <div className="socratic-turn-card flex flex-col gap-3 my-2 text-white font-sans">
            
            {/* ─── 1. CONCEPT BUBBLE ─── */}
            <div className={`p-4 rounded-xl border backdrop-blur-md transition-all shadow-md ${
                isMisconception 
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-900/20' 
                    : isSynthesis
                        ? 'bg-emerald-950/25 border-emerald-500/40 shadow-emerald-900/20'
                        : 'bg-[#18181b]/80 border-cyan-500/30 shadow-cyan-950/20'
            }`}>
                {/* Phase & Bloom Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        {isMisconception ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <AlertTriangle size={13} className="text-amber-400" />
                                Guided Concept Nudge
                            </span>
                        ) : isSynthesis ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Award size={13} className="text-emerald-400" />
                                Knowledge Cleared
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                <Layers size={13} className="text-cyan-400" />
                                Guided Learning Step
                            </span>
                        )}

                        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                            Bloom: {bloom_level}
                        </span>
                    </div>

                    {/* Interactive Tool Link Button (if available) */}
                    {interactive_tool_link && (
                        <a
                            href={interactive_tool_link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-400 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 rounded-lg transition-all"
                            title={interactive_tool_link.title}
                        >
                            <Sparkles size={12} />
                            <span>Simulator</span>
                            <ExternalLink size={11} />
                        </a>
                    )}
                </div>

                {/* 1a. Competence Acknowledgement */}
                {competence_acknowledgement && (
                    <div className="mb-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs leading-relaxed flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-emerald-300 mr-1">Acknowledge Your Competence:</span>
                            <MathRenderer content={competence_acknowledgement} inline />
                        </div>
                    </div>
                )}

                {/* 1b. Re-articulated Student Response Nudge */}
                {rearticulated_nudge && (
                    <div className="mb-2.5 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-100 text-xs leading-relaxed flex items-start gap-2.5">
                        <Sparkles size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-cyan-300 mr-1">Reframing Your Response:</span>
                            <MathRenderer content={rearticulated_nudge} inline />
                        </div>
                    </div>
                )}

                {/* 1c. Concept Anchor Typography */}
                {concept_anchor && (
                    <div className="text-sm text-gray-200 leading-relaxed font-normal mb-2">
                        <MathRenderer content={concept_anchor} />
                    </div>
                )}

                {/* 1d. Guidance & Hint Callout */}
                {(guided_hint || counter_example) && (
                    <div className="my-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                        <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-amber-300 mr-1">Guidance & Hint:</span>
                            <MathRenderer content={guided_hint || counter_example} inline />
                        </div>
                    </div>
                )}

                {/* 1e. Clear Explanation of Next Subtopic (When Correct) */}
                {next_subtopic_explanation && (
                    <div className="my-2.5 p-3.5 rounded-lg bg-indigo-500/15 border border-indigo-400/40 text-indigo-100 text-sm leading-relaxed">
                        <div className="font-bold text-indigo-300 text-xs uppercase tracking-wider mb-1.5">
                            📘 Next Subtopic: {next_subtopic_title || 'Continuing Your Learning Path'}
                        </div>
                        <MathRenderer content={next_subtopic_explanation} />
                    </div>
                )}

                {/* Mathematical Payload with KaTeX */}
                {math_payload && (
                    <div className="my-2 p-2.5 bg-black/40 rounded-lg border border-white/10 text-center overflow-x-auto text-sm text-cyan-200 font-mono">
                        <MathRenderer content={`$$${math_payload}$$`} />
                    </div>
                )}
            </div>

            {/* ─── 2. INQUIRY CALLOUT (Probe Question) ─── */}
            {probe_question && (
                <div className="inquiry-callout p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-indigo-500/40 shadow-lg shadow-indigo-950/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 flex-shrink-0 mt-0.5">
                            <HelpCircle size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                                Guided Learning Check
                            </h4>
                            <div className="text-sm text-white font-medium leading-relaxed">
                                <MathRenderer content={probe_question} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 3. PROGRESSIVE 3-TIER HINT ENGINE DRAWER ─── */}
            {hints && hints.length > 0 && (
                <div className="hint-engine-drawer rounded-xl border border-white/10 bg-[#121214] overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => setIsHintAccordionOpen(!isHintAccordionOpen)}
                            className="flex items-center gap-2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
                        >
                            <Lightbulb size={15} />
                            <span>💡 Need a Hint? ({revealedTier}/3 used)</span>
                            {isHintAccordionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <button
                            type="button"
                            onClick={handleUnlockNextHint}
                            disabled={revealedTier >= hints.length}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                        >
                            <span>{revealedTier === 0 ? 'Unlock Hint' : revealedTier >= hints.length ? 'All Hints Used' : 'Next Clue'}</span>
                        </button>
                    </div>

                    {isHintAccordionOpen && (
                        <div className="p-3 pt-1 flex flex-col gap-2 border-t border-white/5 bg-black/20">
                            {hints.map((hint, idx) => {
                                const isUnlocked = (idx + 1) <= revealedTier;
                                return (
                                    <div 
                                        key={hint.tier || idx}
                                        className={`p-3 rounded-lg border text-xs transition-all ${
                                            isUnlocked 
                                                ? 'bg-yellow-950/20 border-yellow-500/30 text-yellow-100'
                                                : 'bg-white/[0.02] border-white/5 text-gray-500 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1 font-semibold">
                                            <span className="flex items-center gap-1.5 text-yellow-400">
                                                Tier {hint.tier || idx + 1}: {hint.label || (idx === 0 ? 'Intuition Nudge' : idx === 1 ? 'Mathematical Clue' : 'Guided Walkthrough')}
                                            </span>
                                            {isUnlocked ? (
                                                <span className="text-[10px] text-emerald-400 font-mono">Unlocked</span>
                                            ) : (
                                                <span className="text-[10px] text-gray-500 font-mono">Locked</span>
                                            )}
                                        </div>

                                        {isUnlocked ? (
                                            <div className="leading-relaxed mt-1">
                                                <MathRenderer content={hint.content} />
                                            </div>
                                        ) : (
                                            <p className="italic text-gray-500 mt-1">
                                                Click "Next Clue" above to reveal this scaffold level.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="text-[11px] text-gray-400 text-center py-1">
                                ⭐ Bonus XP is awarded if you solve the probe without using Tier 3!
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── 4. INTERACTIVE QUICK-RESPONSE CHIPS (quick_hypotheses) ─── */}
            {quick_hypotheses && quick_hypotheses.length > 0 && (
                <div className="quick-hypotheses-container flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} className="text-cyan-400" />
                        Quick Hypotheses:
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {quick_hypotheses.map((hyp) => (
                            <button
                                key={hyp.id || hyp.text}
                                type="button"
                                onClick={() => onSendHypothesis && onSendHypothesis(hyp.text)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-cyan-500/20 text-cyan-200 hover:text-white border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 text-left"
                            >
                                <MathRenderer content={hyp.text} inline />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── 5. MILESTONE SYNTHESIS CARD ("Knowledge Cleared") ─── */}
            {isSynthesis && synthesis_artifact && (
                <div className="synthesis-milestone-card mt-3 p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-[#12201b] to-[#101915] border border-emerald-500/40 shadow-xl shadow-emerald-950/30">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-emerald-300 tracking-wide">
                                {synthesis_artifact.title || 'Topic Cleared: DTFT vs DFT Fundamentals'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={handleSaveToKB}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSavedToKB
                                    ? 'bg-emerald-500 text-black border-emerald-400'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                            }`}
                        >
                            <BookmarkCheck size={13} />
                            <span>{isSavedToKB ? 'Saved to KB' : '📥 Save to My Knowledge Base'}</span>
                        </button>
                    </div>

                    {synthesis_artifact.summary && (
                        <div className="text-xs text-gray-300 leading-relaxed mb-3">
                            <MathRenderer content={synthesis_artifact.summary} />
                        </div>
                    )}

                    {/* Key Distinction Table (Dynamic Columns) */}
                    {synthesis_artifact.table && synthesis_artifact.table.length > 0 && (() => {
                        const cols = Object.keys(synthesis_artifact.table[0]);
                        return (
                            <div className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/5 text-gray-300 font-semibold">
                                            {cols.map((col, cIdx) => (
                                                <th key={col} className={`p-2 ${cIdx === 0 ? '' : cIdx === 1 ? 'text-cyan-300' : 'text-emerald-300'}`}>
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {synthesis_artifact.table.map((row, idx) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                {cols.map((col, cIdx) => (
                                                    <td key={col} className={`p-2 ${cIdx === 0 ? 'font-medium text-gray-300' : cIdx === 1 ? 'text-cyan-200' : 'text-emerald-200'}`}>
                                                        <MathRenderer content={String(row[col] ?? '')} inline />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}

                    {/* Critical Formulas */}
                    {synthesis_artifact.formulas && synthesis_artifact.formulas.length > 0 && (
                        <div className="my-2 p-2.5 bg-black/40 rounded-lg border border-emerald-500/20 flex flex-col gap-1.5 text-xs text-center font-mono">
                            {synthesis_artifact.formulas.map((f, i) => (
                                <div key={i} className="text-emerald-200 py-0.5">
                                    <MathRenderer content={`$$${f}$$`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
