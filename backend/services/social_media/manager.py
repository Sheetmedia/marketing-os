"""
Social Media Manager Service

Provides social media post scheduling, publishing, analytics retrieval,
and AI-powered caption generation.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from openai import AsyncOpenAI

from core.config import settings

logger = logging.getLogger(__name__)


class SocialMediaService:
    """Service for managing social media content and analytics."""

    SUPPORTED_PLATFORMS = [
        "facebook",
        "instagram",
        "twitter",
        "linkedin",
        "tiktok",
        "pinterest",
    ]

    STATUS_DRAFT = "draft"
    STATUS_SCHEDULED = "scheduled"
    STATUS_PUBLISHED = "published"
    STATUS_FAILED = "failed"

    def __init__(self):
        self.openai_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        )
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4o")

    async def schedule_post(
        self,
        platform: str,
        content: str,
        scheduled_time: str,
        media_urls: Optional[List[str]] = None,
        hashtags: Optional[List[str]] = None,
        client_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Schedule a social media post for future publishing.

        Args:
            platform: Target platform (facebook, instagram, twitter, etc.).
            content: Post text content.
            scheduled_time: ISO format datetime for publishing.
            media_urls: Optional list of media attachment URLs.
            hashtags: Optional list of hashtags to include.
            client_id: Associated client identifier.

        Returns:
            Dictionary with scheduled post details.
        """
        logger.info(
            "Scheduling post for %s at %s", platform, scheduled_time
        )

        if platform not in self.SUPPORTED_PLATFORMS:
            raise ValueError(
                f"Unsupported platform '{platform}'. Supported: "
                f"{', '.join(self.SUPPORTED_PLATFORMS)}"
            )

        if not content:
            raise ValueError("Post content is required.")

        try:
            scheduled_dt = datetime.fromisoformat(scheduled_time)
            if scheduled_dt <= datetime.now(timezone.utc):
                raise ValueError(
                    "Scheduled time must be in the future."
                )
        except (ValueError, TypeError) as exc:
            raise ValueError(
                f"Invalid scheduled_time format: {str(exc)}"
            ) from exc

        # Validate platform-specific limits
        self._validate_platform_limits(platform, content, media_urls)

        # Append hashtags to content if provided
        final_content = content
        if hashtags:
            hashtag_str = " ".join(
                f"#{tag.lstrip('#')}" for tag in hashtags
            )
            final_content = f"{content}\n\n{hashtag_str}"

        post = {
            "id": str(uuid4()),
            "platform": platform,
            "content": final_content,
            "original_content": content,
            "media_urls": media_urls or [],
            "hashtags": hashtags or [],
            "scheduled_time": scheduled_time,
            "status": self.STATUS_SCHEDULED,
            "client_id": client_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # In production, persist to database and register with scheduler.
        logger.info(
            "Post scheduled: id=%s, platform=%s, time=%s",
            post["id"],
            platform,
            scheduled_time,
        )

        return post

    async def publish_post(
        self, post_id: str
    ) -> Dict[str, Any]:
        """
        Publish a scheduled post immediately or trigger its delivery.

        Args:
            post_id: The unique post identifier.

        Returns:
            Dictionary with publication status and platform post ID.
        """
        logger.info("Publishing post: %s", post_id)

        if not post_id:
            raise ValueError("post_id is required.")

        try:
            # In production, fetch the post from the database.
            post = await self._get_post(post_id)

            if not post:
                raise ValueError(f"Post {post_id} not found.")

            if post.get("status") == self.STATUS_PUBLISHED:
                raise ValueError(
                    f"Post {post_id} is already published."
                )

            platform = post.get("platform", "")

            # In production, call platform-specific APIs.
            # Example: Facebook Graph API, Twitter API v2, etc.
            platform_post_id = await self._publish_to_platform(
                platform, post
            )

            result = {
                "post_id": post_id,
                "platform": platform,
                "status": self.STATUS_PUBLISHED,
                "platform_post_id": platform_post_id,
                "published_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

            logger.info(
                "Post %s published to %s", post_id, platform
            )
            return result

        except ValueError:
            raise
        except Exception as exc:
            logger.error(
                "Error publishing post %s: %s",
                post_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Post publishing failed: {str(exc)}"
            ) from exc

    async def get_analytics(
        self,
        client_id: str,
        platform: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve social media analytics for a client.

        Args:
            client_id: The client identifier.
            platform: Optional specific platform filter.
            date_range: Optional dict with 'start' and 'end' dates.

        Returns:
            Dictionary with per-platform and aggregated analytics.
        """
        logger.info(
            "Retrieving social media analytics for client: %s",
            client_id,
        )

        if not client_id:
            raise ValueError("client_id is required.")

        platforms = (
            [platform] if platform else self.SUPPORTED_PLATFORMS
        )

        try:
            analytics = {
                "client_id": client_id,
                "date_range": date_range or {
                    "start": "last_30_days",
                    "end": "today",
                },
                "platforms": {},
                "aggregated": {
                    "total_posts": 0,
                    "total_impressions": 0,
                    "total_engagements": 0,
                    "total_followers": 0,
                    "average_engagement_rate": 0.0,
                },
            }

            total_engagement_rates = []

            for plat in platforms:
                # In production, fetch from platform APIs or database.
                platform_analytics = (
                    await self._fetch_platform_analytics(
                        client_id, plat, date_range
                    )
                )
                analytics["platforms"][plat] = platform_analytics

                agg = analytics["aggregated"]
                agg["total_posts"] += platform_analytics.get(
                    "posts_count", 0
                )
                agg["total_impressions"] += platform_analytics.get(
                    "impressions", 0
                )
                agg["total_engagements"] += platform_analytics.get(
                    "engagements", 0
                )
                agg["total_followers"] += platform_analytics.get(
                    "followers", 0
                )
                er = platform_analytics.get("engagement_rate", 0)
                if er > 0:
                    total_engagement_rates.append(er)

            if total_engagement_rates:
                analytics["aggregated"]["average_engagement_rate"] = (
                    round(
                        sum(total_engagement_rates)
                        / len(total_engagement_rates),
                        2,
                    )
                )

            analytics["retrieved_at"] = datetime.now(
                timezone.utc
            ).isoformat()

            return analytics

        except Exception as exc:
            logger.error(
                "Error retrieving social analytics for client %s: %s",
                client_id,
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Social analytics retrieval failed: {str(exc)}"
            ) from exc

    async def generate_caption(
        self,
        topic: str,
        platform: str,
        tone: str = "engaging",
        include_hashtags: bool = True,
        include_emoji: bool = True,
    ) -> Dict[str, Any]:
        """
        Generate an AI-powered social media caption.

        Args:
            topic: The topic or subject for the caption.
            platform: Target social media platform.
            tone: Writing tone (engaging, professional, humorous, etc.).
            include_hashtags: Whether to include relevant hashtags.
            include_emoji: Whether to include emoji in the caption.

        Returns:
            Dictionary with caption variants and hashtag suggestions.
        """
        logger.info(
            "Generating caption for %s: topic='%s'", platform, topic
        )

        if not topic:
            raise ValueError("Topic is required.")

        platform_limits = {
            "twitter": 280,
            "instagram": 2200,
            "facebook": 63206,
            "linkedin": 3000,
            "tiktok": 2200,
            "pinterest": 500,
        }
        char_limit = platform_limits.get(platform, 2200)

        system_prompt = (
            f"You are a social media content expert specializing in "
            f"{platform}. You create engaging captions that drive "
            f"interaction and follows. You understand the platform's "
            f"audience and algorithm preferences."
        )

        import json

        user_prompt = (
            f"Create social media captions for {platform}:\n"
            f"Topic: {topic}\n"
            f"Tone: {tone}\n"
            f"Character limit: {char_limit}\n"
            f"Include hashtags: {include_hashtags}\n"
            f"Include emoji: {include_emoji}\n\n"
            f"Generate as JSON:\n"
            f"- captions: array of 3 caption variants, each with:\n"
            f"  - text: the caption text\n"
            f"  - character_count: number of characters\n"
            f"  - variant_type: (hook, storytelling, direct)\n"
            f"- hashtags: array of 10-15 relevant hashtags\n"
            f"- best_posting_time: recommended time to post\n"
            f"- engagement_tips: array of 3 tips for maximizing engagement"
        )

        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )

            captions = json.loads(
                response.choices[0].message.content
            )

            captions["platform"] = platform
            captions["topic"] = topic
            captions["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Captions generated for %s", platform)
            return captions

        except Exception as exc:
            logger.error(
                "Error generating caption: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Caption generation failed: {str(exc)}"
            ) from exc

    def _validate_platform_limits(
        self,
        platform: str,
        content: str,
        media_urls: Optional[List[str]],
    ) -> None:
        """Validate content against platform-specific character limits."""
        limits = {
            "twitter": {"text": 280, "media": 4},
            "instagram": {"text": 2200, "media": 10},
            "facebook": {"text": 63206, "media": 30},
            "linkedin": {"text": 3000, "media": 9},
            "tiktok": {"text": 2200, "media": 1},
            "pinterest": {"text": 500, "media": 1},
        }

        platform_limits = limits.get(platform, {})
        text_limit = platform_limits.get("text", 5000)
        media_limit = platform_limits.get("media", 10)

        if len(content) > text_limit:
            raise ValueError(
                f"Content exceeds {platform} character limit of "
                f"{text_limit}. Current length: {len(content)}."
            )

        if media_urls and len(media_urls) > media_limit:
            raise ValueError(
                f"Too many media attachments for {platform}. "
                f"Maximum: {media_limit}, provided: {len(media_urls)}."
            )

    async def _get_post(
        self, post_id: str
    ) -> Optional[Dict[str, Any]]:
        """Retrieve a post from the database."""
        logger.debug("Fetching post: %s", post_id)
        return None

    async def _publish_to_platform(
        self, platform: str, post: Dict[str, Any]
    ) -> Optional[str]:
        """
        Publish a post to a specific platform API.

        Returns the platform-assigned post ID.
        """
        logger.debug("Publishing to %s (stub)", platform)
        # In production, implement platform-specific API calls.
        return None

    async def _fetch_platform_analytics(
        self,
        client_id: str,
        platform: str,
        date_range: Optional[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Fetch analytics data for a specific platform."""
        logger.debug(
            "Fetching %s analytics for client %s",
            platform,
            client_id,
        )
        # In production, query platform APIs or database.
        return {
            "platform": platform,
            "posts_count": 0,
            "impressions": 0,
            "engagements": 0,
            "followers": 0,
            "engagement_rate": 0.0,
            "top_posts": [],
        }
