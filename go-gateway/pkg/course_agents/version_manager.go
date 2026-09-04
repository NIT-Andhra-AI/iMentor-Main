package course_agents

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// CourseVersion represents an immutable version snapshot of a single course
type CourseVersion struct {
	VersionID     string    `json:"version_id"`
	CourseCode    string    `json:"course_code"`
	CourseName    string    `json:"course_name"`
	Author        string    `json:"author"`
	Message       string    `json:"message"`
	CreatedAt     time.Time `json:"created_at"`
	TotalLectures int       `json:"total_lectures"`
	IsLab         bool      `json:"is_lab"`
	SyllabusHash  string    `json:"syllabus_hash"`
	Tag           string    `json:"tag,omitempty"` // e.g. "stable", "gate_focused", "v1.0"
}

// VersionManifest tracks the entire version history of a course
type VersionManifest struct {
	CourseCode     string          `json:"course_code"`
	ActiveVersion  string          `json:"active_version"`
	History        []CourseVersion `json:"history"`
	LastModifiedAt time.Time       `json:"last_modified_at"`
}

// CourseVersionManager manages version control, snapshots, rollbacks, and curriculum splitting
type CourseVersionManager struct {
	baseDir string
}

// NewCourseVersionManager initializes the version manager
func NewCourseVersionManager(baseDir string) *CourseVersionManager {
	if baseDir == "" {
		baseDir = "course_bootstrap"
	}
	return &CourseVersionManager{baseDir: baseDir}
}

// SplitCurriculumToSubjectFolders extracts individual course curriculum specifications
// from the monolithic curriculum_pdf.json and places a dedicated curriculum_spec.json in each course folder.
func (vm *CourseVersionManager) SplitCurriculumToSubjectFolders(curriculumJSONPath string) (int, error) {
	parser := NewR24SyllabusParser(curriculumJSONPath)
	if err := parser.Load(); err != nil {
		return 0, fmt.Errorf("failed to load curriculum JSON: %w", err)
	}

	count := 0
	for code, parsed := range parser.cache {
		courseDir := filepath.Join(vm.baseDir, code)
		if err := os.MkdirAll(courseDir, 0755); err != nil {
			log.Printf("Warning: failed to create dir for %s: %v", code, err)
			continue
		}

		specPath := filepath.Join(courseDir, "curriculum_spec.json")
		data, err := json.MarshalIndent(parsed, "", "  ")
		if err != nil {
			continue
		}

		if err := os.WriteFile(specPath, data, 0644); err != nil {
			log.Printf("Warning: failed to write curriculum spec for %s: %v", code, err)
			continue
		}
		count++
	}

	log.Printf("✅ [Curriculum Splitter] Successfully separated %d course curricula into dedicated folders in %s", count, vm.baseDir)
	return count, nil
}

// LoadCourseSpec loads the dedicated curriculum_spec.json for a single course folder if it exists
func (vm *CourseVersionManager) LoadCourseSpec(courseCode string) (*R24ParsedCourse, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	specPath := filepath.Join(vm.baseDir, codeClean, "curriculum_spec.json")

	if _, err := os.Stat(specPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("no dedicated curriculum_spec.json found at %s", specPath)
	}

	data, err := os.ReadFile(specPath)
	if err != nil {
		return nil, err
	}

	var parsed R24ParsedCourse
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse curriculum_spec.json for %s: %w", courseCode, err)
	}

	return &parsed, nil
}

// SaveVersion creates an immutable snapshot of the course's current state (lectures, syllabus, portal, dashboards)
func (vm *CourseVersionManager) SaveVersion(courseCode, author, message, tag string) (*CourseVersion, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(vm.baseDir, codeClean)

	if _, err := os.Stat(courseDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("course directory does not exist: %s", courseDir)
	}

	timestamp := time.Now()
	versionID := fmt.Sprintf("v%s_%s", timestamp.Format("20060102_150405"), randomSuffix(4))

	versionStoreDir := filepath.Join(courseDir, ".versions", versionID)
	if err := os.MkdirAll(versionStoreDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create version snapshot directory: %w", err)
	}

	// Calculate syllabus hash
	syllabusHash := vm.computeSyllabusHash(courseDir)

	// Copy all key files and folders into the snapshot
	itemsToSnapshot := []string{
		"curriculum_spec.json",
		"syllabus.csv",
		"resources.json",
		"stn_graph.json",
		"faculty_dashboard.html",
		"lectures",
		"interactive_portal",
	}

	totalLectures := 0
	for _, item := range itemsToSnapshot {
		src := filepath.Join(courseDir, item)
		dst := filepath.Join(versionStoreDir, item)
		if _, err := os.Stat(src); err == nil {
			_ = copyPath(src, dst)
			if item == "lectures" {
				entries, _ := os.ReadDir(src)
				totalLectures = len(entries)
			}
		}
	}

	ver := CourseVersion{
		VersionID:     versionID,
		CourseCode:    codeClean,
		CourseName:    courseCode,
		Author:        author,
		Message:       message,
		CreatedAt:     timestamp,
		TotalLectures: totalLectures,
		SyllabusHash:  syllabusHash,
		Tag:           tag,
	}

	// Update Manifest
	manifest := vm.GetManifest(codeClean)
	manifest.ActiveVersion = versionID
	manifest.LastModifiedAt = timestamp
	manifest.History = append(manifest.History, ver)

	manifestPath := filepath.Join(courseDir, ".versions", "manifest.json")
	manifestData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(manifestPath, manifestData, 0644)

	log.Printf("📦 [Course VCS] Version [%s] committed for %s: '%s' (%d lectures)", versionID, codeClean, message, totalLectures)
	return &ver, nil
}

// ListVersions returns the complete history of versions for a course
func (vm *CourseVersionManager) ListVersions(courseCode string) ([]CourseVersion, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	manifest := vm.GetManifest(codeClean)
	if len(manifest.History) == 0 {
		return nil, fmt.Errorf("no version history found for course %s", courseCode)
	}
	return manifest.History, nil
}

// RevertToVersion restores the course to a previous snapshot
func (vm *CourseVersionManager) RevertToVersion(courseCode, targetVersionID string) error {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(vm.baseDir, codeClean)
	versionDir := filepath.Join(courseDir, ".versions", targetVersionID)

	if _, err := os.Stat(versionDir); os.IsNotExist(err) {
		return fmt.Errorf("version snapshot %s does not exist for course %s", targetVersionID, courseCode)
	}

	// First, auto-save a backup of the current state before reverting
	_, _ = vm.SaveVersion(courseCode, "System Auto-Backup", fmt.Sprintf("Pre-revert backup before restoring %s", targetVersionID), "backup")

	// Restore files from snapshot
	entries, err := os.ReadDir(versionDir)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		src := filepath.Join(versionDir, entry.Name())
		dst := filepath.Join(courseDir, entry.Name())

		// Remove existing destination item
		_ = os.RemoveAll(dst)
		// Copy from snapshot
		_ = copyPath(src, dst)
	}

	// Update active version in manifest
	manifest := vm.GetManifest(codeClean)
	manifest.ActiveVersion = targetVersionID
	manifest.LastModifiedAt = time.Now()
	manifestPath := filepath.Join(courseDir, ".versions", "manifest.json")
	manifestData, _ := json.MarshalIndent(manifest, "", "  ")
	_ = os.WriteFile(manifestPath, manifestData, 0644)

	log.Printf("⏪ [Course VCS] Successfully reverted %s to version [%s]", codeClean, targetVersionID)
	return nil
}

// DiffVersions compares two versions of a course's syllabus
func (vm *CourseVersionManager) DiffVersions(courseCode, v1ID, v2ID string) (string, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(vm.baseDir, codeClean)

	v1Dir := filepath.Join(courseDir, ".versions", v1ID)
	v2Dir := filepath.Join(courseDir, ".versions", v2ID)

	if _, err := os.Stat(v1Dir); os.IsNotExist(err) {
		return "", fmt.Errorf("version %s not found", v1ID)
	}
	if _, err := os.Stat(v2Dir); os.IsNotExist(err) {
		return "", fmt.Errorf("version %s not found", v2ID)
	}

	v1CSV, _ := os.ReadFile(filepath.Join(v1Dir, "syllabus.csv"))
	v2CSV, _ := os.ReadFile(filepath.Join(v2Dir, "syllabus.csv"))

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("=== Syllabus Diff for %s: %s vs %s ===\n\n", codeClean, v1ID, v2ID))

	lines1 := strings.Split(string(v1CSV), "\n")
	lines2 := strings.Split(string(v2CSV), "\n")

	sb.WriteString(fmt.Sprintf("Version 1 (%s): %d syllabus items\n", v1ID, len(lines1)))
	sb.WriteString(fmt.Sprintf("Version 2 (%s): %d syllabus items\n\n", v2ID, len(lines2)))

	maxLines := len(lines1)
	if len(lines2) > maxLines {
		maxLines = len(lines2)
	}

	diffFound := false
	for i := 0; i < maxLines; i++ {
		l1 := ""
		if i < len(lines1) {
			l1 = lines1[i]
		}
		l2 := ""
		if i < len(lines2) {
			l2 = lines2[i]
		}

		if l1 != l2 {
			diffFound = true
			sb.WriteString(fmt.Sprintf("Line %d:\n  [-] %s\n  [+] %s\n", i+1, l1, l2))
		}
	}

	if !diffFound {
		sb.WriteString("No differences detected between syllabi.")
	}

	return sb.String(), nil
}

// GetManifest returns the current VersionManifest for a course
func (vm *CourseVersionManager) GetManifest(courseCode string) VersionManifest {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	manifestPath := filepath.Join(vm.baseDir, codeClean, ".versions", "manifest.json")

	if data, err := os.ReadFile(manifestPath); err == nil {
		var m VersionManifest
		if err := json.Unmarshal(data, &m); err == nil {
			return m
		}
	}

	return VersionManifest{
		CourseCode: codeClean,
		History:    []CourseVersion{},
	}
}

func (vm *CourseVersionManager) computeSyllabusHash(courseDir string) string {
	csvPath := filepath.Join(courseDir, "syllabus.csv")
	data, err := os.ReadFile(csvPath)
	if err != nil {
		return "none"
	}
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:8])
}

func copyPath(src, dst string) error {
	info, err := os.Stat(src)
	if err != nil {
		return err
	}

	if info.IsDir() {
		return copyDir(src, dst)
	}
	return copyFile(src, dst)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func copyDir(src, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())
		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

func restoreFileTree(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		return copyFile(path, target)
	})
}

func randomSuffix(n int) string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
	return hex.EncodeToString(h[:n/2])
}

// SessionStep represents an individual accepted action/edit in the active session
type SessionStep struct {
	StepNumber  int       `json:"step_number"`
	LectureNum  int       `json:"lecture_num"`
	ActionType  string    `json:"action_type"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
	BackupDir   string    `json:"backup_dir"` // directory containing pre-step file states
}

// SessionState represents an active, uncommitted editing session for a course
type SessionState struct {
	SessionID     string        `json:"session_id"`
	CourseCode    string        `json:"course_code"`
	FacultyName   string        `json:"faculty_name"`
	StartedAt     time.Time     `json:"started_at"`
	LastActiveAt  time.Time     `json:"last_active_at"`
	BaseVersionID string        `json:"base_version_id"` // snapshot when session was opened
	Steps         []SessionStep `json:"steps"`
	IsOpen        bool          `json:"is_open"`
}

// StartOrGetSession retrieves the active session or opens a new session for a course
func (vm *CourseVersionManager) StartOrGetSession(courseCode, facultyName string) (*SessionState, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	courseDir := filepath.Join(vm.baseDir, codeClean)

	if _, err := os.Stat(courseDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("course directory %s does not exist", courseDir)
	}

	sessionDir := filepath.Join(courseDir, ".session")
	sessionFile := filepath.Join(sessionDir, "active_session.json")

	if data, err := os.ReadFile(sessionFile); err == nil {
		var s SessionState
		if err := json.Unmarshal(data, &s); err == nil && s.IsOpen {
			s.LastActiveAt = time.Now()
			_ = vm.saveSessionState(codeClean, &s)
			return &s, nil
		}
	}

	// Create new session
	_ = os.MkdirAll(filepath.Join(sessionDir, "undo_stack"), 0755)

	manifest := vm.GetManifest(codeClean)
	baseVersion := manifest.ActiveVersion
	if baseVersion == "" {
		// Take a baseline snapshot if none exists
		v, _ := vm.SaveVersion(codeClean, "System", "Baseline session snapshot", "base")
		if v != nil {
			baseVersion = v.VersionID
		}
	}

	if facultyName == "" {
		facultyName = "Faculty Member"
	}

	session := &SessionState{
		SessionID:     fmt.Sprintf("sess_%d_%s", time.Now().Unix(), randomSuffix(4)),
		CourseCode:    codeClean,
		FacultyName:   facultyName,
		StartedAt:     time.Now(),
		LastActiveAt:  time.Now(),
		BaseVersionID: baseVersion,
		Steps:         []SessionStep{},
		IsOpen:        true,
	}

	if err := vm.saveSessionState(codeClean, session); err != nil {
		return nil, err
	}

	log.Printf("🟢 [Session Manager] Started working session [%s] for %s by %s", session.SessionID, codeClean, facultyName)
	return session, nil
}

// PushSessionStep records an accepted step into the session and preserves backup files for undo
func (vm *CourseVersionManager) PushSessionStep(courseCode string, lecNum int, actionType, description string, filesToBackup []string) (*SessionStep, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	session, err := vm.StartOrGetSession(codeClean, "")
	if err != nil {
		return nil, err
	}

	courseDir := filepath.Join(vm.baseDir, codeClean)
	stepNum := len(session.Steps) + 1
	backupDir := filepath.Join(courseDir, ".session", "undo_stack", fmt.Sprintf("step_%d", stepNum))
	_ = os.MkdirAll(backupDir, 0755)

	// Backup current state of files before change
	for _, relPath := range filesToBackup {
		src := filepath.Join(courseDir, relPath)
		dst := filepath.Join(backupDir, relPath)
		if _, err := os.Stat(src); err == nil {
			_ = copyPath(src, dst)
		}
	}

	step := SessionStep{
		StepNumber:  stepNum,
		LectureNum:  lecNum,
		ActionType:  actionType,
		Description: description,
		Timestamp:   time.Now(),
		BackupDir:   backupDir,
	}

	session.Steps = append(session.Steps, step)
	session.LastActiveAt = time.Now()
	_ = vm.saveSessionState(codeClean, session)

	log.Printf("📝 [Session Step %d] Applied %s on L%d: '%s' (Session: %s)", stepNum, actionType, lecNum, description, session.SessionID)
	return &step, nil
}

// UndoLastSessionStep rolls back the most recent change in the active session
func (vm *CourseVersionManager) UndoLastSessionStep(courseCode string) (*SessionStep, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	session, err := vm.GetActiveSession(codeClean)
	if err != nil || session == nil || len(session.Steps) == 0 {
		return nil, fmt.Errorf("no steps available to undo in active session for %s", codeClean)
	}

	lastIdx := len(session.Steps) - 1
	undoneStep := session.Steps[lastIdx]

	courseDir := filepath.Join(vm.baseDir, codeClean)

	// Restore files from backupDir
	_ = restoreFileTree(undoneStep.BackupDir, courseDir)

	// Remove backup directory
	_ = os.RemoveAll(undoneStep.BackupDir)

	// Pop step from session
	session.Steps = session.Steps[:lastIdx]
	session.LastActiveAt = time.Now()
	_ = vm.saveSessionState(codeClean, session)

	log.Printf("↩️  [Session Undo] Undid step %d (%s on L%d). %d steps remaining in session.",
		undoneStep.StepNumber, undoneStep.ActionType, undoneStep.LectureNum, len(session.Steps))

	return &undoneStep, nil
}

// CommitAndCloseSession commits all accumulated session changes into an immutable version snapshot
func (vm *CourseVersionManager) CommitAndCloseSession(courseCode, facultyName, userMessage, tag string) (*CourseVersion, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	session, err := vm.GetActiveSession(codeClean)
	if err != nil || session == nil {
		return nil, fmt.Errorf("no open session found for %s", codeClean)
	}

	if facultyName == "" {
		facultyName = session.FacultyName
	}

	// Build summary of session actions
	var summaryParts []string
	if userMessage != "" {
		summaryParts = append(summaryParts, userMessage)
	}
	if len(session.Steps) > 0 {
		for _, s := range session.Steps {
			summaryParts = append(summaryParts, fmt.Sprintf("L%d (%s: %s)", s.LectureNum, s.ActionType, truncateStr(s.Description, 30)))
		}
	} else {
		summaryParts = append(summaryParts, "Session closed with no additional edits")
	}

	commitMessage := strings.Join(summaryParts, "; ")

	if tag == "" {
		tag = "session_commit"
	}

	// Create permanent immutable version snapshot
	ver, err := vm.SaveVersion(codeClean, facultyName, commitMessage, tag)
	if err != nil {
		return nil, fmt.Errorf("failed to commit session: %w", err)
	}

	// Clean up session directory
	sessionDir := filepath.Join(vm.baseDir, codeClean, ".session")
	_ = os.RemoveAll(sessionDir)

	log.Printf("🏁 [Session Manager] Closed and committed session [%s] for %s. New permanent version: [%s]",
		session.SessionID, codeClean, ver.VersionID)
	return ver, nil
}

// DiscardSession cancels the entire active session and restores the course to BaseVersionID
func (vm *CourseVersionManager) DiscardSession(courseCode string) error {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	session, err := vm.GetActiveSession(codeClean)
	if err != nil || session == nil {
		return fmt.Errorf("no open session to discard for %s", codeClean)
	}

	baseVer := session.BaseVersionID
	sessionDir := filepath.Join(vm.baseDir, codeClean, ".session")
	_ = os.RemoveAll(sessionDir)

	if baseVer != "" {
		_ = vm.RevertToVersion(codeClean, baseVer)
	}

	log.Printf("🗑️ [Session Manager] Discarded active session for %s. Restored to baseline [%s].", codeClean, baseVer)
	return nil
}

// GetActiveSession returns the current active session if one exists
func (vm *CourseVersionManager) GetActiveSession(courseCode string) (*SessionState, error) {
	codeClean := strings.ToUpper(strings.ReplaceAll(courseCode, " ", ""))
	sessionFile := filepath.Join(vm.baseDir, codeClean, ".session", "active_session.json")

	data, err := os.ReadFile(sessionFile)
	if err != nil {
		return nil, nil // no active session
	}

	var s SessionState
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, err
	}

	if !s.IsOpen {
		return nil, nil
	}
	return &s, nil
}

func (vm *CourseVersionManager) saveSessionState(courseCode string, s *SessionState) error {
	sessionDir := filepath.Join(vm.baseDir, courseCode, ".session")
	_ = os.MkdirAll(sessionDir, 0755)
	sessionFile := filepath.Join(sessionDir, "active_session.json")
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(sessionFile, data, 0644)
}

// PrintSessionStatus prints the current active session state
func (vm *CourseVersionManager) PrintSessionStatus(courseCode string) {
	session, err := vm.GetActiveSession(courseCode)
	if err != nil || session == nil {
		fmt.Printf("ℹ️  No active editing session for [%s]. All changes are committed.\n", courseCode)
		return
	}

	fmt.Printf("\n🟢 Active Editing Session for [%s] (ID: %s):\n", courseCode, session.SessionID)
	fmt.Printf("   Faculty: %s | Started: %s | Base Version: %s\n",
		session.FacultyName, session.StartedAt.Format("2006-01-02 15:04:05"), session.BaseVersionID)
	fmt.Printf("   Accumulated Changes: %d step(s)\n", len(session.Steps))
	fmt.Println("-----------------------------------------------------------------------------------------")
	for _, s := range session.Steps {
		fmt.Printf("   [Step %d] L%d (%s): %s (%s)\n",
			s.StepNumber, s.LectureNum, s.ActionType, s.Description, s.Timestamp.Format("15:04:05"))
	}
	fmt.Println("-----------------------------------------------------------------------------------------")
	fmt.Println("👉 To Undo last step:  ./bin/course_builder -code " + courseCode + " -undo")
	fmt.Println("👉 To Close & Commit:  ./bin/course_builder -code " + courseCode + " -commit-session \"Session finalized\"")
	fmt.Println("👉 To Discard session: ./bin/course_builder -code " + courseCode + " -discard-session")
}

// PrintVersionHistory formats the history nicely for the CLI
func (vm *CourseVersionManager) PrintVersionHistory(courseCode string) {
	versions, err := vm.ListVersions(courseCode)
	if err != nil {
		fmt.Printf("ℹ️  No version history found for [%s]\n", courseCode)
		return
	}

	manifest := vm.GetManifest(courseCode)
	fmt.Printf("\n📜 Version History for [%s] (Active: %s):\n", courseCode, manifest.ActiveVersion)
	fmt.Println("-----------------------------------------------------------------------------------------")
	fmt.Printf("%-24s | %-16s | %-12s | %-6s | %s\n", "VERSION ID", "DATE", "AUTHOR", "LECS", "COMMIT MESSAGE")
	fmt.Println("-----------------------------------------------------------------------------------------")

	// Sort newest first
	sort.Slice(versions, func(i, j int) bool {
		return versions[i].CreatedAt.After(versions[j].CreatedAt)
	})

	for _, v := range versions {
		activeMarker := "  "
		if v.VersionID == manifest.ActiveVersion {
			activeMarker = "⭐"
		}
		fmt.Printf("%s %-22s | %-16s | %-12s | %-6d | %s\n",
			activeMarker,
			v.VersionID,
			v.CreatedAt.Format("2006-01-02 15:04"),
			truncateStr(v.Author, 12),
			v.TotalLectures,
			v.Message)
	}
	fmt.Println("-----------------------------------------------------------------------------------------")
}

func truncateStr(s string, max int) string {
	if len(s) > max {
		return s[:max-2] + ".."
	}
	return s
}

