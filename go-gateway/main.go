package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"imentor/gateway/config"
	"imentor/gateway/handlers"
	"imentor/gateway/middleware"
	"imentor/gateway/services"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("==================================================")
	log.Printf("🚀 Initializing iMentor High-Concurrency Go Gateway")
	log.Printf("==================================================")
	log.Printf("• Configured Target Port: %s", cfg.Port)
	log.Printf("• SGLang Inference URL:   %s", cfg.SGLangURL)
	log.Printf("• Default SGLang Model:   %s", cfg.SGLangModel)

	// 1. Initialize Services
	sglangClient := services.NewSGLangClient(cfg.SGLangURL, cfg.SGLangModel)
	resourceQueue := services.NewResourceQueueService(cfg.MaxBGConcurrency, cfg.IdleThreshold)
	rateLimiter := middleware.NewRateLimiter(cfg.RateLimitPerMin)
	authService := services.NewAuthService(cfg.JWTSecret)
	gamificationService := services.NewGamificationService()
	knowledgeService := services.NewKnowledgeService()
	courseService := services.NewCourseService()
	researchService := services.NewResearchService(sglangClient, 8)
	assessmentService := services.NewAssessmentService()
	skillTreeService := services.NewSkillTreeService()

	// 2. Initialize Handlers
	chatHandler := handlers.NewChatHandler(cfg, sglangClient, resourceQueue)
	statsHandler := handlers.NewStatsHandler(resourceQueue)
	authHandler := handlers.NewAuthHandler(authService)
	gamificationHandler := handlers.NewGamificationHandler(gamificationService)
	knowledgeHandler := handlers.NewKnowledgeHandler(knowledgeService)
	courseHandler := handlers.NewCourseHandler(courseService)
	researchHandler := handlers.NewResearchHandler(researchService, resourceQueue)
	assessmentHandler := handlers.NewAssessmentHandler(assessmentService)
	skillTreeHandler := handlers.NewSkillTreeHandler(skillTreeService)

	// 3. Router Setup
	mux := http.NewServeMux()

	// Public Health & Stats Routes
	mux.HandleFunc("/health", statsHandler.HandleHealth)
	mux.HandleFunc("/api/gateway/stats", statsHandler.HandleStats)

	// Chat Stream Route
	mux.HandleFunc("/api/chat/message", chatHandler.HandleChatMessage)

	// Deep Research Routes (JSON & SSE Stream)
	mux.HandleFunc("/api/research/start", researchHandler.HandleStartResearch)
	mux.HandleFunc("/api/research/status", researchHandler.HandleGetJob)
	mux.HandleFunc("/api/research/stream", researchHandler.HandleStreamResearch)

	// Assessment & Question Bank Routes
	mux.HandleFunc("/api/assessment/generate-quiz", assessmentHandler.HandleGenerateQuiz)
	mux.HandleFunc("/api/assessment/submit", assessmentHandler.HandleSubmitQuiz)
	mux.HandleFunc("/api/assessment/questions", assessmentHandler.HandleGetQuestions)

	// Skill Tree Routes
	mux.HandleFunc("/api/skilltree/user-tree", skillTreeHandler.HandleGetTree)
	mux.HandleFunc("/api/skilltree/complete-node", skillTreeHandler.HandleCompleteNode)

	// Authentication Routes
	mux.HandleFunc("/api/auth/register", authHandler.HandleRegister)
	mux.HandleFunc("/api/auth/login", authHandler.HandleLogin)
	mux.HandleFunc("/api/auth/me", authHandler.HandleMe)

	// Gamification Routes
	mux.HandleFunc("/api/gamification/profile", gamificationHandler.HandleProfile)
	mux.HandleFunc("/api/gamification/leaderboard", gamificationHandler.HandleLeaderboard)
	mux.HandleFunc("/api/gamification/claim-bounty", gamificationHandler.HandleClaimBounty)

	// Knowledge State Routes
	mux.HandleFunc("/api/knowledge-state/profile", knowledgeHandler.HandleGetState)
	mux.HandleFunc("/api/knowledge-state/mastery", knowledgeHandler.HandleUpdateMastery)

	// Course & Curriculum Routes
	mux.HandleFunc("/api/course/list", courseHandler.HandleListCourses)
	mux.HandleFunc("/api/course/detail", courseHandler.HandleGetCourse)
	mux.HandleFunc("/api/course/progress", courseHandler.HandleUpdateProgress)

	// 4. Wrap Middleware Pipeline
	authMw := middleware.AuthMiddleware(cfg.JWTSecret, false)
	finalHandler := middleware.CORSMiddleware(rateLimiter.Middleware(authMw(mux)))

	server := &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.Port),
		Handler:           finalHandler,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		IdleTimeout:       120 * time.Second,
	}

	// 5. Graceful Shutdown Setup
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("✓ Go Gateway configured and ready to bind on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Gateway server error: %v", err)
		}
	}()

	<-stop
	log.Println("\n🛑 Shutting down iMentor Go Gateway gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resourceQueue.Stop()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Error during server shutdown: %v", err)
	}

	log.Println("✓ Gateway stopped successfully.")
}
