import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import './TutorSessionPanel.css';

/**
 * Tutor Session Panel Component
 * Displays persistent learning progress, knowledge gaps, adaptive scaffolding info,
 * live curriculum progress, and the Real-time Concept Memory Map.
 */
const TutorSessionPanel = ({ tutorSessionData }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [curriculumProgress, setCurriculumProgress] = useState(null);
    const [liveMemoryMap, setLiveMemoryMap] = useState(null);
    const prevCourseRef = useRef(null);

    // Fetch curriculum progress and live memory map
    useEffect(() => {
        const course = tutorSessionData?.courseName;

        // Fetch Live Memory Map
        api.getLiveMemoryMap()
            .then(res => {
                if (res?.success && res.liveMap) {
                    setLiveMemoryMap(res.liveMap);
                }
            })
            .catch(() => { /* non-critical */ });

        if (!course || course === 'General' || course === prevCourseRef.current) return;
        prevCourseRef.current = course;

        api.getTutorProgress(course)
            .then(data => {
                if (data?.success) {
                    setCurriculumProgress({
                        completedSubtopics: data.completedSubtopics?.length || 0,
                        completedTopics: data.completedTopics?.length || 0,
                        totalSubtopics: data.totalSubtopics || 0,
                        totalTopics: data.totalTopics || 0,
                        currentModule: data.position?.moduleName,
                        currentTopic: data.position?.topicName,
                        currentSubtopic: data.position?.subtopicName,
                    });
                }
            })
            .catch(() => { /* non-critical */ });
    }, [tutorSessionData?.courseName]);

    if (!tutorSessionData) return null;

    const {
        learningGoal,
        studentLevel,
        knowledgeGaps = [],
        progressTracking = {},
        comprehensionLevel,
        tutorSessionId,
        masteryProgress,
    } = tutorSessionData;

    const unresolvedGaps = knowledgeGaps.filter(gap => !gap.resolved);
    const resolvedGaps = knowledgeGaps.filter(gap => gap.resolved);

    const comprehensionPercent = comprehensionLevel
        ? Math.round(comprehensionLevel * 100)
        : null;

    const masteryPercent = masteryProgress
        ? Math.round(((masteryProgress.current || 0) / (masteryProgress.required || 3.5)) * 100)
        : null;

    const curriculumPercent = curriculumProgress?.totalSubtopics > 0
        ? Math.round((curriculumProgress.completedSubtopics / curriculumProgress.totalSubtopics) * 100)
        : null;

    const getLevelBadgeColor = (level) => {
        const colors = {
            'beginner': '#ff6b6b',
            'intermediate': '#ffd93d',
            'advanced': '#6bcf7f'
        };
        return colors[level] || '#95a5a6';
    };

    return (
        <div className="tutor-session-panel">
            <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="header-left">
                    <span className="panel-icon">🎓</span>
                    <h3>Tutor Mode Active</h3>
                </div>
                <button className="expand-btn">
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {isExpanded && (
                <div className="panel-content">
                    {/* Learning Goal */}
                    <div className="info-section">
                        <div className="section-label">Learning Goal</div>
                        <div className="section-value goal-text">{learningGoal || 'Mastery Learning'}</div>
                    </div>

                    {/* Student Level */}
                    <div className="info-section">
                        <div className="section-label">Student Level</div>
                        <span
                            className="level-badge"
                            style={{ backgroundColor: getLevelBadgeColor(studentLevel || 'beginner') }}
                        >
                            {studentLevel || 'Beginner'}
                        </span>
                    </div>

                    {/* Mastery Progress Bar */}
                    {masteryPercent !== null && (
                        <div className="info-section">
                            <div className="section-label">Topic Mastery</div>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${Math.min(100, masteryPercent)}%` }}></div>
                            </div>
                            <span className="progress-text">{masteryPercent}% Mastery</span>
                        </div>
                    )}

                    {/* Live Memory Map Section */}
                    <div className="info-section memory-map-section">
                        <div className="section-label">🧠 Live Memory Map</div>
                        {liveMemoryMap && liveMemoryMap.nodes?.length > 0 ? (
                            <div className="memory-map-nodes">
                                {liveMemoryMap.nodes.slice(0, 8).map((node) => (
                                    <div key={node.id} className="concept-chip">
                                        <span className="concept-name">{node.label}</span>
                                        <span className="concept-mastery">{node.mastery}%</span>
                                    </div>
                                ))}
                                {liveMemoryMap.summary && (
                                    <div className="memory-map-summary">
                                        Overall Mastery: <strong>{liveMemoryMap.summary.overallMastery}%</strong> ({liveMemoryMap.summary.masteredConcepts}/{liveMemoryMap.summary.totalConcepts} Mastered)
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="memory-map-empty">
                                <span>Building concept graph in background...</span>
                            </div>
                        )}
                    </div>

                    {/* Curriculum Progress */}
                    {curriculumProgress && (
                        <div className="info-section">
                            <div className="section-label">Curriculum Track</div>
                            <div className="curriculum-info">
                                <div><strong>Module:</strong> {curriculumProgress.currentModule || 'N/A'}</div>
                                <div><strong>Topic:</strong> {curriculumProgress.currentTopic || 'N/A'}</div>
                                {curriculumPercent !== null && (
                                    <div className="progress-bar-container">
                                        <div className="progress-bar curriculum-bar" style={{ width: `${curriculumPercent}%` }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Knowledge Gaps */}
                    {unresolvedGaps.length > 0 && (
                        <div className="info-section">
                            <div className="section-label">Focus Areas</div>
                            <ul className="gap-list">
                                {unresolvedGaps.map((gap, idx) => (
                                    <li key={idx} className="gap-item">{gap.concept || gap}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TutorSessionPanel;
