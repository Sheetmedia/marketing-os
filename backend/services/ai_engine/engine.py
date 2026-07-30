"""
AI Engine Service

Provides AI-powered SEO recommendations, chat assistance, content
analysis, and meta tag generation using OpenAI.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from core.config import settings

logger = logging.getLogger(__name__)


class AIEngineService:
    """Service for AI-powered SEO analysis and content generation."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4o")

    async def generate_seo_recommendations(
        self,
        website_data: Dict[str, Any],
        keyword_data: Dict[str, Any],
        competitor_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate comprehensive SEO recommendations based on website audit,
        keyword research, and competitor analysis data.

        Args:
            website_data: Crawl and audit results for the target website.
            keyword_data: Keyword research and metrics data.
            competitor_data: Competitor analysis data.

        Returns:
            Dictionary with prioritized SEO recommendations, action items,
            and estimated impact.
        """
        logger.info("Generating SEO recommendations via AI")

        system_prompt = (
            "You are a senior SEO strategist with 15 years of experience. "
            "You provide actionable, data-driven SEO recommendations. "
            "Always prioritize recommendations by potential impact and "
            "ease of implementation. Respond with valid JSON."
        )

        user_prompt = (
            "Based on the following SEO data, provide a comprehensive "
            "set of prioritized recommendations:\n\n"
            f"## Website Audit Data\n"
            f"Pages crawled: {website_data.get('pages_crawled', 'N/A')}\n"
            f"Issues found: {len(website_data.get('issues', []))}\n"
            f"Issue types: {self._summarize_issues(website_data.get('issues', []))}\n\n"
            f"## Keyword Data\n"
            f"Target keywords: {json.dumps(keyword_data.get('seed_keywords', []))}\n"
            f"Keyword metrics summary: {json.dumps(keyword_data.get('aggregated', {}))}\n\n"
            f"## Competitor Data\n"
            f"Competitor insights: {json.dumps(competitor_data, default=str)[:2000]}\n\n"
            "Provide recommendations in these categories:\n"
            "1. Technical SEO fixes (with priority: critical/high/medium/low)\n"
            "2. On-page optimization opportunities\n"
            "3. Content strategy suggestions\n"
            "4. Link building recommendations\n"
            "5. Quick wins (easy to implement, high impact)\n\n"
            "For each recommendation include:\n"
            "- title, description, category, priority, estimated_impact "
            "(1-10), effort_level (1-10), timeline\n\n"
            "Return as JSON with key 'recommendations' (array) and "
            "'summary' (object with overall_health, top_priority, "
            "estimated_improvement_potential)."
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            recommendations = json.loads(
                response.choices[0].message.content
            )

            recommendations["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info(
                "Generated %d SEO recommendations",
                len(recommendations.get("recommendations", [])),
            )
            return recommendations

        except Exception as exc:
            logger.error(
                "Error generating SEO recommendations: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"SEO recommendation generation failed: {str(exc)}"
            ) from exc

    async def chat_assistant(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Provide interactive SEO assistance through a chat interface.

        Args:
            message: The user's question or message.
            context: Optional context about the user's website, current
                     SEO status, or conversation history.

        Returns:
            Dictionary with the assistant's response and any relevant
            suggestions or follow-up questions.
        """
        logger.info("Processing chat assistant message")

        system_prompt = (
            "You are an expert SEO consultant assistant. You help users "
            "understand and improve their website's search engine "
            "optimization. You provide clear, actionable advice and "
            "explain technical concepts in accessible language.\n\n"
            "Guidelines:\n"
            "- Be specific and actionable in your advice\n"
            "- Reference current SEO best practices\n"
            "- When relevant, suggest tools or techniques\n"
            "- Ask clarifying questions when needed\n"
            "- Provide examples where helpful\n"
        )

        if context:
            website_info = context.get("website_url", "")
            seo_score = context.get("seo_score", "")
            if website_info:
                system_prompt += (
                    f"\nUser's website: {website_info}\n"
                )
            if seo_score:
                system_prompt += (
                    f"Current SEO score: {seo_score}\n"
                )

        messages = [{"role": "system", "content": system_prompt}]

        # Include conversation history if provided
        history = (context or {}).get("history", [])
        for entry in history[-10:]:  # Limit to last 10 messages
            messages.append(
                {
                    "role": entry.get("role", "user"),
                    "content": entry.get("content", ""),
                }
            )

        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
            )

            assistant_message = response.choices[0].message.content

            return {
                "response": assistant_message,
                "tokens_used": {
                    "prompt": response.usage.prompt_tokens,
                    "completion": response.usage.completion_tokens,
                    "total": response.usage.total_tokens,
                },
            }

        except Exception as exc:
            logger.error(
                "Error in chat assistant: %s", str(exc), exc_info=True
            )
            raise RuntimeError(
                f"Chat assistant failed: {str(exc)}"
            ) from exc

    async def analyze_content_seo(
        self,
        content: str,
        keywords: List[str],
    ) -> Dict[str, Any]:
        """
        Analyze content for SEO effectiveness against target keywords.

        Args:
            content: The text content to analyze.
            keywords: Target keywords to evaluate against.

        Returns:
            Dictionary with SEO analysis scores, keyword usage stats,
            and improvement suggestions.
        """
        logger.info(
            "Analyzing content SEO for %d target keywords",
            len(keywords),
        )

        if not content:
            raise ValueError("Content is required for analysis.")
        if not keywords:
            raise ValueError("At least one target keyword is required.")

        system_prompt = (
            "You are an expert content SEO analyst. Analyze the provided "
            "content for SEO effectiveness. Be precise and data-driven. "
            "Respond with valid JSON."
        )

        user_prompt = (
            f"Analyze the following content for SEO optimization "
            f"against these target keywords: {', '.join(keywords)}\n\n"
            f"Content ({len(content)} characters):\n"
            f"---\n{content[:5000]}\n---\n\n"
            "Provide analysis as JSON with these fields:\n"
            "- overall_seo_score (0-100)\n"
            "- keyword_analysis: array of objects per keyword with "
            "(keyword, density_percentage, occurrences, in_title, "
            "in_headings, in_first_paragraph, optimization_level)\n"
            "- readability: object with (score, level, "
            "average_sentence_length, paragraph_count)\n"
            "- content_structure: object with (has_headings, "
            "heading_hierarchy_valid, has_lists, has_images_referenced, "
            "internal_links_suggested)\n"
            "- improvements: array of specific improvement suggestions "
            "with (suggestion, impact, effort)\n"
            "- meta_suggestions: object with (suggested_title, "
            "suggested_description)"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            analysis = json.loads(
                response.choices[0].message.content
            )

            analysis["content_length"] = len(content)
            analysis["word_count"] = len(content.split())
            analysis["target_keywords"] = keywords
            analysis["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            return analysis

        except Exception as exc:
            logger.error(
                "Error analyzing content SEO: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Content SEO analysis failed: {str(exc)}"
            ) from exc

    async def generate_meta_tags(
        self, content: str
    ) -> Dict[str, Any]:
        """
        Generate optimized meta tags for given content.

        Args:
            content: The page content to generate meta tags for.

        Returns:
            Dictionary with generated title, description, keywords,
            Open Graph tags, and Twitter Card tags.
        """
        logger.info("Generating meta tags for content")

        if not content:
            raise ValueError("Content is required.")

        system_prompt = (
            "You are an SEO meta tag specialist. Generate highly "
            "optimized meta tags that maximize click-through rates "
            "from search engine results pages. Follow current best "
            "practices for tag lengths and formatting. "
            "Respond with valid JSON."
        )

        user_prompt = (
            f"Generate optimized meta tags for this content:\n\n"
            f"---\n{content[:4000]}\n---\n\n"
            "Generate the following as JSON:\n"
            "- title: SEO-optimized title tag (50-60 characters)\n"
            "- description: compelling meta description (120-160 chars)\n"
            "- keywords: array of 5-10 relevant meta keywords\n"
            "- og_title: Open Graph title\n"
            "- og_description: Open Graph description (max 200 chars)\n"
            "- og_type: Open Graph content type\n"
            "- twitter_title: Twitter Card title\n"
            "- twitter_description: Twitter Card description\n"
            "- canonical_slug: suggested URL slug\n"
            "- schema_type: recommended Schema.org type\n"
            "- alternatives: object with 2 alternative titles and "
            "2 alternative descriptions for A/B testing"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.6,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            meta_tags = json.loads(
                response.choices[0].message.content
            )

            # Validate lengths
            title = meta_tags.get("title", "")
            description = meta_tags.get("description", "")

            meta_tags["validation"] = {
                "title_length": len(title),
                "title_ok": 30 <= len(title) <= 65,
                "description_length": len(description),
                "description_ok": 100 <= len(description) <= 165,
            }

            meta_tags["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            return meta_tags

        except Exception as exc:
            logger.error(
                "Error generating meta tags: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Meta tag generation failed: {str(exc)}"
            ) from exc

    @staticmethod
    def _summarize_issues(
        issues: List[Dict[str, Any]],
    ) -> Dict[str, int]:
        """Summarize issues by type with counts."""
        summary: Dict[str, int] = {}
        for issue in issues:
            issue_type = issue.get("type", "unknown")
            summary[issue_type] = summary.get(issue_type, 0) + 1
        return summary
