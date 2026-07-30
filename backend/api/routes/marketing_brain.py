from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.deps import get_owned_client
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.ai_gateway.gateway import parse_json_response
from services.knowledge_brain import get_relevant_context
from services.marketing_brain import gather_client_snapshot
from api.utils import model_to_dict
from models.client import Client
from typing import Optional
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

MARKETING_STRATEGIST_SYSTEM_PROMPT = (
    "You are a senior fractional CMO advising a digital marketing agency on one of its "
    "clients. You are given real, current cross-channel performance data (SEO, content, "
    "backlinks, campaigns, ads, social, competitors) for that client. Analyze it holistically "
    "and produce a strategic assessment. Be specific, prioritize by impact, and base every "
    "claim strictly on the data provided — never invent metrics that aren't in the input. "
    "Respond with valid JSON only."
)


def _build_user_prompt(snapshot: dict, knowledge_context: Optional[str]) -> str:
    prompt = (
        "Here is the current cross-channel data snapshot for this client:\n\n"
        f"{json.dumps(snapshot, indent=2, default=str)}\n\n"
    )
    if knowledge_context:
        prompt += f"Relevant brand/business knowledge:\n{knowledge_context}\n\n"
    prompt += (
        "Return JSON with these exact keys:\n"
        "- 'situation_summary': 2-4 sentence honest summary of where this client stands right now.\n"
        "- 'diagnosed_issues': array of {\"category\", \"severity\" (low/medium/high/critical), \"description\"}.\n"
        "- 'opportunities': array of {\"title\", \"description\", \"estimated_impact\", \"priority\" (low/medium/high)}.\n"
        "- 'channel_recommendations': array of {\"channel\", \"action\", \"priority\" (low/medium/high)}.\n"
        "- 'budget_allocation': object mapping channel name -> recommended percentage of budget (integers summing to ~100), "
        "based on where the data shows the best current opportunity, e.g. {\"seo\": 35, \"content\": 20, \"ads\": 25, \"social\": 20}.\n"
        "- 'kpi_forecast': object of 2-4 key metrics with a realistic short-term (90 day) target, e.g. "
        "{\"organic_traffic\": \"+15% in 90 days\"}.\n"
    )
    return prompt


@router.post("/{client_id}/marketing-brain/generate")
async def generate_strategy(
    client_id: str,
    client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate this client's real cross-engine data and have the AI Gateway produce a strategic assessment."""
    snapshot = await gather_client_snapshot(db, client)
    knowledge_context = await get_relevant_context(
        db, client_id, f"marketing strategy goals {client.marketing_goals or ''}".strip()
    )
    user_prompt = _build_user_prompt(snapshot, knowledge_context)

    try:
        ai_response = await ai_gateway.chat(
            messages=[
                {"role": "system", "content": MARKETING_STRATEGIST_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=3000,
            json_mode=True,
        )
        generated = parse_json_response(ai_response.content)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("Marketing Brain generation failed for client %s: %s", client_id, exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Strategy generation failed: {exc}")

    strategy = await crud.create_marketing_strategy(
        db,
        client_id=client_id,
        situation_summary=generated.get("situation_summary"),
        diagnosed_issues=generated.get("diagnosed_issues"),
        opportunities=generated.get("opportunities"),
        channel_recommendations=generated.get("channel_recommendations"),
        budget_allocation=generated.get("budget_allocation"),
        kpi_forecast=generated.get("kpi_forecast"),
        snapshot=snapshot,
        ai_model_used=f"{ai_response.provider}:{ai_response.model}",
        status="completed",
    )
    return model_to_dict(strategy)


@router.get("/{client_id}/marketing-brain/strategies")
async def list_strategies(
    client_id: str,
    skip: int = 0,
    limit: int = 20,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List past strategy reports for a client, most recent first."""
    strategies, total = await crud.list_marketing_strategies(db, client_id=client_id, skip=skip, limit=limit)
    return {"strategies": [model_to_dict(s) for s in strategies], "total": total}


@router.get("/{client_id}/marketing-brain/latest")
async def get_latest_strategy(
    client_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recently generated strategy report for a client."""
    strategy = await crud.get_latest_marketing_strategy(db, client_id=client_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No strategy generated yet")
    return model_to_dict(strategy)


@router.get("/{client_id}/marketing-brain/strategies/{strategy_id}")
async def get_strategy(
    client_id: str,
    strategy_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific strategy report."""
    strategy = await crud.get_marketing_strategy(db, client_id=client_id, strategy_id=strategy_id)
    if not strategy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return model_to_dict(strategy)
