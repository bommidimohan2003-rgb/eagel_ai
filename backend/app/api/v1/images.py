import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.user import User
from app.schemas.image import (
    ImageEditRequest,
    ImageGenerationRequest,
    ImageGenerationResponse,
    ImageItemResponse,
    ImageListResponse,
    ImageVariationRequest,
    PromptEnhanceRequest,
    PromptEnhanceResponse,
)
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["Image Generation & Multimodal"])


@router.post("/generate", response_model=ImageGenerationResponse, status_code=status.HTTP_201_CREATED)
async def generate_image(
    request: ImageGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an AI image with specified prompt, aspect ratio, style, and quality.
    Links the output to conversation history if conversation_id is supplied.
    """
    return await image_service.generate_images(
        db=db,
        user_id=current_user.id,
        request=request,
    )


@router.get("", response_model=ImageListResponse)
async def list_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    style: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve user's generated image gallery with pagination, search, and style filtering.
    """
    return await image_service.list_images(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        style=style,
        provider=provider,
        search_query=search,
    )


@router.get("/{image_id}", response_model=ImageItemResponse)
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed metadata for a single generated image.
    """
    return await image_service.get_image(
        db=db,
        user_id=current_user.id,
        image_id=image_id,
    )


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a generated image and remove its stored file.
    """
    await image_service.delete_image(
        db=db,
        user_id=current_user.id,
        image_id=image_id,
    )
    return None


@router.post("/enhance-prompt", response_model=PromptEnhanceResponse)
async def enhance_prompt(
    request: PromptEnhanceRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Transform a simple user concept into a detailed prompt suitable for high-end diffusion models.
    """
    enhanced = await image_service.enhance_prompt(request.prompt, request.style)
    return PromptEnhanceResponse(
        original_prompt=request.prompt,
        enhanced_prompt=enhanced,
    )


@router.get("/serve/{filename}")
async def serve_image(filename: str):
    """
    Serves stored generated images securely with proper caching headers.
    """
    # Prevent path traversal
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(settings.GENERATED_IMAGES_DIR, safe_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    ext = os.path.splitext(safe_filename)[1].lower()
    media_type = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/svg+xml" if ext == ".svg" else "image/jpeg"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@router.post("/edit", response_model=ImageGenerationResponse)
async def edit_image(
    request: ImageEditRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Image editing endpoint placeholder for vision/inpainting models.
    """
    raise HTTPException(status_code=501, detail="Image editing is ready in architecture and will be active with an edit-capable provider")


@router.post("/variations", response_model=ImageGenerationResponse)
async def create_variations(
    request: ImageVariationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Image variations endpoint placeholder.
    """
    raise HTTPException(status_code=501, detail="Image variations endpoint ready for supported providers")
