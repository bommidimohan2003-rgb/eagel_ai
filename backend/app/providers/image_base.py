from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class GeneratedImageData:
    image_bytes: Optional[bytes] = None
    image_url: Optional[str] = None
    width: int = 1024
    height: int = 1024
    aspect_ratio: str = "1:1"
    model: str = "flux"
    provider: str = "pollinations"
    content_type: str = "image/png"
    extra_metadata: Dict[str, Any] = field(default_factory=dict)


class ImageGenerationProvider(ABC):
    """
    Abstract interface for AI image generation providers.
    Ensures total modularity so any provider (OpenAI, Pollinations, Stability, Midjourney, Fal, Replicate)
    can be plugged in without touching core business logic or routes.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_aspect_ratios(self) -> List[str]:
        """e.g. ['1:1', '16:9', '9:16', '4:3', '3:4']"""
        pass

    @property
    @abstractmethod
    def supported_resolutions(self) -> List[str]:
        """e.g. ['512x512', '768x768', '1024x1024']"""
        pass

    @property
    def supports_editing(self) -> bool:
        return False

    @property
    def supports_variations(self) -> bool:
        return False

    @abstractmethod
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
        """
        Generates one or more images based on prompt and parameters.
        Returns list of GeneratedImageData.
        """
        pass

    async def edit_image(
        self,
        image_bytes: bytes,
        prompt: str,
        mask_bytes: Optional[bytes] = None,
        model: Optional[str] = None,
    ) -> List[GeneratedImageData]:
        raise NotImplementedError(f"Image editing is not supported by {self.provider_name}")

    async def create_variation(
        self,
        image_bytes: bytes,
        model: Optional[str] = None,
        number_of_images: int = 1,
    ) -> List[GeneratedImageData]:
        raise NotImplementedError(f"Image variations are not supported by {self.provider_name}")

    @abstractmethod
    async def health_check(self) -> bool:
        """Verifies provider connectivity and authentication."""
        pass
