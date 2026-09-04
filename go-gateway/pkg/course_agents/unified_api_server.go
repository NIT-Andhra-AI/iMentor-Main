package course_agents

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// UnifiedAPIServer orchestrates backend, AI services, and frontend delivery
type UnifiedAPIServer struct {
	port          int
	chatEngine    *ScaffoldChatEngine
	audioDebate   *AudioDebateSynthesizer
	openalex      *OpenAlexSearchClient
	docParser     *ScientificDocParser
	qBank         *SkillTreeQuestionBank
	orchestrator  *CourseOrchestrator
	copilot       *FacultyCopilotAgent
	frontendHub   *FrontendHubAgent
	harness       *AutonomousEvolutionHarness
	server        *http.Server
}

// NewUnifiedAPIServer initializes the tri-tier API Gateway
func NewUnifiedAPIServer(port int, outDir, sglangURL string) *UnifiedAPIServer {
	if port <= 0 {
		port = 8080
	}
	return &UnifiedAPIServer{
		port:         port,
		chatEngine:   NewScaffoldChatEngine(sglangURL, ""),
		audioDebate:  NewAudioDebateSynthesizer(),
		openalex:     NewOpenAlexSearchClient(),
		docParser:    NewScientificDocParser(),
		qBank:        NewSkillTreeQuestionBank(),
		orchestrator: NewCourseOrchestrator(outDir),
		copilot:      NewFacultyCopilotAgent(outDir),
		frontendHub:  NewFrontendHubAgent(outDir),
		harness:      NewAutonomousEvolutionHarness(outDir),
	}
}

// SetupRoutes registers all REST and static endpoints
func (s *UnifiedAPIServer) SetupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// 1. AI Services: Scaffolded Multimodal Chat with Karpathy System 1/2 Reasoning
	mux.HandleFunc("/api/chat", s.handleChat)
	mux.HandleFunc("/api/audio/debate", s.handleAudioDebate)
	mux.HandleFunc("/api/audio/interject", s.handleStudentInterjection)

	// 2. AI Services: OpenAlex Academic Search & Deep Research Synthesis
	mux.HandleFunc("/api/academic/search", s.handleAcademicSearch)
	mux.HandleFunc("/api/academic/research", s.handleDeepResearch)

	// 3. AI Services: Document Hybrid OCR & Scientific Ingestion
	mux.HandleFunc("/api/documents/parse", s.handleDocParse)

	// 4. Backend & Assessment: Skill Tree Question Bank & Boss Battles
	mux.HandleFunc("/api/assess/quiz", s.handleQuiz)
	mux.HandleFunc("/api/assess/battle", s.handleBossBattle)

	// 5. Backend & Course Engine: R24 Curriculum & Faculty VCS
	mux.HandleFunc("/api/courses/catalog", s.handleCourseCatalog)
	mux.HandleFunc("/api/faculty/session", s.handleFacultySession)

	// 6. Backend Telemetry: Evolution Harness & Protected Services Health
	mux.HandleFunc("/api/telemetry/health", s.handleTelemetryHealth)
	mux.HandleFunc("/api/telemetry/graphify", s.handleTelemetryGraphify)

	// 7. Frontend Delivery: Modern Student Chat & Faculty Dashboard
	mux.HandleFunc("/", s.handleFrontendRoot)

	return mux
}

// Start launches the non-blocking HTTP server
func (s *UnifiedAPIServer) Start() error {
	mux := s.SetupRoutes()
	s.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      corsMiddleware(mux),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	log.Printf("🚀 [Unified API Gateway] Backend, AI Services & Frontend online on http://localhost:%d", s.port)
	return s.server.ListenAndServe()
}

func (s *UnifiedAPIServer) handleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query        string     `json:"query"`
		FocusTrack   FocusTrack `json:"focus_track"`
		StudentLevel string     `json:"student_level"`
		CourseCode   string     `json:"course_code"`
		LectureNum   int        `json:"lecture_num"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	profile := &StudentProfile{
		UserID:         "student_web_session",
		FocusTrack:     req.FocusTrack,
		StudentLevel:   req.StudentLevel,
		LearningSpeed:  "NORMAL",
		EmotionalState: "CURIOUS",
		ConceptMastery: map[string]float64{"power_electronics": 0.65},
		ActiveCourse:   req.CourseCode,
		ActiveLecture:  req.LectureNum,
	}

	var mem *CourseMemory
	if req.CourseCode != "" {
		mem, _ = s.copilot.LoadCourseMemory(req.CourseCode, req.LectureNum)
	}

	plan := s.chatEngine.PlanScaffolding(req.Query, profile)
	sections, err := s.chatEngine.GenerateScaffoldedResponse(req.Query, profile, mem, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Generation error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "success",
		"plan":     plan,
		"sections": sections,
	})
}

func (s *UnifiedAPIServer) handleAudioDebate(w http.ResponseWriter, r *http.Request) {
	topic := r.URL.Query().Get("topic")
	if topic == "" && r.Method == http.MethodPost {
		var req struct {
			Topic      string     `json:"topic"`
			CourseCode string     `json:"course_code"`
			FocusTrack FocusTrack `json:"focus_track"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			topic = req.Topic
			overview := s.audioDebate.SynthesizeTopicDebateForTrack(topic, req.CourseCode, req.FocusTrack)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status": "success",
				"debate": overview,
			})
			return
		}
	}

	if topic == "" {
		topic = "buck_converter"
	}
	courseCode := r.URL.Query().Get("course")
	trackStr := r.URL.Query().Get("track")
	track := FocusTrack(trackStr)
	if track == "" {
		track = TrackStandardBTech
	}

	overview := s.audioDebate.SynthesizeTopicDebateForTrack(topic, courseCode, track)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"debate": overview,
	})
}

func (s *UnifiedAPIServer) handleStudentInterjection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed. Use POST.", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Topic            string     `json:"topic"`
		CurrentTurnIndex int        `json:"current_turn_index"`
		StudentUtterance string     `json:"student_utterance"`
		FocusTrack       FocusTrack `json:"focus_track"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid JSON body: %v", err), http.StatusBadRequest)
		return
	}

	if req.Topic == "" {
		req.Topic = "buck_converter"
	}
	if req.StudentUtterance == "" {
		req.StudentUtterance = "Can you explain this from first principles?"
	}

	res := s.audioDebate.HandleStudentInterjection(req.Topic, req.CurrentTurnIndex, req.StudentUtterance, req.FocusTrack)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "success",
		"interjection": res,
	})
}

func (s *UnifiedAPIServer) handleAcademicSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing query parameter 'q'", http.StatusBadRequest)
		return
	}

	papers, err := s.openalex.SearchWorks(query, 5)
	if err != nil {
		http.Error(w, fmt.Sprintf("Academic search error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"query":  query,
		"papers": papers,
	})
}

func (s *UnifiedAPIServer) handleDeepResearch(w http.ResponseWriter, r *http.Request) {
	topic := r.URL.Query().Get("topic")
	if topic == "" {
		http.Error(w, "Missing query parameter 'topic'", http.StatusBadRequest)
		return
	}

	brief, err := s.openalex.SynthesizeDeepResearch(topic)
	if err != nil {
		http.Error(w, fmt.Sprintf("Deep research error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"brief":  brief,
	})
}

func (s *UnifiedAPIServer) handleDocParse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		DocID   string `json:"doc_id"`
		Title   string `json:"title"`
		RawText string `json:"raw_text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	parsed := s.docParser.ParseDocumentText(req.DocID, req.Title, req.RawText)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "success",
		"document": parsed,
	})
}

func (s *UnifiedAPIServer) handleQuiz(w http.ResponseWriter, r *http.Request) {
	concept := r.URL.Query().Get("concept")
	if concept == "" {
		concept = "buck_converter"
	}
	countStr := r.URL.Query().Get("count")
	count := 3
	if c, err := strconv.Atoi(countStr); err == nil && c > 0 {
		count = c
	}

	qs := s.qBank.SelectQuestions(concept, count, nil)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "success",
		"concept":   concept,
		"questions": qs,
	})
}

func (s *UnifiedAPIServer) handleBossBattle(w http.ResponseWriter, r *http.Request) {
	concept := r.URL.Query().Get("concept")
	if concept == "" {
		concept = "buck_converter"
	}
	course := r.URL.Query().Get("course")
	if course == "" {
		course = "EE3011"
	}

	battle := s.qBank.CreateBossBattle(course, concept)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"battle": battle,
	})
}

func (s *UnifiedAPIServer) handleCourseCatalog(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":        "success",
		"total_courses": len(FullEECS_EC_MA_Catalog),
		"catalog":       FullEECS_EC_MA_Catalog,
	})
}

func (s *UnifiedAPIServer) handleFacultySession(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		code = "EE3011"
	}

	status, err := s.copilot.versionManager.GetActiveSession(code)
	if err != nil {
		http.Error(w, fmt.Sprintf("Session error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "success",
		"course_code":    code,
		"session_status": status,
	})
}

func (s *UnifiedAPIServer) handleTelemetryHealth(w http.ResponseWriter, r *http.Request) {
	safety := s.harness.VerifyLiveDemoSafety()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":             "success",
		"timestamp":          time.Now(),
		"protected_services": safety,
	})
}

func (s *UnifiedAPIServer) handleTelemetryGraphify(w http.ResponseWriter, r *http.Request) {
	graph := s.harness.GraphifyCodebase()
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(graph))
}

func (s *UnifiedAPIServer) handleFrontendRoot(w http.ResponseWriter, r *http.Request) {
	chatUIPath := filepath.Join(s.frontendHub.outputDir, "student_multimodal_chat.html")
	if _, err := os.Stat(chatUIPath); err == nil {
		http.ServeFile(w, r, chatUIPath)
		return
	}
	w.Write([]byte("<h1>iMentor NextGen Unified Server</h1><p>Student Chat UI generating...</p>"))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
