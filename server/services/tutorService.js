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
        .replace(/^(i\s+am\s+confused\s+about|can\s+you\s+explain|what\s+is|what\s+are|help\s+me\s+understand|explain|teach\s+me|calculate|solve)\s+/i, '')
        .replace(/(\.|\?|!)+$/, '')
        .trim();
    if (/[.!?]/.test(clean)) {
        clean = clean.split(/[.!?]/)[0].trim();
    }
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length > 5) {
        clean = words.slice(0, 5).join(' ');
    } else {
        clean = words.join(' ');
    }
    if (!clean) return 'General Concepts';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

module.exports = { handleTutorQuestion, sanitizeTutorTopic };
