// server/models/CourseVersion.js
const mongoose = require('mongoose');

const CourseVersionSchema = new mongoose.Schema({
    courseId: { 
        type: String, 
        required: true, 
        index: true 
    }, // e.g. "machine_learning", "entrepreneurship"
    versionNumber: { 
        type: Number, 
        required: true 
    },
    topics: [{
        module: { type: String, required: true },
        topic: { type: String, required: true },
        subtopic: { type: String, required: true },
        difficulty: { type: String, default: '' },
        credits: { type: String, default: '' }
    }],
    commitMessage: { 
        type: String, 
        default: '' 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Ensure compound index for uniqueness
CourseVersionSchema.index({ courseId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('CourseVersion', CourseVersionSchema);
