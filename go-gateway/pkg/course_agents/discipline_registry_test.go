package course_agents

import (
	"testing"
)

func TestMultiDisciplineRegistry_AllBranches(t *testing.T) {
	registry := NewMultiDisciplineRegistry()

	// 1. Verify EEE branch
	eeeCourses := registry.GetCurriculumForDepartment(DeptEEE, 0)
	if len(eeeCourses) < 3 {
		t.Errorf("Expected at least 3 EEE courses, got %d", len(eeeCourses))
	}

	// 2. Verify CSE branch
	cseCourses := registry.GetCurriculumForDepartment(DeptCSE, 0)
	if len(cseCourses) < 4 {
		t.Errorf("Expected at least 4 CSE courses, got %d", len(cseCourses))
	}
	dsa, found := registry.GetSubject("CS2101")
	if !found || dsa.CourseName != "Data Structures & Algorithms" {
		t.Errorf("Expected CS2101 DSA found in registry")
	}

	// 3. Verify ECE branch
	eceCourses := registry.GetCurriculumForDepartment(DeptECE, 0)
	if len(eceCourses) < 3 {
		t.Errorf("Expected at least 3 ECE courses, got %d", len(eceCourses))
	}

	// 4. Verify MECH branch
	mechCourses := registry.GetCurriculumForDepartment(DeptMECH, 0)
	if len(mechCourses) < 2 {
		t.Errorf("Expected at least 2 MECH courses, got %d", len(mechCourses))
	}

	// 5. Verify CIVIL branch
	civilCourses := registry.GetCurriculumForDepartment(DeptCIVIL, 0)
	if len(civilCourses) < 2 {
		t.Errorf("Expected at least 2 CIVIL courses, got %d", len(civilCourses))
	}

	// 6. Verify Common Core
	coreCourses := registry.GetCurriculumForDepartment(DeptCORE, 1)
	if len(coreCourses) < 2 {
		t.Errorf("Expected at least 2 first-year CORE courses in Semester 1, got %d", len(coreCourses))
	}
}
