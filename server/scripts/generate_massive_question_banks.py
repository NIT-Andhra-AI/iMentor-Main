import os
import json
import subprocess
import glob
import time
import concurrent.futures

ROOT_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2/server/course_bootstrap"
OUTPUT_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2/server/question_banks"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate 25 questions at a time to avoid context limit issues. 10 iterations = 250 questions.
QUESTIONS_PER_BATCH = 25
BATCHES_PER_TOPIC = 10

PROMPT_TEMPLATE = """You are an expert Professor creating an exhaustive, highly difficult GATE/University level Question Bank.
Topic: {topic_name}
Course: {course_name}

Task: Generate exactly {num_questions} unique, challenging Multiple Choice Questions (MCQs) for this topic.
The questions MUST cover various levels of Bloom's Taxonomy (Remember, Understand, Apply, Analyze, Evaluate, Create).
Ensure NO questions are repeated from previous iterations. 

Format the output as a STRICT JSON array of objects with the following schema:
[
  {
    "question": "The question text...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why the answer is correct.",
    "difficulty": "medium|hard|advanced",
    "bloomLevel": "analyze"
  }
]
OUTPUT ONLY THE JSON ARRAY. NO MARKDOWN WRAPPERS, NO PREAMBLES.
"""

def generate_questions_for_topic(course_name, topic_name):
    all_questions = []
    
    print(f"Starting generation for: {course_name} -> {topic_name} (Target: {QUESTIONS_PER_BATCH * BATCHES_PER_TOPIC} Qs)")
    
    for batch_num in range(BATCHES_PER_TOPIC):
        prompt = PROMPT_TEMPLATE.format(topic_name=topic_name, course_name=course_name, num_questions=QUESTIONS_PER_BATCH)
        
        cmd = [
            "agy",
            "--model", "gemini-3.1-pro-high",
            "--disable-slash-commands",
            "--print", prompt
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode == 0:
                output = result.stdout.strip()
                if output.startswith("```json"):
                    output = output[7:-3].strip()
                elif output.startswith("```"):
                    output = output[3:-3].strip()
                    
                batch_q = json.loads(output)
                all_questions.extend(batch_q)
                print(f"  [+] {topic_name} - Batch {batch_num+1}/{BATCHES_PER_TOPIC} generated {len(batch_q)} questions.")
            else:
                print(f"  [-] {topic_name} - Batch {batch_num+1} failed: {result.stderr[:100]}")
        except Exception as e:
            print(f"  [-] {topic_name} - Batch {batch_num+1} error: {e}")
            
    # Save the 250 questions to a file
    safe_topic = "".join([c if c.isalnum() else "_" for c in topic_name])
    safe_course = "".join([c if c.isalnum() else "_" for c in course_name])
    out_file = os.path.join(OUTPUT_DIR, f"{safe_course}_{safe_topic}_bank.json")
    
    with open(out_file, 'w') as f:
        json.dump(all_questions, f, indent=2)
        
    print(f"✅ Completed {topic_name}. Saved {len(all_questions)} questions to {out_file}")
    return len(all_questions)

def main():
    # Discover topics based on directories or markdown files
    # For demonstration, we'll just parse the folder names in course_bootstrap
    courses = [d for d in os.listdir(ROOT_DIR) if os.path.isdir(os.path.join(ROOT_DIR, d))]
    tasks = []
    
    # We will just take the first 2 topics per course for testing, to avoid a massive explosion right away
    for course in courses:
        course_dir = os.path.join(ROOT_DIR, course)
        # using subfolders as topics
        topics = [d for d in os.listdir(course_dir) if os.path.isdir(os.path.join(course_dir, d)) and not d.startswith('_')]
        for topic in topics:
            tasks.append((course, topic))
            
    print(f"Found {len(tasks)} course-topic pairs. Total target questions: {len(tasks) * 250}")
    
    # Run with limited concurrency so we don't hit rate limits immediately
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = [executor.submit(generate_questions_for_topic, c, t) for c, t in tasks]
        for f in concurrent.futures.as_completed(futures):
            pass

if __name__ == "__main__":
    main()
