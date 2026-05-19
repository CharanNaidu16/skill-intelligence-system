import json
import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

class SkillExtractor:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    
    def extract_skills(self, resume_text: str) -> dict:
        """Extract structured skills from resume text using GPT-4"""
        
        prompt = f"""Analyze this resume and extract skills and contact information in JSON format.

Resume:
{resume_text}

Extract the following information:
1. Contact Information (email, phone, LinkedIn URL if present)
2. Technical skills (programming languages, frameworks, tools)
3. Soft skills (leadership, communication, problem-solving)
4. Years of experience for each major skill (estimate based on context)
5. Domain expertise (industries, specializations)
6. Proficiency level for each skill (Beginner/Intermediate/Advanced/Expert)

Return ONLY valid JSON with this structure:
{{
  "candidate_name": "extracted name",
  "contact_info": {{
    "email": "email@example.com or null",
    "phone": "phone number or null",
    "linkedin": "linkedin URL or null",
    "location": "city, state or null"
  }},
  "technical_skills": [
    {{"skill": "Python", "years": 5, "proficiency": "Expert", "context": "built ML systems for 5 years"}},
    {{"skill": "React", "years": 3, "proficiency": "Advanced", "context": "developed frontend apps"}}
  ],
  "soft_skills": [
    {{"skill": "Leadership", "evidence": "Led team of 5 engineers"}}
  ],
  "domains": ["Machine Learning", "Web Development"],
  "total_experience_years": 7
}}

Be specific and evidence-based. If information is unclear, use null."""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst specializing in skill extraction. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Clean up response if it has markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            skills_data = json.loads(content)
            return skills_data
            
        except Exception as e:
            print(f"Error extracting skills: {e}")
            return {"error": str(e)}
    
    def normalize_skills(self, skills_data: dict) -> dict:
        """Normalize skill names to canonical forms"""
        
        # Common skill mappings
        skill_mappings = {
            "javascript": "JavaScript",
            "js": "JavaScript",
            "typescript": "TypeScript",
            "ts": "TypeScript",
            "python": "Python",
            "py": "Python",
            "react": "React",
            "reactjs": "React",
            "react.js": "React",
            "nodejs": "Node.js",
            "node": "Node.js",
            "node.js": "Node.js",
            "aws": "AWS",
            "amazon web services": "AWS",
            "azure": "Azure",
            "microsoft azure": "Azure",
        }
        
        normalized = skills_data.copy()
        
        if "technical_skills" in normalized:
            for skill in normalized["technical_skills"]:
                skill_lower = skill["skill"].lower()
                if skill_lower in skill_mappings:
                    skill["skill"] = skill_mappings[skill_lower]
        
        return normalized
    
    def extract_job_requirements(self, job_description: str) -> dict:
        """Extract role requirements from job description using GPT-4"""
        
        prompt = f"""Analyze this job description and extract structured requirements in JSON format.

Job Description:
{job_description}

Extract the following information:
1. Role/Position name
2. Required technical skills (must-have skills)
3. Preferred technical skills (nice-to-have skills)
4. Minimum years of experience required
5. Key responsibilities (summarized)
6. Education requirements if mentioned

Return ONLY valid JSON with this structure:
{{
  "role_name": "extracted role title",
  "required_skills": ["Python", "React", "AWS"],
  "preferred_skills": ["Docker", "Kubernetes", "CI/CD"],
  "min_experience_years": 5,
  "key_responsibilities": ["Design systems", "Lead development"],
  "education_requirements": "Bachelor's in Computer Science or equivalent",
  "summary": "Brief summary of the role"
}}

Be specific and extract actual skill names. If experience is mentioned as ranges like "3-5 years", use the minimum (3). If no specific experience is mentioned, use 0."""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst specializing in job requirement extraction. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            
            # Clean up response if it has markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            requirements_data = json.loads(content)
            return requirements_data
            
        except Exception as e:
            print(f"Error extracting job requirements: {e}")
            return {"error": str(e)}