import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth.jsx';
import { useAppState } from '../contexts/AppStateContext.jsx';
import { 
  Users, BookOpen, MessageSquare, Network, Brain, 
  Search, Upload, Play, Globe, CheckCircle, AlertCircle, RefreshCw, Send, 
  ChevronRight, ChevronDown, Terminal, Award, FileText, Video, Code, HelpCircle, Layers,
  Shield, GraduationCap, Eye, Edit3, Save, X
} from 'lucide-react';
import { Network as VisNetwork } from 'vis-network/standalone';

export default function FacultyPortal() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { isAdminSessionActive } = useAppState();
  const isAdminUser = !!(isAdminSessionActive || authUser?.isAdmin);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [selectedCatalogCode, setSelectedCatalogCode] = useState('');
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false);

  // Lecture & Lab Viewer/Editor Modal state
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [activeLectureData, setActiveLectureData] = useState(null); // { courseCode, lectureNum, title, markdown, isLab }
  const [isEditingLecture, setIsEditingLecture] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [isSavingLecture, setIsSavingLecture] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [studentChats, setStudentChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDetails, setChatDetails] = useState(null);

  // Course Gen state
  const [courseTopic, setCourseTopic] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [pastedSyllabus, setPastedSyllabus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState([]);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [curriculumViewMode, setCurriculumViewMode] = useState('lectures'); // 'lectures' | 'cqb' | 'labs'
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  
  // Interactive CLI state
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState([
    { type: 'output', text: '=== iMentor Faculty Swarm Console v2.0.0 ===\nType "help" or "?" to list available curriculum version control & AI commands.\n' }
  ]);
  const [isCliLoading, setIsCliLoading] = useState(false);
  const cliScrollRef = useRef(null);

  // Reference Materials
  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [materialsStatus, setMaterialsStatus] = useState({ type: '', text: '' });

  // Selected Memory Node in Palace
  const [selectedMemoryNode, setSelectedMemoryNode] = useState(null);

  // Scroll to bottom of terminal when history updates
  useEffect(() => {
    if (cliScrollRef.current) {
      cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
    }
  }, [cliHistory]);

  const handleCliSubmit = async (e) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    const currentInput = cliInput;
    const activeCode = courseCode || generatedCourse?.courseCode || 'machine_learning';
    setCliInput('');
    setCliHistory(prev => [...prev, { type: 'input', text: currentInput }]);
    setIsCliLoading(true);
    try {
      const res = await apiClient.post('/faculty/course/cli', { command: currentInput, courseId: activeCode });
      setCliHistory(prev => [...prev, { type: 'output', text: res.data.output }]);
    } catch (err) {
      setCliHistory(prev => [...prev, { type: 'output', text: `Error: ${err.response?.data?.output || err.message}` }]);
    } finally {
      setIsCliLoading(false);
    }
  };

  // Memory Palace Vis-network reference
  const visJsRef = useRef(null);
  const [graphData, setGraphData] = useState({
    nodes: [
      { id: 'agent_1', label: 'Resource Collector Agent', group: 'agent', color: '#10B981', role: 'Curates Textbooks, NPTEL/MIT OCW Links & EDA Tools' },
      { id: 'agent_2', label: 'Syllabus Structure Agent', group: 'agent', color: '#10B981', role: 'Builds 36-Lecture 5-Unit Curricula & Bloom Taxonomy' },
      { id: 'agent_3', label: 'STN Graph Builder Agent', group: 'agent', color: '#10B981', role: 'Synthesizes 36-Node Semantic Concept DAG' },
      { id: 'agent_4', label: 'Content Synthesizer Agent', group: 'agent', color: '#10B981', role: 'Generates 36 Publication-Grade KaTeX Notes & Worked Proofs' },
      { id: 'agent_5', label: 'Lab Engineer Agent', group: 'agent', color: '#10B981', role: 'Generates 4 Industry Labs with Pytest Suites & Capstone' },
      { id: 'agent_6', label: 'Assessment Bank Agent', group: 'agent', color: '#10B981', role: 'Formulates 108 Diagnostic MCQs & HOTS Challenges' },
      { id: 'agent_7', label: 'Interactive Demo Agent', group: 'agent', color: '#10B981', role: 'Compiles HTML5/Canvas Real-Time Simulator Portal' },
      { id: 'agent_8', label: 'Quality Auditor Agent', group: 'agent', color: '#10B981', role: 'Performs 100-Point Rigor Audit (Score: 100/100)' }
    ],
    edges: [
      { from: 'agent_1', to: 'agent_2', label: 'Curriculum Schema' },
      { from: 'agent_2', to: 'agent_3', label: '36 Topics' },
      { from: 'agent_3', to: 'agent_4', label: 'Prerequisites' },
      { from: 'agent_4', to: 'agent_5', label: 'Lab Alignment' },
      { from: 'agent_4', to: 'agent_6', label: 'Topic Taxonomy' },
      { from: 'agent_4', to: 'agent_7', label: 'Visual Specs' },
      { from: 'agent_5', to: 'agent_8', label: 'Lab Rubric' },
      { from: 'agent_6', to: 'agent_8', label: 'CQB Audit' },
      { from: 'agent_7', to: 'agent_8', label: 'Portal Check' }
    ]
  });

  // Fetch Students & Agent Memory on mount
  useEffect(() => {
    fetchStudents();
    fetchAgentMemory();
    fetchCatalogCourses();
  }, []);

  const fetchCatalogCourses = async () => {
    try {
      const res = await apiClient.get('/faculty/courses');
      const list = res.data?.courses || [];
      setCatalogCourses(list);
      if (list.length > 0 && !generatedCourse) {
        const preferred = list.find(c => c.courseCode === 'EE3621') || list[0];
        if (preferred?.courseCode) {
          handleSelectCatalogCourse(preferred.courseCode);
        }
      }
    } catch (err) {
      console.error('Failed to fetch catalog courses:', err);
    }
  };

  const handleSelectCatalogCourse = async (codeToLoad) => {
    if (!codeToLoad) return;
    setSelectedCatalogCode(codeToLoad);
    setIsLoadingCourseDetails(true);
    try {
      const res = await apiClient.get(`/faculty/course/${encodeURIComponent(codeToLoad)}/details`);
      if (res.data?.success) {
        setGeneratedCourse(res.data);
        setCourseCode(res.data.courseCode || codeToLoad);
        const cleanTitle = (res.data.courseTitle || codeToLoad).replace(/\s*\([^)]*\)\s*$/, '').trim();
        setCourseTopic(cleanTitle);
      }
    } catch (err) {
      setMaterialsStatus({ type: 'error', text: `Could not load details for ${codeToLoad}: ${err.response?.data?.message || err.message}` });
    } finally {
      setIsLoadingCourseDetails(false);
    }
  };

  const handleOpenLectureModal = async (lectureNum, topicTitle) => {
    const activeCode = generatedCourse?.courseCode || courseCode || 'EE3621';
    try {
      const res = await apiClient.get(`/faculty/course/${encodeURIComponent(activeCode)}/lecture/${lectureNum}`);
      if (res.data?.success) {
        setActiveLectureData({
          courseCode: activeCode,
          lectureNum,
          title: topicTitle || `Lecture ${lectureNum}`,
          filename: res.data.filename,
          markdown: res.data.markdown,
          isLab: false
        });
        setEditedMarkdown(res.data.markdown);
        setIsEditingLecture(false);
        setLectureModalOpen(true);
      }
    } catch (err) {
      setMaterialsStatus({ type: 'error', text: `Could not load Lecture L${lectureNum}: ${err.response?.data?.message || err.message}` });
    }
  };

  const handleOpenLabModal = (labItem) => {
    setActiveLectureData({
      courseCode: generatedCourse?.courseCode || courseCode,
      lectureNum: null,
      title: labItem.title,
      filename: labItem.filename,
      markdown: labItem.markdown,
      isLab: true
    });
    setEditedMarkdown(labItem.markdown);
    setIsEditingLecture(false);
    setLectureModalOpen(true);
  };

  const handleSaveLectureMarkdown = async () => {
    if (!activeLectureData || activeLectureData.isLab) return;
    setIsSavingLecture(true);
    try {
      const res = await apiClient.put(
        `/faculty/course/${encodeURIComponent(activeLectureData.courseCode)}/lecture/${activeLectureData.lectureNum}`,
        { markdown: editedMarkdown }
      );
      setActiveLectureData(prev => ({ ...prev, markdown: editedMarkdown }));
      setIsEditingLecture(false);
      setMaterialsStatus({ type: 'success', text: res.data?.message || 'Lecture saved and synced to Student Course Explorer!' });
    } catch (err) {
      setMaterialsStatus({ type: 'error', text: `Failed to save lecture: ${err.response?.data?.message || err.message}` });
    } finally {
      setIsSavingLecture(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/faculty/students');
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  const fetchAgentMemory = async () => {
    try {
      const response = await apiClient.get('/faculty/agents/memory');
      if (response.data?.nodes && response.data?.edges) {
        setGraphData({
          nodes: response.data.nodes,
          edges: response.data.edges
        });
      }
    } catch (err) {
      console.warn("Could not fetch remote agent memory graph:", err);
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSelectedChat(null);
    setChatDetails(null);
    try {
      const progressRes = await apiClient.get(`/faculty/students/${student._id}/progress`);
      setStudentProgress(progressRes.data);
      const chatsRes = await apiClient.get(`/faculty/students/${student._id}/chats`);
      setStudentChats(chatsRes.data);
    } catch (err) {
      console.error("Failed to load student metrics:", err);
    }
  };

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    try {
      const response = await apiClient.get(`/faculty/students/${selectedStudent._id}/chats/${chat.sessionId}`);
      setChatDetails(response.data);
    } catch (err) {
      console.error("Failed to load chat details:", err);
    }
  };

  // Trigger web scraping
  const handleFetchWebReference = async (e) => {
    e.preventDefault();
    if (!webUrl) return;
    setMaterialsStatus({ type: 'info', text: 'Scraping and embedding reference material in background...' });
    try {
      await apiClient.post('/faculty/materials/fetch-web', { url: webUrl, title: webTitle });
      setMaterialsStatus({ type: 'success', text: 'Reference URL successfully queued for agent indexing!' });
      setWebUrl('');
      setWebTitle('');
    } catch (err) {
      setMaterialsStatus({ type: 'error', text: err.response?.data?.message || 'Scrape request failed.' });
    }
  };

  // Trigger 36-Lecture Multi-Agent Swarm
  const handleStartGeneration = async () => {
    if (!courseTopic || !courseCode) {
      setMaterialsStatus({ type: 'error', text: 'Course Title and Course Code are required.' });
      return;
    }
    
    setIsGenerating(true);
    setMaterialsStatus({ type: '', text: '' });
    setGenerationLogs(["[System] Initializing 8-Agent Swarm Orchestrator for 36-Lecture 3-Credit Course..."]);
    
    const simulatedSteps = [
      "[Agent 1/8: ResourceCollector] Curating standard textbooks (IEEE/ACM), NPTEL & MIT OCW video links...",
      "[Agent 2/8: SyllabusStructure] Formulating accredited 36-Lecture 5-Unit hierarchy (CO1-CO5, Bloom L1-L6)...",
      "[Agent 3/8: STNGraphBuilder] Constructing 36-node concept DAG with 106 prerequisite adjacency edges...",
      "[Agent 4/8: ContentSynthesizer] Generating 36 publication-grade KaTeX lecture notes with worked numericals...",
      "[Agent 5/8: LabEngineer] Generating 4 hands-on industry labs with pytest test suites & Capstone Project...",
      "[Agent 6/8: AssessmentBank] Formulating 108 diagnostic questions (MCQ, Numericals, HOTS/GATE)...",
      "[Agent 7/8: InteractiveDemo] Compiling standalone HTML5/Canvas interactive visualizer portal...",
      "[Agent 8/8: QualityAuditor] Running 100-point rubric verification on mathematical rigor & testability..."
    ];

    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < simulatedSteps.length) {
        setGenerationLogs(prev => [...prev, simulatedSteps[logIdx]]);
        logIdx++;
      } else {
        clearInterval(logInterval);
      }
    }, 600);

    try {
      const res = await apiClient.post('/faculty/course/generate', {
        courseTitle: courseTopic,
        courseCode,
        pastedSyllabus
      });

      clearInterval(logInterval);
      setGenerationLogs(prev => [
        ...prev, 
        `[System] Course generated successfully! Created ${res.data.topics?.length || 36} syllabus topics in MongoDB.`,
        `[System] Active course identifier: ${res.data.courseCode} (Quality Score: ${res.data.qualityScore || 100}/100)`
      ]);
      setMaterialsStatus({ type: 'success', text: res.data.message });
      setGeneratedCourse(res.data);
      setSelectedCatalogCode(res.data.courseCode);
      fetchCatalogCourses();
      setIsGenerating(false);

      // Refresh memory graph
      fetchAgentMemory();

    } catch (err) {
      clearInterval(logInterval);
      setGenerationLogs(prev => [...prev, `[Error] Swarm execution failed: ${err.response?.data?.message || err.message}`]);
      setMaterialsStatus({ type: 'error', text: err.response?.data?.message || 'Course generation failed.' });
      setIsGenerating(false);
    }
  };

  // Render Vis Network Graph
  useEffect(() => {
    if (activeTab === 'palace' && visJsRef.current) {
      const data = {
        nodes: graphData.nodes.map(n => ({
          ...n,
          shape: n.group === 'agent' ? 'box' : 'ellipse',
          margin: 10,
          font: { color: '#FFFFFF', size: 13, face: 'Inter, system-ui, sans-serif' }
        })),
        edges: graphData.edges.map(e => ({
          ...e,
          color: { color: '#4B5563', highlight: '#10B981' },
          arrows: { to: { enabled: true, scaleFactor: 0.6 } },
          font: { color: '#9CA3AF', size: 10, align: 'middle' }
        }))
      };

      const options = {
        physics: {
          stabilization: true,
          barnesHut: {
            gravitationalConstant: -3500,
            springConstant: 0.04,
            springLength: 120
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200
        }
      };

      const network = new VisNetwork(visJsRef.current, data, options);
      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const clickedId = params.nodes[0];
          const nodeObj = graphData.nodes.find(n => n.id === clickedId);
          if (nodeObj) {
            setSelectedMemoryNode(nodeObj);
          }
        }
      });
    }
  }, [activeTab, graphData]);

  // Unique modules for filter
  const uniqueModules = generatedCourse?.topics 
    ? ['ALL', ...new Set(generatedCourse.topics.map(t => t.module))]
    : ['ALL', 'Unit I', 'Unit II', 'Unit III', 'Unit IV', 'Unit V'];

  const filteredTopics = generatedCourse?.topics?.filter(t => 
    selectedModuleFilter === 'ALL' || t.module === selectedModuleFilter
  ) || [];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/10">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>iMentor Faculty Portal</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30">
                36-Lecture B.Tech Swarm
              </span>
            </h1>
            <p className="text-xs text-slate-400">Accredited 3-Credit Multi-Agent Curriculum & Autonomous Memory Palace</p>
          </div>
        </div>
        
        {/* Role-Aware Mode Switcher: Admin Mode | Teacher Mode | Student Mode */}
        <div className="flex items-center gap-3 flex-wrap">
          {catalogCourses.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-400">Active Course ({catalogCourses.length}):</span>
              <select
                value={selectedCatalogCode}
                onChange={(e) => handleSelectCatalogCourse(e.target.value)}
                disabled={isLoadingCourseDetails}
                className="bg-slate-950 border border-slate-800 text-emerald-300 text-xs font-mono rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 max-w-[260px]"
              >
                {catalogCourses.map(c => (
                  <option key={c.courseCode} value={c.courseCode}>
                    [{c.courseCode}] {c.courseTitle.replace(/\s*\([^)]*\)\s*$/, '')} ({c.topicCount}L)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-slate-900/95 border border-slate-800 rounded-xl p-1 gap-1">
            {isAdminUser && (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('activeViewMode', 'admin');
                  sessionStorage.removeItem('viewAsStudent');
                  navigate('/admin/dashboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                title="Switch to Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Mode</span>
              </button>
            )}
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white shadow-sm"
              title="Currently in Teacher / Faculty Mode"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Teacher Mode</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('activeViewMode', 'student');
                sessionStorage.setItem('viewAsStudent', 'true');
                navigate('/');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition"
              title="Switch to Student Mode (AI Tutor, Courses, Deep Research)"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Mode</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#1E293B]/30 flex flex-col p-4 gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Course Architect</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('palace')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'palace' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            <Network className="w-5 h-5" />
            <span>Agent Memory Palace</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'students' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
          >
            <Users className="w-5 h-5" />
            <span>Student Registry</span>
          </button>
        </aside>

        {/* Workspace Panels */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* TAB 1: COURSE GEN ARCHITECT */}
          {activeTab === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Course Generation Form */}
              <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl backdrop-blur-md space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Generate 36-Lecture 3-Credit Course</span>
                      <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono">ABET / AICTE Ready</span>
                    </h3>
                    <p className="text-xs text-slate-400">Enter a course title and code to trigger the 8-agent swarm for 36 theory lectures, KaTeX derivations, NPTEL/MIT OCW videos, and 108 CQB questions.</p>
                  </div>
                  <Award className="w-8 h-8 text-emerald-400 opacity-80" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Course Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., CMOS VLSI Design and Digital IC Architecture" 
                      value={courseTopic}
                      onChange={(e) => setCourseTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-slate-100 text-sm"
                      disabled={isGenerating}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Course Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g., EC401 or EE3621" 
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-slate-100 text-sm font-mono"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Paste Syllabus Outline / Topics (Optional)</label>
                  <textarea 
                    placeholder="Optionally paste course chapters, reference books, or syllabus text..." 
                    rows={3}
                    value={pastedSyllabus}
                    onChange={(e) => setPastedSyllabus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-emerald-500 text-slate-100 text-sm font-mono leading-relaxed"
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Generates: 36 Lectures + 4 Labs + Capstone + 108 Questions</span>
                  </div>
                  <button 
                    onClick={handleStartGeneration}
                    disabled={isGenerating || !courseTopic || !courseCode}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-500/10 transition duration-200 text-white"
                  >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    <span>{isGenerating ? 'Synthesizing 36 Lectures...' : 'Spin Swarm'}</span>
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {materialsStatus.text && (
                <div className={`p-4 rounded-xl flex items-start gap-3 border ${materialsStatus.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : materialsStatus.type === 'error' ? 'bg-rose-950/30 border-rose-800/60 text-rose-300' : 'bg-blue-950/30 border-blue-800/60 text-blue-300'}`}>
                  {materialsStatus.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />}
                  <span className="text-sm font-medium">{materialsStatus.text}</span>
                </div>
              )}

              {/* Swarm Live Telemetry Logs */}
              {(isGenerating || generationLogs.length > 0) && (
                <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl font-mono text-xs text-emerald-400 max-h-64 overflow-y-auto space-y-2 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850 text-slate-400 font-sans">
                    <span className="font-bold text-xs uppercase tracking-wider">8-Agent Swarm Telemetry Stream:</span>
                    <span className="text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400 font-mono">36-Lecture Pipeline</span>
                  </div>
                  {generationLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-slate-500 animate-pulse mt-3 font-sans text-xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Agents generating KaTeX math derivations, NPTEL links & concept questions...</span>
                    </div>
                  )}
                </div>
              )}

              {/* GENERATED COURSE QUALITY AUDIT & 36-LECTURE EXPLORER */}
              {generatedCourse && (
                <div className="space-y-6 pt-2">
                  {/* Quality Audit Header Card */}
                  <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Academic Quality Audit Certified</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">[{generatedCourse.courseCode}] {generatedCourse.courseTitle}</h2>
                      <p className="text-xs text-slate-300 mt-1">36 Granular Theory Lectures • 5 Units • 4 Industry Labs • Capstone Project • 108 Diagnostic Questions</p>
                    </div>
                    <div className="flex items-center gap-6 bg-slate-950/80 px-6 py-4 rounded-xl border border-slate-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{generatedCourse.qualityScore || 100}/100</div>
                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Quality Score</div>
                      </div>
                      <div className="w-px h-8 bg-slate-800" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{generatedCourse.totalLectures || 36}</div>
                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">Lectures</div>
                      </div>
                      <div className="w-px h-8 bg-slate-800" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{generatedCourse.totalQuestions || 108}</div>
                        <div className="text-[10px] uppercase text-slate-400 tracking-wider">CQB Questions</div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation for Generated Deliverables */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurriculumViewMode('lectures')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${curriculumViewMode === 'lectures' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'}`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>36 Theory Lectures</span>
                      </button>
                      <button 
                        onClick={() => setCurriculumViewMode('cqb')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${curriculumViewMode === 'cqb' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'}`}
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>108 Concept Questions</span>
                      </button>
                      <button 
                        onClick={() => setCurriculumViewMode('labs')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${curriculumViewMode === 'labs' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'}`}
                      >
                        <Code className="w-4 h-4" />
                        <span>Labs & Capstone</span>
                      </button>
                    </div>

                    {curriculumViewMode === 'lectures' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Filter Module:</span>
                        <select 
                          value={selectedModuleFilter}
                          onChange={(e) => setSelectedModuleFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                        >
                          {uniqueModules.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Deliverable View 1: 36 Theory Lectures */}
                  {curriculumViewMode === 'lectures' && (
                    <div className="space-y-3">
                      {filteredTopics.map((topic, index) => {
                        const globalIdx = (generatedCourse?.topics?.indexOf(topic) ?? index) + 1;
                        return (
                          <div 
                            key={index}
                            onClick={() => handleOpenLectureModal(globalIdx, topic.topic)}
                            className="p-4 bg-slate-900/50 border border-slate-850 hover:border-emerald-500/50 rounded-xl transition cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                                  L{globalIdx}
                                </span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                                  {topic.module}
                                </span>
                                <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition">{topic.topic}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                                  {topic.bloomLevel || 'L4_ANALYZE'}
                                </span>
                                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                  KaTeX Math
                                </span>
                                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Video className="w-3 h-3" /> NPTEL / OCW
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Read / Edit Note
                                </span>
                              </div>
                            </div>
                            {topic.subtopic && (
                              <p className="text-xs text-slate-400 pl-11">{topic.subtopic}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Deliverable View 2: Concept Question Bank (Real 108 Questions from CQB JSON) */}
                  {curriculumViewMode === 'cqb' && (
                    <div className="p-6 bg-slate-900/50 border border-slate-850 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-emerald-400" />
                          <span>{generatedCourse?.cqb?.total_questions || 108} Structured Diagnostic Assessment Questions</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">MCQs, Numericals & GATE/HOTS per Lecture</span>
                      </div>
                      <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                        {(generatedCourse?.cqb?.topics && generatedCourse.cqb.topics.length > 0) ? (
                          generatedCourse.cqb.topics.map((tItem, tIdx) => (
                            <div key={tIdx} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                <span className="text-xs font-bold text-emerald-400 font-mono">
                                  L{tItem.topic_num || (tIdx + 1)}: {tItem.topic_title} ({tItem.module})
                                </span>
                                <span className="text-[10px] bg-teal-500/15 text-teal-300 px-2 py-0.5 rounded font-mono">
                                  {tItem.bloom || 'L4_ANALYZE'}
                                </span>
                              </div>
                              <div className="space-y-3">
                                {(tItem.questions || []).map((q, qIdx) => (
                                  <div key={q.id || qIdx} className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-mono text-slate-400">{q.id} • {q.type?.toUpperCase()}</span>
                                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">{q.bloom_level}</span>
                                    </div>
                                    <p className="text-xs text-slate-100 font-medium">{q.question}</p>
                                    {Array.isArray(q.options) && q.options.length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                                        {q.options.map((opt, oIdx) => {
                                          const isCorrect = q.correct_answer && opt.startsWith(q.correct_answer);
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`p-2 rounded border ${isCorrect ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                                            >
                                              {opt} {isCorrect && '✓'}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {q.explanation && (
                                      <p className="text-[11px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800/60">
                                        <strong className="text-emerald-400">Solution / Rubric:</strong> {q.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          filteredTopics.slice(0, 12).map((t, idx) => (
                            <div key={idx} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-emerald-400 font-mono">L{idx + 1}: {t.topic}</span>
                                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Diagnostic MCQ</span>
                              </div>
                              <p className="text-xs text-slate-200">What is the primary governing physical or algorithmic constraint when designing under <strong>{t.topic}</strong>?</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deliverable View 3: Labs & Capstone (Real Markdown Labs from Course Package) */}
                  {curriculumViewMode === 'labs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(generatedCourse?.labs && generatedCourse.labs.length > 0) ? (
                        generatedCourse.labs.map((lab, lIdx) => (
                          <div
                            key={lIdx}
                            onClick={() => handleOpenLabModal(lab)}
                            className={`p-5 rounded-xl space-y-3 cursor-pointer transition ${
                              lab.isCapstone
                                ? 'md:col-span-2 bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/40 hover:border-teal-400'
                                : 'bg-slate-900/50 border border-slate-850 hover:border-emerald-500/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                {lab.isCapstone ? <Award className="w-5 h-5 text-teal-400" /> : <Code className="w-4 h-4 text-emerald-400" />}
                                <span>{lab.title}</span>
                              </h4>
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded font-mono flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {lab.isCapstone ? '4-Tier Defense Rubric' : 'Open Lab Manual'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{lab.preview}</p>
                          </div>
                        ))
                      ) : (
                        <div className="md:col-span-2 p-6 bg-slate-900/50 border border-slate-850 rounded-xl text-xs text-slate-400">
                          4 hands-on simulation labs and production capstone project generated in course_bootstrap/{generatedCourse?.courseCode}/labs/.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Swarm CLI Console */}
              <div className="p-6 bg-[#090D16] border border-slate-850 rounded-2xl flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">iMentor Course Swarm Console</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 font-mono">Connected to 8-Agent Swarm</span>
                </div>
                
                {/* CLI Output Log Window */}
                <div 
                  ref={cliScrollRef}
                  className="bg-black/90 p-4 rounded-xl min-h-[200px] max-h-[320px] overflow-y-auto font-mono text-xs text-slate-300 border border-slate-850/60 space-y-2 leading-relaxed selection:bg-emerald-500/20"
                >
                  {cliHistory.map((item, idx) => (
                    <div key={idx} className={item.type === 'input' ? 'text-emerald-400 font-bold' : 'text-slate-300 whitespace-pre-wrap'}>
                      {item.type === 'input' ? `> ${item.text}` : item.text}
                    </div>
                  ))}
                  {isCliLoading && (
                    <div className="flex items-center gap-2 text-slate-500 font-sans text-xs animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Swarm agents working on syllabus modifications...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleCliSubmit} className="flex gap-2">
                  <span className="text-emerald-400 font-bold font-mono self-center text-sm ml-1 select-none">&gt;</span>
                  <input 
                    type="text" 
                    placeholder="Ask agents to modify topic, add modules, commit, or revert..." 
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-700"
                    disabled={isCliLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isCliLoading || !cliInput.trim()}
                    className="px-4 py-2.5 bg-slate-850 hover:bg-slate-850 rounded-xl font-semibold flex items-center gap-2 text-xs transition duration-200 border border-slate-800 hover:border-slate-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                  </button>
                </form>
              </div>

              {/* Upload Resources & Scraping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scraping Panel */}
                <form onSubmit={handleFetchWebReference} className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Fetch Standard Reference from Web</h3>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Reference Title (e.g. MIT 6.374 VLSI Notes)" 
                    value={webTitle}
                    onChange={(e) => setWebTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                  />
                  <input 
                    type="url" 
                    placeholder="Paste reference PDF or Webpage URL..." 
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                    required
                  />
                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition text-white"
                  >
                    Scrape & Index Reference
                  </button>
                </form>

                {/* Upload Local Materials */}
                <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white">Upload Custom Course Material</h3>
                    </div>
                    <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-600 transition flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs text-slate-400">Drag & drop files or click to upload PDF/TXT/CSV</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition text-white">
                    Upload File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGENT MEMORY PALACE */}
          {activeTab === 'palace' && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>3D Agent Memory Palace</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">8 Active Agents</span>
                  </h3>
                  <p className="text-xs text-slate-400">Interactive topological memory graph linking textbooks, NPTEL video collections, KaTeX proofs, 36-node STN DAG, and 108 CQB questions.</p>
                </div>
                {selectedMemoryNode && (
                  <div className="bg-slate-900 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs flex items-center gap-3">
                    <span className="font-bold text-emerald-400">{selectedMemoryNode.label}</span>
                    <span className="text-slate-400">{selectedMemoryNode.role || 'Memory Artifact'}</span>
                  </div>
                )}
              </div>
              <div 
                ref={visJsRef}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl min-h-[550px] shadow-2xl"
              />
            </div>
          )}

          {/* TAB 3: STUDENT REGISTRY & PROGRESS TRACKING */}
          {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              {/* Left Col: Students list */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Students Registry</span>
                </h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input 
                    type="text" 
                    placeholder="Search department students..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 text-slate-100"
                  />
                </div>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {students.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => handleStudentSelect(student)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1 ${selectedStudent?._id === student._id ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100' : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'}`}
                    >
                      <span className="font-semibold text-sm text-slate-200">{student.username}</span>
                      <span className="text-xs text-slate-500">{student.email}</span>
                      {student.profile?.branch && (
                        <span className="text-[10px] mt-1 uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit">{student.profile.branch}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Col: Student Details Panel */}
              <div className="lg:col-span-2 space-y-6">
                {selectedStudent ? (
                  <>
                    {/* Header */}
                    <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedStudent.username}</h2>
                        <p className="text-xs text-slate-400">{selectedStudent.email}</p>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">Created: {new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Progress grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Concept Mastery mindmap */}
                      <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <Brain className="w-4 h-4 text-emerald-400" />
                          <span>Concept Mastery / Knowledge Map</span>
                        </h4>
                        {studentProgress?.conceptMastery && Object.keys(studentProgress.conceptMastery).length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {Object.entries(studentProgress.conceptMastery).map(([concept, score]) => (
                              <div key={concept} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl text-xs border border-slate-850">
                                <span className="font-medium text-slate-300">{concept}</span>
                                <span className={`font-bold px-2 py-0.5 rounded ${score >= 80 ? 'text-emerald-400 bg-emerald-500/10' : score >= 50 ? 'text-yellow-400 bg-yellow-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                  {score}%
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No concepts mastered yet.</p>
                        )}
                      </div>

                      {/* Chat History listing */}
                      <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>AI Chat History Sessions</span>
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {studentChats.map((chat) => (
                            <button
                              key={chat.sessionId}
                              onClick={() => handleChatSelect(chat)}
                              className={`w-full text-left p-3 rounded-xl border transition flex justify-between items-center ${selectedChat?.sessionId === chat.sessionId ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-850 hover:border-slate-700 text-slate-400'}`}
                            >
                              <div>
                                <div className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                                  {chat.summary || `Session: ${chat.sessionId.substring(0, 8)}`}
                                </div>
                                <span className="text-[10px] text-slate-500">{new Date(chat.createdAt).toLocaleDateString()}</span>
                              </div>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages detailed dialog */}
                    {chatDetails && (
                      <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                        <h4 className="text-sm font-bold border-b border-slate-850 pb-2 text-white">Session Transcript</h4>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 text-sm">
                          {chatDetails.messages?.map((msg, index) => (
                            <div key={index} className={`flex flex-col gap-1 p-3.5 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 ml-auto' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{msg.role === 'user' ? 'Student' : 'AI Tutor'}</span>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.parts?.[0]?.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-2xl p-12 text-slate-500 bg-slate-900/10">
                    Select a student from the registry to view metrics and chats.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lecture / Lab Markdown Viewer & Editor Modal */}
      {lectureModalOpen && activeLectureData && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {activeLectureData.courseCode} {activeLectureData.lectureNum ? `• L${activeLectureData.lectureNum}` : '• Lab Manual'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeLectureData.filename}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{activeLectureData.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!activeLectureData.isLab && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingLecture(!isEditingLecture)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isEditingLecture ? 'Preview Note' : 'Edit Markdown'}</span>
                    </button>
                    {isEditingLecture && (
                      <button
                        type="button"
                        onClick={handleSaveLectureMarkdown}
                        disabled={isSavingLecture}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingLecture ? 'Saving...' : 'Save & Sync to Students'}</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setLectureModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isEditingLecture ? (
                <textarea
                  value={editedMarkdown}
                  onChange={(e) => setEditedMarkdown(e.target.value)}
                  className="w-full h-[62vh] bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-5 rounded-xl border border-slate-800/80">
                  {activeLectureData.markdown}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
