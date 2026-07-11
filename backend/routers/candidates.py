"""Candidate CRUD, search, upload, and export endpoints."""

import datetime
import logging
import re
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

import config
from schemas import BulkDeleteRequest, CandidateUpdate
from services import extractor, pdf_processor
from services.llm import LLMNotConfiguredError
from services.store import store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_STATUSES = {"new", "contacted", "interviewed", "hired", "rejected"}


def _safe_filename(filename: str) -> str:
    """Strip any path components and unsafe characters from an upload name."""
    name = Path(filename or "resume").name
    return re.sub(r"[^\w.\- ]", "_", name) or "resume"


@router.get("")
def list_candidates(
    q: Optional[str] = None,
    skill: Optional[str] = None,
    status: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    min_experience: Optional[int] = None,
    max_experience: Optional[int] = None,
    location: Optional[str] = None,
):
    """List candidates, optionally filtered."""
    candidates = store.list()

    def matches(candidate: dict) -> bool:
        if q:
            haystack = candidate.get("candidate_name", "").lower()
            skill_names = " ".join(
                s.get("skill", "") for s in candidate.get("technical_skills", [])
            ).lower()
            if q.lower() not in haystack and q.lower() not in skill_names:
                return False
        if skill:
            if not any(
                skill.lower() in s.get("skill", "").lower()
                for s in candidate.get("technical_skills", [])
            ):
                return False
        experience = candidate.get("total_experience_years") or 0
        if min_experience is not None and experience < min_experience:
            return False
        if max_experience is not None and experience > max_experience:
            return False
        if location:
            candidate_location = (candidate.get("contact_info") or {}).get("location") or ""
            if location.lower() not in candidate_location.lower():
                return False
        if status and candidate.get("status") != status:
            return False
        if is_favorite is not None and bool(candidate.get("is_favorite")) != is_favorite:
            return False
        return True

    filtered = [c for c in candidates if matches(c)]
    return {"count": len(filtered), "total": len(candidates), "candidates": filtered}


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume, extract the profile with the LLM, store the candidate."""
    filename = _safe_filename(file.filename)
    if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail="Only PDF, DOCX, and TXT files are supported"
        )

    file_path = config.RESUMES_DIR / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        resume_text = pdf_processor.extract_text(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        profile = extractor.extract_profile(resume_text)
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Skill extraction failed")
        raise HTTPException(status_code=502, detail=f"Skill extraction failed: {exc}")

    profile["source_file"] = filename
    candidate, created = store.upsert(profile)

    return {
        "message": "Resume processed successfully",
        "created": created,
        "candidate": candidate,
    }


RESUME_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _resume_file_or_404(candidate_id: str) -> Path:
    candidate = store.get(candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    source_file = candidate.get("source_file")
    if not source_file:
        raise HTTPException(
            status_code=404, detail="No resume file is stored for this candidate"
        )
    file_path = config.RESUMES_DIR / Path(source_file).name
    if not file_path.exists():
        raise HTTPException(
            status_code=404, detail="Resume file is missing from storage"
        )
    return file_path


@router.get("/{candidate_id}/resume")
def view_resume(candidate_id: str, download: bool = False):
    """Serve the candidate's original resume file (inline view or download)."""
    file_path = _resume_file_or_404(candidate_id)
    return FileResponse(
        file_path,
        media_type=RESUME_MEDIA_TYPES.get(file_path.suffix.lower(), "application/octet-stream"),
        content_disposition_type="attachment" if download else "inline",
        filename=file_path.name,
    )


@router.get("/{candidate_id}/resume/text")
def resume_text(candidate_id: str):
    """Extracted plain text of the resume, for in-app preview of formats the
    browser cannot render itself (DOCX)."""
    file_path = _resume_file_or_404(candidate_id)
    try:
        text = pdf_processor.extract_text(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return {"filename": file_path.name, "text": text}


@router.get("/export")
def export_candidates():
    return {
        "candidates": store.list(),
        "export_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


@router.post("/bulk-delete")
def bulk_delete(request: BulkDeleteRequest):
    deleted = store.bulk_delete(request.ids)
    return {"deleted": deleted, "remaining": len(store.list())}


@router.put("/{candidate_id}")
def update_candidate(candidate_id: str, updates: CandidateUpdate):
    data = updates.dict(exclude_unset=True)
    if "status" in data and data["status"] not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data['status']}")
    candidate = store.update(candidate_id, data)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": "Candidate updated", "candidate": candidate}


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: str):
    if not store.delete(candidate_id):
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": "Candidate deleted"}
