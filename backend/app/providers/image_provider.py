import base64
import io
import time
import urllib.parse
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import AIProviderError
from app.core.logging import logger
from app.providers.image_base import GeneratedImageData, ImageGenerationProvider


def map_aspect_ratio_to_dimensions(aspect_ratio: Optional[str]) -> tuple[int, int]:
    """
    Standard aspect ratio to pixel dimensions mapping.
    """
    mapping = {
        "1:1": (1024, 1024),
        "16:9": (1280, 720),
        "9:16": (720, 1280),
        "4:3": (1024, 768),
        "3:4": (768, 1024),
    }
    return mapping.get(aspect_ratio or "1:1", (1024, 1024))


class PollinationsImageProvider(ImageGenerationProvider):
    """
    Production-grade open provider powered by state-of-the-art models (FLUX.1-schnell, FLUX-dev, Turbo).
    Generates high-fidelity images with zero API key requirement, or with key if configured.
    """

    def __init__(self, model: Optional[str] = None):
        self.model_name = model or settings.IMAGE_MODEL or "flux"
        self.base_url = settings.IMAGE_API_BASE_URL or "https://image.pollinations.ai"

    @property
    def provider_name(self) -> str:
        return "pollinations"

    @property
    def supported_aspect_ratios(self) -> List[str]:
        return ["1:1", "16:9", "9:16", "4:3", "3:4"]

    @property
    def supported_resolutions(self) -> List[str]:
        return ["512x512", "768x768", "1024x1024", "1280x720", "720x1280", "1024x768", "768x1024"]

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        model: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        aspect_ratio: Optional[str] = "1:1",
        quality: Optional[str] = "standard",
        style: Optional[str] = None,
        number_of_images: int = 1,
        seed: Optional[int] = None,
    ) -> List[GeneratedImageData]:
        if not prompt or not prompt.strip():
            raise AIProviderError("Prompt cannot be empty for image generation")

        resolved_model = model or self.model_name
        req_width, req_height = map_aspect_ratio_to_dimensions(aspect_ratio)
        if width and height:
            req_width, req_height = width, height

        # Enrich prompt with style if specified
        final_prompt = prompt.strip()
        if style and style.lower() not in ["none", "default", "standard"]:
            final_prompt = f"{final_prompt}, in {style} style, ultra-detailed, 8k resolution"

        if negative_prompt and negative_prompt.strip():
            final_prompt = f"{final_prompt} | negative: {negative_prompt.strip()}"

        results: List[GeneratedImageData] = []

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            for idx in range(number_of_images):
                current_seed = (seed or int(time.time() * 1000)) + idx
                encoded_prompt = urllib.parse.quote(final_prompt)
                
                # Pollinations URL format: https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&model={model}&seed={seed}&nologo=true
                url = (
                    f"{self.base_url}/prompt/{encoded_prompt}"
                    f"?width={req_width}&height={req_height}&model={resolved_model}&seed={current_seed}&nologo=true"
                )

                try:
                    logger.info(f"Generating image via Pollinations ({resolved_model}): {url}")
                    resp = await client.get(url)
                    
                    if resp.status_code != 200:
                        raise AIProviderError(f"Image generation failed with HTTP {resp.status_code}: {resp.text[:200]}")

                    image_bytes = resp.content
                    content_type = resp.headers.get("content-type", "image/jpeg")

                    results.append(
                        GeneratedImageData(
                            image_bytes=image_bytes,
                            image_url=url,
                            width=req_width,
                            height=req_height,
                            aspect_ratio=aspect_ratio or "1:1",
                            model=resolved_model,
                            provider=self.provider_name,
                            content_type=content_type,
                            extra_metadata={"seed": current_seed, "style": style},
                        )
                    )
                except httpx.RequestError as req_err:
                    logger.error(f"Pollinations request error: {req_err}")
                    raise AIProviderError(f"Network error communicating with image provider: {str(req_err)}")

        return results

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/prompt/test?width=64&height=64&nologo=true")
                return res.status_code == 200
        except Exception:
            return False


class OpenAIImageProvider(ImageGenerationProvider):
    """
    OpenAI DALL-E 2 and DALL-E 3 API Provider.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.IMAGE_API_KEY
        self.base_url = base_url or settings.IMAGE_API_BASE_URL or "https://api.openai.com/v1"
        self.model_name = settings.IMAGE_MODEL or "dall-e-3"

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def supported_aspect_ratios(self) -> List[str]:
        return ["1:1", "16:9", "9:16"]

    @property
    def supported_resolutions(self) -> List[str]:
        return ["1024x1024", "1792x1024", "1024x1792"]

    @property
    def supports_editing(self) -> bool:
        return True

    @property
    def supports_variations(self) -> bool:
        return True

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        model: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        aspect_ratio: Optional[str] = "1:1",
        quality: Optional[str] = "standard",
        style: Optional[str] = None,
        number_of_images: int = 1,
        seed: Optional[int] = None,
    ) -> List[GeneratedImageData]:
        if not self.api_key:
            raise AIProviderError("OpenAI IMAGE_API_KEY is not configured")

        resolved_model = model or self.model_name
        
        # DALL-E 3 size mapping
        size = "1024x1024"
        if aspect_ratio == "16:9":
            size = "1792x1024"
        elif aspect_ratio == "9:16":
            size = "1024x1792"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": resolved_model,
            "prompt": prompt,
            "n": min(number_of_images, 1 if resolved_model == "dall-e-3" else 4),
            "size": size,
            "response_format": "b64_json",
        }

        if resolved_model == "dall-e-3":
            if quality in ["standard", "hd"]:
                payload["quality"] = quality
            if style in ["vivid", "natural"]:
                payload["style"] = style

        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(f"{self.base_url}/images/generations", headers=headers, json=payload)
            if resp.status_code != 200:
                err_data = resp.json().get("error", {})
                raise AIProviderError(f"OpenAI error: {err_data.get('message', resp.text)}")

            data = resp.json()
            results: List[GeneratedImageData] = []
            
            w_val, h_val = (int(x) for x in size.split("x"))
            for item in data.get("data", []):
                b64 = item.get("b64_json")
                revised_prompt = item.get("revised_prompt")
                img_bytes = base64.b64decode(b64) if b64 else None
                
                results.append(
                    GeneratedImageData(
                        image_bytes=img_bytes,
                        image_url=item.get("url"),
                        width=w_val,
                        height=h_val,
                        aspect_ratio=aspect_ratio or "1:1",
                        model=resolved_model,
                        provider=self.provider_name,
                        content_type="image/png",
                        extra_metadata={"revised_prompt": revised_prompt},
                    )
                )

            return results

    async def health_check(self) -> bool:
        return bool(self.api_key)


class MockImageProvider(ImageGenerationProvider):
    """
    Fallback mock generator for unit tests or offline sandbox environments.
    Generates dynamic SVG/PNG images.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def supported_aspect_ratios(self) -> List[str]:
        return ["1:1", "16:9", "9:16", "4:3", "3:4"]

    @property
    def supported_resolutions(self) -> List[str]:
        return ["512x512", "1024x1024"]

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        model: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        aspect_ratio: Optional[str] = "1:1",
        quality: Optional[str] = "standard",
        style: Optional[str] = None,
        number_of_images: int = 1,
        seed: Optional[int] = None,
    ) -> List[GeneratedImageData]:
        req_w, req_h = map_aspect_ratio_to_dimensions(aspect_ratio)
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{req_w}" height="{req_h}" viewBox="0 0 {req_w} {req_h}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#1e1b4b;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-size="28" font-family="sans-serif" font-weight="bold">Eagle AI Generated Image</text>
          <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="16" font-family="sans-serif">Prompt: {prompt[:60]}...</text>
        </svg>"""

        return [
            GeneratedImageData(
                image_bytes=svg_content.encode("utf-8"),
                image_url=None,
                width=req_w,
                height=req_h,
                aspect_ratio=aspect_ratio or "1:1",
                model="mock-canvas",
                provider="mock",
                content_type="image/svg+xml",
                extra_metadata={"mock": True},
            )
            for _ in range(number_of_images)
        ]

    async def health_check(self) -> bool:
        return True


class ProviderRegistry:
    """
    Factory for resolving and instantiating image providers based on environment config.
    """

    _providers: Dict[str, type[ImageGenerationProvider]] = {
        "pollinations": PollinationsImageProvider,
        "openai": OpenAIImageProvider,
        "mock": MockImageProvider,
    }

    @classmethod
    def get_provider(cls, provider_name: Optional[str] = None) -> ImageGenerationProvider:
        name = (provider_name or settings.IMAGE_PROVIDER or "pollinations").lower()
        provider_cls = cls._providers.get(name, PollinationsImageProvider)
        return provider_cls()
