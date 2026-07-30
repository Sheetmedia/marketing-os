from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from core.config import settings
from ..base import AIProviderAdapter, AIResponse


class OpenAIAdapter(AIProviderAdapter):
    name = "openai"
    supports_embeddings = True
    default_embedding_model = "text-embedding-3-small"

    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    @property
    def is_configured(self) -> bool:
        return bool(settings.OPENAI_API_KEY)

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False,
        model: Optional[str] = None,
    ) -> AIResponse:
        if not self._client:
            raise RuntimeError("OpenAI provider is not configured (OPENAI_API_KEY missing).")

        kwargs: Dict[str, Any] = {}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = await self._client.chat.completions.create(
            model=model or settings.OPENAI_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        usage = response.usage
        return AIResponse(
            content=response.choices[0].message.content or "",
            provider=self.name,
            model=response.model,
            prompt_tokens=usage.prompt_tokens if usage else 0,
            completion_tokens=usage.completion_tokens if usage else 0,
            total_tokens=usage.total_tokens if usage else 0,
        )

    async def embed(self, texts: List[str], *, model: Optional[str] = None) -> List[List[float]]:
        if not self._client:
            raise RuntimeError("OpenAI provider is not configured (OPENAI_API_KEY missing).")
        response = await self._client.embeddings.create(
            model=model or self.default_embedding_model,
            input=texts,
        )
        return [item.embedding for item in response.data]
