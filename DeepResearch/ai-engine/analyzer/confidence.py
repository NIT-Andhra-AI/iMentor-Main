from typing import List, Dict, Any

def calculate_confidence(findings: List[Dict[str, Any]], num_sources: int) -> float:
    if not findings or num_sources == 0:
        return 0.5
    avg_score = sum(f.get("confidence", 0.8) for f in findings) / len(findings)
    coverage_bonus = min(num_sources / 10.0, 0.1)
    return round(min(avg_score + coverage_bonus, 1.0), 2)
