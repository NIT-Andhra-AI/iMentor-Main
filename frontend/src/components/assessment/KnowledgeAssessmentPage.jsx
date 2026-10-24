import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain, Loader2, CheckCircle2, AlertTriangle, ArrowLeft,
  BarChart3, BookOpen, Target, TrendingUp, ChevronRight, ChevronLeft, Send,
  Layers, Square, Flag
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BLOOM_LABELS = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
};

const LEVEL_COLORS = {
  Beginner: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  Intermediate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Advanced: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  Expert: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const FALLBACK_OPTIONS = [
  'A. Accurate conceptual definition and primary operational model.',
  'B. Secondary auxiliary mechanism applicable only under restricted scenarios.',
  'C. Deprecated theoretical pattern not recommended for modern systems.',
  'D. Incompatible approach that violates core domain invariants.'
];

const KnowledgeAssessmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';

  const [step, setStep] = useState('start');
  const [topic, setTopic] = useState(initialTopic);
  const [course, setCourse] = useState(searchParams.get('course') || '');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
  const [answers, setAnswers] = useState([]);
  const [flagged, setFlagged] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [bloomData, setBloomData] = useState(null);
  const [draftAnswers, setDraftAnswers] = useState({});
  const questionRef = useRef(null);
  const questionCardRefs = useRef({});

  useEffect(() => {
    api.getSubjects().then(d => setCourses(d?.subjects || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTopic) handleGenerate();
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim() && !course.trim()) {
      toast.error('Enter a topic or select a course');
      return;
    }
    setLoading(true);
    try {
      const data = await api.generateAssessment({ course, topic: topic.trim() });
      setQuestions(data.questions || []);
      setAnswers([]);
      setFlagged({});
      setCurrentIndex(0);
      setResult(null);
      setDraftAnswers({});
      setStep('taking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate assessment');
    } finally {
      setLoading(false);
    }
  };

  const getAnswerForQuestion = (q) => {
    const found = answers.find(a => a.question === q.question);
    if (found) return found.userAnswer;
    return draftAnswers[q.question] || null;
  };

  const handleSelectOptionForQuestion = (qIdx, opt, autoAdvance = false) => {
    const q = questions[qIdx];
    if (!q) return;
    const answerObj = {
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      modelAnswer: q.modelAnswer,
      bloomLevel: q.bloomLevel,
      concepts: q.concepts,
      userAnswer: opt,
    };
    const existingIdx = answers.findIndex(a => a.question === q.question);
    let newAnswers;
    if (existingIdx >= 0) {
      newAnswers = [...answers];
      newAnswers[existingIdx] = answerObj;
    } else {
      newAnswers = [...answers, answerObj];
    }
    setAnswers(newAnswers);
    if (autoAdvance && qIdx < questions.length - 1) {
      setCurrentIndex(qIdx + 1);
    }
  };

  const toggleFlag = (qIdx) => {
    setFlagged(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const jumpToQuestion = (qIdx) => {
    setCurrentIndex(qIdx);
    if (viewMode === 'section' && questionCardRefs.current[qIdx]) {
      questionCardRefs.current[qIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitAssessment = async () => {
    const allResponses = questions.map(q => {
      const found = answers.find(a => a.question === q.question);
      const draftVal = draftAnswers[q.question];
      return {
        question: q.question,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        modelAnswer: q.modelAnswer,
        bloomLevel: q.bloomLevel,
        concepts: q.concepts,
        userAnswer: found ? found.userAnswer : (draftVal || ''),
      };
    }).filter(r => r.userAnswer && String(r.userAnswer).trim() !== '');

    if (allResponses.length === 0) {
      toast.error('Please answer the questions before submitting');
      return;
    }

    setEvaluating(true);
    try {
      const data = await api.submitAssessment({
        responses: allResponses,
        topic: topic.trim() || course,
        course,
      });
      setResult(data);
      setStep('done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to evaluate assessment');
    } finally {
      setEvaluating(false);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getAssessmentProfile(topic.trim() || course);
      setHistory(data.history);
      setResult(data.readiness);
      setStep('profile');
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadBloomTaxonomy = async () => {
    setLoading(true);
    try {
      const data = await api.getBloomTaxonomy(topic.trim() || course);
      setBloomData(data);
      setStep('bloom');
    } catch (err) {
      toast.error('Failed to load Bloom taxonomy data');
    } finally {
      setLoading(false);
    }
  };

  const renderStart = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          <Brain className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Knowledge Assessment</h1>
        <p className="text-zinc-400">Evaluate your understanding with a sectioned Bloom's Taxonomy diagnostic worksheet</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-zinc-400" />
          Choose a Topic
        </h3>
        <select
          value={course}
          onChange={e => setCourse(e.target.value)}
          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-white mb-4"
        >
          <option value="">Select a course...</option>
          {courses.map(c => (
            <option key={c.code} value={c.code}>{c.name || c.code}</option>
          ))}
        </select>
        <div className="text-center text-zinc-600 text-sm mb-4">— or —</div>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Or type a custom topic..."
          className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white mb-4"
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={(!topic.trim() && !course) || loading}
          className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {loading ? 'Generating Assessment...' : 'Start Diagnostic Worksheet'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={loadProfile} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 text-left transition-all">
          <BarChart3 className="w-5 h-5 text-zinc-400 mb-2" />
          <div className="text-white font-medium text-sm">My Profile</div>
          <div className="text-zinc-500 text-xs mt-1">View past assessments</div>
        </button>
        <button onClick={loadBloomTaxonomy} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-600 text-left transition-all">
          <TrendingUp className="w-5 h-5 text-zinc-400 mb-2" />
          <div className="text-white font-medium text-sm">Bloom's Taxonomy</div>
          <div className="text-zinc-500 text-xs mt-1">Track cognitive levels</div>
        </button>
      </div>
    </div>
  );

  const renderQuestion = () => {
    if (!questions.length) return null;
    const answeredCount = questions.filter(q => {
      const a = getAnswerForQuestion(q);
      return a && String(a).trim() !== '';
    }).length;
    const progressPct = (answeredCount / questions.length) * 100;

    // Group questions into cognitive Bloom sections
    const bloomSections = [
      {
        id: 'foundation',
        title: 'Section 1: Foundation & Recall (Remember / Understand)',
        items: questions.map((q, idx) => ({ q, idx })).filter(({ q }) => ['remember', 'understand'].includes((q.bloomLevel || '').toLowerCase()))
      },
      {
        id: 'application',
        title: 'Section 2: Application & Analysis (Apply / Analyze)',
        items: questions.map((q, idx) => ({ q, idx })).filter(({ q }) => ['apply', 'analyze'].includes((q.bloomLevel || '').toLowerCase()))
      },
      {
        id: 'mastery',
        title: 'Section 3: Evaluation & Synthesis',
        items: questions.map((q, idx) => ({ q, idx })).filter(({ q }) => !['remember', 'understand', 'apply', 'analyze'].includes((q.bloomLevel || '').toLowerCase()))
      }
    ].filter(s => s.items.length > 0);

    const q = questions[currentIndex] || questions[0];
    const isLast = currentIndex === questions.length - 1;
    const isFirst = currentIndex === 0;

    return (
      <div ref={questionRef} className="max-w-3xl mx-auto space-y-6">
        {/* Sticky CBT Palette Header */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                Bloom's Diagnostic Assessment — {topic || course}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {answeredCount} of {questions.length} Questions Answered ({Math.round(progressPct)}%)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode('section')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'section' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Section Worksheet
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('single')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'single' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Single Focus
                </button>
              </div>
            </div>
          </div>

          {/* Question Navigator Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {questions.map((item, idx) => {
              const ans = getAnswerForQuestion(item);
              const isAns = ans && String(ans).trim() !== '';
              const isFlg = !!flagged[idx];
              const isCurr = viewMode === 'single' && currentIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => jumpToQuestion(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                    isCurr
                      ? 'border-white bg-white text-black ring-2 ring-white/40'
                      : isFlg
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : isAns
                          ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  }`}
                  title={`Question ${idx + 1} (${BLOOM_LABELS[item.bloomLevel] || item.bloomLevel || 'General'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(3, progressPct)}%` }}
            />
          </div>
        </div>

        {/* SECTION WORKSHEET VIEW */}
        {viewMode === 'section' ? (
          <div className="space-y-8">
            {bloomSections.map(section => (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 px-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {section.title}
                  </h3>
                  <span className="text-xs text-zinc-500">
                    {section.items.filter(({ q: sq }) => getAnswerForQuestion(sq)).length}/{section.items.length} answered
                  </span>
                </div>

                <div className="space-y-4">
                  {section.items.map(({ q: item, idx: qIdx }) => {
                    const selected = getAnswerForQuestion(item);
                    const opts = Array.isArray(item.options) && item.options.length > 0 ? item.options : FALLBACK_OPTIONS;
                    return (
                      <div
                        key={qIdx}
                        ref={el => (questionCardRefs.current[qIdx] = el)}
                        className={`bg-zinc-900 rounded-2xl p-6 border transition-all ${
                          selected ? 'border-emerald-500/40 bg-emerald-950/5' : 'border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-start gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              selected ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-white'
                            }`}>
                              {qIdx + 1}
                            </span>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 inline-block mb-1.5">
                                {BLOOM_LABELS[item.bloomLevel] || item.bloomLevel || 'Diagnostic'}
                              </span>
                              <p className="text-base text-white font-medium leading-relaxed">{item.question}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFlag(qIdx)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              flagged[qIdx] ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                            title="Flag for review"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {opts.map((opt, i) => {
                            const isSelected = selected === opt;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectOptionForQuestion(qIdx, opt, false)}
                                className={`w-full text-left px-4 py-3.5 bg-black border rounded-xl transition-all flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-white text-white bg-white/10'
                                    : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 ${
                                  isSelected ? 'border-white bg-white text-black font-bold' : 'border-zinc-700'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-sm">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="sticky bottom-4 z-10 bg-zinc-900/95 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4 shadow-2xl">
              <div className="text-xs text-zinc-400">
                {answeredCount === questions.length
                  ? 'All diagnostic questions completed!'
                  : `${answeredCount} of ${questions.length} answered — you can review and change any answer above.`}
              </div>
              <button
                onClick={handleSubmitAssessment}
                disabled={evaluating || answeredCount === 0}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Diagnostic ({answeredCount}/{questions.length})
              </button>
            </div>
          </div>
        ) : (
          /* SINGLE QUESTION FOCUS VIEW */
          <div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {currentIndex + 1}
                  </span>
                  <p className="text-lg text-white font-medium">{q.question}</p>
                </div>
                <span className="text-xs text-zinc-400 capitalize shrink-0">
                  {BLOOM_LABELS[q.bloomLevel] || q.bloomLevel}
                </span>
              </div>

              <div className="space-y-3">
                {(Array.isArray(q.options) && q.options.length > 0 ? q.options : FALLBACK_OPTIONS).map((opt, i) => {
                  const selected = getAnswerForQuestion(q);
                  const isSelected = selected === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOptionForQuestion(currentIndex, opt, false)}
                      className={`w-full text-left px-5 py-4 bg-black border rounded-xl transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-white text-white bg-white/10'
                          : 'border-zinc-800 text-zinc-300 hover:border-white hover:text-white'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm font-medium shrink-0 ${
                        isSelected ? 'border-white bg-white text-black font-bold' : 'border-zinc-700'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              {!isFirst && (
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-bold hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              {!isLast && (
                <button
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {isLast && (
                <button
                  onClick={handleSubmitAssessment}
                  disabled={evaluating}
                  className="flex-1 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {evaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  {evaluating ? 'Evaluating your assessment...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;
    const colors = LEVEL_COLORS[result.level] || LEVEL_COLORS.Beginner;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4 border ${colors.border} shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
            <CheckCircle2 className={`w-10 h-10 ${colors.text}`} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">Assessment Complete</h1>
          <p className="text-zinc-400 font-sans">Here's your diagnostic knowledge profile</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative text-center">
            <div className={`text-5xl font-black ${colors.text} mb-2 tracking-tight`}>{result.level}</div>
            <div className="text-zinc-400 font-medium text-xs tracking-wider uppercase mb-4">Proficiency Level</div>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{result.scorePercent}%</span>
              <span className="text-zinc-500 text-sm">({result.score} / {result.maxScore} Correct)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
            <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Bloom's Taxonomy Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(result.bloomProfile || {}).map(([level, data]) => (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 capitalize font-medium">{BLOOM_LABELS[level] || level}</span>
                    <span className={data.mastered ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                      {data.mastered ? 'Mastered' : `${data.score}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${data.mastered ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {result.weakAreas?.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Areas to Review
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.weakAreas.map((area, i) => (
                    <span key={i} className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.strengths?.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
                <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map((area, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {result.misconceptions?.length > 0 && (
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
            <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Misconceptions to Address
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.misconceptions.map((m, i) => (
                <span key={i} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs font-medium">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.suggestedRevisionTopics?.length > 0 && (
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
            <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Suggested Revision Topics
            </h3>
            <div className="space-y-2">
              {result.suggestedRevisionTopics.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5 text-zinc-300 text-xs py-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
          <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Detailed Question Analysis
          </h3>
          <div className="space-y-4">
            {result.gradingDetails?.map((item, idx) => (
              <div key={idx} className="p-4 bg-black/40 border border-zinc-800/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      item.correct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {idx + 1}
                    </span>
                    <p className="text-white font-medium text-sm leading-relaxed">{item.question}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold shrink-0 uppercase tracking-wider ${
                    item.correct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {item.correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pl-8 border-l border-zinc-800/40 ml-3">
                  <div className="text-zinc-400">
                    <span className="text-zinc-500 font-medium">Your Answer:</span>{' '}
                    <span className={item.correct ? 'text-emerald-400/90' : 'text-red-400/90'}>
                      {item.userAnswer || 'No answer submitted'}
                    </span>
                  </div>
                  {!item.correct && item.correctAnswer && (
                    <div className="text-emerald-400/95 font-medium">
                      <span className="text-zinc-500 font-medium">Correct Answer:</span> {item.correctAnswer}
                    </div>
                  )}
                  {item.explanation && (
                    <div className="text-zinc-400 mt-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/40 text-2xs leading-relaxed">
                      <span className="text-zinc-500 font-semibold block mb-1 uppercase tracking-wider">Explanation & Guided Learning Feedback</span>
                      {item.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80">
          <p className="text-zinc-300 text-sm mb-2 font-medium">{result.feedback}</p>
          <p className="text-zinc-400 text-xs leading-relaxed">{result.recommendation}</p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => { setStep('start'); setResult(null); setQuestions([]); }}
            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 text-white rounded-xl font-bold transition-all shadow-md">
            Take Another
          </button>
          <button onClick={loadProfile}
            className="flex-1 py-3.5 bg-white hover:bg-zinc-100 text-black rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md">
            <BarChart3 className="w-4 h-4" />
            View Profile
          </button>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <BarChart3 className="w-10 h-10 text-white mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-white mb-2">Assessment Profile</h1>
        {topic && <p className="text-zinc-500">{topic}</p>}
      </div>

      {result && result.readiness && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <h3 className="text-white font-semibold mb-3">Learning Readiness</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              result.readiness === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
              result.readiness === 'needs_preparation' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {result.readiness === 'ready' ? 'Ready to Learn' : result.readiness === 'needs_preparation' ? 'Needs Preparation' : 'Unknown'}
            </span>
            {result.currentLevel && (
              <span className="px-3 py-1 bg-zinc-800 rounded-lg text-zinc-300 text-sm">{result.currentLevel}</span>
            )}
          </div>
          {result.recommendations?.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                rec.priority === 'high' ? 'bg-red-500' : 'bg-zinc-500'
              }`} />
              <div>
                <p className="text-zinc-300 text-sm">{rec.action}</p>
                <p className="text-zinc-600 text-xs capitalize">{rec.area}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {history?.assessments?.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-white font-semibold mb-4">Assessment History</h3>
          <div className="space-y-3">
            {history.assessments.slice(-10).reverse().map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <span className={`text-sm font-medium ${
                    a.level === 'Expert' ? 'text-emerald-400' :
                    a.level === 'Advanced' ? 'text-blue-400' :
                    a.level === 'Intermediate' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>{a.level}</span>
                  <span className="text-zinc-500 text-xs ml-2">
                    {new Date(a.createdAt || a.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-white font-bold">{a.scorePercent}%</span>
              </div>
            ))}
          </div>
          {history.trend !== null && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${history.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-sm ${history.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {history.trend >= 0 ? '+' : ''}{history.trend}% trend
              </span>
            </div>
          )}
        </div>
      )}

      <button onClick={() => setStep('start')}
        className="mt-6 w-full py-3 bg-zinc-800 rounded-xl text-white font-bold hover:bg-zinc-700 transition-all">
        Back to Assessment
      </button>
    </div>
  );

  const renderBloom = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <TrendingUp className="w-10 h-10 text-white mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-white mb-2">Bloom's Taxonomy</h1>
        <p className="text-zinc-500">Cognitive level analysis across assessments</p>
      </div>

      {bloomData?.bloomLevels?.length > 0 ? (
        <div className="space-y-4">
          {bloomData.bloomLevels.map((item, i) => (
            <div key={i} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold capitalize">{BLOOM_LABELS[item.level] || item.level}</h3>
                <span className={`text-lg font-bold ${
                  item.averageScore >= 80 ? 'text-emerald-400' :
                  item.averageScore >= 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{item.averageScore}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${
                  item.averageScore >= 80 ? 'bg-emerald-500' :
                  item.averageScore >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} style={{ width: `${item.averageScore}%` }} />
              </div>
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Best: {item.highestScore}%</span>
                <span>{item.assessmentsAttempted} assessments</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
          <p className="text-zinc-500">No assessment data yet. Complete a diagnostic to see Bloom's taxonomy breakdown.</p>
        </div>
      )}

      <div className="mt-6">
        <button onClick={() => setStep('start')}
          className="w-full py-3 bg-zinc-800 rounded-xl text-white font-bold hover:bg-zinc-700 transition-all">
          Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-black font-sans overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <button
          onClick={() => step === 'start' ? navigate(-1) : setStep('start')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {loading && step === 'start' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}

        {evaluating && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
            <p className="text-zinc-400 text-lg">Evaluating your assessment...</p>
          </div>
        )}

        {step === 'start' && !loading && !evaluating && renderStart()}
        {step === 'taking' && !evaluating && renderQuestion()}
        {step === 'done' && !evaluating && renderResults()}
        {step === 'profile' && renderProfile()}
        {step === 'bloom' && renderBloom()}
      </div>
    </div>
  );
};

export default KnowledgeAssessmentPage;