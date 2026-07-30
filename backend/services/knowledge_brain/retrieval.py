"""High-level retrieval helper for callers (Content Studio, AI Assistant)
that want to augment a prompt with a client's knowledge base, without
themselves depending on the AI Gateway's embedding API or the chunking
internals.

Failures here are swallowed and logged rather than raised — knowledge
augmentation is an enhancement to content generation / chat, not a
prerequisite. If retrieval fails (no embedding provider configured, API
error, empty knowledge base), the caller should proceed without it.
"""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from services import crud
from services.ai_gateway import ai_gateway
from .search import rank_chunks_by_similarity

logger = logging.getLogger(__name__)


async def get_relevant_context(
    db: AsyncSession, client_id: str, query: str, *, top_k: int = 3
) -> Optional[str]:
    """Return a formatted block of the client's most relevant knowledge base
    chunks for `query`, or None if there's nothing to add (empty knowledge
    base, no embedding provider configured, or a retrieval error)."""
    try:
        chunks = await crud.list_knowledge_chunks(db, client_id=client_id)
        if not chunks:
            return None

        [query_embedding], _provider = await ai_gateway.embed([query])
        ranked = rank_chunks_by_similarity(query_embedding, chunks, top_k=top_k)
        if not ranked:
            return None

        parts = [chunk.content for chunk, _score in ranked]
        return "\n\n---\n\n".join(parts)
    except Exception as exc:
        logger.warning("Knowledge retrieval skipped for client %s: %s", client_id, exc)
        return None
