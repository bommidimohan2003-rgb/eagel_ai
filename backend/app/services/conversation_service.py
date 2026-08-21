from typing import List, Optional, Tuple
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.exceptions import NotFoundError, AuthorizationError
from app.models.conversation import Conversation
from app.models.message import Message


class ConversationService:
    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        user_id: str,
        title: Optional[str] = None,
    ) -> Conversation:
        conversation = Conversation(
            user_id=user_id,
            title=title or "New Conversation",
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: str,
        user_id: str,
    ) -> Conversation:
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise NotFoundError("Conversation")
        if conversation.user_id != user_id:
            raise AuthorizationError("You do not have access to this conversation")

        return conversation

    @staticmethod
    async def list_conversations(
        db: AsyncSession,
        user_id: str,
        search_query: Optional[str] = None,
        is_archived: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Conversation], int]:
        query = select(Conversation).where(
            Conversation.user_id == user_id,
            Conversation.is_archived == is_archived,
        )

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            # Join with messages to allow searching in both title and message contents
            query = (
                query.outerjoin(Message, Conversation.id == Message.conversation_id)
                .where(or_(Conversation.title.ilike(term), Message.content.ilike(term)))
                .distinct()
            )

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        total_count = (await db.execute(count_stmt)).scalar_one()

        # Order by pinned first, then updated_at descending
        stmt = (
            query.order_by(desc(Conversation.is_pinned), desc(Conversation.updated_at))
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        conversations = list(result.scalars().all())

        return conversations, total_count

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        conversation_id: str,
        user_id: str,
        title: Optional[str] = None,
        is_archived: Optional[bool] = None,
        is_pinned: Optional[bool] = None,
    ) -> Conversation:
        conversation = await ConversationService.get_conversation(db, conversation_id, user_id)

        if title is not None:
            conversation.title = title.strip()
        if is_archived is not None:
            conversation.is_archived = is_archived
        if is_pinned is not None:
            conversation.is_pinned = is_pinned

        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def delete_conversation(
        db: AsyncSession,
        conversation_id: str,
        user_id: str,
    ) -> None:
        conversation = await ConversationService.get_conversation(db, conversation_id, user_id)
        await db.delete(conversation)
        await db.commit()

    @staticmethod
    async def add_message(
        db: AsyncSession,
        conversation_id: str,
        role: str,
        content: str,
        model: Optional[str] = None,
        token_usage: Optional[dict] = None,
        extra_metadata: Optional[dict] = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            model=model,
            token_usage=token_usage,
            extra_metadata=extra_metadata,
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message

    @staticmethod
    async def get_messages(
        db: AsyncSession,
        conversation_id: str,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Message]:
        # Validate conversation ownership
        await ConversationService.get_conversation(db, conversation_id, user_id)

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
