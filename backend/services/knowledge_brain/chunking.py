"""Plain-text chunking for the Knowledge Brain.

Splits on paragraph boundaries first, packing paragraphs into chunks up to
`chunk_size` characters; a paragraph longer than `chunk_size` is hard-split
with a small overlap so no sentence context is lost at the cut point.
"""

import re
from typing import List

_PARAGRAPH_RE = re.compile(r"\n\s*\n")


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in _PARAGRAPH_RE.split(text) if p.strip()]
    chunks: List[str] = []
    current = ""

    def flush():
        nonlocal current
        if current:
            chunks.append(current)
            current = ""

    for para in paragraphs:
        if len(para) > chunk_size:
            flush()
            step = max(chunk_size - overlap, 1)
            for i in range(0, len(para), step):
                chunks.append(para[i:i + chunk_size])
            continue

        candidate = f"{current}\n\n{para}" if current else para
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            flush()
            current = para

    flush()
    return chunks
