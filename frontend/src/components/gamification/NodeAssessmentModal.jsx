import React, { useState, useEffect, useRef } from 'react';
import { Brain, X, Loader2, CheckCircle2, XCircle, Star, Layers, Square, Flag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_BASE_URL;

const NodeAssessmentModal = ({ treeId, nodeId, nodeName, onClose }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
    const [answers, setAnswers] = useState([]);
    const [flagged, setFlagged] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());
    const questionRefs = useRef({});

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await axios.post(`${API}/skill-tree/node-assessment`,
                { treeId, nodeId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setQuestions(data.questions || []);
            setAnswers(new Array(data.questions?.length || 0).fill(undefined));
            setStartTime(Date.now());
        } catch (err) {
            toast.error('Failed to load assessment');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSelectForQuestion = (qIdx, val) => {
        const newAnswers = [...answers];
        newAnswers[qIdx] = val;
        setAnswers(newAnswers);
    };

    const toggleFlag = (qIdx) => {
        setFlagged(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
    };

    const jumpToQuestion = (qIdx) => {
        setCurrentIdx(qIdx);
        if (viewMode === 'section' && questionRefs.current[qIdx]) {
            questionRefs.current[qIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const isQuestionAnswered = (ans) => ans !== undefined && (typeof ans !== 'string' || ans.trim().length > 0);
    const answeredCount = answers.filter(isQuestionAnswered).length;

    const handleSubmit = async () => {
        if (answers.some(a => !isQuestionAnswered(a))) {
            toast.error('Please answer all questions before submitting');
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const formatted = questions.map((q, i) => ({
                question: q.question,
                selectedIndex: typeof answers[i] === 'number' ? answers[i] : undefined,
                text: typeof answers[i] === 'string' ? answers[i] : undefined
            }));
            const { data } = await axios.post(`${API}/skill-tree/node-assessment/submit`, {
                treeId, nodeId, questions, answers: formatted,
                timeSpent: Math.round((Date.now() - startTime) / 1000)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResult(data);
            if (data.mastered) toast.success(`${nodeName} mastered!`);
        } catch (err) {
            toast.error('Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto" />
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                    <div className="text-center mb-6">
                        <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                            result.quizScore >= 70 ? 'bg-green-900/50' : 'bg-yellow-900/50'
                        }`}>
                            {result.quizScore >= 70
                                ? <CheckCircle2 className="w-8 h-8 text-green-400" />
                                : <XCircle className="w-8 h-8 text-yellow-400" />
                            }
                        </div>
                        <h3 className="text-xl font-bold text-white">{result.quizScore}%</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                            {result.correctCount}/{result.totalQuestions} correct
                        </p>
                        {result.mastered && (
                            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                                <Star className="w-4 h-4" /> Mastered!
                            </div>
                        )}
                        <p className="text-zinc-500 text-xs mt-2">
                            Status: <span className="text-zinc-300 capitalize">{result.masteryStatus}</span>
                        </p>
                    </div>
                    <div className="space-y-2 mb-6">
                        {result.results?.map((r, i) => (
                            <div key={i} className={`flex flex-col gap-1 p-2.5 rounded-lg text-sm ${
                                r.correct ? 'bg-green-900/10 text-green-400' : 'bg-red-900/10 text-red-400'
                            }`}>
                                <div className="flex items-center gap-2">
                                    {r.correct ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                                    <span className="truncate">{r.question?.slice(0, 75)}</span>
                                </div>
                                {!r.correct && r.conceptHint && (
                                    <span className="text-xs text-zinc-400 pl-6">{r.conceptHint}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
                            Close
                        </button>
                        {!result.mastered && (
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setCurrentIdx(0);
                                    setFlagged({});
                                    fetchQuestions();
                                }}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
                            >
                                Retry (New Questions)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center">
                    <p className="text-zinc-500">No questions available</p>
                    <button onClick={onClose} className="mt-4 text-sm text-blue-400">Close</button>
                </div>
            </div>
        );
    }

    const q = questions[currentIdx];

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Brain className="w-5 h-5 text-blue-400" />
                        <div>
                            <h3 className="text-white font-bold text-sm">Node Mastery Worksheet</h3>
                            <p className="text-zinc-400 text-xs">{nodeName} • {answeredCount}/{questions.length} Answered</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                            <button
                                type="button"
                                onClick={() => setViewMode('section')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'section' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" /> Worksheet
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('single')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                <Square className="w-3.5 h-3.5" /> Single
                            </button>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Sticky Question Navigator Palette */}
                <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500 font-semibold mr-1">Questions:</span>
                        {questions.map((_, idx) => {
                            const ans = isQuestionAnswered(answers[idx]);
                            const flg = !!flagged[idx];
                            const curr = viewMode === 'single' && currentIdx === idx;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => jumpToQuestion(idx)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                                        curr
                                            ? 'border-blue-500 bg-blue-600 text-white'
                                            : flg
                                                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                                : ans
                                                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                                                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="w-28 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {viewMode === 'section' ? (
                        questions.map((item, qIdx) => {
                            const ans = answers[qIdx];
                            return (
                                <div
                                    key={qIdx}
                                    ref={el => (questionRefs.current[qIdx] = el)}
                                    className={`p-5 rounded-xl border transition-all ${
                                        isQuestionAnswered(ans)
                                            ? 'border-blue-500/40 bg-blue-950/10'
                                            : 'border-zinc-800 bg-zinc-950/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold">
                                                Q{qIdx + 1}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                                {item.courseOutcome || 'CO1'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                                {item.bloomCode || `Bloom's: ${(item.bloomLevel || 'apply').toUpperCase()}`}
                                            </span>
                                            <span className="text-zinc-400 text-xs capitalize">
                                                {item.difficulty || 'medium'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleFlag(qIdx)}
                                            className={`p-1 rounded ${flagged[qIdx] ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                                            title="Flag for review"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-white font-medium mb-4 leading-relaxed">{item.question}</p>

                                    {item.options && item.options.length > 0 ? (
                                        <div className="space-y-2">
                                            {item.options.map((opt, oi) => (
                                                <button
                                                    key={oi}
                                                    type="button"
                                                    onClick={() => handleSelectForQuestion(qIdx, oi)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${
                                                        ans === oi
                                                            ? 'border-blue-500 bg-blue-900/25 text-white font-medium'
                                                            : 'border-zinc-800 bg-black text-zinc-300 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                        ans === oi ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                                                    }`}>
                                                        {String.fromCharCode(65 + oi)}
                                                    </span>
                                                    <span>{opt}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <textarea
                                            value={typeof ans === 'string' ? ans : ''}
                                            onChange={(e) => handleSelectForQuestion(qIdx, e.target.value)}
                                            placeholder="Type your explanation or solution..."
                                            className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-zinc-600 min-h-[90px] resize-none"
                                        />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div>
                            <p className="text-white font-medium mb-2">{q.question}</p>
                            <p className="text-zinc-500 text-xs mb-4 capitalize">{q.type?.replace(/_/g, ' ')} — {q.difficulty}</p>

                            {q.options && q.options.length > 0 ? (
                                <div className="space-y-2">
                                    {q.options.map((opt, oi) => (
                                        <button
                                            key={oi}
                                            type="button"
                                            onClick={() => handleSelectForQuestion(currentIdx, oi)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                                                answers[currentIdx] === oi
                                                    ? 'border-blue-500 bg-blue-900/20 text-white'
                                                    : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    value={typeof answers[currentIdx] === 'string' ? answers[currentIdx] : ''}
                                    onChange={(e) => handleSelectForQuestion(currentIdx, e.target.value)}
                                    placeholder="Type your answer..."
                                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 min-h-[100px] resize-none"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 flex gap-3 flex-shrink-0 bg-zinc-900">
                    {viewMode === 'section' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={answeredCount < questions.length || submitting}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    !submitting && answeredCount === questions.length
                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    `Submit All Answers (${answeredCount}/${questions.length})`
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={currentIdx > 0 ? () => setCurrentIdx(i => i - 1) : onClose}
                                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors"
                            >
                                {currentIdx > 0 ? 'Previous' : 'Cancel'}
                            </button>
                            {currentIdx < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIdx(i => i + 1)}
                                    disabled={!isQuestionAnswered(answers[currentIdx])}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        isQuestionAnswered(answers[currentIdx])
                                            ? 'bg-white text-black hover:bg-zinc-200'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={answeredCount < questions.length || submitting}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        !submitting && answeredCount === questions.length
                                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NodeAssessmentModal;
