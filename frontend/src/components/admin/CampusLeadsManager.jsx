// frontend/src/components/admin/CampusLeadsManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Building2, RefreshCw, Search, Server, Mail, Phone } from 'lucide-react';
import { getFixedAdminAuthHeaders } from '../../services/adminApi.js';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    downloaded:   'bg-sky-500/15 text-sky-300 border-sky-500/30',
    contacted:    'bg-amber-500/15 text-amber-300 border-amber-500/30',
    pilot_active: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    deployed:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
};

export default function CampusLeadsManager() {
    const [leads, setLeads]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [query, setQuery]         = useState('');
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/deploy/leads`, {
                headers: { ...getFixedAdminAuthHeaders() }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data.leads)) {
                setLeads(data.leads);
            }
        } catch (_) {
            toast.error('Failed to load campus deployment leads');
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const handleStatusChange = async (id, status) => {
        try {
            const res = await fetch(`${apiBase}/deploy/leads/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getFixedAdminAuthHeaders()
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Update failed');
            setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
            toast.success('Lead status updated');
        } catch (_) {
            toast.error('Could not update lead status');
        }
    };

    const filtered = leads.filter(l => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
            String(l.collegeName || '').toLowerCase().includes(q) ||
            String(l.officialEmail || '').toLowerCase().includes(q) ||
            String(l.phone || '').toLowerCase().includes(q) ||
            String(l.osTarget || '').toLowerCase().includes(q) ||
            String(l.accelerator || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Building2 size={18} className="text-emerald-400" />
                        Enterprise Campus Installer Leads ({leads.length})
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Colleges and universities that configured and downloaded a custom iMentor on-premise installer from the landing page.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter college, email, OS, GPU..."
                            className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-teal-400"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={fetchLeads}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center gap-1.5"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-sm text-zinc-400 py-8 text-center">Loading campus deployment leads...</div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-400">
                    No campus installer downloads recorded yet.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/90 text-zinc-400 uppercase font-mono text-[11px]">
                            <tr>
                                <th className="p-3">Institution</th>
                                <th className="p-3">Contact</th>
                                <th className="p-3">OS / Hardware</th>
                                <th className="p-3">Recommended Engine & Capacity</th>
                                <th className="p-3">Bundle</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80">
                            {filtered.map((lead) => (
                                <tr key={lead._id} className="hover:bg-zinc-900/40">
                                    <td className="p-3">
                                        <div className="font-bold text-white">{lead.collegeName}</div>
                                        <div className="text-[11px] text-zinc-400">
                                            {lead.coordinatorName ? `${lead.coordinatorName} · ` : ''}
                                            {lead.studentCountEstimate} students · <span className="font-mono">{lead.campusDomain}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 space-y-1">
                                        {lead.officialEmail && (
                                            <div className="flex items-center gap-1 text-zinc-200">
                                                <Mail size={12} className="text-teal-400" /> {lead.officialEmail}
                                            </div>
                                        )}
                                        {lead.phone && (
                                            <div className="flex items-center gap-1 text-zinc-300">
                                                <Phone size={12} className="text-sky-400" /> {lead.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <div className="font-mono font-semibold text-sky-300">
                                            {lead.osTarget} / {lead.accelerator}
                                        </div>
                                        <div className="text-[11px] text-zinc-400">
                                            {lead.memoryTier} · {lead.connectivityMode}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-zinc-200 font-medium flex items-center gap-1">
                                            <Server size={12} className="text-emerald-400" /> {lead.recommendedModel}
                                        </div>
                                        <div className="text-[11px] text-emerald-400">
                                            {lead.concurrentClassSize} ({lead.estimatedTokPerSec})
                                        </div>
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-zinc-300">
                                        <div>{lead.bundleId}</div>
                                        <div className="text-zinc-500">
                                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            value={lead.status || 'downloaded'}
                                            onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold bg-zinc-900 ${STATUS_COLORS[lead.status || 'downloaded'] || ''}`}
                                        >
                                            <option value="downloaded">Downloaded</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="pilot_active">Pilot Active</option>
                                            <option value="deployed">Deployed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
