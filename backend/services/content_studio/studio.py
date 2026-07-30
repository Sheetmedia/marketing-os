"""
Content Studio Service

Provides AI-powered content generation for blogs, landing pages,
email campaigns, ad copy, and content optimization using OpenAI.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI

from core.config import settings

logger = logging.getLogger(__name__)


class ContentStudioService:
    """Service for AI-powered content generation and optimization."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4o")

    async def generate_blog_article(
        self,
        topic: str,
        keywords: List[str],
        tone: str = "professional",
        length: int = 1500,
    ) -> Dict[str, Any]:
        """
        Generate a full SEO-optimized blog article.

        Args:
            topic: The main topic or title of the blog article.
            keywords: Target SEO keywords to incorporate.
            tone: Writing tone (professional, casual, authoritative, etc.).
            length: Approximate word count for the article.

        Returns:
            Dictionary with generated article, meta tags, and SEO analysis.
        """
        logger.info(
            "Generating blog article: topic='%s', tone='%s', length=%d",
            topic,
            tone,
            length,
        )

        if not topic:
            raise ValueError("Topic is required.")

        system_prompt = (
            "You are an expert SEO content writer. You create engaging, "
            "well-structured, and SEO-optimized blog articles. Follow "
            "these principles:\n"
            "- Write compelling headlines and subheadings using H2/H3 tags\n"
            "- Naturally incorporate keywords without stuffing\n"
            "- Use short paragraphs and varied sentence structures\n"
            "- Include a clear introduction, body, and conclusion\n"
            "- Add internal linking suggestions where relevant\n"
            "- Optimize for featured snippets where possible\n"
        )

        user_prompt = (
            f"Write a {length}-word blog article on the topic: "
            f"\"{topic}\"\n\n"
            f"Target keywords: {', '.join(keywords)}\n"
            f"Tone: {tone}\n\n"
            f"Structure the article with:\n"
            f"1. An engaging title (H1)\n"
            f"2. A hook introduction (2-3 paragraphs)\n"
            f"3. 3-5 main sections with H2 headings\n"
            f"4. Sub-sections with H3 headings where appropriate\n"
            f"5. A conclusion with a call-to-action\n\n"
            f"Also provide:\n"
            f"- Meta title (50-60 chars)\n"
            f"- Meta description (120-160 chars)\n"
            f"- URL slug suggestion\n"
            f"- 3 internal linking opportunities\n\n"
            f"Format: Return JSON with keys: 'title', 'content' "
            f"(full HTML article), 'meta_title', 'meta_description', "
            f"'slug', 'internal_link_suggestions', 'word_count', "
            f"'primary_keyword', 'secondary_keywords'"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=min(length * 3, 8000),
                response_format={"type": "json_object"},
            )

            article = json.loads(response.choices[0].message.content)

            # Calculate readability for the generated content
            plain_text = re.sub(
                r"<[^>]+>", "", article.get("content", "")
            )
            readability = await self.calculate_readability_score(
                plain_text
            )
            article["readability"] = readability

            article["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Blog article generated successfully")
            return article

        except Exception as exc:
            logger.error(
                "Error generating blog article: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Blog article generation failed: {str(exc)}"
            ) from exc

    async def generate_landing_page(
        self,
        product: str,
        keywords: List[str],
        tone: str = "persuasive",
    ) -> Dict[str, Any]:
        """
        Generate SEO-optimized landing page copy.

        Args:
            product: Product or service name and description.
            keywords: Target SEO keywords.
            tone: Writing tone (persuasive, professional, urgent, etc.).

        Returns:
            Dictionary with landing page sections and meta data.
        """
        logger.info(
            "Generating landing page for product: '%s'", product
        )

        if not product:
            raise ValueError("Product description is required.")

        system_prompt = (
            "You are a conversion-focused copywriter specializing in "
            "landing pages. You create compelling, SEO-optimized landing "
            "page copy that drives conversions. Focus on benefits over "
            "features, use power words, and include strong CTAs."
        )

        user_prompt = (
            f"Create landing page copy for: \"{product}\"\n\n"
            f"Target keywords: {', '.join(keywords)}\n"
            f"Tone: {tone}\n\n"
            f"Generate these sections as JSON:\n"
            f"- hero_headline: powerful main headline\n"
            f"- hero_subheadline: supporting sub-headline\n"
            f"- hero_cta: call-to-action button text\n"
            f"- value_propositions: array of 3-4 objects with "
            f"(title, description, icon_suggestion)\n"
            f"- features_section: object with heading and array of "
            f"features (title, description)\n"
            f"- social_proof_section: object with heading, "
            f"testimonial_prompts (array of 3)\n"
            f"- faq_section: array of 5 Q&A objects\n"
            f"- final_cta: object with headline, description, "
            f"button_text\n"
            f"- meta_title: SEO title (50-60 chars)\n"
            f"- meta_description: (120-160 chars)\n"
            f"- schema_markup_type: recommended Schema.org type"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            landing_page = json.loads(
                response.choices[0].message.content
            )

            landing_page["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Landing page copy generated successfully")
            return landing_page

        except Exception as exc:
            logger.error(
                "Error generating landing page: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Landing page generation failed: {str(exc)}"
            ) from exc

    async def generate_email_campaign(
        self,
        topic: str,
        audience: str,
        tone: str = "engaging",
    ) -> Dict[str, Any]:
        """
        Generate email campaign content including subject lines and body.

        Args:
            topic: The campaign topic or purpose.
            audience: Description of the target audience.
            tone: Writing tone for the campaign.

        Returns:
            Dictionary with email variants, subject lines, and preview text.
        """
        logger.info(
            "Generating email campaign: topic='%s', audience='%s'",
            topic,
            audience,
        )

        if not topic:
            raise ValueError("Campaign topic is required.")

        system_prompt = (
            "You are an email marketing expert who creates high-converting "
            "email campaigns. You understand email deliverability best "
            "practices, write compelling subject lines, and optimize for "
            "open rates and click-through rates."
        )

        user_prompt = (
            f"Create an email campaign for:\n"
            f"Topic: {topic}\n"
            f"Target audience: {audience}\n"
            f"Tone: {tone}\n\n"
            f"Generate as JSON with:\n"
            f"- campaign_name: descriptive name\n"
            f"- emails: array of 3 email variants, each with:\n"
            f"  - subject_line: compelling subject (under 50 chars)\n"
            f"  - preview_text: email preview text (under 100 chars)\n"
            f"  - greeting: personalized greeting\n"
            f"  - body_html: full email body in HTML\n"
            f"  - cta_text: call-to-action text\n"
            f"  - cta_url_placeholder: suggested CTA link path\n"
            f"  - variant_name: A/B test variant identifier\n"
            f"- recommended_send_time: best time to send\n"
            f"- recommended_send_day: best day to send\n"
            f"- segmentation_suggestions: array of audience segments\n"
            f"- spam_trigger_warnings: any words to watch out for"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )

            campaign = json.loads(
                response.choices[0].message.content
            )

            campaign["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Email campaign generated successfully")
            return campaign

        except Exception as exc:
            logger.error(
                "Error generating email campaign: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Email campaign generation failed: {str(exc)}"
            ) from exc

    async def generate_ad_copy(
        self,
        product: str,
        platform: str,
        keywords: List[str],
    ) -> Dict[str, Any]:
        """
        Generate advertising copy optimized for a specific platform.

        Args:
            product: Product or service to advertise.
            platform: Ad platform (google_ads, facebook, instagram,
                      linkedin, twitter).
            keywords: Target keywords for the ads.

        Returns:
            Dictionary with ad variants following platform-specific
            character limits and best practices.
        """
        logger.info(
            "Generating ad copy for '%s' on %s", product, platform
        )

        if not product:
            raise ValueError("Product description is required.")

        platform_specs = {
            "google_ads": {
                "headline_max": 30,
                "description_max": 90,
                "headlines_count": 15,
                "descriptions_count": 4,
            },
            "facebook": {
                "headline_max": 40,
                "primary_text_max": 125,
                "description_max": 30,
                "variants": 3,
            },
            "instagram": {
                "caption_max": 2200,
                "hashtags_count": 20,
                "variants": 3,
            },
            "linkedin": {
                "headline_max": 70,
                "intro_text_max": 150,
                "variants": 3,
            },
            "twitter": {
                "text_max": 280,
                "variants": 5,
            },
        }

        specs = platform_specs.get(
            platform,
            platform_specs["google_ads"],
        )

        system_prompt = (
            f"You are a performance marketing copywriter specializing "
            f"in {platform} advertising. You write high-converting ad "
            f"copy that follows platform-specific best practices and "
            f"character limits. Focus on strong CTAs, emotional "
            f"triggers, and unique selling propositions."
        )

        user_prompt = (
            f"Create ad copy for {platform}:\n"
            f"Product: {product}\n"
            f"Keywords: {', '.join(keywords)}\n"
            f"Platform specs: {json.dumps(specs)}\n\n"
            f"Generate as JSON with:\n"
            f"- platform: the ad platform\n"
            f"- ad_variants: array of ad variants following the "
            f"platform character limits\n"
            f"- targeting_suggestions: recommended audience targeting\n"
            f"- negative_keywords: keywords to exclude (if applicable)\n"
            f"- estimated_quality_score: quality assessment (1-10)\n"
            f"- a_b_test_recommendations: testing suggestions"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            ad_copy = json.loads(
                response.choices[0].message.content
            )

            ad_copy["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Ad copy generated for %s", platform)
            return ad_copy

        except Exception as exc:
            logger.error(
                "Error generating ad copy: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Ad copy generation failed: {str(exc)}"
            ) from exc

    async def optimize_content_seo(
        self,
        content: str,
        keywords: List[str],
    ) -> Dict[str, Any]:
        """
        Optimize existing content for better SEO performance.

        Args:
            content: The original content to optimize.
            keywords: Target keywords for optimization.

        Returns:
            Dictionary with optimized content, changes made, and
            before/after comparison.
        """
        logger.info("Optimizing content SEO for %d keywords", len(keywords))

        if not content:
            raise ValueError("Content is required for optimization.")
        if not keywords:
            raise ValueError("At least one keyword is required.")

        system_prompt = (
            "You are an SEO content optimization specialist. You improve "
            "existing content to rank better in search engines while "
            "maintaining readability and user engagement. Make targeted "
            "improvements without completely rewriting the content."
        )

        user_prompt = (
            f"Optimize the following content for these keywords: "
            f"{', '.join(keywords)}\n\n"
            f"Original content:\n---\n{content[:6000]}\n---\n\n"
            f"Provide as JSON:\n"
            f"- optimized_content: the improved content with HTML tags\n"
            f"- changes_made: array of specific changes with "
            f"(change_type, original, replacement, reason)\n"
            f"- keyword_density_before: estimated density per keyword\n"
            f"- keyword_density_after: estimated density per keyword\n"
            f"- seo_score_before: estimated score (0-100)\n"
            f"- seo_score_after: estimated score (0-100)\n"
            f"- additional_suggestions: further improvements"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=6000,
                response_format={"type": "json_object"},
            )

            optimized = json.loads(
                response.choices[0].message.content
            )

            optimized["tokens_used"] = {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens,
            }

            logger.info("Content optimization completed")
            return optimized

        except Exception as exc:
            logger.error(
                "Error optimizing content: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Content optimization failed: {str(exc)}"
            ) from exc

    async def calculate_readability_score(
        self, text: str
    ) -> Dict[str, Any]:
        """
        Calculate readability metrics for a given text.

        Computes Flesch Reading Ease, Flesch-Kincaid Grade Level,
        and other readability indicators.

        Args:
            text: The plain text to analyze.

        Returns:
            Dictionary with readability scores and metrics.
        """
        if not text:
            return {
                "error": "No text provided",
                "flesch_reading_ease": 0,
                "flesch_kincaid_grade": 0,
            }

        # Sentence counting
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = max(len(sentences), 1)

        # Word counting
        words = text.split()
        word_count = max(len(words), 1)

        # Syllable counting (approximate)
        def _count_syllables(word: str) -> int:
            word = word.lower().strip(".,!?;:'\"")
            if len(word) <= 3:
                return 1
            vowels = "aeiou"
            count = 0
            prev_vowel = False
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_vowel:
                    count += 1
                prev_vowel = is_vowel
            if word.endswith("e") and count > 1:
                count -= 1
            return max(count, 1)

        total_syllables = sum(_count_syllables(w) for w in words)

        # Flesch Reading Ease
        avg_sentence_length = word_count / sentence_count
        avg_syllables_per_word = total_syllables / word_count

        flesch_reading_ease = (
            206.835
            - (1.015 * avg_sentence_length)
            - (84.6 * avg_syllables_per_word)
        )
        flesch_reading_ease = max(0, min(100, flesch_reading_ease))

        # Flesch-Kincaid Grade Level
        flesch_kincaid_grade = (
            (0.39 * avg_sentence_length)
            + (11.8 * avg_syllables_per_word)
            - 15.59
        )
        flesch_kincaid_grade = max(0, flesch_kincaid_grade)

        # Determine reading level
        if flesch_reading_ease >= 80:
            reading_level = "Easy"
        elif flesch_reading_ease >= 60:
            reading_level = "Standard"
        elif flesch_reading_ease >= 40:
            reading_level = "Fairly Difficult"
        elif flesch_reading_ease >= 20:
            reading_level = "Difficult"
        else:
            reading_level = "Very Difficult"

        # Paragraph count
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

        return {
            "flesch_reading_ease": round(flesch_reading_ease, 1),
            "flesch_kincaid_grade": round(flesch_kincaid_grade, 1),
            "reading_level": reading_level,
            "word_count": word_count,
            "sentence_count": sentence_count,
            "paragraph_count": len(paragraphs),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_syllables_per_word": round(avg_syllables_per_word, 2),
            "total_syllables": total_syllables,
        }
