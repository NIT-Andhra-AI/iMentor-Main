const TutorStates = require('../config/tutorStates');

function emitStatus(socket, state) {
    socket.emit("tutor_status", {
        state,
        timestamp: Date.now()
    });
}

async function handleTutorQuestion(socket, question) {
    emitStatus(socket, TutorStates.THINKING);

    const intent = await analyzeIntent(question);

    emitStatus(socket, TutorStates.GENERATING);

    const rawAnswer = await generateAnswer(intent);

    emitStatus(socket, TutorStates.ANALYZING);

    const refinedAnswer = await analyzeAnswer(rawAnswer);

    emitStatus(socket, TutorStates.SUMMARIZING);

    const finalAnswer = summarize(refinedAnswer);

    socket.emit("tutor_message", {
        role: "tutor",
        content: finalAnswer
    });

    emitStatus(socket, TutorStates.IDLE);
}

function sanitizeTutorTopic(query) {
    if (!query || typeof query !== 'string') return 'General Concepts';
    let clean = query
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))[!.,\s]+/i, '')
        .replace(/^(i\s+am\s+(totally\s+)?(lost|confused|frustrated|struggling)\s+(and\s+frustrated\s+)?(with|about|in|on)|i'?m\s+(exploring|studying|learning|confused\s+about)|can\s+you\s+(please\s+)?(help\s+me\s+(debug|understand|with)|explain|teach\s+me)|what\s+is|what\s+are|help\s+me\s+(understand|debug|with)|explain|teach\s+me|calculate|solve|in)\s+/i, '')
        .replace(/(\s+are\s+driving\s+me\s+crazy.*|\s+makes?\s+zero\s+sense.*|\s+is\s+confusing.*)$/i, '')
        .replace(/(\.|\?|!)+$/, '')
        .trim();
    if (/[.!?]/.test(clean)) {
        const firstClause = clean.split(/[.!?]/)[0].trim();
        if (firstClause.length >= 4) {
            clean = firstClause;
        }
    }
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length > 6) {
        clean = words.slice(0, 6).join(' ');
    } else {
        clean = words.join(' ');
    }
    if (!clean || clean.length < 2) return 'General Concepts';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

module.exports = { handleTutorQuestion, sanitizeTutorTopic };
