// frontend/src/components/placements/PlacementsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Search,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Timer,
  Award,
  ArrowLeft,
  BookOpen,
  Send,
  Building2,
  Terminal,
  Zap,
  Flame,
  Check,
  Copy,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PlacementsPage() {
  const navigate = useNavigate();

  // State
  const [sector, setSector] = useState('IT'); // 'IT' or 'Core'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState('google');
  const [companyDetails, setCompanyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow', 'oa_pattern', 'questions', 'community', 'practice'
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [activeCodeLang, setActiveCodeLang] = useState('cpp'); // 'cpp', 'python', 'java'
  const [copiedCode, setCopiedCode] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCompanies: 8,
    itCompaniesCount: 5,
    coreCompaniesCount: 3,
    totalSolvedQuestions: 15,
    lastUpdatedYear: '2025–2026 Cohort'
  });

  // Copilot State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState([]);

  // NIT AP EEE Opportunities State
  const [nitApEeeData, setNitApEeeData] = useState(null);
  const [showNitApModal, setShowNitApModal] = useState(false);

  // Fetch Stats & Companies & NIT AP EEE Opportunities
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const statsData = await api.getPlacementStats();
        if (statsData) setStats(statsData);

        const nitApRes = await api.getNitApEeeOpportunities();
        if (nitApRes) setNitApEeeData(nitApRes);

        const res = await api.getPlacementCompanies(sector, searchQuery);
        if (res && res.companies && res.companies.length > 0) {
          setCompanies(res.companies);
          // Check if current selected company belongs to newly fetched sector
          const exists = res.companies.some((c) => c.id === selectedCompanyId);
          if (!exists) {
            setSelectedCompanyId(res.companies[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load placement data', err);
        toast.error('Failed to load placement knowledge base.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [sector, searchQuery]);

  // Fetch Selected Company Details
  useEffect(() => {
    if (!selectedCompanyId) return;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const res = await api.getPlacementCompanyDetails(selectedCompanyId);
        if (res && res.company) {
          setCompanyDetails(res.company);
          setSelectedQuestionIndex(0);
        }
      } catch (err) {
        console.error('Failed to load company details', err);
        toast.error('Could not fetch company interview blueprint.');
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [selectedCompanyId]);

  // Filtered companies based on search and category
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchCategory =
        selectedCategory === 'ALL' ||
        c.category.toUpperCase().includes(selectedCategory.toUpperCase());

      return matchSearch && matchCategory;
    });
  }, [companies, searchQuery, selectedCategory]);

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAskCopilot = async (e) => {
    e?.preventDefault();
    if (!copilotQuery.trim()) return;

    const userPrompt = copilotQuery;
    setCopilotQuery('');
    setCopilotLoading(true);

    const userMsg = { role: 'user', content: userPrompt };
    setCopilotHistory((prev) => [...prev, userMsg]);

    try {
      const res = await api.askPlacementCopilot({
        query: userPrompt,
        companyId: selectedCompanyId
      });
      if (res && res.reply) {
        setCopilotHistory((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply }
        ]);
      }
    } catch (err) {
      toast.error('Copilot response error');
      setCopilotHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach placement copilot. Please try again.'
        }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-gray-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b border-gray-800 bg-[#161b22] px-6 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 transition"
            title="Back to Learning Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 text-black">
              <Briefcase size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Placement Readiness & Company Intelligence
                </h1>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                  2025–2026 Cohort
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Synthesized from Reddit (r/developersIndia), LeetCode Discuss, GeeksforGeeks & Quora
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics & NIT AP EEE Hub Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNitApModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-indigo-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Zap size={14} className="text-amber-400 animate-pulse" />
            <span>⚡ NIT AP EEE Internships & Jobs</span>
            <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {nitApEeeData?.totalOpportunities || 6} Live
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-4 bg-gray-800/80 border border-gray-700/80 px-4 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Building2 size={14} className="text-cyan-400" />
              <span><strong>{stats.totalCompanies}</strong> Companies</span>
            </div>
            <div className="h-3 w-[1px] bg-gray-700"></div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Code2 size={14} className="text-emerald-400" />
              <span><strong>{stats.totalSolvedQuestions}+</strong> Solved Questions</span>
            </div>
            <div className="h-3 w-[1px] bg-gray-700"></div>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <TrendingUp size={14} />
              <span>Real OA Patterns</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Sector Selector & Company Tabs */}
        <aside className="w-80 border-r border-gray-800 bg-[#161b22]/90 flex flex-col flex-shrink-0">
          {/* Dual Sector Switcher (Core vs IT) */}
          <div className="p-4 border-b border-gray-800">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Select Sector
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 rounded-xl border border-gray-800">
              <button
                onClick={() => {
                  setSector('IT');
                  setSelectedCompanyId('google');
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  sector === 'IT'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code2 size={15} />
                <span>IT / Software</span>
              </button>
              <button
                onClick={() => {
                  setSector('Core');
                  setSelectedCompanyId('texas_instruments');
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  sector === 'Core'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Cpu size={15} />
                <span>Core Engg</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={`Search ${sector} companies, tags, roles...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700/70 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Company List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-xs">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mb-2"></div>
                Loading companies...
              </div>
            )}

            {!loading && filteredCompanies.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-500">
                <AlertCircle className="mx-auto mb-2 opacity-50" size={24} />
                No companies match your search.
              </div>
            )}

            {!loading &&
              filteredCompanies.map((c) => {
                const isSelected = selectedCompanyId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompanyId(c.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-gray-900/60 border-gray-800 hover:bg-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-gray-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                      {c.logo ? (
                        <img
                          src={c.logo}
                          alt={c.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-indigo-300' : 'text-gray-200'
                          }`}
                        >
                          {c.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                          {c.ctcRange.split('(')[0].trim()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {c.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                        <span>{c.roundsCount} Rounds</span>
                        <span>&bull;</span>
                        <span>{c.questionsCount} Solved Qs</span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
          {detailsLoading && (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
              Synthesizing placement intelligence & interview blueprints...
            </div>
          )}

          {!detailsLoading && companyDetails && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Company Header Card */}
              <div className="p-6 border-b border-gray-800 bg-[#161b22]/70 flex-shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gray-700 flex items-center justify-center p-2 flex-shrink-0">
                      {companyDetails.logo ? (
                        <img
                          src={companyDetails.logo}
                          alt={companyDetails.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 size={28} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-white">
                          {companyDetails.name}
                        </h2>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-medium">
                          {companyDetails.category}
                        </span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-medium">
                          {companyDetails.ctcRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        <strong>Target Roles:</strong> {companyDetails.roles.join(' | ')}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <strong>Locations:</strong> {companyDetails.locations.join(', ')} &bull;{' '}
                        <strong>Eligibility:</strong> {companyDetails.eligibilityCriteria}
                      </p>
                    </div>
                  </div>

                  {/* Tags Pill */}
                  <div className="flex flex-wrap gap-1.5 max-w-sm">
                    {companyDetails.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 5-Tab Navigation */}
                <div className="flex items-center gap-2 mt-5 border-t border-gray-800 pt-3">
                  <button
                    onClick={() => setActiveTab('workflow')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeTab === 'workflow'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Layers size={14} />
                    <span>Hiring Process (2025–2026)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('oa_pattern')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeTab === 'oa_pattern'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Timer size={14} />
                    <span>OA Pattern & Syllabus</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeTab === 'questions'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Code2 size={14} />
                    <span>Real Interview Questions ({companyDetails.realQuestions2025.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('community')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeTab === 'community'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <MessageSquare size={14} />
                    <span>Reddit & GFG Debriefs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('practice')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      activeTab === 'practice'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>AI Placement Co-Pilot</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* TAB 1: HIRING WORKFLOW */}
                {activeTab === 'workflow' && (
                  <div className="space-y-4 max-w-4xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Complete Interview Round-by-Round Breakdown
                      </h3>
                      <span className="text-xs text-gray-400">
                        {companyDetails.hiringWorkflow.length} Stage Evaluation Pipeline
                      </span>
                    </div>

                    <div className="space-y-4">
                      {companyDetails.hiringWorkflow.map((step) => (
                        <div
                          key={step.roundNumber}
                          className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 shadow-sm hover:border-gray-700 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                                {step.roundNumber}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {step.roundName}
                                </h4>
                                <span className="text-[11px] text-gray-400">
                                  {step.type} &bull; <strong>Duration:</strong> {step.duration} &bull; <strong>Platform:</strong> {step.platform}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                            {step.description}
                          </p>

                          <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-gray-400 font-semibold">Key Topics:</span>
                              {step.keyFocusAreas.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-gray-800/90 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                            <strong>💡 Pro-Tip for this round:</strong> {step.clearingTips}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: OA PATTERN & SYLLABUS */}
                {activeTab === 'oa_pattern' && companyDetails.oaPattern && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-base font-bold text-white mb-1">
                        Online Assessment (OA) Blueprint & Passing Criteria
                      </h3>
                      <p className="text-xs text-gray-400 mb-6">
                        Verified online screening format for 2025/2026 on-campus and off-campus test drives.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                          <span className="text-xs text-gray-400 block mb-1">Test Duration</span>
                          <span className="text-xl font-bold text-cyan-400">
                            {companyDetails.oaPattern.durationMin} Mins
                          </span>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                          <span className="text-xs text-gray-400 block mb-1">Total Questions</span>
                          <span className="text-xl font-bold text-amber-400">
                            {companyDetails.oaPattern.totalQuestions} Questions
                          </span>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                          <span className="text-xs text-gray-400 block mb-1">Estimated Cutoff</span>
                          <span className="text-xs font-semibold text-emerald-400 leading-tight block mt-1">
                            {companyDetails.oaPattern.cutoffEstimate}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                        Sectional Distribution & Weightage
                      </h4>
                      <div className="space-y-3 mb-6">
                        {companyDetails.oaPattern.sections.map((sec, idx) => (
                          <div key={idx} className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-white">{sec.sectionName}</span>
                              <p className="text-[11px] text-gray-400">{sec.description} ({sec.count} Questions)</p>
                            </div>
                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                              {sec.weightage}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                          <span className="font-semibold text-gray-300 block mb-1">🔒 Proctoring Rules:</span>
                          <p className="text-gray-400 leading-relaxed">{companyDetails.oaPattern.proctoringRules}</p>
                        </div>
                        <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                          <span className="font-semibold text-gray-300 block mb-1">⚖️ Negative Marking:</span>
                          <p className="text-gray-400 leading-relaxed">{companyDetails.oaPattern.negativeMarking}</p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
                        <span className="text-xs font-bold text-indigo-300 block mb-1">📚 Recommended Preparation Syllabus:</span>
                        <p className="text-xs text-indigo-200 leading-relaxed">{companyDetails.oaPattern.syllabus}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: REAL INTERVIEW QUESTIONS */}
                {activeTab === 'questions' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Question List Sidebar */}
                    <div className="lg:col-span-4 space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Authentic 2025/2026 Solved Questions
                      </h4>
                      {companyDetails.realQuestions2025.map((q, idx) => {
                        const isQSelected = selectedQuestionIndex === idx;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setSelectedQuestionIndex(idx)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                              isQSelected
                                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                                : 'bg-[#161b22] border-gray-800 text-gray-300 hover:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  q.difficulty === 'Hard'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                                {q.category}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold line-clamp-2 mt-1">
                              {q.title}
                            </h5>
                          </button>
                        );
                      })}
                    </div>

                    {/* Question Detail & Multi-language Code Viewer */}
                    <div className="lg:col-span-8 space-y-4">
                      {(() => {
                        const q = companyDetails.realQuestions2025[selectedQuestionIndex] || companyDetails.realQuestions2025[0];
                        if (!q) return null;

                        const codeToShow =
                          activeCodeLang === 'cpp'
                            ? q.codeCpp
                            : activeCodeLang === 'python'
                            ? q.codePython
                            : q.codeJava;

                        return (
                          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      q.difficulty === 'Hard'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-amber-500/20 text-amber-300'
                                    }`}
                                  >
                                    {q.difficulty}
                                  </span>
                                  <span className="text-xs text-gray-400">{q.category}</span>
                                </div>
                                <h3 className="text-base font-bold text-white mt-1.5">{q.title}</h3>
                              </div>
                              <span className="text-[11px] text-gray-400 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                                📌 Source: {q.source}
                              </span>
                            </div>

                            {/* Problem Statement */}
                            <div>
                              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                                Problem Description:
                              </h4>
                              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                                {q.problemStatement}
                              </p>
                              {q.constraints && (
                                <p className="text-[11px] text-gray-400 mt-2 font-mono bg-gray-900/60 p-2 rounded border border-gray-800">
                                  <strong>Constraints:</strong> {q.constraints}
                                </p>
                              )}
                            </div>

                            {/* Sample Input / Output */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-[10px] block font-sans mb-1 font-bold">Input Sample:</span>
                                <span className="text-emerald-400">{q.inputSample}</span>
                              </div>
                              <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                                <span className="text-gray-400 text-[10px] block font-sans mb-1 font-bold">Output Sample:</span>
                                <span className="text-cyan-400">{q.outputSample}</span>
                              </div>
                            </div>

                            {/* Intuition & Approach */}
                            <div className="bg-indigo-950/20 border border-indigo-800/30 p-4 rounded-xl">
                              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
                                💡 Optimal Algorithmic Approach & Proof
                              </h4>
                              <p className="text-xs text-indigo-200 leading-relaxed whitespace-pre-line">
                                {q.approach}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold text-indigo-300">
                                <span>⏱️ Time: {q.timeComplexity}</span>
                                <span>&bull;</span>
                                <span>💾 Space: {q.spaceComplexity}</span>
                              </div>
                            </div>

                            {/* Multi-language Code Box */}
                            <div>
                              <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-xl border border-gray-800 border-b-0">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveCodeLang('cpp')}
                                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                      activeCodeLang === 'cpp'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    C++ (20)
                                  </button>
                                  <button
                                    onClick={() => setActiveCodeLang('python')}
                                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                      activeCodeLang === 'python'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    Python 3
                                  </button>
                                  <button
                                    onClick={() => setActiveCodeLang('java')}
                                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                      activeCodeLang === 'java'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                  >
                                    Java 17
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleCopyCode(codeToShow)}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                                >
                                  {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                                </button>
                              </div>

                              <pre className="bg-[#090d13] p-4 rounded-b-xl border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto custom-scrollbar">
                                <code>{codeToShow}</code>
                              </pre>
                            </div>

                            {/* Interview Follow-ups */}
                            {q.interviewFollowUps && q.interviewFollowUps.length > 0 && (
                              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                                <span className="text-xs font-bold text-amber-300 block mb-2">
                                  🎯 Typical Interviewer Follow-Up Twists:
                                </span>
                                <ul className="space-y-1.5 text-xs text-gray-300 list-disc list-inside">
                                  {q.interviewFollowUps.map((twist, idx) => (
                                    <li key={idx}>{twist}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* TAB 4: REDDIT & GFG COMMUNITY DEBRIEFS */}
                {activeTab === 'community' && companyDetails.communityInsights && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 space-y-6">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">
                          Reddit & GeeksforGeeks Candidate Experiences (2025–2026)
                        </h3>
                        <p className="text-xs text-gray-400">
                          Real ground reality shared by students and freshers who cleared the rounds.
                        </p>
                      </div>

                      {/* Reddit Quote Card */}
                      <div className="bg-[#1f242c] p-4 rounded-xl border-l-4 border-amber-500 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <MessageSquare size={14} />
                          <span>Reddit (r/developersIndia / r/leetcode) Debrief:</span>
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed italic">
                          "{companyDetails.communityInsights.redditDebrief}"
                        </p>
                      </div>

                      {/* GFG Quote Card */}
                      <div className="bg-[#1f242c] p-4 rounded-xl border-l-4 border-emerald-500 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                          <BookOpen size={14} />
                          <span>GeeksforGeeks Interview Archive Insight:</span>
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed italic">
                          "{companyDetails.communityInsights.gfgDebrief}"
                        </p>
                      </div>

                      {/* Key Tips Checklist */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                          Verified Candidate Survival Tips:
                        </h4>
                        <div className="space-y-2">
                          {companyDetails.communityInsights.interviewTips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-gray-900/60 p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
                              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: AI PLACEMENT CO-PILOT */}
                {activeTab === 'practice' && (
                  <div className="max-w-4xl space-y-6">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            Antigravity AI Placement Co-Pilot
                          </h3>
                          <p className="text-xs text-gray-400">
                            Ask specific interview questions, request code reviews, or simulate a technical interview round for {companyDetails.name}.
                          </p>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="bg-gray-900/80 rounded-xl p-4 min-h-[220px] max-h-[360px] overflow-y-auto space-y-3 border border-gray-800 custom-scrollbar">
                        {copilotHistory.length === 0 && (
                          <div className="text-center text-xs text-gray-500 py-10">
                            Ask anything: <em>"How do I prepare for {companyDetails.name}'s OA in 14 days?"</em> or <em>"Explain the optimal solution for ${companyDetails.realQuestions2025[0]?.title}"</em>.
                          </div>
                        )}

                        {copilotHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${
                              msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-2xl text-xs rounded-2xl p-3.5 leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-indigo-600 text-white rounded-br-none'
                                  : 'bg-gray-800 text-gray-200 border border-gray-700/80 rounded-bl-none whitespace-pre-line'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}

                        {copilotLoading && (
                          <div className="flex items-center gap-2 text-xs text-indigo-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                            <span>Analyzing placement intelligence archives...</span>
                          </div>
                        )}
                      </div>

                      {/* Prompt Input Form */}
                      <form onSubmit={handleAskCopilot} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Ask AI Placement Co-Pilot for ${companyDetails.name} guidance...`}
                          value={copilotQuery}
                          onChange={(e) => setCopilotQuery(e.target.value)}
                          className="flex-1 bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={copilotLoading || !copilotQuery.trim()}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition"
                        >
                          <Send size={14} />
                          <span>Ask</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* NIT Andhra Pradesh EEE Opportunities Modal */}
      {showNitApModal && nitApEeeData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      NIT Andhra Pradesh — EEE Internship & Career Opportunities
                    </h2>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                      {nitApEeeData.batchYear}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {nitApEeeData.department} • {nitApEeeData.institution}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNitApModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Preparation Guidance Alert */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200">
                <h4 className="font-bold flex items-center gap-2 text-amber-300">
                  <Sparkles size={14} /> Strategy & Guidance for NIT AP EEE Students:
                </h4>
                <p>&bull; <strong>Core Electrical:</strong> {nitApEeeData.guidance.corePreparation}</p>
                <p>&bull; <strong>Software/IT Drives:</strong> {nitApEeeData.guidance.softwareOption}</p>
                <p>&bull; <strong>PSU via GATE:</strong> {nitApEeeData.guidance.gateStrategy}</p>
              </div>

              {/* Opportunities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nitApEeeData.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => window.open(opp.directLink, '_blank', 'noopener,noreferrer')}
                    className="p-5 bg-gray-900/90 border border-gray-800 hover:border-amber-500/50 hover:bg-gray-800/80 rounded-xl space-y-3 transition group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {opp.type}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition">
                          {opp.company}
                        </h3>
                        <p className="text-xs text-gray-300 font-medium">{opp.role}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {opp.domain}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="text-emerald-400 font-semibold">{opp.stipendOrCtc}</div>
                        {opp.deadline && (
                          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>⏰ Apply By:</span> {opp.deadline}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[11px]">📍 {opp.location} • 🎓 {opp.eligibility}</div>
                    </div>

                    {/* Key Skills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {opp.keySkills.map((sk, idx) => (
                        <span key={idx} className="text-[10px] bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-800/80 text-[11px]">
                      <span className="text-emerald-400 font-medium">{opp.applicationStatus}</span>
                      <a
                        href={opp.directLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(opp.directLink, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-amber-400 group-hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline"
                      >
                        Apply / View Portal →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/60 flex items-center justify-between text-xs text-gray-400">
              <span>Updated live from NIT AP T&P announcements and company portals.</span>
              <button
                onClick={() => setShowNitApModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
