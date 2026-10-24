// server/models/BountyQuestion.js
const mongoose = require('mongoose');

const BountyQuestionSchema = new mongoose.Schema({
    bountyId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Challenge Details
    topic: {
        type: String,
        required: true
    },

    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'medium'
    },

    knowledgeGap: {
        type: String,
        required: true // e.g., "Weak in linear algebra transformations"
    },

    // Question Content
    questionText: {
        type: String,
        required: true
    },

    questionType: {
        type: String,
        enum: ['multiple_choice', 'coding', 'open_ended', 'problem_solving'],
        default: 'multiple_choice'
    },

    options: [String], // For multiple choice
    correctAnswer: String,
    explanation: String,

    // Rewards
    creditReward: {
        type: Number,
        required: true,
        default: 10
    },

    learningCreditsBonus: {
        type: Number,
        default: 20
    },

    xpBonus: {
        type: Number,
        default: 20
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'expired', 'skipped'],
        default: 'active',
        index: true
    },

    // Timing
    generatedAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: {
        type: Date,
        required: true
    },

    completedAt: Date,

    // User Response
    userAnswer: String,
    isCorrect: Boolean,

    // Metadata
    generationMethod: {
        type: String,
        enum: ['automatic_periodic', 'gap_based', 'admin_manual'],
        default: 'automatic_periodic'
    },

    sessionAnalysisData: {
        weakTopics: [String],
        avgResponseTime: Number,
        errorPatterns: [String]
    }
}, {
    timestamps: true
});

// Indexes
BountyQuestionSchema.index({ userId: 1, status: 1 });
BountyQuestionSchema.index({ expiresAt: 1 });
BountyQuestionSchema.index({ topic: 1 });

// Methods
BountyQuestionSchema.methods.isExpired = function () {
    return new Date() > this.expiresAt;
};

BountyQuestionSchema.methods.submit = function (userAnswer) {
    this.userAnswer = userAnswer;
    this.isCorrect = this.checkAnswer(userAnswer);
    if (this.isCorrect) {
        this.completedAt = new Date();
        this.status = 'completed';
    }
    return this.isCorrect;
};

BountyQuestionSchema.methods.checkAnswer = function (answer) {
    if (!answer || typeof answer !== 'string') return false;
    const cleanAns = answer.trim();
    const cleanCorrect = (this.correctAnswer || '').trim();

    if (this.questionType === 'multiple_choice') {
        if (!cleanCorrect) return false;
        // 1. Exact case-insensitive match with correctAnswer
        if (cleanAns.toLowerCase() === cleanCorrect.toLowerCase()) return true;

        // 2. Strip leading "A) ", "B. ", "Option B:" etc.
        const strippedAns = cleanAns.replace(/^(?:option\s+)?([a-dA-D])[).:\-\s]+/i, '').trim();
        if (strippedAns.toLowerCase() === cleanCorrect.toLowerCase()) return true;

        // 3. Single letter choice "A", "B", "C", "D" or "Option B"
        const letterMatch = cleanAns.match(/^(?:option\s+|answer\s*[:-]?\s*)?([a-dA-D])(?:\)|\.|\s*)$/i);
        if (letterMatch && Array.isArray(this.options) && this.options.length > 0) {
            const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
            if (idx >= 0 && idx < this.options.length) {
                const chosenOpt = (this.options[idx] || '').trim();
                if (chosenOpt.toLowerCase() === cleanCorrect.toLowerCase()) return true;
                if (cleanCorrect.toUpperCase() === letterMatch[1].toUpperCase()) return true;
            }
        }
        return false;
    }

    // For open-ended questions, if there's no correct answer, consider it correct
    // (manual review would be needed in a real system)
    if (this.questionType === 'open_ended') {
        // If no correctAnswer is set, accept any non-empty answer
        if (!this.correctAnswer || this.correctAnswer.trim() === '') {
            return Boolean(answer && answer.trim().length >= 10 && answer.trim().split(/\s+/).length >= 2);
        }
    }

    // For other types with defined answers, do case-insensitive comparison
    if (!answer || !this.correctAnswer) {
        return false;
    }

    return answer.toLowerCase().trim() === this.correctAnswer.toLowerCase().trim();
};

// Static method to expire old bounties
BountyQuestionSchema.statics.expireOldBounties = async function () {
    const now = new Date();
    const result = await this.updateMany(
        {
            status: 'active',
            expiresAt: { $lt: now }
        },
        {
            $set: { status: 'expired' }
        }
    );
    return result.modifiedCount;
};

const BountyQuestion = mongoose.model('BountyQuestion', BountyQuestionSchema);

module.exports = BountyQuestion;
