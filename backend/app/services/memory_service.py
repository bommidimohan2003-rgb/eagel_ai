import json
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundError, AuthorizationError
from app.core.logging import logger
from app.models.memory import Memory
from app.prompts.system_prompt import MEMORY_EXTRACTION_PROMPT
from app.providers.base import AIProvider


class MemoryService:
    @staticmethod
    async def get_memories(
        db: AsyncSession,
        user_id: str,
        category: Optional[str] = None,
        limit: int = 50,
    ) -> List[Memory]:
        query = select(Memory).where(Memory.user_id == user_id)
        if category:
            query = query.where(Memory.category == category)
        query = query.order_by(desc(Memory.importance), desc(Memory.updated_at)).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_memory(
        db: AsyncSession,
        user_id: str,
        content: str,
        category: str = "preference",
        importance: int = 1,
    ) -> Memory:
        memory = Memory(
            user_id=user_id,
            content=content.strip(),
            category=category.strip(),
            importance=importance,
        )
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        return memory

    @staticmethod
    async def update_memory(
        db: AsyncSession,
        memory_id: str,
        user_id: str,
        content: Optional[str] = None,
        category: Optional[str] = None,
        importance: Optional[int] = None,
    ) -> Memory:
        stmt = select(Memory).where(Memory.id == memory_id)
        result = await db.execute(stmt)
        memory = result.scalar_one_or_none()

        if not memory:
            raise NotFoundError("Memory")
        if memory.user_id != user_id:
            raise AuthorizationError("You do not own this memory record")

        if content is not None:
            memory.content = content.strip()
        if category is not None:
            memory.category = category.strip()
        if importance is not None:
            memory.importance = importance

        await db.commit()
        await db.refresh(memory)
        return memory

    @staticmethod
    async def delete_memory(
        db: AsyncSession,
        memory_id: str,
        user_id: str,
    ) -> None:
        stmt = select(Memory).where(Memory.id == memory_id)
        result = await db.execute(stmt)
        memory = result.scalar_one_or_none()

        if not memory:
            raise NotFoundError("Memory")
        if memory.user_id != user_id:
            raise AuthorizationError("You do not own this memory record")

        await db.delete(memory)
        await db.commit()

    @staticmethod
    async def clear_all_memories(
        db: AsyncSession,
        user_id: str,
    ) -> int:
        stmt = select(Memory).where(Memory.user_id == user_id)
        result = await db.execute(stmt)
        memories = result.scalars().all()
        count = len(memories)
        for m in memories:
            await db.delete(m)
        await db.commit()
        return count

    @staticmethod
    async def extract_and_store_memories_async(
        db: AsyncSession,
        provider: AIProvider,
        user_id: str,
        user_message: str,
    ) -> List[Memory]:
        """
        Background task to extract durable facts from user message.
        """
        if len(user_message.strip()) < 15:
            return []

        try:
            prompt_messages = [
                {"role": "system", "content": MEMORY_EXTRACTION_PROMPT},
                {"role": "user", "content": user_message},
            ]
            response = await provider.generate_response(
                messages=prompt_messages,
                temperature=0.1,
                max_tokens=300,
            )
            raw_text = response.get("content", "").strip()
            
            # Find JSON array in output
            start_idx = raw_text.find("[")
            end_idx = raw_text.rfind("]")
            if start_idx != -1 and end_idx != -1:
                json_str = raw_text[start_idx : end_idx + 1]
                extracted = json.loads(json_str)
                stored_memories: List[Memory] = []
                for item in extracted:
                    if isinstance(item, dict) and "content" in item:
                        mem = await MemoryService.create_memory(
                            db=db,
                            user_id=user_id,
                            content=item.get("content", ""),
                            category=item.get("category", "preference"),
                            importance=int(item.get("importance", 1)),
                        )
                        stored_memories.append(mem)
                return stored_memories
        except Exception as exc:
            logger.debug(f"Memory extraction skipped or failed: {str(exc)}")
        return []
