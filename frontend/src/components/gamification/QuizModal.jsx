import React, { useState, useRef } from 'react';
import { X, Check, ArrowRight, Brain, Layers, Square, Flag } from 'lucide-react';
import Button from '../core/Button.jsx';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuizModal = ({ isOpen, onClose, bounty, onQuizCompleted }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
    const [answers, setAnswers] = useState({}); // { 0: 1, 1: 3 } (questionIndex: answerIndex)
    const [flagged, setFlagged] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const questionRefs = useRef({});

    if (!isOpen || !bounty || !Array.isArray(bounty.quizData) || bounty.quizData.length === 0) return null;

    const questions = bounty.quizData;
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined).length;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const handleOptionSelect = (qIdx, optionIndex) => {
        setAnswers(prev => ({ ...prev, [qIdx]: optionIndex }));
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
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (answeredCount < totalQuestions) {
            toast.error(`Please answer all ${totalQuestions} questions before submitting.`);
            return;
        }
        setIsSubmitting(true);
        const answersArray = [];
        for (let i = 0; i < totalQuestions; i++) {
            answersArray.push(answers[i] !== undefined ? answers[i] : -1);
        }

        try {
            const result = await api.submitQuiz(bounty._id, answersArray);
            toast.success(`Quiz completed! Score: ${result.score}%`);
            onQuizCompleted(result);
            onClose();
        } catch (error) {
            console.error("Quiz submission error:", error);
            toast.error("Failed to submit quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOptionSelected = answers[currentQuestionIndex] !== undefined;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-light dark:bg-surface-dark w-full max-w-3xl rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-wrap justify-between items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Brain size={20} className="text-primary" />
                            {bounty.topic} Quiz
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                            <span>{answeredCount} of {totalQuestions} answered</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-gray-900/70 p-1 rounded-lg border border-border-light dark:border-border-dark">
                            <button
                                type="button"
                                onClick={() => setViewMode('section')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'section'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                                }`}
                            >
                                <Layers size={13} /> Section View
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('single')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'single'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                                }`}
                            >
                                <Square size={13} /> Single Card
                            </button>
                        </div>

                        <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X size={20} className="text-text-muted-light dark:text-text-muted-dark" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar + Sticky Navigator Palette */}
                <div className="bg-gray-100/70 dark:bg-gray-900/50 border-b border-border-light dark:border-border-dark">
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="px-4 py-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-text-muted-light dark:text-text-muted-dark mr-1">
                            Jump:
                        </span>
                        {questions.map((_, idx) => {
                            const isAns = answers[idx] !== undefined;
                            const isFlg = !!flagged[idx];
                            const isCurr = viewMode === 'single' && currentQuestionIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => jumpToQuestion(idx)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all border ${
                                        isCurr
                                            ? 'border-primary bg-primary text-white ring-2 ring-primary/40'
                                            : isFlg
                                                ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                                                : isAns
                                                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                                                    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {viewMode === 'section' ? (
                        questions.map((q, qIdx) => {
                            const selectedIdx = answers[qIdx];
                            return (
                                <div
                                    key={qIdx}
                                    ref={el => (questionRefs.current[qIdx] = el)}
                                    className={`p-5 rounded-xl border transition-all ${
                                        selectedIdx !== undefined
                                            ? 'border-primary/40 bg-primary/5'
                                            : 'border-border-light dark:border-border-dark bg-gray-50/40 dark:bg-gray-800/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold">
                                                Q{qIdx + 1}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {q.subTopic || 'General'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleFlag(qIdx)}
                                            className={`p-1 rounded text-xs ${
                                                flagged[qIdx] ? 'text-amber-400' : 'text-text-muted-light dark:text-text-muted-dark'
                                            }`}
                                            title="Flag for review"
                                        >
                                            <Flag size={13} />
                                        </button>
                                    </div>
                                    <h3 className="text-base font-semibold text-text-light dark:text-text-dark mb-4 leading-relaxed">
                                        {q.questionText || q.question}
                                    </h3>
                                    <div className="space-y-2.5">
                                        {(q.options || []).map((option, idx) => {
                                            const isSelected = selectedIdx === idx;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleOptionSelect(qIdx, idx)}
                                                    className={`w-full p-3.5 text-left rounded-xl border transition-all duration-200 flex items-center gap-3 group
                                                        ${isSelected
                                                            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                                                            : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors
                                                        ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary/50'}`}>
                                                        {isSelected ? <Check size={13} /> : String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-text-light dark:text-text-dark'}`}>
                                                        {option}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {currentQuestion.subTopic || 'General'}
                                </span>
                                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                    Question {currentQuestionIndex + 1} of {totalQuestions}
                                </span>
                            </div>
                            <h3 className="text-xl font-medium text-text-light dark:text-text-dark mb-6 leading-relaxed">
                                {currentQuestion.questionText || currentQuestion.question}
                            </h3>

                            <div className="space-y-3">
                                {(currentQuestion.options || []).map((option, idx) => {
                                    const isSelected = answers[currentQuestionIndex] === idx;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleOptionSelect(currentQuestionIndex, idx)}
                                            className={`w-full p-4 text-left rounded-xl border transition-all duration-200 flex items-center gap-3 group
                                                ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                                                    : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                                                ${isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary/50'}`}>
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-text-light dark:text-text-dark'}`}>
                                                {option}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    {viewMode === 'section' ? (
                        <>
                            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={answeredCount < totalQuestions || isSubmitting}
                                rightIcon={isSubmitting ? null : <ArrowRight size={16} />}
                                isLoading={isSubmitting}
                            >
                                Submit Quiz ({answeredCount}/{totalQuestions})
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={handlePrevious}
                                disabled={currentQuestionIndex === 0 || isSubmitting}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                disabled={!isOptionSelected || isSubmitting}
                                rightIcon={isSubmitting ? null : <ArrowRight size={16} />}
                                isLoading={isSubmitting}
                            >
                                {currentQuestionIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next Question'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizModal;
