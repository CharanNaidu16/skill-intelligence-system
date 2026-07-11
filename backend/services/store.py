"""Single source of truth for candidate data.

All reads and writes go through CandidateStore, which persists to one JSON
file with atomic writes. Candidates are keyed by a generated id, so display
names (which may contain spaces or collide) are never used as identifiers
or file names.

On first run it migrates data from the legacy locations
(backend/candidates.json and data/processed/*.json) into the new store.
"""

import json
import logging
import threading
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

import config

logger = logging.getLogger(__name__)

DEFAULT_METADATA = {
    "notes": "",
    "status": "new",
    "is_favorite": False,
    "salary_expectation": None,
    "source_file": None,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CandidateStore:
    def __init__(self, path: Path):
        self._path = path
        self._lock = threading.Lock()
        self._candidates: list[dict] = []
        self._load()

    # ── Public API ────────────────────────────────────────────────

    def list(self) -> list[dict]:
        with self._lock:
            return deepcopy(self._candidates)

    def get(self, candidate_id: str) -> dict | None:
        with self._lock:
            found = self._find(candidate_id)
            return deepcopy(found) if found else None

    def upsert(self, profile: dict) -> tuple[dict, bool]:
        """Insert a new candidate or refresh an existing one (re-uploading an
        updated resume updates the profile). Returns (candidate, created).

        Identity matching, most reliable signal first:
        1. Email — unique per person, so same email means same candidate.
        2. Name — only when the email comparison is inconclusive (one side
           has no email). Two records with the same name but two different
           emails are treated as different people.
        """
        with self._lock:
            existing = self._find_identity_match(profile)
            if existing:
                # Refresh extracted fields, keep recruiter-managed metadata
                for field in (
                    "candidate_name",
                    "contact_info",
                    "technical_skills",
                    "soft_skills",
                    "domains",
                    "total_experience_years",
                    "source_file",
                ):
                    if field in profile:
                        existing[field] = profile[field]
                existing["updated_at"] = _now()
                self._save()
                return deepcopy(existing), False

            candidate = {**DEFAULT_METADATA, **profile}
            candidate["id"] = uuid.uuid4().hex[:12]
            candidate["created_at"] = _now()
            candidate["updated_at"] = candidate["created_at"]
            self._candidates.append(candidate)
            self._save()
            return deepcopy(candidate), True

    def update(self, candidate_id: str, updates: dict) -> dict | None:
        with self._lock:
            candidate = self._find(candidate_id)
            if candidate is None:
                return None
            updates.pop("id", None)
            candidate.update(updates)
            candidate["updated_at"] = _now()
            self._save()
            return deepcopy(candidate)

    def delete(self, candidate_id: str) -> bool:
        return self.bulk_delete([candidate_id]) == 1

    def bulk_delete(self, candidate_ids: list[str]) -> int:
        ids = set(candidate_ids)
        with self._lock:
            before = len(self._candidates)
            self._candidates = [c for c in self._candidates if c["id"] not in ids]
            deleted = before - len(self._candidates)
            if deleted:
                self._save()
            return deleted

    # ── Internal ──────────────────────────────────────────────────

    def _find(self, candidate_id: str) -> dict | None:
        return next((c for c in self._candidates if c["id"] == candidate_id), None)

    @staticmethod
    def _email_key(record: dict) -> str:
        return ((record.get("contact_info") or {}).get("email") or "").strip().lower()

    @staticmethod
    def _name_key(record: dict) -> str:
        return (record.get("candidate_name") or "").strip().lower()

    def _find_identity_match(self, profile: dict) -> dict | None:
        email = self._email_key(profile)
        if email:
            match = next(
                (c for c in self._candidates if self._email_key(c) == email), None
            )
            if match:
                return match

        name = self._name_key(profile)
        if not name:
            return None
        # Name fallback: only when emails cannot disagree — a same-name
        # candidate whose email differs from the profile's is someone else.
        return next(
            (
                c
                for c in self._candidates
                if self._name_key(c) == name
                and (not email or not self._email_key(c) or self._email_key(c) == email)
            ),
            None,
        )

    def _load(self):
        if self._path.exists():
            with open(self._path, "r", encoding="utf-8") as f:
                self._candidates = json.load(f)
            return
        self._candidates = self._migrate_legacy()
        if self._candidates:
            logger.info(
                "Migrated %d candidates from legacy files into %s",
                len(self._candidates),
                self._path,
            )
        self._save()

    def _migrate_legacy(self) -> list[dict]:
        """Merge legacy backend/candidates.json and data/processed/*.json.

        The processed files were written on every upload while the legacy
        candidates.json skipped re-uploads, so processed data wins when the
        same candidate exists in both."""
        by_name: dict[str, dict] = {}

        if config.LEGACY_CANDIDATES_FILE.exists():
            try:
                with open(config.LEGACY_CANDIDATES_FILE, "r", encoding="utf-8") as f:
                    for record in json.load(f):
                        name = (record.get("candidate_name") or "").strip().lower()
                        if name:
                            by_name[name] = record
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning("Skipping legacy candidates.json: %s", exc)

        if config.LEGACY_PROCESSED_DIR.exists():
            for file_path in sorted(config.LEGACY_PROCESSED_DIR.glob("*.json")):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        record = json.load(f)
                except (json.JSONDecodeError, OSError) as exc:
                    logger.warning("Skipping %s: %s", file_path.name, exc)
                    continue
                name = (record.get("candidate_name") or "").strip().lower()
                if not name:
                    continue
                merged = {**by_name.get(name, {}), **record}
                by_name[name] = merged

        migrated = []
        for record in by_name.values():
            candidate = {**DEFAULT_METADATA, **record}
            candidate["id"] = uuid.uuid4().hex[:12]
            candidate.setdefault("created_at", record.get("created_date") or _now())
            candidate["updated_at"] = record.get("updated_date") or candidate["created_at"]
            candidate.pop("created_date", None)
            candidate.pop("updated_date", None)
            migrated.append(candidate)
        return migrated

    def _save(self):
        """Atomic write: dump to a temp file, then replace."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(".json.tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(self._candidates, f, indent=2, ensure_ascii=False)
        tmp_path.replace(self._path)


store = CandidateStore(config.CANDIDATES_FILE)
