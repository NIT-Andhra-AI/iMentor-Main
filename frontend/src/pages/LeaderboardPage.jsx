// frontend/src/pages/LeaderboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Star, Crown, Loader2, ArrowLeft, Flame, Award, ShieldOff, Sparkles, Target } from 'lucide-react';
import api from '../services/api';
import Card from '../components/core/Card.jsx';
import Badge from '../components/core/Badge.jsx';
import Animate from '../components/core/Animate.jsx';

const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserStatus, setCurrentUserStatus] = useState(null);
    const [totalRanked, setTotalRanked] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await api.getLeaderboard(50);
                if (Array.isArray(data)) {
                    setLeaderboard(data);
                    setTotalRanked(data.length);
                } else {
                    setLeaderboard(data?.leaderboard || []);
                    setCurrentUserStatus(data?.currentUserStatus || null);
                    setTotalRanked(data?.totalStudentsRanked ?? (data?.leaderboard?.length || 0));
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown className="text-yellow-500" size={26} />;
            case 2: return <Medal className="text-slate-400" size={24} />;
            case 3: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="text-base font-black text-text-muted-light">#{rank}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
                <p className="text-text-muted-light animate-pulse font-medium">Calculating Live Student Rankings...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-background-light dark:bg-background-dark pt-16 pb-12">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-yellow-500/20 pb-5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-full"
                            title="Go Back"
                        >
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <Trophy className="text-yellow-500" size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-text-light dark:text-text-dark tracking-tight uppercase">
                                    Student XP Leaderboard
                                </h1>
                                <p className="text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark font-medium">
                                    Live academic rankings across {totalRanked} active students (test, developer &amp; admin accounts excluded)
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/gamification/bounties')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                    >
                        <Target size={15} />
                        <span>Earn Bounties &amp; XP</span>
                    </button>
                </div>

                {/* Current User Standing Banner */}
                {currentUserStatus && (
                    <Card className="mb-8 p-4 sm:p-5 border border-sky-500/30 bg-sky-500/5 dark:bg-slate-900/90">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-black text-sky-400 text-lg">
                                    {currentUserStatus.rank ? `#${currentUserStatus.rank}` : '—'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-base text-text-light dark:text-white">
                                            Your Standing: {currentUserStatus.username}
                                        </span>
                                        <Badge variant="primary">LEVEL {currentUserStatus.level}</Badge>
                                        {currentUserStatus.isHiddenAccount && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/70 text-slate-300 border border-slate-600">
                                                <ShieldOff size={12} />
                                                Hidden from Public Leaderboard ({currentUserStatus.hiddenReason})
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-text-muted-light dark:text-slate-400 mt-0.5">
                                        {currentUserStatus.isHiddenAccount
                                            ? 'Your XP is tracked accurately below, while public rankings show verified students only.'
                                            : currentUserStatus.rank
                                                ? `You are ranked #${currentUserStatus.rank} out of ${totalRanked} active students!`
                                                : 'Ask questions in General Chat, Learn Mode, or Skill Tree to climb the ranks!'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-[11px] uppercase tracking-wider text-text-muted-light dark:text-slate-400 font-semibold">Your Total XP</div>
                                    <div className="text-2xl font-black text-emerald-400 flex items-center justify-end gap-1">
                                        {Number(currentUserStatus.totalXP || 0).toLocaleString()} XP
                                        <Sparkles size={16} className="text-yellow-400" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[11px] uppercase tracking-wider text-text-muted-light dark:text-slate-400 font-semibold">Bounty Credits</div>
                                    <div className="text-xl font-black text-amber-400">
                                        {Number(currentUserStatus.testingCredits || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Top 3 Podium Spotlight */}
                {leaderboard.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                        {leaderboard.slice(0, 3).map((student, idx) => (
                            <Animate
                                key={student.userId || student.username}
                                animation="slide-up"
                                delay={idx * 80}
                            >
                                <Card className={`text-center p-6 border-2 transition-all ${idx === 0 ? 'border-yellow-500 bg-yellow-500/5 md:scale-105 z-10 shadow-xl' : idx === 1 ? 'border-slate-400/50 bg-slate-500/5' : 'border-amber-600/50 bg-amber-600/5'}`}>
                                    <div className="flex justify-center mb-3">
                                        {getRankIcon(student.rank)}
                                    </div>
                                    <h3 className="text-lg font-bold mb-1 truncate text-text-light dark:text-white" title={student.username}>
                                        {student.username}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <Badge variant={idx === 0 ? 'primary' : 'secondary'}>LEVEL {student.level}</Badge>
                                        {student.currentStreak > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400">
                                                <Flame size={13} /> {student.currentStreak}d
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400">
                                        {Number(student.totalXP || 0).toLocaleString()} XP
                                    </div>
                                    <p className="text-[11px] font-bold text-text-muted-light uppercase mt-2 tracking-wider">
                                        Rank #{student.rank} {student.branch ? `• ${student.branch}` : ''}
                                    </p>
                                </Card>
                            </Animate>
                        ))}
                    </div>
                )}

                {/* Full Student Ranking Table */}
                <Card className="overflow-hidden border border-border-light dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 dark:bg-slate-800/70 border-b border-border-light dark:border-slate-700">
                                    <th className="px-5 py-3.5 text-xs font-black text-text-muted-light uppercase tracking-wider">Rank</th>
                                    <th className="px-5 py-3.5 text-xs font-black text-text-muted-light uppercase tracking-wider">Student</th>
                                    <th className="px-5 py-3.5 text-xs font-black text-text-muted-light uppercase tracking-wider text-right">Level</th>
                                    <th className="px-5 py-3.5 text-xs font-black text-text-muted-light uppercase tracking-wider text-right">Bounty Credits</th>
                                    <th className="px-5 py-3.5 text-xs font-black text-text-muted-light uppercase tracking-wider text-right">Total XP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-slate-800">
                                {leaderboard.map((student) => (
                                    <tr
                                        key={student.userId || student.username}
                                        className={`transition-colors ${student.isCurrentUser ? 'bg-sky-500/10 dark:bg-sky-500/15 font-semibold' : 'hover:bg-primary/5'}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${student.rank === 1 ? 'bg-yellow-500 text-black' : student.rank === 2 ? 'bg-slate-400 text-black' : student.rank === 3 ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-text-muted-light'}`}>
                                                    #{student.rank}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-bold text-sm text-text-light dark:text-white flex items-center gap-2">
                                                        <span>{student.username}</span>
                                                        {student.isCurrentUser && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold uppercase">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-text-muted-light dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                        <span>{student.branch || 'Engineering Learner'}</span>
                                                        {student.currentStreak > 0 && (
                                                            <span className="text-orange-400 inline-flex items-center gap-0.5">
                                                                • <Flame size={11} /> {student.currentStreak}d streak
                                                            </span>
                                                        )}
                                                        {student.badgesCount > 0 && (
                                                            <span className="text-purple-400 inline-flex items-center gap-0.5">
                                                                • <Award size={11} /> {student.badgesCount} badge{student.badgesCount > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Badge variant="outline" className="font-black">LVL {student.level}</Badge>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="text-sm font-bold text-amber-500">
                                                {Math.round(student.testingCredits || 0)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className="text-base font-black text-emerald-500 dark:text-emerald-400">
                                                    {Number(student.totalXP || 0).toLocaleString()}
                                                </span>
                                                <Star size={14} className="text-yellow-500 fill-current" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {leaderboard.length === 0 && (
                        <div className="p-16 text-center">
                            <Trophy size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-3" />
                            <p className="text-text-muted-light font-medium">No students have earned XP yet. Be the first!</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default LeaderboardPage;
