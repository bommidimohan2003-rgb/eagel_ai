from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.conversation import Conversation
    from app.models.message import Message


class GeneratedImage(Base, TimestampMixin):
    __tablename__ = "generated_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="SET NULL"), index=True, nullable=True)
    message_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), index=True, nullable=True)

    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    enhanced_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    provider: Mapped[str] = mapped_column(String(50), default="pollinations", nullable=False)
    model: Mapped[str] = mapped_column(String(100), default="flux", nullable=False)

    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    width: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    height: Mapped[int] = mapped_column(Integer, default=1024, nullable=False)
    aspect_ratio: Mapped[str] = mapped_column(String(20), default="1:1", nullable=False)
    style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    quality: Mapped[Optional[str]] = mapped_column(String(20), default="standard", nullable=True)

    generation_status: Mapped[str] = mapped_column(String(20), default="COMPLETED", nullable=False)  # PENDING, PROCESSING, COMPLETED, FAILED
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="generated_images")
    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation", backref="generated_images")
    message: Mapped[Optional["Message"]] = relationship("Message", backref="generated_image")
