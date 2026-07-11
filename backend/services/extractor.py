"""LLM-powered extraction of candidate profiles and job requirements."""

from services import llm, skills

_RESUME_SYSTEM = (
    "You are an expert HR analyst specializing in skill extraction. "
    "Respond with a single valid JSON object and nothing else."
)

_RESUME_PROMPT = """Analyze this resume and extract skills and contact information.

Resume:
{resume_text}

Extract:
1. Candidate name and contact information (email, phone, LinkedIn, location)
2. Technical skills (programming languages, frameworks, tools)
3. Soft skills with supporting evidence
4. Estimated years of experience per major skill
5. Domain expertise (industries, specializations)
6. Proficiency per skill: Beginner, Intermediate, Advanced, or Expert

Return JSON with exactly this structure:
{{
  "candidate_name": "extracted name",
  "contact_info": {{
    "email": "email or null",
    "phone": "phone or null",
    "linkedin": "linkedin URL or null",
    "location": "city, state or null"
  }},
  "technical_skills": [
    {{"skill": "Python", "years": 5, "proficiency": "Expert", "context": "built ML systems for 5 years"}}
  ],
  "soft_skills": [
    {{"skill": "Leadership", "evidence": "Led team of 5 engineers"}}
  ],
  "domains": ["Machine Learning", "Web Development"],
  "total_experience_years": 7
}}

Be specific and evidence-based. Use null when information is unclear."""

_JOB_SYSTEM = (
    "You are an expert HR analyst specializing in job requirement extraction. "
    "Respond with a single valid JSON object and nothing else."
)

_JOB_PROMPT = """Analyze this job description and extract structured requirements.

Job Description:
{job_description}

Return JSON with exactly this structure:
{{
  "role_name": "extracted role title",
  "required_skills": ["Python", "React", "AWS"],
  "preferred_skills": ["Docker", "Kubernetes"],
  "min_experience_years": 5,
  "key_responsibilities": ["Design systems", "Lead development"],
  "education_requirements": "Bachelor's in Computer Science or null",
  "summary": "Brief summary of the role"
}}

Extract actual skill names. For experience ranges like "3-5 years" use the
minimum (3). If no experience requirement is mentioned, use 0."""


def extract_profile(resume_text: str) -> dict:
    """Extract a structured candidate profile from resume text."""
    profile = llm.get_client().complete_json(
        system=_RESUME_SYSTEM,
        user=_RESUME_PROMPT.format(resume_text=resume_text),
        max_tokens=2000,
    )
    profile["technical_skills"] = skills.normalize_technical_skills(
        profile.get("technical_skills")
    )
    profile.setdefault("candidate_name", "Unknown")
    profile.setdefault("contact_info", {})
    profile.setdefault("soft_skills", [])
    profile.setdefault("domains", [])
    profile.setdefault("total_experience_years", 0)
    return profile


def extract_job_requirements(job_description: str) -> dict:
    """Extract structured role requirements from a job description."""
    requirements = llm.get_client().complete_json(
        system=_JOB_SYSTEM,
        user=_JOB_PROMPT.format(job_description=job_description),
        max_tokens=1500,
    )
    requirements.setdefault("role_name", "Position")
    requirements.setdefault("required_skills", [])
    requirements.setdefault("preferred_skills", [])
    requirements.setdefault("min_experience_years", 0)
    return requirements
