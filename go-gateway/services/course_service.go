package services

import (
	"errors"
	"sync"
	"time"

	"imentor/gateway/models"
)

// CourseService manages university syllabi, modules, and student progression
type CourseService struct {
	mu       sync.RWMutex
	courses  map[string]*models.Course
	progress map[string]*models.CourseProgress // key: userID + ":" + courseID
}

// NewCourseService initializes the course catalog
func NewCourseService() *CourseService {
	cs := &CourseService{
		courses:  make(map[string]*models.Course),
		progress: make(map[string]*models.CourseProgress),
	}
	cs.seedDefaultCourses()
	return cs
}

func (s *CourseService) seedDefaultCourses() {
	cs101 := &models.Course{
		ID:          "course_cs101",
		CourseCode:  "CS101",
		Title:       "Data Structures & Algorithms",
		Department:  "Computer Science & Engineering",
		Semester:    3,
		TotalTopics: 12,
		CreatedAt:   time.Now(),
		Modules: []models.Module{
			{
				ID:           "mod_trees",
				ModuleNumber: 1,
				Title:        "Hierarchical Structures: Binary Trees & Graphs",
				Description:  "Binary search trees, AVL trees, graph traversals, and shortest path algorithms.",
				Lessons: []models.Lesson{
					{
						ID:          "les_bst",
						Title:       "Binary Search Trees: Lookup, Insertion & Deletion",
						Summary:     "Operations, invariants, and time complexity bounds of binary search trees.",
						KeyConcepts: []string{"BST Invariant", "Inorder Traversal", "O(log n) Lookup"},
						DurationMin: 45,
					},
					{
						ID:          "les_graphs",
						Title:       "Graph Theory: BFS, DFS & Dijkstra's Algorithm",
						Summary:     "Adjacency representations, breadth-first search, depth-first search, and shortest path proofs.",
						KeyConcepts: []string{"Adjacency List", "Breadth-First Search", "Dijkstra Algorithm"},
						DurationMin: 60,
					},
				},
			},
		},
	}
	s.courses[cs101.ID] = cs101
}

// ListCourses returns all active courses in the department catalog
func (s *CourseService) ListCourses(department string) []models.Course {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []models.Course
	for _, c := range s.courses {
		if department == "" || c.Department == department {
			result = append(result, *c)
		}
	}
	return result
}

// GetCourseByID retrieves a full course with modules and lessons
func (s *CourseService) GetCourseByID(courseID string) (*models.Course, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	course, exists := s.courses[courseID]
	if !exists {
		return nil, errors.New("course not found")
	}
	return course, nil
}

// UpdateProgress marks a lesson as completed and recalculates percentage
func (s *CourseService) UpdateProgress(userID, courseID, lessonID string) *models.CourseProgress {
	key := userID + ":" + courseID

	s.mu.Lock()
	defer s.mu.Unlock()

	p, exists := s.progress[key]
	if !exists {
		p = &models.CourseProgress{
			UserID:             userID,
			CourseID:           courseID,
			CompletedLessonIDs: make(map[string]bool),
		}
		s.progress[key] = p
	}

	p.CompletedLessonIDs[lessonID] = true
	p.LastAccessedAt = time.Now()

	course, courseExists := s.courses[courseID]
	if courseExists && course.TotalTopics > 0 {
		p.PercentComplete = float64(len(p.CompletedLessonIDs)) / float64(course.TotalTopics) * 100.0
		if p.PercentComplete > 100.0 {
			p.PercentComplete = 100.0
		}
	}

	return p
}
