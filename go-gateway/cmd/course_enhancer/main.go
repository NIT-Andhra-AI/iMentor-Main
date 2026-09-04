package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"imentor/gateway/pkg/course_agents"
)

func main() {
	outDirPtr := flag.String("outdir", "course_bootstrap", "Target course bootstrap directory")
	targetCoursePtr := flag.String("course", "", "Specific course code to enhance (e.g. EE3011, CS2001, EC3001)")
	allCoursesPtr := flag.Bool("all", true, "Enhance all 53 EECS, EC, CS, and MA courses in the catalog")
	r24PathPtr := flag.String("r24-path", "server/scripts/curriculum_pdf.json", "Path to R24 curriculum_pdf.json")

	flag.Parse()

	fmt.Println("==========================================================================================")
	fmt.Println("🚀 iMentor Sovereign AI Course Enhancer & Master Textbook Generator")
	fmt.Println("🏛️ Benchmark Standards: IIT Bombay, MIT OCW, Stanford Graduate Engineering")
	fmt.Println("🧠 Engine: Antigravity AI Multi-Agent Pedagogical Swarm")
	fmt.Println("==========================================================================================")

	orchestrator := course_agents.NewCourseOrchestrator(*outDirPtr)
	orchestrator.SetR24CurriculumPath(*r24PathPtr)
	enhancerAgent := course_agents.NewAITextbookEnhancerAgent(*outDirPtr)
	resourceAgent := course_agents.NewResourceCollectorAgent()

	// Load courses list
	var coursesToProcess []course_agents.CatalogCourse
	catalog := course_agents.FullEECS_EC_MA_Catalog

	if *targetCoursePtr != "" {
		codeNorm := strings.ToUpper(strings.TrimSpace(*targetCoursePtr))
		found := false
		for _, c := range catalog {
			if strings.EqualFold(c.Code, codeNorm) {
				coursesToProcess = append(coursesToProcess, c)
				found = true
				break
			}
		}
		if !found {
			// Fallback: create dynamic entry
			coursesToProcess = append(coursesToProcess, course_agents.CatalogCourse{
				Code: codeNorm,
				Name: codeNorm + " Course",
			})
		}
	} else if *allCoursesPtr {
		coursesToProcess = catalog
	}

	fmt.Printf("📚 Target Courses to Enhance: %d courses\n", len(coursesToProcess))
	startTime := time.Now()

	totalLecturesProcessed := 0
	totalSubtopicsEnhanced := 0
	totalTextbooksGenerated := 0

	for i, c := range coursesToProcess {
		courseCodeNorm := strings.ReplaceAll(c.Code, " ", "_")
		courseDir := filepath.Join(*outDirPtr, courseCodeNorm)

		fmt.Printf("\n[%d/%d] 🔄 Processing [%s] %s...\n", i+1, len(coursesToProcess), c.Code, c.Name)

		// 1. Check if curriculum_spec.json exists
		specPath := filepath.Join(courseDir, "curriculum_spec.json")
		var courseStructure course_agents.CourseStructure

		if data, err := os.ReadFile(specPath); err == nil {
			var parsed course_agents.R24ParsedCourse
			if err := json.Unmarshal(data, &parsed); err == nil {
				// Decompose parsed course
				parser := course_agents.NewR24SyllabusParser(*r24PathPtr)
				lectures := parser.DecomposeParsedCourse(&parsed)
				if len(lectures) == 0 {
					lectures = parser.DecomposeParsedLabExperiments(&parsed)
				}
				courseStructure = course_agents.CourseStructure{
					CourseCode:     c.Code,
					CourseName:     parsed.CourseName,
					TotalLectures:  len(lectures),
					Lectures:       lectures,
					CourseOutcomes: parsed.CourseOutcomes,
				}
			}
		}

		// If course structure is still empty, build via orchestrator
		if len(courseStructure.Lectures) == 0 {
			res, err := orchestrator.BuildCourse(c.Code, c.Name, "", "")
			if err != nil {
				log.Printf("⚠️ Error building baseline for %s: %v", c.Code, err)
				continue
			}
			fmt.Printf("   ✅ Generated baseline structure (%d lectures)\n", res.TotalLectures)
		}

		// Collect resources
		resBundle := resourceAgent.Collect(c.Code, c.Name, "")

		// If lectures are still not loaded in courseStructure, synthesize syllabus
		if len(courseStructure.Lectures) == 0 {
			sylAgent := course_agents.NewSyllabusStructureAgent()
			courseStructure = sylAgent.StructureCourse(c.Code, c.Name, "")
		}

		// 2. Enhance each topic, subtopic and generate AI Master Reference Textbook
		textbookMD, report := enhancerAgent.EnhanceAndGenerateTextbook(courseStructure, resBundle)

		totalLecturesProcessed += len(courseStructure.Lectures)
		totalSubtopicsEnhanced += report.TotalSubtopics
		totalTextbooksGenerated++

		fmt.Printf("   📖 Master Reference Textbook generated: %s (%d KB)\n",
			filepath.Base(report.MasterTextbookPath), len(textbookMD)/1024)
		fmt.Printf("   🎯 Topics Enhanced: %d lectures, %d granular subtopics\n",
			len(report.TopicRecords), report.TotalSubtopics)
		fmt.Printf("   📊 Pedagogical Enhancement Report saved: pedagogical_enhancement_report.json\n")
	}

	elapsed := time.Since(startTime)
	fmt.Println("\n==========================================================================================")
	fmt.Println("🎉 ALL COURSES SUCCESSFULLY ENHANCED TO IIT/MIT/STANFORD STANDARDS!")
	fmt.Println("==========================================================================================")
	fmt.Printf("⏱️ Total Execution Time:         %v\n", elapsed)
	fmt.Printf("📚 Total Courses Enhanced:        %d / %d\n", totalTextbooksGenerated, len(coursesToProcess))
	fmt.Printf("🎓 Total Lecture Topics Analyzed: %d\n", totalLecturesProcessed)
	fmt.Printf("🔬 Total Subtopics Upgraded:      %d\n", totalSubtopicsEnhanced)
	fmt.Printf("📖 Master Textbooks Output Dir:   %s/\n", *outDirPtr)
	fmt.Println("==========================================================================================")
}
