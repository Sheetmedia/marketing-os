"""In-process vector search for the Knowledge Brain.

No vector database — at this project's scale (per-client chunk counts in
the hundreds/low thousands) a brute-force cosine similarity scan in Python
is simpler to run and reason about than standing up pgvector/sqlite-vec.
Revisit only if a single client's chunk count grows large enough that this
becomes a measured bottleneck.
"""

from typing import Any, List, Sequence, Tuple

import numpy as np


def rank_chunks_by_similarity(
    query_embedding: Sequence[float],
    chunks: List[Any],
    *,
    top_k: int = 5,
) -> List[Tuple[Any, float]]:
    """Return the top_k (chunk, score) pairs sorted by cosine similarity, descending.

    `chunks` are objects with an `.embedding` attribute (list[float] or None).
    Chunks with no embedding yet (e.g. embedding failed at ingest time) are skipped.
    """
    query_vec = np.array(query_embedding, dtype=np.float32)
    query_norm = np.linalg.norm(query_vec)
    if query_norm == 0:
        return []

    scored: List[Tuple[Any, float]] = []
    for chunk in chunks:
        if not chunk.embedding:
            continue
        vec = np.array(chunk.embedding, dtype=np.float32)
        if vec.shape != query_vec.shape:
            continue
        vec_norm = np.linalg.norm(vec)
        if vec_norm == 0:
            continue
        score = float(np.dot(query_vec, vec) / (query_norm * vec_norm))
        scored.append((chunk, score))

    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_k]
