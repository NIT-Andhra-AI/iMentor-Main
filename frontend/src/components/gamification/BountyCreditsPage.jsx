// frontend/src/components/gamification/BountyCreditsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Award, TrendingUp, Clock, CheckCircle, Coins, Sparkles, Star, Home, RefreshCw, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Animate from '../core/Animate.jsx';
import { formatTopicName } from '../../utils/helpers';

function BountyCreditsPage() {
    const navigate = useNavigate();
    const [bounties, setBounties] = useState([]);
    const [credits, setCredits] = useState(0);
    const [stats, setStats] = useState({
        bountiesCompleted: 0,
        totalEarned: 0,
        transactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [submittingBounty, setSubmittingBounty] = useState(null);
    const [activeBountyModal, setActiveBountyModal] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [levelUpData, setLevelUpData] = useState(null);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds to keep data current
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (force = false) => {
        try {
            if (force || !loading) setLoading(true);

            // Fetch data using centralized api service
            // We need to add these endpoints to api.js if they don't exist, 
            // or use api.get/post if exposed, but api.js doesn't expose the raw client.
            // Let's assume we will add getBounties and getGamificationProfile to api.js
            // For now, I'll update api.js to include these methods.

            const [bountiesData, profileData] = await Promise.all([
                api.getBounties(),
                api.getGamificationProfile()
            ]);

            console.log('[BountyCreditsPage] Fresh data loaded:', {
                credits: profileData.learningCredits,
                bounties: bountiesData.bounties?.length
            });

            setBounties(bountiesData.bounties || []);
            setCredits(profileData.learningCredits || 0);

            // Calculate stats from credits history
            const creditsHistory = profileData.creditsHistory || [];
            const completed = creditsHistory.filter(h => h.reason === 'bounty_completed').length;
            const totalEarned = creditsHistory
                .filter(h => h.reason === 'bounty_completed')
                .reduce((sum, h) => sum + h.amount, 0);

            setStats({
                bountiesCompleted: completed,
                totalEarned: totalEarned,
                transactions: creditsHistory.length
            });
        } catch (error) {
            console.error('[BountyCreditsPage] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBountyModal = (bountyId) => {
        const bounty = bounties.find(b => b.bountyId === bountyId);
        if (!bounty) return;
        setActiveBountyModal(bounty);
        setSelectedAnswer('');
    };

    const handleDirectSubmitBounty = async () => {
        if (!activeBountyModal || !selectedAnswer.trim()) {
            toast.error('Please select or enter an answer first.');
            return;
        }
        try {
            setSubmittingBounty(activeBountyModal.bountyId);
            const result = await api.submitBounty(activeBountyModal.bountyId, selectedAnswer.trim());
            await handleBountyComplete(result);
            if (result.isCorrect) {
                setActiveBountyModal(null);
                setSelectedAnswer('');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || 'Failed to submit bounty answer');
        } finally {
            setSubmittingBounty(null);
        }
    };

    const handleSubmitBounty = async (bountyId) => {
        // Find the bounty details
        const bounty = bounties.find(b => b.bountyId === bountyId);
        if (!bounty) return;

        // Show a custom toast notification with bounty details
        toast.custom((t) => (
            <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md animate-motion-scale-in"
            >
                <div className="flex items-start gap-3">
                    <Target className="flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-lg mb-1">Bounty Challenge Started!</h3>
                        <p className="text-sm opacity-90 mb-2">{bounty.questionText.substring(0, 100)}...</p>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                                <Coins size={16} />
                                {bounty.creditReward} Credits
                            </span>
                            <span className="flex items-center gap-1">
                                <Star size={16} />
                                {bounty.xpBonus} XP
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 3000 });

        const formattedOptions = Array.isArray(bounty.options) && bounty.options.length > 0
            ? '\n\n' + bounty.options.map((opt, idx) => `${String.fromCharCode(65 + idx)}) ${opt}`).join('\n')
            : '';
        // Navigate to chat with the bounty question
        navigate('/', {
            state: {
                bountyQuestion: bounty.questionText + formattedOptions,
                bountyId: bountyId,
                bountyCredits: bounty.creditReward || 5,
                bountyLearningCredits: bounty.xpBonus || bounty.learningCreditsBonus || 10,
                bountyXP: bounty.xpBonus || bounty.learningCreditsBonus || 10,
                bountyTopic: bounty.topic,
                bountyDifficulty: bounty.difficulty
            }
        });
    };

    const handleBountyComplete = async (result) => {
        if (result.isCorrect) {
            // Show success notification with rewards
            toast.custom((t) => (
                <div
                    className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl animate-motion-scale-in"
                >
                    <div className="flex items-start gap-3">
                        <CheckCircle className="flex-shrink-0" size={32} />
                        <div>
                            <h3 className="font-bold text-xl mb-2">Bounty Completed! 🎉</h3>
                            <div className="space-y-1">
                                <p className="flex items-center gap-2">
                                    <Coins size={18} />
                                    <span className="font-semibold">+{result.creditsAwarded} Credits</span>
                                    <span className="text-sm opacity-80">(Total: {result.newCreditsBalance})</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Star size={18} />
                                    <span className="font-semibold">+{result.xpAwarded} XP</span>
                                    <span className="text-sm opacity-80">(Total: {result.newXPTotal})</span>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Award size={18} />
                                    <span className="font-semibold">Level {result.newLevel}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 5000 });

            // Check for level up
            if (result.leveledUp) {
                setLevelUpData(result);
                setShowLevelUp(true);
                setTimeout(() => setShowLevelUp(false), 5000);
            }

            // Update local state with new values
            setCredits(result.newCreditsBalance);

            // Refresh data
            fetchData();
        } else {
            // Show failure notification
            toast.error(`Incorrect answer. ${result.explanation}`, {
                duration: 4000,
                icon: '❌'
            });
        }
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'bg-gray-100 text-gray-800 border-gray-300',
            medium: 'bg-gray-200 text-gray-900 border-gray-400',
            hard: 'bg-gray-800 text-white border-gray-600',
            expert: 'bg-black text-white border-gray-900'
        };
        return colors[difficulty] || colors.medium;
    };

    const getDifficultyIcon = (difficulty) => {
        // Keep stars as they are symbolic, but could use simple text if requested.
        // Keeping stars as standard symbols.
        const icons = {
            easy: '⭐',
            medium: '⭐⭐',
            hard: '⭐⭐⭐',
            expert: '⭐⭐⭐⭐'
        };
        return icons[difficulty] || icons.medium;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={36} className="animate-spin text-primary" />
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading Bounty Challenges...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-900">
                        {/* Interactive Bounty Challenge Modal */}
            {activeBountyModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
                    onClick={() => setActiveBountyModal(null)}
                >
                    <div
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                                        {activeBountyModal.difficulty || 'medium'}
                                    </span>
                                    <span className="text-xs font-semibold text-yellow-400 flex items-center gap-1">
                                        <Coins size={13} /> +{activeBountyModal.creditReward} Credits
                                    </span>
                                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                                        <Star size={13} /> +{activeBountyModal.xpBonus} XP
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    🎯 {formatTopicName(activeBountyModal.topic, true)}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveBountyModal(null)}
                                className="text-gray-400 hover:text-white text-sm font-bold px-2 py-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-base text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
                            {activeBountyModal.questionText}
                        </p>

                        {Array.isArray(activeBountyModal.options) && activeBountyModal.options.length > 0 ? (
                            <div className="space-y-2.5">
                                {activeBountyModal.options.map((opt, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const isSelected = selectedAnswer === opt;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedAnswer(opt)}
                                            className={'w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ' + (
                                                isSelected
                                                    ? 'border-primary bg-primary/15 text-gray-900 dark:text-white ring-2 ring-primary/40'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/60'
                                            )}
                                        >
                                            <span className={'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ' + (
                                                isSelected ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            )}>
                                                {letter}
                                            </span>
                                            <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea
                                rows={4}
                                value={selectedAnswer}
                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                placeholder="Type your solution or explanation..."
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => {
                                    const bId = activeBountyModal.bountyId;
                                    setActiveBountyModal(null);
                                    handleSubmitBounty(bId);
                                }}
                                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                💬 Discuss in AI Chat Instead
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveBountyModal(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={!selectedAnswer || submittingBounty === activeBountyModal.bountyId}
                                    onClick={handleDirectSubmitBounty}
                                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {submittingBounty === activeBountyModal.bountyId ? (
                                        <><Loader2 size={15} className="animate-spin" /> Submitting...</>
                                    ) : (
                                        <><CheckCircle size={15} /> Submit Answer</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Level Up Animation */}
            <Animate show={showLevelUp && !!levelUpData} unmount animation="fade-in">
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
                        onClick={() => setShowLevelUp(false)}
                    >
                        <Animate
                            animation="scale-in"
                            className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white p-8 rounded-2xl shadow-2xl text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 animate-spin">
                                <Sparkles className="mx-auto text-black dark:text-white" size={64} />
                            </div>
                            <h2 className="text-4xl font-bold text-black dark:text-white mb-2">LEVEL UP!</h2>
                            <p className="text-6xl font-black text-black dark:text-white mb-4">{levelUpData?.newLevel}</p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg">You're getting stronger! 💪</p>
                        </Animate>
                    </div>
            </Animate>

            <div className="w-full space-y-8">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-3xl font-bold text-text-light dark:text-text-dark flex items-center gap-3">
                            <Target size={28} className="text-primary" />
                            Bounty Challenges
                        </h2>
                        <p className="text-base text-text-muted-light dark:text-text-muted-dark mt-1">
                            Complete challenges • Earn credits • Unlock premium features
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted-light dark:text-text-muted-dark transition-colors"
                            title="Back to Home"
                        >
                            <Home size={20} />
                        </button>
                        <button
                            onClick={() => fetchData(true)}
                            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-text-muted-light dark:text-text-muted-dark transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* ── Stats Bar ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Credits',       value: credits,                    icon: <Coins size={22} className="text-yellow-400" /> },
                        { label: 'Bounties Completed',  value: stats.bountiesCompleted,    icon: <Award size={22} className="text-emerald-400" /> },
                        { label: 'Total Earned',        value: stats.totalEarned,          icon: <TrendingUp size={22} className="text-blue-400" /> },
                        { label: 'Transactions',        value: stats.transactions,         icon: <Clock size={22} className="text-primary" /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="rounded-xl border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/40 p-5 flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                {icon}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-text-light dark:text-text-dark">{value}</p>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide mt-0.5">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Active Bounties ── */}
                <div className="rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-gray-100 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
                        <Sparkles size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide">Active Bounty Challenges</span>
                        <span className="ml-auto text-sm font-bold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wide">{bounties.length} available</span>
                    </div>

                {bounties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Target size={52} className="text-text-muted-light dark:text-text-muted-dark mb-4 opacity-40" />
                        <p className="text-lg font-medium text-text-light dark:text-text-dark">No Active Challenges</p>
                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                            New bounties generated daily at <span className="font-semibold">9:00 AM IST</span>
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-light dark:divide-border-dark">
                        {bounties.map((bounty) => (
                            <div
                                key={bounty._id}
                                className={`flex flex-col sm:flex-row sm:items-center gap-5 p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${bounty.status === 'completed' ? 'opacity-60' : ''}`}
                            >
                                {/* Topic + difficulty */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <Target size={18} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-text-light dark:text-text-dark text-base truncate">{formatTopicName(bounty.topic, true)}</p>
                                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark line-clamp-1 mt-0.5">{bounty.questionText}</p>
                                    </div>
                                </div>

                                {/* Badges row */}
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(bounty.difficulty)}`}>
                                        {bounty.difficulty.toUpperCase()}
                                    </span>
                                    {bounty.isGlobal && (
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">GLOBAL</span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                        <Coins size={12} /> {bounty.creditReward}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                        <Star size={12} /> +{bounty.xpBonus} XP
                                    </span>
                                </div>

                                {/* Expiry */}
                                <div className="text-sm text-text-muted-light dark:text-text-muted-dark flex-shrink-0 hidden md:block">
                                    Expires {new Date(bounty.expiresAt).toLocaleDateString()}
                                </div>

                                {/* Action */}
                                {bounty.status === 'completed' ? (
                                    <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex-shrink-0">
                                        <CheckCircle size={13} /> Claimed
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleOpenBountyModal(bounty.bountyId)}
                                        className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors"
                                    >
                                        <Target size={15} /> Attempt
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                </div>

                {/* ── Performance & Bug Bounty Program Callout ── */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-200 space-y-2">
                    <p className="font-semibold flex items-center gap-2 text-base text-amber-300">
                        <Award size={18} /> 🎯 Performance &amp; Bug Bounty Program (Live!)
                    </p>
                    <p>
                        Notice a slow response, high latency, or UI/AI bug? Click the <strong>Flag icon (⚑)</strong> in the top navigation bar and submit a <strong>Performance</strong> or <strong>Bug Report</strong>!
                    </p>
                    <ul className="list-disc list-inside space-y-1 opacity-90 text-xs sm:text-sm">
                        <li><strong>Immediate Submission Bonus:</strong> Earn <strong>+5 XP</strong> automatically (up to 3 reports/day) with auto-attached latency telemetry.</li>
                        <li><strong>Acknowledged by Admin:</strong> Earn <strong>+25 Bounty Credits &amp; +50 XP</strong>.</li>
                        <li><strong>Verified &amp; Resolved by Admin:</strong> Earn <strong>+50 Bounty Credits &amp; +100 XP</strong> + the <em>Performance Bounty Hunter 🎯</em> badge!</li>
                    </ul>
                </div>

                {/* ── Info Box ── */}
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 text-sm text-yellow-300/90 space-y-2">
                    <p className="font-semibold flex items-center gap-2 text-base">
                        <Coins size={16} /> How Bounty Credits Work
                    </p>
                    <p>Complete daily bounty challenges or report verified performance issues to earn learning credits. New academic bounties are generated daily at <strong>9:00 AM IST</strong>.</p>
                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="opacity-70">Use credits to unlock premium features and track your progress on the leaderboard.</p><button onClick={() => navigate('/gamification/leaderboard')} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-xs font-bold transition-colors">🏆 View Student Leaderboard</button></div>
                </div>
            </div>
        </div>
    );
}

export default BountyCreditsPage;
