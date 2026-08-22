from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.schemas.image import ImageGenerationRequest, ImageGenerationResponse
from app.services.image_intent_service import ImageIntentService, IntentType
from app.services.image_service import image_service


class AgentService:
    """
    Multimodal agent orchestrator.
    Routes user requests between Text (Nemotron), Image, and Vision capabilities.
    """

    @classmethod
    def classify_request(cls, message: str) -> Dict[str, Any]:
        return ImageIntentService.detect_intent(message)

    @classmethod
    async def handle_auto_request(
        cls,
        db: AsyncSession,
        user_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        aspect_ratio: Optional[str] = "1:1",
        style: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates user intent and runs the appropriate capability (Text vs Image).
        """
        classification = cls.classify_request(message)
        intent = classification.get("intent")

        if intent == IntentType.IMAGE_GENERATION:
            prompt = classification.get("prompt", message)
            logger.info(f"Auto mode routing to ImageGeneration for prompt: {prompt}")
            gen_req = ImageGenerationRequest(
                prompt=prompt,
                aspect_ratio=aspect_ratio or "1:1",
                style=style,
                conversation_id=conversation_id,
            )
            result = await image_service.generate_images(db=db, user_id=user_id, request=gen_req)
            return {
                "action": "IMAGE_GENERATION",
                "result": result,
            }

        return {
            "action": "TEXT_STREAM",
            "prompt": message,
        }


agent_service = AgentService()
