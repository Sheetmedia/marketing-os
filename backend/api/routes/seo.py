from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user
from core.deps import get_owned_client
from services import crud
from services.ai_gateway import ai_gateway, NoProviderConfiguredError
from services.ai_gateway.gateway import parse_json_response
from services.seo_crawler import SEOCrawlerService
from api.utils import model_to_dict
from models.client import Client
from typing import Optional
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()

FALLBACK_RECOMMENDATIONS = [
    "Optimize images to WebP format to improve page load speed",
    "Add meta descriptions to pages missing them",
    "Fix broken internal links",
    "Implement lazy loading for below-fold images",
    "Add structured data markup for rich results",
]

# Real crawler issue severities -> the app's existing critical/warning/info vocabulary
_SEVERITY_MAP = {"high": "critical", "medium": "warning", "low": "info"}


def _humanize(issue_type: str) -> str:
    return issue_type.replace("_", " ").title()


@router.post("/{client_id}/audit", status_code=status.HTTP_202_ACCEPTED)
async def trigger_seo_audit(
    client_id: str,
    url: Optional[str] = None,
    crawl_depth: int = 3,
    client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a new SEO audit: real crawl + Core Web Vitals + mobile check."""
    domain = url or (client.domain if client else "unknown")
    target_url = domain if domain.startswith(("http://", "https://")) else f"https://{domain}"
    # Cap crawl depth — an uncapped BFS crawl against a large real site
    # could run for a very long time / hammer the target domain.
    crawl_depth = max(1, min(crawl_depth, 3))

    crawler = SEOCrawlerService()
    try:
        crawl_data = await crawler.crawl_website(target_url, depth=crawl_depth)
        web_vitals = await crawler.analyze_core_web_vitals(target_url)
        mobile_data = await crawler.check_mobile_seo(target_url)
    finally:
        await crawler.close()

    audit_data = {**crawl_data, "core_web_vitals": web_vitals, "mobile_seo": mobile_data}
    health_report = await crawler.generate_health_report(audit_data)
    category_scores = health_report["scores"]["category_scores"]

    vitals_ok = "error" not in web_vitals
    overall = round(health_report["summary"]["overall_score"])
    perf = round(web_vitals["performance_score"] * 100) if vitals_ok and web_vitals.get("performance_score") is not None else category_scores["performance"]
    seo = round(web_vitals["seo_score"] * 100) if vitals_ok and web_vitals.get("seo_score") is not None else category_scores["on_page"]
    access = round(web_vitals["accessibility_score"] * 100) if vitals_ok and web_vitals.get("accessibility_score") is not None else category_scores["mobile"]
    best = category_scores["technical"]

    cwv = web_vitals.get("core_web_vitals", {})
    lcp_ms = cwv.get("largest_contentful_paint_ms")
    fid_ms = cwv.get("first_input_delay_ms")
    cls_val = cwv.get("cumulative_layout_shift")

    raw_issues = crawl_data.get("issues", [])
    results = {
        "domain": domain,
        "data_source": "real" if vitals_ok else "real_crawl_pagespeed_unavailable",
        "pages_crawled": crawl_data.get("pages_crawled", 0),
        "core_web_vitals": {
            "lcp": {"value": round(lcp_ms / 1000, 1) if lcp_ms else None, "unit": "s"},
            "fid": {"value": fid_ms, "unit": "ms"},
            "cls": {"value": cls_val},
        },
        "broken_links": sum(1 for i in raw_issues if i.get("type") == "crawl_error"),
        "redirect_chains": 0,
        "missing_meta": sum(1 for i in raw_issues if i.get("type") == "missing_meta_description"),
        "missing_alt_text": sum(1 for i in raw_issues if i.get("type") == "images_missing_alt"),
    }

    issues_data = [
        (
            _humanize(issue.get("type", "issue")),
            _SEVERITY_MAP.get(issue.get("severity"), "info"),
            _humanize(issue.get("type", "issue")),
            issue.get("message", ""),
            issue.get("url", target_url),
            crawler._get_recommendation(issue.get("type", "")),
        )
        for issue in raw_issues[:20]
    ]

    # Real AI-generated recommendations, tailored to the audit's actual
    # scores and issues — falls back to a generic list if no provider is
    # configured, rather than failing the whole audit.
    recommendations = FALLBACK_RECOMMENDATIONS
    try:
        issues_summary = "\n".join(f"- [{sev}] {cat}: {title} — {desc}" for cat, sev, title, desc, _, _ in issues_data)
        ai_response = await ai_gateway.chat(
            messages=[
                {"role": "system", "content": (
                    "You are a senior technical SEO consultant. Respond with valid JSON only."
                )},
                {"role": "user", "content": (
                    f"Site: {domain}, industry: {client.industry or 'general'}\n"
                    f"Scores — overall: {overall}, performance: {perf}, SEO: {seo}, "
                    f"accessibility: {access}, best practices: {best}\n"
                    f"Core Web Vitals: LCP {results['core_web_vitals']['lcp']['value']}s, "
                    f"FID {results['core_web_vitals']['fid']['value']}ms, "
                    f"CLS {results['core_web_vitals']['cls']['value']}\n"
                    f"Issues found:\n{issues_summary}\n\n"
                    "Provide 5 prioritized, specific, actionable recommendations for this site "
                    "based on the above. Return JSON with key 'recommendations' (array of strings)."
                )},
            ],
            temperature=0.4,
            max_tokens=800,
            json_mode=True,
        )
        parsed = parse_json_response(ai_response.content)
        recommendations = parsed.get("recommendations") or FALLBACK_RECOMMENDATIONS
    except NoProviderConfiguredError:
        logger.info("No AI provider configured; using fallback SEO recommendations for client %s", client_id)
    except Exception as exc:
        logger.warning("AI recommendation generation failed for client %s, using fallback: %s", client_id, exc)

    audit = await crud.create_seo_audit(
        db,
        client_id=client_id,
        audit_type="full",
        overall_score=overall,
        performance_score=perf,
        seo_score=seo,
        accessibility_score=access,
        best_practices_score=best,
        status="completed",
        results=results,
        recommendations=recommendations,
    )

    # Create technical issues for this audit
    from models.seo import TechnicalSEOIssue
    for cat, sev, title, desc, page_url, rec in issues_data:
        issue = TechnicalSEOIssue(
            id=uuid.uuid4(),
            audit_id=audit.id,
            issue_type=cat,
            severity=sev,
            page_url=page_url,
            description=f"{title}: {desc}",
            recommendation=rec,
        )
        db.add(issue)
    await db.flush()
    await db.commit()

    audit_data = model_to_dict(audit)
    return {
        "id": audit_data["id"],
        "audit_id": audit_data["id"],
        "client_id": audit_data["client_id"],
        "overall_score": audit_data.get("overall_score"),
        "status": "completed",
        "message": f"SEO audit completed for {domain}. Score: {overall}/100",
    }


@router.get("/{client_id}/audits")
async def list_audits(
    client_id: str,
    skip: int = 0,
    limit: int = 10,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """List all SEO audits for a client."""
    audits, total = await crud.list_seo_audits(
        db, client_id=client_id, skip=skip, limit=limit
    )
    return {
        "audits": [model_to_dict(a) for a in audits],
        "total": total,
    }


@router.get("/{client_id}/audits/{audit_id}")
async def get_audit_details(
    client_id: str,
    audit_id: str,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed SEO audit results."""
    audit = await crud.get_seo_audit(db, audit_id=audit_id)
    if not audit or str(audit.client_id) != client_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit not found",
        )
    return model_to_dict(audit)


@router.get("/{client_id}/metrics")
async def get_seo_metrics(
    client_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get SEO metrics over time."""
    metrics = await crud.get_seo_metrics(
        db, client_id=client_id, date_from=date_from, date_to=date_to
    )
    if not metrics:
        return {
            "client_id": client_id,
            "current": {
                "organic_traffic": 0,
                "domain_authority": 0,
                "backlinks_count": 0,
                "referring_domains": 0,
                "avg_position": 0,
                "impressions": 0,
                "clicks": 0,
                "ctr": 0,
            },
            "history": [],
        }
    return metrics


@router.get("/{client_id}/technical-issues")
async def get_technical_issues(
    client_id: str,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    _client: Client = Depends(get_owned_client),
    db: AsyncSession = Depends(get_db),
):
    """Get technical SEO issues."""
    issues = await crud.get_technical_issues(
        db, client_id=client_id, severity=severity, category=category
    )
    issue_list = [model_to_dict(i) if hasattr(i, '__table__') else i for i in issues]
    return {"issues": issue_list, "total": len(issue_list)}
