"""
Image Generation Service

Provides AI-powered image generation using the Stable Diffusion API
via httpx for async HTTP calls.
"""

import base64
import logging
from typing import Any, Dict, Optional, Tuple

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class ImageGenerationService:
    """Service for generating images using the Stable Diffusion API."""

    def __init__(self):
        self.api_url = getattr(
            settings,
            "STABLE_DIFFUSION_API_URL",
            "https://api.stability.ai/v1/generation",
        )
        self.api_key = getattr(
            settings, "STABLE_DIFFUSION_API_KEY", ""
        )
        self.default_engine = "stable-diffusion-xl-1024-v1-0"
        self.request_timeout = 120.0

    def _get_dimensions(
        self, image_type: str
    ) -> Tuple[int, int]:
        """
        Get recommended image dimensions for a given image type.

        Args:
            image_type: The type of image (e.g., 'blog_header',
                        'social_square', 'banner', etc.).

        Returns:
            Tuple of (width, height) in pixels.
        """
        dimension_map = {
            "blog_header": (1024, 576),
            "blog_thumbnail": (512, 512),
            "social_square": (1024, 1024),
            "social_landscape": (1024, 576),
            "social_portrait": (576, 1024),
            "social_story": (576, 1024),
            "banner_wide": (1024, 320),
            "banner_leaderboard": (1024, 320),
            "hero": (1024, 576),
            "og_image": (1024, 576),
            "twitter_card": (1024, 512),
            "email_header": (1024, 384),
            "ad_square": (1024, 1024),
            "ad_landscape": (1024, 576),
            "ad_portrait": (576, 1024),
            "icon": (512, 512),
            "favicon": (512, 512),
            "infographic": (576, 1024),
            "presentation": (1024, 576),
        }

        dimensions = dimension_map.get(image_type, (1024, 1024))
        logger.debug(
            "Dimensions for image_type '%s': %dx%d",
            image_type,
            dimensions[0],
            dimensions[1],
        )
        return dimensions

    async def generate_image(
        self,
        prompt: str,
        image_type: str = "social_square",
        style: str = "photographic",
        dimensions: Optional[Tuple[int, int]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an image using the Stable Diffusion API.

        Args:
            prompt: Text description of the desired image.
            image_type: Type of image to determine default dimensions.
            style: Visual style preset (photographic, digital-art,
                   cinematic, anime, comic-book, fantasy-art, etc.).
            dimensions: Optional explicit (width, height) override.

        Returns:
            Dictionary with generated image data (base64), metadata,
            and generation parameters.
        """
        logger.info(
            "Generating image: type='%s', style='%s'",
            image_type,
            style,
        )

        if not prompt:
            raise ValueError("Image prompt is required.")

        if not self.api_key:
            raise ValueError(
                "Stable Diffusion API key is not configured. "
                "Set STABLE_DIFFUSION_API_KEY in settings."
            )

        # Determine dimensions
        if dimensions:
            width, height = dimensions
        else:
            width, height = self._get_dimensions(image_type)

        # Validate dimensions are multiples of 64
        width = max(512, (width // 64) * 64)
        height = max(512, (height // 64) * 64)

        # Build the API request
        valid_styles = [
            "photographic",
            "digital-art",
            "cinematic",
            "anime",
            "comic-book",
            "fantasy-art",
            "analog-film",
            "neon-punk",
            "isometric",
            "low-poly",
            "origami",
            "line-art",
            "3d-model",
            "pixel-art",
            "enhance",
        ]
        style_preset = style if style in valid_styles else "photographic"

        # Enhance prompt for better results
        enhanced_prompt = self._enhance_prompt(prompt, style_preset)

        request_body = {
            "text_prompts": [
                {
                    "text": enhanced_prompt,
                    "weight": 1.0,
                },
                {
                    "text": (
                        "blurry, low quality, distorted, deformed, "
                        "watermark, text overlay, bad anatomy"
                    ),
                    "weight": -1.0,
                },
            ],
            "cfg_scale": 7,
            "height": height,
            "width": width,
            "samples": 1,
            "steps": 30,
            "style_preset": style_preset,
        }

        endpoint = (
            f"{self.api_url}/{self.default_engine}/text-to-image"
        )

        try:
            async with httpx.AsyncClient(
                timeout=self.request_timeout
            ) as client:
                response = await client.post(
                    endpoint,
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )

                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(
                        "Stable Diffusion API error (%d): %s",
                        response.status_code,
                        error_detail,
                    )
                    raise RuntimeError(
                        f"Image generation API returned status "
                        f"{response.status_code}: {error_detail}"
                    )

                result = response.json()
                artifacts = result.get("artifacts", [])

                if not artifacts:
                    raise RuntimeError(
                        "No image artifacts returned by the API."
                    )

                image_data = artifacts[0]
                image_base64 = image_data.get("base64", "")
                finish_reason = image_data.get(
                    "finishReason", "unknown"
                )

                if finish_reason == "CONTENT_FILTERED":
                    logger.warning(
                        "Generated image was content-filtered. "
                        "Prompt may contain restricted content."
                    )
                    return {
                        "success": False,
                        "error": "content_filtered",
                        "message": (
                            "The generated image was filtered due to "
                            "content policy. Please modify your prompt."
                        ),
                    }

                # Calculate approximate file size
                image_bytes = base64.b64decode(image_base64)
                file_size_kb = len(image_bytes) / 1024

                logger.info(
                    "Image generated successfully: %dx%d, %.1f KB",
                    width,
                    height,
                    file_size_kb,
                )

                return {
                    "success": True,
                    "image_base64": image_base64,
                    "width": width,
                    "height": height,
                    "style": style_preset,
                    "image_type": image_type,
                    "file_size_kb": round(file_size_kb, 1),
                    "format": "png",
                    "prompt_used": enhanced_prompt,
                    "finish_reason": finish_reason,
                    "generation_params": {
                        "cfg_scale": 7,
                        "steps": 30,
                        "engine": self.default_engine,
                    },
                }

        except httpx.TimeoutException:
            logger.error("Image generation request timed out")
            raise RuntimeError(
                "Image generation timed out. Please try again."
            )
        except httpx.HTTPError as exc:
            logger.error(
                "HTTP error during image generation: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Image generation HTTP error: {str(exc)}"
            ) from exc
        except Exception as exc:
            logger.error(
                "Unexpected error during image generation: %s",
                str(exc),
                exc_info=True,
            )
            raise RuntimeError(
                f"Image generation failed: {str(exc)}"
            ) from exc

    @staticmethod
    def _enhance_prompt(prompt: str, style: str) -> str:
        """
        Enhance the user's prompt with style-specific quality modifiers.

        Args:
            prompt: Original user prompt.
            style: The chosen style preset.

        Returns:
            Enhanced prompt string.
        """
        style_enhancements = {
            "photographic": (
                "professional photography, high resolution, "
                "sharp focus, natural lighting, 8k"
            ),
            "digital-art": (
                "detailed digital illustration, vibrant colors, "
                "high quality, trending on artstation"
            ),
            "cinematic": (
                "cinematic composition, dramatic lighting, "
                "film grain, depth of field, 4k"
            ),
            "anime": (
                "anime style, detailed, vibrant, "
                "studio quality animation"
            ),
            "fantasy-art": (
                "fantasy illustration, epic, detailed, "
                "magical atmosphere, concept art"
            ),
            "3d-model": (
                "3D render, octane render, volumetric lighting, "
                "high detail, studio lighting"
            ),
        }

        enhancement = style_enhancements.get(
            style, "high quality, detailed, professional"
        )
        return f"{prompt}, {enhancement}"
