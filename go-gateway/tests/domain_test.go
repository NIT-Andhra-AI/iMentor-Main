package tests

import (
	"strings"
	"testing"

	"imentor/gateway/services"
)

func TestUserAuthAndBcrypt(t *testing.T) {
	authService := services.NewAuthService("test_secret_key_123")

	// 1. Register student
	user, token, err := authService.Register("sri_student", "sri@student.edu", "StrongPassword123!", "Computer Science", false)
	if err != nil {
		t.Fatalf("Failed to register: %v", err)
	}
	if user.ID == "" || token == "" {
		t.Errorf("Expected valid user ID and token")
	}

	// 2. Duplicate registration prevention
	_, _, errDup := authService.Register("sri_student2", "sri@student.edu", "AnotherPassword!", "CS", false)
	if errDup == nil {
		t.Errorf("Expected duplicate email registration to fail")
	}

	// 3. Login verification
	loggedInUser, loginToken, errLogin := authService.Login("sri@student.edu", "StrongPassword123!")
	if errLogin != nil {
		t.Fatalf("Login failed: %v", errLogin)
	}
	if loggedInUser.ID != user.ID || loginToken == "" {
		t.Errorf("User ID or token mismatch on login")
	}

	// 4. Bad password test
	_, _, errBadPass := authService.Login("sri@student.edu", "WrongPassword!")
	if errBadPass == nil {
		t.Errorf("Expected bad password to fail")
	}
}

func TestGamificationEngine(t *testing.T) {
	gamification := services.NewGamificationService()
	userID := "usr_test_student_1"

	// 1. Initial profile
	profile := gamification.GetOrCreateProfile(userID)
	if profile.CurrentLevel != 1 || profile.CreditsBalance != 50 {
		t.Errorf("Expected initial level 1 and 50 credits, got level %d, credits %d", profile.CurrentLevel, profile.CreditsBalance)
	}

	// 2. Award XP & Level Up (XP = 100 * level^1.5)
	// For level 2: 100 * 1^1.5 = 100 XP
	newLevel, leveledUp, rank := gamification.AwardXP(userID, 500)
	if !leveledUp || newLevel < 2 {
		t.Errorf("Expected level up from 500 XP, got level: %d (leveledUp: %v)", newLevel, leveledUp)
	}
	if rank == "" {
		t.Errorf("Expected valid rank title")
	}

	// 3. Claim Bounty
	credits, learningCredits := gamification.ClaimBounty(userID, 100, 25)
	if credits != 150 || learningCredits != 35 {
		t.Errorf("Expected 150 credits and 35 learning credits, got credits: %d, learning: %d", credits, learningCredits)
	}

	// 4. Leaderboard Ranking
	gamification.GetOrCreateProfile("usr_test_student_2")
	gamification.AwardXP("usr_test_student_2", 1500)

	leaderboard := gamification.GetLeaderboard(10)
	if len(leaderboard) < 2 {
		t.Fatalf("Expected at least 2 students on leaderboard, got %d", len(leaderboard))
	}
	if leaderboard[0].UserID != "usr_test_student_2" {
		t.Errorf("Expected highest XP student at index 0, got %s", leaderboard[0].UserID)
	}
}

func TestKnowledgeMastery(t *testing.T) {
	knowledge := services.NewKnowledgeService()
	userID := "usr_test_knowledge_1"

	// 1. Initial concept mastery updates
	// Mastered concept (> 0.8)
	knowledge.UpdateConceptMastery(userID, "c_bst", "Binary Search Trees", "DSA", 0.4, "L2_APPLICATION")
	// Struggling concept (<= 0.45)
	state := knowledge.UpdateConceptMastery(userID, "c_dp", "Dynamic Programming", "DSA", -0.1, "L1_CONCEPT")

	if len(state.MasteredTopics) != 1 || state.MasteredTopics[0] != "Binary Search Trees" {
		t.Errorf("Expected BST to be in MasteredTopics, got: %v", state.MasteredTopics)
	}
	if len(state.StrugglingTopics) != 1 || state.StrugglingTopics[0] != "Dynamic Programming" {
		t.Errorf("Expected DP to be in StrugglingTopics, got: %v", state.StrugglingTopics)
	}

	// 2. Contextual Memory Block building
	contextBlock := knowledge.GetContextualMemoryBlock(userID)
	if !strings.Contains(contextBlock, "STUDENT CONTEXTUAL MEMORY") {
		t.Errorf("Expected header in contextual memory block, got: %s", contextBlock)
	}
	if !strings.Contains(contextBlock, "Dynamic Programming") {
		t.Errorf("Expected struggling topic in contextual memory block, got: %s", contextBlock)
	}
}

func TestCourseProgress(t *testing.T) {
	courses := services.NewCourseService()
	userID := "usr_test_course_student"

	// 1. List courses
	list := courses.ListCourses("")
	if len(list) == 0 {
		t.Fatalf("Expected seeded courses list, got 0")
	}

	// 2. Get course details
	course, err := courses.GetCourseByID("course_cs101")
	if err != nil {
		t.Fatalf("Failed to get course: %v", err)
	}
	if len(course.Modules) == 0 {
		t.Errorf("Expected modules in CS101")
	}

	// 3. Update lesson progress
	progress := courses.UpdateProgress(userID, "course_cs101", "les_bst")
	if !progress.CompletedLessonIDs["les_bst"] {
		t.Errorf("Expected les_bst to be marked completed")
	}
	if progress.PercentComplete <= 0.0 {
		t.Errorf("Expected percent complete to increase, got: %.2f", progress.PercentComplete)
	}
}
