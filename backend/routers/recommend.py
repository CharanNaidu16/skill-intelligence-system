"""Candidate recommendation endpoint."""

import logging

from fastapi import APIRouter, HTTPException

from schemas import RecommendRequest
from services import extractor, recommender
from services.llm import LLMNotConfiguredError
from services.store import store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["recommendations"])


@router.post("/recommend")
def get_recommendations(request: RecommendRequest):
    candidates = store.list()
    if not candidates:
        raise HTTPException(
            status_code=404, detail="No candidates found. Please upload resumes first."
        )

    if request.mode == "description":
        if not (request.job_description or "").strip():
            raise HTTPException(status_code=400, detail="Job description is required")
        try:
            requirements = extractor.extract_job_requirements(request.job_description)
        except LLMNotConfiguredError as exc:
            raise HTTPException(status_code=503, detail=str(exc))
        except Exception as exc:
            logger.exception("Job description parsing failed")
            raise HTTPException(
                status_code=502, detail=f"Job description parsing failed: {exc}"
            )
    else:
        if not request.required_skills:
            raise HTTPException(status_code=400, detail="required_skills is required")
        requirements = {
            "role_name": request.role_name or "Position",
            "required_skills": request.required_skills,
            "preferred_skills": request.preferred_skills or [],
            "min_experience_years": request.min_experience_years or 0,
        }

    recommendations = recommender.recommend_candidates(requirements, candidates)

    return {
        "role_name": requirements["role_name"],
        "total_candidates": len(candidates),
        "requirements": requirements,
        "recommendations": recommendations,
        "extracted_requirements": requirements if request.mode == "description" else None,
    }
