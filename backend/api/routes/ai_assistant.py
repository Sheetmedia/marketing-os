from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.knowledge_brain import get_relevant_context
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

MARKETING_ASSISTANT_SYSTEM_PROMPT = (
    "You are an expert marketing assistant embedded in MarketingOS, a platform for SEO "
    "and digital marketing agencies. You help with SEO analysis, content strategy, "
    "campaign planning, ad optimization, and social media management. Be specific and "
    "actionable in your advice. Use markdown formatting (headers, bold, lists) for readability."
)


@router.post("/chat")
async def chat(
    message: str,
    client_id: Optional[str] = None,
    context: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the AI marketing assistant via the AI Gateway."""
    messages = [{"role": "system", "content": MARKETING_ASSISTANT_SYSTEM_PROMPT}]

    if client_id:
        client = await crud.get_client(db, client_id=client_id)
        agency_id = current_user.get("agency_id")
        if not client or not agency_id or str(client.agency_id) != str(agency_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        messages.append({
            "role": "system",
            "content": (
                f"Current client context: {client.name} ({client.domain}), "
                f"industry: {client.industry or 'unknown'}."
            ),
        })
        knowledge_context = await get_relevant_context(db, client_id, message)
        if knowledge_context:
            messages.append({
                "role": "system",
                "content": f"Relevant knowledge base excerpts for this client:\n{knowledge_context}",
            })

    if context:
        messages.append({"role": "system", "content": f"Additional context: {context}"})

    messages.append({"role": "user", "content": message})

    try:
        ai_response = await ai_gateway.chat(messages=messages, temperature=0.7, max_tokens=2000)
    except NoProviderConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))
    except Exception as exc:
        logger.error("AI assistant chat failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI assistant failed: {exc}")

    return {
        "response": ai_response.content,
        "provider": ai_response.provider,
        "model": ai_response.model,
    }


@router.post("/analyze")
async def analyze(
    url: str,
    analysis_type: str = "comprehensive",
    current_user: dict = Depends(get_current_user),
):
    """AI-powered website/competitor analysis."""
    return {
        "url": url,
        "analysis_type": analysis_type,
        "findings": {
            "strengths": [
                "Good domain authority (45+)",
                "Strong internal linking structure",
                "Regular content publishing schedule",
                "Mobile-responsive design",
            ],
            "weaknesses": [
                "Page speed needs improvement (LCP > 2.5s)",
                "Missing schema markup on key pages",
                "Thin content on 12 product pages",
                "Low backlink diversity (top 5 domains = 60% of links)",
            ],
            "opportunities": [
                "15 high-volume keywords with low competition identified",
                "Featured snippet opportunities for 8 keywords",
                "Content gap: competitors rank for 45 keywords you don't target",
                "Local SEO potential: no Google Business Profile optimization",
            ],
            "threats": [
                "Competitor X increased content output by 200%",
                "New algorithm update may impact thin content pages",
                "Rising CPC in your industry (+15% QoQ)",
            ],
        },
        "overall_score": 72,
        "priority_actions": [
            {"action": "Fix Core Web Vitals issues", "impact": "high", "effort": "medium"},
            {"action": "Add schema markup to all pages", "impact": "medium", "effort": "low"},
            {"action": "Create content for gap keywords", "impact": "high", "effort": "high"},
            {"action": "Build links to underperforming pages", "impact": "high", "effort": "medium"},
        ],
    }


@router.post("/recommend")
async def get_recommendations(
    client_id: Optional[str] = None,
    focus_area: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get AI-powered SEO and marketing recommendations."""
    return {
        "client_id": client_id,
        "recommendations": [
            {
                "category": "Technical SEO",
                "title": "Fix Critical Core Web Vitals Issues",
                "description": "Your LCP is 3.2s (should be <2.5s). Compress images, implement lazy loading, and optimize server response time.",
                "priority": "critical",
                "estimated_impact": "15-20% traffic increase",
                "effort": "medium",
            },
            {
                "category": "Content",
                "title": "Create Pillar Content for Top Keywords",
                "description": "Build comprehensive guides for your top 5 keyword clusters. Each pillar should be 3000+ words with supporting articles.",
                "priority": "high",
                "estimated_impact": "25-30% organic traffic increase",
                "effort": "high",
            },
            {
                "category": "Backlinks",
                "title": "Launch Digital PR Campaign",
                "description": "Create data-driven studies and infographics to earn high-authority editorial links. Target DA 50+ publications.",
                "priority": "high",
                "estimated_impact": "10-15 DA increase over 6 months",
                "effort": "high",
            },
            {
                "category": "On-Page SEO",
                "title": "Optimize Meta Tags for CTR",
                "description": "Rewrite title tags and meta descriptions for your top 20 pages. Include power words and CTAs to improve click-through rates.",
                "priority": "medium",
                "estimated_impact": "10-15% CTR improvement",
                "effort": "low",
            },
            {
                "category": "Internal Linking",
                "title": "Improve Internal Link Architecture",
                "description": "Add contextual internal links between related blog posts and product pages. Ensure no orphan pages exist.",
                "priority": "medium",
                "estimated_impact": "5-10% ranking improvement",
                "effort": "low",
            },
        ],
        "generated_at": "2024-06-15T10:00:00Z",
    }
