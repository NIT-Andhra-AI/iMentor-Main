import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Brain, Loader2, ChevronRight, ChevronLeft, Send, 
    CheckCircle2, XCircle, Trophy, HelpCircle, RotateCcw, Layers, Square, Flag
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Animate from '../core/Animate';

export default function CourseQuizModal({ isOpen, onClose, courseName, moduleId, moduleName }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
    const [studentAnswers, setStudentAnswers] = useState([]);
    const [flagged, setFlagged] = useState({});
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [expandedFeedback, setExpandedFeedback] = useState({});
    const questionRefs = useRef({});

    useEffect(() => {
        if (!isOpen) return;

        const loadQuiz = async () => {
            setLoading(true);
            setEvaluationResult(null);
            setStudentAnswers([]);
            setCurrentIndex(0);
            setExpandedFeedback({});
            setFlagged({});
            
            try {
                const data = await api.generateSocraticQuiz(courseName, moduleId, moduleName);
                if (data.success && Array.isArray(data.questions)) {
                    setQuestions(data.questions);
                    setStudentAnswers(new Array(data.questions.length).fill(''));
                } else {
                    toast.error('Failed to load quiz questions.');
                    onClose();
                }
            } catch (err) {
                toast.error(err.response?.data?.message || 'Error generating quiz.');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        loadQuiz();
    }, [isOpen, courseName, moduleId, moduleName]);

    if (!isOpen) return null;

    const handleAnswerChangeAtIndex = (idx, text) => {
        const updated = [...studentAnswers];
        updated[idx] = text;
        setStudentAnswers(updated);
    };

    const toggleFlag = (idx) => {
        setFlagged(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const jumpToQuestion = (idx) => {
        setCurrentIndex(idx);
        if (viewMode === 'section' && questionRefs.current[idx]) {
            questionRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const normQ = (q) => {
        if (!q || typeof q !== 'object') {
            return {
                instruction: '',
                question: '',
                options: [],
                correctIndex: 0,
                output: '',
                topic: 'General',
                difficulty: 'Adaptive',
                type: 'MCQ'
            };
        }
        return {
            ...q,
            instruction: q.instruction || q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            topic: q.topic || 'General',
            difficulty: q.difficulty || 'Adaptive',
            output: q.output || q.explanation || '',
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            type: q.type || (Array.isArray(q.options) && q.options.length > 0 ? 'MCQ' : 'Descriptive')
        };
    };

    const questionsNorm = Array.isArray(questions) ? questions.map(normQ) : [];
    const currentQuestion = questionsNorm[currentIndex] || normQ(null);
    const cleanCourseName = courseName ? courseName.replace(/\.[^.]+$/, '') : '';
    const answeredCount = studentAnswers.filter(a => a !== undefined && String(a).trim() !== '').length;

    const handleSubmitQuiz = async () => {
        setIsEvaluating(true);
        const forceExitTimer = setTimeout(() => {
            setIsEvaluating(false);
            toast.error('Submission timed out. Please try again.');
        }, 25000);

        try {
            const formattedAnswers = questionsNorm.map((q, idx) => ({
                topic: q.topic,
                instruction: q.instruction,
                output: q.output,
                studentAnswer: studentAnswers[idx] || '',
                type: q.type,
                options: q.options,
                correctIndex: q.correctIndex
            }));

            const data = await api.submitSocraticQuiz(courseName, formattedAnswers, moduleId, moduleName);
            clearTimeout(forceExitTimer);
            if (data.success) {
                setEvaluationResult(data);
                toast.success('Quiz submitted successfully! 🎉');
            } else {
                toast.error('Failed to evaluate quiz.');
            }
        } catch (err) {
            clearTimeout(forceExitTimer);
            toast.error(err.response?.data?.message || 'Error submitting quiz.');
        } finally {
            clearTimeout(forceExitTimer);
            setIsEvaluating(false);
        }
    };

    const toggleFeedback = (idx) => {
        setExpandedFeedback(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Animate
                animation="scale-in"
                className="w-full max-w-3xl bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/5 bg-white/2 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25">
                            <Brain size={18} className="text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                {moduleName ? `Module Worksheet · ${moduleName}` : `Course Assessment Worksheet`}
                            </span>
                            <h3 className="text-sm font-bold text-white leading-tight">
                                {cleanCourseName || 'Academic Course'}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!loading && !evaluationResult && questionsNorm.length > 0 && (
                            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('section')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                        viewMode === 'section'
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Layers size={12} /> Section Worksheet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('single')}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                        viewMode === 'single'
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Square size={12} /> Single Focus
                                </button>
                            </div>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                            title="Close Quiz"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Sticky Question Navigator Palette */}
                {!loading && !evaluationResult && questionsNorm.length > 0 && (
                    <div className="px-6 py-2.5 border-b border-white/5 bg-black/40 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mr-1">
                                Navigator:
                            </span>
                            {questionsNorm.map((_, idx) => {
                                const ans = studentAnswers[idx] !== undefined && String(studentAnswers[idx]).trim() !== '';
                                const flg = !!flagged[idx];
                                const curr = viewMode === 'single' && currentIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => jumpToQuestion(idx)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                                            curr
                                                ? 'border-indigo-400 bg-indigo-600 text-white'
                                                : flg
                                                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                                                    : ans
                                                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                                                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/25'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-400">
                            {answeredCount}/{questionsNorm.length} Answered
                        </span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
                            <Loader2 size={32} className="animate-spin text-indigo-400" />
                            <div className="text-center">
                                <p className="text-sm text-gray-300 font-semibold">Generating Socratic Quiz…</p>
                                <p className="text-xs text-gray-600 mt-1">Analyzing course materials and preparing personalized questions.</p>
                            </div>
                        </div>
                    ) : questionsNorm.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <HelpCircle size={32} className="text-gray-500" />
                            <p className="text-sm font-semibold text-gray-300">No quiz questions available for this module yet.</p>
                            <p className="text-xs text-gray-500">Please try selecting another module or retry in a moment.</p>
                            <button
                                onClick={onClose}
                                className="mt-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    ) : evaluationResult ? (
                        /* Scorecard view */
                        <Animate animation="slide-up" className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20">
                                <Trophy size={36} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.4)] animate-bounce" />
                                <div>
                                    <h4 className="text-lg font-bold text-white">Quiz Evaluation Complete!</h4>
                                    <p className="text-xs text-indigo-300 mt-1">Guided Learning Stage: <span className="font-bold">{evaluationResult.newStage}</span></p>
                                </div>

                                <div className="flex items-center gap-6 mt-2">
                                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-indigo-500/30 bg-indigo-500/5">
                                        <span className="text-2xl font-black text-white tabular-nums leading-none">{evaluationResult.correctCount}</span>
                                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-1">/ {evaluationResult.totalCount}</span>
                                    </div>
                                    <div className="text-left space-y-1">
                                        <p className="text-xs text-gray-400">Score Percentage: <span className="font-bold text-white">{evaluationResult.score}%</span></p>
                                        <p className="text-xs text-gray-400">Topic Mastery Updated: <span className="text-green-400">Yes</span></p>
                                        <p className="text-[10px] text-gray-600 italic">Stage is adjusted after completing course sets.</p>
                                    </div>
                                </div>
                            </div>

                            {evaluationResult.remediation && (
                                <div className="rounded-2xl p-5 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 shadow-xl space-y-4">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                                        <Brain className="text-teal-400" size={18} />
                                        <h5 className="text-xs font-bold text-teal-300 uppercase tracking-widest">Guided Learning Feedback & Hints</h5>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider block">Conceptual Strength</span>
                                            <p className="text-xs text-gray-200 leading-relaxed">{evaluationResult.remediation.strength}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">Conceptual Gap</span>
                                            <p className="text-xs text-gray-200 leading-relaxed">{evaluationResult.remediation.weakness}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider block">Root Cause Analysis</span>
                                            <p className="text-xs text-gray-200 leading-relaxed">{evaluationResult.remediation.reason}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Recommended Next Step</span>
                                            <p className="text-xs text-gray-200 leading-relaxed font-semibold">{evaluationResult.remediation.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Detailed Question Feedback</h5>
                                {(evaluationResult.feedback || []).map((item, idx) => (
                                    <div key={idx} className="border border-white/5 rounded-xl bg-white/2 overflow-hidden">
                                        <button 
                                            onClick={() => toggleFeedback(idx)}
                                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-all"
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                {item.result === 'correct' ? (
                                                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-300 truncate">Q{idx + 1}: {item.topic}</p>
                                                    <p className="text-[11px] text-gray-500 truncate leading-snug mt-0.5">{questionsNorm[idx]?.instruction}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold ${item.result === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                                {item.score}%
                                            </span>
                                        </button>

                                        {expandedFeedback[idx] && (
                                            <div className="px-4 pb-4 border-t border-white/5 pt-3 bg-black/20 space-y-3">
                                                <div>
                                                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Your Answer:</span>
                                                    <p className="text-[12px] text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap italic">
                                                        {questionsNorm[idx]?.options && questionsNorm[idx].options[parseInt(studentAnswers[idx])] 
                                                            ? `"${questionsNorm[idx].options[parseInt(studentAnswers[idx])]}"`
                                                            : `"${studentAnswers[idx] || '(No answer provided)'}"`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">AI Assessment & Analysis:</span>
                                                    <p className="text-[12px] text-gray-300 mt-1 leading-relaxed whitespace-pre-wrap">
                                                        {item.feedbackText}
                                                    </p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                                                    <span className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Expected Document Fact:</span>
                                                    <p className="text-[12px] text-orange-200/80 mt-1 leading-relaxed italic">
                                                        {questionsNorm[idx]?.options && typeof questionsNorm[idx].correctIndex === 'number'
                                                            ? `Correct option: "${questionsNorm[idx].options[questionsNorm[idx].correctIndex]}"`
                                                            : `"${questionsNorm[idx]?.output}"`}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Animate>
                    ) : viewMode === 'section' ? (
                        /* Section Worksheet View */
                        <div className="space-y-6">
                            {questionsNorm.map((q, qIdx) => {
                                const ans = studentAnswers[qIdx] || '';
                                const isAns = String(ans).trim() !== '';
                                return (
                                    <div
                                        key={qIdx}
                                        ref={el => (questionRefs.current[qIdx] = el)}
                                        className={`rounded-2xl p-5 border transition-all ${
                                            isAns
                                                ? 'bg-indigo-500/5 border-indigo-500/30'
                                                : 'bg-white/2 border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                                                    isAns ? 'bg-indigo-600 text-white' : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                                                }`}>
                                                    Q{qIdx + 1}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
                                                            Difficulty: {q.difficulty || 'Adaptive'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 font-semibold">
                                                            • Topic: {q.topic || 'General'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-200 leading-relaxed">
                                                        {q.instruction}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleFlag(qIdx)}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    flagged[qIdx] ? 'text-amber-400 bg-amber-500/10' : 'text-gray-600 hover:text-gray-400'
                                                }`}
                                                title="Flag for review"
                                            >
                                                <Flag size={13} />
                                            </button>
                                        </div>

                                        {q.options && q.options.length > 0 ? (
                                            <div className="flex flex-col gap-2 mt-3">
                                                {q.options.map((option, optIdx) => {
                                                    const isSelected = studentAnswers[qIdx] === String(optIdx);
                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            type="button"
                                                            onClick={() => handleAnswerChangeAtIndex(qIdx, String(optIdx))}
                                                            className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-200 flex items-start gap-3 ${
                                                                isSelected 
                                                                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold' 
                                                                    : 'border-white/5 bg-black/40 text-gray-300 hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                                                                isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-current/25'
                                                            }`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </span>
                                                            <span className="flex-1">{option}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 mt-3">
                                                <textarea
                                                    value={studentAnswers[qIdx] || ''}
                                                    onChange={(e) => handleAnswerChangeAtIndex(qIdx, e.target.value)}
                                                    disabled={isEvaluating}
                                                    placeholder="Write your explanation here. Use reasoning, examples, and predictions where appropriate..."
                                                    className="w-full min-h-[110px] p-3.5 rounded-xl bg-black/40 border border-white/10 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40 focus:bg-black/60 transition-all resize-none custom-scrollbar"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Single Focus View */
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                                <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                    Topic: {currentQuestion?.topic || 'General'}
                                </span>
                            </div>

                            <div className="rounded-2xl p-4 bg-white/2 border border-white/5 mt-2 flex-shrink-0">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                        <HelpCircle size={16} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">
                                            Difficulty: {currentQuestion?.difficulty || 'Adaptive'}
                                        </span>
                                        <p className="text-sm font-semibold text-gray-200 leading-relaxed">
                                            {currentQuestion?.instruction}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {currentQuestion?.options && currentQuestion.options.length > 0 ? (
                                <div className="flex flex-col gap-2.5 mt-2">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Select Answer Option:</span>
                                    {currentQuestion.options.map((option, idx) => {
                                        const isSelected = studentAnswers[currentIndex] === String(idx);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleAnswerChangeAtIndex(currentIndex, String(idx))}
                                                className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all duration-200 flex items-start gap-3 ${
                                                    isSelected 
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold' 
                                                        : 'border-white/5 bg-black/40 text-gray-300 hover:bg-white/5'
                                                }`}
                                            >
                                                <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                                                    isSelected ? 'border-indigo-500/50' : 'border-current/25'
                                                }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="flex-1">{option}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">Your Explanation:</span>
                                    <textarea
                                        value={studentAnswers[currentIndex] || ''}
                                        onChange={(e) => handleAnswerChangeAtIndex(currentIndex, e.target.value)}
                                        disabled={isEvaluating}
                                        placeholder="Write your explanation here. Use reasoning, examples, and predictions where appropriate..."
                                        className="w-full min-h-[140px] p-4 rounded-xl bg-black/40 border border-white/5 text-[13px] text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/30 focus:bg-black/60 transition-all resize-none custom-scrollbar"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/2 flex items-center justify-between flex-shrink-0">
                    {questionsNorm.length === 0 ? (
                        <div className="w-full flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                            >
                                Close
                            </button>
                        </div>
                    ) : evaluationResult ? (
                        <>
                            <button
                                onClick={() => setEvaluationResult(null)}
                                className="px-4 py-2 flex items-center gap-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold transition-all"
                            >
                                <RotateCcw size={13} /> Retake Quiz
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                            >
                                Finish Review
                            </button>
                        </>
                    ) : viewMode === 'section' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitQuiz}
                                disabled={isEvaluating}
                                className="px-5 py-2.5 flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                            >
                                {isEvaluating ? (
                                    <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                                ) : (
                                    <><Send size={13} /> Submit Worksheet ({answeredCount}/{questionsNorm.length})</>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={goPrev}
                                disabled={currentIndex === 0 || isEvaluating}
                                className="px-4 py-2 flex items-center gap-1.5 rounded-xl border border-white/5 hover:bg-white/5 text-gray-500 hover:text-white disabled:opacity-0 text-xs font-semibold transition-all"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>

                            {currentIndex < questionsNorm.length - 1 ? (
                                <button
                                    onClick={goNext}
                                    className="px-4 py-2.5 flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-semibold transition-all"
                                >
                                    Next Question <ChevronRight size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitQuiz}
                                    disabled={isEvaluating}
                                    className="px-5 py-2.5 flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                                >
                                    {isEvaluating ? (
                                        <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                                    ) : (
                                        <><Send size={13} /> Submit Quiz</>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </Animate>
        </div>
    );

    function goNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
        }
    }

    function goPrev() {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
        }
    }
}
