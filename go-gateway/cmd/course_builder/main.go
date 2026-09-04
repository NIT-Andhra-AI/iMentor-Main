package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"imentor/gateway/pkg/course_agents"
)

var fullEECS_EC_MA_Catalog = course_agents.FullEECS_EC_MA_Catalog

func main() {
	codePtr := flag.String("code", "", "Course code (e.g., EE3011, EE2061, MA1011)")
	namePtr := flag.String("name", "", "Subject name (e.g., Power Electronics)")
	syllabusPtr := flag.String("syllabus", "", "Optional raw syllabus string or file path")
	descPtr := flag.String("description", "", "Optional course description")
	allCatalogPtr := flag.Bool("all-eecs-ma", false, "Generate all EE, CS, EC, and MA courses & labs automatically")
	outDirPtr := flag.String("outdir", "course_bootstrap", "Target output directory")
	syllabusMode := flag.String("syllabus-mode", "predefined", "Syllabus source: 'predefined' (R24 university syllabus, DEFAULT) or 'custom' (auto-generate)")
	r24PathPtr := flag.String("r24-path", "server/scripts/curriculum_pdf.json", "Path to the R24 curriculum_pdf.json file")

	// Course VCS & Individual Faculty Workflow Flags
	splitAllPtr := flag.Bool("split-all", false, "Split curriculum_pdf.json into dedicated course folders with curriculum_spec.json")
	saveVerMsg := flag.String("save-version", "", "Create an immutable snapshot version of the course with this commit message")
	authorPtr := flag.String("author", "Faculty Member", "Author name for version snapshot")
	tagPtr := flag.String("tag", "", "Optional version tag (e.g., 'v1.0', 'gate_approved', 'stable')")
	listVersPtr := flag.Bool("versions", false, "List complete version history and snapshots for the specified course")
	revertVerPtr := flag.String("revert", "", "Revert course to a specific version snapshot ID (e.g., v20260818_153022_abcd)")
	diffPtr := flag.String("diff", "", "Diff two versions of a course syllabus (format: <v1_id>,<v2_id>)")

	// Faculty Copilot & Dynamic Enhancement Flags
	lecNumPtr := flag.Int("lecture", 1, "Target lecture number for copilot enhancement (1-36)")
	promptPtr := flag.String("prompt", "", "Natural language suggestion/prompt for background copilot agent")
	acceptProposalPtr := flag.Bool("accept-proposal", false, "Accept staged copilot proposal and record to active session")
	rejectProposalPtr := flag.Bool("reject-proposal", false, "Reject and discard staged copilot proposal")

	// Session Management Flags
	sessionStatusPtr := flag.Bool("session-status", false, "Show active uncommitted editing session changes")
	undoPtr := flag.Bool("undo", false, "Undo the most recent accepted proposal in the current session")
	commitSessionMsg := flag.String("commit-session", "", "Finalize and commit all session edits into a permanent version snapshot")
	discardSessionPtr := flag.Bool("discard-session", false, "Discard all uncommitted session edits and restore course baseline")

	// Adaptive Scaffolding Chat Flags
	chatQueryPtr := flag.String("chat", "", "Query to evaluate via Adaptive Scaffolding Chat Engine")
	focusTrackPtr := flag.String("track", "STANDARD_BTECH", "Mutually exclusive student persona: STANDARD_BTECH (default), GATE_ASPIRANT, PLACEMENT_PREP, ENTREPRENEURSHIP, RESEARCHER")
	studentLevelPtr := flag.String("student-level", "INTERMEDIATE", "Student Level: BEGINNER, INTERMEDIATE, ADVANCED")
	sglangURLPtr := flag.String("sglang-url", "http://localhost:8000/v1", "Local SGLang REST API endpoint")

	// Autonomous 15-Minute Evolution & Graphify Flags
	graphifyPtr := flag.Bool("graphify", false, "Generate and display Aider-style Codebase Architecture Graph")
	evolveModulePtr := flag.String("evolve", "", "Execute 15-minute autonomous evolution cycle on target module")
	academicSearchPtr := flag.String("academic", "", "Search peer-reviewed OpenAlex publications and citations")
	deepResearchPtr := flag.String("research", "", "Execute Deep Research intelligence synthesis on target topic")
	quizConceptPtr := flag.String("quiz", "", "Generate Bloom-calibrated MCQ quiz for a concept")
	bossBattlePtr := flag.String("boss-battle", "", "Initiate Boss Battle multi-stage challenge for a concept")
	generateChatUIPtr := flag.Bool("generate-chat-ui", false, "Generate standalone modern student multimodal chat interface")
	serveAPIPtr := flag.Bool("serve-api", false, "Launch unified HTTP API server bridging backend, AI services, and frontend")
	apiPortPtr := flag.Int("port", 8080, "Port for unified API gateway (default: 8080, never conflicts with live demo)")
	podcastTopicPtr := flag.String("podcast", "", "Synthesize NotebookLM-style 2-host audio debate podcast for a topic")
	generateTextbooksPtr := flag.Bool("generate-ai-textbooks", false, "Generate master AI reference textbooks and pedagogical reports for all courses")

	flag.Parse()

	orchestrator := course_agents.NewCourseOrchestrator(*outDirPtr)
	copilot := course_agents.NewFacultyCopilotAgent(*outDirPtr)
	chatEngine := course_agents.NewScaffoldChatEngine(*sglangURLPtr, "")

	// Apply syllabus mode toggle
	if *syllabusMode == "custom" {
		orchestrator.SetSyllabusMode(course_agents.GenerateCustom)
	} else {
		orchestrator.SetSyllabusMode(course_agents.UseR24Predefined)
	}
	evolutionHarness := course_agents.NewAutonomousEvolutionHarness("..")

	// 0. Graphify Architecture Command
	if *graphifyPtr {
		fmt.Println(evolutionHarness.GraphifyCodebase())
		return
	}

	// 0.1 Autonomous 15-Minute Evolution Cycle Command
	if *evolveModulePtr != "" {
		fmt.Println("==================================================================")
		fmt.Printf("🔄 Autonomous 15-Minute Evolution Cycle: [%s]\n", *evolveModulePtr)
		fmt.Println("==================================================================")
		record := evolutionHarness.Run15MinuteEvolutionCycle(1, *evolveModulePtr)
		fmt.Printf("\n✅ Cycle #%d Finished in %dms!\n", record.CycleNumber, record.DurationMs)
		fmt.Printf("   Module:     %s\n", record.TargetModule)
		fmt.Printf("   Gatekeeper: Approved: %t (Score: %.2f)\n", record.GatekeeperApproved, record.GatekeeperScore)
		fmt.Printf("   Tests:      %s\n", record.TestResult)
		fmt.Printf("   Summary:    %s\n", record.EnhancementSummary)
		fmt.Println("==================================================================")
		return
	}

	// 0.2 OpenAlex Academic Search Command
	if *academicSearchPtr != "" {
		fmt.Println("==================================================================")
		fmt.Printf("📚 OpenAlex Scholarly Database Search: [%s]\n", *academicSearchPtr)
		fmt.Println("==================================================================")
		openalexClient := course_agents.NewOpenAlexSearchClient()
		papers, err := openalexClient.SearchWorks(*academicSearchPtr, 5)
		if err != nil {
			fmt.Printf("❌ Academic search error: %v\n", err)
			os.Exit(1)
		}
		for i, p := range papers {
			fmt.Printf("\n[%d] %s (%d)\n", i+1, p.Title, p.Year)
			if len(p.Authors) > 0 {
				fmt.Printf("    Authors:   %s\n", strings.Join(p.Authors, ", "))
			}
			if p.DOI != "" {
				fmt.Printf("    DOI:       %s\n", p.DOI)
			}
			fmt.Printf("    Citations: %d | Source: %s\n", p.CitationCount, p.Source)
			fmt.Printf("    Abstract:  %s\n", p.Abstract)
		}
		fmt.Println("==================================================================")
		return
	}

	// 0.3 Deep Research Intelligence Synthesis Command
	if *deepResearchPtr != "" {
		fmt.Println("==================================================================")
		fmt.Printf("🔬 Deep Research Intelligence Synthesis: [%s]\n", *deepResearchPtr)
		fmt.Println("==================================================================")
		openalexClient := course_agents.NewOpenAlexSearchClient()
		brief, err := openalexClient.SynthesizeDeepResearch(*deepResearchPtr)
		if err != nil {
			fmt.Printf("❌ Deep research error: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("📌 Summary: %s\n\n", brief.StateOfTheArtSummary)
		fmt.Println("🔑 Key Findings from Peer-Reviewed Literature:")
		for _, f := range brief.KeyFindings {
			fmt.Printf("   • %s\n", f)
		}
		fmt.Println("\n⚠️ Open Research & Engineering Challenges:")
		for _, c := range brief.OpenChallenges {
			fmt.Printf("   • %s\n", c)
		}
		fmt.Printf("\n📚 Indexed Citations (%d):\n", len(brief.TopCitations))
		for i, c := range brief.TopCitations {
			fmt.Printf("   [%d] %s (%s, %d) - %s\n", i+1, c.Title, c.Authors[0], c.Year, c.DOI)
		}
		fmt.Println("==================================================================")
		return
	}

	// 0.4 Bloom-Calibrated Concept Quiz Command
	if *quizConceptPtr != "" {
		fmt.Println("==================================================================")
		fmt.Printf("🎯 Bloom-Calibrated Concept Assessment: [%s]\n", *quizConceptPtr)
		fmt.Println("==================================================================")
		qBank := course_agents.NewSkillTreeQuestionBank()
		qs := qBank.SelectQuestions(*quizConceptPtr, 3, nil)
		for i, q := range qs {
			fmt.Printf("\n[Q%d - %s (%s, %s)]\n", i+1, q.BloomLevel, q.Difficulty, q.GATEWeightage)
			fmt.Printf("Question: %s\n", q.QuestionText)
			for optIdx, opt := range q.Options {
				marker := "  "
				if optIdx == q.CorrectIndex {
					marker = "✓ "
				}
				fmt.Printf("   %s(%c) %s\n", marker, 'A'+optIdx, opt)
			}
			fmt.Printf("Explanation: %s\n", q.Explanation)
		}
		fmt.Println("==================================================================")
		return
	}

	// 0.5 Boss Battle Gamified Assessment Challenge
	if *bossBattlePtr != "" {
		fmt.Println("==================================================================")
		fmt.Printf("⚔️  Boss Battle Multi-Stage Challenge: [%s]\n", *bossBattlePtr)
		fmt.Println("==================================================================")
		qBank := course_agents.NewSkillTreeQuestionBank()
		battle := qBank.CreateBossBattle("EE3011", *bossBattlePtr)
		fmt.Printf("👑 %s\n", battle.StageName)
		fmt.Printf("   Boss HP: %d | Time Limit: %d seconds | Questions: %d\n", battle.BossHP, battle.TimeLimitSec, len(battle.Questions))
		for i, q := range battle.Questions {
			fmt.Printf("\n⚔️  Round %d: %s [%s Level]\n", i+1, q.QuestionText, q.BloomLevel)
		}
		fmt.Println("==================================================================")
		return
	}

	// 0.6 Generate Standalone Modern Student Chat Interface
	if *generateChatUIPtr {
		fmt.Println("==================================================================")
		fmt.Println("🎨 Generating Standalone Modern Student Multimodal Chat Interface")
		fmt.Println("==================================================================")
		hub := course_agents.NewFrontendHubAgent(*outDirPtr)
		uiPath, err := hub.GenerateModernChatInterface("student_multimodal_chat.html")
		if err != nil {
			fmt.Printf("❌ Failed to generate student chat UI: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("🎉 Successfully generated modern student chat UI!\n")
		fmt.Printf("   File: %s\n", uiPath)
		fmt.Println("==================================================================")
		return
	}

	// 0.7 Unified Tri-Tier HTTP Server Command
	if *serveAPIPtr {
		fmt.Println("==================================================================")
		fmt.Printf("🚀 Starting iMentor NextGen Unified API Gateway on Port %d\n", *apiPortPtr)
		fmt.Printf("   Backend + AI Services (SGLang, OpenAlex, ToT) + Frontend UI\n")
		fmt.Println("==================================================================")
		apiServer := course_agents.NewUnifiedAPIServer(*apiPortPtr, *outDirPtr, *sglangURLPtr)
		if err := apiServer.Start(); err != nil {
			fmt.Printf("❌ API server error: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// 0.8 NotebookLM-Style 2-Host Audio Debate Podcast Synthesizer
	if *podcastTopicPtr != "" {
		track := course_agents.TrackStandardBTech
		switch strings.ToUpper(*focusTrackPtr) {
		case "GATE_ASPIRANT", "GATE":
			track = course_agents.TrackGateAspirant
		case "PLACEMENT_PREP", "PLACEMENT":
			track = course_agents.TrackPlacementPrep
		case "ENTREPRENEURSHIP", "STARTUP":
			track = course_agents.TrackEntrepreneurship
		case "RESEARCHER", "RESEARCH":
			track = course_agents.TrackResearcher
		default:
			track = course_agents.TrackStandardBTech
		}

		fmt.Println("==================================================================")
		fmt.Printf("🎙️  NotebookLM-Style 2-Host Audio Overview Synthesizer: [%s]\n", *podcastTopicPtr)
		fmt.Printf("   Focus Track: %s | Estimated Duration: 3 min 15 sec\n", track)
		synthesizer := course_agents.NewAudioDebateSynthesizer()
		podcast := synthesizer.SynthesizeTopicDebateForTrack(*podcastTopicPtr, *codePtr, track)
		fmt.Println(podcast.ToMarkdown())
		fmt.Println("==================================================================")
		return
	}

	// 0.9 Master AI Reference Textbook Generator Command
	if *generateTextbooksPtr {
		fmt.Println("==================================================================")
		fmt.Println("📖 Generating Master Reference Textbooks (IIT/MIT/Stanford Standards)")
		fmt.Println("==================================================================")
		enhancerAgent := course_agents.NewAITextbookEnhancerAgent(*outDirPtr)
		resourceAgent := course_agents.NewResourceCollectorAgent()
		catalog := course_agents.FullEECS_EC_MA_Catalog

		totalLectures := 0
		totalSubtopics := 0
		for idx, c := range catalog {
			sylAgent := course_agents.NewSyllabusStructureAgent()
			courseStructure := sylAgent.StructureCourse(c.Code, c.Name, "")
			resBundle := resourceAgent.Collect(c.Code, c.Name, "")
			_, report := enhancerAgent.EnhanceAndGenerateTextbook(courseStructure, resBundle)
			totalLectures += len(courseStructure.Lectures)
			totalSubtopics += report.TotalSubtopics
			fmt.Printf("[%d/%d] ✅ %s: %s (%d subtopics enhanced)\n", idx+1, len(catalog), c.Code, c.Name, report.TotalSubtopics)
		}
		fmt.Printf("🎉 Successfully generated 53 Master Reference Textbooks (%d topics, %d subtopics)!\n", totalLectures, totalSubtopics)
		fmt.Println("==================================================================")
		return
	}

	// 1. Split Curriculum Command
	if *splitAllPtr {
		fmt.Println("==================================================================")
		fmt.Printf("✂️  Splitting Monolithic Curriculum into Dedicated Subject Folders\n")
		fmt.Printf("   Source: %s\n", *r24PathPtr)
		fmt.Printf("   Target: %s/<CourseCode>/curriculum_spec.json\n", *outDirPtr)
		fmt.Println("==================================================================")
		count, err := orchestrator.SplitCurricula(*r24PathPtr)
		if err != nil {
			fmt.Printf("❌ Failed to split curriculum: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("🎉 Successfully created %d dedicated subject curriculum folders!\n", count)
		fmt.Printf("   Faculty can now independently edit any course's curriculum_spec.json.\n")
		return
	}

	// 2. Faculty Copilot & Session Control Commands for a Course
	if *codePtr != "" {
		codeClean := strings.ToUpper(strings.ReplaceAll(*codePtr, " ", ""))

		// View Session Status
		if *sessionStatusPtr {
			copilot.PrintSessionStatus(codeClean)
			return
		}

		// Undo Step in Session
		if *undoPtr {
			step, err := copilot.UndoLastStep(codeClean)
			if err != nil {
				fmt.Printf("❌ Undo failed: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("==================================================================")
			fmt.Printf("↩️  Successfully Undid [Step %d] on [%s] L%d (%s)\n", step.StepNumber, codeClean, step.LectureNum, step.ActionType)
			fmt.Println("==================================================================")
			copilot.PrintSessionStatus(codeClean)
			return
		}

		// Commit and Close Session
		if *commitSessionMsg != "" {
			ver, err := copilot.CommitSession(codeClean, *authorPtr, *commitSessionMsg, *tagPtr)
			if err != nil {
				fmt.Printf("❌ Failed to commit session: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("==================================================================")
			fmt.Printf("🏁 Session Finalized & Committed for [%s]!\n", codeClean)
			fmt.Printf("   Permanent Version Created: [%s]\n", ver.VersionID)
			fmt.Printf("   Author: %s | Lectures: %d | Message: %s\n", ver.Author, ver.TotalLectures, ver.Message)
			fmt.Println("==================================================================")
			return
		}

		// Discard Active Session
		if *discardSessionPtr {
			if err := copilot.DiscardSession(codeClean); err != nil {
				fmt.Printf("❌ Failed to discard session: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("==================================================================")
			fmt.Printf("🗑️ Active session discarded for [%s]. Course restored to baseline.\n", codeClean)
			fmt.Println("==================================================================")
			return
		}

		// Copilot Suggestion Processing
		if *promptPtr != "" {
			fmt.Println("==================================================================")
			fmt.Printf("🤖 Faculty Copilot Spinning in Background for [%s] Lecture %d\n", codeClean, *lecNumPtr)
			fmt.Printf("   Prompt: \"%s\"\n", *promptPtr)
			fmt.Println("==================================================================")
			prop, err := copilot.ProcessFacultySuggestion(codeClean, *lecNumPtr, *promptPtr)
			if err != nil {
				fmt.Printf("❌ Copilot Error: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("✨ Proposal [%s] staged for Lecture %d!\n", prop.ProposalID, *lecNumPtr)
			fmt.Printf("   Action Type: %s\n", prop.ActionType)
			fmt.Printf("   Summary:     %s\n", prop.DiffSummary)
			if len(prop.GeneratedAssets) > 0 {
				fmt.Printf("   Generated:   %s\n", strings.Join(prop.GeneratedAssets, ", "))
			}
			fmt.Println("\n👉 To Accept into session: ./bin/course_builder -code " + codeClean + " -lecture " + fmt.Sprintf("%d", *lecNumPtr) + " -accept-proposal")
			fmt.Println("👉 To Reject draft:        ./bin/course_builder -code " + codeClean + " -lecture " + fmt.Sprintf("%d", *lecNumPtr) + " -reject-proposal")
			fmt.Println("==================================================================")
			return
		}

		// Accept Proposal
		if *acceptProposalPtr {
			step, err := copilot.AcceptProposal(codeClean, *lecNumPtr, *authorPtr)
			if err != nil {
				fmt.Printf("❌ Failed to accept proposal: %v\n", err)
				os.Exit(1)
			}
			fmt.Println("==================================================================")
			fmt.Printf("✅ Proposal Applied in Active Session [Step %d] for [%s] Lecture %d!\n", step.StepNumber, codeClean, *lecNumPtr)
			fmt.Println("   Note: Change is recorded in your active working session.")
			fmt.Println("👉 To undo this change: ./bin/course_builder -code " + codeClean + " -undo")
			fmt.Println("👉 To finalize session: ./bin/course_builder -code " + codeClean + " -commit-session \"Finalized changes\"")
			fmt.Println("==================================================================")
			return
		}

		// Reject Proposal
		if *rejectProposalPtr {
			if err := copilot.RejectProposal(codeClean, *lecNumPtr); err != nil {
				fmt.Printf("❌ Failed to reject proposal: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("🗑️ Proposal draft discarded for [%s] Lecture %d.\n", codeClean, *lecNumPtr)
			return
		}

		// List Versions
		if *listVersPtr {
			orchestrator.PrintVersionHistory(codeClean)
			return
		}

		// Revert to Version
		if *revertVerPtr != "" {
			fmt.Printf("⏪ Reverting course [%s] to snapshot [%s]...\n", codeClean, *revertVerPtr)
			if err := orchestrator.RevertVersion(codeClean, *revertVerPtr); err != nil {
				fmt.Printf("❌ Failed to revert: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("✅ Course [%s] successfully restored to version [%s]!\n", codeClean, *revertVerPtr)
			return
		}

		// Diff Versions
		if *diffPtr != "" {
			parts := strings.Split(*diffPtr, ",")
			if len(parts) != 2 {
				fmt.Println("Usage: -code <CODE> -diff <v1_id>,<v2_id>")
				os.Exit(1)
			}
			diff, err := orchestrator.DiffVersions(codeClean, parts[0], parts[1])
			if err != nil {
				fmt.Printf("❌ Diff failed: %v\n", err)
				os.Exit(1)
			}
			fmt.Println(diff)
			return
		}

		// Save Manual Version
		if *saveVerMsg != "" {
			ver, err := orchestrator.SaveVersion(codeClean, *authorPtr, *saveVerMsg, *tagPtr)
			if err != nil {
				fmt.Printf("❌ Failed to save version: %v\n", err)
				os.Exit(1)
			}
			fmt.Printf("✅ Version snapshot [%s] successfully saved for [%s]!\n", ver.VersionID, codeClean)
			return
		}
	}

	// 3. Adaptive Multimodal Chat Execution
	if *chatQueryPtr != "" {
		track := course_agents.TrackStandardBTech
		switch strings.ToUpper(*focusTrackPtr) {
		case "GATE_ASPIRANT", "GATE":
			track = course_agents.TrackGateAspirant
		case "PLACEMENT_PREP", "PLACEMENT":
			track = course_agents.TrackPlacementPrep
		case "ENTREPRENEURSHIP", "STARTUP":
			track = course_agents.TrackEntrepreneurship
		case "RESEARCHER", "RESEARCH":
			track = course_agents.TrackResearcher
		default:
			track = course_agents.TrackStandardBTech
		}

		fmt.Println("==================================================================")
		fmt.Printf("🧠 SGLang Adaptive Scaffolding Chat Engine (Zero-Latency Local LLM)\n")
		fmt.Printf("   User Query: \"%s\"\n", *chatQueryPtr)
		fmt.Printf("   Active Focus Track: %s (Default: STANDARD_BTECH) | Level: %s\n", track, *studentLevelPtr)
		fmt.Printf("   SGLang URL: %s\n", *sglangURLPtr)
		fmt.Println("==================================================================")

		profile := &course_agents.StudentProfile{
			UserID:         "student_demo_101",
			FocusTrack:     track,
			StudentLevel:   strings.ToUpper(*studentLevelPtr),
			LearningSpeed:  "NORMAL",
			EmotionalState: "CURIOUS",
			ConceptMastery: map[string]float64{"power_electronics": 0.65, "inductor_odes": 0.85},
			ActiveCourse:   *codePtr,
			ActiveLecture:  *lecNumPtr,
		}

		var mem *course_agents.CourseMemory
		if *codePtr != "" {
			mem, _ = copilot.LoadCourseMemory(*codePtr, *lecNumPtr)
		}

		plan := chatEngine.PlanScaffolding(*chatQueryPtr, profile)
		fmt.Printf("📋 Concept: [%s] | Scaffold Depth: [%s]\n", plan.TargetConcept, plan.ScaffoldDepth)
		if plan.Complexity != nil {
			fmt.Printf("⚡ [Karpathy Reasoning Router] Tier: %s (Score: %.2f) | Branching B=%d | Budget: %dms\n",
				plan.Complexity.Tier, plan.Complexity.Score, plan.Complexity.BranchingFactor, plan.Complexity.ThinkingBudgetMs)
		}
		if plan.ReasoningBranch != nil {
			fmt.Printf("🧪 [System 2 Self-Verification] Selected Path: '%s' (Physical Sanity Score: %.2f)\n",
				plan.ReasoningBranch.TechniqueName, plan.ReasoningBranch.BoundaryCheckScore)
		}
		fmt.Printf("   Planned Scaffolded Sections (%d):\n", len(plan.PlannedSections))
		for i, s := range plan.PlannedSections {
			fmt.Printf("   • [%d] %s\n", i+1, s)
		}
		fmt.Println("------------------------------------------------------------------")

		sections, err := chatEngine.GenerateScaffoldedResponse(*chatQueryPtr, profile, mem, func(sec *course_agents.ScaffoldSection) {
			fmt.Printf("\n▶️  [Section %d: %s] (Rendered in %dms)\n", sec.Index, sec.Title, sec.TimeTakenMs)
			fmt.Println(sec.Content)
			if sec.HasVisual {
				fmt.Printf("🎨 [Code-as-Visual Rendered: %s]\n", sec.VisualType)
			}
			fmt.Println("------------------------------------------------------------------")
		})

		if err != nil {
			fmt.Printf("❌ Chat generation error: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("🎉 Successfully generated %d seamlessly scaffolded sections!\n", len(sections))
		fmt.Println("==================================================================")
		return
	}

	// 4. Batch Build All Courses
	if *allCatalogPtr {
		fmt.Println("==================================================================")
		fmt.Printf("⚡ Native Go Multi-Agent Course Engine [Syllabus: %s]\n", *syllabusMode)
		fmt.Println("   Generating All EE, CS, EC, MA Courses & Labs with Version Snapshots")
		fmt.Println("==================================================================")
		successCount := 0
		for _, c := range fullEECS_EC_MA_Catalog {
			res, err := orchestrator.BuildCourse(c.Code, c.Name, "", c.Desc)
			if err != nil {
				fmt.Printf("❌ Failed to build course [%s]: %v\n", c.Code, err)
				continue
			}
			successCount++
			typeLabel := "Course"
			if res.IsLab {
				typeLabel = "Lab"
			}
			fmt.Printf("✓ [%s] %s (%s): %d %s | %d STN Nodes | Portal: %s\n",
				res.CourseCode, res.SubjectName, typeLabel, res.TotalLectures,
				func() string {
					if res.IsLab {
						return "Experiments"
					}
					return "Lectures"
				}(),
				res.STNNodes, res.InteractivePortal)
		}
		fmt.Println("==================================================================")
		fmt.Printf("🎉 Successfully generated %d / %d EE, CS, EC, and MA courses & labs!\n", successCount, len(fullEECS_EC_MA_Catalog))
		fmt.Printf("   Syllabus Mode: %s\n", *syllabusMode)
		return
	}

	// 4. Single Course Build
	if *codePtr == "" {
		fmt.Println("Usage: course_builder [OPTIONS]")
		fmt.Println("  -code <CODE> -lecture <N> -prompt <SUGGESTION>  Spin Faculty Copilot on a lecture")
		fmt.Println("  -code <CODE> -lecture <N> -accept-proposal      Accept staged proposal & commit version")
		fmt.Println("  -code <CODE> -lecture <N> -reject-proposal      Discard staged proposal")
		fmt.Println("  -code <CODE> -name <NAME>                       Build / enhance a single subject")
		fmt.Println("  -code <CODE> -versions                          View version history of a subject")
		fmt.Println("  -code <CODE> -save-version <MSG>                Commit a new version of a subject")
		fmt.Println("  -code <CODE> -revert <VERSION_ID>               Revert subject to a previous snapshot")
		fmt.Println("  -code <CODE> -diff <V1>,<V2>                    Compare two versions of a subject syllabus")
		fmt.Println("  -split-all                                      Split curriculum_pdf.json into dedicated course folders")
		fmt.Println("  -all-eecs-ma                                    Build all 54 EE/CS/EC/MA courses & labs")
		os.Exit(1)
	}

	rawSyllabus := *syllabusPtr
	if rawSyllabus != "" {
		if content, err := os.ReadFile(rawSyllabus); err == nil {
			rawSyllabus = string(content)
		}
	}

	res, err := orchestrator.BuildCourse(*codePtr, *namePtr, rawSyllabus, *descPtr)
	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("==================================================================")
	fmt.Printf("🎉 Subject [%s] %s Successfully Built & Versioned!\n", res.CourseCode, res.SubjectName)
	fmt.Printf("  • Total Modules/Units: %d\n", res.ModulesCount)
	fmt.Printf("  • Total Items:         %d\n", res.TotalLectures)
	fmt.Printf("  • STN Concept Nodes:   %d (Edges: %d)\n", res.STNNodes, res.STNEdges)
	fmt.Printf("  • Dedicated Spec:      %s/%s/curriculum_spec.json\n", *outDirPtr, res.CourseCode)
	fmt.Printf("  • Syllabus CSV:        %s\n", res.SyllabusCSV)
	fmt.Printf("  • Resources JSON:      %s\n", res.ResourcesJSON)
	fmt.Printf("  • Interactive Portal:  %s\n", res.InteractivePortal)
	fmt.Printf("  • Faculty Dashboard:   %s/%s/faculty_dashboard.html\n", *outDirPtr, res.CourseCode)
	fmt.Println("==================================================================")
}
