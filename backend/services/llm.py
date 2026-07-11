"""Provider-agnostic chat-completion client.

Detects the configured provider from environment variables in this order:
Groq -> Azure OpenAI -> OpenAI. All three speak the OpenAI chat API, so the
rest of the codebase only ever calls `complete_json()`.
"""

import json
import logging

from openai import AzureOpenAI, OpenAI

import config

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

_MISSING_KEY_MESSAGE = (
    "No LLM provider configured. Set GROQ_API_KEY (or AZURE_OPENAI_* / "
    "OPENAI_API_KEY) in backend/.env and restart the server."
)


class LLMNotConfiguredError(RuntimeError):
    pass


class LLMClient:
    def __init__(self):
        if config.GROQ_API_KEY:
            self.provider = "groq"
            self.model = config.GROQ_MODEL
            self.client = OpenAI(api_key=config.GROQ_API_KEY, base_url=GROQ_BASE_URL)
        elif config.AZURE_OPENAI_API_KEY:
            self.provider = "azure"
            self.model = config.AZURE_OPENAI_DEPLOYMENT_NAME
            self.client = AzureOpenAI(
                api_key=config.AZURE_OPENAI_API_KEY,
                api_version=config.AZURE_OPENAI_API_VERSION,
                azure_endpoint=config.AZURE_OPENAI_ENDPOINT,
            )
        elif config.OPENAI_API_KEY:
            self.provider = "openai"
            self.model = config.OPENAI_MODEL
            self.client = OpenAI(api_key=config.OPENAI_API_KEY)
        else:
            raise LLMNotConfiguredError(_MISSING_KEY_MESSAGE)
        logger.info("LLM provider: %s (model=%s)", self.provider, self.model)

    def complete_json(self, system: str, user: str, max_tokens: int = 2000) -> dict:
        """Run a chat completion that must return a JSON object."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or ""
        return json.loads(_strip_code_fences(content))


def _strip_code_fences(content: str) -> str:
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```", 2)[1]
        if content.startswith("json"):
            content = content[4:]
    return content.strip()


_client: LLMClient | None = None


def get_client() -> LLMClient:
    """Lazily create the shared client so the API can start (and non-LLM
    endpoints keep working) even before a key is configured."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
