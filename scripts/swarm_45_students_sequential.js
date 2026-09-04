/**
 * scripts/swarm_45_students_sequential.js
 * 
 * 1. Seeds 45 distinct student accounts in MongoDB with diverse profiles & departments.
 * 2. Authenticates each student sequentially (concurrency = 1).
 * 3. Sends a unique engineering/technical question for each student profile.
 * 4. Logs full progress, metrics, and saves results to tests/reports/student_45_queries_report.json.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/imentor';
const BACKEND_PORT = process.env.PORT || 5005;
const BASE_URL = `http://localhost:${BACKEND_PORT}`;
const REPORTS_DIR = path.resolve(__dirname, '../tests/reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil & Infrastructure Engineering'
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const STYLES = ['Visual', 'Socratic', 'Auditory', 'Kinesthetic', 'Reading/Writing'];
const LEVELS = ['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const TECHNICAL_QUESTIONS = [
  { topic: 'Deep Learning & Transformers', query: 'Explain how Self-Attention in Transformers calculates Query, Key, and Value matrices with time complexity.' },
  { topic: 'Operating Systems', query: 'What is the difference between Virtual Memory Paging and Segmentation in modern Operating Systems?' },
  { topic: 'Power Electronics', query: 'Explain the Working Principle of Continuous Conduction Mode (CCM) in a Buck Converter.' },
  { topic: 'Database Systems', query: 'How does the B+ Tree index structure optimize disk I/O in Relational Databases compared to Binary Search Trees?' },
  { topic: 'Digital Signal Processing', query: 'Describe the Nyquist-Shannon Sampling Theorem and the role of anti-aliasing filters in Digital Signal Processing.' },
  { topic: 'Distributed Systems', query: 'How does the Raft Consensus Algorithm handle leader election and log replication in distributed systems?' },
  { topic: 'Computer Architecture', query: 'Explain the MESI cache coherence protocol and how cache line invalidation occurs in multi-core processors.' },
  { topic: 'Machine Learning', query: 'What are the key mathematical differences between L1 (Lasso) and L2 (Ridge) Regularization in Machine Learning?' },
  { topic: 'Computer Networks', query: 'How does TCP Cubic handle congestion window growth compared to standard TCP Reno?' },
  { topic: 'Algorithms & Graphs', query: 'Describe Dijkstra\'s Algorithm vs Bellman-Ford for shortest paths and their handling of negative weight edges.' },
  { topic: 'Control Systems', query: 'Explain the working principle and mathematical modeling of PID controller tuning via the Ziegler-Nichols method.' },
  { topic: 'Digital VLSI Design', query: 'What is the difference between Synchronous and Asynchronous FIFO buffers in digital design and Verilog?' },
  { topic: 'Cloud & Distributed Cache', query: 'How does Consistent Hashing minimize key remapping when adding or removing nodes in a distributed cache?' },
  { topic: 'Database Concurrency', query: 'Explain the difference between Optimistic Concurrency Control (OCC) and Two-Phase Locking (2PL) in database transactions.' },
  { topic: 'Neural Networks', query: 'Describe how Backpropagation uses the chain rule to compute gradients across hidden layers in Neural Networks.' },
  { topic: 'Processor Microarchitecture', query: 'What are Branch Prediction algorithms (Static vs Dynamic 2-bit saturating counter) in modern CPU pipelining?' },
  { topic: 'Thermodynamics', query: 'Explain the Carnot Cycle efficiency formula and why real heat engines cannot exceed Carnot efficiency.' },
  { topic: 'Signal Analysis', query: 'How does the Fast Fourier Transform (FFT) reduce the computational complexity from O(N^2) to O(N log N) via Cooley-Tukey?' },
  { topic: 'Linux Kernel & Systems', query: 'Explain how Epoll differs from Select and Poll in Linux kernel event demultiplexing.' },
  { topic: 'Distributed Consistency', query: 'What is the role of Vector Clocks in tracking causal consistency across distributed systems?' },
  { topic: 'Networking Protocols', query: 'Describe the state transition diagram of a TCP 3-way handshake and 4-way termination sequence.' },
  { topic: 'Ensemble Learning', query: 'Explain how Gradient Boosted Decision Trees (GBDT / XGBoost) minimize loss via second-order Taylor expansion.' },
  { topic: 'Solid Mechanics', query: 'What are the structural mechanics behind Euler-Bernoulli beam theory for bending stress and deflection?' },
  { topic: 'Semiconductor Devices', query: 'Explain the difference between MOSFET Gate Charge characteristics (Q_g, Q_gd, Miller Plateau) during hard switching.' },
  { topic: 'Language Runtimes', query: 'How does Garbage Collection in V8 (Scavenge generational vs Mark-Sweep-Compact) optimize JavaScript heap memory?' },
  { topic: 'Artificial Intelligence Search', query: 'Describe how the A* search algorithm uses admissible and consistent heuristics to guarantee optimality.' },
  { topic: 'Big Data Architecture', query: 'Explain the differences between Row-Oriented and Column-Oriented database storage layouts for OLAP analytics.' },
  { topic: 'GPU Systems & LLM Inference', query: 'How do FlashAttention and FlashAttention-2 optimize GPU SRAM memory tiling to avoid HBM memory bandwidth bottlenecks?' },
  { topic: 'Linear Systems', query: 'Explain the concept of Root Locus and how open-loop poles and zeros dictate closed-loop stability.' },
  { topic: 'VLSI Timing Analysis', query: 'What is the difference between Static Timing Analysis (STA) setup time (t_setup) and hold time (t_hold) violations in VLSI?' },
  { topic: 'Storage Engines', query: 'How does the Write-Ahead Logging (WAL) protocol guarantee atomicity and durability in DBMS crash recovery?' },
  { topic: 'Operating Systems Scheduling', query: 'Explain the mechanism of Deadlock Detection using Resource Allocation Graphs and the Banker\'s Algorithm.' },
  { topic: 'State Estimation & Robotics', query: 'What is the mathematical formulation of the Kalman Filter prediction and update equations in state estimation?' },
  { topic: 'Computer Vision', query: 'Explain the difference between Convolutional Neural Network (CNN) 2D convolution and Depthwise Separable convolution.' },
  { topic: 'Network Security & Cryptography', query: 'How does TLS 1.3 optimize handshake latency with 1-RTT and 0-RTT resumption while maintaining forward secrecy?' },
  { topic: 'Electrical Machines', query: 'Describe the Working Principle of a 3-Phase Induction Motor and the significance of Slip.' },
  { topic: 'Kernel Concurrency', query: 'Explain the role of Mutex vs Spinlock in multicore Linux kernel synchronization and when spinlocks are preferred.' },
  { topic: 'Probabilistic Data Structures', query: 'What is the difference between Bloom Filters and Cuckoo Filters for probabilistic membership testing?' },
  { topic: 'LLM Parameter-Efficient Tuning', query: 'How does Low-Rank Adaptation (LoRA) reduce trainable parameter count during Large Language Model fine-tuning?' },
  { topic: 'Thermal Power Engineering', query: 'Explain the Rankine Cycle with reheat and regeneration used in modern thermal power plants.' },
  { topic: 'Self-Balancing Trees', query: 'Describe how Red-Black Trees maintain logarithmic height through color rotations after insertion and deletion.' },
  { topic: 'Distributed Storage Trade-offs', query: 'What is the CAP Theorem and how do PACELC principles extend trade-offs in distributed data stores?' },
  { topic: 'Hardware I/O Architecture', query: 'Explain the difference between Direct Memory Access (DMA) burst mode and cycle stealing mode in I/O systems.' },
  { topic: 'AI Alignment & RL', query: 'How does Reinforcement Learning from Human Feedback (RLHF) use Proximal Policy Optimization (PPO) to align LLMs?' },
  { topic: 'Information Theory & Coding', query: 'Explain how Reed-Solomon Error Correction codes construct parity symbols using Galois Field (GF(2^8)) arithmetic.' }
];

async function seedStudents() {
  console.log(`\n======================================================`);
  console.log(`🌱 STEP 1: Seeding / Verifying 45 Student User Accounts`);
  console.log(`======================================================`);
  console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI);
  
  const User = require('../server/models/User');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const students = [];

  for (let i = 1; i <= 45; i++) {
    const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const year = YEARS[(i - 1) % YEARS.length];
    const style = STYLES[(i - 1) % STYLES.length];
    const level = LEVELS[(i - 1) % LEVELS.length];
    const qData = TECHNICAL_QUESTIONS[i - 1];
    const email = `student${String(i).padStart(2, '0')}@imentor.edu`;
    const username = `student_agent_${String(i).padStart(2, '0')}`;
    const name = `Student ${String(i).padStart(2, '0')} (${dept.split(' ')[0]})`;

    const studentDoc = {
      email,
      username,
      password: hashedPassword,
      isAdmin: false,
      isFaculty: false,
      hasCompletedOnboarding: true,
      emailVerified: true,
      department: dept,
      profile: {
        name,
        college: 'National Institute of Technology Andhra Pradesh',
        universityNumber: `NIT-2026-${1000 + i}`,
        degreeType: "Bachelor's",
        branch: dept,
        year,
        learningStyle: style,
        currentGoals: `Master ${qData.topic}`,
        learningLevel: level,
        learningStage: level.charAt(0) + level.slice(1).toLowerCase(),
        confidenceLevel: 60 + ((i * 3) % 35),
        quizAttempts: (i % 4) + 1,
        performanceMetrics: {
          'Core Engineering': 0.70 + ((i % 5) * 0.05),
          'Problem Solving': 0.65 + ((i % 6) * 0.05)
        }
      }
    };

    const updated = await User.findOneAndUpdate({ email }, { $set: studentDoc }, { upsert: true, new: true });
    students.push({
      index: i,
      id: updated._id.toString(),
      email,
      username,
      name,
      department: dept,
      year,
      style,
      level,
      technicalTopic: qData.topic,
      technicalQuestion: qData.query
    });
  }

  console.log(`✅ 45 Student Accounts successfully configured in database.\n`);
  await mongoose.disconnect();
  return students;
}

/**
 * Sequential Query Engine (Concurrency = 1)
 */
async function runSequentialStudentQueries(students) {
  console.log(`======================================================`);
  console.log(`🚀 STEP 2: Executing Sequential Queries (Concurrency = 1)`);
  console.log(`Total Students to Query: ${students.length}`);
  console.log(`Target Backend: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const itemNum = String(i + 1).padStart(2, '0');
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[STUDENT ${itemNum}/45] 👤 ${student.name} | 📧 ${student.email}`);
    console.log(`[DEPT] ${student.department} | [YEAR] ${student.year} | [LEVEL] ${student.level}`);
    console.log(`[TOPIC] ${student.technicalTopic}`);
    console.log(`[QUESTION] "${student.technicalQuestion}"`);

    const turnStartTime = Date.now();
    let loginSuccess = false;
    let querySuccess = false;
    let responseText = '';
    let latencyMs = 0;
    let errorMessage = null;
    let token = null;

    // 1. Authenticate (Signin)
    try {
      const signinRes = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email, password: 'password123' })
      });

      if (!signinRes.ok) {
        throw new Error(`Signin HTTP ${signinRes.status}: ${signinRes.statusText}`);
      }

      const authData = await signinRes.json();
      token = authData.token;
      loginSuccess = true;
    } catch (err) {
      errorMessage = `Auth failed: ${err.message}`;
      console.error(`❌ [AUTH ERROR] ${errorMessage}`);
    }

    // 2. Query Chat Message (Strictly Concurrency = 1)
    if (loginSuccess && token) {
      try {
        const sessionId = `swarm-sess-${student.index}-${Date.now()}`;
        const chatRes = await fetch(`${BASE_URL}/api/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            query: student.technicalQuestion,
            sessionId,
            useWebSearch: false,
            useAcademicSearch: false
          })
        });

        if (!chatRes.ok) {
          throw new Error(`Chat HTTP ${chatRes.status}: ${chatRes.statusText}`);
        }

        const contentType = chatRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonData = await chatRes.json();
          responseText = jsonData.reply?.text || jsonData.response || JSON.stringify(jsonData);
          querySuccess = true;
        } else {
          // Read SSE Stream
          const reader = chatRes.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          let tokens = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });

            let newlineIdx;
            while ((newlineIdx = sseBuffer.indexOf('\n\n')) !== -1) {
              const eventChunk = sseBuffer.slice(0, newlineIdx).trim();
              sseBuffer = sseBuffer.slice(newlineIdx + 2);

              for (const line of eventChunk.split('\n')) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6).trim();
                  if (dataStr === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.type === 'token' && typeof parsed.content === 'string') {
                      tokens.push(parsed.content);
                    } else if (parsed.type === 'final_answer') {
                      if (typeof parsed.content === 'object' && parsed.content?.text) {
                        responseText = parsed.content.text;
                      } else if (typeof parsed.content === 'string') {
                        responseText = parsed.content;
                      }
                    }
                  } catch (_) { /* ignore partial json */ }
                }
              }
            }
          }

          if (!responseText && tokens.length > 0) {
            responseText = tokens.join('');
          }
          querySuccess = true;
        }

        latencyMs = Date.now() - turnStartTime;
        const cleanPreview = responseText.replace(/\s+/g, ' ').slice(0, 160);
        console.log(`✅ [RESPONSE (${latencyMs}ms)]: ${cleanPreview}...`);
      } catch (err) {
        latencyMs = Date.now() - turnStartTime;
        errorMessage = `Query failed: ${err.message}`;
        console.error(`❌ [QUERY ERROR]: ${errorMessage}`);
      }
    }

    results.push({
      studentIndex: student.index,
      email: student.email,
      name: student.name,
      department: student.department,
      year: student.year,
      topic: student.technicalTopic,
      question: student.technicalQuestion,
      loginSuccess,
      querySuccess,
      latencyMs,
      responsePreview: responseText.slice(0, 300),
      fullResponseLength: responseText.length,
      errorMessage,
      timestamp: new Date().toISOString()
    });

    // Brief cooldown between sequential turns
    await new Promise(r => setTimeout(r, 400));
  }

  const totalDurationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const successCount = results.filter(r => r.querySuccess).length;

  console.log(`\n======================================================`);
  console.log(`🏁 EXECUTION SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Students Processed: ${results.length}`);
  console.log(`Successful Queries       : ${successCount} / ${results.length} (100% Sequential)`);
  console.log(`Total Time Taken         : ${totalDurationSec}s`);
  console.log(`Average Latency per Query: ${(results.reduce((acc, r) => acc + r.latencyMs, 0) / results.length).toFixed(0)}ms`);

  const reportPath = path.join(REPORTS_DIR, 'student_45_queries_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalStudents: results.length,
      successfulQueries: successCount,
      totalDurationSeconds: parseFloat(totalDurationSec),
      concurrency: 1,
      executedAt: new Date().toISOString()
    },
    results
  }, null, 2));

  console.log(`📄 Detailed Report saved to: ${reportPath}\n`);
}

async function main() {
  try {
    const students = await seedStudents();
    await runSequentialStudentQueries(students);
  } catch (err) {
    console.error('Fatal execution error:', err);
    process.exit(1);
  }
}

main();
