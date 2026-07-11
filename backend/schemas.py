"""Pydantic request/response models."""

from typing import List, Optional

from pydantic import BaseModel, Field


class CandidateUpdate(BaseModel):
    candidate_name: Optional[str] = None
    contact_info: Optional[dict] = None
    technical_skills: Optional[List[dict]] = None
    soft_skills: Optional[List[dict]] = None
    domains: Optional[List[str]] = None
    total_experience_years: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None
    status: Optional[str] = None  # new | contacted | interviewed | hired | rejected
    is_favorite: Optional[bool] = None
    salary_expectation: Optional[str] = None


class BulkDeleteRequest(BaseModel):
    ids: List[str]


class RecommendRequest(BaseModel):
    mode: str = "manual"  # "manual" | "description"
    role_name: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = []
    min_experience_years: Optional[int] = 0
    job_description: Optional[str] = None
