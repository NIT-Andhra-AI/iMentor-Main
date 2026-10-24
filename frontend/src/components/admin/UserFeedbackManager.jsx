// frontend/src/components/admin/UserFeedbackManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as adminApi from '../../services/adminApi.js';
import { format, formatDistanceToNow } from 'date-fns';
import {
    RefreshCw, Loader2, AlertCircle, Bug, Lightbulb, MessageSquare,
    ChevronUp, ChevronDown, ChevronsUpDown, Paperclip, FileText,
    ExternalLink, User, Image as ImageIcon, X, Award, Coins, Activity, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_ICON  = { bug: Bug, feature: Lightbulb, general: MessageSquare };
const TYPE_COLOR = {
    bug: 'text-red-400 bg-red-500/10 border-red-500/25',
    feature: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    general: 'text-neutral-300 bg-neutral-600/20 border-neutral-600/30'
};
const STATUS_OPTIONS = ['open', 'acknowledged', 'resolved', 'wont-fix'];
const STATUS_COLOR = {
    open: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    acknowledged: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'wont-fix': 'bg-neutral-600/30 text-neutral-400 border-neutral-600/30',
};

// Build the URL to an admin-served attachment
const attachmentUrl = (filename) =>
    `/api/admin/user-feedback/attachment/${encodeURIComponent(filename)}`;

// ─── Attachment viewer ────────────────────────────────────────────────────────
function AttachmentThumb({ att }) {
    const [lightbox, setLightbox] = useState(false);
    const url  = attachmentUrl(att.filename);
    const isImg = att.mimetype?.startsWith('image/');

    return (
        <>
            {isImg ? (
                <>
                    <button
                        onClick={() => setLightbox(true)}
                        className="relative group rounded overflow-hidden border border-neutral-700 hover:border-cyan-500 transition-colors"
                        title={att.originalName}
                        style={{ width: 72, height: 72, flexShrink: 0 }}
                    >
                        <img
                            src={url}
                            alt={att.originalName}
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ImageIcon size={18} className="text-white drop-shadow" />
                        </div>
                    </button>
                    {lightbox && (
                        <div
                            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                            onClick={() => setLightbox(false)}
                        >
                            <button
                                className="absolute top-4 right-4 text-white bg-black/60 rounded-full p-1.5 hover:bg-black/80"
                                onClick={() => setLightbox(false)}
                            >
                                <X size={18} />
                            </button>
                            <img
                                src={url}
                                alt={att.originalName}
                                className="max-w-full max-h-full rounded-lg shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    )}
                </>
            ) : (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={att.originalName}
                    className="flex flex-col items-center justify-center gap-1 rounded border border-neutral-700 hover:border-cyan-500 transition-colors text-neutral-400 hover:text-cyan-300 p-2"
                    style={{ width: 72, height: 72, flexShrink: 0 }}
                >
                    <FileText size={22} />
                    <span className="text-[9px] text-center leading-tight break-all line-clamp-2">{att.originalName}</span>
                    <ExternalLink size={9} />
                </a>
            )}
        </>
    );
}

// ─── Single feedback card ─────────────────────────────────────────────────────
function FeedbackCard({ item, updatingId, onStatusChange, onVerifyBounty }) {
    const Icon = TYPE_ICON[item.type] || MessageSquare;
    const isBountyEligible = item.bountyEligible || item.category === 'Performance' || item.type === 'bug' || item.category === 'AI Quality';
    const isAwarded = item.bountyStatus === 'awarded';
    const snap = item.telemetrySnapshot;

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            {/* Top row: type + category + bounty badge + date */}
            <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full border capitalize ${TYPE_COLOR[item.type] || TYPE_COLOR.general}`}>
                    <Icon size={11} />
                    {item.type}
                </span>
                <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded-full">{item.category}</span>

                {isAwarded ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35">
                        <Award size={11} />
                        Bounty Awarded (+{item.bountyCreditsAwarded || 50} Credits · +{item.bountyXpAwarded || 100} XP)
                    </span>
                ) : isBountyEligible && item.bountyStatus !== 'rejected' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        <Coins size={11} />
                        Performance Bounty Candidate
                    </span>
                ) : null}

                <span className="text-xs text-neutral-600 ml-auto whitespace-nowrap">
                    {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                </span>
            </div>

            {/* Message */}
            <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{item.message}</p>

            {/* Telemetry Snapshot (if captured at submission time) */}
            {snap && (snap.lastResponseTimeMs || snap.lastModelId || snap.lastQuery) && (
                <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 px-3 py-2 text-[11px] text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-semibold text-cyan-400 flex items-center gap-1">
                        <Activity size={11} /> Auto-Captured Telemetry:
                    </span>
                    {snap.lastResponseTimeMs != null && (
                        <span>
                            Last Latency:{' '}
                            <strong className={snap.lastResponseTimeMs >= 15000 ? 'text-red-400' : 'text-emerald-400'}>
                                {(snap.lastResponseTimeMs / 1000).toFixed(2)}s ({snap.lastResponseTimeMs} ms)
                            </strong>
                        </span>
                    )}
                    {snap.lastModelId && (
                        <span>Model: <code className="text-neutral-300">{snap.lastModelId}</code></span>
                    )}
                    {snap.lastQuery && (
                        <span className="truncate max-w-md text-neutral-500" title={snap.lastQuery}>
                            Query: &ldquo;{snap.lastQuery}&rdquo;
                        </span>
                    )}
                </div>
            )}

            {/* Attachments */}
            {item.attachments?.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <Paperclip size={10} /> Attachments ({item.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {item.attachments.map((att, i) => (
                            <AttachmentThumb key={i} att={att} />
                        ))}
                    </div>
                </div>
            )}

            {/* Status changer & One-click Bounty Verification */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-600">Status:</span>
                {updatingId === item._id ? (
                    <Loader2 size={13} className="animate-spin text-neutral-500" />
                ) : (
                    <select
                        value={item.status}
                        onChange={e => onStatusChange(item._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border bg-transparent cursor-pointer focus:outline-none ${STATUS_COLOR[item.status] || STATUS_COLOR.open}`}
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-neutral-900 text-neutral-200 font-normal">{s}</option>
                        ))}
                    </select>
                )}

                {!isAwarded && isBountyEligible && item.status !== 'wont-fix' && (
                    <button
                        onClick={() => onVerifyBounty(item._id)}
                        disabled={updatingId === item._id}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors disabled:opacity-50"
                        title="Verify issue, mark resolved, and credit +50 Bounty Credits & +100 XP to this student"
                    >
                        <CheckCircle size={12} />
                        Verify &amp; Award Bounty (+50 Credits / +100 XP)
                    </button>
                )}

                {item.resolvedAt && (
                    <span className="text-[10px] text-neutral-600 ml-auto">
                        Resolved {formatDistanceToNow(new Date(item.resolvedAt), { addSuffix: true })}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserFeedbackManager() {
    const [rows,       setRows]       = useState([]);
    const [total,      setTotal]      = useState(0);
    const [bountySummary, setBountySummary] = useState({
        totalEligible: 0,
        pendingReview: 0,
        awardedCount: 0,
        totalCreditsAwarded: 0,
        totalXpAwarded: 0,
    });
    const [slowTelemetry, setSlowTelemetry] = useState([]);
    const [activeView, setActiveView] = useState('reports'); // 'reports' | 'telemetry'
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [sortBy,     setSortBy]     = useState('lastAt');  // lastAt | email | total
    const [order,      setOrder]      = useState('desc');
    const [selectedId, setSelectedId] = useState(null);     // selected userId string
    const [updatingId, setUpdatingId] = useState(null);

    // Load all feedback + bounty stats + slow telemetry once
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminApi.getUserFeedbackList({ sortBy: 'createdAt', order: 'desc', page: 1, limit: 500 });
            setRows(data.feedback || []);
            setTotal(data.total || 0);
            if (data.bountySummary) setBountySummary(data.bountySummary);
            if (data.slowTelemetryAlerts) setSlowTelemetry(data.slowTelemetryAlerts);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load feedback.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Group flat rows by user
    const users = useMemo(() => {
        const map = {};
        rows.forEach(r => {
            const uid   = r.userId?._id || r.userId || 'unknown';
            const email = r.userId?.email || 'Unknown user';
            const name  = r.userId?.name || r.userId?.profile?.name || '';
            if (!map[uid]) {
                map[uid] = { uid, email, name, total: 0, bug: 0, feature: 0, general: 0, open: 0, bountyAwarded: 0, lastAt: null, items: [] };
            }
            const g = map[uid];
            g.total++;
            g[r.type]  = (g[r.type] || 0) + 1;
            if (r.status === 'open') g.open++;
            if (r.bountyStatus === 'awarded') g.bountyAwarded++;
            const d = new Date(r.createdAt);
            if (!g.lastAt || d > g.lastAt) g.lastAt = d;
            g.items.push(r);
        });
        return Object.values(map);
    }, [rows]);

    // Sort user rows
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let va, vb;
            if (sortBy === 'email') { va = a.email.toLowerCase(); vb = b.email.toLowerCase(); }
            else if (sortBy === 'total') { va = a.total; vb = b.total; }
            else { va = a.lastAt ? a.lastAt.getTime() : 0; vb = b.lastAt ? b.lastAt.getTime() : 0; }
            if (va === vb) return 0;
            const cmp = va > vb ? 1 : -1;
            return order === 'asc' ? cmp : -cmp;
        });
    }, [users, sortBy, order]);

    const selectedUser = useMemo(() => users.find(u => u.uid === selectedId) || null, [users, selectedId]);

    const handleSort = (field) => {
        setSortBy(s => {
            if (s === field) { setOrder(o => o === 'asc' ? 'desc' : 'asc'); return s; }
            setOrder('desc');
            return field;
        });
    };

    const handleStatusChange = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const updated = await adminApi.updateUserFeedbackStatus(id, { status: newStatus });
            setRows(prev => prev.map(r => r._id === id ? { ...r, ...updated } : r));
            if (updated.bountyJustAwarded) {
                toast.success(`Marked as ${newStatus} & awarded +${updated.deltaCredits} Bounty Credits / +${updated.deltaXp} XP! 🏆`);
                load();
            } else {
                toast.success(`Marked as ${newStatus}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleVerifyBounty = async (id) => {
        setUpdatingId(id);
        try {
            const updated = await adminApi.updateUserFeedbackStatus(id, {
                status: 'resolved',
                awardBounty: true,
            });
            setRows(prev => prev.map(r => r._id === id ? { ...r, ...updated } : r));
            toast.success(`Verified! Awarded +${updated.deltaCredits || 50} Bounty Credits & +${updated.deltaXp || 100} XP 🏆`);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to award bounty.');
        } finally {
            setUpdatingId(null);
        }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <ChevronsUpDown size={11} className="text-neutral-600" />;
        return order === 'asc'
            ? <ChevronUp size={11} className="text-cyan-400" />
            : <ChevronDown size={11} className="text-cyan-400" />;
    };

    const Th = ({ label, field }) => (
        <th
            className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 cursor-pointer hover:text-cyan-300 transition-colors select-none"
            onClick={() => handleSort(field)}
        >
            <span className="flex items-center gap-1">{label}<SortIcon field={field} /></span>
        </th>
    );

    return (
        <div className="flex flex-col h-full gap-3 min-h-0" style={{ height: 'calc(100vh - 150px)' }}>

            {/* ── TOP: Performance Bounty Summary & View Switcher ────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-2.5 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <Award size={15} /> Performance Bounty Program
                    </span>
                    <span className="text-neutral-400">
                        Eligible: <strong className="text-neutral-100">{bountySummary.totalEligible}</strong>
                    </span>
                    <span className="text-neutral-400">
                        Pending Verification: <strong className="text-yellow-300">{bountySummary.pendingReview}</strong>
                    </span>
                    <span className="text-neutral-400">
                        Awarded: <strong className="text-emerald-300">{bountySummary.awardedCount}</strong>
                    </span>
                    <span className="text-neutral-400">
                        Credits Paid: <strong className="text-amber-300">{bountySummary.totalCreditsAwarded} Credits ({bountySummary.totalXpAwarded} XP)</strong>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveView('reports')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            activeView === 'reports'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                        }`}
                    >
                        User Reports ({total})
                    </button>
                    <button
                        onClick={() => setActiveView('telemetry')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            activeView === 'telemetry'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                        }`}
                    >
                        <Activity size={12} />
                        Auto-Detected Slow Turns &amp; 👎 ({slowTelemetry.length})
                    </button>
                </div>
            </div>

            {activeView === 'telemetry' ? (
                /* ── TELEMETRY ALERTS VIEW ─────────────────────────────────── */
                <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-neutral-400">
                            Showing automatic <code className="text-cyan-300">LLMPerformanceLog</code> captures where response latency exceeded <strong>30,000 ms</strong> or received negative (👎) feedback.
                        </p>
                        <button
                            onClick={load}
                            disabled={loading}
                            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-cyan-300"
                        >
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500 text-left uppercase text-[10px]">
                                <th className="py-2 px-3">User</th>
                                <th className="py-2 px-3">Latency</th>
                                <th className="py-2 px-3">Model</th>
                                <th className="py-2 px-3">Feedback</th>
                                <th className="py-2 px-3">Query Preview</th>
                                <th className="py-2 px-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60">
                            {slowTelemetry.map(t => (
                                <tr key={t._id} className="hover:bg-neutral-900/60">
                                    <td className="py-2.5 px-3 font-mono text-cyan-300">{t.userId?.email || 'Unknown'}</td>
                                    <td className="py-2.5 px-3 font-bold text-red-400">{(t.responseTimeMs / 1000).toFixed(1)}s ({t.responseTimeMs} ms)</td>
                                    <td className="py-2.5 px-3 text-neutral-300">{t.chosenModelId}</td>
                                    <td className="py-2.5 px-3">
                                        {t.userFeedback === 'negative' ? (
                                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">👎 Negative</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">{t.userFeedback || 'none'}</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-3 text-neutral-300 max-w-md truncate" title={t.query}>{t.query}</td>
                                    <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap">
                                        {t.createdAt ? format(new Date(t.createdAt), 'dd MMM HH:mm') : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ── USER REPORTS SPLIT VIEW ───────────────────────────────── */
                <div className="flex flex-1 gap-4 min-h-0">
                    {/* LEFT: user list */}
                    <div className="flex flex-col w-80 flex-shrink-0 min-h-0">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <span className="text-xs text-neutral-400">
                                {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''} · {total} submission{total !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={load}
                                disabled={loading}
                                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-cyan-300 transition-colors disabled:opacity-40"
                            >
                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2 mb-2 flex-shrink-0">
                                <AlertCircle size={12} /> {error}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-800 min-h-0">
                            <table className="w-full text-xs">
                                <thead className="bg-neutral-900 sticky top-0 z-10">
                                    <tr className="border-b border-neutral-800">
                                        <Th label="User"  field="email" />
                                        <Th label="Total" field="total" />
                                        <Th label="Last"  field="lastAt" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/60">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-10 text-neutral-500">
                                                <Loader2 size={16} className="animate-spin inline-block mr-2" />
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : sortedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-10 text-neutral-600">No feedback yet.</td>
                                        </tr>
                                    ) : sortedUsers.map(u => {
                                        const isSelected = selectedId === u.uid;
                                        return (
                                            <tr
                                                key={u.uid}
                                                onClick={() => setSelectedId(isSelected ? null : u.uid)}
                                                className={`cursor-pointer transition-colors ${isSelected
                                                    ? 'bg-cyan-950/40 border-l-2 border-l-cyan-500'
                                                    : 'hover:bg-neutral-900/70'
                                                }`}
                                            >
                                                <td className="px-3 py-2.5">
                                                    <div className="font-mono text-cyan-300/80 text-[11px] leading-tight truncate max-w-[140px]">{u.email}</div>
                                                    {u.name && <div className="text-neutral-500 text-[10px] truncate">{u.name}</div>}
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {u.bug > 0     && <span className="text-[9px] bg-red-500/10 text-red-400 px-1 rounded">{u.bug}🐛</span>}
                                                        {u.feature > 0 && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1 rounded">{u.feature}💡</span>}
                                                        {u.general > 0 && <span className="text-[9px] bg-neutral-700 text-neutral-400 px-1 rounded">{u.general}💬</span>}
                                                        {u.open > 0    && <span className="text-[9px] bg-yellow-500/10 text-yellow-400 px-1 rounded">{u.open} open</span>}
                                                        {u.bountyAwarded > 0 && <span className="text-[9px] bg-amber-500/15 text-amber-300 px-1 rounded">{u.bountyAwarded}🏆</span>}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`inline-block font-bold text-sm ${isSelected ? 'text-cyan-300' : 'text-neutral-200'}`}>{u.total}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-neutral-500 whitespace-nowrap text-[10px]">
                                                    {u.lastAt ? formatDistanceToNow(u.lastAt, { addSuffix: true }) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: detail panel */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0">
                        {!selectedUser ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 gap-3 rounded-xl border border-neutral-800/60 border-dashed">
                                <User size={40} strokeWidth={1} />
                                <p className="text-sm">Select a user to view their feedback &amp; verify Performance Bounties</p>
                            </div>
                        ) : (
                            <div className="flex flex-col min-h-0 h-full">
                                <div className="flex items-start justify-between mb-3 flex-shrink-0 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-100">{selectedUser.email}</p>
                                        {selectedUser.name && <p className="text-xs text-neutral-500">{selectedUser.name}</p>}
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0 text-xs text-neutral-400">
                                        <span className="flex flex-col items-center gap-0.5">
                                            <span className="text-lg font-bold text-neutral-100">{selectedUser.total}</span>
                                            Total
                                        </span>
                                        {selectedUser.bug > 0     && <span className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold text-red-400">{selectedUser.bug}</span>Bug{selectedUser.bug !== 1 ? 's' : ''}</span>}
                                        {selectedUser.feature > 0 && <span className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold text-blue-400">{selectedUser.feature}</span>Feature{selectedUser.feature !== 1 ? 's' : ''}</span>}
                                        {selectedUser.general > 0 && <span className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold text-neutral-300">{selectedUser.general}</span>General</span>}
                                        {selectedUser.open > 0    && <span className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold text-yellow-400">{selectedUser.open}</span>Open</span>}
                                        {selectedUser.bountyAwarded > 0 && <span className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold text-amber-300">{selectedUser.bountyAwarded}</span>Bounties</span>}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                                    {[...selectedUser.items]
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map(item => (
                                            <FeedbackCard
                                                key={item._id}
                                                item={item}
                                                updatingId={updatingId}
                                                onStatusChange={handleStatusChange}
                                                onVerifyBounty={handleVerifyBounty}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
