from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import json
from pathlib import Path
import shutil
import datetime

from skill_extractor import SkillExtractor
from pdf_processor import PDFProcessor
from recommender import RecommendationEngine

app = FastAPI(title="Skill Intelligence API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
skill_extractor = SkillExtractor()
pdf_processor = PDFProcessor()
recommender = RecommendationEngine()

# Data storage paths
DATA_DIR = Path("../data")
RESUMES_DIR = DATA_DIR / "resumes"
PROCESSED_DIR = DATA_DIR / "processed"

RESUMES_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Pydantic models
class RoleRequirements(BaseModel):
    role_name: str
    required_skills: List[str]
    preferred_skills: Optional[List[str]] = []
    min_experience_years: Optional[int] = 0

class JobDescriptionRequest(BaseModel):
    job_description: str
    mode: Optional[str] = "description"

class FlexibleRequirements(BaseModel):
    role_name: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = []
    min_experience_years: Optional[int] = 0
    job_description: Optional[str] = None
    mode: str = "manual"

class CandidateUpdate(BaseModel):
    candidate_name: Optional[str] = None
    contact_info: Optional[dict] = None
    technical_skills: Optional[List[dict]] = None
    soft_skills: Optional[List[dict]] = None
    domains: Optional[List[str]] = None
    total_experience_years: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = "new"  # new, contacted, interviewed, hired, rejected
    is_favorite: Optional[bool] = False
    salary_expectation: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    candidate_names: List[str]

@app.get("/")
def read_root():
    return {"message": "Skill Intelligence API is running"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and process a resume"""
    
    # Validate file type
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    try:
        # Save uploaded file
        file_path = RESUMES_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract text
        if file.filename.endswith('.pdf'):
            resume_text = pdf_processor.extract_text_from_pdf(str(file_path))
        else:
            resume_text = pdf_processor.extract_text_from_txt(str(file_path))
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Extract skills using AI
        skills_data = skill_extractor.extract_skills(resume_text)
        
        if "error" in skills_data:
            raise HTTPException(status_code=500, detail=f"Skill extraction failed: {skills_data['error']}")
        
        # Normalize skills
        normalized_data = skill_extractor.normalize_skills(skills_data)
        
        # Add metadata
        normalized_data.update({
            "notes": "",
            "status": "new",
            "is_favorite": False,
            "salary_expectation": None,
            "created_date": datetime.datetime.now().isoformat(),
            "updated_date": datetime.datetime.now().isoformat()
        })
        
        # Save processed data
        candidate_name = normalized_data.get("candidate_name", "unknown").replace(" ", "_")
        output_file = PROCESSED_DIR / f"{candidate_name}.json"
        
        with open(output_file, "w") as f:
            json.dump(normalized_data, f, indent=2)
        
        # Update centralized candidates.json file
        candidates_file = Path("candidates.json")
        candidates = []
        
        # Load existing candidates
        if candidates_file.exists():
            with open(candidates_file, "r") as f:
                candidates = json.load(f)
        
        # Add the new candidate if not already present
        existing_names = {c.get("candidate_name") for c in candidates}
        if normalized_data.get("candidate_name") not in existing_names:
            candidates.append(normalized_data)
            
            # Save updated list
            with open(candidates_file, "w") as f:
                json.dump(candidates, f, indent=2)
        
        return {
            "message": "Resume processed successfully",
            "candidate_name": normalized_data.get("candidate_name"),
            "technical_skills_count": len(normalized_data.get("technical_skills", [])),
            "data": normalized_data
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/candidates")
def get_all_candidates():
    """Get all processed candidates"""
    
    candidates = []
    candidates_file = Path("candidates.json")
    
    if candidates_file.exists():
        with open(candidates_file, "r") as f:
            candidates = json.load(f)
    
    return {"count": len(candidates), "candidates": candidates}
    
    return {"count": len(candidates), "candidates": candidates}

@app.post("/recommend")
def get_recommendations(requirements: FlexibleRequirements):
    """Get candidate recommendations for a role"""
    
    # Load all candidates
    candidates = []
    for file_path in PROCESSED_DIR.glob("*.json"):
        with open(file_path, "r") as f:
            candidates.append(json.load(f))
    
    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found. Please upload resumes first.")
    
    # Process requirements based on mode
    if requirements.mode == "description" and requirements.job_description:
        # Extract requirements from job description using AI
        extracted_requirements = skill_extractor.extract_job_requirements(requirements.job_description)
        
        if "error" in extracted_requirements:
            raise HTTPException(status_code=500, detail=f"Job description parsing failed: {extracted_requirements['error']}")
        
        # Use extracted requirements
        processed_requirements = {
            "role_name": extracted_requirements.get("role_name", "Position"),
            "required_skills": extracted_requirements.get("required_skills", []),
            "preferred_skills": extracted_requirements.get("preferred_skills", []),
            "min_experience_years": extracted_requirements.get("min_experience_years", 0)
        }
    else:
        # Use manual requirements
        processed_requirements = {
            "role_name": requirements.role_name or "Position",
            "required_skills": requirements.required_skills or [],
            "preferred_skills": requirements.preferred_skills or [],
            "min_experience_years": requirements.min_experience_years or 0
        }
    
    # Get recommendations
    recommendations = recommender.recommend_candidates(
        processed_requirements,
        candidates
    )
    
    return {
        "role_name": processed_requirements["role_name"],
        "total_candidates": len(candidates),
        "recommendations": recommendations,
        "extracted_requirements": processed_requirements if requirements.mode == "description" else None
    }

@app.put("/candidates/{candidate_name}")
def update_candidate(candidate_name: str, updates: CandidateUpdate):
    """Update candidate profile"""
    
    candidates_file = Path("candidates.json")
    if not candidates_file.exists():
        raise HTTPException(status_code=404, detail="No candidates found")
    
    with open(candidates_file, "r") as f:
        candidates = json.load(f)
    
    # Find candidate
    candidate_index = None
    for i, candidate in enumerate(candidates):
        if candidate.get("candidate_name") == candidate_name:
            candidate_index = i
            break
    
    if candidate_index is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Update candidate data
    update_data = updates.dict(exclude_unset=True)
    update_data["updated_date"] = datetime.datetime.now().isoformat()
    
    candidates[candidate_index].update(update_data)
    
    # Save updated data
    with open(candidates_file, "w") as f:
        json.dump(candidates, f, indent=2)
    
    return {"message": f"Updated {candidate_name}", "candidate": candidates[candidate_index]}

@app.get("/candidates/search")
def search_candidates(
    skill: Optional[str] = None,
    min_experience: Optional[int] = None,
    max_experience: Optional[int] = None,
    location: Optional[str] = None,
    status: Optional[str] = None,
    is_favorite: Optional[bool] = None
):
    """Advanced candidate search and filtering"""
    
    candidates_file = Path("candidates.json")
    if not candidates_file.exists():
        return {"count": 0, "candidates": []}
    
    with open(candidates_file, "r") as f:
        candidates = json.load(f)
    
    filtered_candidates = []
    
    for candidate in candidates:
        # Skill filter
        if skill:
            skill_match = False
            for tech_skill in candidate.get("technical_skills", []):
                if skill.lower() in tech_skill.get("skill", "").lower():
                    skill_match = True
                    break
            if not skill_match:
                continue
        
        # Experience filter
        candidate_exp = candidate.get("total_experience_years", 0)
        if min_experience is not None and candidate_exp < min_experience:
            continue
        if max_experience is not None and candidate_exp > max_experience:
            continue
        
        # Location filter
        if location:
            candidate_location = candidate.get("contact_info", {}).get("location", "")
            if location.lower() not in candidate_location.lower():
                continue
        
        # Status filter
        if status and candidate.get("status") != status:
            continue
        
        # Favorite filter
        if is_favorite is not None and candidate.get("is_favorite") != is_favorite:
            continue
        
        filtered_candidates.append(candidate)
    
    return {"count": len(filtered_candidates), "candidates": filtered_candidates}

@app.delete("/candidates/bulk")
def bulk_delete_candidates(request: BulkDeleteRequest):
    """Delete multiple candidates"""
    
    candidates_file = Path("candidates.json")
    if not candidates_file.exists():
        raise HTTPException(status_code=404, detail="No candidates found")
    
    with open(candidates_file, "r") as f:
        candidates = json.load(f)
    
    # Filter out deleted candidates
    original_count = len(candidates)
    candidates = [c for c in candidates if c.get("candidate_name") not in request.candidate_names]
    deleted_count = original_count - len(candidates)
    
    # Save updated data
    with open(candidates_file, "w") as f:
        json.dump(candidates, f, indent=2)
    
    return {"message": f"Deleted {deleted_count} candidates", "remaining_count": len(candidates)}

@app.get("/candidates/export")
def export_candidates():
    """Export candidates data as JSON (CSV export can be handled by frontend)"""
    
    candidates_file = Path("candidates.json")
    if not candidates_file.exists():
        return {"candidates": []}
    
    with open(candidates_file, "r") as f:
        candidates = json.load(f)
    
    return {"candidates": candidates, "export_date": datetime.datetime.now().isoformat()}

@app.delete("/candidates/{candidate_name}")
def delete_candidate(candidate_name: str):
    """Delete a candidate's data"""
    
    file_path = PROCESSED_DIR / f"{candidate_name}.json"
    if file_path.exists():
        file_path.unlink()
        return {"message": f"Deleted {candidate_name}"}
    else:
        raise HTTPException(status_code=404, detail="Candidate not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)