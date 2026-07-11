"""Skill-based candidate ranking for a role."""

from services.skills import match_key


def recommend_candidates(job_requirements: dict, candidates: list) -> list:
    """Score every candidate against the requirements, best match first."""
    recommendations = [
        _detailed_match(job_requirements, candidate) for candidate in candidates
    ]
    recommendations.sort(key=lambda r: r["match_score"], reverse=True)
    return recommendations


def _detailed_match(job_requirements: dict, candidate: dict) -> dict:
    required_skills = job_requirements.get("required_skills") or []
    preferred_skills = job_requirements.get("preferred_skills") or []
    min_experience = job_requirements.get("min_experience_years") or 0

    # Candidate skills indexed by canonical key for exact matching
    skill_index = {
        match_key(entry["skill"]): entry
        for entry in candidate.get("technical_skills", [])
        if entry.get("skill")
    }

    required_matches = []
    required_missing = []
    for req_skill in required_skills:
        found = skill_index.get(match_key(req_skill))
        if found:
            required_matches.append(
                {
                    "skill": found["skill"],
                    "proficiency": found.get("proficiency", "Unknown"),
                    "years": found.get("years", 0),
                }
            )
        else:
            required_missing.append(req_skill)

    preferred_matches = []
    for pref_skill in preferred_skills:
        found = skill_index.get(match_key(pref_skill))
        if found:
            preferred_matches.append(
                {
                    "skill": found["skill"],
                    "proficiency": found.get("proficiency", "Unknown"),
                    "years": found.get("years", 0),
                }
            )

    experience_years = candidate.get("total_experience_years") or 0
    meets_experience = experience_years >= min_experience

    required_score = (
        len(required_matches) / len(required_skills) if required_skills else 1.0
    )
    preferred_score = (
        len(preferred_matches) / len(preferred_skills) if preferred_skills else 0.0
    )
    experience_score = 1.0 if meets_experience else 0.5

    # Weighted: 60% required skills, 10% preferred, 30% experience
    match_score = required_score * 0.6 + preferred_score * 0.1 + experience_score * 0.3
    match_percentage = round(match_score * 100)

    if match_percentage >= 80:
        explanation = "Excellent match with strong skill alignment"
    elif match_percentage >= 60:
        explanation = "Good match with some skill gaps"
    elif match_percentage >= 40:
        explanation = "Partial match, may need training"
    else:
        explanation = "Limited match, significant skill gaps"

    return {
        "candidate": candidate,
        "candidate_id": candidate.get("id"),
        "candidate_name": candidate.get("candidate_name", "Unknown"),
        "match_score": match_score,
        "match_percentage": match_percentage,
        "explanation": explanation,
        "required_skills_matched": len(required_matches),
        "required_skills_total": len(required_skills),
        "required_matches": required_matches,
        "required_missing": required_missing,
        "preferred_matches": preferred_matches,
        "preferred_skills_total": len(preferred_skills),
        "experience_years": experience_years,
        "meets_experience_requirement": meets_experience,
    }
