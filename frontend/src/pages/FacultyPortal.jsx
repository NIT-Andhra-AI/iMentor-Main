import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Users, BookOpen, MessageSquare, Network, Brain, 
  Search, Upload, Play, Globe, CheckCircle, AlertCircle, RefreshCw, Send, ChevronRight, Terminal 
} from 'lucide-react';
import { Network as VisNetwork } from 'vis-network/standalone';

export default function FacultyPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [studentChats, setStudentChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatDetails, setChatDetails] = useState(null);

  // Course Gen state
  const [courseTopic, setCourseTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState([]);
  
  // Interactive CLI state
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState([
    { type: 'output', text: '=== iMentor Faculty Swarm Console v1.0.0 ===\nType "help" or "?" to list available curriculum version control & AI commands.\n' }
  ]);
  const [isCliLoading, setIsCliLoading] = useState(false);
  const cliScrollRef = useRef(null);

  // Reference Materials
  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [materialsStatus, setMaterialsStatus] = useState({ type: '', text: '' });

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
    setCliInput('');
    setCliHistory(prev => [...prev, { type: 'input', text: currentInput }]);
    setIsCliLoading(true);
    try {
      const res = await axios.post('/api/faculty/course/cli', { command: currentInput });
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
      { id: 1, label: 'Syllabus Architect', group: 'agent', color: '#10B981' },
      { id: 2, label: 'Lesson Planner', group: 'agent', color: '#10B981' },
      { id: 3, label: 'Content Developer', group: 'agent', color: '#10B981' },
      { id: 4, label: 'Multimodal Director', group: 'agent', color: '#10B981' }
    ],
    edges: [
      { from: 1, to: 2, label: 'Curriculum Schema' },
      { from: 2, to: 3, label: 'Lecture Milestones' },
      { from: 3, to: 4, label: 'Generated Material' }
    ]
  });

  // Fetch Students list on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/faculty/students');
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSelectedChat(null);
    setChatDetails(null);
    try {
      const progressRes = await axios.get(`/api/faculty/students/${student._id}/progress`);
      setStudentProgress(progressRes.data);
      const chatsRes = await axios.get(`/api/faculty/students/${student._id}/chats`);
      setStudentChats(chatsRes.data);
    } catch (err) {
      console.error("Failed to load student metrics:", err);
    }
  };

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    try {
      const response = await axios.get(`/api/faculty/students/${selectedStudent._id}/chats/${chat.sessionId}`);
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
      await axios.post('/api/faculty/materials/fetch-web', { url: webUrl, title: webTitle });
      setMaterialsStatus({ type: 'success', text: 'Reference URL successfully queued for agent indexing!' });
      setWebUrl('');
      setWebTitle('');
    } catch (err) {
      setMaterialsStatus({ type: 'error', text: err.response?.data?.message || 'Scrape request failed.' });
    }
  };

  // Trigger multi-agent course syllabus/material gen
  const handleStartGeneration = () => {
    if (!courseTopic) return;
    setIsGenerating(true);
    setGenerationLogs(["[System] Spinning up AutoGen & CrewAI instances..."]);
    
    // Simulate real-time logs from agent communication paths
    const simulatedSteps = [
      "[Syllabus Architect] Analyzing Engineering Subject constraints...",
      "[Syllabus Architect] Fetching standard topics from Qdrant/Web...",
      "[AutoGen] Architect <=> Lesson Planner: Negotiating prerequisite flow...",
      "[Lesson Planner] Allocating milestones for 12-week schedule...",
      "[Content Developer] Writing notes & generating tutoring prompts...",
      "[Multimodal Director] Formatting visual diagrams and audio-video scripts...",
      "[System] Course generation completed successfully!"
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < simulatedSteps.length) {
        setGenerationLogs(prev => [...prev, simulatedSteps[i]]);
        
        // Dynamically add memory nodes to the Palace graph
        if (i % 2 === 0) {
          const newId = Date.now() + i;
          setGraphData(prev => {
            const nextNodes = [...prev.nodes, { id: newId, label: `Memory: ${simulatedSteps[i].substring(0, 20)}...`, group: 'memory', color: '#8B5CF6' }];
            const nextEdges = [...prev.edges, { from: (i % 4) + 1, to: newId }];
            return { nodes: nextNodes, edges: nextEdges };
          });
        }
        i++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 2000);
  };

  // Render 3D-like Vis Network Graph
  useEffect(() => {
    if (activeTab === 'palace' && visJsRef.current) {
      const data = {
        nodes: graphData.nodes.map(n => ({
          ...n,
          shape: n.group === 'agent' ? 'dot' : 'diamond',
          size: n.group === 'agent' ? 24 : 12,
          font: { color: '#FFFFFF', size: 12, face: 'Outfit' }
        })),
        edges: graphData.edges.map(e => ({
          ...e,
          color: { color: '#4B5563', highlight: '#10B981' },
          arrows: { to: { enabled: true, scaleFactor: 0.5 } }
        }))
      };

      const options = {
        physics: {
          stabilization: true,
          barnesHut: {
            gravitationalConstant: -2000,
            springConstant: 0.04,
            springLength: 95
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200
        }
      };

      new VisNetwork(visJsRef.current, data, options);
    }
  }, [activeTab, graphData]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/10">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">iMentor Faculty Portal</h1>
            <p className="text-xs text-slate-400">Department Administration & Multi-Agent Curriculum Suite</p>
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
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl backdrop-blur-md">
                <h3 className="text-lg font-bold mb-2">Generate Course Syllabus & Schedule</h3>
                <p className="text-sm text-slate-400 mb-6">Enter a topic (e.g. Entrepreneurship or Edge AI) and let the multi-agent swarm generate syllabus milestones and reference files.</p>
                
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Enter engineering or entrepreneurship subject topic..." 
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-slate-100"
                    disabled={isGenerating}
                  />
                  <button 
                    onClick={handleStartGeneration}
                    disabled={isGenerating || !courseTopic}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-500/10"
                  >
                    <Play className="w-5 h-5" />
                    <span>Spin Swarm</span>
                  </button>
                </div>
              </div>

              {/* Interactive Swarm CLI Console */}
              <div className="p-6 bg-[#090D16] border border-slate-850 rounded-2xl flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">iMentor Course Swarm Console</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 font-mono">Connected to SGLang / AutoGen Swarm</span>
                </div>
                
                {/* CLI Output Log Window */}
                <div 
                  ref={cliScrollRef}
                  className="bg-black/90 p-4 rounded-xl min-h-[260px] max-h-[380px] overflow-y-auto font-mono text-xs text-slate-350 border border-slate-850/60 space-y-2 leading-relaxed selection:bg-emerald-500/20"
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
                    className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 rounded-xl font-semibold flex items-center gap-2 text-xs transition duration-200 border border-slate-800 hover:border-slate-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Agent swarm Logs */}
              {(isGenerating || generationLogs.length > 0) && (
                <div className="p-6 bg-slate-950/80 border border-slate-850 rounded-2xl font-mono text-sm text-emerald-400 max-h-80 overflow-y-auto space-y-2">
                  <h4 className="text-xs uppercase text-slate-500 tracking-wider mb-2 font-bold font-sans">Swarm Execution Logs:</h4>
                  {generationLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-slate-500 animate-pulse mt-4 font-sans text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Agents negotiating curriculum components...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Resources & Scraping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scraping Panel */}
                <form onSubmit={handleFetchWebReference} className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold">Fetch Standard Reference from Web</h3>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Reference Title (e.g. MIT DL Lecture Notes)" 
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
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition"
                  >
                    Scrape & Index Reference
                  </button>
                </form>

                {/* Upload Local Materials */}
                <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold">Upload Custom Reference Material</h3>
                    </div>
                    <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-600 transition flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs text-slate-400">Drag & drop files or click to upload PDF/TXT</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-sm font-semibold transition">
                    Upload File
                  </button>
                </div>
              </div>

              {/* Status Alert */}
              {materialsStatus.text && (
                <div className={`p-4 rounded-xl flex items-start gap-3 border ${materialsStatus.type === 'success' ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : materialsStatus.type === 'error' ? 'bg-rose-950/20 border-rose-800/40 text-rose-300' : 'bg-blue-950/20 border-blue-800/40 text-blue-300'}`}>
                  {materialsStatus.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span className="text-sm">{materialsStatus.text}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AGENT MEMORY PALACE */}
          {activeTab === 'palace' && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">3D Agent Memory Palace</h3>
                  <p className="text-sm text-slate-400">Observe interaction nodes, message exchanges, and retrieved factual databases between AutoGen & CrewAI swarms.</p>
                </div>
              </div>
              <div 
                ref={visJsRef}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl min-h-[500px]"
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
                        <h4 className="text-sm font-bold border-b border-slate-850 pb-2">Session Transcript</h4>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 text-sm">
                          {chatDetails.messages.map((msg, index) => (
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
    </div>
  );
}
