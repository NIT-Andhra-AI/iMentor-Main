import os
import subprocess
import time

ROOT_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2/server/course_bootstrap"
TEXTBOOKS_DIR = "/home/sri/Downloads/iMentor_march/iMentorV2/server/textbooks"
os.makedirs(TEXTBOOKS_DIR, exist_ok=True)

TEXTBOOK_PROMPT = """You are an elite University Professor and GATE examiner.
Write a comprehensive, textbook-quality reference chapter for the topic: {topic} in the course: {course}.
This will act as a complete replacement for a standard textbook for faculty and a definitive GATE preparation material for students.
Include:
1. Deep theoretical foundations and derivations.
2. Real-world engineering applications.
3. 5 advanced GATE-level solved examples.
4. Practice problems.
Output ONLY raw Markdown.
"""

def generate_textbook_chapter(course, topic):
    safe_course = "".join([c if c.isalnum() else "_" for c in course])
    safe_topic = "".join([c if c.isalnum() else "_" for c in topic])
    
    course_dir = os.path.join(TEXTBOOKS_DIR, safe_course)
    os.makedirs(course_dir, exist_ok=True)
    
    out_file = os.path.join(course_dir, f"{safe_topic}_textbook.md")
    if os.path.exists(out_file):
        return # Skip if already generated
        
    print(f"Generating Textbook Chapter for {course} -> {topic}...")
    prompt = TEXTBOOK_PROMPT.format(course=course, topic=topic)
    
    cmd = ["agy", "--model", "gemini-3.1-pro-high", "--disable-slash-commands", "--print", prompt]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if res.returncode == 0 and res.stdout.strip():
            with open(out_file, "w") as f:
                f.write(res.stdout.strip())
            print(f"✅ Generated {out_file}")
    except Exception as e:
        print(f"❌ Failed to generate chapter for {topic}: {e}")

def main():
    courses = [d for d in os.listdir(ROOT_DIR) if os.path.isdir(os.path.join(ROOT_DIR, d))]
    for course in courses:
        course_path = os.path.join(ROOT_DIR, course)
        topics = [d for d in os.listdir(course_path) if os.path.isdir(os.path.join(course_path, d)) and not d.startswith('_')]
        
        for topic in topics:
            generate_textbook_chapter(course, topic)

if __name__ == "__main__":
    main()
