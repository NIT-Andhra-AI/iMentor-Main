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
import {
    FileText, AlertCircle, Mic, MicOff, SlidersHorizontal,
    Compass, Sparkles, BookOpen, CheckCircle2, Copy, Play, Plus, X
} from 'lucide-react';
import { useWebSpeech } from '../../hooks/useWebSpeech';

const DeepResearchPage = () => {
    const navigate = useNavigate();
    const { token: regularUserToken } = useRegularAuth();
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
    const [depthPreset, setDepthPreset] = useState('deep');
    const [customSourceCount, setCustomSourceCount] = useState(18);
    const [empiricalRatio, setEmpiricalRatio] = useState(0.75);

    // Interactive PhD Strategy Blueprint State
    const [isStrategizing, setIsStrategizing] = useState(false);
    const [strategyPlan, setStrategyPlan] = useState(null);
    const [newKeywordInput, setNewKeywordInput] = useState('');
    const [seedPapers, setSeedPapers] = useState([]);
    const [newSeedInput, setNewSeedInput] = useState('');
    const [refineInstruction, setRefineInstruction] = useState('');
    const [isRefiningPlan, setIsRefiningPlan] = useState(false);

    // Scholar Filters
    const [showFilters, setShowFilters] = useState(false);
    const [providers, setProviders] = useState({
        openalex: true,
        arxiv: true,
        semanticScholar: true,
        googleScholar: true,
        europePmc: true,
        institutionalPdf: true,
        web: true,
    });
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [strictPublishers, setStrictPublishers] = useState(true);

    // Voice input
    const { transcript, listening, isSpeechSupported, startListening, stopListening } = useWebSpeech();

    const [researchBundle, setResearchBundle] = useState(null);
    const [researchReport, setResearchReport] = useState(null);

    const [recentSessions, setRecentSessions] = useState([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (transcript) {
            setQuery(transcript);
        }
    }, [transcript]);

    const RECENT_RESEARCH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

    const keepRecentWindow = (sessions) => {
        if (!Array.isArray(sessions)) return [];
        const now = Date.now();
        return sessions
            .filter((session) => {
                const createdAt = new Date(session.createdAt).getTime();
                return Number.isFinite(createdAt) && now - createdAt <= RECENT_RESEARCH_WINDOW_MS;
            })
            .slice(0, 6);
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

    const handleStrategize = async () => {
        if (!query.trim() || isStrategizing) return;
        setIsStrategizing(true);
        const toastId = toast.loading('Deconstructing research query, Boolean strings & PhD framing...');
        try {
            const depthMap = { standard: 'low', deep: 'medium', extensive: 'high', custom: 'high' };
            const res = await api.strategizeResearch({
                query: query.trim(),
                nature,
                depth: depthMap[depthPreset] || 'medium'
            });
            if (res?.data) {
                setStrategyPlan(res.data);
                toast.success('PhD Research Strategy Blueprint ready for review!', { id: toastId });
            } else {
                throw new Error('Could not generate strategy blueprint.');
            }
        } catch (err) {
            console.error('Strategize error:', err);
            toast.error(err.message || 'Failed to generate research strategy.', { id: toastId });
        } finally {
            setIsStrategizing(false);
        }
    };

    const handleBooleanStringEdit = (engineKey, value) => {
        setStrategyPlan(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                keywordTaxonomy: {
                    ...(prev.keywordTaxonomy || {}),
                    booleanSearchStrings: {
                        ...(prev.keywordTaxonomy?.booleanSearchStrings || {}),
                        [engineKey]: value
                    }
                }
            };
        });
    };

    const handleAddPrimaryKeyword = () => {
        const kw = newKeywordInput.trim();
        if (!kw || !strategyPlan) return;
        setStrategyPlan(prev => ({
            ...prev,
            keywordTaxonomy: {
                ...(prev.keywordTaxonomy || {}),
                primaryKeywords: [...new Set([...(prev.keywordTaxonomy?.primaryKeywords || []), kw])]
            }
        }));
        setNewKeywordInput('');
    };


    const handleAddSeedPaper = () => {
        const s = newSeedInput.trim();
        if (!s) return;
        setSeedPapers(prev => [...new Set([...prev, s])].slice(0, 6));
        setNewSeedInput('');
        toast.success('Seed paper added as citation snowball anchor!');
    };

    const handleRemoveSeedPaper = (seedToRemove) => {
        setSeedPapers(prev => prev.filter(s => s !== seedToRemove));
    };

    const handleRefineStrategyWithAI = async (customInstruction = null) => {
        const instr = (customInstruction ?? refineInstruction).trim();
        if (!instr || !strategyPlan || isRefiningPlan) return;
        setIsRefiningPlan(true);
        const toastId = toast.loading('Updating PhD Strategy & Boolean Search Matrix...');
        try {
            const depthMap = { standard: 'low', deep: 'medium', extensive: 'high', custom: 'high' };
            const res = await api.refineResearchStrategy(
                query.trim(),
                strategyPlan,
                instr,
                seedPapers,
                nature,
                depthMap[depthPreset] || 'medium'
            );
            if (res?.data) {
                setStrategyPlan(res.data);
                setRefineInstruction('');
                toast.success('Strategy Blueprint updated!', { id: toastId });
            }
        } catch (err) {
            console.error('Refine strategy error:', err);
            toast.error('Failed to refine strategy.', { id: toastId });
        } finally {
            setIsRefiningPlan(false);
        }
    };

    const handleRemovePrimaryKeyword = (kwToRemove) => {
        setStrategyPlan(prev => ({
            ...prev,
            keywordTaxonomy: {
                ...(prev.keywordTaxonomy || {}),
                primaryKeywords: (prev.keywordTaxonomy?.primaryKeywords || []).filter(k => k !== kwToRemove)
            }
        }));
    };

    const startResearch = async (e, approvedBlueprint = null) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!query.trim() || isSearching) return;

        resetResearch();
        setContextQuery(query.trim());
        setPipelineStage('planning');
        setIsSearching(true);

        abortControllerRef.current = new AbortController();

        const effectiveSessionId = currentSessionId || `dr-${sessionStorage.getItem('temp_sessionId') || (() => {
            const newId = Math.random().toString(36).substring(7);
            sessionStorage.setItem('temp_sessionId', newId);
            return newId;
        })()}`;

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/chat/message`;
        const targetCount = depthPreset === 'custom'
            ? Math.max(5, Number(customSourceCount) || 15)
            : depthPreset === 'standard' ? 10
            : depthPreset === 'deep' ? 18
            : 28;

        const payload = {
            query: query.trim(),
            sessionId: effectiveSessionId,
            deepResearchMode: true,
            useWebSearch: !!providers.web,
            useAcademicSearch: true,
            researchConfig: {
                nature,
                depthPreset,
                depth: depthPreset === 'extensive' ? 'high' : (depthPreset === 'standard' ? 'low' : 'medium'),
                target_source_count: targetCount,
                empirical_ratio: Number(empiricalRatio),
                allow_adaptive_fallback: true,
                approvedPlan: approvedBlueprint || strategyPlan || undefined,
                seedPapers: seedPapers.length > 0 ? seedPapers : undefined,
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
            let sseBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });
                const parts = sseBuffer.split('\n\n');
                sseBuffer = parts.pop() || '';

                for (const line of parts) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    const jsonString = trimmed.replace(/^data:\s*/, '');
                    try {
                        const eventData = JSON.parse(jsonString);

                        if (eventData.type === 'deep_research_update') {
                            handleResearchUpdate(eventData.content);
                        } else if (eventData.type === 'research_complete') {
                            const { researchBundle: bundle, researchReport: report, savedDocId } = eventData.content;
                            const reportId = savedDocId || bundle?._id || report?.reportId || null;
                            if (report && reportId) report.reportId = String(reportId);

                            setResearchBundle(bundle);
                            setResearchReport(report);

                            const metaData = bundle?.meta || {
                                reportId: reportId ? String(reportId) : null,
                                retrievalMode: bundle?.mode || 'HYBRID',
                                totalSources: bundle?.sources?.length || 0,
                                academicSources: bundle?.onlineSourceCount || 0,
                                fullTextSources: bundle?.evidenceProfile?.fullTextSources || 0,
                                webSources: 0,
                                confidenceScore: bundle?.overallConfidenceScore || 0,
                                confidenceExplanation: bundle?.confidenceMetrics?.explanation || '',
                                evidenceProfile: bundle?.evidenceProfile || null
                            };

                            handleResearchUpdate({
                                phase: 'completed',
                                fullReport: report,
                                metaData: metaData,
                                sourceData: report?.sourcesUsed || bundle?.sources,
                                graphData: bundle?.citationGraphData
                            });

                            setIsSearching(false);
                            setRecentSessions(prev => [
                                { _id: reportId || 'temp', title: report?.title || query, query, createdAt: new Date() },
                                ...prev
                            ].slice(0, 6));

                            toast.success((t) => (
                                <span>
                                    PhD Literature Review Complete!
                                    <button
                                        onClick={() => {
                                            toast.dismiss(t.id);
                                            if (reportId) navigate(`/tools/deep-research/view/${reportId}`);
                                            else navigate('/tools/deep-research/history');
                                        }}
                                        className="ml-2 underline text-xs font-bold text-blue-400"
                                    >
                                        Open Full Report
                                    </button>
                                </span>
                            ));
                        } else if (eventData.type === 'error') {
                            toast.error(eventData.content || "Deep Research failed");
                            setPipelineStage('error');
                            setIsSearching(false);
                            return;
                        }
                    } catch (_) {}
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

    if (!isSearching && !researchReport && !researchBundle) {
        const pd = strategyPlan?.problemDeconstruction || {};
        const kt = strategyPlan?.keywordTaxonomy || {};
        const sfb = strategyPlan?.sentenceFramingBank || {};

        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-start py-16 relative overflow-y-auto font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none"></div>

                <div className="z-10 w-full max-w-4xl px-6">
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 border border-blue-500/30 rounded-full text-[10px] uppercase tracking-widest text-blue-400 font-bold bg-blue-950/20">
                            <Sparkles className="w-3 h-3" />
                            PhD Literature Review &amp; Institutional Full-Text Engine
                        </div>
                        <h1 className="text-5xl font-serif font-medium text-white mb-3 tracking-tight">
                            Deep Research Assistant
                        </h1>
                        <p className="text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
                            Deconstruct complex research queries, formulate Boolean search matrices across OpenAlex, Semantic Scholar, Google Scholar &amp; arXiv, harvest full-text PDFs via NIT-AP Institutional Access, and synthesize side-by-side comparison matrices.
                        </p>
                    </div>

                    <form onSubmit={(e) => startResearch(e)} className="relative group" data-deep-research-tour="hero-input">
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
                                            startResearch(e);
                                        }
                                    }}
                                    placeholder="Enter your PhD research topic or literature review question (e.g., 'Physics-informed neural networks vs transformer architectures for lithium-ion battery state-of-health estimation under fast-charging regimes')..."
                                    data-deep-research-tour="query-input"
                                    className="w-full bg-transparent p-6 pr-16 text-base text-white placeholder:text-gray-600 outline-none resize-none min-h-[130px]"
                                />
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
                                            <option value="academic">Academic (Peer-Reviewed Q1)</option>
                                            <option value="research">Exhaustive Ph.D. Review</option>
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
                                            <option value="standard">Standard (10 sources)</option>
                                            <option value="deep">Deep PhD (18 sources + Full-Text PDFs)</option>
                                            <option value="extensive">Extensive Survey (28 sources + Full-Text PDFs)</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        {depthPreset === 'custom' && (
                                            <input
                                                id="deep-research-custom-count"
                                                name="customSourceCount"
                                                type="number"
                                                min={5}
                                                max={60}
                                                value={customSourceCount}
                                                onChange={(e) => setCustomSourceCount(e.target.value)}
                                                className="w-16 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                            />
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                                            showFilters ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-[#121212] text-gray-400 border-[#2a2a2a] hover:text-white'
                                        }`}
                                    >
                                        <SlidersHorizontal className="w-3 h-3" />
                                        Scholar Filters
                                    </button>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        disabled={!query.trim() || isStrategizing}
                                        onClick={handleStrategize}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-lg disabled:opacity-40 transition-colors"
                                        title="Deconstruct query, generate Boolean strings & preview PhD strategy before running"
                                    >
                                        <Compass className="w-3.5 h-3.5" />
                                        {isStrategizing ? 'Strategizing...' : 'Strategize & Preview Plan'}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!query.trim()}
                                        data-deep-research-tour="start-button"
                                        className="flex items-center gap-1.5 px-5 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-black" />
                                        Start Research
                                    </button>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="p-4 bg-[#0a0a0a] border-t border-[#222] space-y-3 text-xs">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Discovery &amp; OA Collation:</span>
                                        {[
                                            { key: 'openalex', label: 'OpenAlex OA + Q1 (IEEE, Elsevier, Springer, Nature)' },
                                            { key: 'semanticScholar', label: 'Semantic Scholar Bulk + 1-Hop Snowballing' },
                                            { key: 'googleScholar', label: 'Google Scholar + DBLP + OpenReview' },
                                            { key: 'europePmc', label: 'EuropePMC Open-Access Corpus' },
                                            { key: 'arxiv', label: 'arXiv Preprints' },
                                            { key: 'institutionalPdf', label: 'NIT-AP Institutional Full-Text PDF Harvester' },
                                            { key: 'web', label: 'Authoritative Web & Technical Reports' }
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-1.5 cursor-pointer text-gray-300 hover:text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={!!providers[item.key]}
                                                    onChange={(e) => setProviders(p => ({ ...p, [item.key]: e.target.checked }))}
                                                    className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                                />
                                                {item.label}
                                            </label>
                                        ))}
                                    </div>


                                    {/* Seed Paper Anchoring (DOI / arXiv / Title) */}
                                    <div className="pt-3 border-t border-[#1a1a1a] space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                                                Anchor with Seed Papers (DOIs, arXiv IDs, or Seminal Paper Titles):
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                                <input
                                                    type="text"
                                                    value={newSeedInput}
                                                    onChange={(e) => setNewSeedInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSeedPaper(); } }}
                                                    placeholder="e.g. 10.1109/TIE.2023.12345 or arXiv:2305.14201 or paper title..."
                                                    className="flex-1 bg-[#121212] border border-[#2a2a2a] text-gray-200 text-xs px-2.5 py-1 rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddSeedPaper}
                                                    className="px-2.5 py-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded text-xs font-semibold hover:bg-emerald-600/30"
                                                >
                                                    + Add Seed
                                                </button>
                                            </div>
                                        </div>
                                        {seedPapers.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {seedPapers.map((sp, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-full text-[11px]">
                                                        🌱 {sp}
                                                        <button type="button" onClick={() => handleRemoveSeedPaper(sp)} className="hover:text-white">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1a1a1a]">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Publication Years:</span>
                                            <input
                                                type="number"
                                                placeholder="From (e.g. 2019)"
                                                value={yearStart}
                                                onChange={(e) => setYearStart(e.target.value)}
                                                className="w-28 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                            />
                                            <span className="text-gray-600">—</span>
                                            <input
                                                type="number"
                                                placeholder="To (e.g. 2026)"
                                                value={yearEnd}
                                                onChange={(e) => setYearEnd(e.target.value)}
                                                className="w-28 bg-[#121212] border border-[#2a2a2a] text-gray-300 text-xs px-2 py-1 rounded"
                                            />
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                                            <input
                                                type="checkbox"
                                                checked={strictPublishers}
                                                onChange={(e) => setStrictPublishers(e.target.checked)}
                                                className="rounded bg-[#1a1a1a] border-gray-700 text-blue-500 focus:ring-0"
                                            />
                                            <span className="text-xs">Prioritize Q1 Peer-Reviewed &amp; Verified Open-Access Repositories</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* INTERACTIVE PHD STRATEGY BLUEPRINT WORKBENCH */}
                    {strategyPlan && (
                        <div className="mt-8 bg-[#0E1116] border border-blue-500/30 rounded-xl p-6 space-y-6 shadow-2xl animate-in fade-in duration-300">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2631] pb-4">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                                        <Compass className="w-4 h-4" />
                                        Phase 1 — PhD Research Strategy &amp; Boolean Search Blueprint
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Review or customize your deconstructed dimensions, keywords, and Boolean search strings before launching full-text harvesting.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStrategyPlan(null)}
                                        className="px-3 py-1.5 bg-[#181B20] hover:bg-[#22262E] text-gray-400 hover:text-white rounded text-xs"
                                    >
                                        Close Preview
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => startResearch(e, strategyPlan)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve Plan &amp; Harvest Full-Text Papers →
                                    </button>
                                </div>
                            </div>

                            {/* 1. Problem Deconstruction Grid */}
                            {pd && (
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                                        1. PICO / STEM Research Problem Deconstruction
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                        {[
                                            { label: 'Core Phenomenon / System', val: pd.corePhenomenonOrSystem, color: 'border-blue-500/30' },
                                            { label: 'Methodological Focus', val: pd.methodologicalFocus, color: 'border-emerald-500/30' },
                                            { label: 'Competing / Baseline Paradigms', val: pd.baselineParadigms, color: 'border-purple-500/30' },
                                            { label: 'Target Metrics & Datasets', val: pd.evaluationMetricsAndDatasets, color: 'border-amber-500/30' },
                                            { label: 'Boundary Constraints & Regimes', val: pd.keyConstraintsAndRegimes, color: 'border-rose-500/30' },
                                            { label: 'Recommended Review Taxonomy', val: pd.recommendedTaxonomy, color: 'border-cyan-500/30' }
                                        ].map((card, idx) => (
                                            <div key={idx} className={`bg-[#0A0C10] border ${card.color} rounded-lg p-3`}>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{card.label}</div>
                                                <div className="text-gray-200 leading-relaxed">{card.val || 'Specified in query'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Primary Keywords & Synonym Clusters */}
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        2. Primary Keywords &amp; Controlled Vocabulary (IEEE / ACM / MeSH)
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={newKeywordInput}
                                            onChange={(e) => setNewKeywordInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrimaryKeyword(); } }}
                                            placeholder="Add custom keyword..."
                                            className="bg-[#0A0C10] border border-[#262B35] rounded px-2.5 py-1 text-xs text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddPrimaryKeyword}
                                            className="px-2.5 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded text-xs flex items-center gap-1 hover:bg-blue-600/30"
                                        >
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(kt.primaryKeywords || []).map((kw, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-xs">
                                            {kw}
                                            <button type="button" onClick={() => handleRemovePrimaryKeyword(kw)} className="hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {(kt.controlledVocabulary || []).map((cv, i) => (
                                        <span key={`cv-${i}`} className="inline-flex items-center px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full text-xs">
                                            {cv}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 3. Editable Boolean Search Strings */}
                            {kt.booleanSearchStrings && (
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        3. Multi-Engine Boolean Search Matrix (Editable)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(kt.booleanSearchStrings).map(([engine, bStr]) => (
                                            <div key={engine} className="bg-[#0A0C10] border border-[#1E2631] rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{engine}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => { navigator.clipboard.writeText(bStr); toast.success(`Copied ${engine} query!`); }}
                                                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                                                    >
                                                        <Copy className="w-3 h-3" /> Copy
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={bStr}
                                                    onChange={(e) => handleBooleanStringEdit(engine, e.target.value)}
                                                    className="w-full bg-[#11151C] border border-[#252D3A] rounded px-2.5 py-1.5 text-xs font-mono text-gray-200"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Academic Sentence Framing Preview */}
                            {sfb && (
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        4. Academic Sentence Framing Templates for Literature Review Drafting
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        {[
                                            { key: 'problemStatementFramings', title: 'Problem Statement Framing' },
                                            { key: 'comparativeSynthesisFramings', title: 'Cross-Paper Comparative Framing' },
                                            { key: 'critiqueAndLimitationFramings', title: 'Methodological Critique Framing' },
                                            { key: 'researchGapAndContributionFramings', title: 'Research Gap & Contribution Framing' }
                                        ].map(group => {
                                            const items = sfb[group.key] || [];
                                            if (!items.length) return null;
                                            return (
                                                <div key={group.key} className="bg-[#0A0C10] border border-[#1E2631] rounded-lg p-3 space-y-1.5">
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{group.title}</div>
                                                    {items.slice(0, 2).map((tpl, idx) => (
                                                        <p key={idx} className="text-gray-300 italic text-[11px] leading-relaxed">
                                                            "{tpl}"
                                                        </p>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-10">
                        {[
                            { label: "Discovery Engines", val: "OpenAlex + S2 + GS + arXiv" },
                            { label: "Full-Text Access", val: "OA + NIT-AP Institutional Net" },
                            { label: "Target Evidence", val: `${depthPreset === 'custom' ? customSourceCount : depthPreset === 'standard' ? 10 : depthPreset === 'deep' ? 18 : 28} Papers + Snowballing` },
                            { label: "Scholarly Outputs", val: "PDF, DOCX, LaTeX, CSV & ZIP" }
                        ].map((stat, i) => (
                            <div key={i} className="p-4 border border-[#161616] rounded-lg bg-[#0F0F0F]">
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className="text-xs font-bold text-gray-200">{stat.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Research Widget */}
                    <div className="border-t border-[#1F1F1F] pt-8" data-deep-research-tour="recent-research">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Literature Reviews</h3>
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
                                        <span className="text-sm text-gray-300 truncate max-w-[450px] group-hover:text-white">
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

                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                    ← Back to Dashboard
                </button>

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
                            Please wait a moment before trying again.
                        </p>
                        <Button variant="primary" className="w-full" onClick={() => setIsErrorModalOpen(false)}>
                            Understood
                        </Button>
                    </div>
                </Modal>
            </div>
        );
    }

    return (
        <DeepResearchPanel
            onToggleMode={() => {
                resetResearch();
                setIsSearching(false);
                setResearchBundle(null);
                setResearchReport(null);
                setQuery('');
            }}
        />
    );
};

export default DeepResearchPage;
