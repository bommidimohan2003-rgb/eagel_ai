import time
from typing import List, Optional, Tuple
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import AIProviderError, AuthorizationError, NotFoundError
from app.core.logging import logger
from app.models.conversation import Conversation
from app.models.generated_image import GeneratedImage
from app.models.image_usage_log import ImageUsageLog
from app.models.message import Message
from app.providers.image_base import GeneratedImageData, ImageGenerationProvider
from app.providers.image_provider import ProviderRegistry
from app.providers.nvidia import NVIDIAProvider
from app.schemas.image import (
    ImageGenerationRequest,
    ImageGenerationResponse,
    ImageItemResponse,
    ImageListResponse,
)
from app.services.conversation_service import ConversationService
from app.storage.local import get_storage_provider


class ImageService:
    """
    Central business logic service for AI image generation, persistence,
    conversation history linkage, and telemetry logging.
    """

    def __init__(self, provider: Optional[ImageGenerationProvider] = None):
        self.provider = provider or ProviderRegistry.get_provider()
        self.storage = get_storage_provider()
        self.text_provider = NVIDIAProvider()

    async def enhance_prompt(self, raw_prompt: str, style: Optional[str] = None) -> str:
        """
        Uses the text model to create a richly detailed photographic or artistic prompt.
        """
        if not raw_prompt or len(raw_prompt.strip()) < 3:
            return raw_prompt

        style_instruction = f" in {style} style" if style else ""
        system_instruction = (
            "You are an expert prompt engineer for generative AI models (FLUX, Midjourney, DALL-E). "
            "Given a concise user idea, expand it into a vivid, descriptive visual prompt "
            "focusing on subject details, lighting, mood, color palette, and composition. "
            "Output ONLY the enhanced prompt in 1-2 concise sentences without markdown, quotes, or conversational filler."
        )

        try:
            res = await self.text_provider.generate_response(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Enhance this image prompt{style_instruction}: {raw_prompt}"},
                ],
                temperature=0.7,
                max_tokens=150,
            )
            enhanced = res.get("content", "").strip().strip('"\'')
            if enhanced:
                return enhanced
        except Exception as e:
            logger.warning(f"Prompt enhancement fallback to original: {e}")

        # Fallback expansion
        style_suffix = f", {style} aesthetic" if style else ""
        return f"{raw_prompt.strip()}{style_suffix}, highly detailed, cinematic lighting, 8k resolution"

    async def generate_images(
        self,
        db: AsyncSession,
        user_id: str,
        request: ImageGenerationRequest,
    ) -> ImageGenerationResponse:
        start_time = time.time()
        
        # 1. Handle Prompt Enhancement if requested
        enhanced_prompt = None
        active_prompt = request.prompt.strip()
        if request.enhance_prompt:
            enhanced_prompt = await self.enhance_prompt(request.prompt, request.style)
            active_prompt = enhanced_prompt

        # 2. Resolve Provider & Generate
        target_provider = ProviderRegistry.get_provider(request.model)
        logger.info(f"Initiating image generation via [{target_provider.provider_name}] for user {user_id}")

        try:
            generated_items: List[GeneratedImageData] = await target_provider.generate_image(
                prompt=active_prompt,
                negative_prompt=request.negative_prompt,
                model=request.model or settings.IMAGE_MODEL,
                width=request.width,
                height=request.height,
                aspect_ratio=request.aspect_ratio or "1:1",
                quality=request.quality or "standard",
                style=request.style,
                number_of_images=request.number_of_images or 1,
            )
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}", exc_info=True)
            raise AIProviderError(f"Image generation failed: {str(e)}")

        duration_ms = int((time.time() - start_time) * 1000)

        # 3. Ensure conversation exists if requested
        conversation_id = request.conversation_id
        if conversation_id:
            try:
                await ConversationService.get_conversation(db, conversation_id, user_id)
            except NotFoundError:
                conv = await ConversationService.create_conversation(db, user_id, title=f"Image: {request.prompt[:30]}")
                conversation_id = conv.id
        
        created_image_records: List[GeneratedImage] = []
        response_images: List[ImageItemResponse] = []

        # 4. Store Images Permanently & Save Database Records
        for item in generated_items:
            storage_path = None
            public_url = item.image_url or ""

            # If provider returned raw bytes, store permanently
            if item.image_bytes:
                storage_path, public_url = await self.storage.save_image(
                    image_bytes=item.image_bytes,
                    filename=f"gen_{request.prompt[:10].replace(' ', '_')}.png",
                    content_type=item.content_type,
                )

            # Create Database Record
            image_record = GeneratedImage(
                user_id=user_id,
                conversation_id=conversation_id,
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                enhanced_prompt=enhanced_prompt,
                provider=item.provider,
                model=item.model,
                image_url=public_url,
                storage_path=storage_path,
                width=item.width,
                height=item.height,
                aspect_ratio=item.aspect_ratio,
                style=request.style,
                quality=request.quality,
                generation_status="COMPLETED",
                extra_metadata=item.extra_metadata,
            )
            db.add(image_record)
            created_image_records.append(image_record)

        await db.commit()

        # Refresh records
        for rec in created_image_records:
            await db.refresh(rec)

        # 5. Link with Conversation Message
        message_id = None
        if conversation_id and created_image_records:
            primary_img = created_image_records[0]
            # Add user prompt message if not present
            user_msg = await ConversationService.add_message(
                db=db,
                conversation_id=conversation_id,
                role="user",
                content=f"/image {request.prompt}",
                extra_metadata={"type": "image_request", "aspect_ratio": request.aspect_ratio, "style": request.style},
            )
            # Add assistant message with image attachment
            assistant_msg = await ConversationService.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=f"Here is the generated image for: **{request.prompt}**",
                model=primary_img.model,
                extra_metadata={
                    "type": "image",
                    "image": {
                        "id": primary_img.id,
                        "url": primary_img.image_url,
                        "prompt": primary_img.prompt,
                        "width": primary_img.width,
                        "height": primary_img.height,
                        "aspect_ratio": primary_img.aspect_ratio,
                        "style": primary_img.style,
                    },
                },
            )
            message_id = assistant_msg.id
            primary_img.message_id = message_id
            await db.commit()

        # 6. Usage Logging
        for rec in created_image_records:
            usage_log = ImageUsageLog(
                user_id=user_id,
                image_id=rec.id,
                provider=rec.provider,
                model=rec.model,
                resolution=f"{rec.width}x{rec.height}",
                number_of_images=1,
                generation_time_ms=duration_ms,
                estimated_cost=0.0,
            )
            db.add(usage_log)
            
            response_images.append(
                ImageItemResponse.model_validate(rec)
            )

        await db.commit()

        return ImageGenerationResponse(
            success=True,
            images=response_images,
            provider=target_provider.provider_name,
            model=created_image_records[0].model if created_image_records else settings.IMAGE_MODEL,
            prompt=request.prompt,
            conversation_id=conversation_id,
            message_id=message_id,
            created_at=created_image_records[0].created_at if created_image_records else None,
        )

    async def list_images(
        self,
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        style: Optional[str] = None,
        provider: Optional[str] = None,
        search_query: Optional[str] = None,
    ) -> ImageListResponse:
        offset = (page - 1) * page_size
        query = select(GeneratedImage).where(GeneratedImage.user_id == user_id)

        if style and style.lower() != "all":
            query = query.where(GeneratedImage.style.ilike(f"%{style.strip()}%"))

        if provider and provider.lower() != "all":
            query = query.where(GeneratedImage.provider == provider.strip().lower())

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.where(
                or_(
                    GeneratedImage.prompt.ilike(term),
                    GeneratedImage.enhanced_prompt.ilike(term),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_stmt)).scalar_one()

        # Fetch records
        stmt = query.order_by(desc(GeneratedImage.created_at)).limit(page_size).offset(offset)
        result = await db.execute(stmt)
        records = list(result.scalars().all())

        return ImageListResponse(
            images=[ImageItemResponse.model_validate(rec) for rec in records],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_image(self, db: AsyncSession, user_id: str, image_id: str) -> ImageItemResponse:
        stmt = select(GeneratedImage).where(GeneratedImage.id == image_id, GeneratedImage.user_id == user_id)
        result = await db.execute(stmt)
        rec = result.scalar_one_or_none()
        if not rec:
            raise NotFoundError("Image")
        return ImageItemResponse.model_validate(rec)

    async def delete_image(self, db: AsyncSession, user_id: str, image_id: str) -> None:
        stmt = select(GeneratedImage).where(GeneratedImage.id == image_id)
        result = await db.execute(stmt)
        rec = result.scalar_one_or_none()
        if not rec:
            raise NotFoundError("Image")
        if rec.user_id != user_id:
            raise AuthorizationError("You do not have permission to delete this image")

        if rec.storage_path:
            await self.storage.delete_image(rec.storage_path)

        await db.delete(rec)
        await db.commit()


image_service = ImageService()
