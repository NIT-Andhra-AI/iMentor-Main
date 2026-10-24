// frontend/src/components/tools/QuizInProgress.jsx
import React, { useState, useRef } from 'react';
import Button from '../core/Button';
import ConfirmationModal from '../core/ConfirmationModal';
import { ChevronLeft, ChevronRight, Layers, Square, Flag, CheckCircle2 } from 'lucide-react';

const QuizInProgress = ({ quizData = [], onSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [viewMode, setViewMode] = useState('section'); // 'section' | 'single'
    const [answers, setAnswers] = useState(new Array(quizData.length).fill(null));
    const [flagged, setFlagged] = useState({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const questionRefs = useRef({});

    const totalQuestions = quizData.length;
    const currentQuestion = quizData[currentQuestionIndex];

    if (!currentQuestion || totalQuestions === 0) return null;

    const answeredCount = answers.filter(a => a !== null).length;

    const handleSelectOption = (qIdx, option) => {
        const newAnswers = [...answers];
        newAnswers[qIdx] = option;
        setAnswers(newAnswers);
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

    const goToNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSubmit = () => {
        onSubmit(answers);
        setIsConfirmModalOpen(false);
    };

    // Group questions into sections of 5 for structured worksheet layout
    const sectionSize = 5;
    const sections = [];
    for (let i = 0; i < totalQuestions; i += sectionSize) {
        sections.push({
            title: totalQuestions > sectionSize
                ? `Section ${Math.floor(i / sectionSize) + 1} (Questions ${i + 1}–${Math.min(i + sectionSize, totalQuestions)})`
                : `All Questions (1–${totalQuestions})`,
            items: quizData.slice(i, i + sectionSize).map((q, idx) => ({ q, index: i + idx }))
        });
    }

    return (
        <>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl shadow-panel border border-border-light dark:border-border-dark space-y-5">
                {/* Sticky Top Bar: View Toggle + Question Navigator Palette */}
                <div className="sticky top-0 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md pb-4 border-b border-border-light dark:border-border-dark space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                {viewMode === 'section'
                                    ? `Worksheet View • ${answeredCount}/${totalQuestions} Answered`
                                    : `Question ${currentQuestionIndex + 1} of ${totalQuestions} • ${answeredCount}/${totalQuestions} Answered`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-border-light dark:border-border-dark">
                            <button
                                type="button"
                                onClick={() => setViewMode('section')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'section'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                                }`}
                            >
                                <Layers size={13} /> Section Worksheet
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('single')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                    viewMode === 'single'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark'
                                }`}
                            >
                                <Square size={13} /> Single Focus
                            </button>
                        </div>
                    </div>

                    {/* Question Navigator Palette */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {quizData.map((_, idx) => {
                            const isAnswered = answers[idx] !== null;
                            const isFlagged = !!flagged[idx];
                            const isCurrent = viewMode === 'single' && currentQuestionIndex === idx;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => jumpToQuestion(idx)}
                                    title={`Question ${idx + 1}${isFlagged ? ' (Flagged for review)' : ''}${isAnswered ? ' (Answered)' : ''}`}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all border ${
                                        isCurrent
                                            ? 'ring-2 ring-primary border-primary bg-primary/20 text-primary'
                                            : isFlagged
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                : isAnswered
                                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                    : 'bg-gray-100 dark:bg-gray-800 border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark hover:border-primary/50'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* BODY: Section Worksheet View vs Single Question View */}
                {viewMode === 'section' ? (
                    <div className="space-y-8">
                        {sections.map((sec, sIdx) => (
                            <div key={sIdx} className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                                        {sec.title}
                                    </h4>
                                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                        {sec.items.filter(item => answers[item.index] !== null).length}/{sec.items.length} completed
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    {sec.items.map(({ q, index: qIdx }) => {
                                        const isAnswered = answers[qIdx] !== null;
                                        const isFlagged = !!flagged[qIdx];
                                        return (
                                            <div
                                                key={qIdx}
                                                ref={el => (questionRefs.current[qIdx] = el)}
                                                className={`p-5 rounded-xl border transition-all ${
                                                    isAnswered
                                                        ? 'border-primary/40 bg-primary/5'
                                                        : 'border-border-light dark:border-border-dark bg-gray-50/40 dark:bg-gray-800/30'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
                                                            isAnswered ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark'
                                                        }`}>
                                                            Q{qIdx + 1}
                                                        </span>
                                                        <h3 className="text-base font-bold text-text-light dark:text-text-dark leading-snug">
                                                            {q.question}
                                                        </h3>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFlag(qIdx)}
                                                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 shrink-0 transition-colors ${
                                                            isFlagged
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                : 'text-text-muted-light dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                                                        }`}
                                                        title="Flag for review"
                                                    >
                                                        <Flag size={13} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2.5 mt-3">
                                                    {(q.options || []).map((option, optIdx) => {
                                                        const isSelected = answers[qIdx] === option;
                                                        return (
                                                            <button
                                                                key={optIdx}
                                                                type="button"
                                                                onClick={() => handleSelectOption(qIdx, option)}
                                                                className={`w-full text-left p-3.5 border rounded-lg transition-all duration-150 flex items-center ${
                                                                    isSelected
                                                                        ? 'bg-primary/20 border-primary ring-1 ring-primary font-medium'
                                                                        : 'bg-surface-light dark:bg-gray-800/90 border-border-light dark:border-border-dark hover:bg-primary/10 hover:border-primary/50'
                                                                }`}
                                                            >
                                                                <span className="font-bold mr-3 text-primary">
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span className="text-sm">{option}</span>
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

                        <div className="flex items-center justify-between pt-4 border-t border-border-light dark:border-border-dark">
                            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                                {answeredCount === totalQuestions
                                    ? 'All questions answered! Ready to submit.'
                                    : `Please answer all ${totalQuestions} questions before submitting (${totalQuestions - answeredCount} remaining).`}
                            </span>
                            <Button
                                onClick={handleSubmit}
                                disabled={answers.some(a => a === null)}
                                leftIcon={<CheckCircle2 size={16} />}
                            >
                                Submit All Answers ({answeredCount}/{totalQuestions})
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Single Focus Mode */
                    <div>
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-primary">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
                                <h3 className="text-xl font-bold mt-1">{currentQuestion.question}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleFlag(currentQuestionIndex)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition-colors ${
                                    flagged[currentQuestionIndex]
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                        : 'border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark'
                                }`}
                            >
                                <Flag size={13} /> {flagged[currentQuestionIndex] ? 'Flagged' : 'Flag'}
                            </button>
                        </div>
                        <div className="space-y-3 my-6">
                            {(currentQuestion.options || []).map((option, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectOption(currentQuestionIndex, option)}
                                    className={`w-full text-left p-4 border rounded-lg transition-all duration-150 flex items-center
                                        ${answers[currentQuestionIndex] === option
                                            ? 'bg-primary/20 border-primary ring-2 ring-primary'
                                            : 'bg-gray-50 dark:bg-gray-800 border-border-light dark:border-border-dark hover:bg-primary/10 hover:border-primary/50'
                                        }`}
                                >
                                    <span className="font-bold mr-3 text-primary">{String.fromCharCode(65 + index)}</span>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-light dark:border-border-dark">
                            <Button onClick={goToPrevious} disabled={currentQuestionIndex === 0} variant="outline" leftIcon={<ChevronLeft />}>
                                Previous
                            </Button>

                            <div className="flex items-center gap-2">
                                {answeredCount === totalQuestions && currentQuestionIndex < totalQuestions - 1 && (
                                    <Button onClick={handleSubmit} variant="primary">
                                        Submit All ({answeredCount}/{totalQuestions})
                                    </Button>
                                )}
                                {currentQuestionIndex === totalQuestions - 1 ? (
                                    <Button onClick={handleSubmit} disabled={answers.some(a => a === null)}>
                                        Submit Answers
                                    </Button>
                                ) : (
                                    <Button onClick={goToNext} disabled={currentQuestionIndex === totalQuestions - 1} rightIcon={<ChevronRight />}>
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                title="Submit Quiz"
                message="Are you sure you want to submit your answers? You won't be able to change them."
                confirmText="Submit"
                confirmVariant="primary"
            />
        </>
    );
};

export default QuizInProgress;