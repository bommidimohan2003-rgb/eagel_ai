from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000, description="Text prompt describing the desired image")
    negative_prompt: Optional[str] = Field(None, max_length=1000, description="Undesired elements to avoid")
    model: Optional[str] = Field(None, description="Image model to use (e.g. flux, turbo, dall-e-3)")
    width: Optional[int] = Field(None, ge=256, le=2048)
    height: Optional[int] = Field(None, ge=256, le=2048)
    aspect_ratio: Optional[str] = Field("1:1", pattern="^(1:1|16:9|9:16|4:3|3:4)$")
    quality: Optional[str] = Field("standard", description="standard or hd")
    style: Optional[str] = Field(None, description="Preset style e.g. Realistic, Cinematic, Anime, 3D, Cyberpunk")
    number_of_images: Optional[int] = Field(1, ge=1, le=4)
    enhance_prompt: Optional[bool] = Field(False, description="Optionally enrich prompt with LLM")
    conversation_id: Optional[str] = Field(None, description="Link generated image to conversation")


class ImageEditRequest(BaseModel):
    image_id: str
    prompt: str = Field(..., min_length=1, max_length=2000)
    mask_data: Optional[str] = None
    conversation_id: Optional[str] = None


class ImageVariationRequest(BaseModel):
    image_id: str
    number_of_images: Optional[int] = Field(1, ge=1, le=4)
    conversation_id: Optional[str] = None


class ImageItemResponse(BaseModel):
    id: str
    image_url: str = Field(alias="image_url")
    url: Optional[str] = None
    width: int
    height: int
    aspect_ratio: str
    style: Optional[str] = None
    prompt: str
    negative_prompt: Optional[str] = None
    enhanced_prompt: Optional[str] = None
    provider: str
    model: str
    generation_status: str
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def model_post_init(self, __context: Any) -> None:
        if not self.url and self.image_url:
            self.url = self.image_url


class ImageGenerationResponse(BaseModel):
    success: bool = True
    images: List[ImageItemResponse]
    provider: str
    model: str
    prompt: str
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    created_at: datetime


class ImageListResponse(BaseModel):
    images: List[ImageItemResponse]
    total: int
    page: int
    page_size: int


class PromptEnhanceRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    style: Optional[str] = None


class PromptEnhanceResponse(BaseModel):
    original_prompt: str
    enhanced_prompt: str
