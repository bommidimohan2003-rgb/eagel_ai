from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatStreamRequest,
    GenerateTitleRequest,
    GenerateTitleResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/chat", tags=["Chat & Streaming"])
ai_service = AIService()


@router.post("/stream")
async def chat_stream(
    request: ChatStreamRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Server-Sent Events (SSE) Streaming endpoint.
    Emits typed events: 'start', 'text_delta', 'thinking_delta', 'message_id', 'title', 'done', 'error'.
    """
    event_generator = ai_service.stream_chat(
        db=db,
        user_id=current_user.id,
        user_message=request.message,
        conversation_id=request.conversation_id,
        model=request.model,
        temperature=request.temperature,
        top_p=request.top_p,
        max_tokens=request.max_tokens,
        system_prompt=request.system_prompt,
        enable_memory=request.enable_memory,
        enable_web_search=request.enable_web_search,
        file_ids=request.file_ids,
    )

    return StreamingResponse(
        event_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/generate-title", response_model=GenerateTitleResponse)
async def generate_title(
    request: GenerateTitleRequest,
    current_user: User = Depends(get_current_user),
):
    title = await ai_service.generate_title(request.first_message)
    return GenerateTitleResponse(title=title)
