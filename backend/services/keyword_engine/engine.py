"""
Keyword Engine Service

Provides keyword research, metrics retrieval, and ranking tracking
powered by OpenAI for intelligent keyword suggestions.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from core.config import settings

logger = logging.getLogger(__name__)


class KeywordEngineService:
    """Service for keyword research, metrics analysis, and rank tracking."""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4o")

    async def research_keywords(
        self,
        seed_keywords: List[str],
        location: str = "US",
    ) -> Dict[str, Any]:
        """
        Research and expand a list of seed keywords into a comprehensive
        keyword strategy using AI-powered suggestions.

        Args:
            seed_keywords: List of initial seed keywords.
            location: Target geographic location (ISO country code).

        Returns:
            Dictionary with keyword suggestions, groupings, and insights.
        """
        logger.info(
            "Researching keywords for seeds: %s, location: %s",
            seed_keywords,
            location,
        )

        if not seed_keywords:
            raise ValueError("At least one seed keyword is required.")

        try:
            prompt = (
                f"You are an expert SEO keyword researcher. Given the "
                f"following seed keywords: {', '.join(seed_keywords)}, "
                f"for the market: {location}, generate a comprehensive "
                f"keyword research report.\n\n"
                f"For each seed keyword, provide:\n"
                f"1. 10 related long-tail keyword variations\n"
                f"2. 5 question-based keywords\n"
                f"3. 5 competitor keywords\n"
                f"4. Estimated search intent (informational, navigational, "
                f"commercial, transactional)\n"
                f"5. Suggested content topics\n\n"
                f"Format the response as a structured JSON object with keys: "
                f"'keyword_groups', 'long_tail', 'questions', "
                f"'competitor_keywords', 'content_ideas'."
            )

            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an SEO keyword research expert. "
                            "Respond only with valid JSON."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            import json

            ai_suggestions = json.loads(
                response.choices[0].message.content
            )

            return {
                "seed_keywords": seed_keywords,
                "location": location,
                "suggestions": ai_suggestions,
                "total_keywords_generated": self._count_keywords(
                    ai_suggestions
                ),
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error researching keywords: %s", str(exc), exc_info=True
            )
            raise RuntimeError(
                f"Keyword research failed: {str(exc)}"
            ) from exc

    async def get_keyword_metrics(
        self, keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Retrieve estimated metrics for a list of keywords.

        Uses AI to estimate search volume ranges, keyword difficulty,
        and CPC ranges when live API data is unavailable.

        Args:
            keywords: List of keywords to analyze.

        Returns:
            Dictionary with per-keyword metrics and aggregated stats.
        """
        logger.info("Getting metrics for %d keywords", len(keywords))

        if not keywords:
            raise ValueError("At least one keyword is required.")

        try:
            prompt = (
                f"You are an SEO data analyst. For each of the following "
                f"keywords, estimate realistic SEO metrics based on your "
                f"knowledge:\n\n"
                f"Keywords: {', '.join(keywords)}\n\n"
                f"For each keyword, provide:\n"
                f"- estimated_monthly_search_volume (number)\n"
                f"- keyword_difficulty (0-100 scale)\n"
                f"- estimated_cpc_usd (number)\n"
                f"- competition_level (low/medium/high)\n"
                f"- search_intent (informational/navigational/commercial/"
                f"transactional)\n"
                f"- trend (rising/stable/declining)\n\n"
                f"Return as a JSON object with a 'keywords' array."
            )

            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an SEO metrics analyst. "
                            "Respond only with valid JSON."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )

            import json

            metrics_data = json.loads(
                response.choices[0].message.content
            )

            keyword_metrics = metrics_data.get("keywords", [])

            # Calculate aggregated statistics
            total_volume = sum(
                k.get("estimated_monthly_search_volume", 0)
                for k in keyword_metrics
            )
            avg_difficulty = 0
            if keyword_metrics:
                avg_difficulty = round(
                    sum(
                        k.get("keyword_difficulty", 0)
                        for k in keyword_metrics
                    )
                    / len(keyword_metrics),
                    1,
                )

            return {
                "keywords": keyword_metrics,
                "total_keywords": len(keyword_metrics),
                "aggregated": {
                    "total_estimated_volume": total_volume,
                    "average_difficulty": avg_difficulty,
                    "average_cpc": round(
                        sum(
                            k.get("estimated_cpc_usd", 0)
                            for k in keyword_metrics
                        )
                        / max(len(keyword_metrics), 1),
                        2,
                    ),
                },
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error getting keyword metrics: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Keyword metrics retrieval failed: {str(exc)}"
            ) from exc

    async def track_rankings(
        self, client_id: str, keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Track search engine rankings for specified keywords.

        Args:
            client_id: The client identifier for data association.
            keywords: List of keywords to track rankings for.

        Returns:
            Dictionary with current rankings, changes, and historical data.
        """
        logger.info(
            "Tracking rankings for client %s, %d keywords",
            client_id,
            len(keywords),
        )

        if not client_id:
            raise ValueError("client_id is required.")
        if not keywords:
            raise ValueError("At least one keyword is required.")

        try:
            # In production, this would query a search API or scraping
            # service. Here we generate structured tracking data.
            rankings = []
            for keyword in keywords:
                ranking_entry = {
                    "keyword": keyword,
                    "current_position": None,
                    "previous_position": None,
                    "change": 0,
                    "best_position": None,
                    "url": None,
                    "last_checked": datetime.now(
                        timezone.utc
                    ).isoformat(),
                }
                rankings.append(ranking_entry)

            # Summary statistics
            tracked = [r for r in rankings if r["current_position"]]
            top_10 = [
                r
                for r in tracked
                if r["current_position"] and r["current_position"] <= 10
            ]
            top_3 = [
                r
                for r in tracked
                if r["current_position"] and r["current_position"] <= 3
            ]
            improved = [r for r in tracked if r["change"] > 0]
            declined = [r for r in tracked if r["change"] < 0]

            return {
                "client_id": client_id,
                "total_keywords": len(keywords),
                "rankings": rankings,
                "summary": {
                    "tracked_keywords": len(tracked),
                    "in_top_3": len(top_3),
                    "in_top_10": len(top_10),
                    "improved": len(improved),
                    "declined": len(declined),
                    "not_ranking": len(keywords) - len(tracked),
                },
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as exc:
            logger.error(
                "Error tracking rankings for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Ranking tracking failed: {str(exc)}"
            ) from exc

    @staticmethod
    def _count_keywords(suggestions: Dict[str, Any]) -> int:
        """Count total keywords across all suggestion categories."""
        count = 0
        for value in suggestions.values():
            if isinstance(value, list):
                count += len(value)
            elif isinstance(value, dict):
                for sub_value in value.values():
                    if isinstance(sub_value, list):
                        count += len(sub_value)
        return count
