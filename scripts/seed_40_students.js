const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '/home/sri/Downloads/iMentor_march/iMentorV2/server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/imentor';

const DEPARTMENTS = ['Computer Science', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const STYLES = ['Visual', 'Socratic', 'Auditory', 'Kinesthetic', 'Reading/Writing'];
const LEVELS = ['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const MODULE_GOALS = [
  'General Chat & Socratic Inquiries',
  'Adaptive Skill Tree Exploration',
  'Course Syllabus & RAG Document Retrieval',
  'Deep Research & Scholarly Synthesis',
  'Diagnostic Assessment & Concept Quiz',
  'Gamification Bounties & Leaderboard',
  'Knowledge State & Prerequisite Graph',
  'Flashcards & Study Note Generation'
];

async function seed() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  const User = require('../server/models/User');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const students = [];

  for (let i = 1; i <= 40; i++) {
    const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const year = YEARS[(i - 1) % YEARS.length];
    const style = STYLES[(i - 1) % STYLES.length];
    const level = LEVELS[(i - 1) % LEVELS.length];
    const goal = MODULE_GOALS[(i - 1) % MODULE_GOALS.length];
    const email = `student${String(i).padStart(2, '0')}@imentor.edu`;
    const username = `student_agent_${String(i).padStart(2, '0')}`;
    const name = `Student AGY ${String(i).padStart(2, '0')} (${dept.split(' ')[0]})`;

    const studentData = {
      email,
      username,
      password: hashedPassword,
      isAdmin: false,
      hasCompletedOnboarding: true,
      emailVerified: true,
      department: dept,
      profile: {
        name,
        college: 'National Institute of Technology',
        universityNumber: `NIT-2026-${1000 + i}`,
        degreeType: "Bachelor's",
        branch: dept,
        year,
        learningStyle: style,
        currentGoals: goal,
        learningLevel: level,
        learningStage: level.charAt(0) + level.slice(1).toLowerCase(),
        confidenceLevel: 50 + ((i * 7) % 45),
        quizAttempts: (i % 5),
        performanceMetrics: {
          'Data Structures': 0.5 + ((i % 5) * 0.1),
          'Digital Logic': 0.4 + ((i % 6) * 0.1),
          'Signals & Systems': 0.6 + ((i % 4) * 0.1)
        }
      }
    };

    const updated = await User.findOneAndUpdate({ email }, { $set: studentData }, { upsert: true, new: true });
    students.push({ id: updated._id, email, name, dept, year, style, level, goal });
  }

  console.log(`✅ Successfully seeded / verified ${students.length} diverse AGY Student Profiles in MongoDB!`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
