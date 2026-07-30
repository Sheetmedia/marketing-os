from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from core.config import settings
from ..base import AIProviderAdapter, AIResponse


class GeminiAdapter(AIProviderAdapter):
    name = "gemini"
    supports_embeddings = True
    default_embedding_model = "text-embedding-004"

    def __init__(self):
        self._client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

    @property
    def is_configured(self) -> bool:
        return bool(settings.GEMINI_API_KEY)

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
            raise RuntimeError("Gemini provider is not configured (GEMINI_API_KEY missing).")

        system_instruction: Optional[str] = None
        contents: List[types.Content] = []
        for m in messages:
            if m.get("role") == "system":
                system_instruction = (
                    f"{system_instruction}\n\n{m['content']}" if system_instruction else m["content"]
                )
            else:
                role = "model" if m.get("role") == "assistant" else "user"
                contents.append(types.Content(role=role, parts=[types.Part(text=m["content"])]))

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_mime_type="application/json" if json_mode else None,
        )

        target_model = model or settings.GEMINI_MODEL
        response = await self._client.aio.models.generate_content(
            model=target_model,
            contents=contents,
            config=config,
        )
        usage = response.usage_metadata
        return AIResponse(
            content=response.text or "",
            provider=self.name,
            model=target_model,
            prompt_tokens=getattr(usage, "prompt_token_count", 0) or 0,
            completion_tokens=getattr(usage, "candidates_token_count", 0) or 0,
            total_tokens=getattr(usage, "total_token_count", 0) or 0,
        )

    async def embed(self, texts: List[str], *, model: Optional[str] = None) -> List[List[float]]:
        if not self._client:
            raise RuntimeError("Gemini provider is not configured (GEMINI_API_KEY missing).")
        response = await self._client.aio.models.embed_content(
            model=model or self.default_embedding_model,
            contents=texts,
        )
        return [emb.values for emb in response.embeddings]
