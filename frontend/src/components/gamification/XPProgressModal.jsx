// frontend/src/components/gamification/XPProgressModal.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, TrendingUp, Target, Coins, Trophy, Crown, Medal, Star, ShieldOff, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { formatTopicName } from '../../utils/helpers';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function XPProgressModal({ isOpen, onClose, level, refreshCounter = 0 }) {
    const [stats, setStats] = useState(null);
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            fetchStatsAndLeaderboard();
        }
    }, [isOpen, refreshCounter]);

    const fetchStatsAndLeaderboard = async () => {
        try {
            setLoading(true);
            const [profileRes, lbRes] = await Promise.allSettled([
                apiClient.get('/gamification/profile'),
                apiClient.get('/gamification/leaderboard', { params: { limit: 5 } })
            ]);
            if (profileRes.status === 'fulfilled') {
                setStats(profileRes.value.data);
            }
            if (lbRes.status === 'fulfilled') {
                setLeaderboardData(lbRes.value.data);
            }
        } catch (error) {
            console.error('[XPProgressModal] Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentXP = Number(stats?.totalXP || 0);
    const currentLevel = stats?.xpLevel || Math.floor(Math.sqrt(Math.max(0, currentXP) / 50)) + 1;

    // Level formula: Level = floor(sqrt(XP/50)) + 1
    // Level N Start XP = (N-1)^2 * 50, Next Level Start = N^2 * 50
    const levelStartXP = Math.pow(currentLevel - 1, 2) * 50;
    const levelEndXP = Math.pow(currentLevel, 2) * 50;

    const xpIntoCurrentLevel = Math.max(0, currentXP - levelStartXP);
    const xpNeededThisLevel = Math.max(50, levelEndXP - levelStartXP);
    const xpRemaining = Math.max(0, levelEndXP - currentXP);
    const progressPercent = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededThisLevel) * 100));

    const topStudents = leaderboardData?.leaderboard || [];
    const myStatus = leaderboardData?.currentUserStatus || null;

    const handleGoToLeaderboard = () => {
        onClose();
        navigate('/gamification/leaderboard');
    };

    const handleGoToBounties = () => {
        onClose();
        navigate('/gamification/bounties');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-300 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-black px-6 py-4 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-400/40">
                            <Zap className="text-emerald-400" size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span>XP Progress &amp; Leaderboard</span>
                                {myStatus?.rank && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold">
                                        Rank #{myStatus.rank}
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-gray-300">
                                Level {currentLevel} • {currentXP.toLocaleString()} Total XP
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[72vh] overflow-y-auto space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3.5 text-white border border-gray-700">
                                    <div className="text-xl font-black text-emerald-400">{currentXP.toLocaleString()}</div>
                                    <div className="text-[11px] text-gray-300">Total XP</div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3.5 text-white border border-gray-700">
                                    <div className="text-xl font-black text-sky-400">Level {currentLevel}</div>
                                    <div className="text-[11px] text-gray-300">{xpRemaining} XP to Lvl {currentLevel + 1}</div>
                                </div>
                                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3.5 text-white border border-gray-700">
                                    <div className="text-xl font-black text-amber-400 flex items-center gap-1">
                                        <Coins size={16} />
                                        {(stats?.totalLearningCredits || 0).toLocaleString()}
                                    </div>
                                    <div className="text-[11px] text-gray-300">Learning Credits</div>
                                </div>
                            </div>

                            {/* Level Progress Bar */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        <Target size={14} className="text-emerald-500" />
                                        <span>Progress to Level {currentLevel + 1}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                        {xpIntoCurrentLevel} / {xpNeededThisLevel} XP ({progressPercent.toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="relative w-full h-5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Live Top 5 Student Leaderboard Preview */}
                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={16} className="text-yellow-500" />
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">
                                            Student XP Leaderboard (Top 5)
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleGoToLeaderboard}
                                        className="text-xs font-bold text-sky-500 hover:text-sky-400 inline-flex items-center gap-1"
                                    >
                                        <span>Full Leaderboard</span>
                                        <ArrowRight size={13} />
                                    </button>
                                </div>

                                {myStatus?.isHiddenAccount && (
                                    <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5">
                                        <ShieldOff size={13} className="text-amber-400 flex-shrink-0" />
                                        <span>Your account ({myStatus.hiddenReason}) is hidden from public student rankings.</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    {topStudents.slice(0, 5).map((stu) => (
                                        <div
                                            key={stu.userId || stu.username}
                                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${stu.isCurrentUser ? 'bg-sky-500/15 border border-sky-500/30 font-bold' : 'bg-white dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/60'}`}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${stu.rank === 1 ? 'bg-yellow-500 text-black' : stu.rank === 2 ? 'bg-slate-400 text-black' : stu.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                    {stu.rank}
                                                </span>
                                                <span className="truncate text-gray-900 dark:text-white font-medium">
                                                    {stu.username}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    Lvl {stu.level}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                <span>{Number(stu.totalXP || 0).toLocaleString()} XP</span>
                                                <Star size={12} className="text-yellow-500 fill-current" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Student Concept Mind Map (Anti-Farm XP Tracker) */}
                            {stats?.mindMap?.concepts && stats.mindMap.concepts.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={15} className="text-emerald-500" />
                                            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white">
                                                Concept Mind Map ({stats.mindMap.summary?.masteredCount || 0} Mastered / {stats.mindMap.summary?.totalConcepts || 0} Total)
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            Max {stats.mindMap.summary?.highestBloomLabel || 'L1'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
                                        Mastered concepts (≥85%) award 0 XP at the same Bloom level to prevent XP farming. Ask higher-order Apply/Analyze (L3+) questions to earn 125% XP!
                                    </p>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                        {stats.mindMap.concepts.slice(0, 8).map((c, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900/70 border border-gray-200/60 dark:border-gray-700/60 text-xs">
                                                <div className="truncate pr-2">
                                                    <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                                                        <span className="truncate">{formatTopicName(c.conceptName)}</span>
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 flex-shrink-0">
                                                            {c.bloomLabel}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                        {c.xpStatus}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded ${c.understandingLevel === 'mastered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : c.understandingLevel === 'comfortable' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                                        {c.masteryScore}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent XP Activity */}
                            {stats?.recentXPHistory && stats.recentXPHistory.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">📜 Recent XP Activity</h3>
                                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                        {stats.recentXPHistory.slice(0, 5).map((entry, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="text-gray-700 dark:text-gray-300 truncate">{formatTopicName(entry.topic || entry.reason)}</span>
                                                    <span className="text-gray-400 text-[10px]">
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className={`font-bold ${entry.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} XP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-100 dark:bg-gray-800 px-5 py-3 flex items-center justify-between gap-2 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleGoToLeaderboard}
                            className="px-3.5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                            <Trophy size={14} />
                            <span>Student Leaderboard</span>
                        </button>
                        <button
                            onClick={handleGoToBounties}
                            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                            <Target size={14} />
                            <span>Bounties</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg text-xs font-bold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default XPProgressModal;
