from typing import Any, Dict, List, Optional

from anthropic import AsyncAnthropic

from core.config import settings
from ..base import AIProviderAdapter, AIResponse


class AnthropicAdapter(AIProviderAdapter):
    name = "anthropic"

    def __init__(self):
        self._client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    @property
    def is_configured(self) -> bool:
        return bool(settings.ANTHROPIC_API_KEY)

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
            raise RuntimeError("Anthropic provider is not configured (ANTHROPIC_API_KEY missing).")

        system_prompt: Optional[str] = None
        chat_messages: List[Dict[str, Any]] = []
        for m in messages:
            if m.get("role") == "system":
                system_prompt = f"{system_prompt}\n\n{m['content']}" if system_prompt else m["content"]
            else:
                chat_messages.append(m)

        if json_mode:
            suffix = "Respond with ONLY valid JSON. No markdown code fences, no explanation, no preamble."
            system_prompt = f"{system_prompt}\n\n{suffix}" if system_prompt else suffix

        # Current-generation models (Opus 5, Sonnet 5) reject non-default
        # temperature/top_p/top_k with a 400 — omit it rather than forward it.
        response = await self._client.messages.create(
            model=model or settings.ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=chat_messages,
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        usage = response.usage
        return AIResponse(
            content=text,
            provider=self.name,
            model=response.model,
            prompt_tokens=usage.input_tokens if usage else 0,
            completion_tokens=usage.output_tokens if usage else 0,
            total_tokens=(usage.input_tokens + usage.output_tokens) if usage else 0,
        )
