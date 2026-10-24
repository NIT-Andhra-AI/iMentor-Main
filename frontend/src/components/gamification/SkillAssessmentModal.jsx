import React, { useState, useEffect, useRef } from 'react';
import Animate from '../core/Animate.jsx';
import { X, CheckCircle2, XCircle, Loader, TrendingUp, Award, Layers, Square, Flag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SkillAssessmentModal = ({ skill, onClose, onSuccess }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
    const [userAnswers, setUserAnswers] = useState([]);
    const [flagged, setFlagged] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const questionRefs = useRef({});

    useEffect(() => {
        fetchQuestions();
    }, [skill]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/gamification/skill/${skill.skillId}/assessment`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setQuestions(response.data.questions || []);
            setUserAnswers(new Array(response.data.questions?.length || 0).fill(null));
            setLoading(false);
        } catch (error) {
            console.error('[SkillAssessment] Error fetching questions:', error);
            toast.error('Failed to load assessment questions');
            setLoading(false);
        }
    };

    const handleAnswerSelectForQuestion = (qIdx, answer) => {
        const newAnswers = [...userAnswers];
        newAnswers[qIdx] = answer;
        setUserAnswers(newAnswers);
    };

    const toggleFlag = (qIdx) => {
        setFlagged(prev => ({ ...prev, [qIdx]: !prev[qIdx] }));
    };

    const jumpToQuestion = (qIdx) => {
        setCurrentQuestionIndex(qIdx);
        if (viewMode === 'section' && questionRefs.current[qIdx]) {
            questionRefs.current[qIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        if (userAnswers.some(answer => answer === null)) {
            toast.error('Please answer all questions before submitting');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/gamification/skill/${skill.skillId}/assessment`,
                { answers: userAnswers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setResult(response.data);
            setShowResults(true);

            if (response.data.justMastered) {
                toast.success('🎉 Skill Mastered! Great progress!');
            } else {
                toast.success(`Assessment completed! Score: ${response.data.score}%`);
            }

            setTimeout(() => {
                onSuccess?.(response.data);
            }, 3000);

        } catch (error) {
            console.error('[SkillAssessment] Error submitting assessment:', error);
            toast.error('Failed to submit assessment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Animate
                animation="fade-in"
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={onClose}
            >
                <Animate
                    animation="scale-in"
                    className="bg-slate-900 rounded-lg p-8 w-full max-w-2xl border border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                        <p className="text-slate-300">Loading assessment questions...</p>
                    </div>
                </Animate>
            </Animate>
        );
    }

    if (showResults) {
        const passed = result.score >= skill.masteryThreshold;
        const correct = result.results.filter(r => r.isCorrect).length;

        return (
            <Animate
                animation="fade-in"
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={onClose}
            >
                <Animate
                    animation="slide-up"
                    className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg w-full max-w-2xl border border-slate-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-6 text-center border-b border-slate-700 ${
                        passed ? 'bg-green-900/20' : 'bg-amber-900/20'
                    }`}>
                        <Animate
                            animation="scale-in"
                            delay={200}
                            className="flex justify-center mb-4"
                        >
                            {passed ? (
                                <CheckCircle2 className="w-16 h-16 text-green-400" />
                            ) : (
                                <TrendingUp className="w-16 h-16 text-amber-400" />
                            )}
                        </Animate>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {passed ? '🎉 Excellent Work!' : '📊 Assessment Complete'}
                        </h2>
                        <p className="text-slate-400">
                            {passed ? 'You\'ve mastered this skill!' : 'Keep practicing to improve!'}
                        </p>
                    </div>

                    {/* Results */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <Animate
                                animation="slide-right"
                                delay={100}
                                className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700"
                            >
                                <p className="text-slate-400 text-sm">Score</p>
                                <p className="text-3xl font-bold text-blue-400 mt-2">{result.score}%</p>
                            </Animate>
                            <Animate
                                animation="slide-up"
                                delay={200}
                                className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700"
                            >
                                <p className="text-slate-400 text-sm">Correct</p>
                                <p className="text-3xl font-bold text-green-400 mt-2">
                                    {correct}/{questions.length}
                                </p>
                            </Animate>
                            <Animate
                                animation="slide-left"
                                delay={300}
                                className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700"
                            >
                                <p className="text-slate-400 text-sm">Mastery</p>
                                <p className="text-3xl font-bold text-cyan-400 mt-2">
                                    {result.newMastery}%
                                </p>
                            </Animate>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-300 mb-2">
                                Skill Mastery Progress
                            </p>
                            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 ease-out"
                                    style={{ width: `${result.newMastery}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {result.newMastery >= skill.masteryThreshold
                                    ? '✓ Mastery Unlocked!'
                                    : `Need ${skill.masteryThreshold - result.newMastery}% more for mastery`}
                            </p>
                        </div>

                        {result.newlyUnlocked && result.newlyUnlocked.length > 0 && (
                            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                                <p className="text-sm font-semibold text-green-300 flex items-center gap-2 mb-3">
                                    <Award className="w-4 h-4" />
                                    New Skills Unlocked!
                                </p>
                                <div className="space-y-1">
                                    {result.newlyUnlocked.map(skillId => (
                                        <Animate
                                            key={skillId}
                                            as="p"
                                            animation="slide-right"
                                            className="text-sm text-green-200"
                                        >
                                            ✓ {skillId}
                                        </Animate>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto">
                            <p className="text-sm font-semibold text-slate-300 mb-3">Review</p>
                            <div className="space-y-2">
                                {result.results.map((res, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${
                                            res.isCorrect
                                                ? 'bg-green-900/10 border-green-700'
                                                : 'bg-red-900/10 border-red-700'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2 text-sm">
                                            {res.isCorrect ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className={res.isCorrect ? 'text-green-200' : 'text-red-200'}>
                                                    Question {idx + 1}: {res.isCorrect ? 'Correct' : 'Incorrect'}
                                                </p>
                                                {!res.isCorrect && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {res.conceptHint || `Review "${skill.name}" in Guided Learning Mode before retrying.`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-700 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition-colors"
                        >
                            Close
                        </button>
                        {!passed && (
                            <button
                                onClick={() => {
                                    setShowResults(false);
                                    setResult(null);
                                    setCurrentQuestionIndex(0);
                                    setFlagged({});
                                    fetchQuestions();
                                }}
                                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                            >
                                Try Again (New Questions)
                            </button>
                        )}
                    </div>
                </Animate>
            </Animate>
        );
    }

    if (questions.length === 0) {
        return (
            <Animate
                animation="fade-in"
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={onClose}
            >
                <Animate
                    animation="scale-in"
                    className="bg-slate-900 rounded-lg p-8 w-full max-w-2xl border border-slate-700 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-slate-300">No assessment questions available</p>
                </Animate>
            </Animate>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isAnswered = userAnswers[currentQuestionIndex] !== null;
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const answersComplete = userAnswers.every(a => a !== null);
    const primaryCO = questions[0]?.courseOutcome || 'CO1';
    const primaryCOTitle = questions[0]?.coTitle || 'Course Outcome Aligned';

    const renderQuestionBadges = (q) => {
        const diff = (q?.difficulty || 'medium').toLowerCase();
        const diffBadgeClass =
            diff === 'easy'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : diff === 'hard'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        const bloomLabel = q?.bloomCode || `Bloom's: ${(q?.bloomLevel || 'apply').toUpperCase()}`;
        const coLabel = q?.courseOutcome || primaryCO;
        return (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {coLabel}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {bloomLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${diffBadgeClass}`}>
                    {diff}
                </span>
            </div>
        );
    };

    return (
        <Animate
            animation="fade-in"
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <Animate
                animation="slide-up"
                className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] border border-slate-700 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider text-blue-400 uppercase mb-0.5">
                            SKILL ASSESSMENT WORKSHEET • {primaryCO} ({primaryCOTitle})
                        </p>
                        <h2 className="text-xl font-bold text-slate-100">{skill.name}</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Stratified Blueprint: 2 Easy (L1–L2) • 2 Medium (L3 Apply) • 1 Hard (L4–L5 Analyze/Evaluate)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-700">
                            <button
                                type="button"
                                onClick={() => setViewMode('section')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'section' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" /> Section View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('single')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Square className="w-3.5 h-3.5" /> Single Focus
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-200 p-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress & Sticky Question Navigator */}
                <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-slate-400 mr-1">Questions:</span>
                            {questions.map((_, idx) => {
                                const ans = userAnswers[idx] !== null;
                                const flg = !!flagged[idx];
                                const curr = viewMode === 'single' && currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => jumpToQuestion(idx)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                                            curr
                                                ? 'border-blue-400 bg-blue-600 text-white'
                                                : flg
                                                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                                    : ans
                                                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                                                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs font-semibold text-cyan-400">
                            {answeredCount}/{questions.length} answered
                        </p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {viewMode === 'section' ? (
                        questions.map((q, qIdx) => {
                            const selected = userAnswers[qIdx];
                            return (
                                <div
                                    key={qIdx}
                                    ref={el => (questionRefs.current[qIdx] = el)}
                                    className={`p-5 rounded-xl border transition-all ${
                                        selected !== null
                                            ? 'border-blue-500/40 bg-blue-950/20'
                                            : 'border-slate-700 bg-slate-800/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-start gap-2.5">
                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold shrink-0 mt-0.5 ${
                                                selected !== null ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                                Q{qIdx + 1}
                                            </span>
                                            <div>
                                                <p className="text-base font-semibold text-slate-100 leading-relaxed">
                                                    {q.question}
                                                </p>
                                                {renderQuestionBadges(q)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleFlag(qIdx)}
                                            className={`p-1 rounded ${flagged[qIdx] ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                                            title="Flag for review"
                                        >
                                            <Flag className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2.5">
                                        {(q.options || []).map((option, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleAnswerSelectForQuestion(qIdx, option)}
                                                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                                                    selected === option
                                                        ? 'bg-blue-900/40 border-blue-500 text-white'
                                                        : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                                                        selected === option ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600 text-slate-400'
                                                    }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className="text-sm">{option}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <Animate key={currentQuestionIndex} animation="slide-up">
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-slate-100">
                                    {currentQuestion.question}
                                </p>
                                {renderQuestionBadges(currentQuestion)}
                            </div>
                            <div className="space-y-3">
                                {(currentQuestion.options || []).map((option, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleAnswerSelectForQuestion(currentQuestionIndex, option)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            userAnswers[currentQuestionIndex] === option
                                                ? 'bg-blue-900/40 border-blue-500'
                                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    userAnswers[currentQuestionIndex] === option
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-slate-600'
                                                }`}
                                            >
                                                {userAnswers[currentQuestionIndex] === option && (
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                )}
                                            </div>
                                            <span className="text-slate-200">{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Animate>
                    )}
                </div>

                {/* Navigation */}
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex gap-3">
                    {viewMode === 'section' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="py-2.5 px-5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!answersComplete || submitting}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Submit Assessment ({answeredCount}/{questions.length})
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0}
                                className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 font-semibold transition-colors"
                            >
                                Previous
                            </button>
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={!isAnswered}
                                    className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!answersComplete || submitting}
                                    className="flex-1 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Submit Assessment
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </Animate>
        </Animate>
    );
};

export default SkillAssessmentModal;
