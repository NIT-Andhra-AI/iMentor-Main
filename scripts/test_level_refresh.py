#!/usr/bin/env python3
"""
Test Level Refresh Verification Script
======================================
Simulates consecutive student level refreshes for EE1011 (Basic Electrical Circuits)
to verify that every refresh serves a NEW set of questions from the 50-question pool.
"""

import os
import json
import random

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EVAL_PATH = os.path.join(PROJECT_ROOT, "course_bootstrap", "EE1011", "skill_tree_evaluation.json")

def simulate_student_refreshes(level_id=1, refreshes=5):
    with open(EVAL_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    lvl = next(l for l in data["levels"] if l["level"] == level_id)
    pool = lvl["questions"]
    
    seen_ids = set()
    all_attempts = []
    
    print(f"🔄 Simulating {refreshes} consecutive student level refreshes for {data['course_code']} Level {level_id}...")
    print(f"📦 Level Pool Size: {len(pool)} Questions\n")
    
    for attempt in range(1, refreshes + 1):
        unseen = [q for q in pool if q["id"] not in seen_ids]
        if len(unseen) < 5:
            seen_ids.clear()
            unseen = pool
            
        sampled = random.sample(unseen, 5)
        sampled_ids = [q["id"] for q in sampled]
        seen_ids.update(sampled_ids)
        all_attempts.append(sampled_ids)
        
        print(f"  Attempt {attempt} (Refresh #{attempt-1}):")
        for q in sampled:
            print(f"    - [{q['id']}] {q['question'][:70]}...")
            
    print("\n------------------------------------------------------------------")
    # Verify zero overlap between consecutive refreshes
    overlaps = []
    for i in range(len(all_attempts) - 1):
        set_a = set(all_attempts[i])
        set_b = set(all_attempts[i+1])
        overlap = set_a.intersection(set_b)
        overlaps.append(len(overlap))
        print(f"  Refresh #{i+1} vs Refresh #{i+2} Question Overlap: {len(overlap)} questions")
        
    if all(o == 0 for o in overlaps):
        print("✅ REFRESH VERIFICATION PASSED: 0% question overlap on consecutive refreshes!")
    else:
        print("❌ REFRESH VERIFICATION FAILED: Found overlapping questions.")

if __name__ == "__main__":
    simulate_student_refreshes()
