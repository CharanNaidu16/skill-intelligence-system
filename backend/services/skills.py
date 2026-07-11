"""Canonical skill names and matching.

Matching is done on canonical forms, never by substring, so a requirement
of "Java" does not match a candidate who only knows "JavaScript"."""

SKILL_ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express",
    "expressjs": "Express",
    "express.js": "Express",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "docker": "Docker",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "html5": "HTML",
    "html": "HTML",
    "css3": "CSS",
    "css": "CSS",
    "golang": "Go",
    "go": "Go",
    "c sharp": "C#",
    "csharp": "C#",
    "dotnet": ".NET",
    ".net": ".NET",
    "sql": "SQL",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
}


def canonical(name: str) -> str:
    """Canonical display form of a skill name."""
    cleaned = " ".join(str(name).split())
    return SKILL_ALIASES.get(cleaned.lower(), cleaned)


def match_key(name: str) -> str:
    """Case-insensitive key used to compare two skills for equality."""
    return canonical(name).lower()


def normalize_technical_skills(skills: list) -> list:
    """Canonicalize skill names in an extracted profile, dropping duplicates."""
    seen = set()
    normalized = []
    for entry in skills or []:
        if not isinstance(entry, dict) or not entry.get("skill"):
            continue
        entry = dict(entry)
        entry["skill"] = canonical(entry["skill"])
        key = entry["skill"].lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(entry)
    return normalized
