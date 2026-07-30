"""
AI Provider Gateway.

Routes chat requests to whichever configured provider is highest-priority,
falling back to the next configured provider on failure. Callers depend only
on this module — never on a specific provider's SDK — so switching or adding
a provider never touches route code.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from core.config import settings
from .base import AIProviderAdapter, AIResponse
from .adapters.openai_adapter import OpenAIAdapter
from .adapters.anthropic_adapter import AnthropicAdapter
from .adapters.gemini_adapter import GeminiAdapter
from .adapters.groq_adapter import GroqAdapter

logger = logging.getLogger(__name__)


class NoProviderConfiguredError(RuntimeError):
    """Raised when none of the configured-priority providers have an API key set."""


class AIGateway:
    def __init__(self):
        self._adapters: Dict[str, AIProviderAdapter] = {
            "openai": OpenAIAdapter(),
            "anthropic": AnthropicAdapter(),
            "gemini": GeminiAdapter(),
            "groq": GroqAdapter(),
        }
        self._priority = [p.strip() for p in settings.AI_PROVIDER_PRIORITY.split(",") if p.strip()]

    @property
    def configured_providers(self) -> List[str]:
        return [name for name, adapter in self._adapters.items() if adapter.is_configured]

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False,
        model: Optional[str] = None,
        preferred_provider: Optional[str] = None,
    ) -> AIResponse:
        """Send a chat request, trying providers in priority order with fallback."""
        order = []
        if preferred_provider and preferred_provider in self._adapters:
            order.append(preferred_provider)
        order += [p for p in self._priority if p not in order]

        configured = [p for p in order if p in self._adapters and self._adapters[p].is_configured]
        if not configured:
            raise NoProviderConfiguredError(
                "No AI provider is configured. Set at least one of OPENAI_API_KEY, "
                "ANTHROPIC_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in backend/.env."
            )

        last_error: Optional[Exception] = None
        for provider_name in configured:
            adapter = self._adapters[provider_name]
            try:
                return await adapter.chat(
                    messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    json_mode=json_mode,
                    model=model if provider_name == preferred_provider else None,
                )
            except Exception as exc:
                logger.warning("AI provider '%s' failed, trying next: %s", provider_name, exc)
                last_error = exc
                continue

        raise RuntimeError(f"All configured AI providers failed. Last error: {last_error}") from last_error

    async def embed(
        self,
        texts: List[str],
        *,
        model: Optional[str] = None,
        preferred_provider: Optional[str] = None,
    ) -> Tuple[List[List[float]], str]:
        """Embed a batch of texts, trying embedding-capable providers in priority order.

        Returns (vectors, provider_name_used) — callers that persist embeddings need
        to know which provider produced them (different providers => different vector
        spaces, so mixing them in one similarity search silently produces garbage).
        """
        embedding_capable = [name for name, adapter in self._adapters.items() if adapter.supports_embeddings]

        order = []
        if preferred_provider in embedding_capable:
            order.append(preferred_provider)
        order += [p for p in self._priority if p in embedding_capable and p not in order]

        configured = [p for p in order if self._adapters[p].is_configured]
        if not configured:
            raise NoProviderConfiguredError(
                "No embedding-capable AI provider is configured. Set OPENAI_API_KEY or "
                "GEMINI_API_KEY in backend/.env (Anthropic and Groq don't offer embeddings)."
            )

        last_error: Optional[Exception] = None
        for provider_name in configured:
            try:
                vectors = await self._adapters[provider_name].embed(
                    texts, model=model if provider_name == preferred_provider else None
                )
                return vectors, provider_name
            except Exception as exc:
                logger.warning("Embedding provider '%s' failed, trying next: %s", provider_name, exc)
                last_error = exc
                continue

        raise RuntimeError(f"All configured embedding providers failed. Last error: {last_error}") from last_error


_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def parse_json_response(content: str) -> Any:
    """Parse a JSON-mode AI response, tolerating markdown code fences some models add."""
    cleaned = _JSON_FENCE_RE.sub("", content).strip()
    return json.loads(cleaned)


ai_gateway = AIGateway()
