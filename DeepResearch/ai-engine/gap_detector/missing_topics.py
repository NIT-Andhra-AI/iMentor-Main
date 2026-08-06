from typing import List, Dict, Any

def identify_missing_topics(subtopics: List[str], raw_sources: List[Dict[str, Any]]) -> List[str]:
    covered_text = " ".join([s.get("snippet", "").lower() for s in raw_sources])
    missing = []
    for st in subtopics:
        if st.lower() not in covered_text:
            missing.append(st)
    return missing
