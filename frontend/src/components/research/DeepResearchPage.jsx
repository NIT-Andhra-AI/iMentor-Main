import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useRegularAuth } from '../../hooks/useAuth';
import { useAppState } from '../../contexts/AppStateContext';
import DeepResearchPanel from './DeepResearchPanel';
import { useDeepResearch } from '../../contexts/DeepResearchContext';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../core/Modal.jsx';
import Button from '../core/Button.jsx';
import { FileText, AlertCircle, Mic, MicOff, SlidersHorizontal, Check, ExternalLink } from 'lucide-react';
import { useWebSpeech } from '../../hooks/useWebSpeech';

const DeepResearchPage = () => {
    const navigate = useNavigate();
    const { user: regularUser, token: regularUserToken } = useRegularAuth();
    const { currentSessionId } = useAppState();

    const {
        setPipelineStage,
        handleResearchUpdate,
        resetResearch,
        setQuery: setContextQuery
    } = useDeepResearch();

    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [nature, setNature] = useState('academic');
    const [depthPreset, setDepthPreset] = useState('standard');
    const [customSourceCount, setCustomSourceCount] = useState(5);
    const [empiricalRatio, setEmpiricalRatio] = useState(0.5);
    
    // Scholar Filters
    const [showFilters, setShowFilters] = useState(false);
    const [providers, setProviders] = useState({
        openalex: true,
        arxiv: true,
        semanticScholar: true,
        web: true,
    });
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [strictPublishers, setStrictPublishers] = useState(true);

    // Voice input
    const { transcript, listening, isSpeechSupported, startListening, stopListening, resetTranscript } = useWebSpeech();

    // Local refs for data that will be pushed to context
    const [researchBundle, setResearchBundle] = useState(null);
    const [researchReport, setResearchReport] = useState(null);

    const [recentSessions, setRecentSessions] = useState([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const abortControllerRef = useRef(null);

    // Sync voice transcript with query input
    useEffect(() => {
        if (transcript) {
            setQuery(transcript);
        }
    }, [transcript]);

    const RECENT_RESEARCH_WINDOW_MS = 24 * 60 * 60 * 1000;

    const keepRecentWindow = (sessions) => {
        const now = Date.now();
        return sessions
            .filter((session) => {
                const createdAt = new Date(session.createdAt).getTime();
                return Number.isFinite(createdAt) && now - createdAt <= RECENT_RESEARCH_WINDOW_MS;
            })
            .slice(0, 5);
    };

    useEffect(() => {
        const fetchRecent = async () => {
            if (!regularUserToken) return;
            try {
                const data = await api.getResearchHistory();
                setRecentSessions(keepRecentWindow(data));
            } catch (err) {
                console.error("Recent sessions fetch error", err);
            }
        };
        fetchRecent();
    }, [regularUserToken]);

    const startResearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim() || isSearching) return;

        // Unified Context Reset & Init
        resetResearch();
        setContextQuery(query.trim());
        setPipelineStage('planning');

        // Local Trigger to change View
        setIsSearching(true);

        abortControllerRef.current = new AbortController();

        const effectiveSessionId = currentSessionId || `dr-${sessionStorage.getItem('temp_sessionId') || (() => {
            const newId = Math.random().toString(36).substring(7);
            sessionStorage.setItem('temp_sessionId', newId);
            return newId;
        })()}`;

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:2000/api'}/chat/message`;
        const targetCount = depthPreset === 'custom'
            ? Math.max(3, Number(customSourceCount) || 5)
            : depthPreset === 'standard' ? 8
            : depthPreset === 'deep' ? 15
            : 25;

        const payload = {
            query: query.trim(),
            sessionId: effectiveSessionId,
            deepResearchMode: true,
            useWebSearch: !!providers.web,
            useAcademicSearch: !!(providers.openalex || providers.arxiv || providers.semanticScholar),
            researchConfig: {
                nature,
                depthPreset,
                target_source_count: targetCount,
                empirical_ratio: Number(empiricalRatio),
                allow_adaptive_fallback: true,
                constraints: {
                    yearStart: yearStart ? Number(yearStart) : undefined,
                    yearEnd: yearEnd ? Number(yearEnd) : undefined,
                    trustedPublishersOnly: strictPublishers
                },
                enabledProviders: providers
            }
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${regularUserToken}`
                },
                body: JSON.stringify(payload),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Failed to start research');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    const jsonString = line.replace('data: ', '');
                    try {
                        const eventData = JSON.parse(jsonString);

                        // Handle Different Event Types
                        if (eventData.type === 'deep_research_update') {
                            handleResearchUpdate(eventData.content);
                        } else if (eventData.type === 'research_complete') {
                            const { researchBundle, researchReport } = eventData.content;

                            setResearchBundle(researchBundle);
                            setResearchReport(researchReport);

                            // Map metadata correctly from the bundle if it's not nested
                            const metaData = researchBundle?.meta || {
                                retrievalMode: researchBundle?.mode || 'HYBRID',
                                totalSources: researchBundle?.sources?.length || 0,
                                academicSources: researchBundle?.onlineSourceCount || 0,
                                webSources: 0,
                                confidenceScore: researchBundle?.overallConfidenceScore || 0,
                                confidenceExplanation: researchBundle?.confidenceMetrics?.explanation || '',
                                evidenceProfile: researchBundle?.evidenceProfile || null
                            };

                            // Push to context with correct destructuring
                            handleResearchUpdate({
                                phase: 'completed',
                                fullReport: researchReport,
                                metaData: metaData,
                                sourceData: researchBundle?.sources,
                                graphData: researchBundle?.citationGraphData
                            });

                            setIsSearching(false);
                            // Refresh history list
                            setRecentSessions(prev => [
                                { _id: researchBundle?._id || 'temp', title: query, query, createdAt: new Date() },
                                ...prev
                            ].slice(0, 5));

                            toast.success((t) => (
                                <span>
                                    Research Complete!
                                    <button
                                        onClick={() => { toast.dismiss(t.id); navigate('/tools/deep-research/history'); }}
                                        className="ml-2 underline text-xs font-bold"
                                    >
                                        View Library
                                    </button>
                                </span>
                            ));
                        } else if (eventData.type === 'error') {
                            toast.error(eventData.content || "Deep Research failed");
                            setPipelineStage('error');
                            setIsSearching(false);
                            return;
                        }
                    } catch (e) {
                        // console.error("Error parsing stream chunk", e);
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("Research failed:", error);
            toast.error(error.message || "Deep Research encountered a network error.");
            setPipelineStage('error');
            setIsSearching(false);
        }
    };

    // If not searching and no data, show Hero Input
    if (!isSearching && !researchReport && !researchBundle) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">

                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0A0A0A] to-[#0A0A0A]"></div>

                <div className="z-10 w-full max-w-2xl px-6">
                    <div className="mb-10 text-center">
                        <div className="inline-block px-3 py-1 mb-4 border border-[#333] rounded-full text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-[#111]">
                            Hybrid Knowledge Engine
                        </div>
                        <h1 className="text-5xl font-serif font-medium text-white mb-4 tracking-tight">
                            Deep Research
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
                            Conduct PhD-level analysis across academic journals, technical documentation, and real-time web sources.
                        </p>
                    </div>

                    <form onSubmit={startResearch} className="relative group" data-deep-research-tour="hero-input">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative bg-[#111] border border-[#333] rounded-xl overflow-hidden group-focus-within:border-gray-500 transition-colors">
                            <div className="relative">
                                <label htmlFor="deep-research-query" className="sr-only">Research Query</label>
                                <textarea
                                    id="deep-research-query"
                                    name="query"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            startResearch();
                                        }
                                    }}
                                    placeholder="What do you want to verify?"
                                    data-deep-research-tour="query-input"
                                    className="w-full bg-transparent p-6 pr-16 text-lg text-white placeholder:text-gray-600 outline-none resize-none min-h-[140px]"
                                />
                                {/* Voice Input Button */}
                                {isSpeechSupported && (
                                    <button
                                        type="button"
                                        onClick={listening ? stopListening : startListening}
                                        className={`absolute right-4 top-4 p-2.5 rounded-lg transition-all ${
                                            listening
                                                ? 'bg-red-500/20 text-red-400 animate-pulse'
                                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                        }`}
                                        title={listening ? 'Stop listening' : 'Voice input'}
                                        aria-label={listening ? 'Stop listening' : 'Voice input'}
                                    >
                                        {listening ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-3 bg-[#0f0f0f] border-t border-[#222]">
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium" data-deep-research-tour="depth-controls">
                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="deep-research-nature" className="text-[11px] uppercase tracking-wider text-gray-500">Nature</label>
                                        <select
                                            id="deep-research-nature"
                                            name="nature"
                                            value={nature}
                                            onChange={(e) => setNature(e.target.value)}
                                            className="bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                        >
                                            <option value="academic">Academic (Peer-Reviewed)</option>
                                            <option value="research">Exhaustive Ph.D.</option>
                                            <option value="general">General (Web + Whitepapers)</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="deep-research-depth" className="text-[11px] uppercase tracking-wider text-gray-500">Depth</label>
                                        <select
                                            id="deep-research-depth"
                                            name="depthPreset"
                                            value={depthPreset}
                                            onChange={(e) => setDepthPreset(e.target.value)}
                                            className="bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                        >
                                            <option value="standard">Standard (8 sources)</option>
                                            <option value="deep">Deep (15 sources)</option>
                                            <option value="extensive">Extensive (25 sources)</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        {depthPreset === 'custom' && (
                                            <input
                                                id="deep-research-custom-count"
                                                name="customSourceCount"
                                                type="number"
                                                min={3}
                                                max={60}
                                                value={customSourceCount}
                                                onChange={(e) => setCustomSourceCount(e.target.value)}
                                                className="w-16 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                                title="Custom source count"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <label htmlFor="deep-research-empirical" className="text-[11px] uppercase tracking-wider text-gray-500">Empirical %</label>
                                        <input
                                            id="deep-research-empirical"
                                            name="empiricalRatio"
                                            type="number"
                                            min={30}
                                            max={90}
                                            step={5}
                                            value={Math.round(empiricalRatio * 100)}
                                            onChange={(e) => setEmpiricalRatio(Math.max(0.3, Math.min(0.9, Number(e.target.value) / 100)))}
                                            className="w-16 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                            title="Empirical ratio percentage"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                                            showFilters ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-[#121212] text-gray-400 border-[#2a2a2a] hover:text-white'
                                        }`}
                                        title="Advanced Scholar Controls"
                                    >
                                        <SlidersHorizontal className="w-3 h-3" />
                                        Scholar Filters
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!query.trim()}
                                    data-deep-research-tour="start-button"
                                    className="px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Start Research
                                </button>
                            </div>

                            {/* Expandable Scholar Filters */}
                            {showFilters && (
                                <div className="p-4 bg-[#0a0a0a] border-t border-[#222] space-y-3 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Repositories:</span>
                                            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={providers.openalex}
                                                    onChange={(e) => setProviders(p => ({ ...p, openalex: e.target.checked }))}
                                                    className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                                />
                                                OpenAlex (IEEE, Nature, Elsevier, Springer)
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={providers.arxiv}
                                                    onChange={(e) => setProviders(p => ({ ...p, arxiv: e.target.checked }))}
                                                    className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                                />
                                                arXiv (Preprints)
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={providers.semanticScholar}
                                                    onChange={(e) => setProviders(p => ({ ...p, semanticScholar: e.target.checked }))}
                                                    className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                                />
                                                Semantic Scholar
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={providers.web}
                                                    onChange={(e) => setProviders(p => ({ ...p, web: e.target.checked }))}
                                                    className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                                />
                                                Authoritative Web
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1a1a1a]">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Publication Years:</span>
                                            <input
                                                type="number"
                                                placeholder="From (e.g. 2020)"
                                                value={yearStart}
                                                onChange={(e) => setYearStart(e.target.value)}
                                                className="w-28 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded placeholder:text-gray-600"
                                            />
                                            <span className="text-gray-600">—</span>
                                            <input
                                                type="number"
                                                placeholder="To (e.g. 2026)"
                                                value={yearEnd}
                                                onChange={(e) => setYearEnd(e.target.value)}
                                                className="w-28 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded placeholder:text-gray-600"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                                            <input
                                                type="checkbox"
                                                checked={strictPublishers}
                                                onChange={(e) => setStrictPublishers(e.target.checked)}
                                                className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                            />
                                            <span className="text-xs">Strict Peer-Reviewed Only (IEEE / Elsevier / Springer / Nature)</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>

                    <div className="mt-12 grid grid-cols-3 gap-4 text-center mb-12">
                        {[
                            { label: "Research Focus", val: nature === 'academic' ? "Peer-Reviewed Journals" : nature === 'research' ? "Exhaustive Ph.D." : "Hybrid Web + Whitepapers" },
                            { label: "Target Evidence", val: `${depthPreset === 'custom' ? customSourceCount : depthPreset === 'standard' ? 8 : depthPreset === 'deep' ? 15 : 25} Sources` },
                            { label: "Synthesis Rigor", val: `${Math.round(empiricalRatio * 100)}% Empirical Focus` }
                        ].map((stat, i) => (
                            <div key={i} className="p-4 border border-[#161616] rounded-lg bg-[#0F0F0F]">
                                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className="text-sm font-bold text-gray-300">{stat.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Research Widget */}
                    <div className="border-t border-[#1F1F1F] pt-8" data-deep-research-tour="recent-research">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Research</h3>
                            <button
                                onClick={() => navigate('/tools/deep-research/history')}
                                data-deep-research-tour="library-button"
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                View Library →
                            </button>
                        </div>
                        <div className="space-y-2">
                            {recentSessions.length === 0 ? (
                                <p className="text-xs text-gray-600 italic">No recent sessions found.</p>
                            ) : (
                                recentSessions.map(session => (
                                    <div
                                        key={session._id}
                                        onClick={() => navigate(`/tools/deep-research/view/${session._id}`)}
                                        className="flex items-center justify-between p-3 bg-[#111] border border-[#1F1F1F] rounded hover:border-gray-600 cursor-pointer transition-colors group"
                                    >
                                        <span className="text-sm text-gray-300 truncate max-w-[300px] group-hover:text-white">
                                            {session.title || session.query}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                    ← Back to Dashboard
                </button>

                {/* Top Right Action Buttons */}
                <div className="absolute top-6 right-6 flex items-center gap-2">
                    <button
                        onClick={() => navigate('/tools/deep-research/history')}
                        data-deep-research-tour="library-button"
                        className="flex items-center px-4 py-2 bg-[#1F1F1F] text-gray-300 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-700 transition-colors"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Library
                    </button>
                </div>

                <Modal
                    isOpen={isErrorModalOpen}
                    onClose={() => setIsErrorModalOpen(false)}
                    title="Service Interruption"
                >
                    <div className="flex flex-col items-center text-center p-2">
                        <div className="bg-red-500/10 p-4 rounded-full mb-4">
                            <AlertCircle className="text-red-500" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Deep Research Busy</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            The Deep Research engine is currently handling multiple complex queries.
                            Please wait a moment before trying again, or try a shorter query.
                        </p>
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => setIsErrorModalOpen(false)}
                        >
                            Understood
                        </Button>
                    </div>
                </Modal>

            </div >
        );
    }

    // Active Research UI
    return (
        <DeepResearchPanel
            onToggleMode={() => {
                // Exit logic
                resetResearch();
                setIsSearching(false);
                setQuery('');
            }}
        />
    );
};

export default DeepResearchPage;
