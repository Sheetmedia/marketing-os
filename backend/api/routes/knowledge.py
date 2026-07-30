from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.deps import get_owned_client
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.knowledge_brain import chunk_text, rank_chunks_by_similarity
from api.utils import model_to_dict
from models.client import Client
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{client_id}/knowledge/documents")
async def list_documents(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List knowledge documents for a client."""
    documents, total = await crud.list_knowledge_documents(db, client_id=client_id, skip=skip, limit=limit)
    return {"documents": [model_to_dict(d) for d in documents], "total": total}


@router.post("/{client_id}/knowledge/documents", status_code=status.HTTP_201_CREATED)
async def create_document(
    client_id: str,
    title: str,
    content: str = Body(...),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Add a document to the client's knowledge base: chunk it, embed each chunk, and store."""
    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    chunks = chunk_text(content)
    if not chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No content to index after chunking")

    try:
        embeddings, provider_used = await ai_gateway.embed(chunks)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Embedding failed for client %s: %s", client_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Embedding generation failed: {exc}")

    document = await crud.create_knowledge_document(db, client_id=client_id, title=title, content=content)
    await crud.create_knowledge_chunks(
        db,
        document_id=str(document.id),
        client_id=client_id,
        chunks=chunks,
        embeddings=embeddings,
        embedding_provider=provider_used,
    )
    document.chunk_count = len(chunks)
    await db.flush()
    await db.refresh(document)
    return model_to_dict(document)


@router.get("/{client_id}/knowledge/documents/{document_id}")
async def get_document(
    client_id: str,
    document_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get a knowledge document's full content."""
    document = await crud.get_knowledge_document(db, client_id=client_id, document_id=document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return model_to_dict(document)


@router.delete("/{client_id}/knowledge/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    client_id: str,
    document_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Delete a knowledge document and its chunks."""
    deleted = await crud.delete_knowledge_document(db, client_id=client_id, document_id=document_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return None


@router.post("/{client_id}/knowledge/search")
async def search_knowledge(
    client_id: str,
    query: str = Body(..., embed=True),
    top_k: int = Body(default=5, embed=True),
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Semantic search over a client's knowledge base."""
    all_chunks = await crud.list_knowledge_chunks(db, client_id=client_id)
    if not all_chunks:
        return {"query": query, "results": []}

    try:
        [query_embedding], _provider = await ai_gateway.embed([query])
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Knowledge search embedding failed for client %s: %s", client_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Search failed: {exc}")

    ranked = rank_chunks_by_similarity(query_embedding, all_chunks, top_k=top_k)
    return {
        "query": query,
        "results": [
            {
                "chunk_id": str(chunk.id),
                "document_id": str(chunk.document_id),
                "content": chunk.content,
                "score": round(score, 4),
            }
            for chunk, score in ranked
        ],
    }
