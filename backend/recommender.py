class RecommendationEngine:
    """Basic recommendation engine for skill-based matching"""
    
    def __init__(self):
        pass
    
    def recommend_candidates(self, job_requirements: dict, candidate_pool: list) -> list:
        """
        Recommend candidates based on job requirements
        
        Args:
            job_requirements: Dictionary containing required skills and experience
            candidate_pool: List of candidate skill profiles
            
        Returns:
            List of recommended candidates with detailed match information
        """
        recommendations = []
        
        for candidate in candidate_pool:
            match_details = self._get_detailed_match(job_requirements, candidate)
            recommendations.append(match_details)
        
        # Sort by match score (descending)
        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations
    
    def _get_detailed_match(self, job_requirements: dict, candidate: dict) -> dict:
        """Get detailed matching information for a candidate"""
        required_skills = job_requirements.get("required_skills", [])
        preferred_skills = job_requirements.get("preferred_skills", [])
        min_experience = job_requirements.get("min_experience_years", 0)
        
        candidate_skills = []
        if "technical_skills" in candidate:
            candidate_skills = [skill["skill"].lower() for skill in candidate["technical_skills"]]
        
        # Check required skills matches
        required_matches = []
        required_missing = []
        
        for req_skill in required_skills:
            found_match = None
            for tech_skill in candidate.get("technical_skills", []):
                if req_skill.lower() in tech_skill["skill"].lower():
                    found_match = {
                        "skill": tech_skill["skill"],
                        "proficiency": tech_skill.get("proficiency", "Unknown"),
                        "years": tech_skill.get("years", 0)
                    }
                    break
            
            if found_match:
                required_matches.append(found_match)
            else:
                required_missing.append(req_skill)
        
        # Check preferred skills matches
        preferred_matches = []
        for pref_skill in preferred_skills:
            for tech_skill in candidate.get("technical_skills", []):
                if pref_skill.lower() in tech_skill["skill"].lower():
                    preferred_matches.append({
                        "skill": tech_skill["skill"],
                        "proficiency": tech_skill.get("proficiency", "Unknown")
                    })
                    break
        
        # Calculate match score
        required_score = len(required_matches) / len(required_skills) if required_skills else 1.0
        experience_score = 1.0 if candidate.get("total_experience_years", 0) >= min_experience else 0.5
        
        # Overall match score (weighted: 70% skills, 30% experience)
        match_score = (required_score * 0.7) + (experience_score * 0.3)
        match_percentage = round(match_score * 100)
        
        # Generate explanation
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
            "candidate_name": candidate.get("candidate_name", "Unknown"),
            "match_score": match_score,
            "match_percentage": match_percentage,
            "explanation": explanation,
            "required_skills_matched": len(required_matches),
            "required_skills_total": len(required_skills),
            "required_matches": required_matches,
            "required_missing": required_missing,
            "preferred_matches": preferred_matches,
            "experience_years": candidate.get("total_experience_years", 0),
            "meets_experience_requirement": candidate.get("total_experience_years", 0) >= min_experience
        }
    
    def _calculate_match_score(self, job_requirements: dict, candidate: dict) -> float:
        """Calculate match score between job requirements and candidate skills"""
        score = 0.0
        total_requirements = 0
        
        # Check technical skills match
        if "required_skills" in job_requirements and "technical_skills" in candidate:
            required_skills = [skill.lower() for skill in job_requirements["required_skills"]]
            candidate_skills = [skill["skill"].lower() for skill in candidate["technical_skills"]]
            
            for req_skill in required_skills:
                total_requirements += 1
                if req_skill in candidate_skills:
                    score += 1.0
        
        # Check experience requirements
        if "min_experience" in job_requirements and "total_experience_years" in candidate:
            total_requirements += 1
            if candidate["total_experience_years"] >= job_requirements["min_experience"]:
                score += 1.0
        
        # Normalize score
        return score / total_requirements if total_requirements > 0 else 0.0
    
    def recommend_skills(self, candidate_profile: dict, target_role: str = None) -> dict:
        """
        Recommend skills for career development
        
        Args:
            candidate_profile: Candidate's current skill profile
            target_role: Target role for skill recommendations
            
        Returns:
            Dictionary with recommended skills and learning paths
        """
        # This is a basic implementation - in reality, this would use
        # more sophisticated algorithms and market data
        
        current_skills = []
        if "technical_skills" in candidate_profile:
            current_skills = [skill["skill"].lower() for skill in candidate_profile["technical_skills"]]
        
        # Common skill progression paths
        skill_paths = {
            "python": ["fastapi", "django", "flask", "pandas", "numpy", "machine learning"],
            "javascript": ["react", "vue.js", "node.js", "typescript", "express"],
            "java": ["spring", "hibernate", "maven", "junit", "microservices"],
            "data science": ["python", "r", "sql", "tableau", "power bi", "machine learning"],
            "web development": ["html", "css", "javascript", "react", "node.js", "mongodb"]
        }
        
        recommendations = []
        
        # Find relevant skill paths
        for skill in current_skills:
            if skill in skill_paths:
                for suggested_skill in skill_paths[skill]:
                    if suggested_skill not in current_skills:
                        recommendations.append({
                            "skill": suggested_skill,
                            "reason": f"Complements your {skill} skills",
                            "priority": "medium"
                        })
        
        # Remove duplicates
        unique_recommendations = []
        seen_skills = set()
        for rec in recommendations:
            if rec["skill"] not in seen_skills:
                unique_recommendations.append(rec)
                seen_skills.add(rec["skill"])
        
        return {
            "recommended_skills": unique_recommendations[:10],  # Limit to top 10
            "current_skills_count": len(current_skills),
            "growth_potential": "high" if len(unique_recommendations) > 5 else "moderate"
        }