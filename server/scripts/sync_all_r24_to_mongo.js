#!/usr/bin/env node
/**
 * Synchronizes all 36-Lecture R24 Course Packages from course_bootstrap/
 * into MongoDB UploadedCurriculum so they are immediately discoverable
 * and explorable under Student Courses, Subjects, and Tutor Mode.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const UploadedCurriculum = require('../models/UploadedCurriculum');
const User = require('../models/User');

function parseSyllabusCsv(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) return [];
    const topics = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let insideQuotes = false;
        let entry = '';
        for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                row.push(entry.trim());
                entry = '';
            } else {
                entry += char;
            }
        }
        row.push(entry.trim());

        if (row.length >= 4) {
            const cleanModule = (row[2] || `Unit ${Math.floor(topics.length / 7) + 1}`).replace(/^"|"$/g, '');
            const cleanTopic = (row[3] || `Topic ${topics.length + 1}`).replace(/^"|"$/g, '');
            const cleanSubtopic = (row[4] || '').replace(/^"|"$/g, '');
            const cleanPrereqs = (row[5] || 'None').replace(/^"|"$/g, '');
            const cleanBloom = (row[6] || 'L3_APPLY').replace(/^"|"$/g, '');

            topics.push({
                module: cleanModule,
                topic: cleanTopic,
                subtopic: cleanSubtopic,
                prerequisites: cleanPrereqs,
                bloomLevel: cleanBloom,
                difficulty: cleanBloom.includes('L2') ? 'easy' : (cleanBloom.includes('L5') || cleanBloom.includes('L6') ? 'hard' : 'medium'),
                credits: '3'
            });
        }
    }
    return topics;
}

async function syncAllCourses() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27018/imentor';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    let adminUser = await User.findOne({ isFaculty: true }) || await User.findOne();
    if (!adminUser) {
        adminUser = new User({
            username: 'faculty_admin',
            email: 'faculty@imentor.edu',
            isFaculty: true,
            hasCompletedOnboarding: true
        });
        await adminUser.save();
    }

    const baseDir = path.join(__dirname, '..', '..', 'course_bootstrap');
    const courseDirs = fs.readdirSync(baseDir).filter(d => 
        fs.statSync(path.join(baseDir, d)).isDirectory() && !['agents', '__pycache__'].includes(d)
    );

    console.log(`Found ${courseDirs.length} course directories to ingest.`);
    let synced = 0;

    for (const code of courseDirs) {
        const cDir = path.join(baseDir, code);
        const syllabusPath = path.join(cDir, 'syllabus.csv');
        if (!fs.existsSync(syllabusPath)) continue;

        const csvContent = fs.readFileSync(syllabusPath, 'utf-8');
        const topics = parseSyllabusCsv(csvContent);
        if (topics.length === 0) continue;

        const resourcesPath = path.join(cDir, 'resources.json');
        let courseTitle = code;
        if (fs.existsSync(resourcesPath)) {
            try {
                const resData = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'));
                courseTitle = resData.course_name ? `${resData.course_name} (${code})` : code;
            } catch (e) {}
        }

        const auditPath = path.join(cDir, 'quality_audit_report.json');
        let qualityScore = 100;
        if (fs.existsSync(auditPath)) {
            try {
                qualityScore = JSON.parse(fs.readFileSync(auditPath, 'utf-8')).quality_score || 100;
            } catch (e) {}
        }

        const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        let record = await UploadedCurriculum.findOne({ hash: `gen_${cleanCode}` });
        if (!record) {
            record = new UploadedCurriculum({
                userId: adminUser._id,
                filename: `${cleanCode}_syllabus.csv`,
                hash: `gen_${cleanCode}`,
                courseTitle: courseTitle,
                status: 'ready'
            });
        } else {
            record.courseTitle = courseTitle;
        }

        record.topics = topics;
        record.moduleCount = [...new Set(topics.map(t => t.module))].length;
        record.topicCount = topics.length;
        record.qualityScore = qualityScore;
        record.totalLabs = 4;
        record.totalQuestions = topics.length * 3;
        record.storagePath = cDir;
        await record.save();

        synced++;
        process.stdout.write(`\rSynced [${synced}/${courseDirs.length}] courses to MongoDB...`);
    }

    console.log(`\n🎉 Successfully synced ${synced} courses to MongoDB UploadedCurriculum!`);
    await mongoose.disconnect();
}

syncAllCourses().catch(err => {
    console.error('Ingestion failed:', err);
    process.exit(1);
});
