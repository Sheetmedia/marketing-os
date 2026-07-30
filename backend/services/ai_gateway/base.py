"""
AI Gateway base types.

Defines the common response shape and adapter interface every provider
implements, so callers never depend on a specific provider's SDK types.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AIResponse:
    """Normalized response from any AI provider."""

    content: str
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class AIProviderAdapter(ABC):
    """Common interface every AI provider adapter implements."""

    name: str
    supports_embeddings: bool = False

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Whether this provider has an API key configured."""

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, Any]],
        *,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False,
        model: Optional[str] = None,
    ) -> AIResponse:
        """
        Send a chat-style request to the provider.

        Args:
            messages: List of {"role": "system"|"user"|"assistant", "content": str}.
            temperature: Sampling temperature (ignored by providers that reject it).
            max_tokens: Maximum tokens to generate.
            json_mode: Request the provider constrain output to valid JSON.
            model: Override the provider's configured default model.
        """

    async def embed(self, texts: List[str], *, model: Optional[str] = None) -> List[List[float]]:
        """Embed a batch of texts. Only implemented by providers with an embeddings API."""
        raise NotImplementedError(f"{self.name} does not support embeddings.")
