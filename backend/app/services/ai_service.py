import json
import time
from typing import AsyncGenerator, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.logging import logger
from app.models.conversation import Conversation
from app.models.file import File
from app.models.usage_log import UsageLog
from app.models.user_settings import UserSettings
from app.prompts.system_prompt import TITLE_GENERATION_PROMPT
from app.providers.base import AIProvider
from app.providers.nvidia import NVIDIAProvider
from app.services.context_builder import ContextBuilder
from app.services.conversation_service import ConversationService
from app.services.memory_service import MemoryService
from app.services.tool_service import tool_service


class AIService:
    """
    Central AI orchestration service.
    Coordinates providers, streaming SSE pipelines, context assembly, title generation, and usage logging.
    """

    def __init__(self, provider: Optional[AIProvider] = None):
        self.provider = provider or NVIDIAProvider()
        self.context_builder = ContextBuilder(max_history_messages=20)

    async def stream_chat(
        self,
        db: AsyncSession,
        user_id: str,
        user_message: str,
        conversation_id: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
        enable_memory: Optional[bool] = None,
        enable_web_search: Optional[bool] = None,
        file_ids: Optional[List[str]] = None,
    ) -> AsyncGenerator[str, None]:
        # 1. Ensure conversation exists
        is_new_conversation = False
        if not conversation_id:
            conv = await ConversationService.create_conversation(db, user_id=user_id, title="New Conversation")
            conversation_id = conv.id
            is_new_conversation = True
        else:
            conv = await ConversationService.get_conversation(db, conversation_id, user_id)

        # 2. Fetch User Settings
        settings_stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        settings_res = await db.execute(settings_stmt)
        user_settings = settings_res.scalar_one_or_none()

        # 3. Save incoming user message
        await ConversationService.add_message(
            db=db,
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )

        # Emit conversation ID to client
        yield f"data: {json.dumps({'event': 'conversation_id', 'data': conversation_id})}\n\n"

        # 4. Fetch Memories if enabled
        memories = []
        mem_enabled = enable_memory if enable_memory is not None else (user_settings.memory_enabled if user_settings else True)
        if mem_enabled:
            memories = await MemoryService.get_memories(db, user_id, limit=15)

        # 5. Fetch Attached Files if specified
        files = []
        if file_ids:
            file_stmt = select(File).where(File.id.in_(file_ids), File.user_id == user_id)
            file_res = await db.execute(file_stmt)
            files = list(file_res.scalars().all())

        # 6. Retrieve recent message history
        history = await ConversationService.get_messages(db, conversation_id, user_id, limit=30)

        # 7. Assemble Context
        context_messages = self.context_builder.build_context(
            current_message=user_message,
            history=history[:-1] if history else [],  # exclude just saved message to avoid duplication
            settings=user_settings,
            memories=memories,
            files=files,
            system_prompt_override=system_prompt,
        )

        # Resolve hyperparameters
        active_model = model or (user_settings.model_name if user_settings else settings.NVIDIA_MODEL)
        active_temp = temperature if temperature is not None else (user_settings.temperature if user_settings else settings.DEFAULT_TEMPERATURE)
        active_top_p = top_p if top_p is not None else (user_settings.top_p if user_settings else settings.DEFAULT_TOP_P)
        active_max_tokens = max_tokens if max_tokens is not None else (user_settings.max_tokens if user_settings else settings.DEFAULT_MAX_TOKENS)

        full_assistant_reply = ""
        total_prompt_tokens = 0
        total_completion_tokens = 0

        yield f"data: {json.dumps({'event': 'start', 'data': {'model': active_model}})}\n\n"

        try:
            async for chunk in self.provider.stream_response(
                messages=context_messages,
                model=active_model,
                temperature=active_temp,
                top_p=active_top_p,
                max_tokens=active_max_tokens,
            ):
                chunk_type = chunk.get("type")
                if chunk_type == "text_delta":
                    delta_text = chunk.get("content", "")
                    full_assistant_reply += delta_text
                    yield f"data: {json.dumps({'event': 'text_delta', 'data': delta_text})}\n\n"

                elif chunk_type == "thinking_delta":
                    thinking_text = chunk.get("content", "")
                    yield f"data: {json.dumps({'event': 'thinking_delta', 'data': thinking_text})}\n\n"

                elif chunk_type == "usage":
                    usage = chunk.get("usage", {})
                    total_prompt_tokens = usage.get("prompt_tokens", 0)
                    total_completion_tokens = usage.get("completion_tokens", 0)

                elif chunk_type == "error":
                    err_msg = chunk.get("content", "Stream error occurred")
                    yield f"data: {json.dumps({'event': 'error', 'data': err_msg})}\n\n"

        except Exception as exc:
            logger.error(f"Error during stream generation: {str(exc)}", exc_info=True)
            yield f"data: {json.dumps({'event': 'error', 'data': f'Generation interrupted: {str(exc)}'})}\n\n"

        # 8. Save Assistant Message in Database
        if full_assistant_reply.strip():
            assistant_msg = await ConversationService.add_message(
                db=db,
                conversation_id=conversation_id,
                role="assistant",
                content=full_assistant_reply,
                model=active_model,
                token_usage={
                    "prompt_tokens": total_prompt_tokens,
                    "completion_tokens": total_completion_tokens,
                    "total_tokens": total_prompt_tokens + total_completion_tokens,
                },
            )
            yield f"data: {json.dumps({'event': 'message_id', 'data': assistant_msg.id})}\n\n"

            # Log usage
            usage_log = UsageLog(
                user_id=user_id,
                conversation_id=conversation_id,
                model=active_model,
                prompt_tokens=total_prompt_tokens,
                completion_tokens=total_completion_tokens,
                total_tokens=total_prompt_tokens + total_completion_tokens,
            )
            db.add(usage_log)
            await db.commit()

        # 9. Auto-Generate Conversation Title if new conversation
        if is_new_conversation:
            try:
                title = await self.generate_title(user_message)
                if title:
                    await ConversationService.update_conversation(
                        db=db, conversation_id=conversation_id, user_id=user_id, title=title
                    )
                    yield f"data: {json.dumps({'event': 'title', 'data': title})}\n\n"
            except Exception as e:
                logger.debug(f"Auto title generation failed: {e}")

        # 10. Extract memory asynchronously in background if enabled
        if mem_enabled:
            try:
                await MemoryService.extract_and_store_memories_async(
                    db=db, provider=self.provider, user_id=user_id, user_message=user_message
                )
            except Exception as e:
                logger.debug(f"Memory extraction skipped: {e}")

        yield f"data: {json.dumps({'event': 'done', 'data': {'conversation_id': conversation_id}})}\n\n"

    async def generate_title(self, first_message: str) -> str:
        if not first_message or len(first_message.strip()) == 0:
            return "New Conversation"

        # Fast fallback for very short messages
        words = first_message.strip().split()
        if len(words) <= 4:
            return first_message.strip().capitalize()

        try:
            prompt_msgs = [
                {"role": "system", "content": TITLE_GENERATION_PROMPT},
                {"role": "user", "content": first_message[:300]},
            ]
            res = await self.provider.generate_response(
                messages=prompt_msgs,
                temperature=0.3,
                max_tokens=20,
            )
            title = res.get("content", "").strip().strip('"\'')
            if title:
                return title[:50]
        except Exception as e:
            logger.debug(f"Could not generate title with AI: {e}")

        # Fallback to first 5 words
        return " ".join(words[:4]).capitalize()
