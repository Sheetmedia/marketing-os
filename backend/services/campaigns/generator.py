"""
AI-assisted campaign planning.

Given a campaign's basic configuration (type, budget, schedule, goals) and
its client's profile, produces a creative brief, audience segmentation, and
a per-channel budget allocation via the AI Gateway. Grounded strictly in the
client/campaign data provided (plus optional knowledge base context) — never
invents facts about the client.
"""

import json
import logging
from typing import Any, Dict, Optional

from models.campaign import Campaign
from models.client import Client
from services.ai_gateway import ai_gateway
from services.ai_gateway.gateway import parse_json_response

logger = logging.getLogger(__name__)

CAMPAIGN_GENERATOR_SYSTEM_PROMPT = (
    "You are a senior campaign strategist at a digital marketing agency. Given a client's "
    "profile and a campaign's configuration (type, budget, schedule, goals), produce a "
    "creative brief, audience segmentation, and a per-channel budget allocation. Be specific "
    "and actionable, and base every recommendation strictly on the campaign type, budget, and "
    "goals given — never invent facts about the client that weren't provided. Respond with "
    "valid JSON only."
)


def _build_prompt(client: Client, campaign: Campaign, knowledge_context: Optional[str]) -> str:
    context = {
        "client": {
            "name": client.name,
            "industry": client.industry,
            "domain": client.domain,
            "marketing_goals": client.marketing_goals,
        },
        "campaign": {
            "name": campaign.name,
            "type": campaign.campaign_type,
            "budget": campaign.budget,
            "start_date": campaign.start_date.isoformat() if campaign.start_date else None,
            "end_date": campaign.end_date.isoformat() if campaign.end_date else None,
            "goals": campaign.goals,
            "existing_channels": campaign.channels,
        },
    }
    prompt = (
        "Here is the client and campaign context:\n\n"
        f"{json.dumps(context, indent=2, default=str)}\n\n"
    )
    if knowledge_context:
        prompt += f"Relevant brand/business knowledge:\n{knowledge_context}\n\n"
    prompt += (
        "Return JSON with these exact keys:\n"
        "- 'brief': a creative brief string (3-6 sentences) covering the campaign's core "
        "message, positioning, and tone.\n"
        "- 'audience_segments': array of {\"name\", \"description\", \"demographics\", "
        "\"pain_points\"}, 2-4 segments most relevant to this campaign.\n"
        "- 'budget_allocation': object mapping channel name -> recommended percentage of the "
        "campaign budget (integers summing to ~100), chosen to fit the campaign's type and "
        "goals, e.g. {\"seo\": 30, \"social\": 40, \"ads\": 30}.\n"
        "- 'channels': array of channel name strings covered by budget_allocation.\n"
    )
    return prompt


async def generate_campaign_plan(
    client: Client, campaign: Campaign, knowledge_context: Optional[str] = None
) -> Dict[str, Any]:
    """Call the AI Gateway to produce a brief, audience segments, and a budget split
    for a campaign. Raises NoProviderConfiguredError / RuntimeError on failure — the
    caller decides how to surface that (this function does not swallow errors, unlike
    knowledge retrieval which is a best-effort enhancement)."""
    user_prompt = _build_prompt(client, campaign, knowledge_context)
    ai_response = await ai_gateway.chat(
        messages=[
            {"role": "system", "content": CAMPAIGN_GENERATOR_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.6,
        max_tokens=1500,
        json_mode=True,
    )
    generated = parse_json_response(ai_response.content)
    generated["ai_model_used"] = f"{ai_response.provider}:{ai_response.model}"
    return generated
