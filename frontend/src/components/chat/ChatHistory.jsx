// frontend/src/components/chat/ChatHistory.jsx

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../contexts/AppStateContext.jsx';
import MessageBubble from './MessageBubble';
import Animate from '../core/Animate.jsx';
import { ArrowDownCircle } from 'lucide-react';

function ChatHistory({ messages, onCueClick, onAnalyze }) {

    const scrollRef = useRef(null);
    const navigate = useNavigate();
    const { learningMode, setLearningMode } = useAppState();
    const [showScrollButton, setShowScrollButton] = useState(false);
    const isNearBottomRef = useRef(true);
    const lastStreamAutoScrollAtRef = useRef(0);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = distanceFromBottom < 200;
        if (distanceFromBottom > 200) {
            setShowScrollButton(true);
        } else {
            setShowScrollButton(false);
        }
    };

    const scrollToBottom = (behavior = 'smooth') => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: behavior,
            });
        }
    };

    // Auto-scroll on newly added messages (user always; bot only if user is following near-bottom).
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.sender === 'user') {
                scrollToBottom('auto');
                isNearBottomRef.current = true;
            } else if (lastMessage.sender === 'bot' && isNearBottomRef.current) {
                scrollToBottom('auto');
            }
        }
    }, [messages.length]);

    // Auto-scroll while streaming has been disabled to prevent jumpy per-token scrolling
    // that disrupts the user's reading flow and forces manual scrolling.
    // The window will still scroll to the bottom once at the beginning of a user or bot message.


    // --- GROUPING LOGIC START ---
    const groupedMessages = [];
    messages.forEach(msg => {
        if (msg.sender === 'bot') {
            const lastGroup = groupedMessages.length > 0 ? groupedMessages[groupedMessages.length - 1] : null;

            // Check if last item is a bot message (or group of bot messages)
            if (lastGroup && (lastGroup.sender === 'bot' || lastGroup.isBotGroup)) {
                if (lastGroup.isBotGroup) {
                    lastGroup.versions.push(msg);
                } else {
                    // Convert previous single bot message to a group
                    groupedMessages[groupedMessages.length - 1] = {
                        id: lastGroup.id,
                        sender: 'bot',
                        isBotGroup: true,
                        versions: [lastGroup, msg],
                        timestamp: msg.timestamp
                    };
                }
            } else {
                // New bot message, not consecutive
                groupedMessages.push(msg);
            }
        } else {
            groupedMessages.push(msg);
        }
    });
    // --- GROUPING LOGIC END ---

    return (
        <div className="relative flex-1">
            <div ref={scrollRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {groupedMessages.map((msg) => {
                        const isStreamingGroup = !!msg.isStreaming || (msg.isBotGroup && msg.versions?.some(version => version.isStreaming));
                        return (
                        <Animate
                            key={msg.id}
                            animation="slide-up"
                            duration="0.3s"
                        >
                            <MessageBubble
                                id={msg.id}
                                sender={msg.sender}
                                text={msg.text}
                                thinking={msg.thinking}
                                references={msg.references}
                                timestamp={msg.timestamp}
                                sourcePipeline={msg.source_pipeline}
                                isStreaming={msg.isStreaming}
                                criticalThinkingCues={msg.criticalThinkingCues}
                                onCueClick={onCueClick}
                                messageId={msg.id}
                                logId={msg.logId}
                                status={msg.status}
                                onAnalyze={onAnalyze}
                                steps={msg.steps}
                                confidenceScore={msg.confidenceScore}
                                historyVersions={msg.isBotGroup ? msg.versions : undefined}
                                isError={msg.isError}
                                xpDelta={msg.xpDelta}
                                structuredTurn={msg.structuredTurn || (msg.scaffold_phase ? msg : null)}
                                scaffold_phase={msg.scaffold_phase}
                                concept_anchor={msg.concept_anchor}
                                probe_question={msg.probe_question}
                                math_payload={msg.math_payload}
                                hints={msg.hints}
                                quick_hypotheses={msg.quick_hypotheses}
                                interactive_tool_link={msg.interactive_tool_link}
                                synthesis_artifact={msg.synthesis_artifact}
                                isLastAiMessage={
                                    groupedMessages.length > 0 &&
                                    groupedMessages[groupedMessages.length - 1].id === msg.id &&
                                    (msg.sender === 'bot' || msg.isBotGroup)
                                }
                                onTryAgain={() => {
                                    // Find the user message immediately preceding this bot group/message
                                    const groupIndex = groupedMessages.findIndex(m => m.id === msg.id);
                                    if (groupIndex > 0) {
                                        const previousMessage = groupedMessages[groupIndex - 1];
                                        if (previousMessage && previousMessage.sender === 'user') {
                                            onCueClick(previousMessage.text, { isTryAgain: true });
                                        }
                                    }
                                }}
                            />
                            {/* Contextual Next-Best-Action Smart Chips */}
                            {groupedMessages.length > 0 &&
                                groupedMessages[groupedMessages.length - 1].id === msg.id &&
                                (msg.sender === 'bot' || msg.isBotGroup) &&
                                !isStreamingGroup && (
                                <div className="mt-2 ml-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span className="text-gray-400 font-semibold mr-1">✨ Explore Next:</span>
                                    {!learningMode && (
                                        <button
                                            type="button"
                                            onClick={() => setLearningMode(true)}
                                            className="px-2.5 py-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors"
                                        >
                                            🎓 Switch to Guided Learning (+10 XP)
                                        </button>
                                    )}
                                    {(msg.text || '').includes(String.fromCharCode(96, 96, 96)) && (
                                        <button
                                            type="button"
                                            onClick={() => navigate('/tools/code-executor')}
                                            className="px-2.5 py-1 rounded-full bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-semibold transition-colors"
                                        >
                                            💻 Run in Code Executor
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new CustomEvent('imentor-open-xp-modal'))}
                                        className="px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors"
                                    >
                                        🧠 Concept Mind Map &amp; XP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/gamification/bounties')}
                                        className="px-2.5 py-1 rounded-full bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold transition-colors"
                                    >
                                        🎯 Daily Bounty (+5 XP)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/gamification/boss-battles')}
                                        className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition-colors"
                                    >
                                        ⚔️ Boss Battle
                                    </button>
                                </div>
                            )}
                        </Animate>
                        );
                    })}
            </div>

            {showScrollButton && (
                <Animate
                    show={showScrollButton}
                    animation="scale-in"
                    unmount
                    as="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute bottom-5 right-5 z-20 p-2 bg-primary dark:bg-primary-dark text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Scroll to bottom"
                >
                    <ArrowDownCircle size={24} />
                </Animate>
            )}
        </div>
    );
}

export default ChatHistory;